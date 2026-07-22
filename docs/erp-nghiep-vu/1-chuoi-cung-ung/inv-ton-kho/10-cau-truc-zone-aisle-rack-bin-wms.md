---
id: cau-truc-zone-aisle-rack-bin-wms
title: Cấu trúc Zone - Aisle - Rack - Bin (WMS) — Thiết kế không gian, Chiến lược Putaway và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Cấu trúc Ô kệ WMS
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/cau-truc-o-ke-wms
sidebar_position: 11
date: 2026-08-01
tags: [erp, inventory, wms, zone, rack, bin, locator, putaway, sql-audit, oracle-ebs, epicor]
---

# Cấu trúc Zone - Aisle - Rack - Bin (WMS) — Thiết kế không gian, Chiến lược Putaway và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Để vận hành một kho hàng có quy mô lớn với hàng chục ngàn mã hàng, hệ thống ERP không thể quản lý tồn kho chung chung ở mức "Nhà kho". Hệ thống bắt buộc phải số hóa toàn bộ không gian vật lý của kho thành một hệ tọa độ 4D chuẩn WMS: **Zone (Khu vực) - Aisle (Dãy) - Rack (Kệ) - Bin/Locator (Ô/Vị trí chi tiết)**.

Việc thiết lập tọa độ ô kệ chuẩn xác là nền tảng cốt lõi giúp hệ thống tự động tính toán đường đi lấy hàng ngắn nhất (Picking Path) và chỉ định vị trí cất hàng tối ưu (Directed Putaway) cho xe nâng.

---

## 1. Giải mã hệ tọa độ 4D trong hệ thống WMS

Một vị trí chứa hàng chuẩn trong kho thường được biểu diễn dưới dạng chuỗi tọa độ (ví dụ: `ZONE01-A02-R03-B04`). Chuỗi này bao gồm:

1. **Zone (Khu vực):** Phân vùng kho theo đặc tính vật lý hoặc nghiệp vụ (ví dụ: *Zone lạnh*, *Zone khô*, *Zone hàng giá trị cao*, *Zone hàng mau luân chuyển - Fast moving*).
2. **Aisle (Dãy):** Lối đi giữa hai hàng kệ song song.
3. **Rack (Kệ/Khung):** Các cột kệ đứng dọc theo dãy lối đi.
4. **Bin/Locator (Tầng/Ô chi tiết):** Vị trí tọa độ cuối cùng chứa pallet hoặc thùng hàng (gồm số tầng và số ô tính từ mặt đất lên).

### Bản đồ cấu trúc bảng dữ liệu quản lý Ô kệ:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Bảng định nghĩa Ô kệ** | `Erp.WhseBin` | `MTL_ITEM_LOCATIONS` (Sử dụng Key Flexfield) | `LAGP` (Storage Bins) |
| **Các trường giới hạn vật lý** | `MaxWeight` (Tải trọng tối đa), `MaxVolume` (Thể tích tối đa) | `max_weight`, `max_cubic_area` | `LGTYP` (Storage Type), `PLATZ` (Storage Bin capacity) |

---

## 2. Hai chiến lược tự động hóa của WMS dựa trên cấu trúc Ô kệ

### A. Chiến lược cất hàng tự động (Directed Putaway)
Khi hàng về đến cửa kho, hệ thống WMS sẽ quét kích thước, trọng lượng của pallet và tự động chỉ định xe nâng phải cất hàng vào ô kệ nào dựa trên các quy tắc:
* **Tải trọng tương thích:** Tránh xếp các pallet nặng lên tầng cao của kệ (gây nguy hiểm vật lý).
* **Vận tốc luân chuyển (Velocity):** Hàng mau luân chuyển sẽ được ưu tiên xếp ở các ô kệ gần cửa xuất hàng và ở tầng thấp (dễ lấy). Hàng chậm luân chuyển được đưa ra phía sau hoặc đưa lên tầng cao.

### B. Chiến lược tối ưu đường đi lấy hàng (Picking Path Heuristics)
Khi nhân viên kho nhận danh sách 10 mặt hàng cần lấy để giao cho khách, hệ thống WMS sẽ tự động sắp xếp thứ tự các ô kệ cần đến theo sơ đồ hình chữ S (S-shape) hoặc hình rắn (Snake-path) để nhân viên **chỉ đi đúng 1 vòng duy nhất** là lấy đủ hàng, tuyệt đối không có hiện tượng đi đi lại lại giữa các lối đi.

---

## 3. Hai "Bẫy" thực chiến tại các kho hàng lớn

### ❌ Bẫy 1: Thảm họa "Sập kệ" do quá tải trọng vật lý thực tế so với cấu hình hệ thống

**Tình huống:** Kệ cao tầng (Tầng 4 - Rack 03) được thiết kế bằng khung thép mỏng, tải trọng tối đa chỉ chịu được **500 kg**. Thủ kho do thiếu kinh nghiệm đã cho xe nâng đặt 1 Pallet sắt nặng **1.200 kg** lên vị trí này. Hệ thống ERP không chặn giao dịch vì lập trình viên **bỏ trống hoặc không cấu hình** trường giới hạn tải trọng (`MaxWeight`) trên ô kệ đó.

* **Hậu quả cực kỳ nghiêm trọng:** Kệ bị quá tải, đổ sập vật lý kéo theo hàng loạt kệ bên cạnh đổ theo (hiệu ứng domino), gây thiệt hại hàng trăm ngàn USD và đe dọa trực tiếp đến tính mạng của công nhân kho.
* **Giải pháp kiểm soát:** Bắt buộc phải khai báo đầy đủ `MaxWeight` và `MaxVolume` cho từng ô kệ trong danh mục `WhseBin / Locator`. Hệ thống ERP phải tự động tính tổng trọng lượng hàng đang có trong ô kệ cộng với trọng lượng hàng chuẩn bị cất vào, nếu vượt quá hạn mức, chặn giao dịch ngay lập tức.

---

### ❌ Bẫy 2: Trộn lẫn nhiều mã hàng trong ô kệ quản lý đơn nhất (Mixed Parts)

**Tình huống:** Ô kệ `BIN-A1` được thiết kế nhỏ, chỉ dùng để chứa ốc vít mã `BUL-001`. Tuy nhiên, thủ kho do thiếu diện tích đã xếp chung thêm ốc vít mã `BUL-002` (ngoại quan cực kỳ giống mã cũ nhưng bước ren khác nhau) vào chung một ô kệ này.

* **Hậu quả:** Khi nhân viên lấy hàng (Picker) ra kệ quét mã lấy hàng đi giao, do vội vàng và mắt thường khó phân biệt, họ đã lấy nhầm mã `BUL-002` giao cho khách. Khách hàng nhận hàng không lắp ráp được và khiếu nại nhà máy.
* **Giải pháp kiểm soát:** Trên ERP cần có tùy chọn **Khóa chứa đa sản phẩm (Single Part Specific Bin)**. Khi ô kệ này đã có hàng của mã `BUL-001` nằm bên trong, hệ thống sẽ chặn đứng mọi giao dịch chuyển vị trí mã hàng khác vào ô kệ này.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát cấu trúc Ô kệ WMS

Định kỳ, bộ phận quản lý hệ thống cần chạy các câu lệnh SQL dưới đây để rà soát chất lượng sắp xếp kho và cảnh báo sớm các rủi ro vận hành:

---

### ❌ SQL Audit 1: Phát hiện các ô kệ đang bị quá tải trọng vật lý thực tế (Overweight Locators)
Tìm các ô kệ đang có tổng trọng lượng của hàng hóa nằm bên trong vượt quá tải trọng thiết kế tối đa của khung kệ.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    wb.WarehouseCode AS [Mã kho],
    wb.BinNum AS [Vị trí ô kệ],
    wb.MaxWeight AS [Tải trọng tối đa (kg)],
    SUM(pb.OnhandQty * p.NetWeight) AS [Tải trọng thực tế (kg)],
    (SUM(pb.OnhandQty * p.NetWeight) - wb.MaxWeight) AS OverweightQty
FROM Erp.WhseBin wb
INNER JOIN Erp.PartBin pb 
    ON wb.Company = pb.Company AND wb.WarehouseCode = pb.WarehouseCode AND wb.BinNum = pb.BinNum
INNER JOIN Erp.Part p 
    ON pb.Company = p.Company AND pb.PartNum = p.PartNum
WHERE wb.MaxWeight > 0                             -- Chỉ kiểm tra các ô kệ có cấu hình tải trọng
GROUP BY wb.WarehouseCode, wb.BinNum, wb.MaxWeight
HAVING SUM(pb.OnhandQty * p.NetWeight) > wb.MaxWeight;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    mil.subinventory_code AS subinventory,
    mil.segment1 || '.' || mil.segment2 AS locator_name,
    mil.max_weight AS max_weight_limit,            -- Tải trọng thiết kế tối đa
    SUM(moqd.transaction_quantity * msi.unit_weight) AS current_total_weight
FROM mtl_item_locations mil
INNER JOIN mtl_onhand_quantities_detail moqd 
    ON mil.inventory_location_id = moqd.locator_id AND mil.organization_id = moqd.organization_id
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
WHERE mil.max_weight > 0                            -- Chỉ kiểm tra locator có giới hạn cân nặng
GROUP BY mil.subinventory_code, mil.segment1, mil.segment2, mil.max_weight
HAVING SUM(moqd.transaction_quantity * msi.unit_weight) > mil.max_weight;
```

---

### ❌ SQL Audit 2: Phát hiện các ô kệ đang bị trộn lẫn nhiều mã hàng khác nhau (Mixed Parts Bins)
Tìm các ô kệ đang chứa từ 2 mã hàng khác nhau trở lên bên trong để cảnh báo bộ phận kho sắp xếp lại hàng hóa, tránh lỗi lấy nhầm hàng khi giao hàng.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ],
    COUNT(DISTINCT pb.PartNum) AS DistinctPartCount, -- Số lượng mã hàng khác nhau
    -- Gộp danh sách các mã hàng bị trộn lẫn hiển thị trên 1 dòng (SQL Server 2017+)
    STRING_AGG(pb.PartNum, ', ') AS MixedParts
FROM Erp.PartBin pb
GROUP BY pb.WarehouseCode, pb.BinNum
HAVING COUNT(DISTINCT pb.PartNum) > 1;             -- Lọc các ô kệ có từ 2 mã hàng trở lên
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    mil.segment1 || '.' || mil.segment2 AS locator_name,
    COUNT(DISTINCT moqd.inventory_item_id) AS distinct_item_count
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_item_locations mil 
    ON moqd.locator_id = mil.inventory_location_id AND moqd.organization_id = mil.organization_id
GROUP BY moqd.subinventory_code, mil.segment1, mil.segment2
HAVING COUNT(DISTINCT moqd.inventory_item_id) > 1;  -- Lọc các vị trí có từ 2 mã hàng trở lên
```

---

## 5. Checklist dành cho Developer khi phát triển cấu trúc Ô kệ WMS

- [ ] **Bắt buộc cấu hình thuộc tính vật lý:** Đảm bảo màn hình tạo mới Ô kệ bắt buộc phải nhập các trường kích thước Dài, Rộng, Cao, Thể tích tối đa và Tải trọng tối đa để hệ thống có cơ sở tính toán Putaway tự động.
- [ ] **Tích hợp kiểm tra tải trọng thời gian thực:** Khi viết logic cho giao dịch chuyển kho hoặc cất hàng tự động, bắt buộc viết câu lệnh kiểm tra (Validation) tổng tải trọng và thể tích của ô kệ đích, chặn giao dịch nếu vượt quá giới hạn thiết kế (Kịch bản 1).
- [ ] **Phát triển tính năng khóa trộn hàng (Single-Item Lock):** Thiết lập cấu hình cờ `Single-Item` trên danh mục Ô kệ, chặn đứng mọi hành vi chuyển vị trí của mã hàng mới vào ô kệ nếu ô kệ đó đang có số dư On-hand của một mã hàng khác (Kịch bản 2).
- [ ] **Tối ưu hóa đường đi lấy hàng:** Khi viết câu lệnh SQL xuất dữ liệu cho phiếu lấy hàng (Picking List / Packing List), luôn sắp xếp (`ORDER BY`) danh sách ô kệ cần lấy theo đúng thứ tự logic của dãy lối đi (`Aisle` $\rightarrow$ `Rack` $\rightarrow$ `Bin`) để tối ưu hóa đường di chuyển của nhân viên kho.
