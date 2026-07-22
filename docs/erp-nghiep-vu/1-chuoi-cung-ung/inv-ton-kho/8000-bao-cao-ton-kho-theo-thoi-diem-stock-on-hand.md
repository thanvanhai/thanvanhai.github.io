---
id: bao-cao-ton-kho-theo-thoi-diem-stock-on-hand
title: Báo cáo Tồn kho theo Thời điểm (Stock on Hand) — Kiến trúc truy vấn dữ liệu lớn, Bẫy hiệu năng và Bộ code SQL mẫu (Epicor & Oracle EBS)
sidebar_label: Báo cáo Tồn kho theo Thời điểm
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/bao-cao-stock-on-hand
sidebar_position: 8000
date: 2026-08-15
tags: [erp, inventory, report, analytics, stock-on-hand, performance-tuning, sql-query, oracle-ebs, epicor]
---

# Báo cáo Tồn kho theo Thời điểm (Stock on Hand) — Kiến trúc truy vấn dữ liệu lớn, Bẫy hiệu năng và Bộ code SQL mẫu (Epicor & Oracle EBS)

Báo cáo **Tồn kho theo thời điểm (Stock on Hand / Inventory Balance Report)** là báo cáo có tần suất sử dụng lớn nhất trong phân hệ Kho. Báo cáo này trả lời cho câu hỏi cốt lõi của doanh nghiệp tại thời điểm hiện tại: *Trong kho đang có chính xác bao nhiêu hàng hóa, nằm ở những vị trí ô kệ nào, và tổng giá trị quy đổi ra tiền là bao nhiêu?*

Đối với lập trình viên ERP, đây là bài kiểm tra đầu tiên về năng lực tối ưu hóa câu lệnh SQL. Nếu không hiểu cấu trúc bảng lưu trữ số dư, bạn rất dễ viết ra những câu lệnh SQL "ngây thơ" quét qua toàn bộ lịch sử giao dịch, gây nghẽn toàn bộ Database của doanh nghiệp khi chạy báo cáo.

---

## 1. Ý nghĩa Nghiệp vụ & Chỉ số cốt lõi (Key Metrics)

Báo cáo Stock on Hand được sử dụng bởi Thủ kho (để đối chiếu vị trí xếp hàng), Bộ phận mua hàng & sản xuất (để biết lượng hàng khả dụng phục vụ lập kế hoạch), và Bộ phận Kế toán kho (để đối chiếu trị giá tài sản cuối ngày).

### Các chỉ số bắt buộc phải hiển thị trên báo cáo:
* **Mã hàng & Mô tả (Item Code & Description):** Định danh vật tư.
* **Tọa độ vật lý (Warehouse, Bin/Locator, Lot/Serial):** Vị trí chính xác của hàng hóa.
* **Số lượng tồn thực tế (On-hand Quantity):** Số lượng vật lý đang có trong kho.
* **Đơn giá vốn (Unit Cost):** Đơn giá tính theo phương pháp giá vốn đang áp dụng (Standard, Average, hoặc FIFO).
* **Tổng trị giá tồn kho (Total Inventory Value):** 
  $$\text{Tổng trị giá} = \text{Số lượng tồn thực tế} \times \text{Đơn giá vốn}$$

---

## 2. Chiến lược thiết kế Query & Bẫy hiệu năng (Performance Pitfalls)

### ❌ Bẫy hiệu năng: Quét toàn bộ lịch sử giao dịch kho (Full Table Scan on Transactions)
Một sai lầm kinh điển của các Junior Developer là khi viết báo cáo tồn kho hiện tại, họ sử dụng bảng lịch sử giao dịch (`PartTran` trong Epicor hoặc `MTL_MATERIAL_TRANSACTIONS` trong Oracle) rồi dùng hàm `SUM(Quantity)` để tính ra số dư tồn kho.

* **Tại sao đây là thảm họa?** Bảng lịch sử giao dịch ghi nhận mọi biến động nhập/xuất trong nhiều năm, dữ liệu có thể lên tới **hàng chục triệu dòng**. Việc bắt Database phải `SUM` hàng triệu dòng mỗi khi người dùng mở báo cáo sẽ làm CPU máy chủ nhảy lên 100%, gây đơ màn hình và làm treo toàn bộ các giao dịch xuất/nhập kho khác đang diễn ra trong nhà máy.

### ✔️ Chiến lược thiết kế Query đúng (Sử dụng bảng Số dư On-hand):
Hệ thống ERP lớn luôn thiết kế một bảng lưu trữ **Số dư tồn kho thời gian thực (Real-time On-hand Balance Table)**. Bảng này chỉ lưu số dư hiện tại của các ô kệ có số lượng khác 0, số lượng dòng cực kỳ ít (chỉ khoảng vài chục ngàn dòng cho một kho lớn).
* **Epicor:** Sử dụng bảng `Erp.PartBin` thay vì `Erp.PartTran`.
* **Oracle EBS:** Sử dụng bảng `MTL_ONHAND_QUANTITIES_DETAIL` thay vì `MTL_MATERIAL_TRANSACTIONS`.

---

## 3. Bộ code SQL Báo cáo Stock on Hand chuẩn hóa (Production-Ready)

Dưới đây là câu lệnh SQL được tối ưu hóa chỉ mục (Indexes) để truy vấn nhanh trị giá và số lượng tồn kho hiện tại:

### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ],
    pb.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả sản phẩm],
    p.IUM AS [Đơn vị tính],
    pb.LotNum AS [Số Lô],
    pb.OnhandQty AS [Số lượng tồn],
    -- Tính đơn giá vốn tổng hợp (Material + Labor + Burden) từ bảng chi phí PartCost
    (pc.MtlUnitCost + pc.LbrUnitCost + pc.BurUnitCost) AS [Đơn giá vốn],
    -- Tính tổng trị giá tồn kho của vị trí đó
    (pb.OnhandQty * (pc.MtlUnitCost + pc.LbrUnitCost + pc.BurUnitCost)) AS [Tổng trị giá tồn]
FROM Erp.PartBin pb
INNER JOIN Erp.Part p 
    ON pb.Company = p.Company AND pb.PartNum = p.PartNum
INNER JOIN Erp.PartCost pc 
    ON pb.Company = pc.Company AND pb.PartNum = pc.PartNum
WHERE pb.OnhandQty <> 0                             -- Chỉ lấy các vị trí thực tế có hàng
  AND pb.Company = 'your_company_code'              -- Điền mã Company của bạn
ORDER BY pb.WarehouseCode, pb.BinNum, pb.PartNum;
```

### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    mil.segment1 || '.' || mil.segment2 AS locator_name, -- Vị trí ô kệ
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    msi.primary_uom_code AS uom,
    moqd.lot_number AS lot_no,
    SUM(moqd.transaction_quantity) AS onhand_qty,    -- Cộng dồn số lượng tồn
    cic.item_cost AS unit_cost,                      -- Đơn giá vốn của Item
    SUM(moqd.transaction_quantity * cic.item_cost) AS total_value -- Tổng trị giá tồn
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
LEFT JOIN mtl_item_locations mil 
    ON moqd.locator_id = mil.inventory_location_id AND moqd.organization_id = mil.organization_id
LEFT JOIN cst_item_costs cic 
    ON moqd.inventory_item_id = cic.inventory_item_id 
    AND moqd.organization_id = cic.organization_id 
    AND cic.cost_type_id = 1                         -- 1: Frozen Cost (Standard Cost thực tế)
GROUP BY moqd.subinventory_code, mil.segment1, mil.segment2, msi.segment1, msi.description, msi.primary_uom_code, moqd.lot_number, cic.item_cost
HAVING SUM(moqd.transaction_quantity) <> 0           -- Chỉ hiển thị vị trí có số lượng khác 0
ORDER BY moqd.subinventory_code, locator_name, msi.segment1;
```

---

## 4. Checklist thiết kế Giao diện và Tham số lọc báo cáo (UI & Filters)

Khi lập trình màn hình xuất báo cáo Stock on Hand cho người dùng cuối, bạn bắt buộc phải thiết kế các bộ lọc và tính năng sau để tối ưu hiệu năng và trải nghiệm:

- [ ] **Bộ lọc Kho (Warehouse / Subinventory Filter):** Cho phép người dùng chọn xem của một kho cụ thể hoặc xem toàn bộ nhà máy. Truy vấn SQL bắt buộc phải áp bộ lọc này vào điều kiện `WHERE` đầu tiên để thu hẹp vùng quét dữ liệu.
- [ ] **Bộ lọc Nhóm hàng (Item Category Filter):** Hỗ trợ thủ kho chỉ kết xuất dữ liệu của một nhóm hàng cụ thể (ví dụ: chỉ xem nhóm gỗ, hoặc chỉ xem nhóm bao bì) thay vì xuất ra file Excel khổng lồ chứa tất cả các mã hàng.
- [ ] **Tùy chọn ẩn số dư bằng không (Hide Zero Balance):** Luôn để mặc định tùy chọn này hoạt động để ẩn đi các ô kệ đã hết hàng, giúp báo cáo gọn gàng hơn.
- [ ] **Xuất dữ liệu thô ra Excel dạng dẹt (Raw Data Export):** Thiết kế định dạng xuất Excel dạng bảng dẹt (Flat Table), không merge ô (merge cells) để thủ kho hoặc kế toán có thể dễ dàng sử dụng tính năng Pivot Table để phân tích số liệu sau khi kết xuất.
