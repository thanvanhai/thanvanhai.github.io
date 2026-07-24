---
id: tong-quan-quan-ly-ban-hang-om
title: Tổng quan Quản lý Đơn hàng (OM) - Bản mở rộng
sidebar_label: Tổng quan Bán hàng (OM)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/om-ban-hang/tong-quan
sidebar_position: 1
date: 2026-07-24
tags: [erp, sales, om, so, tong-quan, roadmap, oracle-ebs, sap, epicor, odoo]
---

# Tổng quan Quản lý Đơn hàng (OM/SO)

Trang này tổng hợp lộ trình các bài viết nghiên cứu chuyên sâu về nghiệp vụ **Quản lý Đơn hàng (Order Management - OM)** và **Đơn bán hàng (Sales Order - SO)** trong hệ thống ERP/OMS đa kênh. Các mục dưới đây đang ở trạng thái chờ viết chi tiết và sẽ được cập nhật liên kết dần sau khi hoàn thành.
## 1. Thiết lập tổ chức bán hàng (Sales Organization Setup)

- [ ] [1000 Thiết lập cơ cấu tổ chức bán hàng đa công ty, đa kênh (Sales Org / Operating Unit / Business Unit Setup)]()
- [ ] [1010 Thiết lập loại chứng từ đơn hàng (Sales Document Type Configuration)]()

## 2. Thiết lập danh mục & Chính sách thương mại (Master Data & Commercial Policy)

- [ ] [2000 Thiết lập hồ sơ khách hàng và phân nhóm phân phối (Customer Master & Segmentation)]()
- [ ] [2010 Quản lý hạn mức tín dụng khách hàng và luồng khóa đơn (Credit Limit & Credit Hold Setup)]()
- [ ] [2020 Thiết lập bảng giá đa kênh và quy tắc áp dụng chiết khấu (Multi-channel Price List & Discount Rules)]()
- [ ] [2030 Thiết lập chương trình khuyến mãi, quà tặng tự động (Promotion & Gift Rules Engine)]()
- [ ] [2040 Thiết lập chính sách Rebate/Chiết khấu hồi tố (Rebate Agreement Management)]()
- [ ] [2050 Thiết lập quy tắc xác định thuế theo khu vực/khách hàng/sản phẩm (Tax Determination Rules)]()

## 3. Tiếp nhận & Khởi tạo đơn hàng (Order Ingestion & Capture)

- [ ] [3000 Nghiệp vụ Báo giá khách hàng và quy trình chuyển đổi sang SO (Sales Quotation to SO)]()
- [ ] [3010 Nhập đơn bán hàng thủ công và đơn hàng mẫu (Manual Sales Order Entry)]()
- [ ] [3020 Cơ chế đồng bộ đơn hàng tự động từ Website/POS/Sàn TMĐT về ERP (Omnichannel Order Sync)]()
- [ ] [3030 Quản lý đơn đặt hàng trước và đơn hàng chờ (Pre-order & Backorder Management)]()
- [ ] [3040 Quản lý hợp đồng khung và đơn hàng theo lịch giao (Blanket Sales Agreement / Scheduling Agreement)]()
- [ ] [3050 Cấu hình sản phẩm theo yêu cầu khách hàng trước khi tạo đơn (Configure-to-Order / Product Configurator)]()
- [ ] [3060 Quản lý đơn hàng thuê bao/dịch vụ định kỳ (Subscription & Recurring Order)]()

## 4. Kiểm tra điều kiện & Phân bổ tồn kho (Order Validation & Allocation)

- [ ] [4000 Cơ chế kiểm tra khả năng cung ứng hàng hóa (ATP - Available to Promise)]()
- [ ] [4010 Quy tắc giữ hàng và phân bổ tồn kho tối ưu (Inventory Allocation & Reservation Rules)]()
- [ ] [4020 Thiết lập luồng phê duyệt đơn hàng tự động theo điều kiện (Auto-approval Workflow)]()
- [ ] [4030 Cơ chế kiểm tra tín dụng và chặn giao/xuất hóa đơn tại thời điểm lưu đơn (Credit Check, Delivery Block & Billing Block)]()

## 5. Điều phối giao hàng & Vận chuyển (Fulfillment & Logistics Integration)

- [ ] [5000 Chỉ thị chuẩn bị hàng, gom đơn và phân vùng đóng gói (Pick Release & Wave Planning)]()
- [ ] [5010 Giải pháp kết nối đơn vị vận chuyển thứ ba và theo dõi hành trình (3PL Logistics Integration & Tracking)]()
- [ ] [5020 Xác nhận giao hàng thành công và bàn giao trách nhiệm (Ship Confirmation / POD)]()
- [ ] [5030 Quản lý thay đổi đơn hàng sau khi đã xác nhận/phân bổ tồn kho (Order Change Management)]()

## 6. Các mô hình bán hàng đặc thù (Specialized Sales Scenarios)

- [ ] [6000 Quy trình bán hàng Drop-shipment từ nhà cung cấp (Drop-ship Order Flow)]()
- [ ] [6010 Quy trình bán hàng liên kết mua hàng/sản xuất trực tiếp (Back-to-back Order Flow)]()
- [ ] [6020 Quản lý đơn hàng ký gửi đại lý và đối soát tiêu dùng (Consignment Sales Order)]()
- [ ] [6030 Quy trình xử lý đơn hàng xuất khẩu và thủ tục liên quan (Export Sales Order Flow)]()
- [ ] [6040 Quản lý đơn hàng nội bộ giữa các công ty/chi nhánh (Intercompany Sales Order)]()

## 7. Hóa đơn & Ghi nhận tài chính (Billing & Revenue)

- [ ] [7000 Xuất hóa đơn bán hàng và đồng bộ hóa đơn điện tử (AR Invoicing & E-Invoice Integration)]()
- [ ] [7010 Quy tắc ghi nhận doanh thu theo tiêu chuẩn kế toán (Revenue Recognition Rules - IFRS 15 / VAS)]()
- [ ] [7020 Khấu trừ công nợ và đối soát dòng tiền cổng thanh toán (Payment Gateway Reconciliation)]()
- [ ] [7030 Xuất hóa đơn theo tiến độ/mốc thời gian (Billing Plan / Milestone Billing)]()
- [ ] [7040 Xử lý tạm ứng và hóa đơn đặt cọc (Down Payment / Advance Payment Invoice)]()

## 8. Đổi trả hàng & Xử lý khiếu nại (RMA & Reverse Logistics)

- [ ] [8000 Quy trình phê duyệt yêu cầu khách trả hàng (RMA Approval Flow)]()
- [ ] [8010 Nhập kho hàng trả lại và hạch toán giảm trừ công nợ (RMA Receipt & Credit Memo)]()
- [ ] [8020 Xử lý đơn hàng đổi mới hoặc bồi thường hư hỏng (Exchange & Damage Claims)]()

## 9. Báo cáo & Tối ưu vận hành (Analytics & Troubleshooting)

- [ ] [9000 Báo cáo tỷ lệ hoàn thành đơn hàng và phân tích backlog (Order Fill Rate & Backlog Report)]()
- [ ] [9010 Phân tích hiệu suất bán hàng đa kênh và đóng góp doanh thu (Omnichannel Sales Analytics)]()
- [ ] [9020 Cách xử lý lỗi giữ hàng ảo và nghẽn đơn giờ cao điểm (Ghost Reservation & Concurrency Issues)]()
- [ ] [9030 Quản lý đa tiền tệ và hợp nhất báo cáo liên công ty (Multi-currency & Multi-company Consolidation)]()

---

## Ghi chú đặc thù theo từng hệ thống

| Hệ thống | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP** | Sales Area (Sales Org – Distribution Channel – Division) và Condition Technique (pricing) là nền tảng cốt lõi, chi phối toàn bộ cấu hình phía sau. Credit Check, Delivery Block, Billing Block là 3 cơ chế độc lập nhau. |
| **Oracle EBS** | TCA (Customer model theo Party/Account/Site), Advanced Pricing, và Blanket Sales Agreement là 3 cấu phần đặc trưng. ATO/PTO là mô hình back-to-back đặc thù. |
| **Epicor** | Mạnh về Configurator (Configure-to-Order) và Order Acknowledgement, phù hợp với doanh nghiệp sản xuất theo đơn đặt hàng. |
| **Odoo** | Nhẹ hơn về Credit Management và Configure-to-Order (cần module mở rộng), nhưng tích hợp Sales–Inventory–Invoicing chặt hơn, ít bước trung gian. Có sẵn module Subscriptions cho mô hình thuê bao. |