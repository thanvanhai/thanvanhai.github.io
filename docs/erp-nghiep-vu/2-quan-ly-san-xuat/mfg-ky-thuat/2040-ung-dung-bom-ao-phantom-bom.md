---
id: 2040-ung-dung-bom-ao-phantom-bom
title: Ứng dụng BOM ảo (Phantom BOM) trong sản xuất lắp ráp
description: Ứng dụng BOM ảo (Phantom BOM) trong sản xuất lắp ráp
sidebar_label: BOM ảo (Phantom BOM)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2040-ung-dung-bom-ao-phantom-bom
sidebar_position: 2040
date: 2026-09-24
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, phantom-bom, blow-through, sql]
---

# 2040 Ứng dụng BOM ảo (Phantom BOM) trong sản xuất lắp ráp

Trong môi trường thiết kế kỹ thuật, kỹ sư R&D luôn muốn cấu trúc sản phẩm được chia thành các cụm module lắp ráp (Sub-assemblies) riêng biệt để dễ quản lý bản vẽ và phiên bản thiết kế. Tuy nhiên, trên sàn sản xuất, các cụm trung gian này không hề được sản xuất trước để nhập kho lưu trữ. Công nhân tại trạm lắp ráp sẽ lấy trực tiếp linh kiện lẻ để lắp thẳng vào khung máy chính.

Nếu giữ nguyên cấu trúc thiết kế của R&D vào sản xuất, hệ thống ERP sẽ tự động sinh ra hàng loạt Lệnh sản xuất con (Sub-orders) và yêu cầu thủ kho làm các thủ tục nhập - xuất kho trung gian vô cùng phiền phức. Để giải quyết bài toán này, ERP sử dụng giải pháp **BOM ảo (Phantom BOM / Blow-through BOM)**.

Bài viết này phân tích sâu kiến trúc dữ liệu, thuật toán phân rã xuyên cấp (Blow-through) và cách cấu hình Phantom BOM trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Về mặt dữ liệu, Phantom BOM thực chất là một cấu trúc BOM có đầy đủ thông tin cha-con bình thường, nhưng được gắn một "cờ hiệu" đặc biệt để báo cho động cơ phân rã (BOM Exploder) biết phải bỏ qua mã này khi tạo lệnh sản xuất.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Cấu hình thông qua thuộc tính **WIP Supply Type** trên dòng BOM hoặc Item Master. | Cấu hình thuộc tính liên kết **Pull as Assembly** và **Plan as Assembly** trên MoM. | Cấu hình thông qua **Mã mua sắm đặc biệt (Special Procurement Key)** tại Material Master. | Cấu hình loại BOM trực tiếp tại Header của BoM (**BoM Type**). |
| **Trường dữ liệu chính (Flag)** | `BOM_INVENTORY_COMPONENTS.WIP_SUPPLY_TYPE` có giá trị là `6` (Phantom). | `PartMtl.PullAsAsm = True` kết hợp `PartMtl.PlanAsAsm = False` trên cây MoM. | `saphanadb.MARC.SOBSL` (Special Procurement) có giá trị là `50` (Phantom Assembly). | `mrp.bom.type` có giá trị là `phantom` (Odoo gọi là Kit/Phantom). |
| **Hành vi của hệ thống** | MRP bỏ qua mã Phantom, đưa trực tiếp các nguyên liệu con của Phantom lên Lệnh sản xuất cha. | Hệ thống kéo trực tiếp cấu trúc con của cụm này vào Job cha mà không tạo Job con riêng biệt. | Hệ thống chạy thuật toán "Blow-through" xuyên qua cụm Phantom để lập lịch và tính năng lực cho cụm con. | Tạo Lệnh sản xuất cha với danh sách nguyên liệu là các linh kiện con của BoM Kit/Phantom. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình WIP Supply Type = Phantom)
Oracle EBS cho phép gán thuộc tính Phantom linh hoạt tại cấp Item Master hoặc cấu hình đặc thù ngay trên dòng BOM:
1. **Cách 1 (Toàn cục - Global):** Vào `Inventory > Items > Master Items`, tại tab `WIP`, trường `Supply Type` chọn **`Phantom`**. Mọi BOM chứa vật tư này sẽ tự động được coi là Phantom.
2. **Cách 2 (Đặc thù - Local):** Vào màn hình BOM (`BOM > Bills > Bills`), tại dòng linh kiện trung gian, chuyển sang tab `WIP` và chọn trường **`WIP Supply Type = Phantom`** (Trường hợp này sẽ override cấu hình trên Item Master).

### b. Hệ thống Epicor ERP (Thiết lập liên kết Pull & Plan As Assembly)
Epicor không dùng thuật ngữ "Phantom BOM" trên giao diện MoM mà điều khiển hành vi này bằng cặp cờ liên kết:
1. **Bước 1 (Check out vào Workbench):** Mở sản phẩm cha trong màn hình `Engineering Workbench`.
2. **Bước 2 (Cấu hình trên dòng vật tư cụm):** Tại dòng nguyên liệu là cụm lắp ráp trung gian, người dùng tích chọn trường **`Pull as Assembly = True`** và bỏ tích trường **`Plan as Assembly = False`**.
3. **Ý nghĩa vận hành:** Khi chạy lập lịch hoặc tạo Job, Epicor sẽ tự động gom toàn bộ nguyên liệu con của cụm này lên Job cha, bỏ qua việc tạo Job con trung gian cho cụm.

### c. Hệ thống SAP S/4HANA (Cấu hình Special Procurement Key = 50)
SAP quản lý Phantom BOM tập trung tại danh mục vật tư để kiểm soát đồng bộ dòng đời sản phẩm:
1. **Bước 1 (Vào Material Master):** Sử dụng T-Code `MM02` (Sửa vật tư), tìm mã cụm lắp ráp trung gian.
2. **Bước 2 (Cấu hình trên View MRP 2):** Tại trường **`Special Procurement`** (Sonderbeschaffungsschlüssel), người dùng chọn giá trị **`50`** (Phantom Assembly).
3. **Ý nghĩa vận hành:** Kể từ thời điểm này, bất kỳ BOM nào chứa mã vật tư này, khi chạy máy sản xuất hoặc tính toán MRP, hệ thống sẽ tự động kích hoạt thuật toán phân rã xuyên cấp (Blow-through).

### d. Hệ thống Odoo ERP (Thiết lập BoM Type = Kit)
Odoo tối giản hóa bằng cách gộp khái niệm Phantom BOM và Bộ linh kiện bán hàng (Kit) thành một:
1. **Bước 1 (Tạo BoM cho cụm):** Vào `Manufacturing > Products > Bills of Materials`, tạo BoM cho cụm lắp ráp trung gian.
2. **Bước 2 (Chọn BoM Type):** Trên phần cấu hình Header, tại trường `BoM Type`, tích chọn tùy chọn **`Kit`** (trong database lưu là `phantom`).
3. **Ý nghĩa vận hành:** Khi tạo Lệnh sản xuất (MO) cho sản phẩm cha, Odoo kiểm tra và thấy linh kiện con có BoM loại `Kit` sẽ tự động phân rã phẳng và hiển thị danh sách nguyên vật liệu thô của Kit trực tiếp lên MO của cha.

---

## 3. Thuật toán phân rã Lệnh sản xuất xuyên qua BOM ảo (Phantom Explosion)

Khi bộ phận kế hoạch tạo Lệnh sản xuất cho sản phẩm cha, hệ thống ERP sẽ tự động kích hoạt thuật toán **Phân rã xuyên cấp (Blow-through / Flattening)** đối với các cụm được đánh dấu là Phantom.

```text
CẤU TRÚC THIẾT KẾ (R&D View)               CẤU TRÚC THỰC THI SẢN XUẤT (Shop Floor View)
       [ XE MÁY ]                                         [ XE MÁY ]
           │                                                  │
 ┌─────────┴─────────┐                                ┌───────┼───────┐
[ KHUNG ]    [ CỤM BÁNH XE ] (PHANTOM)             [ KHUNG ]  │    [ LỐP XE ]
                 │                                            │
         ┌───────┴───────┐                                    ├────[ NAN HOA ]
     [ LỐP XE ]      [ NAN HOA ]                              │
                                                              └────[ VÀNH XE ]
```

### Thuật toán phân rã đệ quy:
1. Hệ thống đọc dòng vật tư đầu tiên của sản phẩm cha.
2. Nếu gặp vật tư thường $\rightarrow$ đưa trực tiếp vào danh sách cấp phát của Lệnh sản xuất (WIP Material List).
3. Nếu gặp vật tư được đánh dấu là **`Phantom`**:
   - Hệ thống không đưa mã Phantom này vào danh sách cấp phát.
   - Hệ thống thực hiện truy vấn đệ quy xuống BOM cấp dưới của chính mã Phantom đó để lấy toàn bộ các linh kiện con (`Lốp xe`, `Nan hoa`, `Vành xe`).
   - Nhân định mức của các linh kiện con này với định mức yêu cầu của cụm Phantom cha.
   - Đưa toàn bộ các linh kiện con đã nhân định mức trực tiếp vào danh sách cấp phát của Lệnh sản xuất cha.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến BOM ảo

### Bài toán 1: Giảm thiểu thủ tục hành chính tại xưởng lắp ráp thiết bị điện tử
*   **Thực tế:** Một chiếc tủ lạnh có cụm bo mạch điều khiển trung tâm (`PCBA_CTRL`). Bộ phận R&D thiết kế nó gồm bo mạch thô và 30 linh kiện tụ điện, chíp điện tử khác nhau. Trong thực tế, công nhân tại xưởng lắp ráp tủ lạnh sẽ lấy trực tiếp bo mạch thô và linh kiện ra để hàn dán trực tiếp lên tủ lạnh. Nếu không dùng BOM ảo, thủ kho sản xuất sẽ phải làm 30 giao dịch xuất kho nguyên liệu cho lệnh sản xuất `PCBA_CTRL`, sau đó làm tiếp thủ tục nhập kho thành phẩm `PCBA_CTRL`, rồi lại làm thủ tục xuất kho `PCBA_CTRL` cho lệnh lắp ráp tủ lạnh chính.
*   **Giải pháp thực tế:**
    Cấu hình cụm `PCBA_CTRL` thành **Phantom BOM**. Khi đó, lệnh sản xuất lắp ráp tủ lạnh chính sẽ tự động hiển thị danh sách yêu cầu cấp phát trực tiếp gồm bo mạch thô và 30 linh kiện tụ chíp ngay tại trạm lắp ráp. Thủ kho chỉ cần làm đúng một lần giao dịch xuất kho linh kiện lẻ thẳng cho lệnh lắp ráp tủ lạnh chính, loại bỏ hoàn toàn 3 bước giao dịch trung gian vô ích trên hệ thống.

### Bài toán 2: Xử lý tồn kho đột xuất của cụm BOM ảo (Phantom Stock Consumption)
*   **Thách thức:** Do BOM ảo không có lệnh sản xuất riêng nên mặc định tồn kho của nó luôn bằng `0`. Tuy nhiên, trong thực tế, do một lệnh sản xuất cha trước đó bị hủy, nhà máy dư thừa ra **5 cụm bó cáp điều khiển** (đã được lắp ráp hoàn chỉnh thành cụm Phantom). Làm thế nào để ở lệnh sản xuất tiếp theo, hệ thống tự động bốc và trừ kho 5 cụm bó cáp hoàn chỉnh này trước rồi mới phân rã các linh kiện dây điện lẻ đối với phần sản lượng còn thiếu?
*   **Giải pháp thực tế:**
    Các hệ thống ERP lớn như **Oracle EBS** và **SAP S/4HANA** sở hữu thuật toán thông minh cho trường hợp này (gọi là *Phantom Stock Check*):
    - Khi phân rã BOM, hệ thống luôn kiểm tra lượng tồn kho thực tế khả dụng của mã Phantom trước.
    - Nếu phát hiện trong kho đang có sẵn **5 cụm Phantom khả dụng**, hệ thống sẽ tự động bốc 5 cụm này vào Lệnh sản xuất cha dưới dạng vật tư thông thường (yêu cầu xuất kho trực tiếp cụm).
    - Đối với phần sản lượng còn thiếu của lệnh sản xuất, hệ thống mới tiến hành chạy thuật toán phân rã "Blow-through" thành các linh kiện dây điện lẻ, tối ưu hóa việc tiêu thụ các cụm bán thành phẩm dôi dư trong kho.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu BOM ảo (Phantom BOM)

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách tất cả các linh kiện trung gian được cấu hình là Phantom (WIP Supply Type = 6) trên hệ thống Oracle EBS:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_p.segment1 AS "Parent Item",
    bic.item_num AS "BOM Seq",
    msib_c.segment1 AS "Phantom Component Code",
    msib_c.description AS "Phantom Component Name",
    bic.component_quantity AS "Quantity",
    -- Giải mã WIP Supply Type (6 tương đương với Phantom)
    fl.meaning AS "WIP Supply Type"
FROM  apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
INNER JOIN apps.fnd_lookup_values fl ON CAST(bic.wip_supply_type AS VARCHAR2) = fl.lookup_code
                                    AND fl.lookup_type = 'WIP_SUPPLY' 
                                    AND fl.language = 'US'
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    AND bic.wip_supply_type = 6  -- Lọc riêng loại Phantom
ORDER BY 
    msib_p.segment1, bic.item_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các mối quan hệ cụm lắp ráp trung gian được cấu hình dạng Phantom (được kéo thẳng `PullAsAsm = 1` nhưng không lập kế hoạch riêng `PlanAsAsm = 0`) trên Epicor:

```sql
SELECT 
    pm.Company,
    pm.PartNum AS [Parent Part Code],
    p_parent.Description AS [Parent Description],
    pm.MtlSeq AS [Mtl Seq],
    pm.MtlPartNum AS [Phantom Sub-Assembly],
    p_comp.Description AS [Sub-Assembly Description],
    pm.QtyPer AS [Qty Per],
    pm.PullAsAsm AS [Pull As Assembly (1=True)], -- Kéo thẳng nguyên cụm
    pm.PlanAsAsm AS [Plan As Assembly (0=False)] -- Không lập kế hoạch độc lập
FROM  Erp.PartMtl pm
INNER JOIN  Erp.Part p_parent ON pm.Company = p_parent.Company AND pm.PartNum = p_parent.PartNum
INNER JOIN  Erp.Part p_comp ON pm.Company = p_comp.Company AND pm.MtlPartNum = p_comp.PartNum
WHERE pm.Company = 'EP01'
    -- Cấu hình kinh điển đại diện cho Phantom BOM trong Epicor
    AND pm.PullAsAsm = 1 
    AND pm.PlanAsAsm = 0
ORDER BY 
    pm.PartNum, pm.MtlSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh sách các vật tư được cấu hình mã mua sắm đặc biệt là Phantom Assembly (Special Procurement Key `SOBSL = 50`) trong hệ thống SAP S/4HANA:

```sql
SELECT 
    marc.WERKS AS "Plant",
    marc.MATNR AS "Material Code",
    makt.MAKTX AS "Material Description",
    marc.SOBSL AS "Special Procurement Key", -- 50 tương đương với Phantom Assembly
    -- Liên kết lấy thông tin nhóm lập kế hoạch (MRP Controller)
    marc.DISPO AS "MRP Controller"
FROM  saphanadb.MARC marc
INNER JOIN saphanadb.MAKT makt ON marc.MATNR = makt.MATNR AND makt.SPRAS = 'E' -- Lấy tiếng Anh
WHERE marc.WERKS = '1000'
    AND marc.SOBSL = '50' -- Lọc các mã cấu hình là Phantom Assembly
ORDER BY 
    marc.MATNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách tất cả các cấu trúc BoM được thiết lập loại là Kit/Phantom (`type = 'phantom'`) trong cơ sở dữ liệu Odoo:

```sql
SELECT 
    pt.name AS "Product Name",
    bom.code AS "BoM Reference",
    -- Decode loại BoM
    CASE bom.type 
        WHEN 'phantom' THEN 'Kit / Phantom BOM (Blow-through)'
        ELSE bom.type 
    END AS "BoM Type",
    bom.product_qty AS "Base Quantity",
    bom.active AS "Is Active?"
FROM mrp_bom bom
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
WHERE bom.type = 'phantom' -- Chỉ lấy loại Kit/Phantom
    AND bom.active = true
ORDER BY 
    pt.name;