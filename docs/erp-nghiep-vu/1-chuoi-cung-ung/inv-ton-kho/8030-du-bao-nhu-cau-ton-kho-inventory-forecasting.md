---
id: du-bao-nhu-cau-ton-kho-inventory-forecasting
title: Dự báo Nhu cầu Tồn kho (Inventory Forecasting) — Thuật toán dự báo, Tính toán Safety Stock và Bộ code SQL mẫu (Epicor & Oracle EBS)
sidebar_label: Dự báo Nhu cầu Tồn kho
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/du-bao-nhu-cau-ton-kho
sidebar_position: 8030
date: 2026-08-18
tags: [erp, inventory, report, forecasting, safety-stock, reorder-point, demand-volatility, sql-query, oracle-ebs, epicor]
---

# Dự báo Nhu cầu Tồn kho (Inventory Forecasting) — Thuật toán dự báo, Tính toán Safety Stock và Bộ code SQL mẫu (Epicor & Oracle EBS)

Trong khi các báo cáo trước đó (Stock on Hand, Nhập-Xuất-Tồn, Chậm luân chuyển) tập trung giải quyết câu hỏi về số liệu quá khứ và hiện tại, **Báo cáo Dự báo nhu cầu tồn kho (Inventory Forecasting / Demand Forecasting)** đưa hệ thống dịch chuyển sang phân tích dự đoán (Predictive Analytics). 

Mục tiêu tối thượng của báo cáo này là: Phân tích lịch sử biến động tiêu thụ vật tư để tự động đề xuất thông số **Tồn kho an toàn động (Dynamic Safety Stock)** và **Điểm đặt hàng lại (Reorder Point - ROP)** phù hợp nhất với tình hình thị trường, thay vì để người dùng nhập thông số tĩnh cảm tính.

---

## 1. Ý nghĩa Nghiệp vụ & Chỉ số cốt lõi (Key Metrics)

Báo cáo này là "kim chỉ nam" cho phòng mua hàng, giúp tối ưu hóa vốn lưu động (Working Capital): Vừa không để kho bị cạn kiệt vật tư gây dừng máy, vừa không mua quá nhiều gây ứ đọng vốn.

### Các chỉ số bắt buộc của báo cáo:
* **Lượng tiêu thụ trung bình ngày (ADU - Average Daily Usage):** Số lượng vật tư thực xuất trung bình trong 1 ngày làm việc.
* **Độ lệch chuẩn tiêu thụ (Demand Volatility - $\sigma$):** Chỉ số đo lường mức độ biến động thất thường của nhu cầu sử dụng (tiêu thụ đều đặn hay lúc trồi lúc sụt).
* **Tồn kho an toàn đề xuất (Recommended Safety Stock):** Lượng hàng dự phòng tối thiểu được tính toán bằng toán học thống kê.
* **Điểm đặt hàng lại đề xuất (Recommended Reorder Point - ROP):** Ngưỡng báo động đặt hàng mới dựa trên lượng tiêu thụ thực tế và Lead Time hiện tại của nhà cung cấp.

---

## 2. Thuật toán thống kê tính toán Tồn kho an toàn động (Dynamic Safety Stock)

Hệ thống ERP cao cấp tính toán Tồn kho an toàn dựa trên công thức xác suất thống kê chuẩn:

$$\text{Safety Stock} = Z \times \sigma_{\text{Daily}} \times \sqrt{L}$$

* Trong đó:
  * **$Z$ (Service Level Factor):** Hệ số mức độ phục vụ khách hàng mong muốn. Ví dụ: Để đạt mức sẵn sàng phục vụ 95% (chỉ chấp nhận rủi ro hết hàng 5%), kế toán chọn hệ số $Z = 1.65$.
  * **$\sigma_{\text{Daily}}$ (Standard Deviation of Daily Demand):** Độ lệch chuẩn tiêu thụ ngày của vật tư trong một khoảng thời gian lịch sử (thường quét 6 hoặc 12 tháng gần nhất).
  * **$L$ (Lead Time):** Thời gian cam kết giao hàng của nhà cung cấp tính theo ngày.

---

## 3. Bẫy hiệu năng & Chiến lược viết Query tối ưu

### ❌ Bẫy hiệu năng: Tính Độ lệch chuẩn trực tiếp trên bảng dữ liệu thô (Standard Deviation on Raw Transactions)
Hàm tính toán độ lệch chuẩn (`STDEV` trong SQL Server hoặc `STDDEV` trong Oracle) là một phép toán rất ngốn tài nguyên CPU. Lỗi phổ biến của các lập trình viên là chạy hàm này trực tiếp trên bảng lịch sử giao dịch thô chứa hàng triệu dòng (`PartTran` / `MTL_MATERIAL_TRANSACTIONS`).

```sql
-- ⚠️ Cực kỳ chậm! CPU sẽ nhảy lên 100% trên hệ thống lớn
SELECT PartNum, STDEV(TranQty) FROM Erp.PartTran GROUP BY PartNum
```

### ✔️ Chiến lược thiết kế Query đúng (Gom nhóm 2 tầng - Two-tier Aggregation):
Để tối ưu hóa hiệu năng, chúng ta không tính toán trực tiếp trên dữ liệu thô. Thay vào đó, chúng ta sẽ thực hiện gom nhóm dữ liệu theo từng tháng trước (mỗi mã hàng chỉ còn tối đa 12 dòng ứng với 12 tháng), sau đó mới chạy hàm tính độ lệch chuẩn trên 12 dòng tóm tắt này. Chiến lược này giúp Database chạy cực kỳ nhanh và nhẹ nhàng.

---

## 4. Bộ code SQL Dự báo Nhu cầu Tồn kho & Đề xuất ROP/Safety Stock mẫu (Tối ưu)

### 💻 Code SQL dành cho Epicor ERP (Sử dụng CTE gom nhóm 2 tầng):
```sql
DECLARE @Company VARCHAR(10) = 'your_company_code';
DECLARE @ServiceLevelFactor FLOAT = 1.65;              -- Mức độ phục vụ mong muốn 95% (Z = 1.65)

WITH MonthlyUsage AS (
    -- Bước 1: Gom nhóm lượng xuất bán (STK-CUS) và xuất sản xuất (STK-MTL) theo từng tháng trong 12 tháng qua
    SELECT 
        pt.PartNum,
        DATEPART(year, pt.TranDate) AS [Year],
        DATEPART(month, pt.TranDate) AS [Month],
        SUM(pt.TranQty) AS MonthlyQty
    FROM Erp.PartTran pt
    WHERE pt.Company = @Company
      AND pt.TranType IN ('STK-CUS', 'STK-MTL')        -- Chỉ tính tiêu thụ thực tế
      AND pt.TranDate >= DATEADD(month, -12, GETDATE())
    GROUP BY pt.PartNum, DATEPART(year, pt.TranDate), DATEPART(month, pt.TranDate)
),
StatsSummary AS (
    -- Bước 2: Tính Trung bình tháng, Độ lệch chuẩn tháng và quy đổi ra dữ liệu ngày (Giả sử 1 tháng có 30 ngày)
    SELECT 
        mu.PartNum,
        AVG(mu.MonthlyQty) AS AvgMonthlyQty,
        AVG(mu.MonthlyQty) / 30.0 AS AvgDailyUsage,
        -- Tính độ lệch chuẩn tháng bằng STDEV và chia 30 để ra độ lệch chuẩn ngày tạm tính
        COALESCE(STDEV(mu.MonthlyQty), 0) AS StdDevMonthlyQty,
        COALESCE(STDEV(mu.MonthlyQty), 0) / 30.0 AS StdDevDailyUsage
    FROM MonthlyUsage mu
    GROUP BY mu.PartNum
)
-- Bước 3: Join với danh mục gốc và chi nhánh để lấy Lead Time thực tế tính ra ROP/Safety Stock đề xuất
SELECT 
    ss.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả sản phẩm],
    p.IUM AS [Đơn vị tính],
    pp.LeadTime AS [Lead Time mua hàng (Ngày)],
    pp.MinimumQty AS [Safety Stock hiện tại],
    -- Tính đề xuất Safety Stock = Z (1.65) * StdDev * SQRT(LeadTime)
    ROUND(@ServiceLevelFactor * ss.StdDevDailyUsage * SQRT(pp.LeadTime), 2) AS [Safety Stock đề xuất],
    pp.MinimumQty AS [Reorder Point hiện tại],
    -- Điểm ROP đề xuất = (Lượng tiêu thụ trung bình ngày * LeadTime) + Safety Stock đề xuất
    ROUND((ss.AvgDailyUsage * pp.LeadTime) + (@ServiceLevelFactor * ss.StdDevDailyUsage * SQRT(pp.LeadTime)), 2) AS [Reorder Point đề xuất]
FROM StatsSummary ss
INNER JOIN Erp.Part p ON p.Company = @Company AND p.PartNum = ss.PartNum
INNER JOIN Erp.PartPlant pp ON pp.Company = @Company AND pp.PartNum = ss.PartNum
WHERE pp.LeadTime > 0;
```

### 💻 Code SQL dành cho Oracle EBS R12:
```sql
WITH monthly_usage AS (
    -- Bước 1: Gom lượng xuất kho bán hàng và sản xuất theo tháng trong 12 tháng qua
    SELECT 
        mmt.inventory_item_id,
        mmt.organization_id,
        TO_CHAR(mmt.transaction_date, 'YYYY-MM') AS tx_month,
        SUM(ABS(mmt.primary_quantity)) AS monthly_qty
    FROM mtl_material_transactions mmt
    WHERE mmt.transaction_type_id IN (33, 35)       -- 33: Sales Issue, 35: WIP Issue
      AND mmt.transaction_date >= ADD_MONTHS(SYSDATE, -12)
    GROUP BY mmt.inventory_item_id, mmt.organization_id, TO_CHAR(mmt.transaction_date, 'YYYY-MM')
),
stats_summary AS (
    -- Bước 2: Tính toán tiêu dùng trung bình ngày và độ lệch chuẩn (STDDEV)
    SELECT 
        mu.inventory_item_id,
        mu.organization_id,
        AVG(mu.monthly_qty) AS avg_monthly_qty,
        AVG(mu.monthly_qty) / 30.0 AS avg_daily_usage,
        NVL(STDDEV(mu.monthly_qty), 0) AS std_dev_monthly_qty,
        NVL(STDDEV(mu.monthly_qty), 0) / 30.0 AS std_dev_daily_usage
    FROM monthly_usage mu
    GROUP BY mu.inventory_item_id, mu.organization_id
)
-- Bước 3: Join với Item Master để tính toán công thức xác suất thống kê
SELECT 
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    msi.primary_uom_code AS uom,
    msi.full_lead_time AS lead_time_days,
    msi.safety_stock_bucket_days AS current_safety_stock,
    -- Tính đề xuất Tồn an toàn (Safety Stock) = Z (1.65 - mức phục vụ 95%) * StdDev * SQRT(LeadTime)
    ROUND(1.65 * ss.std_dev_daily_usage * SQRT(msi.full_lead_time), 2) AS recommended_safety_stock,
    -- Điểm ROP đề xuất = (Tiêu thụ trung bình ngày * LeadTime) + Safety Stock đề xuất
    ROUND((ss.avg_daily_usage * msi.full_lead_time) + (1.65 * ss.std_dev_daily_usage * SQRT(msi.full_lead_time)), 2) AS recommended_reorder_point
FROM stats_summary ss
INNER JOIN mtl_system_items_b msi 
    ON ss.inventory_item_id = msi.inventory_item_id AND ss.organization_id = msi.organization_id
WHERE msi.full_lead_time > 0
  AND msi.organization_id = :org_id;                -- Điền mã Organization của bạn
```

---

## 5. Checklist thiết kế Giao diện và Tham số lọc báo cáo (UI & Filters)

Khi lập trình tính năng Dự báo nhu cầu tồn kho, bạn cần thiết kế các tham số lọc và kiểm soát sau trên giao diện người dùng:

- [ ] **Tham số Hệ số dịch vụ (Service Level Factor - Z):** Cung cấp hộp chọn (Dropdown) cho phép người dùng cấu hình mức độ ưu tiên của dịch vụ (ví dụ: Chọn 95% hệ thống tự động gán $Z=1.65$; Chọn 99% hệ thống tự gán $Z=2.33$) để tự động thay đổi độ nhạy của thuật toán.
- [ ] **Lọc theo Nhóm vật tư (Item Category / Part Class):** Giúp bộ phận kế hoạch cung ứng chỉ chạy dự báo cho một nhóm hàng cụ thể (ví dụ: chỉ chạy cho các mặt hàng bán chạy nhất thuộc nhóm A) nhằm tối ưu hóa thời gian chạy máy.
- [ ] **Lọc theo Chi nhánh / Site:** Vì thông số Lead Time và tồn kho an toàn của cùng một mã hàng ở các chi nhánh/nhà máy khác nhau là hoàn toàn khác nhau, bắt buộc giao diện phải có bộ lọc chạy báo cáo chi tiết cho từng Site cụ thể.
- [ ] **Nút "Cập nhật hàng loạt" (Bulk Update Action):** Thiết kế nút bấm cho phép Key User sau khi xem xét và duyệt các đề xuất ROP/Safety Stock mới của báo cáo, có thể nhấn nút để hệ thống tự động cập nhật (Update) hàng loạt các thông số mới này vào danh mục Item Master gốc của ERP.
