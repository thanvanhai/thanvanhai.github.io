---
id: smart-camera-phan-1-backend-dotnet
title: "Xây Dựng Hệ Thống Camera Thông Minh - Phần 1: \"Bộ Não\" Backend Với .NET 8"
sidebar_label: "Phần 1: Backend .NET 8"
sidebar_position: 2
tags: [dotnet, csharp, webapi, rabbitmq, smart-camera, backend, entity-framework]
---

Chào mừng bạn đến với series hướng dẫn xây dựng một hệ thống camera giám sát thông minh từ A-Z! Trong thế giới hiện đại, việc tích hợp AI vào camera an ninh không còn là điều xa vời. Hệ thống của chúng ta có thể tự động phát hiện chuyển động, nhận diện khuôn mặt, và gửi cảnh báo real-time.

![Tổng quan hệ thống Smart Camera](https://github.com/thanvanhai/SmartCamera.WebApiDemo/blob/master/SmartCamera.WebApiDemo/Image/Screenshot%202025-09-13%20091453.png?raw=true)

Series này sẽ gồm 3 phần chính:

- **Phần 1: Backend (.NET 8 Web API)** - Trái tim của hệ thống, quản lý camera và giao tiếp với các thành phần khác. (Bài viết này)
- **Phần 2: AI Service (Python)** - "Đôi mắt" thông minh, xử lý video stream và phát hiện sự kiện.
- **Phần 3: Frontend (React)** - Giao diện người dùng, hiển thị dashboard và các cảnh báo thời gian thực.

Hãy cùng bắt đầu với phần quan trọng nhất: xây dựng "bộ não" backend cho dự án.

## 🎯 Mục Tiêu Của Backend

Backend của chúng ta sẽ đóng vai trò trung tâm, chịu trách nhiệm cho các công việc sau:

1. **Quản lý Camera (CRUD):** Cung cấp các API để thêm, sửa, xóa và lấy thông tin camera.
2. **Giao tiếp qua Message Queue:** Sử dụng RabbitMQ để "thông báo" cho các service khác (đặc biệt là AI Service) khi có một camera mới được đăng ký hoặc cập nhật. Đây là mấu chốt của một kiến trúc hướng sự kiện (Event-Driven), giúp hệ thống linh hoạt và dễ mở rộng.
3. **Cung cấp dữ liệu:** Đưa ra các API để frontend có thể truy vấn trạng thái, thống kê và lấy URL video stream.
4. **Lưu trữ:** Tương tác với cơ sở dữ liệu (ví dụ: PostgreSQL, SQL Server) thông qua Entity Framework Core.

## 🏗️ Cấu Trúc Và Thiết Kế

Để đảm bảo code sạch sẽ và dễ bảo trì, chúng ta sẽ tuân theo một cấu trúc project rõ ràng:

- **`Models`**: Định nghĩa các thực thể (Entity) tương ứng với bảng trong database. Ví dụ: `Camera.cs`.
- **`Data`**: Chứa `AppDbContext` của Entity Framework Core để làm việc với CSDL.
- **`DTOs` (Data Transfer Objects)**: Các lớp dùng để truyền dữ liệu giữa client và server, giúp che giấu cấu trúc model nội bộ. Ví dụ: `CameraDto`, `CreateCameraRequest`.
- **`Services`**: Tầng xử lý logic nghiệp vụ chính. Đây là nơi chúng ta sẽ đặt `CameraService`.
- **`Controllers`**: Tầng API, tiếp nhận request từ client, gọi đến `Services` và trả về response.
- **`Messaging`**: Chứa các interface và implementation cho việc gửi message, ví dụ `IMessageProducer` cho RabbitMQ.

## `CameraService.cs`: Trái Tim Của Logic

```csharp
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SmartCamera.WebApiDemo.Data;
using SmartCamera.WebApiDemo.DTOs;
using SmartCamera.WebApiDemo.Models;
using SmartCamera.WebApiDemo.Services;
using SmartCamera.WebApiDemo.Messaging; // Namespace chứa IMessageProducer
using System.Net.NetworkInformation;

namespace SmartCamera.WebApi.Services
{
    public class CameraService : ICameraService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CameraService> _logger;
        private readonly IMessageProducer _producer;

        public CameraService(
            AppDbContext context,
            IMapper mapper,
            ILogger<CameraService> logger,
            IMessageProducer producer)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _producer = producer;
        }

        public async Task<IEnumerable<CameraDto>> GetAllCamerasAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var cameras = await _context.Cameras
                    .OrderBy(c => c.Name)
                    .ToListAsync(cancellationToken);

                return _mapper.Map<IEnumerable<CameraDto>>(cameras);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all cameras");
                throw;
            }
        }

        public async Task<CameraDto?> GetCameraByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var camera = await _context.Cameras.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
                return camera != null ? _mapper.Map<CameraDto>(camera) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting camera with id {Id}", id);
                throw;
            }
        }

        public async Task<CameraDto> CreateCameraAsync(CreateCameraRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                var existingCamera = await _context.Cameras
                    .FirstOrDefaultAsync(c => c.IpAddress == request.IpAddress, cancellationToken);

                if (existingCamera != null)
                    throw new InvalidOperationException($"Camera with IP {request.IpAddress} already exists");

                var camera = new Camera
                {
                    Name = request.Name,
                    IpAddress = request.IpAddress,
                    Port = request.Port,
                    Username = request.Username,
                    Password = request.Password,
                    Location = request.Location,
                    Description = request.Description,
                    Type = request.Type,
                    // Nếu request.StreamUrl có thì lấy, không thì tự generate
                    StreamUrl = string.IsNullOrWhiteSpace(request.StreamUrl)
                    ? GenerateStreamUrl(request.IpAddress, request.Port, request.Username, request.Password)
                    : request.StreamUrl,
                    Status = CameraStatus.Offline,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Cameras.Add(camera);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created new camera: {Name} with IP: {IP}", request.Name, request.IpAddress);

                // Publish event camera.registered
                await _producer.PublishAsync("smartcamera", "camera.registered", new
                {
                    id = camera.Id,
                    name = camera.Name,
                    rtsp_url = camera.StreamUrl,
                    location = camera.Location,
                    created_at = camera.CreatedAt
                }, cancellationToken);

                return _mapper.Map<CameraDto>(camera);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating camera");
                throw;
            }
        }

        public async Task<CameraDto?> UpdateCameraAsync(int id, UpdateCameraRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                var camera = await _context.Cameras.FindAsync(new object?[] { id }, cancellationToken);
                if (camera == null) return null;

                camera.Name = request.Name;
                camera.Location = request.Location;
                camera.Description = request.Description;
                camera.IsActive = request.IsActive;
                camera.RecordingEnabled = request.RecordingEnabled;
                camera.MotionDetectionEnabled = request.MotionDetectionEnabled;
                camera.FaceRecognitionEnabled = request.FaceRecognitionEnabled;
                camera.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Updated camera: {Name} (ID: {Id})", camera.Name, id);

                // Publish event camera.updated
                await _producer.PublishAsync("smartcamera", "camera.updated", new
                {
                    id = camera.Id,
                    name = camera.Name,
                    location = camera.Location,
                    updated_at = camera.UpdatedAt
                }, cancellationToken);

                return _mapper.Map<CameraDto>(camera);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating camera with id {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteCameraAsync(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var camera = await _context.Cameras.FindAsync(new object?[] { id }, cancellationToken);
                if (camera == null) return false;

                _context.Cameras.Remove(camera);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Deleted camera: {Name} (ID: {Id})", camera.Name, id);

                // Publish event camera.deleted
                await _producer.PublishAsync("smartcamera", "camera.deleted", new
                {
                    id = id,
                    deleted_at = DateTime.UtcNow
                }, cancellationToken);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting camera with id {Id}", id);
                throw;
            }
        }

        public async Task<bool> TestCameraConnectionAsync(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var camera = await _context.Cameras.FindAsync(new object?[] { id }, cancellationToken);
                if (camera == null) return false;

                using var ping = new Ping();
                var reply = await ping.SendPingAsync(camera.IpAddress, 5000);
                var isOnline = reply.Status == IPStatus.Success;

                camera.Status = isOnline ? CameraStatus.Online : CameraStatus.Offline;
                camera.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Camera {Name} connection test: {Status}",
                    camera.Name, isOnline ? "Success" : "Failed");

                // Publish event camera.status.updated
                await _producer.PublishAsync("smartcamera", "camera.status.updated", new
                {
                    id = camera.Id,
                    status = camera.Status.ToString().ToLower(),
                    updated_at = camera.UpdatedAt
                }, cancellationToken);

                return isOnline;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing camera connection for id {Id}", id);
                return false;
            }
        }

        public async Task<string> GetStreamUrlAsync(int id, string quality = "HD", CancellationToken cancellationToken = default)
        {
            try
            {
                var camera = await _context.Cameras.FindAsync(new object?[] { id }, cancellationToken);
                if (camera == null) return string.Empty;

                var baseUrl = camera.StreamUrl;
                return quality.ToUpper() switch
                {
                    "SD" => $"{baseUrl}?resolution=640x480",
                    "HD" => $"{baseUrl}?resolution=1280x720",
                    "FHD" => $"{baseUrl}?resolution=1920x1080",
                    _ => baseUrl
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stream URL for camera id {Id}", id);
                return string.Empty;
            }
        }

        public async Task<IEnumerable<CameraDto>> GetCamerasByLocationAsync(string location, CancellationToken cancellationToken = default)
        {
            try
            {
                var cameras = await _context.Cameras
                    .Where(c => c.Location.Contains(location) && c.IsActive)
                    .OrderBy(c => c.Name)
                    .ToListAsync(cancellationToken);

                return _mapper.Map<IEnumerable<CameraDto>>(cameras);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cameras by location: {Location}", location);
                throw;
            }
        }

        public async Task<bool> UpdateCameraStatusAsync(int id, CameraStatus status, CancellationToken cancellationToken = default)
        {
            try
            {
                var camera = await _context.Cameras.FindAsync(new object?[] { id }, cancellationToken);
                if (camera == null) return false;

                camera.Status = status;
                camera.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Updated camera {Name} status to {Status}", camera.Name, status);

                // Publish event camera.status.updated
                await _producer.PublishAsync("smartcamera", "camera.status.updated", new
                {
                    id = camera.Id,
                    status = status.ToString().ToLower(),
                    updated_at = camera.UpdatedAt
                }, cancellationToken);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating camera status for id {Id}", id);
                return false;
            }
        }

        public async Task<Dictionary<string, object>> GetCameraStatsAsync(int id, CancellationToken cancellationToken = default)
        {
            try
            {
                var camera = await _context.Cameras
                    .Include(c => c.Events)
                    .Include(c => c.Recordings)
                    .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

                if (camera == null)
                    return new Dictionary<string, object>();

                var today = DateTime.UtcNow.Date;
                var thisWeek = DateTime.UtcNow.AddDays(-7);

                return new Dictionary<string, object>
                {
                    { "total_events", camera.Events.Count },
                    { "events_today", camera.Events.Count(e => e.Timestamp.Date == today) },
                    { "events_this_week", camera.Events.Count(e => e.Timestamp >= thisWeek) },
                    { "total_recordings", camera.Recordings.Count },
                    { "recordings_today", camera.Recordings.Count(r => r.StartTime.Date == today) },
                    { "total_storage_gb", Math.Round(camera.Recordings.Sum(r => r.FileSizeBytes) / (1024.0 * 1024 * 1024), 2) },
                    { "status", camera.Status.ToString().ToLower() },
                    { "uptime", camera.Status == CameraStatus.Online ? "online" : "offline" }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting camera stats for id {Id}", id);
                return new Dictionary<string, object>();
            }
        }

        private static string GenerateStreamUrl(string ip, int port, string username, string password)
        {
            if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            {
                return $"rtsp://{username}:{password}@{ip}:{port}/stream1";
            }
            return $"rtsp://{ip}:{port}/stream1";
        }
    }
}
```

![Kết quả test API CameraService](https://github.com/thanvanhai/SmartCamera.WebApiDemo/blob/master/SmartCamera.WebApiDemo/Image/Screenshot%202025-09-08%20151234.png?raw=true)

## Link Source

Github module Camera: [https://github.com/thanvanhai/SmartCamera.WebApiDemo](https://github.com/thanvanhai/SmartCamera.WebApiDemo)

---

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
