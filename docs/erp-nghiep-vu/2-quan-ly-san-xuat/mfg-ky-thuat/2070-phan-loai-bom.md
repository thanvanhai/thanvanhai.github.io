---
id: 2070-phan-loai-bom
title: Phân loại BOM theo mục đích sử dụng (BOM Type - Manufacture / Kit / Subcontracting)
description: Phân loại BOM theo mục đích sử dụng (BOM Type - Manufacture / Kit / Subcontracting)
sidebar_label: Phân loại loại BOM
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2070-phan-loai-bom
sidebar_position: 2070
date: 2026-09-27
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, bom-type, kit, subcontracting, sql]
---

# 2070 Phân loại BOM theo mục đích sử dụng (BOM Type - Manufacture / Kit / Subcontracting)

Trong hệ thống ERP, cấu trúc định mức nguyên vật liệu (BOM) không chỉ có một hành vi duy nhất là phục vụ sản xuất tiêu chuẩn. Tùy thuộc vào mô hình vận hành và phương thức kinh doanh, một danh sách vật tư có thể được cấu hình thành các loại BOM khác nhau để điều khiển hệ thống thực thi theo các luồng nghiệp vụ hoàn toàn khác biệt: **BOM sản xuất tiêu chuẩn (Manufacture)**, **BOM bộ linh kiện lắp ráp nhanh (Kit)**, hoặc **BOM thuê ngoài gia công (Subcontracting)**. 

Nếu không phân loại chính xác loại BOM ngay từ bước thiết kế Master Data, hệ thống sẽ chạy sai lệch thuật toán tính toán nhu cầu vật tư (MRP) và làm tắc nghẽn luồng xử lý đơn hàng. Bài viết này phân tích sâu kiến trúc dữ liệu, thuật toán phân rã và cách quản lý các loại BOM trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu phân loại BOM của các hãng ERP được thiết kế để điều khiển hành vi của phân hệ Kho (Inventory) và phân hệ Bán hàng (Sales) khi xử lý mã sản phẩm cha:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Điều khiển qua tổ hợp thuộc tính lưu tại Item Master (`pick_components_flag`) và loại BOM (`assembly_type`). | Định nghĩa loại BOM thông qua thuộc tính của mã sản phẩm cha (`SalesKit`) và công đoạn thuê ngoài (`SubContract`). | Phân loại trực tiếp bằng trường mục đích sử dụng **BOM Usage** kết hợp mã loại nhóm vật tư (Item Category Group). | Phân loại trực tiếp bằng trường lựa chọn **BoM Type** nằm ngay tại Header của bảng định nghĩa BoM. |
| **Bảng định nghĩa chính (Header)** | `BOM_BILL_OF_MATERIALS` kết hợp bảng cấu hình thuộc tính hàng hóa `MTL_SYSTEM_ITEMS_B`. | Bảng danh mục sản phẩm gốc **`Erp.Part`** kết hợp bảng công đoạn Job **`Erp.PartOpr`**. | Bảng liên kết vật tư `saphanadb.MAST` và bảng cấu hình lưu kho `saphanadb.MARC`. | Bảng quản lý định mức sản phẩm chính **`mrp.bom`**. |
| **Trường phân loại loại BOM (Flag)** | - `pick_components_flag = 'Y'`: Kit bán hàng.<br/>- `wip_supply_type = 6`: Phantom (Kit sản xuất). | - `Part.SalesKit = True`: Kit bán hàng.<br/>- `PartOpr.SubContract = True`: Công đoạn thuê ngoài. | - `MAST.STLAN = 1`: Sản xuất/Thuê ngoài.<br/>- `MAST.STLAN = 5`: BOM bán hàng (Kit). | - `mrp.bom.type = 'normal'`: Sản xuất.<br/>- `mrp.bom.type = 'phantom'`: Kit.<br/>- `mrp.bom.type = 'subcontract'`: Gia công. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (BOM Types & Pick Components — Bảng: `BOM_BILL_OF_MATERIALS` / `MTL_SYSTEM_ITEMS_B`)
Oracle EBS chia hành vi BOM dựa trên việc cấu hình thuộc tính của mã cha tại phân hệ Kho trước khi tạo BOM:
1. **Loại 1 (Standard Manufacturing BOM - Sản xuất tiêu chuẩn):** Mã sản phẩm cha có thuộc tính `Pick Components = No`. Khi tạo BOM tại `BOM > Bills > Bills`, hệ thống lưu trữ với nhãn `assembly_type = 1`. Lập lịch sản xuất sẽ sinh ra Discrete Job để xưởng thực thi.
2. **Loại 2 (Sales Kit BOM - Bộ lắp ráp nhanh):** Tại Item Master, cấu hình mã sản phẩm cha có thuộc tính **`Pick Components = Yes`** (field DB: `pick_components_flag = 'Y'`) (thường gọi là PTO - Pick-to-Order). Khi tạo BOM cho mã này, khi nhân viên bán hàng tạo Sales Order, hệ thống không tạo lệnh sản xuất mà tự động rã thành các linh kiện con trên phiếu xuất kho để thủ kho nhặt hàng (Pick) giao cho khách.
3. **Loại 3 (Subcontracting BOM - Thuê ngoài gia công):** Khai báo như BOM sản xuất tiêu chuẩn, nhưng tại màn hình Routing, gán công đoạn chạy ngoài với Resource Type là `Outside Processing` (OSP) để hệ thống tự tạo yêu cầu mua dịch vụ gia công.

### b. Hệ thống Epicor ERP (Sales Kits & Subcontract Operations — Bảng: `Erp.Part` / `Erp.PartOpr`)
Epicor phân định rõ hành vi xuất bán thương mại và gia công cơ khí chế tạo:
1. **Loại 1 (Standard Manufacturing BOM):** Khai báo sản phẩm cha có thuộc tính `Part.TypeCode = 'M'` (Manufactured - Tự sản xuất). Thiết lập MoM đầy đủ vật tư và công đoạn chuẩn.
2. **Loại 2 (Sales Kit BOM):** Trong màn hình `Part Maintenance`, tích chọn cờ **`Sales Kit = True`** (field DB: `Part.SalesKit`) cho sản phẩm cha. Tại tab `Co-Parts / Kits`, gán danh sách linh kiện đi kèm. Khi tạo đơn hàng bán, hệ thống tự động bốc toàn bộ danh sách linh kiện này vào phiếu đóng gói giao hàng.
3. **Loại 3 (Subcontracting BOM):** Trên cây cấu trúc MoM của sản phẩm, tại dòng công đoạn gia công, người dùng tích chọn cờ **`Subcontract = True`** (field DB: `PartOpr.SubContract`) và chỉ định mã nhà thầu phụ mặc định. Khi chạy Job, hệ thống tự động sinh ra đề xuất Purchase Order gửi nguyên liệu đi thuê ngoài.

### c. Hệ thống SAP S/4HANA (BOM Usages & Item Category Group — Bảng: `MAST` / `MARC` / `STKO`)
SAP quản lý hành vi phân loại cực kỳ chặt chẽ thông qua sự phối hợp giữa BOM Usage và cấu hình bán hàng của vật tư:
1. **Loại 1 (Standard Manufacturing BOM):** Tạo BOM bằng T-Code `CS01` với **`BOM Usage = 1`** (Production). Hệ thống dùng BOM này để chạy MRP và dập Lệnh sản xuất (`PP01`).
2. **Loại 2 (Sales Kit BOM):** Tạo BOM bằng T-Code `CS01` với **`BOM Usage = 5`** (Sales & Distribution). Đồng thời, tại Material Master (View Sales 2), cấu hình trường **`Item Category Group`** (field DB: `MTPOS`) là **`LUMF`** (rã giá và rã tồn kho ở cấp linh kiện con) hoặc **`ERLA`** (giữ giá ở cấp cha, chỉ rã tồn kho ở cấp con).
3. **Loại 3 (Subcontracting BOM):** Tạo BOM Usage `1` bình thường. Khi bộ phận mua hàng tạo Purchase Order mua dịch vụ gia công ngoài, họ chọn **`Item Category = L`** (Subcontracting) cho dòng PO. Hệ thống SAP sẽ tự động tìm kiếm BOM Usage `1` của vật tư đó để hiển thị danh sách nguyên liệu cần gửi đi cho nhà thầu phụ.

### d. Hệ thống Odoo ERP (BoM Types — Bảng: `mrp.bom` / `mrp.bom.line`)
Odoo quản lý phân loại trực quan nhất bằng cách cho phép chọn trực tiếp loại hình hoạt động ngay trên Header của BoM:
1. **Loại 1 (Standard Manufacturing BOM):** Trên form BoM, tại trường `BoM Type`, chọn **`Manufacture this product`** (field DB: `type = 'normal'`). Hệ thống sẽ sinh ra Lệnh sản xuất (MO) khi dập lệnh.
2. **Loại 2 (Sales Kit BOM):** Trên form BoM, tại trường `BoM Type`, chọn **`Kit`** (field DB: `type = 'phantom'`). Khi bán sản phẩm này trên Sales Order, hệ thống không tạo MO mà tự động tạo phiếu giao hàng gồm các linh kiện lẻ bên dưới BoM Kit.
3. **Loại 3 (Subcontracting BOM):** Trên form BoM, tại trường `BoM Type`, chọn **`Subcontracting`** (field DB: `type = 'subcontract'`). Hệ thống hiển thị thêm một bảng lưới phụ **`Subcontractors`** để người dùng gán danh sách các nhà thầu phụ được phép gia công mã hàng này.

---

## 3. Thuật toán Vận hành & Phân rã theo từng Loại BOM

Động cơ xử lý giao dịch (Transaction Engine) của hệ thống áp dụng các thuật toán phân rã khác nhau cho từng loại BOM:

### Luồng 1: BOM sản xuất tiêu chuẩn (Standard Manufacturing)
*   **Hành vi:** Lệnh bán hàng $\rightarrow$ MRP $\rightarrow$ Lệnh sản xuất (MO/Job) $\rightarrow$ Cấp phát nguyên vật liệu thực tế $\rightarrow$ Báo cáo hoàn thành $\rightarrow$ Nhập kho thành phẩm.

### Luồng 2: BOM bộ linh kiện lắp ráp nhanh (Sales Kit)
*   **Hành vi:** Lệnh bán hàng (Sales Order) của sản phẩm cha $\rightarrow$ Hệ thống tự động phân rã dòng đơn hàng sang các linh kiện con ngay trên phiếu giao hàng (Delivery Order/Pack Slip) $\rightarrow$ Thủ kho nhặt linh kiện con đóng gói $\rightarrow$ Trừ kho trực tiếp các linh kiện con. Mã sản phẩm cha hoàn toàn không phát sinh giao dịch nhập kho hay tồn kho thực tế.

### Luồng 3: BOM thuê ngoài gia công (Subcontracting)
*   **Hành vi:** Nhu cầu sản phẩm cha $\rightarrow$ MRP tạo đề xuất Đơn mua hàng dịch vụ gia công (Subcontracting PO) $\rightarrow$ Hệ thống tự động phân rã BOM của sản phẩm cha để tạo phiếu xuất chuyển kho nguyên liệu sang **Kho nhà thầu phụ (Subcontractor Location)** $\rightarrow$ Nhà thầu phụ hoàn thành gia công $\rightarrow$ Nhập kho thành phẩm dở dang tại xưởng và trừ kho nguyên vật liệu tương ứng tại Kho nhà thầu phụ.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Phân loại BOM

### Bài toán 1: Đóng gói sản phẩm theo Bộ (Sales Kit Bundle) cho chương trình khuyến mãi
*   **Thách thức:** Doanh nghiệp chạy chương trình khuyến mãi Tết: bán một bộ sản phẩm "Hộp quà Tết" (`GIFT_BOX`) gồm có: 1 chai rượu vang, 1 hộp bánh quy, và 1 hộp sô-cô-la. Hệ thống kho không hề lưu kho sẵn bộ quà này, mà chỉ có sẵn hàng lẻ rượu, bánh, sô-cô-la. Doanh nghiệp muốn khi khách mua 1 bộ `GIFT_BOX`, hệ thống bán hàng tự nhận diện để trừ kho trực tiếp 1 chai rượu, 1 hộp bánh và 1 hộp sô-cô-la theo thời gian thực.
*   **Giải pháp thực tế:**
    - Tạo mã sản phẩm cha là `GIFT_BOX` với thuộc tính **`Sales Kit / Kit BOM`** (trong Odoo chọn BoM Type là `Kit`, trong Epicor tích `SalesKit = True`, trong SAP dùng BOM Usage `5` kết hợp Item Category `LUMF`).
    - Khai báo định mức nguyên liệu con bên dưới gồm: 1 rượu, 1 bánh, 1 sô-cô-la.
    - Khi nhân viên kinh doanh lên đơn bán 10 bộ `GIFT_BOX`, hệ thống tự động sinh ra phiếu giao hàng yêu cầu thủ kho nhặt đúng: 10 chai rượu, 10 hộp bánh và 10 hộp sô-cô-la mang đi giao cho khách, giải quyết triệt để bài toán đồng bộ tồn kho hàng lẻ và hàng bộ.

### Bài toán 2: Quản lý hao hụt vật tư khi thuê ngoài gia công cắt chấn kim loại tấm (Subcontracting)
*   **Thách thức:** Do xưởng đột dập quá tải, nhà máy gửi **10 cuộn thép tấm** sang nhà thầu phụ gia công ngoài để cắt dập thành **1.000 tấm vỏ tủ**. Khi chuyển thép đi, làm sao để hệ thống vừa quản lý được lượng thép đang nằm tại kho của nhà thầu phụ (không bị lẫn với kho của ta), vừa tự động trừ kho lượng thép này khi nhà thầu giao vỏ tủ về xưởng?
*   **Giải pháp thực tế:**
    - Cấu hình BOM của vỏ tủ điện dạng **Subcontracting BOM**.
    - Khi tạo Subcontracting PO mua dịch vụ cắt dập vỏ tủ, hệ thống tự động phân rã định mức thép cuộn. Người dùng chạy giao dịch chuyển kho nguyên liệu (Transfer Order / Transfer PO) chuyển 10 cuộn thép từ kho chính sang một kho ảo đại diện cho nhà thầu phụ gọi là **Subcontractor Location** (trong SAP gọi là kho `WIP at Subcontractor`, trong Odoo gọi là kho đối tác gia công). Thép lúc này vẫn thuộc tài sản của ta nhưng nằm ở vị trí của đối tác.
    - Khi nhà thầu phụ giao 1.000 tấm vỏ tủ về xưởng, kế toán làm thủ tục nhập kho vỏ tủ dập. Hệ thống ERP sẽ tự động chạy thuật toán trừ kho lượng thép mạ kẽm tương ứng ngay tại kho ảo của nhà thầu phụ, giúp kiểm soát chặt chẽ hao hụt và tồn kho vật tư gửi đi gia công ngoài.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Phân loại BOM

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách các mặt hàng được cấu hình là Sales Kit (Pick-to-Order) tại Item Master để kiểm tra tính thống nhất dữ liệu:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Item Code",
    msib.description AS "Description",
    -- Pick Components Flag = Y đại diện cho Sales Kit (PTO) trong Oracle EBS
    msib.pick_components_flag AS "Is Sales Kit? (Y/N)",
    msib.replenish_to_order_flag AS "Is ATO? (Y/N)",
    bbm.assembly_type AS "BOM Type Code" -- 1 = Manufacturing, 2 = Engineering
FROM 
    apps.mtl_system_items_b msib
LEFT JOIN apps.bom_bill_of_materials bbm ON msib.inventory_item_id = bbm.assembly_item_id AND msib.organization_id = bbm.organization_id
INNER JOIN apps.org_organization_definitions ood ON msib.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1'
    -- Lọc các mặt hàng có thuộc tính cấu hình là Kit bán hàng hoặc lắp ráp theo đơn
    AND (msib.pick_components_flag = 'Y' OR msib.replenish_to_order_flag = 'Y')
ORDER BY 
    msib.segment1;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách sản phẩm trong danh mục để kiểm tra xem mã nào đang được gán là Sales Kit thương mại hoặc có chứa công đoạn thuê ngoài gia công (Subcontract):

```sql
SELECT 
    p.Company,
    p.PartNum AS [Part Number],
    p.Description AS [Description],
    p.SalesKit AS [Is Sales Kit?],            -- 1 = True (Sales Kit thương mại)
    p.TypeCode AS [Part Type Code],           -- 'M' = Manufactured, 'P' = Purchased
    -- Đếm số công đoạn thuê ngoài gia công (Subcontract) cấu hình trên MoM của Part
    (SELECT COUNT(*) 
     FROM Erp.PartOpr po 
     WHERE po.Company = p.Company 
       AND po.PartNum = p.PartNum 
       AND po.SubContract = 1) AS [Subcontract Operations Count]
FROM 
    Erp.Part p
WHERE 
    p.Company = 'EP01'
    AND (p.SalesKit = 1 OR p.TypeCode = 'P')
ORDER BY 
    p.PartNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy xuất danh mục các BOM được phân loại theo mục đích sử dụng (BOM Usage `1` cho sản xuất/thuê ngoài, `5` cho bán hàng Kit) của SAP:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material",
    m.STLAN AS "BOM Usage Key",
    -- Giải mã mục đích sử dụng BOM của SAP
    CASE m.STLAN 
        WHEN '1' THEN 'Production / Subcontracting BOM' 
        WHEN '5' THEN 'Sales & Distribution BOM (Sales Kit)' 
        ELSE 'Other Purpose BOM' 
    END AS "BOM Purpose",
    m.STLAL AS "Alternative BOM"
FROM 
    saphanadb.MAST m
WHERE 
    m.WERKS = '1000'
    AND m.STLAN IN ('1', '5') -- Chỉ lọc BOM sản xuất và BOM bán hàng (Kit)
ORDER BY 
    m.MATNR, m.STLAN;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn phân loại toàn bộ danh sách BoM trong cơ sở dữ liệu Odoo để rà soát hành vi thực thi (Tự sản xuất, bán hàng Kit hay Thuê ngoài gia công):

```sql
SELECT 
    pt.name AS "Product Name Template",
    bom.code AS "BoM Reference Code",
    bom.type AS "BoM Type Key",
    -- Giải mã BoM Type của Odoo (normal, phantom, subcontract)
    CASE bom.type 
        WHEN 'normal' THEN 'Manufacture this product (Discrete Job)'
        WHEN 'phantom' THEN 'Kit BOM (Sales Bundle / Phantom)'
        WHEN 'subcontract' THEN 'Subcontracting BOM (Outside Processing)'
    END AS "BoM Operating Type",
    bom.product_qty AS "Base Qty"
FROM 
    mrp_bom bom
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
WHERE 
    bom.active = true
ORDER BY 
    bom.type, pt.name;
