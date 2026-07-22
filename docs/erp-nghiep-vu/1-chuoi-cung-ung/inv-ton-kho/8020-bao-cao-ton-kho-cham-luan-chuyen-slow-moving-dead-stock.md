---
id: bao-cao-ton-kho-cham-luan-chuyen-slow-moving-dead-stock
title: Báo cáo Tồn kho Chậm luân chuyển (Slow-moving / Dead Stock) — Thuật toán tính Tuổi kho, Tối ưu hóa hiệu năng và Bộ code SQL mẫu (Epicor & Oracle EBS)
sidebar_label: Báo cáo Tồn kho Chậm luân chuyển
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/bao-cao-ton-kho-cham-luan-chuyen
sidebar_position: 8020
date: 2026-08-17
tags: [erp, inventory, report, slow-moving, dead-stock, inventory-aging, performance-tuning, sql-query, oracle-ebs, epicor]
---

# Báo cáo Tồn kho Chậm luân chuyển (Slow-moving / Dead Stock) — Thuật toán tính Tuổi kho, Tối ưu hóa hiệu năng và Bộ code SQL mẫu (Epicor & Oracle EBS)

Báo cáo **Tồn kho chậm luân chuyển (Slow-moving / Dead Stock Report)** hay còn gọi là *Báo cáo tuổi hàng tồn kho*, là công cụ đặc lực giúp Giám đốc tài chính (CFO) và Trưởng phòng Logistics giải phóng dòng tiền đang bị "chôn chân" trong kho. Báo cáo này giúp xác định chính xác các mặt hàng đã lâu không phát sinh giao dịch, hàng bị lỗi mốt hoặc phế liệu để kịp thời thanh lý hoặc trích lập dự phòng giảm giá hàng tồn kho.

Dưới góc độ lập trình SQL, đây là báo cáo rất dễ gây lỗi thắt cổ chai hiệu năng (Performance Bottleneck). Việc quét qua hàng chục triệu dòng lịch sử để tìm ra ngày phát sinh giao dịch gần nhất của từng mã hàng là một thử thách thực sự về mặt tối ưu hóa câu lệnh.

---

## 1. Ý nghĩa Nghiệp vụ & Chỉ số cốt lõi (Key Metrics)

Một mặt hàng nằm im trong kho không chỉ làm lãng phí diện tích kệ mà còn làm tăng chi phí cơ hội, chi phí bảo quản và rủi ro hư hỏng.

### Các chỉ số bắt buộc của báo cáo:
* **Số ngày bất động (Days Inactive):** Số ngày tính từ ngày phát sinh giao dịch kho gần nhất (nhập hoặc xuất) đến ngày hiện tại.
* **Phân nhóm độ tuổi (Inventory Aging Buckets):** Phân loại tuổi kho thành các nhóm để dễ quản lý, thông thường gồm:
  * *Dưới 90 ngày:* Hàng hoạt động bình thường.
  * *91 - 180 ngày:* Bắt đầu chậm luân chuyển (Slow-moving).
  * *181 - 360 ngày:* Chậm luân chuyển nghiêm trọng.
  * *Trên 360 ngày:* Hàng tồn kho chết (Dead Stock / Obsolete).
* **Trị giá chôn chân (Tied-up Capital):** Tổng trị giá tiền của lô hàng đang bị đóng băng tại vị trí kệ đó.

---

## 2. Bẫy hiệu năng & Chiến lược viết Query tối ưu

### ❌ Bẫy hiệu năng: Subquery lồng nhau tìm Max Transaction Date (Correlated Subquery)
Để tính số ngày bất động, lập trình viên bắt buộc phải tìm ngày giao dịch gần đây nhất (`Last Transaction Date`). Một cách viết sai lầm phổ biến là sử dụng câu lệnh `MAX(TranDate)` dưới dạng subquery lồng trực tiếp vào danh sách `SELECT` chính:

```sql
-- ⚠️ Cực kỳ chậm! Chạy Subquery cho từng dòng tồn kho
SELECT 
    pb.PartNum,
    (SELECT MAX(pt.TranDate) FROM Erp.PartTran pt WHERE pt.PartNum = pb.PartNum) AS LastTxDate
FROM Erp.PartBin pb
```
* **Tại sao đây là thảm họa?** Nếu bảng số dư `PartBin` có 10.000 dòng, Database sẽ phải thực hiện quét bảng giao dịch `PartTran` (hàng triệu dòng) đúng **10.000 lần** riêng biệt. Báo cáo sẽ bị treo ngay lập tức khi chạy trên hệ thống thật.

### ✔️ Chiến lược thiết kế Query đúng (Sử dụng pre-aggregated CTE):
Chúng ta sẽ gom nhóm và tìm ngày giao dịch lớn nhất trước bằng kỹ thuật **Common Table Expression (CTE)** hoặc bảng tạm (Temporary Table). Kỹ thuật này giúp hệ thống chỉ cần quét bảng giao dịch `PartTran` đúng **1 lần duy nhất** để nhóm ra danh sách ngày cuối của các mã hàng, sau đó tiến hành `INNER JOIN` với bảng số dư tồn kho.

---

## 3. Bộ code SQL Báo cáo Tồn kho chậm luân chuyển mẫu (Tối ưu)

### 💻 Code SQL dành cho Epicor ERP (Sử dụng CTE tối ưu):
```sql
WITH LastTransactions AS (
    -- Quét bảng giao dịch đúng 1 lần duy nhất để lấy ngày cuối của các mã hàng
    SELECT 
        pt.Company,
        pt.PartNum,
        MAX(pt.TranDate) AS LastTxDate
    FROM Erp.PartTran pt
    GROUP BY pt.Company, pt.PartNum
)
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ],
    pb.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả sản phẩm],
    pb.OnhandQty AS [Số lượng tồn],
    (pc.MtlUnitCost + pc.LbrUnitCost + pc.BurUnitCost) AS [Đơn giá vốn],
    (pb.OnhandQty * (pc.MtlUnitCost + pc.LbrUnitCost + pc.BurUnitCost)) AS [Trị giá chôn chân (USD)],
    lt.LastTxDate AS [Ngày giao dịch cuối],
    -- Tính số ngày bất động
    DATEDIFF(day, lt.LastTxDate, GETDATE()) AS [Số ngày chậm luân chuyển],
    -- Phân nhóm độ tuổi tồn kho (Aging Buckets)
    CASE 
        WHEN DATEDIFF(day, lt.LastTxDate, GETDATE()) <= 90 THEN '0 - 90 ngày'
        WHEN DATEDIFF(day, lt.LastTxDate, GETDATE()) <= 180 THEN '91 - 180 ngày'
        WHEN DATEDIFF(day, lt.LastTxDate, GETDATE()) <= 360 THEN '181 - 360 ngày'
        ELSE 'Trên 360 ngày (Dead Stock)'
    END AS [Phân nhóm độ tuổi]
FROM Erp.PartBin pb
INNER JOIN Erp.Part p 
    ON pb.Company = p.Company AND pb.PartNum = p.PartNum
INNER JOIN Erp.PartCost pc 
    ON pb.Company = pc.Company AND pb.PartNum = pc.PartNum
LEFT JOIN LastTransactions lt 
    ON pb.Company = lt.Company AND pb.PartNum = lt.PartNum
WHERE pb.OnhandQty > 0
  -- Lọc các vật tư chậm luân chuyển từ 90 ngày trở lên
  AND DATEDIFF(day, lt.LastTxDate, GETDATE()) >= 90
ORDER BY [Số ngày chậm luân chuyển] DESC;
```

### 💻 Code SQL dành cho Oracle EBS R12:
```sql
WITH last_tx_summary AS (
    -- Gom nhóm dữ liệu giao dịch trước để tối ưu hóa hiệu năng
    SELECT 
        inventory_item_id,
        organization_id,
        MAX(transaction_date) AS last_tx_date
    FROM mtl_material_transactions
    GROUP BY inventory_item_id, organization_id
)
SELECT 
    moqd.subinventory_code AS subinventory,
    mil.segment1 || '.' || mil.segment2 AS locator_name,
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    SUM(moqd.transaction_quantity) AS onhand_qty,
    cic.item_cost AS unit_cost,
    SUM(moqd.transaction_quantity * cic.item_cost) AS total_value, -- Trị giá chôn chân
    lts.last_tx_date AS last_transaction_date,
    -- Tính số ngày bất động
    ROUND(SYSDATE - lts.last_tx_date) AS days_inactive,
    -- Phân nhóm độ tuổi tồn kho (Aging Buckets)
    CASE 
        WHEN ROUND(SYSDATE - lts.last_tx_date) <= 90 THEN '0 - 90 ngày'
        WHEN ROUND(SYSDATE - lts.last_tx_date) <= 180 THEN '91 - 180 ngày'
        WHEN ROUND(SYSDATE - lts.last_tx_date) <= 360 THEN '181 - 360 ngày'
        ELSE 'Trên 360 ngày (Dead Stock)'
    END AS inventory_aging_bucket
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
LEFT JOIN mtl_item_locations mil 
    ON moqd.locator_id = mil.inventory_location_id AND moqd.organization_id = mil.organization_id
LEFT JOIN mst_item_costs cic -- Hoặc cst_item_costs tùy hệ thống
    ON moqd.inventory_item_id = cic.inventory_item_id 
    AND moqd.organization_id = cic.organization_id 
    AND cic.cost_type_id = 1
LEFT JOIN last_tx_summary lts 
    ON moqd.inventory_item_id = lts.inventory_item_id AND moqd.organization_id = lts.organization_id
GROUP BY moqd.subinventory_code, mil.segment1, mil.segment2, msi.segment1, msi.description, cic.item_cost, lts.last_tx_date
HAVING SUM(moqd.transaction_quantity) > 0
   AND ROUND(SYSDATE - lts.last_tx_date) >= 90      -- Chỉ lọc chậm luân chuyển từ 90 ngày trở lên
ORDER BY days_inactive DESC;
```

---

## 5. Checklist thiết kế Giao diện và Tham số lọc báo cáo (UI & Filters)

Khi thiết kế báo cáo Tuổi hàng tồn kho, bạn cần đảm bảo các tính năng kiểm soát sau trên giao diện người dùng:

- [ ] **Bộ lọc số ngày bất động tối thiểu (Min Days Inactive Filter):** Cho phép người dùng nhập số ngày tối thiểu để lọc (ví dụ: chỉ xem hàng chậm luân chuyển từ 180 ngày trở lên hoặc chỉ xem Dead Stock từ 360 ngày trở lên).
- [ ] **Lọc theo Nhóm vật tư (Item Category Filter):** Giúp bộ phận kế hoạch lọc nhanh nhóm vật tư cụ thể để đưa ra chiến lược xử lý (ví dụ: nguyên vật liệu thô chậm luân chuyển sẽ chuyển trả NCC, thành phẩm lỗi mốt sẽ làm chương trình khuyến mãi giảm giá).
- [ ] **Tính năng lọc theo Kho / Site:** Cho phép lọc riêng các kho bảo hành, kho phế liệu ra khỏi kho bán chính thức để tránh làm nhiễu số liệu trích lập dự phòng tài chính.
- [ ] **Cơ chế phân loại trực quan (Color Coding):** Thiết kế định dạng màu sắc (Conditional Formatting) trên báo cáo Excel xuất ra: Đỏ cho nhóm *Dead Stock* (> 360 ngày), Vàng cho nhóm *Slow-moving* (> 180 ngày) để thu hút sự chú ý của người phân tích dữ liệu.
