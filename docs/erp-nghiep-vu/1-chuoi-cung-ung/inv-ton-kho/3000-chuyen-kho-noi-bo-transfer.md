---
id: chuyen-kho-noi-bo-transfer
title: Nghiệp vụ Chuyển kho Nội bộ (Inter-warehouse Transfer) — Cơ chế In-transit, Hạch toán 2 bước và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Chuyển kho Nội bộ
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/chuyen-kho-noi-bo
sidebar_position: 3000
date: 2026-07-29
tags: [erp, inventory, transfer-order, in-transit, inter-org, sql-audit, oracle-ebs, epicor]
---

# Nghiệp vụ Chuyển kho Nội bộ (Inter-warehouse Transfer) — Cơ chế In-transit, Hạch toán 2 bước và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong các doanh nghiệp có quy mô lớn với nhiều nhà máy, chi nhánh hoặc kho bãi vệ tinh, việc điều chuyển hàng hóa qua lại là hoạt động diễn ra hàng ngày. Nghiệp vụ này trên hệ thống ERP được quản lý bằng phân hệ **Chuyển kho nội bộ (Inter-warehouse / Inter-org / Plant-to-Plant Transfer)**.

Tuy nhiên, đây là một nghiệp vụ rất dễ phát sinh chênh lệch số liệu thực tế do có yếu tố vận chuyển vật lý trên đường. Nếu lập trình viên và kế toán không hiểu rõ cơ chế khóa giữ và trung chuyển hàng hóa, hệ thống sẽ rất dễ bị ảo số dư tồn kho.

---

## 1. Bản chất Nghiệp vụ và Bản đồ dữ liệu (Under the Hood)

Trong thực tế vận hành ERP, nghiệp vụ điều chuyển kho được chia làm 2 loại chính:

1. **Chuyển kho 1 bước (Direct Transfer / Subinventory Transfer):** Áp dụng khi hai kho nằm gần nhau (ví dụ từ Kho Nguyên liệu sang Kho Sản xuất tại cùng một nhà máy). Hàng xuất đi sẽ ngay lập tức được nhập vào kho mới.
2. **Chuyển kho 2 bước (In-transit Transfer / Transfer Order):** Áp dụng khi hai kho nằm cách xa nhau về mặt vật lý (ví dụ chuyển từ Kho Hà Nội vào Kho Sài Gòn). Hàng xuất đi cần thời gian di chuyển trên đường (In-transit), lúc này hàng bắt buộc phải được chuyển vào một kho tạm ảo gọi là **Kho trung chuyển (In-transit Inventory)** để theo dõi số lượng đi đường.

### Bản đồ dữ liệu giữa các hệ thống ERP:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Yêu cầu điều chuyển** | `Erp.TFOrdHead` / `TFOrdDtl` | `MTL_INTERORG_PARAMETERS` | Transfer Order / Stock Transport Order (`STO`) |
| **Giao dịch xuất kho (Ship)** | `Erp.PartTran` (TranType: `STK-PLT`) | `MTL_MATERIAL_TRANSACTIONS` (Intransit Shipment) | `MSEG` (Movement Type: `313` hoặc `303`) |
| **Giao dịch nhập kho (Receipt)** | `Erp.PartTran` (TranType: `PLT-STK`) | `MTL_MATERIAL_TRANSACTIONS` (Intransit Receipt) | `MSEG` (Movement Type: `315` hoặc `305`) |

---

## 2. Luồng Hạch toán Kế toán (Transfer Accounting)

### Trường hợp 1: Chuyển kho 1 bước (Không qua tài khoản trung chuyển)
Bút toán này chỉ dịch chuyển giá trị tài sản từ kho này sang kho khác, tổng giá trị tài sản của doanh nghiệp không đổi.
* **Nợ (Debit):** `Tài khoản Kho nhận` (156, 155)
* **Có (Credit):** `Tài khoản Kho xuất` (156, 155)

### Trường hợp 2: Chuyển kho 2 bước (Qua tài khoản hàng đi đường)
* **Bút toán tại thời điểm xuất hàng (Shipment):**
  * **Nợ (Debit):** `Tài khoản Hàng mua đang đi trên đường` (151 hoặc 1567 - In-transit Inventory) — Ghi nhận hàng đang nằm trên xe tải.
  * **Có (Credit):** `Tài khoản Kho xuất` (156, 155) — Giảm trừ số lượng tại kho xuất gốc.
* **Bút toán tại thời điểm nhận hàng (Receipt):**
  * **Nợ (Debit):** `Tài khoản Kho nhận` (156, 155) — Ghi nhận hàng đã vào kho đích an toàn.
  * **Có (Credit):** `Tài khoản Hàng mua đang đi trên đường` (151 / 1567) — Giảm trừ tài khoản đi đường.

---

## 3. Hai "Bẫy" thực chiến và Các câu SQL Audit rà soát lỗi hệ thống

---

### ❌ Kịch bản 1: Thảm họa "Hàng treo trên đường" quá lâu không nhận (Lost in Transit)

**Tình huống:** Kho Hà Nội làm lệnh xuất chuyển kho 2 bước gửi **100 cái laptop** vào Kho Sài Gòn. Tuy nhiên, trên đường vận chuyển, xe tải gặp sự cố làm hỏng/thất thoát **5 cái laptop**. Khi xe vào đến nơi, thủ kho Sài Gòn chỉ làm phiếu nhập thực tế **95 cái**. 

* **Hậu quả:** 5 cái laptop bị mất sẽ bị **treo vĩnh viễn ở Kho trung chuyển ảo (In-transit)** trên hệ thống ERP năm này qua năm khác. Kế toán không phát hiện ra, dẫn đến việc doanh nghiệp bị khống tài sản ảo trên báo cáo tài chính.
* **SQL Audit rà soát:** Tìm tất cả các đơn điều chuyển kho có số lượng xuất lớn hơn số lượng thực nhận, và ngày xuất hàng đã quá lâu (ví dụ > 7 ngày) chưa được xử lý.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    tod.TFOrdNum AS [Số đơn điều chuyển],
    tod.PartNum AS [Mã vật tư],
    tod.ShipQty AS [Số lượng đã xuất],
    tod.RecQty AS [Số lượng thực nhận],
    (tod.ShipQty - tod.RecQty) AS [Số lượng bị treo trên đường],
    -- Tìm ngày xuất hàng gần nhất của đơn này
    (SELECT MAX(pt.TranDate) 
     FROM Erp.PartTran pt 
     WHERE pt.Company = tod.Company AND pt.PackNum = tod.TFOrdNum AND pt.TranType = 'STK-PLT') AS [Ngày xuất hàng]
FROM Erp.TFOrdDtl tod
INNER JOIN Erp.TFOrdHead toh 
    ON tod.Company = toh.Company AND tod.TFOrdNum = toh.TFOrdNum
WHERE toh.OpenOrder = 1                             -- Đơn hàng vẫn mở
  AND tod.ShipQty > tod.RecQty                      -- Số xuất lớn hơn số nhận
  -- Lọc các đơn xuất hàng đã quá 7 ngày chưa được nhận hết
  AND (SELECT MAX(pt.TranDate) FROM Erp.PartTran pt WHERE pt.Company = tod.Company AND pt.PackNum = tod.TFOrdNum AND pt.TranType = 'STK-PLT') < GETDATE() - 7;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    ms.shipment_header_id,
    ms.shipment_line_id,
    rsh.shipment_num AS [Số phiếu chuyển kho],
    msi.segment1 AS item_code,
    ms.quantity AS intransit_qty,                     -- Số lượng bị treo trên đường
    rsh.shipped_date AS [Ngày xuất hàng],
    -- Số ngày đã bị treo trên đường
    ROUND(SYSDATE - rsh.shipped_date) AS days_in_transit
FROM mtl_supply ms
INNER JOIN rcv_shipment_headers rsh 
    ON ms.shipment_header_id = rsh.shipment_header_id
INNER JOIN mtl_system_items_b msi 
    ON ms.item_id = msi.inventory_item_id AND ms.to_organization_id = msi.organization_id
WHERE ms.supply_type_code = 'SHIPMENT'              -- Trạng thái hàng đang đi trên đường
  AND ROUND(SYSDATE - rsh.shipped_date) > 7          -- Treo quá 7 ngày chưa nhận
ORDER BY days_in_transit DESC;
```

---

### ❌ Kịch bản 2: Lệch giá vốn khi điều chuyển giữa các Chi nhánh/Site có giá Standard Cost khác nhau

**Tình huống:** Bạn điều chuyển hàng hóa giữa hai Chi nhánh (Site A và Site B) thuộc cùng một tập đoàn. 
* Tại Site A: Sản phẩm áp dụng Standard Cost là **10 USD/cái**.
* Tại Site B: Sản phẩm áp dụng Standard Cost là **11 USD/cái**.
* Khi điều chuyển 100 cái, giá trị xuất đi tại Site A là **1.000 USD**, nhưng giá trị nhận vào tại Site B lại là **1.100 USD**.

* **Hậu quả:** Xuất hiện khoản chênh lệch giá **100 USD**. Nếu hệ thống ERP không tự động hạch toán khoản này vào tài khoản **Chênh lệch giá điều chuyển (Inter-org Variance)**, báo cáo đối chiếu tài khoản tổng hợp (Trial Balance) cuối tháng của doanh nghiệp sẽ bị lệch và không thể cân sổ kế toán.
* **SQL Audit rà soát:** Tìm tất cả các giao dịch điều chuyển liên site/liên org phát sinh chênh lệch giá trị hạch toán giữa đầu xuất và đầu nhận.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pt.TranDate AS [Ngày giao dịch],
    pt.JobNum AS [Số đơn chuyển kho],
    pt.PartNum AS [Mã sản phẩm],
    pt.TranQty AS [Số lượng],
    pt.MtlUnitCost AS [Đơn giá xuất],
    -- Tìm đơn giá nhận tương ứng từ site đích
    (SELECT TOP 1 pt_rec.MtlUnitCost 
     FROM Erp.PartTran pt_rec 
     WHERE pt_rec.Company = pt.Company 
       AND pt_rec.JobNum = pt.JobNum 
       AND pt_rec.TranType = 'PLT-STK' 
       AND pt_rec.PartNum = pt.PartNum) AS [Đơn giá nhận]
FROM Erp.PartTran pt
WHERE pt.TranType = 'STK-PLT'                      -- Đầu xuất đi
  -- Điều kiện: Đơn giá nhận khác đơn giá xuất
  AND (SELECT TOP 1 pt_rec.MtlUnitCost 
       FROM Erp.PartTran pt_rec 
       WHERE pt_rec.Company = pt.Company 
         AND pt_rec.JobNum = pt.JobNum 
         AND pt_rec.TranType = 'PLT-STK' 
         AND pt_rec.PartNum = pt.PartNum) <> pt.MtlUnitCost;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date,
    msi.segment1 AS item_code,
    mmt.transaction_quantity AS tx_qty,
    mta.reference_account AS [Tài khoản chênh lệch],
    mta.base_transaction_value AS [Số tiền chênh lệch] -- Giá trị lệch phát sinh
FROM mtl_material_transactions mmt
INNER JOIN mtl_transaction_accounts mta 
    ON mmt.transaction_id = mta.transaction_id
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE mmt.transaction_action_id IN (12, 21)         -- 21: Intransit Shipment, 12: Intransit Receipt
  AND mta.accounting_line_type = 14                 -- 14: Inter-org Variance (Tài khoản hạch toán lệch giá)
  AND mta.base_transaction_value <> 0
ORDER BY mmt.transaction_date DESC;
```

---

## 4. Checklist dành cho Developer khi phát triển phân hệ Chuyển kho Nội bộ

- [ ] **Khóa giữ hàng khi làm lệnh xuất:** Khi phiếu xuất hàng (Shipment) của đơn điều chuyển được tạo, hệ thống phải tự động chuyển số hàng đó sang vị trí ảo trung chuyển (In-transit), chặn không cho phép bán hoặc xuất cho sản xuất.
- [ ] **Ràng buộc số lượng nhận tối đa:** Thiết lập điều kiện chặn (Data Validation Rule) trên màn hình Nhận hàng điều chuyển (`Receipt`), không cho phép thủ kho nhập số lượng nhận lớn hơn số lượng thực tế đã xuất đi trên đường (Kịch bản 1).
- [ ] **Báo cáo hàng đi đường tự động:** Xây dựng báo cáo định kỳ quét các giao dịch hàng đi đường quá hạn chưa nhận để tự động gửi Email cảnh báo (Email Alert) cho bộ phận quản lý kho của cả 2 chi nhánh.
- [ ] **Hạch toán chênh lệch tỷ giá tự động:** Đảm bảo hệ thống tự động sinh bút toán hạch toán chênh lệch giá thành (Standard Cost) hoặc chênh lệch tỷ giá phát sinh giữa 2 site vào đúng tài khoản chi phí chênh lệch của kế toán (Kịch bản 2).
