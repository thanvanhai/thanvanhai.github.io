---
title: "Xây Dựng Hệ Thống Smart Camera Với ROS 2 - Phần 1: Xây Dựng Nền Tảng ROS 2"
date: 2026-07-20 10:00:00 +0700
categories: [Lập trình, AI-Robotics]
tags: [ros2, python, yolo, smart-camera, robotics, colcon]
author: haicoi
---

**Phần 1 (Bài viết này): Xây dựng nền tảng ROS 2.** Chúng ta sẽ thiết lập toàn bộ pipeline xử lý hình ảnh, từ việc nhận luồng video, xử lý AI, cho đến việc gửi dữ liệu đi.

**Phần 2: Xây dựng Backend.** Dữ liệu từ ROS 2 sẽ được đẩy vào một hệ thống message queue (như Kafka) và lưu trữ vào cơ sở dữ liệu để xử lý và truy vấn sau này.

**Phần 3: Xây dựng Frontend.** Chúng ta sẽ tạo một giao diện web để người dùng có thể quản lý camera, xem luồng video trực tiếp và các kết quả phân tích AI.

## Bước 1: Tổng quan về Kiến trúc ROS 2

Trước khi viết code, hãy cùng nhìn vào kiến trúc tổng thể của workspace `smart_camera_ws`. Việc chia nhỏ dự án thành các package độc lập giúp chúng ta dễ dàng quản lý, bảo trì và tái sử dụng.

Đây là cấu trúc thư mục của chúng ta:

```
smart_camera_ws/
└─ src/
   ├─ smart_camera_interfaces/  # "Ngôn ngữ chung" của hệ thống
   ├─ smart_camera_source/      # "Đôi mắt" - Nhận tín hiệu camera
   ├─ smart_camera_processor/   # "Bộ não" - Xử lý AI
   └─ smart_camera_bridge/      # "Sứ giả" - Gửi dữ liệu ra ngoài
```

**Vai trò của từng package:**

1. **`smart_camera_interfaces`**: Đây là package quan trọng nhất, định nghĩa "ngôn ngữ" mà các node khác sẽ dùng để giao tiếp. Nó chứa các định dạng message và service tùy chỉnh (ví dụ: service để thêm/xóa camera).

2. **`smart_camera_source`**: "Đôi mắt" của hệ thống. Package này chứa các node chịu trách nhiệm kết nối tới các luồng camera (ví dụ: RTSP), lấy hình ảnh và publish chúng vào các topic của ROS 2.

3. **`smart_camera_processor`**: "Bộ não" xử lý. Các node trong đây sẽ subscribe (lắng nghe) các topic hình ảnh, áp dụng các mô hình AI (YOLO, nhận diện khuôn mặt, tracking) và publish kết quả phân tích ra các topic khác.

4. **`smart_camera_bridge`**: "Sứ giả" giao tiếp với thế giới bên ngoài. Node này sẽ lắng nghe các topic chứa kết quả AI và gửi chúng đến hệ thống backend (sẽ được xây dựng ở Phần 2).

## Bước 2: Khởi tạo Workspace và các Package

Bây giờ, hãy bắt tay vào việc tạo ra cấu trúc này. Mở terminal của bạn và thực hiện các lệnh sau:

```bash
# Tạo thư mục workspace và thư mục src
mkdir -p ~/smart_camera_ws/src
cd ~/smart_camera_ws/src

# Tạo các package với kiểu build tương ứng
# 1. Interfaces (dùng Cmake)
ros2 pkg create --build-type ament_cmake smart_camera_interfaces

# 2. Source (dùng Python)
ros2 pkg create --build-type ament_python smart_camera_source

# 3. Processor (dùng Python)
ros2 pkg create --build-type ament_python smart_camera_processor

# 4. Bridge (dùng Python)
ros2 pkg create --build-type ament_python smart_camera_bridge
```

## Bước 3: Định nghĩa "Ngôn ngữ chung" (`smart_camera_interfaces`)

**1. Tạo file Service:** Tạo một thư mục `srv` bên trong `smart_camera_interfaces` và tạo 2 file sau:

`smart_camera_interfaces/srv/AddCamera.srv`:

```
string camera_name
string camera_url
---
bool success
string message
```

`smart_camera_interfaces/srv/RemoveCamera.srv`:

```
string camera_name
---
bool success
string message
```

**2. Cấu hình `package.xml`:** Mở file `smart_camera_interfaces/package.xml` và đảm bảo nó có các dependency cần thiết để sinh code từ file `.srv`.

```xml
<?xml version="1.0"?>
<package format="3">
  <name>smart_camera_interfaces</name>
  <version>0.0.0</version>
  <description>Interfaces for Smart Camera system</description>

  <maintainer email="thanvanhai1021988@gmail.com">haicoi</maintainer>
  <license>Apache-2.0</license>

  <buildtool_depend>ament_cmake</buildtool_depend>

  <build_depend>rosidl_default_generators</build_depend>
  <build_depend>std_msgs</build_depend>
  <build_depend>builtin_interfaces</build_depend>

  <exec_depend>rosidl_default_runtime</exec_depend>
  <exec_depend>std_msgs</exec_depend>
  <exec_depend>builtin_interfaces</exec_depend>

  <member_of_group>rosidl_interface_packages</member_of_group>

  <test_depend>ament_lint_auto</test_depend>
  <test_depend>ament_lint_common</test_depend>

  <export>
    <build_type>ament_cmake</build_type>
  </export>
</package>
```

**3. Cấu hình `CMakeLists.txt`:** Đây là trái tim của việc build package này. Mở file `smart_camera_interfaces/CMakeLists.txt`:

```cmake
# Phiên bản CMake tối thiểu
cmake_minimum_required(VERSION 3.8)

# Tên của project, nên trùng với tên package
project(smart_camera_interfaces)

# Tìm các gói build cần thiết
find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)
find_package(std_msgs REQUIRED)
find_package(builtin_interfaces REQUIRED)

# Lệnh quan trọng: Yêu cầu ROS 2 sinh code C++/Python
# từ các file .srv mà chúng ta đã định nghĩa.
rosidl_generate_interfaces(${PROJECT_NAME}
  "srv/AddCamera.srv"
  "srv/RemoveCamera.srv"
  # Khai báo rằng service của chúng ta có sử dụng message từ các gói này
  DEPENDENCIES builtin_interfaces std_msgs
)

# Lệnh này đảm bảo các package khác khi dùng interface này
# sẽ biết rằng chúng cần rosidl_default_runtime lúc chạy
ament_export_dependencies(rosidl_default_runtime)

# Hàm cuối cùng để đăng ký package với ament
ament_package()
```

## Bước 4: Xây dựng và Kiểm tra

Sau khi đã cấu hình xong package `smart_camera_interfaces`, hãy build thử để chắc chắn mọi thứ đều đúng.

```bash
# Quay về thư mục gốc của workspace
cd ~/smart_camera_ws

# Build toàn bộ workspace
# colcon sẽ tự động build interfaces trước vì các package khác phụ thuộc vào nó
colcon build

# Sau khi build xong, hãy source môi trường để ROS 2 nhận diện các package mới
source install/setup.bash
```

![Kết quả build workspace](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-19%20143604.png?raw=true)

## Kịch bản kiểm thử toàn diện hệ thống

### Bước 1: Khởi động các node chính

```bash
# Terminal 1: Khởi động Node Quản lý Camera
# Node này sẽ lắng nghe các yêu cầu thêm/xóa camera.
ros2 run smart_camera_source dynamic_camera_node

# Terminal 2: Khởi động Node Xử lý YOLO
# Node này sẽ chờ đợi các khung hình ảnh để tiến hành phân tích.
ros2 run smart_camera_processor yolo_node

# Terminal 3: Khởi động Node Bridge
# Node này sẽ chờ kết quả phân tích để gửi đến RabbitMQ.
ros2 run smart_camera_bridge bridge_node
```

![Khởi động các node 1](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-19%20134724.png?raw=true)

![Khởi động các node 2](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-19%20134449.png?raw=true)

### Bước 2: Kích hoạt camera bằng Service Call

```bash
# nếu bạn có webcam
ros2 service call /camera/add smart_camera_interfaces/srv/AddCamera "{
  camera_id: 'webcam_01',
  camera_url: '0'
}"

# Thêm một IP Camera: Nếu bạn có một camera IP với luồng RTSP, bạn cũng có thể thêm nó:
ros2 service call /camera/add smart_camera_interfaces/srv/AddCamera "{camera_id: 'HotelLobby', camera_url: 'http://158.58.130.148/mjpg/video.mjpg'}"
```

### Bước 3: Giám sát toàn bộ luồng dữ liệu

Xem các Camera Node:

```bash
ros2 run rqt_image_view rqt_image_view
```

```bash
# Kiểm tra xem topic camera đã xuất hiện chưa:
ros2 topic list | grep camera
```

![Kiểm tra topic camera](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-19%20142149.png?raw=true)

```bash
# Terminal
# Xem kết quả từ YOLO Node:
ros2 topic echo /processor/detections
```

![Kết quả từ YOLO Node](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-19%20134500.png?raw=true)

Link source github: [https://github.com/thanvanhai/smart_camera_ws](https://github.com/thanvanhai/smart_camera_ws){:target="_blank"}

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
