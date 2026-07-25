---
id: 6000-quan-ly-dong-san-pham-va-phu-pham
title: Quản lý Đồng sản phẩm (Co-product) và Phụ phẩm thu hồi (By-product)
description: Thiết lập cấu hình định mức đầu ra đồng hành (Co-products) và phụ phẩm thu hồi (By-products) trên BOM, định nghĩa tỷ lệ phân bổ giá vốn và cơ chế giảm trừ giá thành kế hoạch.
sidebar_label: Đồng sản phẩm & Phụ phẩm
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/6000-quan-ly-dong-san-pham-va-phu-pham
sidebar_position: 6000
date: 2026-11-12
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, co-product, by-product, costing, sql]
---

# 6000 - Đồng sản phẩm & Phụ phẩm

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập Master Data (BOM & Cost Share Setup)** - cách định nghĩa cơ cấu đồng sản phẩm, phụ phẩm thu hồi và thiết lập tỷ lệ phân bổ giá vốn kế hoạch trực tiếp trên BOM [2]. Đối với các giao dịch thực tế báo cáo hoàn thành lệnh sản xuất (Completion), nhập kho đồng sản phẩm và thu hồi phế liệu thực tế dở dang, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP).

---

Trong nhiều ngành công nghiệp (như chế biến gỗ, lọc dầu, hóa chất, thực phẩm hay dập tấm kim loại), quy trình sản xuất không chỉ cho ra một loại thành phẩm duy nhất. Từ một mẻ nguyên liệu đưa vào bồn trộn hoặc máy cắt, xưởng sản xuất sẽ đồng thời thu được nhiều sản phẩm đầu ra khác nhau. 

Hệ thống ERP phân tách nhóm sản phẩm đầu ra phụ này thành hai loại có bản chất hạch toán hoàn toàn trái ngược: **Đồng sản phẩm (Co-product)** và **Phụ phẩm thu hồi (By-product)**. Thiết lập không chính xác tỷ lệ phân bổ giá thành cho hai nhóm này sẽ dẫn đến việc hạch toán sai lệch nghiêm trọng biên lợi nhuận của từng mặt hàng đầu ra. Bài viết này phân tích sâu kiến trúc dữ liệu phân bổ chi phí, luồng thiết lập và cách kiểm tra trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu quản lý đầu ra kép yêu cầu hệ thống ERP không chỉ lưu vết nguyên liệu đầu vào (Input) mà còn phải quản lý cấu trúc phân bổ giá vốn cho các sản phẩm đầu ra (Output):

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Phân hệ OPM (Hóa chất) dùng bảng công thức Formula để định nghĩa mọi đầu ra; Phân hệ Discrete dùng cấu trúc gia đình (Family BOM). | Sử dụng phân hệ **Co-Parts** trên danh mục sản phẩm để khai báo nhiều mã hàng cùng dùng chung một MoM sản xuất [2]. | Sử dụng cờ đánh dấu **Co-product** trực tiếp tại dòng BOM kết hợp bảng tỷ lệ phân bổ (Apportionment Structure) trên Material Master [2]. | Tích hợp sẵn tab cấu hình **By-products** trên BoM; cho phép gán tỷ lệ % giá vốn trực tiếp lên từng dòng đầu ra phụ [2]. |
| **Bảng dữ liệu gốc (Table)** | Bảng chi tiết vật tư công thức OPM **`apps.fm_matl_dtl`** (Phân biệt vai trò bằng cột `line_type`). | Bảng quản lý danh mục đồng sản phẩm **`Erp.PartCoPart`** (Liên kết các Co-Part con với Part cha) [2]. | Bảng dòng vật tư BOM **`saphanadb.STPO`** kết hợp cấu hình nhà máy vật tư **`saphanadb.MARC`** [2]. | Bảng quản lý các sản phẩm đầu ra phụ gán kèm theo BoM **`mrp.bom.byproduct`** [2]. |
| **Mã phân biệt Đồng/Phụ phẩm** | - `line_type = 1`: Main Product<br/>- `line_type = 2`: By-product<br/>- `line_type = 3`: Co-product | Định nghĩa trực tiếp trong bảng `PartCoPart`. Các Part con có chung MoM là Co-parts [2]. | - `STPO.KZKUP = 'X'`: Co-product [2].<br/>- Dòng vật tư có lượng âm (`MENGE < 0`): By-product [2]. | - `cost_share > 0`: Co-product [2].<br/>- `cost_share = 0`: By-product [2]. |
| **Tỷ lệ phân bổ chi phí (Cost Share)** | Định nghĩa bằng tỷ lệ % phân bổ trực tiếp trên dòng công thức Recipe. | Cột **`CostFactor`** trong `PartCoPart` (ví dụ: gán tỷ lệ chi phí `0.60` cho máy A, `0.40` cho máy B) [2]. | Cấu hình bảng số hiệu tương đương (Equivalence numbers) thuộc Apportionment Structure tại MARC. | Cột **`cost_share`** trong `mrp.bom.byproduct` (Đơn giản hóa bằng nhập trực tiếp % phân bổ giá vốn) [2]. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (OPM Formula Lines — Bảng: `apps.fm_matl_dtl`)
Trong phân hệ sản xuất OPM của Oracle, mọi thành phần đầu vào và đầu ra đều được nhập chung trên một màn hình Formula:
1. **Bước 1 (Chọn dòng vai trò vật tư):** Truy cập `OPM > Formula > Formulas`, mở chi tiết dòng vật tư.
2. **Bước 2 (Gán loại dòng hạch toán):** Tại trường **`Line Type`** (field DB: `line_type`), người dùng gán:
   - Chọn `1` (Product): Thành phẩm chính.
   - Chọn `2` (By-product): Phụ phẩm thu hồi (không gánh chi phí).
   - Chọn `3` (Co-product): Đồng sản phẩm (cùng chia sẻ chi phí).
3. **Bước 3 (Nhập tỷ lệ phân bổ giá thành):** Đối với các dòng chọn loại `Co-product`, người dùng nhập tỷ lệ phần trăm phân bổ chi phí trực tiếp trên dòng.

### b. Hệ thống Epicor ERP (Cơ chế Co-Parts — Bảng: `Erp.PartCoPart` / `Erp.Part`)
Epicor quản lý đồng sản phẩm thông qua việc thiết lập danh mục Co-Parts gắn với cấu trúc MoM của sản phẩm chính:
1. **Bước 1 (Vào danh mục Part Co-Parts):** Truy cập `Part Maintenance > Co-Parts`.
2. **Bước 2 (Gán sản phẩm đầu ra phụ):** Tại tab `Co-Parts Detail`, thêm mới một dòng và nhập mã sản phẩm con cùng được tạo ra (ví dụ: gán tấm tôn vụn kích thước lớn `PART_STEEL_SMALL` làm Co-part của sản phẩm dập vỏ tủ chính `PART_CABINET`) [2].
3. **Bước 3 (Nhập hệ số chia chi phí):** Tại trường **`Cost Factor`** (field DB: `CostFactor`), nhập hệ số phân bổ (ví dụ nhập: `0.15` - tương đương gán 15% tổng chi phí sản xuất của Job cho sản phẩm phụ, 85% còn lại gán cho tủ chính) [2].

### c. Hệ thống SAP S/4HANA (Kuppelprodukt & Nebenerzeugnis — Bảng: `MARC` / `STPO`)
SAP phân tách rõ rệt cách định nghĩa Đồng sản phẩm (Co-product) và Phụ phẩm (By-product):
1. **Thiết lập Đồng sản phẩm (Co-product - Kuppelprodukt):**
   - **Bước 1 (Khai báo trên Material Master):** Tại màn hình sửa vật tư cả sản phẩm chính và sản phẩm phụ (MRP 2 view / Costing 1 view), người dùng bắt buộc phải tích chọn cờ **`Co-product`** (field DB: `KZEFF = 'X'`) [2].
   - **Bước 2 (Khai báo trên BOM):** Trong T-Code `CS02` (Sửa BOM), gán mã sản phẩm phụ vào dòng nguyên liệu với **số lượng âm** (ví dụ: `-1` chiếc). Bấm đúp vào dòng, tích chọn checkbox **`Co-product`** (field DB: `STPO-KZKUP = 'X'`) [2].
   - **Bước 3 (Thiết lập tỷ lệ phân bổ):** Tại Material Master của sản phẩm chính, chọn nút `Joint Production` để khai báo bảng tỷ lệ tương đương phân bổ chi phí (Apportionment Structure).
2. **Thiết lập Phụ phẩm (By-product - Nebenerzeugnis):**
   - Chỉ cần gán mã phụ phẩm vào dòng BOM với số lượng âm (ví dụ: `-0.05 kg` phoi thép thừa) [2] và **không tích chọn** cờ `Co-product` [2]. Hệ thống tự động hiểu đây là phụ phẩm không gánh chi phí dở dang [2].

### d. Hệ thống Odoo ERP (BoM By-products & Cost Share — Bảng: `mrp.bom.byproduct`)
Odoo quản lý đầu ra phụ tinh gọn nhất thông qua một màn hình tích hợp:
1. **Bước 1 (Mở BoM):** Vào màn hình tạo BoM của sản phẩm, chuyển sang tab **`By-products`** [2].
2. **Bước 2 (Gán sản phẩm đầu ra phụ):** Thêm dòng mới, nhập mã sản phẩm phụ đầu ra (ví dụ: `Tấm tôn thừa`).
3. **Bước 3 (Nhập tỷ lệ % phân bổ giá vốn):** Tại cột **`Cost Share`** (field DB: `cost_share`), nhập tỷ lệ % phân bổ chi phí [2]:
   - Nếu nhập **`0.00%`**: Odoo hiểu đây là Phụ phẩm (By-product) thông thường [2]. Giá vốn của phụ phẩm này khi nhập kho sẽ được coi là bằng `0` (hoặc bằng giá trị phế liệu thu hồi tùy cấu hình) và không gánh chi phí dở dang của lệnh sản xuất [2].
   - Nếu nhập **`15.00%`**: Odoo hiểu đây là Đồng sản phẩm (Co-product) [2]. Khi đóng lệnh sản xuất, 15% tổng chi phí nguyên vật liệu, nhân công, khấu hao máy của MO sẽ được phân bổ trực tiếp để làm giá vốn cho sản phẩm phụ này, 85% còn lại tính cho sản phẩm chính [2].

---

## 3. Thuật toán Phân bổ Giá vốn Sản xuất (Cost Apportionment & Allocation)

Khi tiến hành đóng lệnh sản xuất dở dang (WIP Close) và chạy tính giá thành thực tế cuối tháng, hệ thống kế toán sản xuất (WIP Costing) sẽ tự động bóc tách tổng chi phí tích lũy dở dang ($TC_{WIP}$) của lệnh để phân bổ thành giá vốn cho các sản phẩm đầu ra dựa trên các thuộc tính cấu hình.

### Công thức tính Giá vốn Đồng sản phẩm $A$ ($COGS_{Co-part A}$):
$$COGS_{Co-part A} = TC_{WIP} \times \text{Cost Share Rate of } A (\%)$$

### Công thức tính Giá vốn Thành phẩm chính sau khi giảm trừ Phụ phẩm ($COGS_{Main}$):
$$COGS_{Main} = TC_{WIP} - \sum \text{Giá trị định giá kế hoạch của các Phụ phẩm thu hồi (By-products)}$$

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Đồng/Phụ phẩm

### Bài toán 1: Phân bổ giá thành đồng sản phẩm trong quy trình xẻ gỗ tự nhiên (Lumber Cutting Co-products)
*   **Thực tế:** Nhà máy đưa 1 khối gỗ tròn nguyên bản đầu vào (`GỖ_TRÒN`) vào dây chuyền xẻ gỗ. Đầu ra thu được đồng thời: 0.5 khối gỗ hộp chất lượng cao (`GỖ_HỘP_A`), 0.3 khối gỗ ván chất lượng trung bình (`GỖ_VÁN_B`), và 0.1 khối củi dăm vụn (`CỦI_DĂM`). Gỗ hộp A có giá trị thương mại rất cao, gỗ ván B có giá trị trung bình, còn củi dăm hầu như không có giá trị (chỉ dùng làm chất đốt lò hơi). Làm sao để phân bổ chi phí mua gỗ tròn và giờ công dập xẻ một cách hợp lý cho 3 đầu ra này?
*   **Giải pháp thực tế:**
    - Cấu hình cây BoM xẻ gỗ:
      - Thành phẩm chính: `GỖ_HỘP_A` (Gánh **`65%`** tổng chi phí xẻ).
      - Đồng sản phẩm 1 (Co-product): `GỖ_VÁN_B` (Gán **`35%`** tổng chi phí dở dang qua cột Cost Share/Cost Factor) [2].
      - Phụ phẩm 2 (By-product): `CỦI_DĂM` (Gán **`0%`** Cost Share - giá thành nhập kho bằng 0) [2].
    - Khi đóng lệnh xẻ gỗ, tổng chi phí dập xẻ phát sinh thực tế là 10.000.000 VNĐ. Hệ thống tự động phân bổ 6.500.000 VNĐ để tính giá vốn cho 0.5 khối gỗ hộp A, phân bổ 3.500.000 VNĐ làm giá vốn cho 0.3 khối gỗ ván B, còn củi dăm dôi dư nhập kho với giá trị bằng 0, giải quyết triệt để bài toán phân bổ chi phí thực tế.

### Bài toán 2: Giảm giá vốn sản phẩm chính nhờ thu hồi phế liệu dập có giá trị bán thanh lý (Scrap Credit)
*   **Thách thức:** Khi dập tủ điện chính, lượng phế liệu dập tôn thu hồi được có thể bán thanh lý được với đơn giá cố định là 10.000 VNĐ/kg. Nhà máy muốn lượng phế liệu thu hồi được này tự động làm giảm trực tiếp giá vốn sản xuất của tủ điện chính (Scrap Credit) ngay trên lệnh sản xuất.
*   **Giải pháp thực tế:**
    - Trên cấu hình BoM tủ điện chính, thêm dòng phế liệu tôn dập ở tab `By-products` với **số lượng định mức âm** (ví dụ: `-2.00 kg`) [2] và cấu hình **`Cost Share = 0%`** (Phụ phẩm) [2].
    - Phòng kế toán thiết lập đơn giá định giá tiêu chuẩn (Standard Cost) cho mã phế liệu tôn dập là 10.000 VNĐ/kg.
    - Khi đóng lệnh sản xuất dập tủ điện với tổng chi phí tích lũy thực tế là 2.000.000 VNĐ, hệ thống tự động ghi nhận nhập kho 2 kg phế liệu tôn dập với giá trị là $2 \times 10,000 = 20,000 \text{ VNĐ}$. Lượng 20.000 VNĐ này được ERP tự động hạch toán giảm trừ trực tiếp vào giá vốn của tủ điện dập chính:
      $$\text{Giá vốn tủ điện chính} = 2,000,000 - 20,000 = 1,980,000 \text{ VNĐ}$$

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu liên kết Đồng / Phụ phẩm

### a. Trên hệ thống Oracle EBS (PL/SQL - Phân hệ OPM Formulas)
Truy vấn toàn bộ các dòng đầu ra của công thức sản xuất OPM, phân loại vai trò hạch toán chi phí (`Main Product`, `By-product` hoặc `Co-product`):

```sql
SELECT 
    ffh.formula_no AS "Formula Code",
    ffh.formula_vers AS "Formula Version",
    msib.segment1 AS "Item Code",
    msib.description AS "Item Description",
    -- Decode trường line_type (1: Main Product, 2: By-Product, 3: Co-Product, -1: Ingredient)
    DECODE(fmd.line_type, 
           -1, 'Ingredient (Input Input)', 
           1, 'Main Product (Output)', 
           2, 'By-Product (Cost Credit)', 
           3, 'Co-Product (Shared Cost)') AS "Line Type Classification",
    fmd.qty AS "Standard Output Qty",
    fmd.detail_uom AS "UOM"
FROM 
    apps.fm_matl_dtl fmd
INNER JOIN apps.fm_form_mst_b ffh ON fmd.formula_id = ffh.formula_id
INNER JOIN apps.mtl_system_items_b msib ON fmd.inventory_item_id = msib.inventory_item_id AND fmd.organization_id = msib.organization_id
ORDER BY 
    ffh.formula_no, fmd.line_type;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các sản phẩm con đồng hành (Co-Parts) được gán liên kết chung với sản phẩm chính và hệ số phân bổ giá thành (`CostFactor`) của Epicor:

```sql
SELECT 
    pc.Company,
    pc.PartNum AS [Main Parent Part],
    pc.CoPartNum AS [Co-Part Item Code],
    p.Description AS [Co-Part Description],
    pc.PartsPerNum AS [Yield Output Qty],
    -- Hệ số phân bổ chi phí (ví dụ: 0.15 tương đương gánh 15% chi phí của Job)
    pc.CostFactor AS [Cost Allocation Factor] 
FROM 
    Erp.PartCoPart pc
INNER JOIN 
    Erp.Part p ON pc.Company = p.Company AND pc.CoPartNum = p.PartNum
WHERE 
    pc.Company = 'EP01'
ORDER BY 
    pc.PartNum, pc.CoPartNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh mục BOM Line (`STPO`) lọc ra các dòng được cấu hình là đồng sản phẩm (cờ `KZKUP = 'X'`) hoặc phụ phẩm thu hồi (định mức số lượng âm):

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material Code",
    i.POSNR AS "BOM Item Number",
    i.IDNRK AS "Output Material",
    i.MENGE AS "Output Quantity Standard",
    i.MEINS AS "UOM",
    -- Giải mã thuộc tính của SAP S/4HANA
    CASE 
        WHEN i.KZKUP = 'X' THEN 'Co-Product (Shared Cost)'
        WHEN i.MENGE < 0 THEN 'By-Product (Negative Qty / Cost Credit)'
        ELSE 'Standard Input Component'
    END AS "Output Role Type"
FROM 
    saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
WHERE 
    m.WERKS = '1000'
    -- Lọc riêng đồng sản phẩm và phụ phẩm thu hồi lượng âm
    AND (i.KZKUP = 'X' OR i.MENGE < 0)
    AND i.LKENZ = ' ' -- Loại bỏ dòng đã bị xóa logic
ORDER BY 
    m.MATNR, i.POSNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh mục sản phẩm đầu ra phụ cấu hình tại tab By-products của Odoo, hiển thị tỷ lệ phần trăm phân bổ giá vốn để kiểm toán hạch toán:

```sql
SELECT 
    pt_p.name AS "Main Product Template",
    pt_b.name AS "By-Product / Co-Product Name",
    bp.product_qty AS "Standard Output Qty",
    uom.name AS "UOM",
    -- Tỷ lệ phần trăm chia sẻ chi phí (0% đại diện cho By-product thường, >0% đại diện cho Co-product)
    bp.cost_share AS "Cost Share Percentage (%)" 
FROM 
    mrp_bom_byproduct bp
INNER JOIN mrp_bom bom ON bp.bom_id = bom.id
INNER JOIN product_template pt_p ON bom.product_tmpl_id = pt_p.id
INNER JOIN product_product pp_b ON bp.product_id = pp_b.id
INNER JOIN product_template pt_b ON pp_b.product_tmpl_id = pt_b.id
LEFT JOIN uom_uom uom ON bp.product_uom_id = uom.id
WHERE 
    bom.active = true
ORDER BY 
    pt_p.name, bp.cost_share DESC;