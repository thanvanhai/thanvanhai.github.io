---
id: chien-luoc-xuat-kho-fefo-first-expired-first-out
title: Chiến lược Xuất kho FEFO (First Expired, First Out) — Tối ưu hóa hạn dùng, Cảnh báo cận hạn và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Chiến lược FEFO
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/fefo
sidebar_position: 6020
date: 2026-08-10
tags: [erp, inventory, fefo, fifo, lot-control, expiry-date, wms, sql-audit, oracle-ebs, epicor]
---

# Chiến lược Xuất kho FEFO (First Expired, First Out) — Tối ưu hóa hạn dùng, Cảnh báo cận hạn và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Đối với các mặt hàng có thời hạn sử dụng (Shelf Life) như dược phẩm, sữa, thực phẩm đóng gói, hóa chất hay mỹ phẩm, việc áp dụng phương pháp xuất kho Nhập trước - Xuất trước (FIFO) là chưa đủ an toàn. Trong thực tế chuỗi cung ứng, một lô hàng nhập kho sau hoàn toàn có thể có ngày hết hạn sớm hơn lô hàng nhập kho trước (do nhà cung cấp giao hàng trễ, hoặc lô hàng nhập sau có hạn dùng ngắn hơn).

Để giải quyết bài toán này, các hệ thống ERP và WMS cao cấp bắt buộc phải sử dụng chiến lược **FEFO (First Expired, First Out - Hết hạn trước, Xuất trước)**. Đây là quy tắc vàng giúp doanh nghiệp tối ưu hóa vòng đời sản phẩm, giảm thiểu tối đa tỷ lệ hàng hóa bị hủy bỏ do hết hạn và bảo vệ dòng tiền.

---

## 1. Tại sao FIFO là chưa đủ? Sự ưu việt của FEFO

Hãy cùng phân tích một tình huống thực tế để thấy rõ vì sao FIFO có thể gây thiệt hại lớn cho doanh nghiệp:

**Kịch bản nhập kho vật tư `Hóa chất A`:**
* **Ngày 01/08 (Lô 1):** Nhập kho 100 lít với hạn sử dụng đến ngày **31/12** (Thời hạn 5 tháng).
* **Ngày 10/08 (Lô 2):** Nhập kho tiếp 100 lít. Nhưng lô này nhà cung cấp giao cận hạn hơn, hạn sử dụng chỉ đến ngày **30/11** (Thời hạn 3.5 tháng).

**Giao dịch xuất kho ngày 15/08:** Do phân xưởng cần dùng 50 lít hóa chất.
* **Nếu áp dụng FIFO (Nhập trước xuất trước):** Hệ thống chỉ định thủ kho lấy hàng từ **Lô 1** (nhập ngày 01/08).
  * *Hậu quả:* Lô 2 (hạn dùng ngắn hơn, hết hạn ngày 30/11) bị nằm lại kệ kho sâu hơn. Đến tháng 12, khi lấy đến Lô 2 thì lô này đã bị quá hạn và bắt buộc phải hủy bỏ. Doanh nghiệp mất trắng giá trị của 100 lít hóa chất Lô 2.
* **Nếu áp dụng FEFO (Hết hạn trước xuất trước):** Hệ thống quét qua hạn sử dụng của cả 2 lô, phát hiện Lô 2 hết hạn ngày 30/11 (sớm hơn Lô 1). ERP tự động chỉ định thủ kho lấy hàng từ **Lô 2** ra sử dụng trước, mặc dù nó được nhập vào kho sau.

---

## 2. Luồng nghiệp vụ vận hành FEFO trên hệ thống WMS

Để vận hành FEFO thành công, hệ thống WMS của doanh nghiệp phải tự động hóa luồng đề xuất lấy hàng (Directed Picking) dựa trên thuật toán sắp xếp ngày hết hạn:

> **Yêu cầu xuất hàng** → WMS quét các Lô khả dụng → Sắp xếp theo Expiration Date tăng dần → Đề xuất vị trí ô kệ chứa Lô cận hạn nhất

Khi nhân viên kho dùng Handheld quét mã vạch sản phẩm để xuất hàng, nếu họ lấy sai ô kệ chứa Lô cận hạn nhất, thiết bị Handheld sẽ báo đỏ và chặn không cho phép hoàn thành giao dịch xuất hàng.

---

## 3. Hai "Bẫy" thực chiến trong vận hành chiến lược FEFO

### ❌ Bẫy 1: Vi phạm nguyên tắc FEFO do thủ kho tự ý bốc xếp vật lý (User Override)

**Tình huống:** Hệ thống WMS chỉ định thủ kho ra ô kệ `BIN-01` để lấy Lô sê-ri `LOT-A` hết hạn ngày 30/09 đi giao. Tuy nhiên, ô kệ `BIN-01` nằm ở tầng cao hoặc góc khuất khó lấy. Thủ kho lười trèo lên nên đã tự ý bốc lô `LOT-B` (hết hạn ngày 31/12) nằm ngay ở tầng thấp bên ngoài để giao, sau đó quét tem nhãn của `LOT-B` trên máy để xác nhận xuất kho.

* **Hậu quả:** Hệ thống chấp nhận giao dịch vì `LOT-B` vẫn còn hạn. Tuy nhiên, hành vi này đã **vi phạm hoàn toàn nguyên lý FEFO**. Lô `LOT-A` tiếp tục bị treo ở vị trí khó lấy đó cho đến khi hết hạn và hóa phế liệu âm thầm.
* **Giải pháp:** Cấu hình hệ thống khóa tính năng cho phép người dùng tự ý thay đổi số Lô được đề xuất xuất kho (User Override Block), hoặc bắt buộc phải có tài khoản của Giám sát kho quét mã xác nhận đồng ý ghi đè đề xuất của hệ thống.

---

### ❌ Bẫy 2: Bỏ quên hàng "cận hạn" (Near-Expiry) không có phương án giải phóng kịp thời

**Tình huống:** Doanh nghiệp có 200 thùng sữa sắp hết hạn sử dụng trong vòng **15 ngày tới** (đã chạm ngưỡng cận hạn cảnh báo). Do hệ thống ERP thiếu tính năng cảnh báo sớm thời gian còn lại của hạn dùng (Remaining Shelf Life %), không ai phát hiện ra lô hàng này để làm chương trình khuyến mãi hoặc ưu tiên giải phóng gấp.

* **Hậu quả:** 15 ngày trôi qua, 200 thùng sữa chính thức hết hạn sử dụng. Doanh nghiệp không được phép bán và phải tốn thêm chi phí tiêu hủy hàng lỗi hỏng.
* **Giải pháp:** Lập trình báo cáo hoặc Dashboard cảnh báo sớm tồn kho cận hạn sử dụng theo thời gian thực (ví dụ: Cảnh báo đỏ khi sản phẩm còn dưới 15% thời hạn sử dụng gốc).

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát quy trình xuất kho FEFO

---

### ❌ SQL Audit 1: Phát hiện các giao dịch xuất kho vi phạm nguyên tắc FEFO
Tìm các trường hợp thủ kho xuất một Lô hàng có hạn dùng xa hơn, trong khi tại thời điểm xuất giao dịch đó, trong kho vẫn đang tồn tại một Lô hàng cùng mã có hạn dùng cận hơn bị bỏ qua.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pt.TranDate AS [Ngày xuất],
    pt.PackNum AS [Số phiếu xuất],
    pt.PartNum AS [Mã hàng],
    pt.LotNum AS [Số Lot đã xuất],
    pl_issued.ExpirationDate AS [Hạn dùng Lot đã xuất],
    -- Tìm Lot có hạn dùng sớm hơn vẫn đang tồn kho lúc đó
    (SELECT TOP 1 pb.LotNum 
     FROM Erp.PartBin pb
     INNER JOIN Erp.PartLot pl ON pb.Company = pl.Company AND pb.PartNum = pl.PartNum AND pb.LotNum = pl.LotNum
     WHERE pb.Company = pt.Company 
       AND pb.PartNum = pt.PartNum 
       AND pb.WarehouseCode = pt.WarehouseCode
       AND pb.OnhandQty > 0
       AND pl.ExpirationDate < pl_issued.ExpirationDate) AS [Lot cận hạn bị bỏ qua],
    (SELECT TOP 1 pl.ExpirationDate 
     FROM Erp.PartBin pb
     INNER JOIN Erp.PartLot pl ON pb.Company = pl.Company AND pb.PartNum = pl.PartNum AND pb.LotNum = pl.LotNum
     WHERE pb.Company = pt.Company 
       AND pb.PartNum = pt.PartNum 
       AND pb.WarehouseCode = pt.WarehouseCode
       AND pb.OnhandQty > 0
       AND pl.ExpirationDate < pl_issued.ExpirationDate) AS [Hạn dùng Lot bị bỏ qua]
FROM Erp.PartTran pt
INNER JOIN Erp.PartLot pl_issued 
    ON pt.Company = pl_issued.Company AND pt.PartNum = pl_issued.PartNum AND pt.LotNum = pl_issued.LotNum
WHERE pt.TranType IN ('STK-CUS', 'STK-MTL')        -- Chỉ quét xuất bán hoặc xuất sản xuất
  -- Điều kiện lọc: Tồn tại một Lot cận hạn dùng hơn trong cùng kho tại thời điểm xuất
  AND EXISTS (
      SELECT 1 
      FROM Erp.PartBin pb
      INNER JOIN Erp.PartLot pl ON pb.Company = pl.Company AND pb.PartNum = pl.PartNum AND pb.LotNum = pl.LotNum
      WHERE pb.Company = pt.Company 
        AND pb.PartNum = pt.PartNum 
        AND pb.WarehouseCode = pt.WarehouseCode
        AND pb.OnhandQty > 0
        AND pl.ExpirationDate < pl_issued.ExpirationDate
  )
ORDER BY pt.TranDate DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS tx_date,
    msi.segment1 AS item_code,
    mtln.lot_number AS issued_lot,
    mln_issued.expiration_date AS issued_lot_expiry,
    -- Tìm ngày hết hạn sớm nhất của Lot bị bỏ qua vẫn đang tồn kho lúc đó
    (SELECT MIN(mln_alt.expiration_date)
     FROM mtl_onhand_quantities_detail moqd
     INNER JOIN mtl_lot_numbers mln_alt 
         ON moqd.inventory_item_id = mln_alt.inventory_item_id 
         AND moqd.lot_number = mln_alt.lot_number 
         AND moqd.organization_id = mln_alt.organization_id
     WHERE moqd.inventory_item_id = mmt.inventory_item_id
       AND moqd.organization_id = mmt.organization_id
       AND moqd.subinventory_code = mmt.subinventory_code
       AND moqd.transaction_quantity > 0
       AND mln_alt.expiration_date < mln_issued.expiration_date) AS earlier_expiry_ignored
FROM mtl_material_transactions mmt
INNER JOIN mtl_transaction_lot_numbers mtln 
    ON mmt.transaction_id = mtln.transaction_id
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
INNER JOIN mtl_lot_numbers mln_issued 
    ON mtln.inventory_item_id = mln_issued.inventory_item_id 
    AND mtln.lot_number = mln_issued.lot_number 
    AND mmt.organization_id = mln_issued.organization_id
WHERE mmt.transaction_type_id IN (33, 35)           -- 33: Sales Issue, 35: WIP Issue
  -- Điều kiện lọc: Tồn tại một Lot cận hạn hơn trong cùng kho tại thời điểm xuất
  AND EXISTS (
     SELECT 1
     FROM mtl_onhand_quantities_detail moqd
     INNER JOIN mtl_lot_numbers mln_alt 
         ON moqd.inventory_item_id = mln_alt.inventory_item_id 
         AND moqd.lot_number = mln_alt.lot_number 
         AND moqd.organization_id = mln_alt.organization_id
     WHERE moqd.inventory_item_id = mmt.inventory_item_id
       AND moqd.organization_id = mmt.organization_id
       AND moqd.subinventory_code = mmt.subinventory_code
       AND moqd.transaction_quantity > 0
       AND mln_alt.expiration_date < mln_issued.expiration_date
  )
ORDER BY mmt.transaction_date DESC;
```

---

### ❌ SQL Audit 2: Phát hiện hàng hóa cận hạn sử dụng trong vòng 30 ngày tới (Near-Expiry Alert)
Quét toàn bộ số dư tồn kho theo Lô khả dụng đang có ngày hết hạn nằm trong vòng 30 ngày tới để gửi báo cáo giải phóng hàng gấp cho phòng kinh doanh.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ],
    pb.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả],
    pb.LotNum AS [Số Lô],
    pl.ExpirationDate AS [Ngày hết hạn],
    DATEDIFF(day, GETDATE(), pl.ExpirationDate) AS [Số ngày còn lại],
    pb.OnhandQty AS [Số lượng tồn]
FROM Erp.PartBin pb
INNER JOIN Erp.Part p ON pb.Company = p.Company AND pb.PartNum = p.PartNum
INNER JOIN Erp.PartLot pl ON pb.Company = pl.Company AND pb.PartNum = pl.PartNum AND pb.LotNum = pl.LotNum
WHERE pb.OnhandQty > 0
  AND pl.ExpirationDate IS NOT NULL
  AND pl.ExpirationDate >= GETDATE()                -- Chưa hết hạn hoàn toàn
  -- Lọc hàng hóa cận hạn sử dụng trong vòng 30 ngày tới
  AND DATEDIFF(day, GETDATE(), pl.ExpirationDate) <= 30 
ORDER BY [Số ngày còn lại] ASC;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    moqd.locator_id AS locator,
    msi.segment1 AS item_code,
    moqd.lot_number AS lot_no,
    mln.expiration_date AS expiry_date,
    ROUND(mln.expiration_date - SYSDATE) AS days_remaining, -- Số ngày còn lại
    SUM(moqd.transaction_quantity) AS onhand_qty
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
INNER JOIN mtl_lot_numbers mln 
    ON moqd.inventory_item_id = mln.inventory_item_id 
    AND moqd.lot_number = mln.lot_number 
    AND moqd.organization_id = mln.organization_id
WHERE mln.expiration_date IS NOT NULL
  AND mln.expiration_date >= SYSDATE                -- Chưa hết hạn hoàn toàn
  -- Lọc hàng hóa cận hạn sử dụng trong vòng 30 ngày tới
  AND ROUND(mln.expiration_date - SYSDATE) <= 30 
GROUP BY moqd.subinventory_code, moqd.locator_id, msi.segment1, moqd.lot_number, mln.expiration_date
HAVING SUM(moqd.transaction_quantity) > 0
ORDER BY days_remaining ASC;
```

---

## 5. Checklist dành cho Developer khi phát triển tính năng FEFO Picking

- [ ] **Khóa chức năng ghi đè đề xuất (Block Expiry Override):** Lập trình chặn cứng không cho phép thủ kho tự ý thay đổi Số Lô xuất kho khác với Số Lô cận hạn đã được hệ thống đề xuất (Directed Picking), trừ khi có tài khoản giám sát quét mã duyệt ghi đè (Kịch bản 1).
- [ ] **Cảnh báo phần trăm hạn dùng còn lại (Remaining Shelf Life %):** Khi xuất bán hàng cho các siêu thị/đại lý, hệ thống phải tự động tính toán phần trăm hạn dùng còn lại theo công thức:

  > **Shelf Life % còn lại** = (Ngày hết hạn − Ngày xuất hàng) ÷ (Ngày hết hạn − Ngày sản xuất) × 100

  Chặn không cho phép xuất hàng nếu tỷ lệ này dưới mức yêu cầu của đại lý (ví dụ: siêu thị yêu cầu sữa xuất kho phải còn tối thiểu 70% hạn dùng).
- [ ] **Lập trình Dashboard/Email cảnh báo cận hạn:** Xây dựng tính năng tự động chạy hàng ngày quét các Lô hàng có thời hạn sử dụng còn lại dưới 30 ngày để gửi Email cảnh báo (Email Alert) cho bộ phận kinh doanh và quản lý chất lượng (Kịch bản 2).
- [ ] **Tự động cập nhật trạng thái Lô hết hạn:** Viết tác vụ ngầm chạy hàng đêm (Nightly Job) quét toàn bộ bảng số dư tồn kho, nếu phát hiện Lô hàng đã chạm ngày hết hạn (`Expiration Date`), tự động cập nhật trạng thái của Lô đó thành `Blocked` (Bị khóa) để ngăn chặn triệt để lỗi xuất kho nhầm hàng hết hạn.