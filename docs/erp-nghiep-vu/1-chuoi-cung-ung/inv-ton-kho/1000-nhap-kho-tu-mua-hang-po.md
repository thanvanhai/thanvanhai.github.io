---
id: nhap-kho-tu-mua-hang-po
title: Nghiệp vụ Nhập kho từ PO (Receipt from PO) — Luồng dữ liệu, Hạch toán và 3 "Bẫy" thực chiến
sidebar_label: Nhập kho từ PO
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/nhap-kho-tu-po
sidebar_position: 1000
date: 2026-07-22
tags: [erp, inventory, purchase-order, po-receipt, accounting, costing]
---

# Nghiệp vụ Nhập kho từ PO (Receipt from PO) — Luồng dữ liệu, Hạch toán và 3 "Bẫy" thực chiến

Trong chuỗi cung ứng của doanh nghiệp, **Nhập kho từ mua hàng (Receipt from Purchase Order / PO Receipt)** là điểm chạm đầu tiên đưa vật tư bên ngoài vào hệ thống ERP.

Đối với một Developer hoặc Consultant ERP, đây không đơn thuần là nút bấm "Nhập kho" trên màn hình giao diện. Đằng sau nút bấm đó là sự dịch chuyển của các luồng dữ liệu (Data Flow), hạch toán kế toán tự động (SLA) và những ràng buộc chặt chẽ về giá thành.

---

## 1. Luồng dữ liệu hệ thống (Under the Hood)

Khi thủ kho thực hiện xác nhận phiếu nhập kho (thường gọi là **GRN - Goods Receipt Note** hoặc **Receiver**), hệ thống ERP sẽ thực hiện ghi nhận dữ liệu vào các bảng Database cốt lõi.

### Bảng đối chiếu cấu trúc dữ liệu giữa các hệ thống:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Bảng Header Phiếu nhập** | `Erp.RcvHead` | `RCV_SHIPMENT_HEADERS` | `MKPF` (Material Doc Header) |
| **Bảng Detail Phiếu nhập** | `Erp.RcvDtl` | `RCV_SHIPMENT_LINES` | `MSEG` (Material Doc Segment) |
| **Bảng Transaction gốc** | `Erp.PartTran` (TranType: `PUR-STK`) | `MTL_MATERIAL_TRANSACTIONS` | `MSEG` (Movement Type: `101`) |

### Mối quan hệ dữ liệu cốt lõi:
Một lỗi kinh điển khi viết báo cáo đối chiếu của các Developer mới vào nghề là join trực tiếp bảng Nhận hàng (`RcvDtl`) với bảng PO (`PODetail`) mà không qua bảng trung gian hoặc không kiểm tra trạng thái dòng.

Để tính được số lượng **"PO còn lại chưa nhận" (Open PO Qty)**, công thức chuẩn luôn phải là:

$$
\text{Open PO Qty} = \text{PO Ordered Qty} - \text{Total Received Qty} - \text{Total Voided Qty}
$$

---

## 2. Luồng hạch toán kế toán tự động (Subledger Accounting - SLA)

Khi thủ kho nhấn "Save & Post" phiếu nhập kho, hệ thống ERP sẽ tự động sinh bút toán kế toán (Subledger Transaction). Tại thời điểm này, doanh nghiệp **chưa nhận được hóa đơn đỏ (Invoice)** từ nhà cung cấp, nhưng hàng đã vào kho nên bắt buộc phải ghi nhận tăng tài sản và một khoản nợ phải trả tạm tính.

### Tài khoản sử dụng:
* **Tài khoản kho (Inventory Account):** Ghi nhận giá trị hàng tồn kho tăng lên.
* **Tài khoản Trung gian mua hàng (AP Accrual / Nhận hàng chưa hóa đơn):** Tài khoản tạm tính (Liability) để chờ đối chiếu với Invoice sau này.

### Bút toán hạch toán:
* **Nợ (Debit):** `Tài khoản Kho` (152, 156...) — Trị giá hàng nhập kho.
* **Có (Credit):** `Tài khoản AP Accrual` (3387 / 3388 hoặc tài khoản tạm tính tương đương) — Công nợ tạm tính.

> **Bẫy kế toán:** Nếu tài khoản `AP Accrual` cuối tháng không khớp với số liệu "Hàng đã nhận chưa về hóa đơn" trên báo cáo Kho, kế toán trưởng sẽ không thể khóa sổ (Period Close).

---

## 3. Ba "Bẫy" nghiệp vụ thực chiến trong dự án

### ❌ Bẫy 1: Nhập quá số lượng đặt mua trên PO (Over-Receipt Tolerance)

**Tình huống:** Phòng mua hàng đặt mua **100 con** Bu-lông. Nhà cung cấp giao đến **105 con** (do đóng gói dư hoặc cố tình giao thêm). Thủ kho vô tình hoặc cố ý nhập đủ **105 con** vào hệ thống.

* **Hậu quả:** Hệ thống ERP sẽ bị lệch luồng thanh toán (3-way matching). Khi phòng Kế toán nhận hóa đơn 105 con từ NCC, hệ thống sẽ chặn không cho khớp hóa đơn (Invoice Match) vì PO gốc chỉ duyệt mua 100 con.
* **Giải pháp thực chiến:** Trên ERP luôn phải cấu hình **Hạn mức dung sai nhận hàng (Over-Receipt Tolerance)**.
  * Nếu cấu hình Tolerance = 0%: Hệ thống khóa cứng, thủ kho chỉ được nhận tối đa 100 con. Muốn nhận hơn, phòng mua hàng bắt buộc phải sửa PO và được duyệt lại.
  * Nếu cấu hình Tolerance = 5%: Thủ kho được phép nhận tối đa 105 con. Hệ thống tự động cập nhật lại dòng PO thành trạng thái hoàn thành.

---

### ❌ Bẫy 2: Nhập kho trực tiếp (Receipt to Stock) vs Nhập qua kiểm tra chất lượng (Receipt to Inspection)

Không phải hàng hóa nào về đến cổng nhà máy cũng được đưa thẳng vào kệ kho để sử dụng. Nhiều doanh nghiệp sản xuất yêu cầu phải qua bộ phận QC (Quality Control) kiểm thử trước.

* **Luồng đi đúng trên ERP (Hai bước - 2-Step Receiving):**
  1. **Bước 1 (Receipt to Inspection):** Thủ kho nhận hàng từ PO vào khu vực chờ kiểm (Inspection Bin). Lúc này hàng **chưa được tính vào tồn kho khả dụng (On-hand Qty)** để sản xuất, nhưng kế toán đã phải hạch toán tăng tài sản tạm tính.
  2. **Bước 2 (QC Disposition):** Bộ phận QC kiểm tra.
     * Phần đạt (Passed): Thực hiện giao dịch chuyển từ khu kiểm tra vào kho chính thức (`Receipt to Stock`). Lúc này On-hand Qty mới tăng lên.
     * Phần lỗi (Failed): Chuyển vào khu chờ trả lại NCC (Reject Bin) và hệ thống tự động tạo yêu cầu trả hàng (RMA/Debit Memo).
* **Sai lầm thực tế:** Do lười hoặc quy trình thiếu chặt chẽ, thủ kho nhận thẳng vào kho chính thức rồi QC mới ra kiểm. Đến khi QC phát hiện hàng lỗi, thủ kho đã xuất một phần đi sản xuất, dẫn đến việc thu hồi vật tư lỗi cực kỳ hỗn loạn và số liệu tồn kho bị sai lệch hoàn toàn.

---

### ❌ Bẫy 3: Chênh lệch giá mua và Giá thành tiêu chuẩn (Purchase Price Variance - PPV)

Nếu doanh nghiệp của bạn áp dụng phương pháp **Tính giá thành tiêu chuẩn (Standard Costing)**, đây là nơi phát sinh chênh lệch mà các Developer viết báo cáo tài chính rất hay làm sai.

**Ví dụ thực tế:**
* Mã hàng `BUL-001` có giá tiêu chuẩn (Standard Cost) được duyệt đầu năm là: **10 USD/con**.
* Phòng mua hàng đàm phán mua được giá trên PO là: **12 USD/con**.

Khi thủ kho nhận 1 con bu-lông vào kho, hệ thống ERP hạch toán như thế nào?

* **Nợ (Debit):** `Tài khoản Kho` (Tính theo Standard Cost) = **10 USD** (Hàng tồn kho chỉ được phép ghi nhận đúng giá trị tiêu chuẩn).
* **Có (Credit):** `Tài khoản AP Accrual` (Tính theo PO Cost) = **12 USD** (Doanh nghiệp nợ nhà cung cấp 12 USD thực tế).
* **Nợ (Debit):** `Tài khoản chênh lệch giá mua (PPV - Purchase Price Variance)` = **2 USD**.

$$
\text{Debit Inventory (10)} + \text{Debit PPV (2)} = \text{Credit AP Accrual (12)}
$$

* **Hậu quả nếu dev không hiểu:** Khi viết báo cáo kiểm tra giá trị tồn kho nhập trong kỳ, nếu dev lấy `Số lượng nhận` nhân trực tiếp với `Đơn giá PO` cho các doanh nghiệp chạy Standard Cost, số liệu báo cáo của bạn sẽ bị lệch ngay lập tức so với số liệu hạch toán trên Sổ cái (GL).

---

## 4. Checklist cho Developer khi phát triển tính năng/báo cáo Nhập kho từ PO

- [ ] **Kiểm tra trạng thái dòng PO (PO Line Status):** Chỉ cho phép nhận những dòng PO có trạng thái `Approved` và `Open`.
- [ ] **Xử lý Đơn vị tính (UOM):** Luôn kiểm tra trường số lượng đã nhận thực tế theo đơn vị tồn kho gốc (ví dụ: `OurQty` trong Epicor) thay vì lấy số lượng thô của nhà cung cấp (`VendorQty`).
- [ ] **Ràng buộc kỳ kế toán (Period Lock):** Tuyệt đối không cho phép thủ kho nhập lùi ngày nhận hàng (Backdate) về kỳ kế toán đã khóa sổ.
- [ ] **Xử lý tỷ giá (Exchange Rate):** Đối với các PO mua hàng ngoại tệ (USD, EUR), báo cáo đối chiếu tài chính bắt buộc phải lấy đúng tỷ giá tại ngày nhận hàng thực tế (Receipt Date) chứ không phải ngày tạo PO.