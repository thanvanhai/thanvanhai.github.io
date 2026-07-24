---
id: don-vi-tinh-va-quy-doi-uom-conversion
title: Đơn vị tính và Quy đổi (UOM Conversion)
description: Quy đổi chéo nhóm, Lỗi làm tròn số lẻ và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Quy đổi Đơn vị tính (UOM)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/uom-conversion
sidebar_position: 7010
date: 2026-08-12
tags: [erp, inventory, uom, conversion, uom-class, rounding-error, sql-audit, oracle-ebs, epicor]
---

# 7010 Đơn vị tính và Quy đổi (UOM Conversion) 

> Quy đổi chéo nhóm, Lỗi làm tròn số lẻ và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong hệ thống ERP, việc quản lý hàng hóa với nhiều đơn vị tính (UOM) khác nhau là nhu cầu bắt buộc của mọi doanh nghiệp. Phòng mua hàng muốn đặt mua thép theo **Tấn** (để có giá sỉ tốt), thủ kho muốn quản lý tồn kho theo **Cây** (để dễ xếp lên giá kệ), và phân xưởng muốn xuất sản xuất theo **Mét** (để cắt theo bản vẽ).

Để kết nối các phòng ban này lại với nhau, phân hệ **Quy đổi đơn vị tính (UOM Conversion)** trên ERP đóng vai trò làm bộ dịch thuật số liệu thông qua các hệ số quy đổi (Conversion Factors). Nếu thiết lập sai hệ số quy đổi hoặc không hiểu cơ chế làm tròn của máy tính, hệ thống sẽ phát sinh các số dư tồn kho lẻ siêu nhỏ không thể xử lý nổi.

---

## 1. Hai cấp độ Quy đổi đơn vị tính trong ERP

Hệ thống ERP quản lý việc quy đổi đơn vị tính thông qua hai cấp độ chính:

1. **Quy đổi chuẩn hệ thống (Standard Conversion):** Áp dụng chung cho toàn bộ hệ thống, không phụ thuộc vào mã hàng (Ví dụ: `1 Tấn = 1.000 Kg`, `1 Thùng = 12 Cái`). Quy đổi này nằm cùng một **Nhóm đơn vị tính (UOM Class)** như cùng nhóm Khối lượng, hoặc cùng nhóm Chiều dài.
2. **Quy đổi đặc thù theo mã hàng (Item-Specific Conversion):** Áp dụng riêng cho từng mã hàng cụ thể (Ví dụ: Đối với mã thép phi 10, `1 Cây = 12 Mét`; nhưng đối với mã thép phi 16, `1 Cây` chỉ dài `11.7 Mét`). Đặc biệt, quy đổi đặc thù thường dùng để **Quy đổi chéo nhóm (Inter-Class Conversion)**, ví dụ mua hóa chất theo **Lít** (Thể tích) nhưng quản lý tồn kho theo **Kg** (Khối lượng) thông qua tỷ trọng riêng của từng chất.

### Bản đồ dữ liệu quản lý Quy đổi UOM:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Bảng định nghĩa UOM** | `Erp.UOM` | `MTL_UNITS_OF_MEASURE` | `T006` (Units of Measurement) |
| **Bảng quy đổi UOM** | `Erp.UOMConv` (Chứa `PartNum` và `ConvFactor`) | `MTL_UOM_CONVERSIONS` / `MTL_UOM_CLASS_CONVERSIONS` | `MARM` (Units of Measure for Material) |

---

## 2. Hai "Bẫy" thực chiến phá hủy tính chính xác của tồn kho UOM

### ❌ Bẫy 1: Lỗi làm tròn số lẻ vô hạn tuần hoàn gây "treo" tồn kho ảo (Ghost Inventory)

Đây là lỗi toán học cực kỳ ức chế đối với các thủ kho và lập trình viên khi viết báo cáo Nhập - Xuất - Tồn.

* **Tình huống:** Mã hàng hóa chất được mua theo **Thùng (BOX)** và tồn kho gốc theo **Lít (L)**. Tỷ lệ quy đổi hệ thống cấu hình là: `1 BOX = 3 L` (Tức là hệ số quy đổi ngược `1 L = 0.33333333 BOX`).
* **Hậu quả tích lũy số lẻ:**
  * Thủ kho nhập kho 1 Lít $\rightarrow$ Hệ thống ghi nhận tăng `0.33333333 BOX`.
  * Sau đó thủ kho làm lệnh xuất kho 1 Lít $\rightarrow$ Hệ thống ghi nhận giảm `0.33333333 BOX`.
  * Do giới hạn làm tròn số thập phân của máy tính (Floating-point precision), sau hàng ngàn giao dịch xuất nhập, ô kệ kho đó thực tế ngoài đời đã trống rỗng, nhưng trên ERP vẫn báo số dư tồn kho siêu nhỏ: **`0.00000001 BOX`** (Ghost Inventory).
  * **Hệ lụy:** Số lượng rác này khiến thủ kho không thể khóa sổ kho, hệ thống không cho phép xóa ô kệ hoặc thay đổi cấu hình mã hàng vì "vẫn còn tồn kho lẻ".

---

### ❌ Bẫy 2: Thiếu cấu hình quy đổi chéo nhóm đặc thù (Missing Inter-Class Conversion)

**Tình huống:** Bạn nhập kho cuộn tôn cuộn theo **Tấn** (Khối lượng) nhưng xuất ra sản xuất cắt tôn theo **Mét** (Chiều dài). Lập trình viên thiết lập hệ số quy đổi chuẩn hệ thống chung chung cho nhóm khối lượng, nhưng quên không bắt buộc người dùng khai báo bảng quy đổi đặc thù riêng cho từng mã tôn cuộn (vì mỗi độ dày của tôn sẽ có tỷ lệ Tấn ra Mét hoàn toàn khác nhau).

* **Hậu quả:** Hệ thống tự động áp tỷ lệ quy đổi mặc định, dẫn đến việc trên máy báo xuất đi 100 Mét tôn tương đương 1 Tấn, nhưng thực tế ngoài đời 100 Mét tôn đó chỉ nặng 0.8 Tấn. Sự lệch lạc này tích lũy dần làm lệch hàng chục tấn tôn tồn kho cuối tháng mà không ai giải trình nổi lý do hao hụt.

---

## 3. Các câu lệnh SQL Audit thực chiến rà soát lỗi quy đổi UOM

Hãy chạy các câu lệnh SQL dưới đây để quét và làm sạch số dư lẻ rác do lỗi làm tròn quy đổi trước mỗi kỳ khóa sổ:

---

### ❌ SQL Audit 1: Phát hiện số dư tồn kho siêu nhỏ bị "treo" do lỗi làm tròn quy đổi (Ghost Inventory)
Tìm toàn bộ các ô kệ đang chứa số lượng tồn kho lớn hơn 0 nhưng nhỏ hơn 0.01 (số lẻ rác sinh ra do máy tính làm tròn hệ số quy đổi tuần hoàn), để tiến hành chạy lệnh dọn kho về 0.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartBin`):
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ],
    pb.PartNum AS [Mã sản phẩm],
    p.IUM AS [UOM gốc],
    pb.OnhandQty AS [Số lượng lẻ treo]
FROM Erp.PartBin pb
INNER JOIN Erp.Part p 
    ON pb.Company = p.Company AND pb.PartNum = p.PartNum
WHERE pb.OnhandQty > 0 
  AND pb.OnhandQty < 0.01;                           -- Quét số lượng siêu nhỏ bị treo rác
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_ONHAND_QUANTITIES_DETAIL`):
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    moqd.locator_id AS locator,
    msi.segment1 AS item_code,
    msi.primary_uom_code AS primary_uom,
    SUM(moqd.transaction_quantity) AS ghost_qty
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
GROUP BY moqd.subinventory_code, moqd.locator_id, msi.segment1, msi.primary_uom_code
HAVING SUM(moqd.transaction_quantity) > 0 
   AND SUM(moqd.transaction_quantity) < 0.01;       -- Quét số lượng siêu nhỏ bị treo rác do làm tròn
```

---

### ❌ SQL Audit 2: Phát hiện các mã hàng phát sinh giao dịch chéo nhóm UOM nhưng thiếu bảng thiết lập quy đổi đặc thù
Tìm các mã hàng đã phát sinh giao dịch xuất/nhập thực tế có nhóm đơn vị tính (`UOM Class`) khác với nhóm đơn vị tính gốc của danh mục sản phẩm (ví dụ xuất theo Lít nhưng tồn theo Kg) nhưng hệ thống lại đang thiếu thiết lập quy đổi chéo nhóm đặc thù cho mã hàng đó.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT DISTINCT
    pt.PartNum AS [Mã sản phẩm],
    p.IUM AS [UOM gốc],
    uom1.UOMClassID AS [Nhóm UOM gốc],
    pt.UM AS [UOM thực tế giao dịch],
    uom2.UOMClassID AS [Nhóm UOM giao dịch]
FROM Erp.PartTran pt
INNER JOIN Erp.Part p 
    ON pt.Company = p.Company AND pt.PartNum = p.PartNum
INNER JOIN Erp.UOM uom1 
    ON p.Company = uom1.Company AND p.IUM = uom1.UOMCode
INNER JOIN Erp.UOM uom2 
    ON pt.Company = uom2.Company AND pt.UM = uom2.UOMCode
WHERE uom1.UOMClassID <> uom2.UOMClassID            -- Phát sinh giao dịch chéo nhóm UOM
  -- Điều kiện: Thiếu thiết lập quy đổi đặc thù cho Part này trong bảng UOMConv
  AND NOT EXISTS (
      SELECT 1 
      FROM Erp.UOMConv uc 
      WHERE uc.Company = p.Company 
        AND uc.PartNum = p.PartNum 
        AND uc.UOMCode = pt.UM
  );
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT DISTINCT
    mmt.inventory_item_id,
    msi.segment1 AS item_code,
    msi.primary_uom_code AS primary_uom,
    u1.uom_class AS primary_class,                  -- Nhóm UOM gốc
    mmt.transaction_uom AS tx_uom,
    u2.uom_class AS tx_class                        -- Nhóm UOM thực xuất/nhập
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
INNER JOIN mtl_units_of_measure u1 
    ON msi.primary_uom_code = u1.uom_code
INNER JOIN mtl_units_of_measure u2 
    ON mmt.transaction_uom = u2.uom_code
WHERE u1.uom_class <> u2.uom_class                  -- Giao dịch phát sinh chéo nhóm UOM
  -- Điều kiện: Thiếu cấu hình quy đổi chéo nhóm đặc thù (Class Conversion) cho Item này
  AND NOT EXISTS (
      SELECT 1 
      FROM mtl_uom_class_conversions mucc 
      WHERE mucc.inventory_item_id = mmt.inventory_item_id
        AND mucc.to_uom_code = mmt.transaction_uom
        AND mucc.organization_id = mmt.organization_id
  );
```

---

## 5. Checklist dành cho Developer khi phát triển phân hệ Quy đổi UOM

- [ ] **Lập trình tính năng dọn rác số lẻ (Ghost Inventory Sweeper):** Phát triển một tiến trình chạy ngầm định kỳ cuối tháng (Month-end Batch Job) để tự động tạo giao dịch điều chỉnh về 0 (`Adjust-to-Zero`) cho các ô kệ có số dư tồn kho nhỏ hơn 0.001 (Kịch bản 1).
- [ ] **Bắt buộc cấu hình quy đổi khi lưu mã hàng:** Thiết lập ràng buộc (Validation Rule) trên màn hình danh mục hàng hóa: Nếu người dùng chọn đơn vị mua (`PUM`) hoặc đơn vị bán (`SalesUM`) khác nhóm Class với đơn vị gốc (`IUM`), hệ thống bắt buộc họ phải nhập bảng quy đổi đặc thù trước khi cho phép bấm Lưu (Kịch bản 2).
- [ ] **Giới hạn số chữ số thập phân (Decimal Precision):** Cấu hình độ dài tối đa của số lẻ thập phân cho trường số lượng giao dịch và hệ số quy đổi (thông thường tối thiểu phải đạt 8 chữ số sau dấu phẩy để giảm thiểu tối đa sai số làm tròn).
- [ ] **Đồng bộ hóa đơn giá quy đổi:** Khi viết logic chuyển đổi số lượng, hãy đảm bảo hệ thống cũng tự động chuyển đổi tương thích đơn giá (`Unit Cost`) của UOM tương ứng để tránh lỗi lệch giá trị hạch toán kế toán.
