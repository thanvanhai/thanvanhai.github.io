---
id: tong-quan-thuc-thi-san-xuat-mfg
title: Tổng quan Thực thi Sản xuất (MFG-Execution)
sidebar_label: Tổng quan Thực thi (MFG)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-thuc-thi/tong-quan
sidebar_position: 1
date: 2026-07-24
tags: [erp, manufacturing, wip, work-order, tong-quan, roadmap]
---

# Tổng quan Thực thi Sản xuất (MFG-Execution)

Trang này tổng hợp lộ trình các bài viết về nghiệp vụ **Thực thi sản xuất (Shop Floor Control / Work in Process - WIP)** trên sàn nhà xưởng, thuộc phạm vi **ERP - dữ liệu giao dịch (Transactional Data)**. Phân hệ này tiêu thụ dữ liệu cấu trúc kỹ thuật (BOM/Routing) từ phân hệ `mfg-ky-thuat` để điều phối, ghi nhận thực tế và kiểm soát chi phí dở dang.
Các mục dưới đây sẽ được cập nhật liên kết dần sau khi bài viết tương ứng được hoàn thành.

## 1. Phát hành & Điều phối lệnh sản xuất (Order Release & Dispatching)

- [ ] [1000 - Quản lý trạng thái và Phát hành Lệnh sản xuất (Work Order Release & Status Management)]()
- [ ] [1010 - Điều phối sản xuất và Phân bổ công việc xuống tổ/máy (Shop Floor Dispatching & Job Scheduling)]()
- [ ] [1020 - Phát hành tài liệu sản xuất đi kèm đơn hàng (Job Traveler & Barcode Route Sheet Generation)]()

## 2. Cấp phát nguyên vật liệu sản xuất (Material Issue & Staging)

- [ ] [2000 - Quy trình cấp phát vật tư theo bộ lên chuyền sản xuất (Material Kitting & Staging)]()
- [ ] [2010 - Cơ chế trừ kho vật tư tự động khi hoàn thành nguyên công (Backflushing Mechanics & Issues)]()
- [ ] [2020 - Quản lý tồn kho dở dang tại sàn sản xuất và kiểm soát hao hụt (Floor Stock & Scrap Loss Tracking)]()
- [ ] [2030 - Trả vật tư dư thừa từ chuyền về kho (Return to Store / Unused Material Return)]()
- [ ] [2040 - Thay thế vật tư tại thời điểm tiêu thụ khi thiếu hàng (Component Substitution at Consumption)]()

## 3. Ghi nhận thực tế sản xuất tại nhà xưởng (Shop Floor & Labor Reporting)

- [ ] [3000 - Khai báo bắt đầu/kết thúc nguyên công và di chuyển bước công nghệ (Move Transactions / Job On-Off)]()
- [ ] [3010 - Ghi nhận sản lượng hoàn thành và phế phẩm theo từng công đoạn (Yield & Scrap Reporting with Reason Codes)]()
- [ ] [3020 - Ghi nhận giờ công lao động trực tiếp và thời gian máy chạy (Labor & Machine Hour Logging)]()
- [ ] [3030 - Theo dõi và phân loại thời gian dừng máy ngoài kế hoạch (Machine Downtime & Downtime Codes)]()

## 4. Kiểm soát chất lượng & Xử lý bất thường (IPQC & Exception Handling)

- [ ] [4000 - Kiểm tra chất lượng công đoạn và lấy mẫu trên chuyền (In-Process Quality Inspection - IPQC)]()
- [ ] [4010 - Quy trình cách ly hàng lỗi và lệnh sửa chữa/làm lại (Non-Conformance & Rework Order Execution)]()
- [ ] [4020 - Xử lý sự cố lệch chuỗi công nghệ và nhảy bước sản xuất thực tế (Operation Routing Bypass & Out-of-Sequence)]()

## 5. Hoàn thành sản xuất & Đóng lệnh (Completion & Technical Close)

- [ ] [5000 - Nghiệp vụ báo cáo hoàn thành lệnh sản xuất và thu hồi sản phẩm phụ (Work Order Completion, Co/By-product)]()
- [ ] [5010 - Gán số lô/serial cho thành phẩm khi hoàn thành lệnh sản xuất (Lot/Serial Number Assignment at Completion)]()
- [ ] [5020 - Nhập kho thành phẩm và bàn giao tồn kho (Finished Goods Putaway / MFG-STK)]()
- [ ] [5030 - Quy trình Đóng kỹ thuật và quyết toán tài chính Lệnh sản xuất (Technical Completion - TECO & Closing)]()

## 6. Chi phí dở dang WIP & Phân tích chênh lệch (WIP Costing & Variances)

- [ ] [6000 - Nguyên lý tích lũy chi phí dở dang WIP thực tế (Actual WIP Cost Accumulation)]()
- [ ] [6010 - Phân tích chênh lệch giá thành thực tế so với định mức (Production Cost Variance Analysis)]()
- [ ] [6020 - Hạch toán kết chuyển chênh lệch chi phí dở dang cuối kỳ (WIP Valuation & Post-closing Ledger)]()

## 7. Xử lý sự cố thực thi (Execution Troubleshooting)

- [ ] [7000 - Xử lý lệnh sản xuất bị kẹt không đóng được do còn giao dịch treo (Stuck WIP / Open Transactions Preventing Close)]()
- [ ] [7010 - Xử lý lỗi tồn kho âm phát sinh từ cơ chế Backflush (Negative Inventory from Backflush)]()

---

## Ghi chú đặc thù theo từng hệ thống

| Hệ thống | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP** | Lệnh sản xuất (Production Order) quản lý qua các Status hệ thống (REL, TECO, CLSD...) rất chặt chẽ; Backflush cấu hình theo cờ tại Work Center/Material Master. Chênh lệch giá thành xử lý qua Variance Categories chi tiết (Input, Output, Scrap Variance) trước khi Settlement về CO-PA/FI. |
| **Oracle EBS** | WIP module dùng Discrete Job / Standard Job, hỗ trợ cả Move Transaction và Resource Transaction tách biệt. Backflush được gọi là "Pull Transactions"; đóng lệnh có 2 bước rõ rệt: Complete (hoàn thành số lượng) và Close (khóa tài chính), khác với TECO/CLSD của SAP nhưng cùng bản chất 2 lớp. |
| **Epicor** | Ghi nhận qua MES/Shop Floor module dạng "Clock In/Out" theo Job Operation, tích hợp trực tiếp Labor & Machine time vào cùng 1 giao dịch. Material Substitution tại thời điểm tiêu thụ được hỗ trợ ngay trên màn hình Issue Material, thao tác đơn giản hơn SAP/Oracle. |
| **Odoo** | Gộp khái niệm Manufacturing Order (MO) đơn giản hơn Discrete Job của Oracle/SAP; Backflush là mặc định gần như duy nhất (ít tùy chọn Manual Issue chi tiết theo từng nguyên công). Việc gán Lot/Serial khi hoàn thành thực hiện ngay trên màn hình "Mark as Done" của MO, khá trực quan nhưng thiếu các bước kiểm soát trung gian như IPQC tách biệt. |