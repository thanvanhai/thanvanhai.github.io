---
id: tong-quan-giam-sat-thiet-bi-mes
title: Tổng quan Giám sát Thiết bị (PLC/SCADA)
sidebar_label: Tổng quan Giám sát (MES-EQM)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mes-giam-sat-thiet-bi/tong-quan
sidebar_position: 1
date: 2026-07-21
tags: [erp, mes, scada, plc, iot, oee, opc-ua, historian, isa-95, monitoring, tong-quan, roadmap]
---

# Tổng quan Giám sát Thiết bị (PLC/SCADA)

Trang này tổng hợp lộ trình các bài viết nghiên cứu chuyên sâu về giải pháp **Giám sát Thiết bị (Equipment Monitoring)**, kết nối tầng điều khiển (PLC/SCADA/Cảm biến) lên hệ thống quản lý sản xuất MES. Các mục dưới đây đang ở trạng thái chờ viết chi tiết và sẽ được cập nhật liên kết dần sau khi hoàn thành.

## 1. Mô hình phân cấp thiết bị & Tài sản (Equipment Hierarchy / Asset Model)

- [ ] [1000 - Thiết lập mô hình phân cấp thiết bị theo chuẩn ISA-95 (Enterprise - Site - Area - Line - Cell/Equipment Hierarchy Setup)]()
- [ ] [1010 - Định nghĩa lớp thuộc tính và mô hình trạng thái chuẩn cho từng loại thiết bị (Equipment Class & State Model Definition)]()

## 2. Hạ tầng kết nối & Giao thức truyền thông (Connectivity & OT Protocols)

- [ ] [2000 - Tiêu chuẩn kết nối OPC UA và OPC DA trong truyền thông công nghiệp (OPC UA & DA Standards)]()
- [ ] [2010 - Ứng dụng giao thức công nghiệp Modbus, Profinet và EtherNet/IP trong kết nối MES]()
- [ ] [2020 - Sử dụng MQTT và Sparkplug B cho kết nối IoT/Edge mượt mà lên hệ thống MES]()

## 3. Thu thập dữ liệu, Ánh xạ Tag & Lưu trữ Lịch sử (Data Ingestion, Tag Mapping & Historian)

- [ ] [3000 - Cấu hình và ánh xạ thẻ dữ liệu PLC lên đúng đối tượng trong mô hình phân cấp thiết bị (PLC Tag Mapping to Equipment Hierarchy)]()
- [ ] [3010 - Thiết kế kiến trúc Edge Gateway và OPC Server trung gian (Ignition, Kepware, Node-RED)]()
- [ ] [3020 - Kỹ thuật lọc nhiễu dữ liệu cảm biến và cấu hình vùng chết truyền thông (Data Filtering & Deadband)]()
- [ ] [3030 - Kiến trúc lưu trữ dữ liệu chuỗi thời gian và chính sách nén/lưu trữ dài hạn (Time-series Historian & Data Retention Policy)]()

## 4. Giám sát trạng thái & Cảnh báo thời gian thực (Real-time States & Alarms)

- [ ] [4000 - Cơ chế tự động nhận diện trạng thái thiết bị dựa trên tín hiệu dòng điện và tốc độ (Auto-state Detection)]()
- [ ] [4010 - Quản lý sự kiện cảnh báo lỗi máy, cơ chế leo thang và khóa liên động an toàn (Alarm & Interlock Management)]()
- [ ] [4020 - Thiết kế giao diện HMI/SCADA tại nhà xưởng và bảng thông tin Andon trực quan (Visual Factory & Andon)]()

## 5. Tự động hóa tính toán hiệu suất OEE (Automated OEE Tracking)

- [ ] [5000 - Thuật toán đếm sản lượng và phân loại phế phẩm tự động qua cảm biến vật lý (PLC-based Yield & Scrap Ingestion)]()
- [ ] [5010 - Thu thập dữ liệu dừng máy và tự động tính toán hiệu suất OEE thời gian thực (Real-time OEE Calculation)]()
- [ ] [5020 - Phân tích tổn thất thiết bị dựa trên mô hình 6 Tổn thất lớn trong sản xuất (6 Big Losses Analysis)]()
- [ ] [5030 - Đồng bộ lịch sản xuất và ca kíp làm mẫu số tính toán OEE (Production Calendar Sync for OEE Denominator)]()

## 6. Giám sát điều kiện, Sức khỏe máy móc & Năng lượng (Condition Monitoring, Maintenance & Energy)

- [ ] [6000 - Ghi nhận thời gian chạy máy thực tế và số chu kỳ hoạt động phục vụ bảo trì (Runtime & Cycle Count Ingestion)]()
- [ ] [6010 - Giám sát thông số vận hành thiết bị để cảnh báo sớm sự cố (Vibration, Temperature & Current Monitoring)]()
- [ ] [6020 - Cơ chế tạo yêu cầu bảo trì tự động từ dữ liệu đo lường thực tế (Predictive Maintenance Triggers)]()
- [ ] [6030 - Giám sát tiêu thụ năng lượng theo thiết bị/line sản xuất (Energy Monitoring & Consumption Analytics)]()

## 7. Ngữ cảnh hóa dữ liệu & Xử lý sự cố (Contextualization & Troubleshooting)

- [ ] [7000 - Giải pháp kết nối dữ liệu máy móc với thông tin Lệnh sản xuất đang chạy (Contextualizing OT Data with Work Order)]()
- [ ] [7010 - Giải pháp xử lý mất kết nối mạng công nghiệp bằng cơ chế lưu trữ đệm (Store-and-Forward Mechanism)]()
- [ ] [7020 - Quy tắc bảo mật mạng và phân tách vùng an toàn giữa tầng IT và tầng OT (OT-IT Cyber Security)]()

---

## Ghi chú đặc thù theo từng nền tảng MES/SCADA

Khác với các phân hệ ERP (OM, PO, MFG-TECH, MFG-Execution), phạm vi Giám sát Thiết bị không so sánh giữa Oracle EBS/SAP/Epicor/Odoo, vì Oracle EBS và Odoo không có năng lực kết nối SCADA/PLC gốc (native). Đối tượng so sánh phù hợp là các nền tảng MES/SCADA/Historian chuyên biệt:

| Nền tảng | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP MII / Digital Manufacturing Cloud (DMC)** | Tích hợp sẵn với SAP PP/S4 HANA Manufacturing, chuẩn hóa mô hình phân cấp thiết bị theo ISA-95 ngay trong DMC, hỗ trợ tính OEE và Andon gắn liền với Production Order từ SAP. |
| **Epicor Mattec MES** | Tích hợp chặt với Epicor Kinetic ERP, mạnh về thu thập dữ liệu máy tự động (machine data collection) theo thời gian thực và tính OEE ngay từ tầng cảm biến mà không cần cấu hình phức tạp. |
| **Ignition (Inductive Automation)** | Nền tảng SCADA/Historian độc lập phổ biến nhất hiện nay, hỗ trợ OPC UA và MQTT/Sparkplug B native, thường dùng làm lớp trung gian kết nối PLC bất kể ERP nào ở tầng trên (kể cả Oracle EBS/Odoo). |
| **AVEVA (Wonderware) / PI System** | Historian truyền thống mạnh nhất về lưu trữ dữ liệu chuỗi thời gian tần suất cao và độ tin cậy lâu năm trong ngành công nghiệp nặng, thường đóng vai trò lớp Historian trung tâm bất kể MES nào truy vấn dữ liệu. |