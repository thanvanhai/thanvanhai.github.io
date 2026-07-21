---
id: demo-nhan-dang-nguoi-camera-ros2-yolo
title: Demo Nhận Dạng Người Qua Camera Sử Dụng ROS 2 + YOLO
sidebar_label: Demo Nhận Dạng Người Qua Camera
slug: /lap-trinh/ai-robotics/demo-nhan-dang-nguoi-camera-ros2-yolo
sidebar_position: 3
date: 2025-08-18
tags: [ros2, yolo, face-recognition, insightface, python, robotics, camera]
---

**Công nghệ sử dụng**:
**ROS 2 (Humble):** Framework để xây dựng các node xử lý song song và giao tiếp với nhau.
**YOLO:** Model AI mạnh mẽ để phát hiện đối tượng (cụ thể là người).
**Face Recognition (Vd: ArcFace, FaceNet):** Model AI để trích xuất "đặc trưng" (embedding) từ khuôn mặt và so sánh chúng.

**Luồng hoạt động:**
**Camera Node:** Giả lập camera bằng cách đọc video và publish từng frame lên một topic.
**YOLO Node:** Nhận ảnh từ camera, phát hiện tất cả mọi người có trong ảnh.
**Person Verifier Node:** Nhận ảnh và vị trí của những người đã được phát hiện, sau đó xác định xem đó có phải là "người quen" đã được đăng ký từ trước hay không.

#### Thư mục `enroll` - Nơi lưu ảnh gốc

**Mục đích:** Thư mục này chứa một hoặc vài tấm ảnh chân dung rõ mặt của người mà bạn muốn hệ thống nhận ra.

**Hướng dẫn:**
Tạo thư mục `data/enroll/ten_cua_ban`.
Copy một vài ảnh chân dung của bạn vào đó. Ảnh càng rõ nét, chính diện thì độ chính xác càng cao.

File `face_utils.py` - Công cụ trích xuất đặc trưng

**Vai trò:** Đây là một file tiện ích, không phải là một ROS node. Nó chứa các hàm cốt lõi để xử lý khuôn mặt.

**Các chức năng chính cần giải thích:**

- **Nạp model Face Recognition:** Viết một hàm để tải mô hình AI nhận dạng khuôn mặt (ví dụ sử dụng thư viện `deepface` hoặc một model onnx). Model này sẽ biến một hình ảnh khuôn mặt thành một vector số (gọi là **embedding**).
- **Hàm trích xuất embedding:** Viết một hàm `get_embedding(image)` nhận đầu vào là một ảnh (đã được cắt chỉ chứa khuôn mặt), và trả về vector embedding.

```python
# smart_camera/smart_camera/face_utils.py
import os
import cv2
import numpy as np
from insightface.app import FaceAnalysis

class FaceEmbedder:
    def __init__(self, det_size=(640, 640), providers=None):
        # Chọn providers khi khởi tạo app
        self.app = FaceAnalysis(name="buffalo_l", providers=providers or ['CPUExecutionProvider'])
        # ctx_id = 0 nếu có GPU, -1 nếu dùng CPU
        self.app.prepare(ctx_id=0 if self._has_gpu(providers) else -1, det_size=det_size)

    def _has_gpu(self, providers):
        return providers and any("CUDA" in p or "Tensorrt" in p for p in providers)

    def get_face_embeddings(self, bgr_image):
        """Trả về list [(bbox, embedding)]"""
        faces = self.app.get(bgr_image)
        out = []
        for f in faces:
            emb = f.normed_embedding  # vector 512-D, đã norm
            x1, y1, x2, y2 = [int(v) for v in f.bbox]  # bbox float -> int
            out.append(((x1, y1, x2, y2), emb))
        return out

def cosine_sim(a, b):
    """Cosine similarity giữa 2 vector đã norm"""
    return float(np.dot(a, b))

def load_enrolled_embeddings(json_path):
    import json
    if not os.path.exists(json_path):
        return {}
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Chuyển list -> np.array
    for name in list(data.keys()):
        data[name] = [np.array(v, dtype=np.float32) for v in data[name]]
    return data

def save_enrolled_embeddings(json_path, db):
    import json
    serial = {k: [v.astype(float).tolist() for v in vals] for k, vals in db.items()}
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(serial, f, ensure_ascii=False, indent=2)

def verify(emb, enrolled_vecs, agg="max"):
    """So sánh 1 embedding với nhiều mẫu enroll → trả về điểm cao nhất"""
    if not enrolled_vecs:
        return -1.0
    sims = [cosine_sim(emb, v) for v in enrolled_vecs]
    return max(sims) if agg == "max" else float(np.mean(sims))
```

Tạo file `embeddings.json` - "Sổ đen" của hệ thống, chạy lệnh:

```bash
python3 -m smart_camera.enroll_person Peter "smart_camera/data/enroll/test/*.png"
```

![Tạo embeddings.json](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-15%20150138.png?raw=true)

**Xây dựng các Node xử lý của ROS 2**

Node phát hiện người - `yolo_multi_subscriber.py`

**Nhiệm vụ:** "Đôi mắt" của hệ thống:
**Subscribe:** Lắng nghe topic chứa hình ảnh từ camera (`/camera/image_raw`).
**Xử lý:** Dùng model YOLO để tìm tất cả các đối tượng là `person` trong mỗi frame ảnh.
**Publish:** Gửi đi thông tin về những người đã được phát hiện. Thông tin này nên bao gồm:
Toàn bộ frame ảnh gốc.
Tọa độ (bounding box) của từng người được phát hiện.

```python
import rclpy
from rclpy.node import Node
from rclpy.executors import MultiThreadedExecutor
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
from ultralytics import YOLO
import sqlite3

DB_PATH = "camera.db"

class YOLONode(Node):
    def __init__(self, camera_topic, output_topic=None):
        super().__init__(f"yolo_{camera_topic.replace('/', '_')}")
        self.bridge = CvBridge()
        self.sub = self.create_subscription(Image, camera_topic, self.callback, 10)
        self.output_topic = output_topic
        if output_topic:
            self.pub = self.create_publisher(Image, output_topic, 10)
        else:
            self.pub = None
        self.model = YOLO("yolov8n.pt")  # load YOLOv8 nano model

    def callback(self, msg):
        frame = self.bridge.imgmsg_to_cv2(msg, "bgr8")
        results = self.model(frame)[0]
        annotated_frame = results.plot()
        if self.pub:
            out_msg = self.bridge.cv2_to_imgmsg(annotated_frame, "bgr8")
            self.pub.publish(out_msg)

def get_camera_topics():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT topic FROM cameras")
    rows = cursor.fetchall()
    conn.close()
    return [r[0] for r in rows]

def main():
    rclpy.init()
    nodes = []
    for topic in get_camera_topics():
        node = YOLONode(topic, output_topic=topic.replace('image_raw', 'yolo'))
        nodes.append(node)

    executor = MultiThreadedExecutor()
    for node in nodes:
        executor.add_node(node)

    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        for node in nodes:
            node.destroy_node()
        rclpy.shutdown()

if __name__ == "__main__":
    main()
```

Node xác thực danh tính - `person_verifier_node.py`

**Nhiệm vụ:** "Bộ não" của hệ thống, chuyên đi xác minh danh tính.

**Luồng hoạt động chi tiết:**

**Khởi tạo (Constructor `__init__`):**
Tạo một subscriber để lắng nghe thông tin từ `yolo_multi_subscriber.py`.
Tạo một publisher để publish kết quả cuối cùng (ảnh đã được vẽ bounding box và tên).
**Quan trọng:** Trong hàm khởi tạo, node này sẽ đọc file `embeddings.json` và nạp các vector embedding của "người quen" vào bộ nhớ.

**Hàm Callback xử lý:**
Khi nhận được dữ liệu từ YOLO node (gồm ảnh và danh sách bounding box của người).
Duyệt qua từng bounding box:
Cắt (crop) vùng ảnh chứa người đó từ frame ảnh gốc.
**Sử dụng `face_utils.py`:** Gọi hàm `get_embedding()` để tính vector embedding cho khuôn mặt vừa cắt được.
**So sánh:** So sánh vector embedding mới này với các vector đã nạp từ `embeddings.json` (sử dụng độ đo cosine similarity hoặc khoảng cách Euclidean).
**Quyết định:** Nếu khoảng cách/độ tương đồng vượt qua một ngưỡng (threshold) bạn đặt ra, xác nhận đây là "người quen". Ngược lại, gán nhãn là "Unknown".

**Publish kết quả:**
Vẽ lại bounding box và tên (`Hai Nguyen` hoặc `Unknown`) lên frame ảnh gốc.
Publish hình ảnh kết quả này lên một topic mới (ví dụ: `/smart_camera/result`).

```python
# smart_camera/smart_camera/person_verifier_node.py
import json
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from std_msgs.msg import String
from cv_bridge import CvBridge
import cv2
import numpy as np

from .face_utils import FaceEmbedder, load_enrolled_embeddings, verify

class PersonVerifierNode(Node):
    def __init__(self):
        super().__init__("person_verifier_node")
        self.bridge = CvBridge()

        # Params
        self.declare_parameter("camera_topics", ["/camera1/image_raw", "/camera2/image_raw"])
        self.declare_parameter("target_name", "Alice")  # người cần xác thực
        self.declare_parameter("embeddings_path", "data/embeddings.json")
        self.declare_parameter("threshold", 0.38)  # ArcFace cosine ~ 0.3–0.45 (tùy điều kiện)
        self.declare_parameter("providers", ["CPUExecutionProvider"])

        self.topics = self.get_parameter("camera_topics").get_parameter_value().string_array_value
        self.target_name = self.get_parameter("target_name").get_parameter_value().string_value
        self.emb_path = self.get_parameter("embeddings_path").get_parameter_value().string_value
        self.threshold = self.get_parameter("threshold").get_parameter_value().double_value
        providers = list(self.get_parameter("providers").get_parameter_value().string_array_value)

        self.face_embedder = FaceEmbedder(providers=providers)
        self.db = load_enrolled_embeddings(self.emb_path)
        if self.target_name not in self.db or len(self.db[self.target_name]) == 0:
            self.get_logger().warn(f"No embeddings for {self.target_name}. Please run enroll script.")

        self.pub = self.create_publisher(String, "/person_events", 10)
        self.subs = []
        for t in self.topics:
            self.subs.append(self.create_subscription(Image, t, self._cb(t), 10))
            self.get_logger().info(f"Subscribed to {t}")

    def _cb(self, topic_name):
        def inner(msg: Image):
            try:
                frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding="bgr8")
            except Exception as e:
                self.get_logger().error(f"cv_bridge error: {e}")
                return

            faces = self.face_embedder.get_face_embeddings(frame)
            best = None
            best_score = -1.0

            enrolled = self.db.get(self.target_name, [])
            for (x1,y1,x2,y2), emb in faces:
                score = verify(emb, enrolled, agg="max")
                if score > best_score:
                    best_score = score
                    best = (x1,y1,x2,y2)

            if best is not None:
                (x1,y1,x2,y2) = best
                # Vẽ để debug (tùy bạn bật/tắt)
                vis = frame.copy()
                cv2.rectangle(vis, (x1,y1), (x2,y2), (0,255,0), 2)
                cv2.putText(vis, f"{self.target_name}: {best_score:.2f}", (x1, max(0,y1-10)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
                # Nếu muốn bật GUI:
                # cv2.imshow(f"Verify {topic_name}", vis)
                # cv2.waitKey(1)

                # Publish event nếu vượt ngưỡng
                verdict = (best_score >= self.threshold)
                event = {
                    "camera_topic": topic_name,
                    "target": self.target_name,
                    "score": round(best_score, 4),
                    "passed": verdict,
                    "bbox": [x1,y1,x2,y2]
                }
                self.pub.publish(String(data=json.dumps(event)))
        return inner

def main(args=None):
    rclpy.init(args=args)
    node = PersonVerifierNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == "__main__":
    main()
```

**Gắn kết và Chạy hệ thống**: File `multi_camera_launch.py`

**Vai trò:** File launch này có nhiệm vụ khởi chạy tất cả các node cần thiết cùng một lúc.

**Cấu trúc file launch:**
Định nghĩa node giả lập camera, trỏ đến file video trong thư mục `videos/` của bạn.
Định nghĩa node `yolo_multi_subscriber`.
Định nghĩa node `person_verifier_node`.
Sắp xếp để các node này được thực thi khi bạn chạy lệnh `ros2 launch`.

```python
import rclpy
from rclpy.executors import MultiThreadedExecutor
from smart_camera.camera_node_rtsp import CameraNode
import sqlite3

DB_PATH = "camera.db"

def get_cameras_from_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name, topic, video_path FROM cameras")
    rows = cursor.fetchall()
    conn.close()
    return rows

def main(args=None):
    rclpy.init(args=args)
    nodes = []

    cameras = get_cameras_from_db()
    for cam in cameras:
        name, topic, video_path = cam
        node = CameraNode(name, topic, video_path)
        nodes.append(node)
    # Dùng MultiThreadedExecutor thay cho spin_multi_threaded
    executor = MultiThreadedExecutor()
    for node in nodes:
        executor.add_node(node)

    try:
        executor.spin()
    except KeyboardInterrupt:
        print("Shutting down camera nodes...")
    finally:
        for node in nodes:
            node.destroy_node()
        rclpy.shutdown()

if __name__ == "__main__":
    main()
```

**Build lại ROS2**:

```bash
colcon build --symlink-install
```

📌 **Chạy thử**:

```bash
# Terminal 1
source install/setup.bash
ros2 run smart_camera multi_camera_launch_rtsp

# Terminal 2
source install/setup.bash
ros2 run smart_camera yolo_multi_subscriber

# Terminal 3
ros2 run rqt_image_view rqt_image_view

# Terminal 4
source install/setup.bash
ros2 run smart_camera person_verifier_node --ros-args   -p camera_topics:="[/HotelLobby/image_raw, /camera_gialap/image_raw]"   -p target_name:=Peter   -p embeddings_path:=data/embeddings.json   -p threshold:=0.40

# Terminal 5
rqt_image_view /smart_camera/result
```

![Chạy thử hệ thống multi-camera](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-14%20094432.png?raw=true)

![Kết quả nhận dạng qua rqt_image_view](https://github.com/thanvanhai/smart_camera_demo/blob/master/image/Screenshot%202025-08-15%20094330.png?raw=true)

<iframe width="100%" height="480" src="https://www.youtube.com/embed/W8rvxCea-_E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Link source GitHub: [https://github.com/thanvanhai/smart_camera_demo](https://github.com/thanvanhai/smart_camera_demo)

<div style={{textAlign: 'center'}}>

**Chúc các bạn thành công và vui vẻ!**

</div>
