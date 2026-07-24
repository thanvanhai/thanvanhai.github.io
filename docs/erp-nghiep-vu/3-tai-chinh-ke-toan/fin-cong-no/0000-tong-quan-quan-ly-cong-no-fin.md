---
id: tong-quan-quan-ly-cong-no-fin
title: Tổng quan Quản lý Công nợ (AP/AR)
sidebar_label: Tổng quan Công nợ (AP/AR)
slug: /erp-nghiep-vu/3-tai-chinh-ke-toan/fin-cong-no/tong-quan
sidebar_position: 1
date: 2026-07-24
tags: [erp, finance, accounting, ap, ar, netting, dunning, aging, gr-ir, notes-receivable, tong-quan, roadmap]
---

# Tổng quan Quản lý Công nợ (AP/AR)

Trang này tổng hợp lộ trình các bài viết nghiên cứu chuyên sâu về nghiệp vụ **Quản lý Công nợ Phải thu (Accounts Receivable - AR)** và **Phải trả (Accounts Payable - AP)** trong hệ thống ERP doanh nghiệp. Phân hệ này đóng vai trò đối soát, xử lý hóa đơn và thanh toán dòng tiền phát sinh từ các giao dịch mua bán hàng hóa, đồng thời là điểm tiếp nhận dữ liệu giao dịch từ hai phân hệ Chuỗi cung ứng OM (Bán hàng) và PO (Mua hàng). Nghiệp vụ thuế khấu trừ tại nguồn (Withholding Tax) được trình bày chi tiết ở phân hệ `fin-thue`; các bài viết liên quan trong nhóm 3 sẽ dẫn liên kết chéo sang đó khi phát sinh tại thời điểm chi tiền.

Các mục dưới đây sẽ được cập nhật liên kết dần sau khi bài viết tương ứng được hoàn thành.

## 1. Thiết lập danh mục & Quy tắc tài chính (Master Data & Financial Rules)

- [ ] [1000 - Cấu hình điều khoản thanh toán và lịch thanh toán định kỳ (Payment Terms & Schedules Setup)]()
- [ ] [1010 - Thiết lập nhóm hạch toán công nợ và tự động hóa định khoản Sổ cái (Posting Groups & GL Accounts Mapping)]()
- [ ] [1020 - Thiết lập hạn mức tín dụng và chính sách khóa hóa đơn tự động (Credit Hold & Billing Block Rules)]()

## 2. Quản lý Công nợ Phải thu (Accounts Receivable - AR)

- [ ] [2000 - Nghiệp vụ ghi nhận hóa đơn bán hàng và hạch toán doanh thu công nợ (AR Invoice Entry & Posting)]()
- [ ] [2010 - Nghiệp vụ nhận tiền thanh toán và đối trừ hóa đơn khách hàng (Cash Receipt & Invoice Allocation/Application)]()
- [ ] [2020 - Quy trình xử lý bù trừ công nợ giữa cùng một đối tượng vừa mua vừa bán (AP/AR Netting)]()
- [ ] [2030 - Nghiệp vụ trích lập dự phòng nợ phải thu khó đòi và xử lý xóa nợ (Bad Debt Provision & Write-off)]()
- [ ] [2040 - Tất toán khoản tạm ứng khách hàng với hóa đơn chính thức (AR Down Payment Clearing)]()
- [ ] [2050 - Quản lý vòng đời Hối phiếu/Séc phải thu (Notes Receivable & Bill of Exchange Lifecycle)]()

## 3. Quản lý Công nợ Phải trả (Accounts Payable - AP)

- [ ] [3000 - Ghi nhận hóa đơn nhà cung cấp từ đơn mua hàng và hóa đơn chi phí trực tiếp (AP Invoice Match - PO & Non-PO)]()
- [ ] [3010 - Quy trình lập đề nghị thanh toán và phê duyệt chi tiền nhiều cấp (Payment Request & Approval Flow)]()
- [ ] [3020 - Nghiệp vụ chi tiền thanh toán và đối trừ hóa đơn nhà cung cấp (Vendor Payment Run & Allocation)]() *(có phát sinh khấu trừ thuế nhà thầu/TNCN tại thời điểm chi tiền — xem chi tiết ở `fin-thue`)*
- [ ] [3030 - Quản lý dung sai chênh lệch thanh toán và xử lý số dư nhỏ lẻ (Payment Discrepancy & Tolerance)]()
- [ ] [3040 - Tất toán khoản tạm ứng nhà cung cấp với hóa đơn chính thức (AP Down Payment Clearing)]()
- [ ] [3050 - Quản lý vòng đời Hối phiếu/Séc phải trả (Notes Payable & Bill of Exchange Lifecycle)]()

## 4. Đánh giá lại & Đối soát khóa sổ cuối kỳ (Revaluation & Period-End Closing)

- [ ] [4000 - Nghiệp vụ đánh giá lại số dư công nợ gốc ngoại tệ cuối kỳ kế toán (Foreign Exchange Revaluation for AP/AR)]()
- [ ] [4010 - Quy trình gửi thư xác nhận và đối chiếu số dư công nợ định kỳ (AP/AR Balance Confirmation)]()
- [ ] [4020 - Quy trình khóa sổ phân hệ công nợ và đối chiếu khớp số dư với Sổ cái (AP/AR Subledger to GL Reconciliation)]()
- [ ] [4030 - Đối chiếu và xử lý tài khoản trung gian Nhận hàng chưa có hóa đơn (GR/IR Clearing Account Reconciliation)]()

## 5. Báo cáo & Phân tích Công nợ (AP/AR Analytics & Dunning)

- [ ] [5000 - Thiết lập báo cáo phân tích tuổi nợ phải thu và quy trình nhắc nợ khách hàng (AR Aging Analysis & Dunning)]()
- [ ] [5010 - Báo cáo phân tích tuổi nợ phải trả và dự báo kế hoạch dòng tiền chi ra (AP Aging & Cash Outflow Forecasting)]()
- [ ] [5020 - Quản lý tranh chấp công nợ với khách hàng (AR Dispute Management)]()
- [ ] [5030 - Lập và gửi sao kê công nợ định kỳ cho khách hàng/nhà cung cấp (Statement of Account Generation)]()

## 6. Lỗi thường gặp & Giải pháp khắc phục (Troubleshooting & Exceptions)

- [ ] [6000 - Xử lý lỗi đối trừ sai hóa đơn hoặc thanh toán nhầm đối tượng (Allocation Error Correction)]()
- [ ] [6010 - Khắc phục sự cố lệch số dư giữa Sổ chi tiết công nợ và Sổ cái (Subledger vs General Ledger Out of Balance)]()
- [ ] [6020 - Nghiệp vụ xử lý hóa đơn điều chỉnh tăng/giảm và hóa đơn trả lại (Debit/Credit Memo Posting & Matching)]()
- [ ] [6030 - Phát hiện và xử lý hóa đơn nhà cung cấp bị nhập trùng (Duplicate Invoice Detection)]()
- [ ] [6040 - Xử lý khoản tiền thu về chưa xác định được đối tượng/hóa đơn (Unapplied Cash / On-Account Handling)]()

---

## Ghi chú đặc thù theo từng hệ thống ERP

Trong các hệ thống ERP lớn, triết lý thiết kế và cách quản lý công nợ có những sự khác biệt rõ rệt về mặt kiến trúc:

| Hệ thống | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP S/4HANA** | Sử dụng mô hình **Business Partner (BP)** thông qua cơ chế tích hợp đối tác CVI (Customer Vendor Integration) để quản lý chung Khách hàng và Nhà cung cấp. Định khoản tự động được kiểm soát chặt chẽ bằng Mã khóa hạch toán (Posting Key - ví dụ 01, 15, 31) và Tài khoản đối chiếu (Reconciliation Account/GL control account). Chạy thanh toán tự động hàng loạt qua chương trình F110 (Automatic Payment Program). Tạm ứng dùng Special GL Indicator riêng biệt với hóa đơn thường. |
| **Oracle EBS** | Phân hệ AP và AR là hai phân hệ độc lập hoàn toàn với các bảng cơ sở dữ liệu riêng biệt. Dùng kiến trúc **TCA (Trading Community Architecture)** để quản lý danh mục đối tác ở mức độ Tập đoàn/Công ty (Party/Account/Site). Chức năng **Netting** (bù trừ công nợ) và **Supplier Merge** (gộp nhà cung cấp) rất mạnh mẽ và có luồng phê duyệt chặt chẽ. |
| **Epicor** | Toàn bộ hóa đơn AP và AR khi nhập liệu phải được đưa vào các **Nhóm (Group)** giao dịch (ví dụ AP Invoice Group, Cash Receipts Group). Các giao dịch này chỉ thực sự tác động và ghi sổ vào Sổ cái sau khi người dùng thực hiện thao tác **Post Group**. Quản lý đa tiền tệ và đối chiếu chênh lệch tỷ giá (Realized/Unrealized Gain/Loss) rất tường minh. |
| **Odoo** | Sử dụng một phân hệ **Invoicing/Accounting** hợp nhất. Khách hàng và Nhà cung cấp chỉ là các "Đối tác" (Partners). Odoo không sử dụng khái niệm Sổ chi tiết (Subledger) truyền thống, tất cả định khoản đổ thẳng vào tài khoản Sổ cái chung nhưng được gắn tag đối tác (Partner Tag). Cơ chế đối trừ (Reconciliation) hoạt động dựa trên thuật toán so khớp thông minh (Matching Engine) rất linh hoạt và dễ sử dụng nhưng cần kiểm soát kỹ để tránh đối trừ nhầm. |