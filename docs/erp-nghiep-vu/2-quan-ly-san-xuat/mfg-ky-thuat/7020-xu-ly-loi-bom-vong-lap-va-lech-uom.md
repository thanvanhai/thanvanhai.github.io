---
id: 7020-xu-ly-loi-bom-vong-lap-va-lech-uom
title: Xử lý lỗi BOM vòng lặp và lệch đơn vị tính giữa BOM và Item Master (Circular BOM & UOM Mismatch Troubleshooting)
description: Hướng dẫn định vị và khắc phục hai sự cố kỹ thuật dữ liệu gốc nghiêm trọng nhất của hệ thống sản xuất gồm đệ quy vòng lặp BOM và lệch nhóm danh mục đơn vị tính (UOM).
sidebar_label: Sự cố BOM vòng lặp & Lệch UOM
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/7020-xu-ly-loi-bom-vong-lap-va-lech-uom
sidebar_position: 7020
date: 2026-11-28
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, circular-bom, uom-mismatch, troubleshooting, sql]
---

# 7020 - Sự cố BOM vòng lặp & Lệch UOM

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Sửa lỗi hệ thống (Technical Troubleshooting)** - cách chạy các câu lệnh SQL phát hiện vòng lặp đệ quy và đối soát sai biệt danh mục đơn vị tính (UOM) ở tầng dữ liệu gốc Master Data [2]. Đối với các sự cố phát sinh ngoài hiện trường dính liền với lỗi giao dịch thực tế (WIP Transaction Errors) hoặc lệnh sản xuất bị kẹt không đóng được do dở dang, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP).

---

Trong công tác quản trị dữ liệu hệ thống sản xuất, hai sự cố kỹ thuật dữ liệu gốc nghiêm trọng nhất thường xuyên làm sập tiến trình chạy MRP đêm hoặc làm tê liệt mẻ tính giá thành Standard Cost Rollup là: **BOM vòng lặp đệ quy (Circular BOM)** và **Lệch đơn vị tính (UOM Mismatch)** [2]. 

Sự cố BOM vòng lặp xảy ra khi hệ thống bị dẫn dụ vào một ma trận đệ quy không lối thoát (A chứa B, B chứa C, C lại chứa A), làm cạn kiệt bộ nhớ máy chủ (Stack Overflow) [2]. Sự cố lệch UOM xảy ra khi dòng BOM khai báo đơn vị thuộc nhóm đo lường hoàn toàn khác so với đơn vị gốc của vật tư (ví dụ: vật tư gốc quản lý theo cân `Kg`, nhưng dòng BOM lại khai báo theo thể tích `Lít` mà không có bảng quy đổi) [2]. Bài viết này phân tích sâu bản chất kỹ thuật, thuật toán truy quét tự động và phương án xử lý trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ so sánh cơ chế kiểm soát lỗi tự động (System Validation Checks)

Các hãng ERP thiết kế các tầng kiểm soát tự động tại cả cấp ứng dụng (Application Level - chặn khi lưu) và cấp cơ sở dữ liệu (Database Level - quét định kỳ) [2]:

| Thuộc tính lỗi | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Cơ chế chặn vòng lặp (BOM Loop Check)** | Tự động quét đệ quy khi người dùng nhấn `Save` trên form BOM. Chặn lưu và bắn mã lỗi `APP-BOM-20512`. | Thực hiện kiểm tra lỗi đệ quy (**Check for Circular References**) khi kỹ sư bấm phê duyệt MoM (`Approved`). | Tự động chặn và báo lỗi **`CS101`** (BOM is recursive) [2], trừ khi dòng BOM có tích chọn cờ cho phép đệ quy (`STPO-REKRI`). | Sử dụng hàm ràng buộc kiểm tra đệ quy bằng Python (`@api.constrains`) để chặn giao dịch lưu BoM. |
| **Cơ chế chặn lệch UOM (UOM Validate)** | Bắt buộc kiểm tra bảng quy đổi `MTL_UOM_CONVERSIONS` nếu đơn vị dòng BOM khác đơn vị gốc Item Master. | Bắt buộc kiểm tra bảng quy đổi `Erp.PartUOM`. Nếu thiếu tỷ lệ quy đổi, hệ thống chặn không cho Check-in MoM. | Kiểm tra xem đơn vị dòng BOM (`STPO-MEINS`) có thể quy đổi sang đơn vị gốc của vật tư (`MARA-MEINS`) qua bảng `T006`. | Bắt buộc đơn vị dòng BoM và đơn vị gốc của vật tư phải nằm chung một **Nhóm đo lường (UOM Category)** [2]. |

---

## 2. So sánh luồng vận hành xử lý sự cố (Inquiry & Troubleshooting)

### a. Hệ thống Oracle EBS (BOM Loop Check — Bảng: `BOM_BILL_OF_MATERIALS` / `BOM_INVENTORY_COMPONENTS`)
Oracle EBS ngăn ngừa lỗi vòng lặp ngay khi thiết kế:
1. **Bước 1 (Lỗi xuất hiện):** Khi kỹ sư vô tình tạo vòng lặp, hệ thống chặn đứng và hiển thị thông báo lỗi `APP-BOM-20512: Circular reference detected`.
2. **Bước 2 (Chạy chương trình truy quét):** Điều hành viên chạy chương trình concurrent tiêu chuẩn **`Loop Check`** cho toàn bộ nhà máy để quét tìm các vòng lặp dở dang chưa được phát hiện.
3. **Bước 3 (Sửa lệch UOM):** Nếu gặp lỗi lệch UOM, thủ kho truy cập màn hình `Inventory > Setup > Units of Measure > Conversions` để bổ sung dòng quy đổi (ví dụ: cấu hình quy đổi từ `Hộp` sang `Chiếc` cho mã hàng cụ thể).

### b. Hệ thống Epicor ERP (MOM Circular Reference Check — Bảng: `Erp.PartMtl` / `Erp.PartUOM`)
Epicor kiểm soát vòng đời sản phẩm thông qua Engineering Workbench:
1. **Bước 1 (Quét lỗi vòng lặp):** Trong `Engineering Workbench`, trước khi Check-in, kỹ sư chọn tính năng `Actions > Check for Circular References`. Hệ thống tự động phân rã cây MoM để tìm lỗi lặp. Nếu phát hiện lỗi, Epicor khóa cờ không cho phép duyệt `Approved = 1`.
2. **Bước 2 (Sửa lệch UOM):** Epicor yêu cầu đơn vị của dòng vật tư (`PartMtl.UOMCode`) phải khớp với đơn vị gốc (`Part.IUM`). Nếu dùng đơn vị thay thế, bắt buộc phải vào `Part Maintenance > UOM > Part UOM` để khai báo tỷ lệ quy đổi chính xác.

### c. Hệ thống SAP S/4HANA (Recursivity Check — Bảng: `MAST` / `STPO` / `T006` [2])
SAP quản lý rất chặt chẽ lỗi đệ quy để bảo vệ công cụ lập lịch MRP:
1. **Bước 1 (Trình kiểm tra đệ quy):** Khi tạo BOM (`CS01`), nếu có lỗi lặp, SAP hiển thị cảnh báo đỏ và chặn không cho lưu.
2. **Bước 2 (Cho phép đệ quy có kiểm soát):** Trong các ngành sản xuất liên tục (hóa chất, tái chế dung môi), sản phẩm phụ sau quy trình lại quay ngược lại làm nguyên liệu đầu vào (đệ quy thực tế). Để SAP cho phép lưu cấu trúc này, kỹ sư bắt buộc phải tích chọn cờ **`Recursive allowed`** (field DB: `STPO-REKRI`) [2] trên dòng BOM.
3. **Bước 3 (Sửa lệch UOM):** Đơn vị tính dòng BOM (`STPO-MEINS`) phải quy đổi được sang đơn vị gốc của vật tư (`MARA-MEINS`) thông qua bảng quy đổi hệ thống `T006`.

### d. Hệ thống Odoo ERP (Python BoM Constraints — Bảng: `mrp.bom` / `uom.uom`)
Odoo sử dụng các hàm kiểm tra logic tinh gọn trên mã nguồn:
1. **Bước 1 (Chặn lỗi đệ quy):** Khi kỹ sư cố tình lưu một BoM có vòng lặp, Odoo lập tức bắn thông báo lỗi: `User Error: BoM recursion detected. Please assist to resolve this loop`.
2. **Bước 2 (Chặn lệch UOM Category):** Trên dòng BoM Component, nếu người dùng chọn đơn vị thuộc nhóm đo lường khác (Ví dụ: Sản phẩm gốc quản lý theo khối lượng `Kg`, nhưng dòng BoM lại chọn đơn vị thuộc nhóm chiều dài `Mét`), Odoo lập tức chặn giao dịch lưu vì hai đơn vị này không thuộc chung một **UOM Category** (field DB: `category_id`), giúp loại bỏ hoàn toàn rủi ro sai lệch định lượng [2].

---

## 3. Thuật toán Truy quét & Phát hiện Sự cố tự động của Hệ thống

Khi hệ thống MRP chạy đêm bị treo hoặc kế toán báo cáo giá thành định mức bị khuyết tật giá trị, Chuyên viên phân tích hệ thống (BA) sẽ chạy các thuật toán quét chéo để định vị lỗi:

### Thuật toán 1: Quét đệ quy tìm điểm thắt nút vòng lặp (Circular Loop Detector)
Hệ thống sử dụng các câu lệnh truy vấn Common Table Expression (CTE) đệ quy để quét dọc toàn bộ cây BOM từ trên xuống dưới. Nếu một dòng vật tư con xuất hiện lại ở vị trí cha của chính nó ở cấp cao hơn, thuật toán lập tức đánh dấu lỗi và trả về đường đi của vòng lặp (BOM Loop Path).

### Thuật toán 2: Quét đối soát lệch nhóm danh mục đơn vị tính (UOM Category Mismatch)
Mỗi vật tư có một đơn vị tính gốc đại diện cho đại lượng vật lý của nó (Khối lượng, Thể tích, Chiều dài, Số đếm). Thuật toán thực hiện phép so sánh chéo:
$$\text{UOM Category of BOM Line} \neq \text{UOM Category of Item Master Base UOM}$$

Nếu phép so sánh trả về kết quả **Khác nhau**, hệ thống lập tức đánh dấu lỗi nghiêm trọng, vì không thể có công thức toán học nào quy đổi tự động từ `Kilogam` sang `Mét` mà không có cấu hình đặc thù.

---

## 4. Giải quyết các bài toán sự cố thực tế sàn sản xuất

### Bài toán 1: Khắc phục lỗi MRP đêm bị treo cứng do kỹ sư R&D thiết lập BOM vòng lặp
*   **Thực tế:** Sáng Thứ Hai, bộ phận Kế hoạch phát hiện tiến trình chạy MRP đêm của nhà máy bị treo cứng ở mức 45% tiến độ và tự động báo lỗi sập luồng (Thread Dump). Toàn bộ đề xuất mua hàng ngày hôm đó không được sinh ra. Nguyên nhân nghi ngờ do có kỹ sư mới tạo một BOM vòng lặp cho sản phẩm vừa cải tiến. Làm sao định vị nhanh mã sản phẩm lỗi này giữa 20.000 BOM đang hoạt động?
*   **Giải pháp thực tế:**
    - Chuyên viên hệ thống không thể mở từng BOM ra xem bằng mắt được.
    - Chạy câu lệnh SQL truy quét đệ quy (sử dụng cú pháp `CONNECT BY NOCYCLE` hoặc CTE đệ quy tùy hệ quản trị cơ sở dữ liệu) quét toàn bộ bảng định mức.
    - Chỉ sau 3 giây, câu lệnh SQL trả về kết quả lỗi chính xác:
      `Loop Path: BIKE_M_01 -> SUB_FRAME_01 -> SHEET_METAL_01 -> BIKE_M_01`.
    - Lỗi xuất hiện do kỹ sư khi nâng cấp thiết kế đã vô tình gán ngược mã xe máy thành phẩm `BIKE_M_01` làm nguyên liệu con dưới đáy của tấm thép `SHEET_METAL_01`. Sau khi định vị được mã hỏng, kỹ sư vào xóa dòng lỗi này, tiến trình MRP đêm lập tức chạy trơn tru bình thường.

### Bài toán 2: Xử lý lỗi lệch đơn vị tính khiến giá vốn thành phẩm bị phóng đại gấp 1.000 lần
*   **Thách thức:** Kế toán giá thành chạy tiến trình Cost Rollup cho sản phẩm Tủ điện chính và phát hiện giá thành định mức vọt lên mức vô lý: **1.200.000.000 VNĐ / chiếc** (trong khi giá thực tế chỉ khoảng 1.200.000 VNĐ). Làm sao định vị lỗi lệch UOM này?
*   **Giải pháp thực tế:**
    - Hệ thống chạy đối soát lệch UOM phát hiện lỗi ở dòng linh kiện ốc vít đặc thù.
    - Trên Item Master, ốc vít được quản lý đơn vị tính gốc là `PCS` (Chiếc) với giá standard mua ngoài là 1.000 VNĐ/chiếc.
    - Tuy nhiên, trên dòng BOM sản xuất, kỹ sư nhập liệu đã chọn nhầm đơn vị tính của dòng định mức là **`KPCS`** (Kilo-Pieces - nghìn chiếc) nhưng số lượng định mức lại nhập là `1` (với ý đồ là dùng 1 chiếc ốc).
    - Khi động cơ Cost Rollup hoạt động, nó tự động nhân: $1 \text{ KPCS} \times 1,000 \text{ VNĐ/chiếc} = 1,000 \text{ chiếc} \times 1,000 \text{ VNĐ} = 1,000,000 \text{ VNĐ}$ cho riêng 1 con ốc vít (gấp 1.000 lần chi phí thật).
    - Sau khi chạy câu lệnh đối soát lệch UOM, kế toán phát hiện dòng lệch này, sửa đơn giá dòng BOM về đúng đơn vị gốc `PCS` và định mức `1`, giá vốn sản phẩm lập tức quay về giá trị thực tế 1.200.000 VNĐ.

---

## 5. Các câu lệnh SQL truy quét và phát hiện sự cố dữ liệu gốc

### a. Trên hệ thống Oracle EBS (Sử dụng Connect By để quét lỗi BOM vòng lặp)
Câu lệnh SQL sử dụng từ khóa `NOCYCLE` và cờ kiểm tra `CONNECT_BY_ISCYCLE` của Oracle Database để truy quét toàn bộ cơ sở dữ liệu và hiển thị chính xác đường đi của vòng lặp đệ quy hỏng:

```sql
SELECT 
    bbm.assembly_item_id AS "Parent Item ID",
    msib_p.segment1 AS "Loop Parent Item Code",
    -- CONNECT_BY_ISCYCLE trả về 1 nếu dòng vật tư này là nguyên nhân gây ra vòng lặp
    CONNECT_BY_ISCYCLE AS "Is Loop Cause? (1=Yes)",
    -- Hiển thị chi tiết đường đi của vòng lặp đệ quy
    SYS_CONNECT_BY_PATH(msib_c.segment1, ' -> ') AS "BOM Loop Path"
FROM 
    apps.bom_inventory_components bic
INNER JOIN apps.bom_bill_of_materials bbm ON bic.bill_sequence_id = bbm.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
WHERE 
    -- Lọc riêng các dòng gây lỗi vòng lặp hệ thống
    CONNECT_BY_ISCYCLE = 1
CONNECT BY NOCYCLE PRIOR bic.component_item_id = bbm.assembly_item_id;
```

### b. Trên hệ thống Epicor ERP (SQL Server - Đối soát lệch UOM giữa BOM và Part Base UOM)
Truy vấn so sánh đơn vị tính khai báo trên dòng MoM (`PartMtl.UOMCode`) với đơn vị tính gốc lưu tại danh mục hàng hóa (`Part.IUM`), phát hiện các dòng lệch đơn vị tính chưa được khai báo tỷ lệ quy đổi trong bảng `PartUOM`:

```sql
SELECT 
    pm.Company,
    pm.PartNum AS [Parent Part Code],
    pm.MtlSeq AS [Material Sequence],
    pm.MtlPartNum AS [Component Part Code],
    pm.UOMCode AS [BOM Line UOM],          -- Đơn vị khai báo trên dòng định mức MoM
    p_comp.IUM AS [Component Base UOM],     -- Đơn vị gốc lưu trữ tại danh mục vật tư
    -- Kiểm tra xem đã có cấu hình quy đổi trong bảng PartUOM chưa
    CASE 
        WHEN pm.UOMCode <> p_comp.IUM AND NOT EXISTS (
            SELECT 1 FROM Erp.PartUOM pu 
            WHERE pu.Company = pm.Company 
              AND pu.PartNum = pm.MtlPartNum 
              AND pu.UOMCode = pm.UOMCode
        ) THEN 'CRITICAL ERROR: MISSING UOM CONVERSION RATE!'
        ELSE 'OK / CONVERTIBLE'
    END AS [UOM Alignment Status]
FROM 
    Erp.PartMtl pm
INNER JOIN 
    Erp.Part p_comp ON pm.Company = p_comp.Company AND pm.MtlPartNum = p_comp.PartNum
WHERE 
    pm.Company = 'EP01'
    -- Lọc ra các dòng BOM có đơn vị tính khác đơn vị gốc của vật tư
    AND pm.UOMCode <> p_comp.IUM
ORDER BY 
    [UOM Alignment Status] DESC, pm.PartNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL - Đối soát lệch UOM giữa BOM Line và Material Master Base UOM)
Truy vấn đối soát toàn bộ các dòng BOM thuộc bảng `STPO` có đơn vị tính khai báo khác với đơn vị tính cơ sở của vật tư con lưu tại bảng `MARA`:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material Code",
    i.POSNR AS "BOM Item Number",
    i.IDNRK AS "Component Material Code",
    i.MEINS AS "BOM Line UOM",        -- Đơn vị khai báo trên dòng BOM (STPO-MEINS)
    mara.MEINS AS "Material Base UOM" -- Đơn vị gốc của vật tư (MARA-MEINS)
FROM 
    saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
INNER JOIN saphanadb.MARA mara ON i.IDNRK = mara.MATNR
WHERE 
    m.WERKS = '1000'
    -- Lọc các dòng BOM có đơn vị tính khác đơn vị tính gốc của chính linh kiện đó
    AND i.MEINS <> mara.MEINS
    AND i.LKENZ = ' ' -- Loại bỏ các dòng đã xóa logic
ORDER BY 
    m.MATNR, i.POSNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL - Đối soát lệch nhóm danh mục UOM Category)
Trong Odoo, hệ thống chỉ quy đổi được các đơn vị thuộc cùng một nhóm đo lường (UOM Category) [2]. Câu lệnh dưới đây truy quét phát sinh lỗi nghiêm trọng: dòng BoM khai báo đơn vị thuộc nhóm đo lường hoàn toàn khác với nhóm đo lường gốc của vật tư con [2]:

```sql
SELECT 
    pt_parent.name AS "Parent Product Name",
    pt_comp.name AS "Component Product Name",
    uom_line.name AS "BoM Line UOM",
    cat_line.name AS "BoM Line UOM Category Name", -- Nhóm đo lường khai báo trên BoM Line
    uom_base.name AS "Component Base UOM",
    cat_base.name AS "Component Base UOM Category Name" -- Nhóm đo lường gốc của vật tư con
FROM 
    mrp_bom_line bl
INNER JOIN mrp_bom bom ON bl.bom_id = bom.id
INNER JOIN product_template pt_parent ON bom.product_tmpl_id = pt_parent.id
INNER JOIN product_product pp_comp ON bl.product_id = pp_comp.id
INNER JOIN product_template pt_comp ON pp_comp.product_tmpl_id = pt_comp.id
-- Liên kết giải mã đơn vị tính và nhóm đo lường của dòng BoM
INNER JOIN uom_uom uom_line ON bl.product_uom_id = uom_line.id
INNER JOIN uom_category cat_line ON uom_line.category_id = cat_line.id
-- Liên kết giải mã đơn vị tính gốc và nhóm đo lường gốc của vật tư con
INNER JOIN uom_uom uom_base ON pt_comp.uom_id = uom_base.id
INNER JOIN uom_category cat_base ON uom_base.category_id = cat_base.id
WHERE 
    bom.active = true
    -- Truy quét lỗi nghiêm trọng: nhóm đo lường của BoM Line khác hoàn toàn nhóm đo lường gốc của vật tư [2]
    AND uom_line.category_id <> pt_comp.uom_id
ORDER BY 
    pt_parent.name;
