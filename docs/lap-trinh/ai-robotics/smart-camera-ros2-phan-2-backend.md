---
id: smart-camera-ros2-phan-2-backend
title: "Xây Dựng Hệ Thống Smart Camera Với ROS 2 - Phần 2: Xây Dựng Backend"
sidebar_label: "ROS 2 - Phần 2: Backend"
slug: /lap-trinh/ai-robotics/smart-camera-ros2-phan-2-backend
sidebar_position: 8
date: 2025-08-22
tags: [ros2, python, fastapi, rabbitmq, smart-camera, backend, postgresql]
---

Camera (RTSP) --> 🎯 ROS 2 Node (YOLO, tracking, AI) --> 📡 ROS 2 Topic → Bridge → MQ (Kafka/RabbitMQ/MQTT) --> 🧠 FastAPI Backend ←→ Database --> 👀 Frontend (Dashboard, Alerts, Report)

## Kiến Trúc Backend System

```
smart_camera_backend/
├── docker-compose.yml          # Thiết lập hạ tầng
├── requirements.txt            # Các thư viện Python phụ thuộc
├── .env.example                # File mẫu cho các biến môi trường
├── .gitignore
├── README.md
│
├── app/
│   ├── __init__.py
│   ├── main.py                 # Điểm khởi chạy ứng dụng FastAPI
│   ├── config.py               # Quản lý cấu hình
│   │
│   ├── core/                   # Logic nghiệp vụ cốt lõi
│   │   ├── __init__.py
│   │   ├── security.py         # Xác thực & phân quyền
│   │   ├── database.py         # Kết nối & các model cơ sở dữ liệu
│   │   └── rabbitmq.py         # Kết nối & consumer của RabbitMQ
│   │
│   ├── models/                 # Các model cơ sở dữ liệu
│   │   ├── __init__.py
│   │   ├── camera.py           # Model của Camera
│   │   ├── detection.py        # Model của kết quả nhận dạng
│   │   ├── tracking.py         # Model của dữ liệu theo dõi
│   │   └── face_recognition.py # Model của nhận dạng khuôn mặt
│   │
│   ├── schemas/                # Các schema Pydantic (hợp đồng API)
│   │   ├── __init__.py
│   │   ├── camera.py
│   │   ├── detection.py
│   │   ├── tracking.py
│   │   └── face_recognition.py
│   │
│   ├── api/                    # Các route (đường dẫn) API
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── cameras.py      # Các endpoint quản lý Camera
│   │   │   ├── detections.py   # Các endpoint kết quả nhận dạng
│   │   │   ├── tracking.py     # Các endpoint dữ liệu theo dõi
│   │   │   ├── analytics.py    # Phân tích & thống kê
│   │   │   └── websocket.py    # WebSocket thời gian thực
│   │   └── deps.py             # Các dependency của API
│   │
│   ├── services/               # Các service xử lý nghiệp vụ
│   │   ├── __init__.py
│   │   ├── camera_service.py
│   │   ├── detection_service.py
│   │   ├── tracking_service.py
│   │   ├── analytics_service.py
│   │   └── notification_service.py
│   │
│   └── workers/                # Các tiến trình chạy nền
│       ├── __init__.py
│       ├── rabbitmq_consumer.py# Xử lý dữ liệu từ ROS2
│       ├── data_processor.py   # Xử lý dữ liệu nhận dạng
│       └── cleanup_worker.py   # Dọn dẹp dữ liệu cũ
│
├── alembic/                    # Quản lý các phiên bản thay đổi của cơ sở dữ liệu
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── tests/                      # Các file kiểm thử
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api/
│   ├── test_services/
│   └── test_workers/
│
└── scripts/                    # Các script tiện ích
    ├── init_db.py
    ├── seed_data.py
    └── start_workers.py
```

## 🛠️ Công Nghệ (Technology Stack)

**Framework Cốt lõi:**
- **FastAPI**: Framework web hiện đại, tốc độ cao để xây dựng API.
- **SQLAlchemy**: ORM (Object-Relational Mapping) để thao tác với cơ sở dữ liệu.
- **Alembic**: Công cụ quản lý phiên bản thay đổi của cơ sở dữ liệu (migration).
- **Pydantic**: Thư viện để xác thực và tuần tự hóa (serialization) dữ liệu.

**Cơ sở dữ liệu:**
- **PostgreSQL**: Cơ sở dữ liệu chính cho dữ liệu có cấu trúc.
- **Redis**: Dùng để caching (lưu trữ đệm) và lưu trữ phiên (session).
- **TimescaleDB**: Dùng cho dữ liệu chuỗi thời gian (time-series) để phân tích.

**Hàng đợi Tin nhắn (Message Queue):**
- **RabbitMQ**: Nhận dữ liệu từ ROS2 Bridge.
- **Celery**: Xử lý tác vụ chạy nền (tùy chọn).

## Sơ Đồ Luồng Xử Lý Camera

1. **Frontend gửi request** → **API Layer** (`app/api/v1/cameras.py`)
   - Nhận lệnh tạo/xóa camera từ client.
   - Chuyển request xuống service layer.

2. **Service Layer** (`app/services/camera_service.py`)
   - Xử lý logic liên quan đến camera.
   - Gọi `RabbitMQService` (`app/services/rabbitmq_service.py`) để publish sự kiện camera (tạo/xóa) lên RabbitMQ.
   - Tương tác với **Database** (`app/models/camera.py`) để lưu thông tin camera.

3. **RabbitMQ Layer** (`app/services/rabbitmq_service.py`)
   - Nhận sự kiện từ `CameraService`.
   - Đẩy thông tin camera/detections cho các consumer khác (ví dụ ROS bridge, live dashboard).

4. **Database Layer** (`app/models/camera.py`)
   - ORM quản lý bảng `cameras`.
   - Lưu trữ thông tin camera: `camera_id`, `name`, `stream_url`, `status`, …

5. **Schemas** (`app/schemas/camera.py`)
   - Xác thực và serialize dữ liệu request/response giữa API và Service.

## Kịch Bản Test Thử Luồng 1: API → ROS (Tạo Camera)

### Bước 1: Kiểm tra và khởi chạy RabbitMQ Server

```bash
# Cách kiểm tra RabbitMQ Server chạy chưa? (trên Linux/WSL):
sudo systemctl status rabbitmq-server

# Cách khởi chạy (nếu chưa chạy):
sudo systemctl start rabbitmq-server
```

![RabbitMQ Server Status](https://github.com/thanvanhai/smart_camera_backend/blob/main/image/Screenshot%202025-08-21%20161738.png?raw=true)

### Bước 2: Khởi chạy các Node ROS 2

```bash
# Terminal 1 - Chạy dynamic_camera_node:
source install/setup.bash
ros2 run smart_camera_source dynamic_camera_node

# Terminal 2 - Chạy bridge_node
source install/setup.bash
ros2 run smart_camera_bridge bridge_node
```

### Bước 3: Gửi yêu cầu tạo Camera qua API

```bash
# Chạy backend API:
cd ~/smart_camera_backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Sử dụng giao diện Swagger UI (hoặc Postman/curl) để gửi một yêu cầu `POST` đến endpoint `/api/v1/cameras/cameras/` nhằm tạo một camera mới.

![Tạo Camera qua API](https://github.com/thanvanhai/smart_camera_backend/blob/main/image/Screenshot%202025-08-22%20115726.png?raw=true)

Sau đó sang ROS kiểm tra. Ở Terminal chạy `dynamic_camera_node`:

![Kiểm tra dynamic_camera_node](https://github.com/thanvanhai/smart_camera_backend/blob/main/image/Screenshot%202025-08-22%20115648.png?raw=true)

Và Terminal chạy `bridge_node`:

![Kiểm tra bridge_node](https://github.com/thanvanhai/smart_camera_backend/blob/main/image/Screenshot%202025-08-22%20115707.png?raw=true)

## Kịch Bản Test Thử Luồng 2: ROS → API (Dữ Liệu Camera / Detect)

Chạy các node của package **`smart_camera_processor`**:

```bash
# Terminal 1 - Chạy node Detections:
source install/setup.bash
ros2 run smart_camera_processor yolo_node

# Terminal 2 - Chạy node Tracking
source install/setup.bash
ros2 run smart_camera_processor tracking_node

# Terminal 3 - Chạy node Recognition
source install/setup.bash
ros2 run smart_camera_processor face_recog_node

# Terminal 2 - Chạy bridge_node có thể vẫn giữ khi test ở luồng 1
source install/setup.bash
ros2 run smart_camera_bridge bridge_node
```

![Chạy các node processor](https://github.com/thanvanhai/smart_camera_backend/blob/main/image/Screenshot%202025-08-22%20150749.png?raw=true)

![Kết quả detections trên RabbitMQ](https://github.com/thanvanhai/smart_camera_backend/blob/main/image/Screenshot%202025-08-22%20151754.png?raw=true)

Hiện tại, dữ liệu `detections` từ ROS đã được đưa vào RabbitMQ thành công, sẵn sàng cho các bước tiếp theo. Tiếp theo sẽ dựng nhanh một frontend để xem **live stream** quá trình detections.

## Link Source

Github: [https://github.com/thanvanhai/smart_camera_backend](https://github.com/thanvanhai/smart_camera_backend)

---

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
