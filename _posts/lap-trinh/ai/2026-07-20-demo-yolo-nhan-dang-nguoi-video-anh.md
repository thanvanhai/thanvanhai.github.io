---
title: "Demo Sử Dụng YOLO Để Nhận Dạng Người Trong Video Hoặc Ảnh"
date: 2026-07-20 09:00:00 +0700
categories: [Lập trình, AI-Robotics]
tags: [python, yolo, opencv, computer-vision, object-detection, streamlit]
author: haicoi
---

**YOLO chỉ phát hiện đối tượng (Object Detection)**

- **Nhiệm vụ chính:** Xác định *loại đối tượng* (người, xe, chó, mèo, v.v.) và vị trí của nó trong ảnh hoặc video.
- **Kết quả trả về:**
  - Tọa độ khung hình (bounding box) bao quanh đối tượng.
  - Nhãn (label) đối tượng.
  - Độ tin cậy (confidence score).
- **Điểm mạnh:**
  - Rất nhanh, chạy real-time.
  - Nhận dạng nhiều loại vật thể cùng lúc.
  - Tìm ra được **"có người hay không"** và **người đang ở đâu**.
- **Hạn chế:**
  - Không phân biệt được *người này là ai*.
  - Không đọc được chi tiết khuôn mặt.

**Còn muốn xác minh danh tính thì sẽ phải sử dụng Face Recognition (Face Identification / Verification) hoặc sử dụng InsightFace**

- **Nhiệm vụ chính:** So sánh khuôn mặt với cơ sở dữ liệu để xem đó là ai.
- **Kết quả trả về:**
  - Tên hoặc ID của người (nếu tìm thấy trong cơ sở dữ liệu).
  - Hoặc "Unknown" nếu không có trong database.
- **Điểm mạnh:**
  - Có thể xác minh được đúng *người cụ thể*.
  - Chỉ cần một ảnh mẫu để so khớp.
- **Hạn chế:**
  - Chỉ xử lý tốt khi khuôn mặt rõ, không bị che khuất nhiều.
  - Tốc độ chậm hơn YOLO nếu dùng cho toàn khung hình (vì phải dò mặt trên toàn ảnh).

## Kết hợp YOLOv8 + Face Recognition

- **Quy trình:**
  1. **YOLOv8** tìm ra vị trí người → nhanh, ít tốn tài nguyên.
  2. Cắt ảnh vùng người → đưa vào **Face Recognition** để so sánh khuôn mặt.
  3. Kết quả cuối cùng: "Có 3 người: Nguyễn Văn A, Unknown, Trần Thị B".
- **Ưu điểm khi kết hợp:**
  - Không cần quét toàn bộ ảnh để tìm mặt (Face Recognition chỉ chạy trên vùng người).
  - Tốc độ nhanh hơn nhiều so với việc chỉ dùng Face Recognition trực tiếp.
  - Có thể lọc chỉ những đối tượng là "person" (bỏ qua động vật, xe...).
- **Ví dụ thực tế:**
  - Camera an ninh: YOLO phát hiện người → Face Recognition xác minh danh tính.
  - Kiểm soát ra vào: YOLO lọc ra người → Face Recognition xác nhận nhân viên.

---

## Tạo thư mục dự án

```bash
mkdir yolo_person_count_demo
cd yolo_person_count_demo
```

Hoặc mở thư mục dự án trên Visual Code.

![Tạo thư mục dự án](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20093226.png?raw=true)

Tạo môi trường ảo:

```bash
python -m venv venv
venv\Scripts\activate
```

![Tạo môi trường ảo](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20093427.png?raw=true)

Cài đặt thư viện:

```bash
pip install ultralytics opencv-python
```

![Cài đặt thư viện 1](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20094153.png?raw=true)

![Cài đặt thư viện 2](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20094603.png?raw=true)

## Code nhận dạng và đếm người

Tạo file `detect_and_count.py`:

```python
import cv2
from ultralytics import YOLO

# Load model YOLOv8 pre-trained
model = YOLO("yolov8n.pt")  # bản nhỏ, chạy nhanh

# Đường dẫn video cần detect
video_path = "856376-hd_1920_1080_30fps.mp4"  # đổi thành video của bạn
cap = cv2.VideoCapture(video_path)

# Lấy thông tin video
fps = int(cap.get(cv2.CAP_PROP_FPS))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

# Tùy chọn: Lưu video kết quả
out = cv2.VideoWriter(
    "result_count.mp4",
    cv2.VideoWriter_fourcc(*"mp4v"),
    fps,
    (width, height)
)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Detect objects
    results = model(frame)

    # Lọc chỉ người
    person_count = 0
    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]
        if label == "person":
            person_count += 1

    # Vẽ kết quả nhận dạng
    annotated_frame = results[0].plot()

    # Thêm số người lên video
    cv2.putText(
        annotated_frame,
        f"Person count: {person_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.2,
        (0, 255, 0),
        2
    )

    # Hiển thị video
    cv2.imshow("YOLOv8 Person Count", annotated_frame)

    # Lưu video kết quả
    out.write(annotated_frame)

    # Nhấn Q để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
out.release()
cv2.destroyAllWindows()
```

![Kết quả code detect_and_count](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20095854.png?raw=true)

Chạy demo:

```bash
python detect_and_count.py
```

![Kết quả chạy demo 1](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20100138.png?raw=true)

![Kết quả chạy demo 2](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20100158.png?raw=true)

![Kết quả chạy demo 3](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20101933.png?raw=true)

## Xây dựng giao diện với Streamlit

Cài thêm thư viện giao diện:

```bash
pip install streamlit
```

Tạo file `app.py`:

```python
import streamlit as st
from ultralytics import YOLO
import cv2
import tempfile

# Thiết lập giao diện
st.set_page_config(page_title="YOLOv8 Object Detection", layout="wide")
st.title("🎯 YOLOv8 - Chọn loại đối tượng để nhận dạng trong Video")

# Upload video
uploaded_video = st.file_uploader("Tải video (MP4, AVI, MOV)", type=["mp4", "avi", "mov"])

if uploaded_video:
    # Lưu video tạm
    tfile = tempfile.NamedTemporaryFile(delete=False)
    tfile.write(uploaded_video.read())

    # Load YOLO model
    model = YOLO("yolov8n.pt")

    # Lấy danh sách nhãn từ model
    labels_list = list(model.names.values())

    # Chọn loại đối tượng
    target_label = st.selectbox("Chọn loại đối tượng muốn nhận dạng", labels_list, index=0)

    # Mở video
    cap = cv2.VideoCapture(tfile.name)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # File video kết quả
    output_path = "result_streamlit.mp4"
    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    stframe = st.empty()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Detect objects
        results = model(frame)

        # Đếm số lượng đối tượng
        target_count = 0
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            if label == target_label:
                target_count += 1

        # Annotate frame
        annotated_frame = results[0].plot()
        cv2.putText(
            annotated_frame,
            f"{target_label} count: {target_count}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            (0, 255, 0),
            2
        )

        out.write(annotated_frame)
        stframe.image(annotated_frame, channels="BGR", use_column_width=True)

    cap.release()
    out.release()

    st.success("✅ Hoàn thành nhận dạng!")
    with open(output_path, "rb") as f:
        st.download_button("📥 Tải video kết quả", f, file_name="result_detect.mp4")
```

Chạy ứng dụng:

```bash
streamlit run app.py
```

![Chạy ứng dụng Streamlit](https://github.com/thanvanhai/yolo_person_count_demo/blob/main/image/Screenshot%202025-08-12%20103607.png?raw=true)

## Video demo

{% include embed/youtube.html id='3RcgByaS-ng' %}

Link source github: [https://github.com/thanvanhai/yolo_person_count_demo](https://github.com/thanvanhai/yolo_person_count_demo){:target="_blank"}

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
