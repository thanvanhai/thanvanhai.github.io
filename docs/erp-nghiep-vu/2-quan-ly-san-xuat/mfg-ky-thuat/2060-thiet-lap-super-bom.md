---
id: 2060-thiet-lap-super-bom
title: Thiết lập BOM cấu hình cho mô hình Sản xuất theo đơn đặt hàng (Configurable BOM / ATO - CTO)
description: Thiết lập BOM cấu hình cho mô hình Sản xuất theo đơn đặt hàng (Configurable BOM / ATO - CTO)
sidebar_label: BOM cấu hình (ATO - CTO)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2060-thiet-lap-super-bom
sidebar_position: 2060
date: 2026-09-26
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, super-bom, configurable-bom, cto, sql]
---

# 2060 Thiết lập BOM cấu hình cho mô hình Sản xuất theo đơn đặt hàng (Configurable BOM / ATO - CTO)

> **Lưu ý nghiệp vụ:** Bài viết này giải quyết cấu trúc **BOM biến thể động (Dynamic Configurable BOM)** - nơi các linh kiện và định mức được hệ thống tự động lựa chọn dựa trên thuộc tính khách hàng cấu hình trên Sales Order (CTO/ATO) [2]. Đối với cấu trúc phân cấp tĩnh nhiều tầng (Sub-assemblies) và cơ chế tính toán nổ bom đệ quy tuần tự hệ thống, vui lòng tham khảo bài viết **[2010 - Cấu trúc sản phẩm đa tầng và cơ chế nổ bom nhiều cấp (Multi-level BOM & Explosion)](./2010-bom-nhieu-cap-cau-truc-san-pham.md)** [2].

Trong xu hướng sản xuất tùy biến hàng loạt (Mass Customization), các doanh nghiệp thường cung cấp sản phẩm có nhiều lựa chọn (ví dụ: máy tính Laptop có 3 loại CPU, 4 loại RAM, 2 loại dung lượng ổ cứng, 3 màu sắc khác nhau). Nếu thiết kế theo cách thủ công, doanh nghiệp sẽ phải duy trì tới $3 \times 4 \times 2 \times 3 = 72$ cấu hình BOM tĩnh khác nhau. Khi có sự thay đổi thiết kế của một linh kiện chung, kỹ sư sẽ phải sửa thủ công cả 72 BOM này.

Để giải quyết bài toán này, các hệ thống ERP lớn sử dụng giải pháp **BOM cấu hình (Configurable BOM)** hay **Super BOM**. Bài viết này phân tích sâu kiến trúc dữ liệu Super BOM, thuật toán phân rã động (Dynamic BOM Explosion) và cách cấu hình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu của Super BOM đòi hỏi một động cơ cấu hình (Configuration Engine) có khả năng đọc các thuộc tính (Characteristics/Attributes) từ Đơn bán hàng (Sales Order) để đối chiếu với điều kiện lựa chọn (Object Dependencies) cấu hình trên từng dòng vật tư.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Sử dụng cơ chế phân loại **Model & Option Class Items** phục vụ cho luồng Configure-to-Order (CTO) [2]. | Sử dụng phân hệ **Product Configurator** mạnh mẽ chạy các quy tắc (Rules) viết bằng ngôn ngữ C# để tùy biến MoM [2]. | Sử dụng phân hệ **Variant Configuration (LO-VC)** chuyên sâu kết hợp gán điều kiện lựa chọn (Object Dependencies) [2]. | Quản lý qua mô hình **Biến thể sản phẩm (Product Variants)**, gán trực tiếp điều kiện thuộc tính lên dòng BoM [2]. |
| **Bảng dữ liệu gốc (BOM Tables)** | `BOM_BILL_OF_MATERIALS` và `BOM_INVENTORY_COMPONENTS` (Phân loại bằng trường `bom_item_type`) [2]. | **`Erp.PcCon`** (Cấu hình bộ Configurator), **`Erp.PcValue`** (Giá trị đầu vào) và `PartMtl` [2]. | `STPO` (Dòng vật tư có liên kết với khóa điều kiện `KNNUM` trỏ sang bảng thuật toán `CUKB`) [2]. | `mrp.bom` và **`mrp.bom.line`** (Liên kết bảng Many-to-Many với giá trị thuộc tính) [2]. |
| **Mã điều kiện lựa chọn (Condition Key)** | Không dùng thuật toán dạng viết code, quản lý gián tiếp qua lựa chọn của Option Class. | Viết trực tiếp logic gán giá trị hoặc cấu hình bằng C# Script trong bảng **`Erp.PcRule`** [2]. | Sử dụng cú pháp **Object Dependencies** (`$SELF.CPU = 'INTEL_I7'`) lưu trong bảng `CUKB` [2]. | Liên kết bảng trung gian **`mrp_bom_line_product_template_attribute_value_rel`** [2]. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cơ chế Model & Option Class — Bảng: `BOM_BILL_OF_MATERIALS` / `BOM_INVENTORY_COMPONENTS`)
Oracle EBS chia cấu trúc Super BOM thành các tầng phân cấp danh mục chọn lọc:
1. **Bước 1 (Khai báo Item Type):** Tại Item Master, khai báo sản phẩm cha là mã **`Model Item`** (ví dụ: `LAPTOP_MODEL`). Tạo tiếp các mã **`Option Class Item`** (ví dụ: `OC_RAM` - cụm RAM, `OC_CPU` - cụm CPU).
2. **Bước 2 (Xây dựng Super BOM):** Trong màn hình `BOM > Bills > Bills`, tạo BOM cho `LAPTOP_MODEL` [2]. Gán các linh kiện con và Option Class con bên dưới:
   - Tại cột `BOM Item Type` (field DB: `bom_item_type`): Cấu hình mã cha là `1` (Model), cụm RAM là `2` (Option Class), linh kiện tiêu chuẩn là `4` (Standard) [2].
   - Tại cột `Optional` (field DB: `optional_on_model`): Tích chọn `Yes` cho các cụm và linh kiện tùy chọn để hệ thống biết đây là linh kiện biến thể (Boolean) [2].
3. **Bước 3 (Giao dịch):** Khi tạo Sales Order, nhân viên bán hàng bấm nút `Configurator` để chọn RAM, CPU mong muốn. Hệ thống tự động tạo một cấu hình ATO (Assemble-to-Order) riêng cho lệnh sản xuất.

### b. Hệ thống Epicor ERP (Cấu hình qua Product Configurator — Bảng: `Erp.PcCon` / `Erp.PcValue`)
Epicor cho phép viết code C# cực kỳ linh hoạt để thay đổi động cấu trúc MoM dựa trên input của khách hàng:
1. **Bước 1 (Tạo Configurator):** Truy cập `Product Configurator Maintenance`, tạo mã cấu hình (ví dụ: `CON_LAPTOP`) và gán cho mã sản phẩm cha `PART_LAPTOP` [2].
2. **Bước 2 (Thiết kế Form nhập liệu):** Thiết kế giao diện nhập liệu cho nhân viên bán hàng chọn (ví dụ: tạo Combo Box chọn loại CPU, chọn dung lượng RAM) [2].
3. **Bước 3 (Viết quy tắc - Method Rules):** Trong tab `Method Rules`, viết logic C# để tác động trực tiếp vào cấu trúc cây MoM khi khách hàng chọn. Ví dụ:
   - *Nếu khách chọn CPU = 'INTEL', hệ thống tự động bốc mã `PART_CPU_INTEL` và gán vào `PartMtl.QtyPer = 1`.*
   - *Nếu khách chọn màn hình 17 inch, hệ thống tự động tính toán lại định mức keo dán dải viền màn hình kéo dài thêm 20cm.*

### c. Hệ thống SAP S/4HANA (Cấu hình qua Variant Configuration - LO-VC — Bảng: `CABN` / `CAWN` / `CUKB`)
SAP quản lý Super BOM thông qua hệ thống phân loại thuộc tính và thuật toán điều kiện lựa chọn độc lập:
1. **Bước 1 (Khai báo thuộc tính):** Dùng T-Code `CT04` để tạo các đặc tính (Characteristics - ví dụ: `CPU`, `RAM`), T-Code `CL01` để tạo Class phân loại sản phẩm. Gán các đặc tính này cho Class.
2. **Bước 2 (Viết điều kiện lựa chọn - Object Dependency):** Dùng T-Code `CU01` để viết điều kiện lựa chọn (Selection Condition - ví dụ viết: `$SELF.CPU = 'INTEL_I7'`).
3. **Bước 3 (Gán vào Super BOM):** Trong T-Code `CS02` (Sửa BOM), gán chíp Intel i7 vào dòng vật tư. Bấm đúp vào dòng, chọn tab `Extras > Object Dependencies` và gán mã điều kiện ở Bước 2 vào dòng này (field DB: `STPO.KNNUM` kết hợp bảng `CUKB`) [2]. Khi dập lệnh sản xuất, hệ thống chỉ bốc chíp Intel i7 khi điều kiện thỏa mãn.

### d. Hệ thống Odoo ERP (Cấu hình qua Product Variants — Bảng: `mrp.bom` / `mrp.bom.line`)
Odoo tối giản hóa bằng cách sử dụng trực tiếp các giá trị thuộc tính biến thể trên cùng một form BoM:
1. **Bước 1 (Khai báo thuộc tính):** Trên form sản phẩm cha, tại tab `Attributes & Variants`, khai báo thuộc tính và các giá trị biến thể (ví dụ: Thuộc tính `RAM` có các giá trị `8GB`, `16GB`).
2. **Bước 2 (Thiết lập BoM):** Vào form BoM của sản phẩm cha, tại bảng lưới tab `Components` [2]:
   - Dòng 1: Nhập thanh RAM 8GB. Tại cột **`Apply on Variants`** (field DB: `bom_product_template_attribute_value_ids`), chọn thuộc tính tương ứng là `RAM: 8GB` [2].
   - Dòng 2: Nhập thanh RAM 16GB. Tại cột `Apply on Variants`, chọn thuộc tính tương ứng là `RAM: 16GB` [2].
3. **Bước 3 (Vận hành):** Khi tạo MO cho sản phẩm tủ lạnh có biến thể RAM 16GB, Odoo kiểm tra điều kiện dòng BoM và tự động ẩn dòng RAM 8GB, chỉ hiển thị dòng RAM 16GB trong danh sách vật tư cấp phát.

---

## 3. Thuật toán phân rã Động (Dynamic BOM Explosion Engine)

Khi nhân viên tạo một Đơn bán hàng (Sales Order) cho sản phẩm cấu hình, hệ thống sẽ thực hiện thuật toán **Phân rã Động (Dynamic Explosion)** để sinh ra một BOM sản xuất tùy biến (WIP BOM) duy nhất cho riêng đơn hàng đó.

```text
MÔ HÌNH PHÂN RÃ SUPER BOM:
                        [ LAPTOP SUPER BOM ]
                                 │
           ┌─────────────────────┼─────────────────────┐
     [ MÀN HÌNH 15" ]      [ MÀN HÌNH 17" ]      [ CHÍP INTEL I7 ]
           ▲                     ▲                     ▲
     (Điều kiện 15")       (Điều kiện 17")       (Điều kiện I7)
           │                     │                     │
           └────────────── đối chiếu ──────────────────┘
                                 │
                       (LỰA CHỌN TRÊN SO)
                  - Kích thước màn hình: 17 inch
                  - Loại vi xử lý: Intel i7
                                 │
                                 ▼ (APS Engine rã đông)
                  [ LỆNH SẢN XUẤT CHO SO 100 ]
                     - 1 x Màn hình 17"
                     - 1 x Chíp Intel i7
                     - (Màn hình 15" bị loại bỏ tự động)
```

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Super BOM

### Bài toán 1: Rút gọn 36 cấu hình tĩnh của Laptop thành 1 Super BOM duy nhất
*   **Thách thức:** Nhà máy sản xuất Laptop tùy biến cấu hình với: 3 tùy chọn CPU (Intel i5, Intel i7, AMD Ryzen), 3 tùy chọn RAM (8GB, 16GB, 32GB), 2 tùy chọn Bộ nhớ (SSD 512GB, SSD 1TB), và 2 tùy chọn Màu sắc (Xám, Bạc). Tổng số tổ hợp cấu hình tĩnh phát sinh là $3 \times 3 \times 2 \times 2 = 36$ BOM. Kỹ sư R&D không muốn tạo và quản trị 36 BOM tĩnh này vì rủi ro sai sót thông tin rất lớn.
*   **Giải pháp thực tế:**
    - Xây dựng 1 **Super BOM** duy nhất cho dòng sản phẩm Laptop mẫu.
    - Đưa tất cả các lựa chọn CPU, RAM, SSD, Vỏ máy vào chung bảng lưới nguyên vật liệu.
    - Cấu hình điều kiện lựa chọn tương ứng cho từng dòng. 
    - Khi khách hàng chọn Laptop cấu hình: *CPU Intel i5, RAM 16GB, SSD 512GB, Màu Xám*. Bộ lập lịch ERP sẽ tự động quét qua Super BOM, loại bỏ các dòng chíp i7, AMD, các dòng RAM 8GB, 32GB, vỏ màu Bạc, và xuất ra một phiếu xuất kho vật tư dập lệnh chính xác gồm đúng 4 linh kiện khách chọn, tối ưu hóa 100% gánh nặng quản trị dữ liệu.

### Bài toán 2: Thiết lập định mức động phụ thuộc lựa chọn khách hàng (Dynamic Quantity)
*   **Thách thức:** Trong sản xuất cáp điều khiển thiết bị y tế, khách hàng được tùy chọn chiều dài dây cáp (ví dụ: chọn dài 2 mét, 3 mét hoặc 5 mét). Để chống nhiễu đầu nối, kỹ sư phải quấn băng keo bạc xung quanh hai đầu cáp. Tuy nhiên, định mức vỏ nhựa bọc ngoài lại tăng tuyến tính theo chiều dài khách chọn, còn định mức băng keo bạc ở hai đầu đầu nối thì luôn cố định không đổi (0.1 mét keo cho 2 đầu) bất kể chiều dài cáp là bao nhiêu. Làm sao cấu hình BOM để hệ thống tự động tính toán chính xác định mức vỏ nhựa tăng theo chiều dài?
*   **Giải pháp thực tế trên SAP và Epicor:**
    - Trong **SAP S/4HANA**, ta sử dụng tính năng **`Procedure (Quy trình thuật toán)`** trong Object Dependencies. Tại dòng vật tư vỏ nhựa bọc ngoài, thay vì nhập số cứng tại cột số lượng, ta viết một đoạn code thuật toán:
      `$SELF.Quantity = $PARENT.Length_Input * 1.05` (trong đó `Length_Input` là chiều dài khách chọn trên SO, `1.05` là tỷ lệ hao hụt kỹ thuật).
    - Trong **Epicor ERP**, viết một **Method Rule`** loại `Quantity` bằng code C# để gán giá trị:
      `PartMtl.QtyPer = Context.Configurator.Inputs.Length.Value * 1.05;`
    - Khi dập Lệnh sản xuất, nếu khách chọn chiều dài 5 mét, hệ thống sẽ tự tính định mức vỏ nhựa là 5.25 mét, còn định mức băng keo bọc 2 đầu vẫn giữ nguyên là 0.1 mét, đảm bảo tính đúng giá thành nguyên vật liệu thực tế.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Super BOM

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn toàn bộ cấu trúc Model và các Option Class, linh kiện tùy chọn trên hệ thống Oracle EBS để kiểm tra danh mục cấu hình:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_p.segment1 AS "Model Parent Item",
    msib_p.description AS "Model Description",
    -- Giải mã loại dòng BOM (1 = Model, 2 = Option Class, 4 = Standard)
    DECODE(bic.bom_item_type, 
           1, 'Model Item', 
           2, 'Option Class', 
           4, 'Standard Component') AS "Component Type",
    msib_c.segment1 AS "Component Item Code",
    msib_c.description AS "Component Description",
    bic.component_quantity AS "Default Qty",
    -- Kiểm tra linh kiện có phải tùy chọn hay không
    DECODE(bic.optional_on_model, 1, 'Yes (Optional)', 2, 'No (Mandatory)') AS "Is Optional?"
FROM 
    apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    AND bbm.bom_item_type IN (1, 2) -- Chỉ lọc các BOM thuộc dòng Model hoặc Option Class
ORDER BY 
    msib_p.segment1, bic.item_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách cấu trúc bộ thiết lập màn hình cấu hình sản phẩm biến thể (`Erp.PcCon`) lưu trong phân hệ Product Configurator của Epicor:

```sql
SELECT 
    pc.Company,
    pc.ConfigID AS [Configurator Code],
    pc.Description AS [Configurator Name],
    pc.TargetPartNum AS [Target Configurable Part],
    pc.Approved AS [Is Configurator Approved?],
    pc.ModifiedBy AS [Modified By],
    pc.SysRevID AS [Version ID]
FROM 
    Erp.PcCon pc
WHERE 
    pc.Company = 'EP01'
ORDER BY 
    pc.ConfigID;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn các dòng vật tư thuộc Super BOM có gán thuật toán điều kiện lựa chọn (Object Dependency) để đối chiếu mã thuật toán lưu trong bảng `CUKB` của SAP:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Configurable Material Code",
    i.POSNR AS "BOM Item Number",
    i.IDNRK AS "Component Material",
    i.MENGE AS "Default Quantity",
    -- Cột KNNUM là khóa liên kết sang bảng Object Dependency của SAP
    i.KNNUM AS "Dependency Key ID",
    dep.TITLE AS "Dependency Rule Description"
FROM 
    saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
-- Liên kết sang bảng CUKB của SAP để giải mã tên và mô tả quy tắc điều kiện lựa chọn
LEFT JOIN saphanadb.CUKB dep ON i.KNNUM = dep.KNNUM
WHERE 
    m.WERKS = '1000'
    AND i.LKENZ = ' ' -- Loại bỏ các dòng đã xóa logic
    AND i.KNNUM <> '0000000000' -- Chỉ lấy những dòng BOM có gán điều kiện lựa chọn
ORDER BY 
    m.MATNR, i.POSNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn cấu trúc BoM biến thể của Odoo để kiểm tra xem linh kiện con nào đang được ràng buộc chỉ áp dụng cho giá trị thuộc tính cụ thể nào:

```sql
SELECT 
    pt_p.name AS "Configurable Product Template",
    pt_c.name AS "Component Product Name",
    bl.product_qty AS "Standard Quantity",
    -- Gom nhóm các giá trị thuộc tính biến thể liên kết thành một chuỗi phân tách bằng dấu gạch đứng |
    STRING_AGG(pav.name, ' | ') AS "Apply on Variant Attribute Values"
FROM 
    mrp_bom_line bl
INNER JOIN mrp_bom bom ON bl.bom_id = bom.id
INNER JOIN product_template pt_p ON bom.product_tmpl_id = pt_p.id
INNER JOIN product_product pp_c ON bl.product_id = pp_c.id
INNER JOIN product_template pt_c ON pp_c.product_tmpl_id = pt_c.id
-- Liên kết bảng Many-to-Many để giải mã giá trị thuộc tính gắn với dòng BoM
LEFT JOIN mrp_bom_line_product_template_attribute_value_rel rel ON bl.id = rel.mrp_bom_line_id
LEFT JOIN product_template_attribute_value ptav ON rel.product_template_attribute_value_id = ptav.id
LEFT JOIN product_attribute_value pav ON ptav.product_attribute_value_id = pav.id
WHERE 
    bom.active = true
GROUP BY 
    pt_p.name, pt_c.name, bl.product_qty
ORDER BY 
    pt_p.name, pt_c.name;