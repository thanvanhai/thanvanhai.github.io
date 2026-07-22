---
id: nhap-kho-tra-hang-khach-rma
title: Nghiệp vụ Nhập kho Trả hàng từ Khách (Sales Return) — Quy trình RMA, Định giá hàng trả lại và 3 "Cú lừa" kế toán
sidebar_label: Nhập kho trả hàng từ Khách
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/nhap-kho-tra-hang-khach
sidebar_position: 1020
date: 2026-07-24
tags: [erp, inventory, sales-return, rma, costing, credit-memo, accounting]
---

# Nghiệp vụ Nhập kho Trả hàng từ Khách (Sales Return) — Quy trình RMA, Định giá hàng trả lại và 3 "Cú lừa" kế toán

Trong hoạt động kinh doanh, việc khách hàng trả lại hàng (do lỗi sản xuất, sai quy cách, hoặc không đạt thỏa thuận) là điều không thể tránh khỏi. Trên hệ thống ERP, nghiệp vụ này thường được quản lý thông qua quy trình **RMA (Return Material Authorization - Xác nhận trả lại hàng)**.

Tuy nhiên, đây là một trong những nghiệp vụ "phiền toái" nhất đối với hệ thống ERP. Nó yêu cầu đảo ngược lại toàn bộ luồng Logistics và Tài chính trước đó: Đưa hàng ngược từ khách vào kho, giảm trừ công nợ phải thu, và điều chỉnh lại Doanh thu - Giá vốn hàng bán (COGS).

---

## 1. Luồng nghiệp vụ và Bản đồ dữ liệu (Under the Hood)

Để kiểm soát chặt chẽ, ERP không bao giờ cho phép thủ kho tự ý tạo một phiếu nhập kho trả lại mà không có chứng từ tham chiếu. Luồng đi chuẩn của nghiệp vụ này như sau:

$$\text{Khách yêu cầu trả} \rightarrow \text{Tạo đơn RMA (Sales)} \rightarrow \text{Thủ kho nhập kho RMA (INV)} \rightarrow \text{Kế toán xuất Credit Memo (AR)}$$

### Bản đồ dữ liệu giữa các hệ thống ERP:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Yêu cầu trả hàng (RMA)** | `Erp.RMAHead` / `Erp.RMADtl` | `OE_ORDER_HEADERS_ALL` (Order Category: `RETURN`) | Return Order (`RE`) |
| **Giao dịch nhập kho** | `Erp.PartTran` (TranType: `RMA-INS` hoặc `RMA-STK`) | `MTL_MATERIAL_TRANSACTIONS` (Transaction Source: RMA) | `MSEG` (Movement Type: `651` - Blocked hoặc `653` - Unrestricted) |
| **Hóa đơn giảm trừ nợ** | `Erp.InvcHead` / `InvcDtl` (Credit Memo) | `RA_CUSTOMER_TRX_ALL` (Credit Memo) | Credit Memo (`RE` Invoice) |

---

## 2. Hạch toán kế toán Trả hàng bán (Sales Return Accounting)

Khi hoàn thành việc nhập kho trả hàng, kế toán phải thực hiện 2 bút toán độc lập để đảo ngược lại nghiệp vụ bán hàng trước đó.

### Bút toán 1: Giảm doanh thu và công nợ phải thu (AR Credit Memo)
* **Nợ (Debit):** `Tài khoản Doanh thu hàng bán bị trả lại` (5212 hoặc giảm trừ trực tiếp 511) — Giảm doanh thu kỳ này.
* **Nợ (Debit):** `Tài khoản Thuế GTGT đầu ra được giảm` (3331) — Nếu có.
* **Có (Credit):** `Tài khoản Phải thu khách hàng` (131) — Giảm số tiền khách hàng phải trả.

### Bút toán 2: Nhập lại kho và Giảm giá vốn (RMA Receipt)
* **Nợ (Debit):** `Tài khoản Kho` (156, 155) — Tăng lại giá trị hàng tồn kho.
* **Có (Credit):** `Tài khoản Giá vốn hàng bán (COGS)` (632) — Giảm giá vốn tương ứng của lô hàng đã bán.

---

## 3. Ba "Bẫy" thực chiến kinh điển trong dự án ERP

### ❌ Bẫy 1: "Cơn ác mộng" định giá hàng trả lại (Inventory Valuation) dưới phương pháp Average/FIFO Costing

Đây là lỗi cực kỳ phổ biến khiến giá trị tồn kho cuối tháng của doanh nghiệp bị sai lệch nghiêm trọng.

**Tình huống:** 3 tháng trước, bạn bán sản phẩm `Part-01` cho khách hàng. Tại thời điểm đó, **Giá vốn (COGS) xuất kho là 10 USD/con**. Hiện tại, do biến động thị trường, **Giá bình quân (Average Cost) trong kho đã tăng lên 12 USD/con**. Khách hàng trả lại hàng.

**Hệ thống ERP sẽ nhập kho con hàng này với đơn giá nào?**
* **Lỗi hệ thống (Lấy theo giá hiện tại):** Hệ thống nhập kho tự động lấy giá trị trung bình hiện tại (**12 USD**) để nạp vào kho.
  * *Hậu quả:* Doanh nghiệp tự nhiên được "lời ảo" 2 USD trong kho, đồng thời tài khoản Giá vốn (632) bị giảm trừ đi 12 USD (trong khi lúc bán ra chỉ ghi nhận giá vốn 10 USD). Báo cáo lỗ lãi (P&L) bị sai lệch.
* **Giải pháp thực chiến (Link to Original Shipment):** Hệ thống ERP chuẩn bắt buộc phải yêu cầu nhập dòng RMA **tham chiếu trực tiếp đến số Phiếu xuất kho cũ (Shipment/Invoice)**. Hệ thống sẽ tự động tìm lại giá vốn gốc tại thời điểm xuất kho ngày xưa (**10 USD**) để hạch toán nhập kho ngược lại, bất kể giá trị hiện tại của kho là bao nhiêu.

---

### ❌ Bẫy 2: Thảm họa "Nhập thẳng vào kho bán" (Return to Unrestricted Stock) mà không qua kiểm tra

Khi nhận lại hàng từ khách, tâm lý thủ kho thường muốn quét nhanh để xong việc nên nhận thẳng vào kho chứa hàng bán (Unrestricted Stock).

* **Hậu quả:** Hàng của khách trả lại thường bị móp méo, lỗi kỹ thuật hoặc thiếu linh kiện. Nếu đưa thẳng vào kho bán, hệ thống ERP sẽ tính đây là hàng sẵn sàng bán. Nhân viên kinh doanh nhìn thấy On-hand Qty tăng lên liền bán ngay cho khách hàng tiếp theo. Kết quả là doanh nghiệp tiếp tục bị khách hàng thứ hai khiếu nại vì giao hàng lỗi.
* **Quy trình đúng trên ERP:** Tất cả các giao dịch nhập kho RMA bắt buộc phải đi qua **Kho biệt trữ/Kho chờ kiểm (Inspection/Quarantine Warehouse)**. 
  * Hàng nhập kho sẽ ở trạng thái khóa (Blocked Stock).
  * Bộ phận QC kiểm tra:
    * Nếu hàng vẫn tốt $\rightarrow$ Làm lệnh chuyển kho (Transfer) sang kho bán thường.
    * Nếu hàng lỗi cần sửa chữa $\rightarrow$ Chuyển sang kho bảo hành (Work Order sửa chữa).
    * Nếu hàng hỏng hoàn toàn $\rightarrow$ Làm thủ tục hủy (Scrap).

---

### ❌ Bẫy 3: Trả hàng không có chứng từ tham chiếu (No-Reference Returns)

Trong thực tế, có những trường hợp khách hàng trả lại hàng đã mua từ 2 - 3 năm trước (hệ thống ERP cũ đã tắt) hoặc không thể tìm lại số PO/Hóa đơn gốc để đối chiếu.

* **Bẫy kế toán:** Làm thế nào để kế toán xuất Credit Memo giảm trừ công nợ khi không có hóa đơn gốc? Nếu cho phép tạo RMA tự do (Unreferenced RMA), nhân viên kinh doanh có thể thông đồng với khách hàng để tạo các phiếu trả hàng khống nhằm xóa nợ phải thu (AR).
* **Giải pháp kiểm soát:** 
  * Phân quyền duyệt chặt chẽ trên ERP (Approval Workflow) cho các đơn RMA không có tham chiếu.
  * Bắt buộc kế toán phải áp một **Đơn giá ước tính (Estimated Return Value)** hoặc lấy theo giá bán gần nhất của sản phẩm đó để hạch toán tạm tính, tuyệt đối không được để đơn giá bằng 0.

---

## 4. Checklist dành cho Developer khi viết báo cáo và tính năng RMA

- [ ] **Kiểm tra liên kết Invoice gốc:** Khi lập trình màn hình tạo RMA, bắt buộc phải có tính năng tìm kiếm và tải dữ liệu từ Hóa đơn gốc (`AR Invoice`) hoặc Phiếu xuất kho gốc (`Shipment`) để tự động áp giá vốn gốc.
- [ ] **Cấu hình phí nhập lại kho (Restocking Fee):** Nhiều doanh nghiệp phạt khách hàng 10 - 15% trị giá hàng trả lại nếu lỗi không thuộc về nhà sản xuất. Hãy đảm bảo ERP có trường cấu hình tỷ lệ % hoặc số tiền phạt này để tự trừ vào Credit Memo của khách.
- [ ] **Theo dõi trạng thái RMA Receipt:** Viết báo cáo đối chiếu giữa số lượng khách hàng đăng ký trả trên đơn RMA (`RMA Authorized Qty`) và số lượng thủ kho thực nhận (`RMA Received Qty`) để phát hiện các trường hợp khách giao thiếu hoặc giao thừa hàng lỗi.
- [ ] **Ràng buộc thuế suất:** Khi xuất Credit Memo giảm nợ, bắt buộc phải lấy đúng mức thuế suất GTGT tại thời điểm xuất hóa đơn gốc (ví dụ hóa đơn gốc năm ngoái thuế 8%, năm nay thuế đã đổi thành 10%, Credit Memo vẫn phải chạy thuế 8%).