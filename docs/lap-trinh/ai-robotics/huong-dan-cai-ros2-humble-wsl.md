---
id: huong-dan-cai-ros2-humble-wsl
title: Hướng Dẫn Cài ROS 2 Humble (LTS, Tương Thích Với Ubuntu 22.04 Của WSL Windows) Và Demo Ứng Dụng Nhỏ Kết Nối Nhiều Camera
sidebar_label: Cài ROS 2 Humble Trên WSL
slug: /lap-trinh/ai-robotics/huong-dan-cai-ros2-humble-wsl
sidebar_position: 3
date: 2025-08-15
tags: [ros2, wsl, ubuntu, python, yolo, robotics, camera]
---

Mở **PowerShell (Admin)**

```powershell
wsl --install
wsl --install -d Ubuntu-22.04
```

Đợi thông báo nhập tài khoản và mật khẩu cho Ubuntu. Nếu là Win 10 thì chưa hỗ trợ GUI mặc định — trước đây phải cài thêm X server hoặc VcXsrv rồi chỉnh remote rất cực, nhưng nay đã có Win 11 thì đã hỗ trợ GUI mặc định. Cài gói WSLg cho Win 10 theo hướng dẫn [Run Linux GUI apps on the Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps).

Cài ROS 2 chọn version **Humble** — tùy mục đích sử dụng mà chọn version cho phù hợp, tham khảo tại [ROS 2 version Humble Documentation](https://docs.ros.org/en/humble/index.html).

![Cài ROS 2 Humble](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-15%20083059.png?raw=true)

![Cài ROS 2 Humble](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-15%20083116.png?raw=true)

Cập nhật hệ thống và cài công cụ cần thiết

```bash
sudo apt update && sudo apt install -y curl gnupg lsb-release
```

Tải và lưu key GPG của ROS

```bash
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key \
    -o /usr/share/keyrings/ros-archive-keyring.gpg
```

Thêm nguồn ROS 2 vào apt

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] \
http://packages.ros.org/ros2/ubuntu $(lsb_release -cs) main" \
| sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null
```

Cập nhật lại danh sách gói

```bash
sudo apt update
```

Cài bản ROS 2 đầy đủ (desktop)

```bash
sudo apt install -y ros-humble-desktop
```

![Cài ros-humble-desktop](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20091641.png?raw=true)

![Cài ros-humble-desktop](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20091709.png?raw=true)

Thiết lập biến môi trường để ROS hoạt động mỗi lần mở terminal

```bash
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

**Cài đặt Python + OpenCV + YOLO**

ROS 2 chủ yếu code bằng C++ hoặc Python

```bash
# Cài Python và pip nếu chưa có
sudo apt install -y python3 python3-pip python3-venv

# Tạo môi trường ảo cho project
mkdir ~/smart_camera_demo && cd ~/smart_camera_demo
python3 -m venv venv
source venv/bin/activate

# Cài OpenCV, Ultralytics YOLOv8 và các thư viện cần thiết
pip install opencv-python ultralytics
```

![Cài Python + OpenCV + YOLO](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20092233.png?raw=true)

![Cài Python + OpenCV + YOLO](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20092743.png?raw=true)

![Cài Python + OpenCV + YOLO](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20093112.png?raw=true)

**Cấu hình topic ROS 2 cho camera**:
Mở camera hoặc stream RTSP
Gửi frame qua ROS 2 topic

```bash
sudo apt install -y ros-humble-cv-bridge ros-humble-image-transport python3-colcon-common-extensions
```

![Cấu hình topic ROS 2 cho camera](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20093458.png?raw=true)

![Cấu hình topic ROS 2 cho camera](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20093516.png?raw=true)

**Tạo ROS 2 package Python**

```bash
cd ~/smart_camera_demo
source /opt/ros/humble/setup.bash
ros2 pkg create --build-type ament_python smart_camera
cd smart_camera
```

![Tạo ROS 2 package Python](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20093617.png?raw=true)

Trong `smart_camera/smart_camera/` sẽ có file `__init__.py`.
Tạo thêm file `camera_node.py` để đọc camera và publish ảnh.

```python
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import cv2
import os

class CameraNode(Node):
    def __init__(self):
        super().__init__('camera_node')
        self.publisher_ = self.create_publisher(Image, '/camera/image_raw', 10)
        self.br = CvBridge()

        # Tham số ROS2
        self.declare_parameter('video_path', '')
        self.declare_parameter('image_path', '')

        video_path = self.get_parameter('video_path').get_parameter_value().string_value
        image_path = self.get_parameter('image_path').get_parameter_value().string_value

        # Chọn nguồn phát
        if video_path and os.path.exists(video_path):
            self.cap = cv2.VideoCapture(video_path)
            self.source_type = 'video'
            self.get_logger().info(f"📹 Phát video từ file: {video_path}")
        elif image_path and os.path.exists(image_path):
            self.image = cv2.imread(image_path)
            self.source_type = 'image'
            self.get_logger().info(f"🖼 Phát ảnh từ file: {image_path}")
        else:
            self.cap = cv2.VideoCapture(0)
            self.source_type = 'webcam'
            self.get_logger().info("🎥 Phát từ webcam")

        self.timer = self.create_timer(0.03, self.timer_callback)

    def timer_callback(self):
        if self.source_type in ['video', 'webcam']:
            ret, frame = self.cap.read()
            if not ret:
                if self.source_type == 'video':
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Lặp lại video
                    ret, frame = self.cap.read()
                    if not ret:
                        self.get_logger().error("❌ Không đọc được video")
                        return
                else:
                    self.get_logger().error("❌ Không đọc được webcam")
                    return
        else:  # image
            frame = self.image

        # Hiển thị GUI
        cv2.imshow("Camera Feed", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            self.get_logger().info("🛑 Đóng GUI theo yêu cầu")
            rclpy.shutdown()
            return

        # Publish ROS Image
        msg = self.br.cv2_to_imgmsg(frame, encoding='bgr8')
        self.publisher_.publish(msg)

    def destroy_node(self):
        # Giải phóng camera và đóng cửa sổ GUI
        if self.source_type in ['video', 'webcam'] and self.cap:
            self.cap.release()
        cv2.destroyAllWindows()
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)
    node = CameraNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        node.get_logger().info("🛑 KeyboardInterrupt - Thoát")
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

**Thêm node AI nhận dạng**:

```python
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
from ultralytics import YOLO
import cv2

class YoloSubscriber(Node):
    def __init__(self):
        super().__init__('yolo_subscriber')
        self.subscriber = self.create_subscription(
            Image, 
            '/camera/image_raw',  # topic từ camera_node
            self.listener_callback, 
            10
        )
        self.bridge = CvBridge()
        self.model = YOLO('yolov8n.pt')  # model nhỏ cho nhanh

    def listener_callback(self, data):
        # Chuyển ROS Image -> OpenCV
        frame = self.bridge.imgmsg_to_cv2(data, desired_encoding='bgr8')
        
        # Chạy YOLOv8 inference
        results = self.model(frame)
        annotated = results[0].plot()  # vẽ bounding box

        # Hiển thị GUI
        cv2.imshow("YOLO Detection", annotated)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            self.get_logger().info("🛑 GUI đóng theo yêu cầu")
            rclpy.shutdown()

    def destroy_node(self):
        # Giải phóng OpenCV window
        cv2.destroyAllWindows()
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)
    node = YoloSubscriber()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        node.get_logger().info("🛑 KeyboardInterrupt - Thoát")
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
```

**Build và chạy thử**:

```bash
cd ~/smart_camera_demo
colcon build --symlink-install
source install/setup.bash
```

![Build package](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20094432.png?raw=true)

📌 **Chạy thử**:

```bash
# Terminal 1
cd ~/smart_camera_demo
source install/setup.bash
ros2 run smart_camera camera_node

# Terminal 2
cd ~/smart_camera_demo
source install/setup.bash
ros2 run smart_camera yolo_node
```

**Cách kiểm tra kết quả YOLO**

```bash
ros2 run rqt_image_view rqt_image_view
```

![Kiểm tra kết quả YOLO qua rqt_image_view](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-15%20094330.png?raw=true)

![Kiểm tra kết quả YOLO qua rqt_image_view](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-15%20094307.png?raw=true)

<iframe width="100%" height="480" src="https://www.youtube.com/embed/3KwZjqLx1X4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Link source GitHub: [https://github.com/thanvanhai/smart_camera_demo](https://github.com/thanvanhai/smart_camera_demo)

<div style={{textAlign: 'center'}}>

**Chúc các bạn thành công và vui vẻ!**

</div>