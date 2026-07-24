---
id: tong-quan-quan-ly-mua-hang-po
title: Tổng quan Quản lý Mua hàng (PO)
sidebar_label: Tổng quan Mua hàng (PO)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/po-mua-hang/tong-quan
sidebar_position: 1
date: 2026-07-24
tags: [erp, procurement, purchasing, po, pr, rfq, tong-quan, roadmap, oracle-ebs, sap, epicor, odoo]
---

# Tổng quan Quản lý Mua hàng (PO)

Trang này tổng hợp lộ trình các bài viết nghiên cứu chuyên sâu về nghiệp vụ **Quản lý Mua hàng (Purchasing / Procurement)**, **Yêu cầu mua sắm (Purchase Requisition - PR)** và **Đơn mua hàng (Purchase Order - PO)** trong hệ thống ERP doanh nghiệp, bao quát cả **Direct Procurement** (mua hàng phục vụ sản xuất) và **Indirect/MRO Procurement** (mua sắm dịch vụ, vật tư tiêu hao, chi tiêu vận hành). Các mục dưới đây đang ở trạng thái chờ viết chi tiết và sẽ được cập nhật liên kết dần sau khi hoàn thành.

## 1. Thiết lập tổ chức mua sắm (Procurement Organization Setup)

- [ ] [1000 Thiết lập cơ cấu tổ chức mua sắm đa công ty, đa chi nhánh (Purchasing Org / Purchasing Group Setup)]()
- [ ] [1010 Thiết lập và phân loại chứng từ mua hàng (Purchase Document Type Configuration - PR, RFQ, PO, Contract)]()

## 2. Thiết lập danh mục & Chính sách mua sắm (Master Data & Sourcing Policy)

- [ ] [2000 Quản lý hồ sơ nhà cung cấp và vòng đời đối tác (Supplier Master & Supplier Lifecycle Management)]()
- [ ] [2010 Thiết lập bảng giá nhà cung cấp và thỏa thuận mua hàng dài hạn (Purchasing Info Record / Blanket PO / Contract)]()
- [ ] [2020 Quy tắc xác định nguồn cung tự động và phân bổ tỷ lệ mua sắm (Sourcing Rules & Quota Arrangement)]()
- [ ] [2030 Thiết lập quy tắc tính thuế đầu vào theo nhà cung cấp/vật tư (Input Tax Determination Rules)]()
- [ ] [2040 Quản lý gia hạn, sửa đổi và hết hiệu lực hợp đồng/thỏa thuận khung (Contract Lifecycle Management - Renewal & Amendment)]()

## 3. Yêu cầu mua sắm & Lựa chọn nhà cung cấp (Requisition & Strategic Sourcing)

- [ ] [3000 Nghiệp vụ Yêu cầu mua hàng và quy trình gom nhu cầu mua sắm (Purchase Requisition - PR & PR Consolidation)]()
- [ ] [3010 Thiết lập luồng phê duyệt PR theo phòng ban, trung tâm chi phí và dự án (PR Approval Workflow)]()
- [ ] [3020 Quy trình mời thầu, yêu cầu báo giá và phân tích so sánh bảng chào giá (RFQ & Bid Analysis)]()
- [ ] [3030 Mua sắm tự phục vụ qua danh mục điện tử và Punch-out cho chi tiêu Indirect/MRO (Self-service Procurement / e-Catalog & Punch-out)]()

## 4. Quản lý Đơn mua hàng & Phê duyệt (Purchase Order Entry & Approval)

- [ ] [4000 Khởi tạo và cấu hình Đơn mua hàng tiêu chuẩn (Standard Purchase Order Entry)]()
- [ ] [4010 Thiết lập luồng phê duyệt PO theo hạn mức tài chính và cấp bậc (PO Approval Workflow / Release Strategy)]()
- [ ] [4020 Quy trình quản lý thay đổi và phiên bản PO sau khi đã phê duyệt (PO Revision & Change Management)]()

## 5. Kiểm soát tiến độ, Nhận hàng & Mua hàng quốc tế (Expediting, Receiving & International Procurement)

- [ ] [5000 Theo dõi tiến độ giao hàng qua cổng thông tin cộng tác tự phục vụ của nhà cung cấp (Supplier Portal / Vendor Self-service Collaboration - Order Confirmation & ASN)]()
- [ ] [5010 Nghiệp vụ nhận hàng mua, kiểm tra chất lượng và nhập kho (PO Receiving, Quality Inspection & Putaway)]()
- [ ] [5020 Xử lý các tình huống giao hàng lỗi, thừa/thiếu số lượng và hoàn trả (Shortage, Over-delivery & Return to Vendor)]()
- [ ] [5030 Thủ tục nhập khẩu, thông quan và điều kiện giao hàng quốc tế (Import Procurement, Customs Clearance & Incoterms)]()

## 6. Các mô hình mua hàng đặc thù (Specialized Purchasing Scenarios)

- [ ] [6000 Nghiệp vụ mua hàng gia công ngoài định mức (Subcontracting PO)]()
- [ ] [6010 Nghiệp vụ mua hàng ký gửi nhà cung cấp và quản lý tồn kho VMI (Consignment PO & Vendor Managed Inventory)]()
- [ ] [6020 Quản lý đơn mua hàng nội bộ giữa các pháp nhân trong tập đoàn (Intercompany Purchase Order)]()
- [ ] [6030 Mua sắm dịch vụ phi vật chất và tài sản cố định (Service PO & Fixed Asset Procurement)]()

## 7. Đối soát hóa đơn & Thanh toán (Invoice Verification & AP Integration)

- [ ] [7000 Nguyên lý đối soát khớp lệnh 3 chiều và 2 chiều (3-Way Match & 2-Way Match: PO - Receipt - Invoice)]()
- [ ] [7010 Xử lý chênh lệch giá/số lượng trên hóa đơn và quy trình mở khóa thanh toán (Invoice Variance & Block/Release)]()
- [ ] [7020 Nghiệp vụ thanh toán tạm ứng và đối trừ hóa đơn nhà cung cấp (Down Payment & Prepayment AP)]()
- [ ] [7030 Phân bổ chi phí mua hàng trên đường vào giá trị tồn kho (Landed Cost / Actual Costing Allocation)]()
- [ ] [7040 Xử lý hóa đơn không qua đơn đặt hàng chính thức cho chi tiêu Indirect (Non-PO Invoice Processing)]()

## 8. Báo cáo & Đánh giá nhà cung cấp (Analytics & Supplier Performance)

- [ ] [8000 Phân tích cơ cấu chi phí mua hàng và hiệu quả chi tiêu (Procurement Spend Analysis)]()
- [ ] [8010 Báo cáo theo dõi công nợ phải trả nhà cung cấp theo tuổi nợ (AP Aging Analysis)]()
- [ ] [8020 Thiết lập bộ chỉ số đánh giá hiệu suất nhà cung cấp (Supplier Evaluation/Scorecard - OTD, Quality, Price)]()

## 9. Lỗi thường gặp & Giải pháp khắc phục (Troubleshooting & Integration Issues)

- [ ] [9000 Xử lý lỗi lệch đơn vị tính mua hàng và đơn vị tính lưu kho (Purchase UOM vs Base UOM Conversion)]()
- [ ] [9010 Kỹ thuật đóng và dọn dẹp các yêu cầu PR/PO treo lâu ngày (Purging / Closing Aged PRs & POs)]()
- [ ] [9020 Xử lý chênh lệch tỷ giá mua hàng đa tiền tệ phát sinh trong kỳ (Exchange Rate Variance - ERV)]()

---

## Ghi chú đặc thù theo từng hệ thống

| Hệ thống | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP** | Phân biệt rõ Purchasing Org (cấp độ công ty/site) và Purchasing Group (nhóm mua hàng). Dùng Source List và Quota Arrangement để tự động gán nhà cung cấp từ khâu chạy MRP. Đối soát hóa đơn qua MIRO quản lý sai lệch (Tolerance limits) rất chặt chẽ. |
| **Oracle EBS** | Mô hình nhà cung cấp quản lý tập trung qua TCA (Trading Community Architecture). Dùng Approved Supplier List (ASL) và Sourcing Rules làm nền tảng. Module Landed Cost Management (LCM) xử lý phân bổ chi phí vận chuyển/thuế nhập khẩu rất mạnh. Luồng duyệt dùng AME (Approval Management Engine) cho phân quyền phức tạp. |
| **Epicor** | Tích hợp chặt giữa MRP và Mua sắm qua PO Suggestions (tự động đề xuất RFQ/PO theo nhu cầu sản xuất). Mua hàng gia công (Subcontracting Operation) thiết kế mượt trực tiếp trên Job Entry. |
| **Odoo** | Đơn giản hóa luồng nghiệp vụ, chuyển RFQ sang PO nhanh gọn. Reordering Rules tự động tạo RFQ nháp khi tồn kho dưới mức tối thiểu. 3-way match có thể bật/tắt tùy chọn nhưng tolerance mặc định ở mức cơ bản, cần tùy biến nếu muốn kiểm soát chặt như SAP/Oracle. |