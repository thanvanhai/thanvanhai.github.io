---
id: 2010-bom-nhieu-cap-cau-truc-san-pham
title: Cấu trúc sản phẩm & BOM nhiều cấp (Multi-level BOM)
sidebar_label: 2010 - BOM nhiều cấp & Cấu trúc cây
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2010-bom-nhieu-cap-cau-truc-san-pham
date: 2026-09-15
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, multi-level-bom, low-level-code, sql]
---

# Cấu trúc sản phẩm & BOM nhiều cấp (Multi-level BOM)

Rất hiếm sản phẩm nào được tạo thành từ một danh sách vật tư phẳng một cấp duy nhất. Thông thường, một chiếc xe máy được lắp ráp từ khung xe, động cơ và bánh xe (Bán thành phẩm - Sub-assemblies). Động cơ lại được lắp ráp từ piston, xi lanh và xéc măng (Cụm linh kiện). 

Việc quản lý cấu trúc sản phẩm dạng cây nhiều cấp (Multi-level / Indented BOM) đòi hỏi hệ thống ERP phải có khả năng xử lý liên kết đệ quy (Recursive Relationship) và tính toán chính xác thứ tự lập kế hoạch thông qua chỉ số **Mã cấp thấp nhất (Low-Level Code)**.

Bài viết này phân tích kiến trúc dữ liệu đệ quy, luồng vận hành và thuật toán điều phối sản xuất nhiều cấp trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu đệ quy (Recursive Data Architecture)

Để lưu trữ cấu trúc cây sản phẩm vô hạn cấp mà không làm phình to số lượng bảng, các hệ thống ERP sử dụng thiết kế **Đệ quy tự liên kết (Self-Referencing / Recursive Table)**. Bảng dòng vật tư BOM chỉ liên kết ngược lại bảng Master dựa trên khóa ngoại của mã sản phẩm con, biến mã con ở cấp trên trở thành mã cha ở cấp dưới.

Đồng thời, để thuật toán MRP hoạt động mà không bị tính toán trùng lặp, hệ thống sử dụng trường chỉ số **Low-Level Code (Mã cấp thấp nhất)**:

| Thành phần kiến trúc | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất liên kết** | Khớp nối mã con của dòng `BOM_INVENTORY_COMPONENTS` với mã cha của bảng `BOM_BILL_OF_MATERIALS`. | Liên kết trường `PartMtl.MtlPartNum` ngược lại trường `PartMtl.PartNum`. | Khớp nối linh kiện con `STPO.IDNRK` với liên kết gốc `MAST.MATNR`. | Khớp nối dòng sản phẩm con `mrp.bom.line.product_id` với cấu hình gốc `mrp.bom.product_tmpl_id`. |
| **Mã cấp thấp nhất (Low-Level Code - LLC)** | Lưu tại cột `LOW_LEVEL_CODE` trong bảng `MTL_SYSTEM_ITEMS_B`. | Lưu tại cột `Part.LowLevelCode` trong bảng danh mục sản phẩm. | Lưu tại cột `DISST` (Low-Level Code) trong bảng `MARA` / `MARC`. | Tính toán động bằng luồng hệ thống khi chạy kế hoạch MRP. |
| **Cơ chế đồng bộ LLC** | Hệ thống tự động chạy chương trình `BOMALOCK` (Loop Checker and Low Level Code Calculator) để cập nhật lại chỉ số. | Hệ thống tự động kích hoạt tính toán lại khi có giao dịch phê duyệt MoM (Method of Manufacture) mới. | Tự động cập nhật mỗi khi lưu BOM hoặc chạy chương trình đồng bộ `RCU_LOW_LEVEL_CODES`. | Hệ thống tự động phân tích cấu hình cây khi chạy tiến trình lập kế hoạch sản xuất. |

---

## 2. So sánh luồng thiết lập và hiển thị (UI & UX Flows)

### a. Hệ thống Oracle EBS (Sử dụng BOM Exploder)
Oracle EBS cho phép khai báo độc lập từng cấp và hiển thị cấu trúc cây qua công cụ phân rã:
1. **Thiết lập:** Người dùng tạo các mã hàng độc lập (Nguyên vật liệu, Bán thành phẩm, Thành phẩm) tại Item Master. Tiếp theo, tạo BOM độc lập cho từng cụm. Ví dụ: Tạo BOM cho động cơ (Cha: `ENGINE`, con: `PISTON`), tiếp theo tạo BOM cho xe máy (Cha: `MOTORBIKE`, con: `ENGINE`). Hệ thống tự động nhận diện đây là cấu trúc nhiều cấp.
2. **Hiển thị:** Để xem toàn bộ cấu trúc, người dùng vào `BOM > Bills > Indented Bills`. Công cụ *BOM Exploder* của Oracle sẽ tự động quét đệ quy các bảng và hiển thị cấu trúc dạng hình cây thụt lề (Indented) kèm theo thông tin chi tiết từng cấp.

### b. Hệ thống Epicor ERP (Thiết lập trực quan trên cây MoM)
Epicor cung cấp giao diện trực quan cho phép kỹ sư xây dựng toàn bộ cây sản phẩm nhiều cấp trên cùng một màn hình:
1. **Thiết lập:** Trong màn hình `Engineering Workbench`, khi cấu hình sản phẩm cha, người dùng có thể kéo thả một cụm bán thành phẩm vào danh sách vật tư. 
2. **Thuộc tính liên kết:** Đối với cụm bán thành phẩm con, người dùng có thể tích chọn thuộc tính **`Pull as Assembly`** (Yêu cầu sản xuất cụm này ngay khi chạy lệnh cha) hoặc chọn **`View as Asm`** (`PartMtl.ViewAsAsm`) để chỉ định hệ thống hiển thị đây là một cấp lắp ráp con thay vì vật tư đơn lẻ.

### c. Hệ thống SAP S/4HANA (Truy xuất qua hệ thống T-Code CS11/CS12/CS13)
SAP quản lý phân rã cấu trúc cây theo nhiều mục đích phân tích khác nhau:
1. **Thiết lập:** Tương tự Oracle EBS, người dùng tạo các BOM một cấp độc lập qua T-Code `CS01`.
2. **Phân rã đa dạng:** Để kiểm tra cấu trúc nhiều cấp, SAP cung cấp 3 mã giao dịch đặc thù:
   - `CS11` (BOM Explode: Indented): Hiển thị cấu trúc cây thụt lề theo từng cấp rõ ràng.
   - `CS12` (BOM Explode: Multi-level): Phân rã phẳng toàn bộ các cấp dưới dạng bảng danh sách tổng hợp.
   - `CS13` (Summarized BOM): Tổng hợp cộng dồn tổng nhu cầu của từng loại linh kiện trên tất cả các cấp (phục vụ mua sắm vật tư nhanh).

### d. Hệ thống Odoo ERP (Quản lý qua BoM Structure & Cost Analysis)
Odoo tối giản hóa việc thiết lập nhưng cung cấp giao diện phân tích cấu trúc và chi phí cực kỳ hiện đại:
1. **Thiết lập:** Khai báo BOM cho sản phẩm con. Sau đó gán sản phẩm con này vào dòng nguyên liệu của sản phẩm cha.
2. **Hiển thị:** Trên giao diện cấu hình BoM của sản phẩm cha, xuất hiện nút **`Structure & Cost`**. Khi bấm vào, Odoo hiển thị một giao diện tương tác đẹp mắt, cho phép người dùng mở rộng/thu gọn từng cấp của cây sản phẩm, hiển thị chi tiết thời gian và chi phí tích lũy của từng công đoạn con dưới dạng thời gian thực.

---

## 3. Thuật toán Lập kế hoạch theo Mã cấp thấp nhất (Low-Level Code)

Khi hệ thống chạy MRP để tính toán nhu cầu mua hàng và sản xuất, thuật toán không được phép chạy lộn xộn từ trên xuống dưới. Nó phải xử lý theo từng tầng của cây sản phẩm, bắt đầu từ cấp cao nhất xuống thấp nhất. Để làm được việc này, ERP sử dụng chỉ số **Low-Level Code (LLC)**.

*   **Định nghĩa:** Mã cấp thấp nhất (LLC) của một vật tư là vị trí sâu nhất của vật tư đó trên tất cả các cây sản phẩm trong toàn hệ thống.
    - Thành phẩm cấp cao nhất luôn có `LLC = 0`.
    - Các bán thành phẩm trực tiếp có `LLC = 1`.
    - Nếu một con ốc vít được dùng trực tiếp ở cấp thành phẩm (`LLC = 1`) và đồng thời dùng trong một cụm động cơ con ở cấp sâu hơn (`LLC = 3`), thì LLC chung của con ốc đó trong toàn hệ thống bắt buộc phải được gán là **`3`**.

```text
Cấu trúc sản phẩm và gán chỉ số LLC:

Cấp 0 (Thành phẩm):          [ XE MÁY ] (LLC = 0)
                               │
                ┌──────────────┴──────────────┐
Cấp 1:      [ KHUNG XE ] (LLC = 1)      [ ĐỘNG CƠ ] (LLC = 1)
                │                             │
Cấp 2:      [ SẮT TẤM ] (LLC = 2)       [ PISTON ] (LLC = 2)
                                              │
Cấp 3:                                  [ ỐC VÍT ] (LLC = 3) <─── Lúc này ỐC VÍT có LLC = 3
                                                                  mặc dù có thể được dùng
                                                                  trực tiếp ở Cấp 1.
```

### Nguyên lý hoạt động của công cụ MRP:
1. MRP sẽ gom toàn bộ các yêu cầu của vật tư có cùng chỉ số LLC để tính toán một lần duy nhất.
2. Hệ thống xử lý xong toàn bộ các sản phẩm ở `LLC = 0` $\rightarrow$ sinh ra nhu cầu cho `LLC = 1`.
3. Xử lý tiếp toàn bộ `LLC = 1` $\rightarrow$ sinh ra nhu cầu cho `LLC = 2`.
4. Việc này đảm bảo khi hệ thống bắt đầu tính toán nhu cầu mua hàng cho **Ốc vít** (`LLC = 3`), nó đã tổng hợp đầy đủ nhu cầu của con ốc này từ tất cả các nguồn ở cấp trên dồn xuống, tránh tình trạng tính toán trùng lặp hoặc sinh ra nhiều đơn mua hàng lặt vặt.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến BOM nhiều cấp

### Bài toán 1: Kiểm soát và ngăn ngừa lỗi vòng lặp đệ quy (Circular Reference / Looping BOM)
*   **Thách thức:** Trong quá trình thiết kế, kỹ sư có thể vô tình tạo ra lỗi vòng lặp: Cấu hình sản phẩm A là cha của sản phẩm B, nhưng trong BOM của sản phẩm B lại gán sản phẩm A làm nguyên liệu con. Lỗi này sẽ làm treo hệ thống MRP hoặc gây ra vòng lặp vô hạn (Infinite Loop) khi phân rã định mức.
*   **Giải pháp thực tế:**
    - **Trong Oracle EBS:** Hệ thống tích hợp sẵn trình kiểm tra lỗi đệ quy. Khi lưu BOM, Oracle sẽ kích hoạt thủ tục kiểm tra. Nếu phát hiện vòng lặp, hệ thống lập tức chặn giao dịch và đưa ra thông báo lỗi: `APP-BOM-20512: Circular reference detected`.
    - **Trong Epicor ERP:** Khi người dùng cố tình Approve một phiên bản MoM có lỗi vòng lặp, Epicor sẽ chạy tiến trình kiểm tra cấu hình cây và đưa ra cảnh báo không cho phép Approve cho đến khi lỗi được khắc phục.

### Bài toán 2: Quản lý cụm bán thành phẩm trung gian (Make-to-Stock vs. Make-to-Order)
*   **Thách thức:** Có những cụm bán thành phẩm trung gian (ví dụ: Cụm dây điện) được sản xuất xong rồi nhập kho để dùng dần (Make-to-Stock). Nhưng cũng có những cụm bán thành phẩm được lắp ráp trực tiếp trên dây chuyền và chuyển ngay sang công đoạn sau mà không hề nhập kho lưu trữ (Make-to-Order / Phantom Assembly). Làm sao để ERP điều phối lệnh sản xuất tương ứng cho 2 trường hợp này?
*   **Giải pháp thực tế:**
    - Đối với cụm nhập kho (`Make-to-Stock`): Khai báo BOM như bình thường. Khi chạy MRP, hệ thống sẽ tự động tạo các Lệnh sản xuất (WIP Jobs/Production Orders) độc lập cho cụm bán thành phẩm này và yêu cầu làm thủ tục nhập kho bán thành phẩm trước khi xuất cho lệnh cha.
    - Đối với cụm chạy trực tiếp không qua kho (`Phantom` / `Pull as Assembly`): Cấu hình thuộc tính của dòng BOM đó là **`Phantom`** (trong Oracle/SAP/Odoo) hoặc chọn **`Pull as Assembly`** (trong Epicor). Khi tạo lệnh sản xuất cha, hệ thống sẽ tự động phân rã phẳng (flatten) cụm này ra, đưa trực tiếp các nguyên vật liệu con của cụm vào lệnh sản xuất của cha mà không tạo lệnh sản xuất riêng cho cụm bán thành phẩm đó.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu BOM nhiều cấp

### a. Trên hệ thống Oracle EBS (Sử dụng lệnh đệ quy CONNECT BY PRIOR)
Đây là câu lệnh thực tế dùng cấu trúc đệ quy chuẩn của Oracle Database để phân rã toàn bộ cây sản phẩm thụt lề từ thành phẩm cha xuống tận nguyên liệu thô cấp thấp nhất:

```sql
SELECT 
    LPAD(' ', (LEVEL - 1) * 4) || msib_c.segment1 AS "Indented Component",
    LEVEL AS "BOM Level",
    msib_c.description AS "Description",
    bic.component_quantity AS "Qty per Parent",
    msib_c.primary_uom_code AS "UOM",
    msib_c.low_level_code AS "Low Level Code",
    -- Hiển thị đường dẫn phân rã
    SYS_CONNECT_BY_PATH(msib_c.segment1, ' / ') AS "BOM Path"
FROM 
    apps.bom_inventory_components bic
INNER JOIN apps.bom_bill_of_materials bbm ON bic.bill_sequence_id = bbm.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1'
    AND (bic.disable_date IS NULL OR bic.disable_date > SYSDATE)
START WITH bbm.assembly_item_id = (
    SELECT inventory_item_id 
    FROM apps.mtl_system_items_b 
    WHERE segment1 = 'MOTORBIKE_X1' AND organization_id = bbm.organization_id -- Thay bằng mã sản phẩm cha của bạn
)
CONNECT BY PRIOR bic.component_item_id = bbm.assembly_item_id;
```

### b. Trên hệ thống Epicor ERP (SQL Server - Sử dụng Common Table Expression - CTE)
Sử dụng câu lệnh CTE đệ quy để phân rã cấu trúc cây nguyên vật liệu của sản phẩm từ bảng `PartMtl`:

```sql
WITH BOM_Explosion AS (
    -- 1. Anchor Member: Lấy các vật tư trực tiếp ở cấp 1
    SELECT 
        1 AS BomLevel,
        pm.PartNum AS ParentPart,
        pm.MtlPartNum AS ChildPart,
        CAST(pm.QtyPer AS DECIMAL(18,4)) AS QtyPer,
        pm.UOMCode,
        CAST(pm.MtlPartNum AS VARCHAR(MAX)) AS Path
    FROM 
        Erp.PartMtl pm
    WHERE 
        pm.Company = 'EP01' 
        AND pm.PartNum = 'BIKE_PARENT' -- Thay bằng mã sản phẩm cần kiểm tra
    
    UNION ALL
    
    -- 2. Recursive Member: Đệ quy tìm kiếm các cụm bán thành phẩm ở cấp sâu hơn
    SELECT 
        be.BomLevel + 1,
        pm2.PartNum,
        pm2.MtlPartNum,
        CAST(be.QtyPer * pm2.QtyPer AS DECIMAL(18,4)), -- Nhân dồn định mức
        pm2.UOMCode,
        be.Path + ' -> ' + pm2.MtlPartNum
    FROM 
        Erp.PartMtl pm2
    INNER JOIN 
        BOM_Explosion be ON pm2.Company = 'EP01' AND pm2.PartNum = be.ChildPart
)
SELECT 
    REPLICATE('    ', BomLevel - 1) + ChildPart AS [Indented Component],
    BomLevel AS [Level],
    ParentPart AS [Parent Code],
    ChildPart AS [Component Code],
    QtyPer AS [Accumulated Quantity], -- Định mức lũy kế cần dùng cho 1 sản phẩm cha ở đỉnh
    UOMCode AS [UOM],
    Path AS [BOM Path]
FROM 
    BOM_Explosion
ORDER BY 
    Path;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL - Cú pháp Đệ quy)
Truy xuất cây cấu trúc BOM nhiều cấp trên hệ cơ sở dữ liệu SAP HANA:

```sql
WITH RECURSIVE BOM_HIE AS (
    -- Lấy cấp cao nhất
    SELECT 
        1 AS LEVEL,
        m.MATNR AS PARENT,
        i.IDNRK AS COMPONENT,
        i.MENGE AS QTY,
        i.MEINS AS UOM
    FROM 
        saphanadb.MAST m
    INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
    INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
    WHERE 
        m.WERKS = '1000' 
        AND m.MATNR = 'MAT_BIKE_01' -- Thay bằng mã vật tư SAP của bạn
        AND i.LKENZ = ' '
    
    UNION ALL
    
    -- Đệ quy liên kết cấp tiếp theo
    SELECT 
        b.LEVEL + 1,
        m2.MATNR,
        i2.IDNRK,
        b.QTY * i2.MENGE,
        i2.MEINS
    FROM 
        saphanadb.MAST m2
    INNER JOIN saphanadb.STKO h2 ON m2.STLNUM = h2.STLNUM
    INNER JOIN saphanadb.STPO i2 ON h2.STLNUM = i2.STLNUM
    INNER JOIN BOM_HIE b ON m2.MATNR = b.COMPONENT
    WHERE 
        m2.WERKS = '1000' 
        AND i2.LKENZ = ' '
)
SELECT 
    LEVEL AS "BOM Level",
    PARENT AS "Parent Material",
    COMPONENT AS "Component Material",
    QTY AS "Accumulated Qty",
    UOM AS "UOM"
FROM 
    BOM_HIE;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL - Cú pháp Đệ quy)
Câu lệnh SQL đệ quy truy xuất cây cấu hình BoM từ cơ sở dữ liệu Odoo phục vụ kiểm tra hệ thống:

```sql
WITH RECURSIVE Odoo_BOM_CTE AS (
    -- Anchor Member: Cấp 1
    SELECT 
        1 AS level,
        pt_p.name AS parent_product,
        pt_c.name AS component_product,
        bl.product_qty AS quantity,
        bom.id AS bom_id,
        bl.product_id AS component_id
    FROM 
        mrp_bom bom
    INNER JOIN mrp_bom_line bl ON bom.id = bl.bom_id
    INNER JOIN product_template pt_p ON bom.product_tmpl_id = pt_p.id
    INNER JOIN product_product pp_c ON bl.product_id = pp_c.id
    INNER JOIN product_template pt_c ON pp_c.product_tmpl_id = pt_c.id
    WHERE 
        pt_p.name = 'Thành Phẩm Xe Đạp' -- Thay bằng tên sản phẩm của bạn
        AND bom.active = true
    
    UNION ALL
    
    -- Recursive Member: Tìm bán thành phẩm trung gian lắp ráp
    SELECT 
        ob.level + 1,
        pt_p2.name,
        pt_c2.name,
        ob.quantity * bl2.product_qty,
        bom2.id,
        bl2.product_id
    FROM 
        mrp_bom bom2
    INNER JOIN mrp_bom_line bl2 ON bom2.id = bl2.bom_id
    INNER JOIN product_template pt_p2 ON bom2.product_tmpl_id = pt_p2.id
    INNER JOIN product_product pp_c2 ON bl2.product_id = pp_c2.id
    INNER JOIN product_template pt_c2 ON pp_c2.product_tmpl_id = pt_c2.id
    INNER JOIN Odoo_BOM_CTE ob ON pp_c2.id = ob.component_id
    WHERE 
        bom2.active = true
)
SELECT 
    REPEAT('    ', level - 1) || component_product AS "Indented Component Name",
    level AS "BOM Level",
    parent_product AS "Parent Assembly",
    component_product AS "Component Name",
    quantity AS "Required Quantity"
FROM 
    Odoo_BOM_CTE;