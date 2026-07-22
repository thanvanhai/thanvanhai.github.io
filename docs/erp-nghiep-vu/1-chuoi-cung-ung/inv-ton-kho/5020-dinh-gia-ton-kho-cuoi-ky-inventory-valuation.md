---
id: dinh-gia-ton-kho-cuoi-ky-inventory-valuation
title: Định giá Tồn kho Cuối kỳ (Inventory Valuation) — Đối chiếu Kho và GL, Trích lập dự phòng (NRV) và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Định giá Tồn kho Cuối kỳ
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/dinh-gia-cuoi-ky
sidebar_position: 5020
date: 2026-08-07
tags: [erp, inventory, costing, valuation, period-close, nrv, subledger-reconciliation, sql-audit, oracle-ebs, epicor]
---

# Định giá Tồn kho Cuối kỳ (Inventory Valuation) — Đối chiếu Kho và GL, Trích lập dự phòng (NRV) và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Khi một kỳ kế toán tháng hoặc năm tài chính kết thúc, hoạt động quan trọng nhất của bộ phận quản lý kho và kế toán là **Định giá tồn kho cuối kỳ (Inventory Valuation / Period End Reconciliation)**. Đây là thời điểm doanh nghiệp phải chốt số liệu, khóa sổ kho (Period Close) để xuất ra con số tổng giá trị tài sản hàng tồn kho chính thức.

Dưới góc nhìn của kiểm toán và kế toán trưởng, đây là quy trình đối soát chéo khắt khe. Nó đảm bảo rằng số tiền thể hiện trên Sổ cái kế toán (General Ledger - GL) phải trùng khớp hoàn hảo với giá trị thực tế đang nằm tại các kệ kho chi tiết (Subledger).

---

## 1. Nguyên tắc vàng: Đối chiếu Sổ phụ Kho với Sổ cái (Subledger vs. GL Reconciliation)

Trong một hệ thống ERP chuẩn chỉnh, dữ liệu kế toán kho luôn chạy theo mô hình **Sổ phụ (Subledger - mô tả chi tiết từng mã hàng, số lượng, vị trí)** song song với **Sổ cái (General Ledger - chỉ lưu tổng số tiền trên các tài khoản 152, 155, 156)**.

### Nguyên tắc khớp số liệu bắt buộc:
$$\text{Tổng trị giá báo cáo tồn kho chi tiết (Subledger)} = \text{Số dư nợ trên Sổ cái GL (Tài khoản 152, 155, 156)}$$

### Tại sao Sổ phụ và Sổ cái lại bị lệch giá trị (Discrepancy)?
Mặc dù hệ thống ERP tự động hạch toán, lỗi lệch số liệu cuối tháng vẫn xảy ra thường xuyên do 2 nguyên nhân cốt lõi:
1. **Hạch toán thủ công trực tiếp lên Sổ cái (Manual Journal Entries):** Kế toán tự ý dùng bút toán thủ công (Manual JE) để ghi nhận tăng/giảm vào tài khoản 152, 156 trên GL mà không thông qua các chứng từ của phân hệ Kho. Việc này làm GL thay đổi số dư nhưng Sổ phụ kho hoàn toàn không biết.
2. **Giao dịch kho bị treo (Stuck Transactions):** Thủ kho đã hoàn thành nhập/xuất kho vật lý trên máy, nhưng giao dịch bị lỗi hệ thống và bị nghẽn lại ở phân hệ phụ (Subledger Queue), chưa kịp đồng bộ (Post/Transfer) sang Sổ cái kế toán.

---

## 2. Nguyên tắc đánh giá theo Giá thấp hơn giữa Giá gốc và Giá trị thuần có thể thực hiện được (NRV)

Theo quy định của chuẩn mực kế toán Việt Nam (VAS 02) và quốc tế (IAS 2), hàng tồn kho cuối kỳ phải được trình bày theo **Giá thấp hơn giữa Giá gốc và Giá trị thuần có thể thực hiện được (Lower of Cost or Net Realizable Value - LCNRV)**.

* **Net Realizable Value (NRV):** Là giá bán ước tính của hàng tồn kho trừ đi chi phí ước tính để hoàn thành sản phẩm và chi phí ước tính cần thiết cho việc tiêu thụ chúng.
* **Hạch toán dự phòng (Inventory Provision):** Nếu giá thị trường của hàng hóa bị giảm mạnh, hoặc hàng bị lỗi mốt, chậm luân chuyển (Slow-moving) khiến giá trị NRV của lô hàng thấp hơn giá gốc mua ban đầu, kế toán bắt buộc phải **Trích lập dự phòng giảm giá hàng tồn kho**:

$$\text{Giá trị trích lập dự phòng} = \text{Giá gốc sổ phụ (Historical Cost)} - \text{Giá trị thuần có thể thực hiện (NRV)}$$

* **Bút toán hạch toán dự phòng:**
  * **Nợ (Debit):** `Tài khoản Giá vốn hàng bán` (632) — Ghi tăng chi phí giá vốn trong kỳ.
  * **Có (Credit):** `Tài khoản Dự phòng giảm giá hàng tồn kho` (2294) — Ghi giảm gián tiếp giá trị tài sản tồn kho.

---

## 3. Hai "Bẫy" thực chiến trong kỳ đóng sổ định giá tồn kho

### ❌ Bẫy 1: Thảm họa giao dịch kho bị treo (Unposted Transactions) làm lệch Sổ cái cuối tháng

**Tình huống:** Đến ngày 31/08, thủ kho đã làm xong phiếu nhập kho thành phẩm trị giá **50.000 USD**. Tuy nhiên, do hệ thống phân bổ chi phí nhân công (Labor) của Job sản xuất đó bị lỗi hoặc do tiến trình chuyển sổ ngầm (Posting Interface/SLA) bị nghẽn, giao dịch này bị treo lại ở trạng thái lỗi (`Error/Pending`).

* **Hậu quả lệch sổ:** 
  * Số dư số lượng trên kho phụ (Subledger) đã tăng thêm, báo cáo tồn kho chi tiết hiển thị giá trị tăng thêm 50.000 USD.
  * Do giao dịch bị nghẽn chưa Post sang GL, số dư tài khoản 155 trên Sổ cái kế toán không hề tăng.
  * Kết quả: Báo cáo đối chiếu cuối tháng bị lệch đúng 50.000 USD, kế toán trưởng không thể ký đóng kỳ kế toán để xuất báo cáo tài chính.
* **Giải pháp:** Phải có công cụ/báo cáo quét toàn bộ các giao dịch bị nghẽn ở tầng Subledger trước khi bấm nút khóa sổ (Period Close).

---

### ❌ Bẫy 2: Bỏ sót trích lập dự phòng cho hàng tồn kho "chậm luân chuyển" (Slow-moving / Obsolete Stock)

**Tình huống:** Trong kho đang chứa **5.000 cái vỏ hộp điện thoại** được mua từ 2 năm trước với giá gốc **2 USD/cái** (tổng trị giá 10.000 USD). Hiện tại dòng điện thoại này đã ngừng sản xuất, số vỏ hộp này không thể bán hay sử dụng được nữa (giá trị NRV bằng 0 USD). Kế toán do thiếu rà soát vẫn tiếp tục treo con số 10.000 USD này trên Bảng cân đối kế toán.

* **Hậu quả:** Doanh nghiệp bị tổ kiểm toán độc lập cảnh báo nghiêm trọng vì "khống" giá trị tài sản ảo. Việc không trích lập dự phòng giảm giá hàng tồn kho kịp thời làm sai lệch nghiêm trọng tính trung thực của báo cáo tài sản cuối năm.
* **Giải pháp:** Thiết lập báo cáo định tuổi tồn kho (Inventory Aging Report) trên ERP để tự động lọc ra các mã hàng đã quá 180 hoặc 360 ngày không hề phát sinh bất kỳ giao dịch xuất/nhập nào, làm cơ sở trích lập dự phòng NRV.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát kỳ Đóng sổ định giá tồn kho

---

### ❌ SQL Audit 1: Phát hiện các giao dịch kho bị treo, lỗi hệ thống chưa đồng bộ sang Sổ cái (Unposted Transactions)
Quét toàn bộ lịch sử giao dịch kho để tìm các phiếu nhập/xuất đã hoàn thành vật lý nhưng bị lỗi nghẽn hệ thống, chưa thể đồng bộ sang Sổ cái (GL), gây lệch sổ cuối tháng.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartTran`):
```sql
SELECT 
    pt.TranDate AS [Ngày giao dịch],
    pt.PackNum AS [Số chứng từ],
    pt.PartNum AS [Mã sản phẩm],
    pt.TranType AS [Loại giao dịch],
    pt.TranQty AS [Số lượng],
    (pt.TranQty * (pt.MtlUnitCost + pt.LbrUnitCost + pt.BurUnitCost)) AS [Trị giá giao dịch (USD)]
FROM Erp.PartTran pt
WHERE pt.PostedToGL = 0                             -- 0: Chưa được đồng bộ/post sang Sổ cái GL
  AND (pt.TranQty * (pt.MtlUnitCost + pt.LbrUnitCost + pt.BurUnitCost)) <> 0
  AND pt.TranDate < GETDATE() - 1                   -- Bị treo quá 1 ngày
ORDER BY pt.TranDate DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_MATERIAL_TRANSACTIONS`):
Trong Oracle, các giao dịch kho chưa đồng bộ sang Sổ cái thông qua SLA sẽ có cờ `gl_transfer_status_code` ở trạng thái `'N'` (Not processed) hoặc `'E'` (Error).
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS tx_date,
    msi.segment1 AS item_code,
    mmt.transaction_quantity AS tx_qty,
    mmt.gl_transfer_status_code AS err_status,       -- 'N' - Chưa xử lý, 'E' - Bị lỗi hạch toán
    mmt.gl_transfer_err_desc AS error_description     -- Chi tiết lỗi hạch toán hệ thống trả về
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE mmt.gl_transfer_status_code IN ('N', 'E')     -- Lọc các giao dịch bị nghẽn hạch toán
  AND mmt.transaction_date < SYSDATE - 1            -- Treo quá 1 ngày chưa được xử lý
ORDER BY mmt.transaction_date DESC;
```

---

### ❌ SQL Audit 2: Phát hiện hàng tồn kho chậm luân chuyển để trích lập dự phòng (Slow-moving Stock)
Tìm các mã hàng đang có số lượng tồn kho thực tế lớn hơn 0 nhưng đã quá 180 ngày chưa từng phát sinh bất kỳ một giao dịch nhập hoặc xuất kho nào, làm cơ sở tính trích lập dự phòng NRV.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí],
    pb.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả sản phẩm],
    pb.OnhandQty AS [Số lượng tồn thực tế],
    -- Lấy ngày phát sinh giao dịch kho gần đây nhất
    (SELECT MAX(pt.TranDate) 
     FROM Erp.PartTran pt 
     WHERE pt.Company = pb.Company AND pt.PartNum = pb.PartNum) AS [Ngày giao dịch gần nhất],
    -- Tính số ngày "bất động" không có giao dịch
    DATEDIFF(day, (SELECT MAX(pt.TranDate) FROM Erp.PartTran pt WHERE pt.Company = pb.Company AND pt.PartNum = pb.PartNum), GETDATE()) AS [Số ngày chậm luân chuyển]
FROM Erp.PartBin pb
INNER JOIN Erp.Part p ON pb.Company = p.Company AND pb.PartNum = p.PartNum
WHERE pb.OnhandQty > 0
  -- Lọc các vật tư đã quá 180 ngày không phát sinh giao dịch xuất/nhập
  AND DATEDIFF(day, (SELECT MAX(pt.TranDate) FROM Erp.PartTran pt WHERE pt.Company = pb.Company AND pt.PartNum = pb.PartNum), GETDATE()) > 180
ORDER BY [Số ngày chậm luân chuyển] DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    SUM(moqd.transaction_quantity) AS total_onhand,
    -- Tìm ngày phát sinh giao dịch mmt gần đây nhất của vật tư này
    (SELECT MAX(mmt_sub.transaction_date)
     FROM mtl_material_transactions mmt_sub
     WHERE mmt_sub.inventory_item_id = moqd.inventory_item_id
       AND mmt_sub.organization_id = moqd.organization_id) AS last_tx_date,
    -- Tính số ngày "bất động" không có giao dịch
    ROUND(SYSDATE - (SELECT MAX(mmt_sub.transaction_date)
                     FROM mtl_material_transactions mmt_sub
                     WHERE mmt_sub.inventory_item_id = moqd.inventory_item_id
                       AND mmt_sub.organization_id = moqd.organization_id)) AS days_inactive
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
GROUP BY moqd.subinventory_code, moqd.inventory_item_id, moqd.organization_id, msi.segment1, msi.description
HAVING SUM(moqd.transaction_quantity) > 0
   -- Lọc các vật tư đã quá 180 ngày không phát sinh giao dịch xuất/nhập
   AND ROUND(SYSDATE - (SELECT MAX(mmt_sub.transaction_date)
                        FROM mtl_material_transactions mmt_sub
                        WHERE mmt_sub.inventory_item_id = moqd.inventory_item_id
                          AND mmt_sub.organization_id = moqd.organization_id)) > 180
ORDER BY days_inactive DESC;
```

---

## 5. Checklist dành cho Developer khi phát triển kỳ Đóng sổ Định giá Tồn kho

- [ ] **Khóa chức năng hạch toán tay (Block Manual GL Journal Entries):** Cấu hình khóa tài khoản Sổ cái (GL Account Setup), nghiêm cấm người dùng tạo bút toán thủ công trực tiếp vào các tài khoản tài sản kho (152, 155, 156), bắt buộc mọi thay đổi số tiền phải chạy từ giao dịch kho đi lên.
- [ ] **Tự động quét kiểm tra giao dịch lỗi trước khi Close:** Thiết lập điều kiện chặn (Validation Rule) trên màn hình khóa sổ kỳ kế toán kho (`Period Closing`), chặn không cho phép bấm nút Khóa sổ nếu hệ thống quét thấy vẫn còn giao dịch kho bị lỗi, chưa Post sang GL (Kịch bản 1).
- [ ] **Lập trình báo cáo định tuổi tồn kho tự động (Inventory Aging Engine):** Xây dựng báo cáo tự động tính toán số ngày không phát sinh giao dịch của vật tư, làm cơ sở tự động gợi ý giá trị trích lập dự phòng giảm giá hàng tồn kho theo tiêu chuẩn kiểm toán (Kịch bản 2).
- [ ] **Khóa cứng ngày hạch toán sau khi đóng sổ:** Khi kỳ kế toán đã bấm Khóa sổ (`Closed`), lập trình cơ chế khóa cứng Database, chặn đứng mọi hành vi tạo phiếu xuất/nhập lùi ngày giao dịch (Backdated) về kỳ đã đóng đó.
