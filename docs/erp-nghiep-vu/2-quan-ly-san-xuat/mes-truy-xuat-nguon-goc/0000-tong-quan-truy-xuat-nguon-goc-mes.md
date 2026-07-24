---
id: tong-quan-truy-xuat-nguon-goc-mes
title: Tổng quan Truy xuất Nguồn gốc (Traceability)
sidebar_label: Tổng quan Truy vết (MES-TRC)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mes-truy-xuat-nguon-goc/tong-quan
sidebar_position: 1
date: 2026-07-21
tags: [erp, mes, traceability, genealogy, barcode, rfid, recall, ebr, dhr, gs1, serialization, tong-quan, roadmap]
---

# Tổng quan Truy xuất Nguồn gốc (Traceability)

Trang này tổng hợp lộ trình các bài viết nghiên cứu chuyên sâu về giải pháp **Truy xuất nguồn gốc sản xuất (Traceability / Genealogy)** trong hệ thống ERP và MES. Các mục dưới đây đang ở trạng thái chờ viết chi tiết và sẽ được cập nhật liên kết dần sau khi hoàn thành.

## 1. Mô hình phả hệ sản phẩm & Dữ liệu gốc (Genealogy Model & Master Data)

- [ ] [1000 - Cấu trúc phả hệ sản phẩm xuôi dòng và ngược dòng (Product Genealogy: Forward & Backward Traceability)]()
- [ ] [1010 - Thiết lập quy tắc gán sê-ri và lô sản xuất trong phả hệ lắp ráp (Lot & Serial Integration Rules)]()
- [ ] [1020 - Kế thừa và ánh xạ số lô nhà cung cấp ngay tại thời điểm nhận hàng (Supplier Lot Inheritance at Receiving)]()

## 2. Ghi nhận truy vết tại sàn sản xuất (Shop Floor Data Capture)

- [ ] [2000 - Nghiệp vụ kiểm soát và đối soát quét vật tư đầu vào tại trạm (Point-of-Use Verification & Material Consumption)]()
- [ ] [2010 - Thiết lập quy tắc in nhãn, mã vạch và dán nhãn thông minh tại các trạm công đoạn (Labeling & Serialization)]()
- [ ] [2020 - Liên kết thông số quy trình máy móc với phả hệ sản phẩm thực tế (Process Parameter Logging & Lot-Serial Association)]()
- [ ] [2030 - Chuẩn hóa mã định danh theo GS1 làm nền tảng cho nhãn và gom cụm (GS1 Standards: GTIN, SSCC, GS1-128)]()

## 3. Ghép nối & Gom cụm sản phẩm nhiều cấp (Aggregation & Packaging)

- [ ] [3000 - Quy trình gom cụm và thiết lập phả hệ đóng gói nhiều cấp (Parent-Child Aggregation: Unit-to-Box-to-Pallet)]()
- [ ] [3010 - Quản lý phả hệ lắp ráp nhiều cấp và ghi nhận phế phẩm linh kiện (Multi-level Assembly Genealogy)]()
- [ ] [3020 - Tuân thủ Serialization cấp đơn vị theo quy định ngành dược phẩm (DSCSA / EU FMD Compliance)]()

## 4. Kiểm soát rủi ro & Xử lý thu hồi sản phẩm (Risk Mitigation & Recall)

- [ ] [4000 - Quy trình phân tích nguyên nhân gốc rễ ngược dòng từ thành phẩm lỗi (Backward Traceability & Root Cause Analysis)]()
- [ ] [4010 - Quy trình khoanh vùng, cách ly tồn kho và thu hồi sản phẩm lỗi ngoài thị trường (Quarantine & Product Recall)]()
- [ ] [4020 - Thiết lập báo cáo phả hệ điện tử cho ngành có điều kiện (Electronic Batch Record - EBR / Device History Record - DHR)]()
- [ ] [4030 - Diễn tập thu hồi định kỳ và đo lường tốc độ phản ứng (Mock Recall / Recall Drill)]()

## 5. Lỗi thường gặp & Xử lý sự cố phả hệ (Troubleshooting & Exceptions)

- [ ] [5000 - Xử lý lỗi lệch phả hệ do công nhân quét sai linh kiện đầu vào (Material Scan Errors & Alignment)]()
- [ ] [5010 - Giải pháp khắc phục đứt gãy dữ liệu phả hệ khi chia tách hoặc gộp lô sản xuất (Lot Splitting & Lot Merging)]()
- [ ] [5020 - Cơ chế truy xuất nguồn gốc đối với vật tư rời, vật tư lỏng phi định hình (Traceability for Bulk, Liquid & Non-discrete)]()

---

## Ghi chú đặc thù theo từng nền tảng MES/ERP

Truy xuất nguồn gốc ở mức độ chi tiết nguyên công (Operation-level) và thông số máy móc đòi hỏi năng lực ghi nhận dữ liệu thời gian thực cao. Dưới đây là cách tiếp cận của các hệ thống phổ biến:

| Nền tảng | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP Digital Manufacturing (DM) / ME** | Cung cấp luồng Electronic Batch Record (EBR) cho ngành dược phẩm/hóa chất và Device History Record (DHR) cho ngành thiết bị y tế đạt chuẩn FDA 21 CFR Part 11 cực kỳ nghiêm ngặt. Phả hệ sản phẩm (Genealogy) được tự động đối chiếu với BOM/Routing gốc của SAP ERP. |
| **Epicor Kinetic** | Mạnh về truy vết Lot/Serial nhiều cấp (Track-to-Track) cho ngành cơ khí chính xác, hàng không vũ trụ và ô tô. Quản lý tốt lịch sử cải tiến vật tư (Revision) trực tiếp trên sàn sản xuất. |
| **Siemens Opcenter Execution (MES)** | Giải pháp hàng đầu cho ngành điện tử (SMT), hỗ trợ truy vết sâu đến từng vị trí cuộn linh kiện trên mâm feeder của máy gắp đặt (Pick & Place), tự động cảnh báo nếu công nhân nạp sai cuộn linh kiện đầu vào. |
| **Odoo MRP** | Cung cấp báo cáo truy vết xuôi/ngược (Upstream/Downstream Traceability Report) khá trực quan ở mức độ dịch chuyển kho (Inventory Moves). Tuy nhiên, thiếu tính năng kiểm soát gán nhãn đóng gói nhiều cấp (Unit-Box-Pallet) và kiểm soát tham số máy móc tại trạm công nhân theo thời gian thực nếu không tùy biến thêm. |