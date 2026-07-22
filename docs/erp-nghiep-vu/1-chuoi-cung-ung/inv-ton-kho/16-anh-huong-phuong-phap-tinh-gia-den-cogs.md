---
id: anh-huong-phuong-phap-tinh-gia-den-cogs
title: Ảnh hưởng của Phương pháp Tính giá đến Giá vốn Hàng bán (COGS) — Biến động biên lợi nhuận, Bài toán phân bổ và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Ảnh hưởng đến Giá vốn (COGS)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/anh-huong-den-cogs
sidebar_position: 17
date: 2026-08-06
tags: [erp, inventory, costing, cogs, profit-and-loss, standard-cost, average-cost, fifo, variance-allocation, sql-audit, oracle-ebs, epicor]
---

# Ảnh hưởng của Phương pháp Tính giá đến Giá vốn Hàng bán (COGS) — Biến động biên lợi nhuận, Bài toán phân bổ và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong cấu trúc Báo cáo kết quả hoạt động kinh doanh (P&L) của doanh nghiệp sản xuất và thương mại, **Giá vốn hàng bán (COGS - Cost of Goods Sold)** luôn là khoản chi phí chiếm tỷ trọng lớn nhất. Công thức tính Lợi nhuận gộp của doanh nghiệp được xác định bởi:
$$\text{Lợi nhuận gộp (Gross Profit)} = \text{Doanh thu thuần (Revenue)} - \text{Giá vốn hàng bán (COGS)}$$

Bản chất của việc lựa chọn phương pháp tính giá hàng tồn kho (Standard Cost, Average, hay FIFO) không chỉ là thuật toán lưu trữ của hệ thống ERP, mà nó trực tiếp định hình con số **COGS** hiển thị trên báo cáo tài chính, từ đó làm thay đổi nghĩa vụ nộp thuế thu nhập doanh nghiệp và biến động biên lợi nhuận gộp.

---

## 1. Ma trận tác động của biến động giá thị trường lên COGS và Lợi nhuận

Khi giá cả nguyên vật liệu đầu vào của thị trường biến động (Lạm phát tăng giá hoặc Giảm phát hạ giá), việc áp dụng các phương pháp tính giá khác nhau sẽ cho ra kết quả COGS và giá trị tồn kho cuối kỳ khác nhau rõ rệt:

### A. Trong chu kỳ Lạm phát (Giá mua đầu vào tăng dần)
* **Phương pháp FIFO (Nhập trước - Xuất trước):** Hệ thống sẽ lấy các lớp giá cũ hơn, rẻ hơn ở quá khứ để hạch toán vào COGS. 
  * *Tác động:* **COGS thấp nhất**, dẫn đến **Lợi nhuận gộp cao nhất** (doanh nghiệp trông có vẻ "lời ảo" nhiều hơn, đồng nghĩa phải nộp thuế thu nhập cao hơn). Giá trị tồn kho cuối kỳ còn lại trong kho có giá trị cao sát với thị trường thực tế.
* **Phương pháp Average (Bình quân gia quyền):** Đơn giá xuất kho là sự trung hòa giữa giá cũ và giá mới.
  * *Tác động:* **COGS ở mức trung bình**, lợi nhuận gộp và giá trị tồn kho cuối kỳ phản ánh mức độ trung bình ổn định của thị trường.

### B. Trong chu kỳ Giảm phát (Giá mua đầu vào giảm dần)
* **Phương pháp FIFO:** Hệ thống lấy các lớp giá cũ đắt đỏ ở quá khứ để hạch toán vào COGS.
  * *Tác động:* **COGS cao nhất**, dẫn đến **Lợi nhuận gộp thấp nhất**. Giá trị hàng tồn kho cuối kỳ còn lại trong kho cực thấp.

---

## 2. Bài toán phân bổ chênh lệch giá tiêu chuẩn (PPV Allocation) cuối kỳ

Đối với các doanh nghiệp áp dụng phương pháp **Giá tiêu chuẩn (Standard Costing)**, khi phát sinh chênh lệch giá mua thực tế từ PO so với giá tiêu chuẩn hệ thống, khoản chênh lệch này được nạp vào tài khoản **PPV (Purchase Price Variance)**.

### Vấn đề kiểm toán tài chính (IFRS / VAS 02):
Nhiều doanh nghiệp sản xuất khi viết báo cáo trên ERP thường chọn phương pháp đơn giản là: **Đẩy 100% số dư tài khoản PPV phát sinh trong kỳ thẳng vào Giá vốn hàng bán (COGS) trên báo cáo P&L cuối tháng**.

Tuy nhiên, kiểm toán quốc tế sẽ không chấp nhận điều này nếu số lượng hàng mua về chưa được xuất bán hết. 
* **Quy tắc phân bổ chuẩn (SLA/Cost Allocation):** 
  * Nếu trong kỳ bạn nhập kho **1.000 sản phẩm** (phát sinh lệch PPV là **2.000 USD**), nhưng bạn mới chỉ xuất bán **200 sản phẩm** (800 sản phẩm vẫn nằm trong kho).
  * Kế toán bắt buộc phải phân bổ tỷ lệ: Chỉ được phép kết chuyển 20% trị giá PPV (**400 USD**) vào COGS trên P&L. 80% trị giá PPV còn lại (**1.600 USD**) phải được phân bổ ngược lại vào giá trị hàng tồn kho cuối kỳ trên Bảng cân đối kế toán.

---

## 3. Hai "Bẫy" thực chiến phá hủy tính trung thực của Giá vốn (COGS)

### ❌ Bẫy 1: Xuất bán hàng hóa với giá vốn bằng 0 USD (Zero-COGS Shipments)

**Tình huống:** Hôm nay, thủ kho làm phiếu xuất kho giao **1.000 sản phẩm** cho khách hàng (`STK-CUS`). Do lỗi thiết lập hệ thống ở các khâu trước (chưa chạy Cost Rollup cho Standard Cost, hoặc làm phiếu điều chỉnh tăng giá trị bằng 0 trước đó), hệ thống ERP ghi nhận đơn giá vốn của lô hàng này bằng **0 USD**.

* **Hậu quả méo mó P&L:** Doanh thu của đơn hàng ghi nhận bình thường (ví dụ: 50.000 USD), nhưng Giá vốn hàng bán (COGS) ghi nhận bằng 0 USD. Biên lợi nhuận gộp của đơn hàng này đột ngột đạt mức **100% ảo**. 
* Đến cuối tháng khi kế toán phát hiện ra lỗi và thực hiện chạy giao dịch điều chỉnh giá trị thủ công (Cost Adjustment), một khoản chi phí giá vốn khổng lồ sẽ bị dồn cục bộ vào ngày cuối tháng, tạo ra biểu đồ hình sin nhảy múa cực kỳ bất thường trên báo cáo tài chính tuần của ban giám đốc.

---

### ❌ Bẫy 2: Nhà cung cấp giao hóa đơn trễ (Late Supplier Invoice) sau khi hàng đã xuất bán

**Tình huống:** Ngày 05/08, doanh nghiệp nhập kho 100 cái động cơ từ PO với giá tạm tính là **100 USD/cái** (do chưa có hóa đơn). Ngày 10/08, doanh nghiệp đã xuất bán hết 100 cái động cơ này cho khách hàng (COGS ghi nhận tạm tính là **10.000 USD**). Đến ngày 25/08, nhà cung cấp mới gửi hóa đơn tài chính với đơn giá thực tế là **105 USD/cái** (phát sinh chênh lệch thực tế tăng thêm 5 USD/cái).

* **Bẫy xử lý của hệ thống:** ERP sẽ cập nhật khoản chênh lệch 500 USD thực tế này đi đâu khi hàng hóa vật lý đã không còn nằm trong kho?
  * *Hệ thống ERP thiết kế tốt:* Sẽ tự động chạy luồng **Cost Rollback / Retro-active COGS Adjustment**, tự động tìm lại các giao dịch xuất bán cũ của lô hàng này để ghi tăng trực tiếp 500 USD vào Giá vốn hàng bán (Debit 632 / Credit AP Accrual) của kỳ hiện tại.
  * *Hệ thống ERP thiết kế kém:* Sẽ hạch toán khoản 500 USD này vào tài khoản chênh lệch mua hàng chung chung, khiến kế toán không thể bóc tách nổi biên lợi nhuận thực tế của từng đơn hàng bán.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát luồng Giá vốn hàng bán (COGS)

---

### ❌ SQL Audit 1: Phát hiện các giao dịch xuất bán hàng hóa có Giá vốn bằng 0 USD (Zero-COGS Shipments)
Tìm toàn bộ các giao dịch xuất kho bán hàng cho khách hàng đã hoàn thành nhưng hệ thống lại ghi nhận đơn giá vốn bằng 0 USD, làm sai lệch biên lợi nhuận gộp.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartTran`):
Trong Epicor, giao dịch xuất kho bán hàng cho khách hàng là `STK-CUS`.
```sql
SELECT 
    pt.TranDate AS [Ngày xuất hàng],
    pt.PackNum AS [Số phiếu xuất],
    pt.PartNum AS [Mã sản phẩm],
    pt.TranQty AS [Số lượng xuất],
    pt.MtlUnitCost AS [Giá vốn nguyên vật liệu],
    pt.LbrUnitCost AS [Giá vốn nhân công],
    pt.BurUnitCost AS [Giá vốn sản xuất chung],
    (pt.MtlUnitCost + pt.LbrUnitCost + pt.BurUnitCost) AS [Tổng giá vốn đơn vị]
FROM Erp.PartTran pt
WHERE pt.TranType = 'STK-CUS'                       -- Giao dịch xuất kho bán hàng cho khách
  -- Lọc các giao dịch có tổng đơn giá vốn (Material + Labor + Burden) bằng 0
  AND (pt.MtlUnitCost + pt.LbrUnitCost + pt.BurUnitCost) = 0 
ORDER BY pt.TranDate DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_MATERIAL_TRANSACTIONS`):
Trong Oracle EBS, giao dịch xuất kho bán hàng sử dụng `transaction_type_id = 33` (Sales Order Issue).
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS ship_date,
    msi.segment1 AS item_code,
    mmt.transaction_quantity AS ship_qty,           -- Số lượng xuất bán
    mmt.actual_cost AS unit_cost,                   -- Đơn giá vốn xuất kho
    (mmt.transaction_quantity * mmt.actual_cost) AS total_cogs_value
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE mmt.transaction_type_id = 33                  -- 33: Sales Order Issue
  AND mmt.actual_cost = 0                           -- Lỗi: Đơn giá vốn bằng 0
ORDER BY mmt.transaction_date DESC;
```

---

### ❌ SQL Audit 2: Phát hiện các đợt phát sinh chênh lệch giá mua PPV cực lớn chưa được phân bổ
Quét các giao dịch nhập kho mua hàng từ PO phát sinh chênh lệch giá thực tế lớn hơn 5.000 USD để bộ phận kế toán kiểm tra và lập bảng phân bổ cuối tháng, tránh việc dồn hết 100% vào COGS làm méo mó báo cáo P&L.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pt.TranDate AS [Ngày nhận hàng],
    pt.PackNum AS [Số phiếu nhập],
    pt.PartNum AS [Mã vật tư],
    pt.TranQty AS [Số lượng nhập],
    pt.OurUnitCost AS [Giá mua PO thực tế],
    pt.MtlUnitCost AS [Giá tiêu chuẩn hệ thống],     -- Đơn giá Standard Cost
    (pt.OurUnitCost - pt.MtlUnitCost) AS [Lệch đơn giá],
    ABS(pt.TranQty * (pt.OurUnitCost - pt.MtlUnitCost)) AS [Tổng chênh lệch PPV]
FROM Erp.PartTran pt
WHERE pt.TranType = 'PUR-STK'                       -- Nhập kho từ PO mua hàng
  AND pt.OurUnitCost <> pt.MtlUnitCost               -- Phát sinh chênh lệch giá mua
  -- Chỉ lọc các đợt phát sinh lệch giá trị lớn hơn 5.000 USD
  AND ABS(pt.TranQty * (pt.OurUnitCost - pt.MtlUnitCost)) > 5000 
ORDER BY [Tổng chênh lệch PPV] DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
Trong Oracle EBS chạy Standard Costing, chênh lệch giá mua PPV phát sinh được hạch toán vào bảng `MTL_TRANSACTION_ACCOUNTS` dưới loại dòng `accounting_line_type = 14` (Purchase Price Variance).
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS receipt_date,
    msi.segment1 AS item_code,
    mmt.transaction_quantity AS received_qty,
    mta.reference_account AS ppv_gl_account,
    mta.base_transaction_value AS ppv_variance_amount -- Giá trị chênh lệch PPV thực tế phát sinh
FROM mtl_material_transactions mmt
INNER JOIN mtl_transaction_accounts mta 
    ON mmt.transaction_id = mta.transaction_id
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE mmt.transaction_type_id = 18                  -- 18: PO Receipt
  AND mta.accounting_line_type = 14                 -- 14: Purchase Price Variance / Inter-org Variance
  -- Chỉ lọc các đợt phát sinh lệch giá trị lớn hơn 5.000 USD
  AND ABS(mta.base_transaction_value) > 5000 
ORDER BY ABS(mta.base_transaction_value) DESC;
```

---

## 5. Checklist dành cho Developer khi phát triển hệ thống tính Giá vốn (COGS)

- [ ] **Ràng buộc kiểm tra đơn giá xuất kho:** Khi viết logic ghi nhận nghiệp vụ xuất bán hàng (`STK-CUS`/`Sales Order Issue`), luôn tích hợp hàm kiểm tra (Validation Rule), chặn không cho thực hiện nếu tổng giá vốn tính toán của mặt hàng đang bằng 0 USD (Kịch bản 1).
- [ ] **Lập trình tính năng phân bổ PPV tự động (PPV Allocation Engine):** Thiết kế bảng trung gian để tính toán tỷ lệ phân bổ chi phí PPV cuối kỳ dựa trên tỷ lệ: `Số lượng đã bán trong kỳ` / `Số lượng tồn kho cuối kỳ` để tự động tạo bút toán điều chỉnh kế toán chuẩn mực.
- [ ] **Phát triển luồng điều chỉnh giá vốn hồi tố (Retro-active COGS Adjustment):** Khi phát sinh hóa đơn trễ có đơn giá khác đơn giá tạm tính nhập kho, hệ thống phải có cơ chế quét ngược lại lịch sử xuất kho để tự động điều chỉnh tăng/giảm tài khoản Giá vốn (632) tương ứng với số lượng hàng thực tế đã xuất bán (Kịch bản 2).
- [ ] **Đồng bộ hóa ngày hạch toán (Transaction Date Sync):** Đảm bảo ngày hạch toán kế toán giá vốn hàng bán (`GL Transaction Date`) luôn trùng khớp với ngày thủ kho thực tế xuất hàng rời khỏi nhà máy (`Ship Date`), tránh hiện tượng lệch kỳ báo cáo giữa Kho và Kế toán.
