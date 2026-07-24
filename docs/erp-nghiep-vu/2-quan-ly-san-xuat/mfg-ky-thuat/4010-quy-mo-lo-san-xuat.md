---
id: 4010-quy-mo-lo-san-xuat
title: Quy định Quy mô lô sản xuất (Min/Max Batch Size & Lot Size)
description: Thiết lập các thông số giới hạn quy mô lô sản xuất tối thiểu (Min), tối đa (Max) và bội số làm tròn (Multiple) để điều tiết thuật toán chia tách và dồn lô của MRP.
sidebar_label: Quy mô lô sản xuất
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/4010-quy-mo-lo-san-xuat
sidebar_position: 4010
date: 2026-10-25
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, lot-size, batch-size, mrp, sql]
---

# 4010 - Quy mô lô sản xuất

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập các tham số giới hạn lô sản xuất kế hoạch (Min/Max Lot Size, Lot Multiple)** trên dữ liệu gốc phục vụ cho thuật toán chia tách và dồn lô của MRP [2]. Đối với quy trình dập lệnh và chia nhỏ lô thực tế dính liền với thiết lập nhãn lô (Lot/Serial Tracking) tại sàn, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP) và Tồn kho (INV).

---

Trong sản xuất công nghiệp, việc lên lệnh sản xuất với một sản lượng bất kỳ là điều không khả thi. Mỗi trạm máy đều bị giới hạn bởi các ràng buộc vật lý và kinh tế: **Quy mô lô tối thiểu (Min Lot Size)** đại diện cho lượng sản lượng tối thiểu cần có để bù đắp chi phí gá đặt máy (Setup), và **Quy mô lô tối đa (Max Lot Size)** đại diện cho giới hạn dung tích vật lý của thiết bị trong một mẻ chạy máy (ví dụ: bồn trộn hóa chất sơn chỉ chứa tối đa 1.000 lít).

Nếu không cấu hình chính xác các tham số giới hạn này trên Master Data, hệ thống MRP sẽ đưa ra các đề xuất sản xuất (Planned Orders) không khả thi, bắt buộc nhân viên kế hoạch phải điều chỉnh thủ công ngoài hệ thống. Bài viết này phân tích sâu kiến trúc dữ liệu lô sản xuất, thuật toán chia mẻ của MRP và luồng cấu hình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu quản lý Quy mô lô sản xuất của các hãng ERP được cấu hình tập trung tại Danh mục sản phẩm (Item Master / Part Plant) hoặc phân bổ chi tiết trên từng Phiên bản sản xuất (Production Version):

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Định nghĩa tham số dồn lô/chia lô tại cấp Chi nhánh (Organization Item) của phân hệ Inventory. | Định nghĩa tham số lô đặc thù theo từng Nhà máy sản xuất (**Part Plant**) thuộc phân hệ Part. | Cho phép cấu hình song song ở cấp Vật tư (Material Master) và cấp Phiên bản sản xuất (Production Version) [2]. | Quản lý quy mô dồn hàng thông qua các tham số làm tròn của Quy tắc tái cung ứng (Reordering Rules). |
| **Bảng dữ liệu gốc (Table)** | **`MTL_SYSTEM_ITEMS_B`** (Bảng quản lý thuộc tính chi tiết hàng hóa). | **`Erp.PartPlant`** (Bảng quản lý thông số vật tư phân bổ theo xưởng/nhà máy). | **`saphanadb.MARC`** (Material Master Plant) và **`saphanadb.MKAL`** (Production Version) [2]. | **`stock.warehouse.orderpoint`** (Bảng quản lý quy tắc dồn hàng tái cung ứng). |
| **Lô tối thiểu (Min Lot Size)** | `minimum_order_quantity` (Số lượng đặt lệnh sản xuất/mua hàng tối thiểu). | `MinLotSize` (Giới hạn dưới của lô sản xuất tại Site). | `BSTMI` (Lượng đặt hàng/sản xuất tối thiểu của mẻ) [2]. | `product_min_qty` (Số lượng tồn kho tối thiểu kích hoạt nhu cầu). |
| **Lô tối đa (Max Lot Size)** | `maximum_order_quantity` (Số lượng đặt lệnh sản xuất/mua hàng tối đa). | `MaxLotSize` (Giới hạn trên của mẻ chạy máy tại Site). | `BSTMA` (Dung tích/giới hạn tối đa của một mẻ chạy máy) [2]. | Khai báo gián tiếp thông qua dung tích tối đa của Lệnh sản xuất. |
| **Bội số làm tròn (Lot Multiple)** | `fixed_lot_multiplier` (Hệ số làm tròn lô sản xuất). | `LotMultiple` (Bội số dồn hàng sản xuất của xưởng). | `BSTRF` (Rounding Value - Giá trị làm tròn bội số lô sản xuất). | `qty_multiple` (Bội số số lượng làm tròn mẻ của Odoo). |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình qua Planning Parameters — Bảng: `MTL_SYSTEM_ITEMS_B`)
Oracle EBS quản lý tham số chia lô tập trung tại danh mục hàng hóa chi nhánh:
1. **Bước 1 (Chọn màn hình):** Vào `Inventory > Items > Organization Items`, chọn chi nhánh nhà máy (`Organization`).
2. **Bước 2 (Vào Tab Lead Times/Planning):** Tại tab `Lead Times` hoặc `Planning`, người dùng tìm khu vực *Order Modifiers*.
3. **Bước 3 (Nhập tham số):** 
   - `Minimum Order Qty` (field DB: `minimum_order_quantity`): Nhập sản lượng lô tối thiểu (ví dụ: `100`).
   - `Maximum Order Qty` (field DB: `maximum_order_quantity`): Nhập sản lượng lô tối đa (ví dụ: `1,000`).
   - `Fixed Lot Multiplier` (field DB: `fixed_lot_multiplier`): Nhập bội số làm tròn (ví dụ: nhập `50` - hệ thống chỉ dập lệnh sản xuất theo bội số của 50).

### b. Hệ thống Epicor ERP (Cấu hình trên Part Plant Details — Bảng: `Erp.PartPlant`)
Epicor cho phép cấu hình quy mô lô sản xuất đặc thù cho từng nhà máy (Site) khác nhau của cùng một mã hàng:
1. **Bước 1 (Mở Part Maintenance):** Truy cập `Part Maintenance`, chọn mã sản phẩm.
2. **Bước 2 (Vào Tab Sites Detail):** Chuyển sang tab `Sites > Detail`. Tại khu vực *Planning*, hệ thống hiển thị các tham số bổ sung.
3. **Bước 3 (Nhập thông số):**
   - `Min Lot Size` (field DB: `MinLotSize`): Nhập lượng tối thiểu cho 1 Job (ví dụ: `100`).
   - `Max Lot Size` (field DB: `MaxLotSize`): Nhập lượng tối đa cho 1 Job (ví dụ: `1,000`).
   - `Lot Multiple` (field DB: `LotMultiple`): Nhập bội số dồn lô (ví dụ: `100` - Job sẽ làm tròn lên các mẻ 100, 200, 300...).

### c. Hệ thống SAP S/4HANA (Cấu hình trên Production Version & Material Master — Bảng: `MKAL` / `MARC`)
SAP cho phép cấu hình linh hoạt dải sản lượng hiệu lực ngay trên từng công thức sản xuất:
1. **Bước 1 (Thiết lập trên Material Master):** Dùng T-Code `MM02` (MRP 1 view), nhập `Min Lot Size` và `Max Lot Size` toàn cục cho mã hàng.
2. **Bước 2 (Thiết lập chi tiết trên Production Version):** Trong T-Code `C223` (Sửa Production Version), người dùng nhập thông số tại 2 cột [2]:
   - `From Lot Size` (field DB: `BSTMI`): Giới hạn dưới của lô sản xuất được phép áp dụng công thức này (ví dụ: `100`) [2].
   - `To Lot Size` (field DB: `BSTMA`): Giới hạn trên của lô sản xuất được phép áp dụng công thức này (ví dụ: `1,000`) [2].
3. **Ý nghĩa vận hành:** Nếu lệnh sản xuất có quy mô là 50 sản phẩm, hệ thống tự động loại bỏ phiên bản này (do < 100) và tìm phiên bản sản xuất chạy tay khác phù hợp hơn.

### d. Hệ thống Odoo ERP (Cấu hình Reordering Rules — Bảng: `stock.warehouse.orderpoint`)
Odoo quy định việc dồn mẻ thông qua việc thiết lập các quy tắc tái cung ứng kho:
1. **Bước 1 (Vào Reordering Rules):** Truy cập `Manufacturing > Products > Reordering Rules`, chọn sản phẩm cần cấu hình.
2. **Bước 2 (Nhập tham số làm tròn mẻ):**
   - `Min Quantity` (field DB: `product_min_qty`): Mức tồn kho tối thiểu kích hoạt nhu cầu sản xuất dập lệnh tự động.
   - `Multiple Quantity` (field DB: `qty_multiple`): Bội số số lượng làm tròn khi hệ thống tự động sinh Lệnh sản xuất (ví dụ: nhập `50` - Odoo sẽ luôn tạo MO với sản lượng làm tròn lên các mẻ chia hết cho 50).

---

## 3. Thuật toán Chia lô của bộ tính toán nhu cầu (MRP Lot Sizing & Splitting)

Khi chạy tiến trình MRP, hệ thống sẽ sử dụng thuật toán **Chia tách mẻ (Lot Splitting)** để biến đổi nhu cầu thực tế (Net Requirements) thành các Lệnh sản xuất kế hoạch (Planned Orders) khả thi dựa trên các giới hạn Min/Max/Multiple cấu hình.

### Ví dụ mô phỏng chạy toán học:
Nhà máy phát sinh tổng nhu cầu thực tế cần sản xuất là **2.500 sản phẩm**.
Các tham số Master Data được cấu hình:
- **Min Lot Size = 100**
- **Max Lot Size = 1.000**
- **Lot Multiple = 100**

**Cách động cơ MRP chạy thuật toán phân rã chia mẻ:**
1. **Mẻ số 1:** MRP bốc tối đa công suất vật lý của thiết bị $\rightarrow$ Tạo Planned Order 1 với sản lượng = **1.000 sản phẩm** (đạt Max Lot Size). Nhu cầu còn lại: $2.500 - 1.000 = 1.500$.
2. **Mẻ số 2:** Tiếp tục bốc tối đa công suất $\rightarrow$ Tạo Planned Order 2 với sản lượng = **1.000 sản phẩm** (đạt Max Lot Size). Nhu cầu còn lại: $1.500 - 1.000 = 500$.
3. **Mẻ số 3:** Nhu cầu còn lại là 500 sản phẩm:
   - Hệ thống kiểm tra: $500 \ge \text{Min Lot Size } (100)$ $\rightarrow$ Thỏa mãn điều kiện tối thiểu.
   - Hệ thống kiểm tra: $500$ chia hết cho $\text{Lot Multiple } (100)$ $\rightarrow$ Thỏa mãn điều kiện làm tròn.
   - Tạo Planned Order 3 với sản lượng = **500 sản phẩm**.

> **Ý nghĩa thực tế:** Tổng nhu cầu 2.500 sản phẩm của khách hàng sẽ được hệ thống ERP tự động chia tách thành **3 Lệnh sản xuất kế hoạch độc lập** (1.000 + 1.000 + 500) để công nhân nhà xưởng thực hiện dập mẻ lần lượt phù hợp với dung tích thực tế của thiết bị, loại bỏ hoàn toàn việc chồng chéo và quá tải vật lý tại trạm máy.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Quy mô lô

### Bài toán 1: Hạn chế chi phí setup lò nung xi mạ bằng cơ chế Lô tối thiểu (Min Lot Size)
*   **Thách thức:** Mỗi lần khởi động lò nhiệt luyện thép tiêu tốn điện năng cực lớn (chi phí gá đặt và chạy không tải ban đầu khoảng 10.000.000 VNĐ). Nếu khách hàng chỉ đặt mua nhỏ lẻ 2 sản phẩm, hệ thống tự tạo lệnh sản xuất chạy lò cho 2 sản phẩm này sẽ gây lãng phí chi phí vận hành cực kỳ nghiêm trọng.
*   **Giải pháp thực tế:**
    - Cấu hình thuộc tính của chi tiết tôi luyện tại Item Master có **`Min Lot Size = 50`** sản phẩm.
    - Khi MRP quét qua nhu cầu nhỏ lẻ (ví dụ: nhu cầu 2 sản phẩm vào ngày Thứ Hai, 3 sản phẩm vào ngày Thứ Tư), hệ thống sẽ tự động dồn nhu cầu (MRP Lot-Sizing) hoặc nâng quy mô của Lệnh sản xuất kế hoạch lên đúng mức tối thiểu là **50 sản phẩm** để bù đắp chi phí chạy lò, lượng dư thừa 45 sản phẩm sẽ được lưu kho để bán gối đầu sau.

### Bài toán 2: Xử lý bẻ mẻ trộn hóa chất khi vượt quá dung tích bồn trộn (Max Lot Size)
*   **Thách thức:** Nhà máy hóa chất sơn có bồn trộn với dung tích chứa tối đa là **1.000 lít**. Nếu lệnh sản xuất yêu cầu pha chế 1.200 lít sơn, công nhân không thể đổ tràn bồn trộn được. Làm sao hệ thống tự động bẻ đôi mẻ trộn thành 2 mẻ độc lập?
*   **Giải pháp thực tế:**
    - Cấu hình tại Material Master (hoặc Production Version) của mẻ sơn có **`Max Lot Size = 1.000`** lít.
    - Khi người dùng tạo Lệnh sản xuất 1.200 lít, hệ thống ERP sẽ tự động chạy thuật toán chia tách và sinh ra **2 Lệnh sản xuất con độc lập**: Lệnh 1 dập mẻ 1.000 lít, Lệnh 2 dập mẻ 200 lít. 
    - Kế toán giá thành khi đóng kỳ sẽ ghi nhận chi phí setup và chi phí hoạt động của 2 mẻ trộn riêng biệt, phản ánh chính xác chi phí tiêu hao năng lượng thực tế tại xưởng.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Quy mô lô sản xuất

### a. Trên hệ thống Oracle EBS (PL/SQL)
Kiểm tra danh sách các mặt hàng có cấu hình các tham số giới hạn chia mẻ (Min/Max Lot Size, Fixed Multiple) tại Item Master để rà soát dữ liệu MRP:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Item Code",
    msib.description AS "Description",
    -- Đọc các trường cấu hình lô sản xuất của Oracle
    msib.minimum_order_quantity AS "Min Lot Size",
    msib.maximum_order_quantity AS "Max Lot Size",
    msib.fixed_lot_multiplier AS "Lot Multiple"
FROM 
    apps.mtl_system_items_b msib
INNER JOIN apps.org_organization_definitions ood ON msib.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    -- Chỉ lọc các mã hàng có phát sinh cấu hình giới hạn mẻ
    AND (msib.minimum_order_quantity IS NOT NULL 
         OR msib.maximum_order_quantity IS NOT NULL 
         OR msib.fixed_lot_multiplier IS NOT NULL)
ORDER BY 
    msib.segment1;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh mục các tham số giới hạn lô sản xuất đặc thù theo từng xưởng sản xuất (Plant/Site) lưu trong cơ sở dữ liệu Epicor:

```sql
SELECT 
    pp.Company,
    pp.PartNum AS [Part Number],
    pp.Plant AS [Site / Plant],
    -- Đọc các trường cấu hình lô của Epicor
    pp.MinLotSize AS [Min Lot Size],
    pp.MaxLotSize AS [Max Lot Size],
    pp.LotMultiple AS [Lot Multiple]
FROM 
    Erp.PartPlant pp
WHERE 
    pp.Company = 'EP01'
    -- Lọc các cấu hình có phát sinh thông số mẻ chạy máy lớn hơn 0
    AND (pp.MinLotSize > 0 OR pp.MaxLotSize > 0 OR pp.LotMultiple > 0)
ORDER BY 
    pp.PartNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn so sánh các thông số quy mô lô sản xuất được cấu hình trên cả hai cấp độ: cấp Phiên bản sản xuất (`MKAL`) [2] và cấp Material Master (`MARC`) trong SAP S/4HANA:

```sql
SELECT 
    mkal.WERKS AS "Plant",
    mkal.MATNR AS "Material Code",
    mkal.VERID AS "Production Version ID",
    -- Đọc cấu hình trên Production Version
    mkal.BSTMI AS "Min Lot Size (Version)", 
    mkal.BSTMA AS "Max Lot Size (Version)",
    -- Đối chiếu với cấu hình MRP 1 trên Material Master (Plant Level)
    marc.BSTMI AS "Min Lot Size (Material)", 
    marc.BSTMA AS "Max Lot Size (Material)",
    marc.BSTRF AS "Rounding Value (Multiple)"
FROM 
    saphanadb.MKAL mkal
INNER JOIN 
    saphanadb.MARC marc ON mkal.MATNR = marc.MATNR AND mkal.WERKS = marc.WERKS
WHERE 
    mkal.MANDT = '100'
    AND mkal.WERKS = '1000' -- Lọc theo Plant thực tế
ORDER BY 
    mkal.MATNR, mkal.VERID;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách thông số tối thiểu (`Minimum Quantity`) và bội số làm tròn mẻ (`Rounding Multiple`) từ bảng quy tắc tái cung ứng kho của Odoo:

```sql
SELECT 
    pt.name AS "Product Name Template",
    op.product_min_qty AS "Reordering Min Qty",
    op.product_max_qty AS "Reordering Max Qty",
    op.qty_multiple AS "Rounding Multiple (Mẻ)",
    w.name AS "Assigned Warehouse"
FROM 
    stock_warehouse_orderpoint op
INNER JOIN product_product pp ON op.product_id = pp.id
INNER JOIN product_template pt ON pp.product_tmpl_id = pt.id
LEFT JOIN stock_warehouse w ON op.warehouse_id = w.id
WHERE 
    op.active = true -- Chỉ lấy các quy tắc đang hoạt động
ORDER BY 
    pt.name;