---
id: bao-cao-nhap-xuat-ton-inventory-movement-ledger
title: Báo cáo Nhập - Xuất - Tồn (Inventory Ledger) — Thuật toán tính Tồn đầu kỳ, Tối ưu hóa hiệu năng và Bộ code SQL mẫu (Epicor & Oracle EBS)
sidebar_label: Báo cáo Nhập - Xuất - Tồn
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/bao-cao-nhap-xuat-ton
sidebar_position: 8010
date: 2026-08-16
tags: [erp, inventory, report, stock-ledger, opening-balance, performance-tuning, sql-query, oracle-ebs, epicor]
---

# Báo cáo Nhập - Xuất - Tồn (Inventory Ledger) — Thuật toán tính Tồn đầu kỳ, Tối ưu hóa hiệu năng và Bộ code SQL mẫu (Epicor & Oracle EBS)

Báo cáo **Nhập - Xuất - Tồn (Inventory Movement Ledger / Stock Card)** hay còn gọi là *Sổ chi tiết vật tư*, là báo cáo pháp lý bắt buộc và quan trọng nhất của kế toán kho. Báo cáo này cung cấp cái nhìn toàn cảnh về sự biến động của dòng chảy vật tư trong một khoảng thời gian (Từ ngày $\rightarrow$ Đến ngày):
$$\text{Tồn cuối kỳ} = \text{Tồn đầu kỳ} + \text{Tổng Nhập trong kỳ} - \text{Tổng Xuất trong kỳ}$$

Đối với lập trình viên ERP, đây là thử thách kỹ thuật lớn nhất trong phân hệ Báo cáo. Việc tính toán số lượng tồn kho lùi về quá khứ (Tồn đầu kỳ) đòi hỏi một chiến lược thiết kế câu lệnh SQL cực kỳ tối ưu, nếu không muốn báo cáo bị quay tròn vô tận hoặc làm sập Database của doanh nghiệp.

---

## 1. Ý nghĩa Nghiệp vụ & Chỉ số cốt lõi (Key Metrics)

Báo cáo Nhập - Xuất - Tồn là công cụ chính để Kế toán trưởng đối chiếu số liệu tổng hợp cuối tháng, cơ quan Thuế rà soát biến động tài sản, và bộ phận kế hoạch đánh giá tốc độ luân chuyển hàng hóa.

### Các chỉ số bắt buộc của báo cáo:
* **Tồn đầu kỳ (Opening Balance):** Số lượng và giá trị tồn kho tại thời điểm bắt đầu kỳ báo cáo.
* **Nhập trong kỳ (Total Received):** Tổng số lượng và giá trị vật tư nạp vào kho từ tất cả các nguồn (Mua hàng PO, Sản xuất WO, Điều chỉnh, Nhập trả hàng).
* **Xuất trong kỳ (Total Issued):** Tổng số lượng và giá trị vật tư xuất ra khỏi kho (Bán hàng, Đưa vào sản xuất, Xuất trả hàng, Điều chỉnh giảm).
* **Tồn cuối kỳ (Closing Balance):** Số lượng và giá trị tồn kho tại thời điểm kết thúc kỳ báo cáo.

---

## 2. Bẫy hiệu năng & Chiến lược thiết kế thuật toán tính "Tồn đầu kỳ"

### ❌ Bẫy hiệu năng: Quét toàn bộ lịch sử (Full Scan) để tính Tồn đầu kỳ
Để tính tồn đầu kỳ ngày `01/08/2026`, nhiều lập trình viên viết SQL bằng cách chạy lệnh `SUM(Qty)` toàn bộ lịch sử giao dịch từ ngày khởi tạo hệ thống (vài năm trước) cho đến ngày `31/07/2026`. 
* **Tại sao đây là thảm họa?** Bảng giao dịch kho (`PartTran`/`MTL_MATERIAL_TRANSACTIONS`) của doanh nghiệp sản xuất lớn có thể lên tới **hàng chục triệu dòng**. Việc bắt hệ thống quét toàn bộ lịch sử cho mỗi mã hàng mỗi khi chạy báo cáo sẽ làm sập Database ngay lập tức.

### ✔️ 2 Chiến lược thiết kế thuật toán tối ưu:

#### Chiến lược 1: Tính toán lùi từ Tồn kho hiện tại (Current On-hand minus Delta)
Chiến lược này lấy **Số dư tồn kho hiện tại thời gian thực** (rất nhẹ, lấy từ bảng `PartBin`/`MTL_ONHAND` tại giây phút hiện tại) rồi cộng/trừ ngược lại các giao dịch phát sinh từ thời điểm hiện tại lùi về ngày cần báo cáo.
* *Ưu điểm:* Cực kỳ nhanh nếu kỳ báo cáo gần với thời điểm hiện tại (ví dụ chạy báo cáo cho tháng hiện tại).
* *Nhược điểm:* Chạy chậm nếu kỳ báo cáo nằm quá sâu trong quá khứ (ví dụ chạy báo cáo cho 2 năm trước).

#### Chiến lược 2: Sử dụng bảng Chốt kỳ lịch sử (Period Summary Snapshot)
Các hệ thống ERP chuẩn luôn có một tác vụ chạy đóng sổ cuối tháng (Period Close) để chốt số dư cuối kỳ của tháng đó và lưu vào một bảng tĩnh (ví dụ: tháng 7 chốt tồn cuối kỳ là 100 cái). 
* Để tính tồn đầu kỳ ngày `15/08/2026`, hệ thống chỉ cần: Lấy số dư cuối kỳ tháng 7 từ bảng tĩnh (`100`) + Cộng dồn các giao dịch phát sinh từ ngày `01/08` đến `14/08`.
* *Ưu điểm:* Tốc độ truy vấn siêu nhanh và ổn định bất kể thời gian trong quá khứ. Đây là giải pháp **"thực chiến" nhất** của các chuyên gia ERP.

---

## 3. Bộ code SQL Báo cáo Nhập - Xuất - Tồn mẫu (Tối ưu bằng CTE)

Dưới đây là câu lệnh SQL sử dụng kỹ thuật **Common Table Expression (CTE)** để gộp và tính toán dữ liệu Nhập - Xuất - Tồn chỉ trong 1 lần quét bảng giao dịch kho, tối ưu hóa tối đa hiệu năng:

### 💻 Code SQL dành cho Epicor ERP:
```sql
DECLARE @FromDate DATE = '2026-08-01';
DECLARE @ToDate DATE = '2026-08-31';
DECLARE @Company VARCHAR(10) = 'your_company_code';

WITH AggregatedTrans AS (
    SELECT 
        pt.PartNum,
        -- 1. Tính tồn đầu kỳ (Tổng lượng giao dịch phát sinh trước FromDate)
        -- Giao dịch làm tăng kho: Nhân với 1, giao dịch giảm kho: Nhân với -1
        SUM(CASE WHEN pt.TranDate < @FromDate THEN pt.TranQty * 
            (CASE WHEN pt.TranType IN ('PUR-STK', 'MFG-STK', 'RMA-STK', 'PLT-STK') THEN 1 ELSE -1 END) ELSE 0 END) AS OpeningQty,
        
        -- 2. Tổng Nhập trong kỳ
        SUM(CASE WHEN pt.TranDate >= @FromDate AND pt.TranDate <= @ToDate AND pt.TranType IN ('PUR-STK', 'MFG-STK', 'RMA-STK', 'PLT-STK') THEN pt.TranQty ELSE 0 END) AS InQty,
        
        -- 3. Tổng Xuất trong kỳ
        SUM(CASE WHEN pt.TranDate >= @FromDate AND pt.TranDate <= @ToDate AND pt.TranType IN ('STK-CUS', 'STK-MTL', 'STK-VEN', 'STK-PLT') THEN pt.TranQty ELSE 0 END) AS OutQty
    FROM Erp.PartTran pt
    WHERE pt.Company = @Company
    GROUP BY pt.PartNum
)
SELECT 
    at.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả sản phẩm],
    p.IUM AS [Đơn vị tính],
    at.OpeningQty AS [Tồn đầu kỳ],
    at.InQty AS [Nhập trong kỳ],
    at.OutQty AS [Xuất trong kỳ],
    (at.OpeningQty + at.InQty - at.OutQty) AS [Tồn cuối kỳ]
FROM AggregatedTrans at
INNER JOIN Erp.Part p 
    ON p.Company = @Company AND p.PartNum = at.PartNum
WHERE (at.OpeningQty <> 0 OR at.InQty <> 0 OR at.OutQty <> 0); -- Ẩn các mã không hoạt động trong kỳ
```

### 💻 Code SQL dành cho Oracle EBS R12:
Oracle EBS lưu số lượng giao dịch đã có sẵn dấu âm/dương (`primary_quantity`) trong bảng `MTL_MATERIAL_TRANSACTIONS` nên câu lệnh SQL tinh gọn và tối ưu hơn rất nhiều:
```sql
SELECT 
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    msi.primary_uom_code AS uom,
    -- 1. Tính tồn đầu kỳ (Tổng lượng giao dịch trước ngày Từ ngày)
    SUM(CASE WHEN mmt.transaction_date < :from_date THEN mmt.primary_quantity ELSE 0 END) AS opening_qty,
    -- 2. Tổng Nhập trong kỳ (Giao dịch có số lượng dương trong khoảng ngày)
    SUM(CASE WHEN mmt.transaction_date BETWEEN :from_date AND :to_date AND mmt.primary_quantity > 0 THEN mmt.primary_quantity ELSE 0 END) AS in_qty,
    -- 3. Tổng Xuất trong kỳ (Giao dịch có số lượng âm trong khoảng ngày, lấy giá trị tuyệt đối)
    SUM(CASE WHEN mmt.transaction_date BETWEEN :from_date AND :to_date AND mmt.primary_quantity < 0 THEN ABS(mmt.primary_quantity) ELSE 0 END) AS out_qty,
    -- 4. Tính tồn cuối kỳ (Tổng lượng giao dịch đến hết ngày Đến ngày)
    SUM(CASE WHEN mmt.transaction_date <= :to_date THEN mmt.primary_quantity ELSE 0 END) AS closing_qty
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE mmt.organization_id = :org_id
GROUP BY msi.segment1, msi.description, msi.primary_uom_code
HAVING (SUM(CASE WHEN mmt.transaction_date < :from_date THEN mmt.primary_quantity ELSE 0 END) <> 0 
    OR SUM(CASE WHEN mmt.transaction_date BETWEEN :from_date AND :to_date THEN mmt.primary_quantity ELSE 0 END) <> 0);
```

---

## 4. Checklist thiết kế Giao diện và Tham số lọc báo cáo (UI & Filters)

Khi thiết kế báo cáo Nhập - Xuất - Tồn trên hệ thống, lập trình viên bắt buộc phải đảm bảo các tính năng kiểm soát sau trên giao diện:

- [ ] **Bắt buộc nhập Khoảng ngày (Mandatory Date Range):** Khóa tính năng chạy báo cáo không giới hạn thời gian. Bắt buộc người dùng phải nhập trường `Từ ngày` và `Đến ngày` để giới hạn phạm vi quét của câu lệnh SQL.
- [ ] **Lọc theo Chi nhánh / Kho (Subinventory/Site Filter):** Hỗ trợ người dùng xuất báo cáo Nhập - Xuất - Tồn cho từng kho cụ thể (kho nguyên liệu, kho thành phẩm) thay vì dồn chung tất cả các kho vào một bảng khó đối soát chéo tài khoản kế toán.
- [ ] **Tùy chọn hiển thị mã không biến động (Show/Hide No-movement Items):** Cung cấp bộ lọc cho phép ẩn đi các mã vật tư không phát sinh giao dịch nhập/xuất trong kỳ (nhưng số dư đầu kỳ vẫn khác 0) để báo cáo tập trung hơn.
- [ ] **Ràng buộc kiểm tra ngày khóa sổ:** Cảnh báo người dùng nếu họ chọn ngày báo cáo nằm trong các kỳ kế toán đã khóa sổ (GL Period Closed), vì số liệu lúc này đã được kế toán đóng băng để nộp báo cáo tài chính.
