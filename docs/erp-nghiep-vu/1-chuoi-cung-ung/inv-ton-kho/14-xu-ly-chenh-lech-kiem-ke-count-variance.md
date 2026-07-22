---
id: xu-ly-chenh-lech-kiem-ke-count-variance
title: Xử lý Chênh lệch Kiểm kê (Count Variance) — Cơ chế Dung sai (Tolerance), Hạch toán hao hụt và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Xử lý Chênh lệch Kiểm kê
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/xu-ly-chenh-lech
sidebar_position: 15
date: 2026-08-04
tags: [erp, inventory, cycle-count, physical-inventory, count-variance, tolerance, costing, sql-audit, oracle-ebs, epicor]
---

# Xử lý Chênh lệch Kiểm kê (Count Variance) — Cơ chế Dung sai (Tolerance), Hạch toán hao hụt và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Sau khi hoàn thành việc đếm số liệu thực tế ngoài kho (trong cả đợt kiểm kê định kỳ lẫn kiểm kê toàn bộ) và nhập số liệu lên ERP, hệ thống sẽ tính toán ra con số chênh lệch (Variance). Nghiệp vụ **Xử lý chênh lệch kiểm kê (Count Variance Posting / Post Adjustments)** là bước cuối cùng duyệt để cập nhật số dư hệ thống về đúng thực tế và hạch toán tài chính.

Dưới góc nhìn của kế toán quản trị và kiểm toán, đây là thời điểm nhạy cảm nhất vì hệ thống sẽ chính thức "xóa sổ" các phần tài sản bị hao hụt hoặc ghi nhận các phần tài sản bị thừa không rõ nguyên nhân.

---

## 1. Cơ chế Dung sai chênh lệch kiểm kê (Variance Tolerances)

Hệ thống ERP lớn không duyệt cào bằng mọi chênh lệch. ERP sử dụng cơ chế **Dung sai chênh lệch (Tolerance)** để phân loại và xử lý tự động hoặc thủ công:

1. **Dung sai số lượng (Quantity Tolerance):** Tỷ lệ % chênh lệch số lượng cho phép (ví dụ: ±2% số lượng đặt mua).
2. **Dung sai giá trị (Value Tolerance):** Hạn mức chênh lệch số tiền cho phép (ví dụ: ±100 USD).

### Luồng xử lý dựa trên dung sai:
* **Nằm trong dung sai (Within Tolerance):** Hệ thống tự động duyệt (Auto-approve) và post giao dịch điều chỉnh kho ngay khi thủ kho lưu số thực đếm.
* **Vượt quá dung sai (Out of Tolerance):** Hệ thống khóa cứng dòng kiểm kê đó và bắt buộc phải đi qua 1 trong 2 luồng:
  * **Yêu cầu đếm lại (Recount):** Yêu cầu một tổ kiểm kê khác ra kho đếm lại để xác nhận số liệu.
  * **Duyệt thủ công cấp cao (Workflow Approval):** Gửi yêu cầu duyệt kèm theo giải trình lên Kế toán trưởng hoặc Giám đốc nhà máy phê duyệt trước khi cho phép post sổ.

---

## 2. Luồng Hạch toán Kế toán Hao hụt / Thừa kho (GL Posting)

Khi giao dịch Post Variance được phê duyệt, hệ thống ERP sẽ tự động sinh bút toán định khoản kế toán tùy thuộc vào chênh lệch đó là lệch âm (hao hụt) hay lệch dương (thừa).

### Trường hợp 1: Lệch âm (Inventory Loss - Hao hụt tài sản)
Thực tế đếm được ít hơn hệ thống (ví dụ hệ thống có 10, thực đếm có 8, mất 2 con).
* **Nợ (Debit):** `Tài khoản chênh lệch kiểm kê / Hao hụt tài sản` (632 hoặc 1381 / 642 tùy quy định) — Ghi nhận tăng chi phí/hao hụt trong kỳ.
* **Có (Credit):** `Tài khoản Kho` (152, 156) — Giảm trừ giá trị tài sản tồn kho thực tế.

### Trường hợp 2: Lệch dương (Inventory Gain - Thừa tài sản)
Thực tế đếm được nhiều hơn hệ thống (ví dụ hệ thống có 10, thực đếm có 11, thừa 1 con).
* **Nợ (Debit):** `Tài khoản Kho` (152, 156) — Tăng giá trị tài sản tồn kho thực tế.
* **Có (Credit):** `Tài khoản chênh lệch kiểm kê / Thu nhập khác` (632 hoặc 711 / 3381) — Ghi nhận giảm chi phí hoặc tăng thu nhập khác trong kỳ.

---

## 3. Hai "Bẫy" thực chiến trong xử lý chênh lệch kiểm kê

### ❌ Bẫy 1: Phê duyệt chênh lệch giá trị lớn không qua Workflow kiểm soát (Uncontrolled Postings)

**Tình huống:** Trong đợt kiểm kê, phát hiện thiếu hụt **2.000 con chip** giá trị cao trị giá **20.000 USD**. Do hệ thống ERP cấu hình lỏng lẻo (hoặc phân quyền sai), thủ kho hoặc kế toán kho cấp trung trực tiếp bấm nút "Post Variance" để xử lý chênh lệch này mà không cần đi qua bất kỳ luồng phê duyệt (Approval Workflow) nào của Giám đốc tài chính (CFO).

* **Hậu quả nghiêm trọng:** Khoản hao hụt tài sản lớn bị âm thầm xóa sổ trên hệ thống mà ban giám đốc không hề hay biết. Đây là kẽ hở lớn nhất để nhân viên cấu kết tẩu tán tài sản của doanh nghiệp.
* **SQL Audit rà soát:** Tìm tất cả các giao dịch post chênh lệch kiểm kê thành công (`CC-ADJ` hoặc `PHY-ADJ`) có tổng giá trị giao dịch (`Số lượng` $\times$ `Đơn giá`) vượt quá một hạn mức lớn (ví dụ > 1.000 USD) nhưng được post bởi tài khoản không có thẩm quyền cao.

---

### ❌ Bẫy 2: Vòng lặp đếm lại bất thường để che giấu mất mát (Abnormal Recount Loops)

**Tình huống:** Thủ kho làm mất 50 sản phẩm trong kho. Khi hệ thống yêu cầu kiểm kê, thủ kho đếm thực tế thiếu 50 sản phẩm. Khi ERP báo lệch đỏ, thủ kho lập tức yêu cầu đếm lại (Recount) lần 1, đếm lại lần 2, đếm lại lần 3... nhằm mục đích **hoãn binh** hoặc cố tình điều chỉnh số đếm thực tế tăng dần lên qua các lần nhập sau để che giấu bớt số lượng mất mát thực tế.

* **Hậu quả:** Số liệu kiểm kê bị can thiệp phi vật lý, quy trình đối soát bị kéo dài và làm mất tính trung thực của số liệu tại thời điểm khóa sổ.
* **SQL Audit rà soát:** Quét các dòng kiểm kê có số lần yêu cầu đếm lại (`Recount / Number of counts`) lớn hơn hạn mức cho phép (ví dụ đếm lại quá 3 lần cho cùng một vị trí).

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát Chênh lệch kiểm kê

---

### ❌ SQL Audit 1: Phát hiện các giao dịch duyệt chênh lệch giá trị lớn đã Post (Large Posted Variances)
Quét lịch sử giao dịch kho để tìm các bút toán duyệt chênh lệch kiểm kê đã được ghi sổ có tổng trị giá chênh lệch lớn hơn 1.000 USD để báo cáo cho Ban kiểm soát độc lập.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartTran`):
Trong Epicor, giao dịch duyệt chênh lệch từ Cycle Count là `CC-ADJ` và từ Physical Inventory là `PHY-ADJ`.
```sql
SELECT 
    pt.TranDate AS [Ngày duyệt post],
    pt.PackNum AS [Mã đợt kiểm kê],
    pt.PartNum AS [Mã sản phẩm],
    pt.TranQty AS [Số lượng lệch],                   -- Số âm là lệch thiếu, số dương là lệch thừa
    pt.MtlUnitCost AS [Đơn giá],
    ABS(pt.TranQty * pt.MtlUnitCost) AS [Trị giá chênh lệch (USD)],
    pt.CreatedBy AS [Người phê duyệt]
FROM Erp.PartTran pt
WHERE pt.TranType IN ('CC-ADJ', 'PHY-ADJ')          -- Chỉ quét các giao dịch duyệt chênh lệch kiểm kê
  AND ABS(pt.TranQty * pt.MtlUnitCost) > 1000       -- Lọc các chênh lệch lớn hơn 1.000 USD
ORDER BY [Trị giá chênh lệch (USD)] DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_MATERIAL_TRANSACTIONS`):
Trong Oracle EBS, giao dịch duyệt chênh lệch sử dụng `transaction_type_id = 4` (Cycle Count Adjustment) hoặc `8` (Physical Inventory Adjustment).
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS post_date,
    msi.segment1 AS item_code,
    mmt.transaction_quantity AS variance_qty,       -- Số lượng chênh lệch
    mmt.actual_cost AS unit_cost,                   -- Đơn giá tại thời điểm post
    ABS(mmt.transaction_quantity * mmt.actual_cost) AS total_variance_value, -- Trị giá lệch
    mmt.created_by AS approved_by
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE mmt.transaction_type_id IN (4, 8)             -- 4: Cycle Count Adj, 8: Physical Inventory Adj
  AND ABS(mmt.transaction_quantity * mmt.actual_cost) > 1000 -- Lọc chênh lệch lớn hơn 1.000 USD
ORDER BY total_variance_value DESC;
```

---

### ❌ SQL Audit 2: Phát hiện các vị trí kho bị đếm lại bất thường nhiều lần (Excessive Recounts)
Tìm các dòng kiểm kê có số lần yêu cầu đếm lại lớn hơn 3 lần, biểu hiện của việc bất thường số liệu hoặc gian lận đếm hàng.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    ch.CCYear AS [Năm],
    ch.CycleSeq AS [Đợt kiểm kê],
    ch.WarehouseCode AS [Mã kho],
    ch.BinNum AS [Vị trí ô kệ],
    ch.PartNum AS [Mã sản phẩm],
    COUNT(ch.TagNum) AS [Số lần đếm lại thực tế]    -- Đếm số thẻ đếm phát sinh cho cùng 1 vị trí
FROM Erp.CCHand ch
WHERE ch.Voided = 0
GROUP BY ch.Company, ch.CCYear, ch.CycleSeq, ch.WarehouseCode, ch.BinNum, ch.PartNum
HAVING COUNT(ch.TagNum) > 3;                       -- Lọc các mục bị đếm lại trên 3 lần
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_CYCLE_COUNT_ENTRIES`):
Trong Oracle EBS, cột `number_of_counts` lưu số lần đếm thực tế của dòng kiểm kê.
```sql
SELECT 
    mcch.cycle_count_header_name AS count_name,
    mcce.subinventory AS subinventory,
    msi.segment1 AS item_code,
    mcce.number_of_counts AS recount_attempts,       -- Số lần đã thực hiện đếm lại
    mcce.system_quantity_current AS system_qty,
    mcce.count_quantity_current AS last_count_qty
FROM mtl_cycle_count_entries mcce
INNER JOIN mtl_cycle_count_headers mcch 
    ON mcce.cycle_count_header_id = mcch.cycle_count_header_id
INNER JOIN mtl_system_items_b msi 
    ON mcce.inventory_item_id = msi.inventory_item_id AND mcce.organization_id = msi.organization_id
WHERE mcce.number_of_counts > 3                     -- Lọc các mục bị yêu cầu đếm lại trên 3 lần
ORDER BY mcce.number_of_counts DESC;
```

---

## 5. Checklist dành cho Developer khi phát triển tính năng Duyệt Chênh lệch

- [ ] **Ràng buộc hạn mức duyệt (Approval Workflow):** Lập trình bảng phân quyền hạn mức duyệt chênh lệch (Approval Matrix) theo tổng giá trị tiền bị lệch của dòng kiểm kê (ví dụ lệch > 500 USD bắt buộc phải chuyển trạng thái sang Chờ duyệt bởi CFO).
- [ ] **Giới hạn số lần đếm lại (Recount Limit):** Khóa cứng nút "Request Recount" trên màn hình kiểm kê nếu số lần đếm lại của dòng đó đã chạm mức tối đa (ví dụ tối đa 3 lần), bắt buộc người dùng phải chọn giải trình duyệt chênh lệch hoặc báo cáo ban giám đốc (Kịch bản 2).
- [ ] **Mã hóa tài khoản theo mã lý do (Reason Code):** Đảm bảo bút toán tự động hạch toán chênh lệch (`CC-ADJ`/`PHY-ADJ`) bắt buộc phải lấy đúng tài khoản đối ứng (Offset Account) được cấu hình theo từng `Reason Code` tương ứng của dòng kiểm kê, không cho phép nhập tay tài khoản kế toán.
- [ ] **Ràng buộc khóa sổ kỳ kế toán:** Không cho phép post duyệt chênh lệch kiểm kê vào kỳ kế toán đã bị khóa sổ (GL Period Closed), bắt buộc hệ thống phải kiểm tra ngày post thực tế và ngày kỳ kế toán trước khi chạy bút toán hạch toán.