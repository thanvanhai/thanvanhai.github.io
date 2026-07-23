---
id: 2030-thieth-lap-vat-tu-thay-the
title: Thiết lập Vật tư thay thế (Substitute / Alternative Material)
sidebar_label: 2030 - Vật tư thay thế trong BOM
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2030-thiet-lap-vat-tu-thay-the
date: 2026-09-21
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, substitute, alternative, mrp, sql]
---

# Thiết lập Vật tư thay thế (Substitute / Alternative Material)

Đứt gãy chuỗi cung ứng hoặc chậm trễ giao hàng từ nhà cung cấp là những rủi ro thường trực trên sàn sản xuất. Để đảm bảo dây chuyền hoạt động liên tục, kỹ sư thiết kế thường định nghĩa sẵn các **Vật tư thay thế (Substitute / Alternative Materials)** cho sản phẩm. 

Nếu không cấu hình các mối quan hệ thay thế này vào hệ thống, MRP sẽ liên tục đưa ra cảnh báo thiếu hàng cho mã chính dù trong kho vẫn còn đầy mã thay thế tương đương. Bài viết này phân tích sâu kiến trúc dữ liệu, thuật toán tính toán nhu cầu của MRP và luồng cấu hình vật tư thay thế trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Trong thiết kế hệ thống ERP, các hãng chia vật tư thay thế thành hai nhóm chính:
- **Substitute (Thay thế tình thế):** Gán trực tiếp trên dòng BOM của một sản phẩm cụ thể (Ví dụ: Chỉ đối với xe đạp mẫu X mới được dùng xích B thay cho xích A).
- **Alternative (Thay thế đồng cấp/toàn cục):** Định nghĩa ở cấp danh mục sản phẩm (Ví dụ: Cáp sạc của hãng Y có thể thay thế toàn cục cho cáp sạc hãng X ở mọi BOM trong hệ thống).

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Quản lý thay thế trực tiếp trên dòng BOM cụ thể (Substitute). | Hỗ trợ khai báo thay thế toàn cục (Alternate) và thay thế cụ thể trên Job. | Quản lý mạnh mẽ qua mô hình **Nhóm thay thế (Alternative Item Group)** trên dòng BOM. | Định nghĩa liên kết thay thế thông qua danh mục sản phẩm tương thích (Alternative Products). |
| **Bảng định nghĩa chính (Substitute Link)** | **`BOM_SUBSTITUTE_COMPONENTS`** (Liên kết trực tiếp sang `BOM_INVENTORY_COMPONENTS`). | **`Erp.PartAlt`** (Bảng lưu trữ danh mục vật tư thay thế toàn cục của Part). | Ghi nhận trực tiếp trên các cột thuộc bảng **`saphanadb.STPO`** (BOM Item details). | Bảng quan hệ **`product_alternative_rel `** (Liên kết sản phẩm thay thế). |
| **Thứ tự ưu tiên / Tỷ lệ (Priority / %)** | Xác định gián tiếp qua thuộc tính hoặc tùy biến thứ tự kiểm tra kho. | Quản lý thông qua thuộc tính thiết lập trên Job hoặc thứ tự định nghĩa của PartAlt. | Quản lý bằng cột **`ALFPR`** (Độ ưu tiên) và **`EWAHR`** (Tỷ lệ phân bổ % nhu cầu) trên `STPO`. | Xác định thủ công khi thủ kho tiến hành đổi mã vật tư trên Lệnh sản xuất. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Thiết lập Substitute trên form BOM)
Oracle EBS cho phép khai báo nhanh danh sách vật tư thay thế ngay tại màn hình thiết lập BOM:
1. **Bước 1 (Chọn dòng vật tư chính):** Truy cập `BOM > Bills > Bills`, tìm sản phẩm cha và chọn dòng vật tư chính (ví dụ: Chíp chính `IC_A`).
2. **Bước 2 (Mở form Substitute):** Bấm nút **`Substitutes`** ở phía dưới màn hình.
3. **Bước 3 (Nhập mã thay thế):** Hệ thống hiển thị một bảng lưới phụ. Người dùng nhập mã vật tư thay thế (ví dụ: `IC_B`) và định lượng thay thế tương đương tại cột `Quantity` (ví dụ: 1 chíp A thay bằng 1 chíp B).

### b. Hệ thống Epicor ERP (Triết lý Part Alternate toàn cục)
Epicor hỗ trợ định nghĩa mối quan hệ thay thế từ gốc danh mục sản phẩm để tự động áp dụng cho mọi MoM:
1. **Bước 1 (Vào danh mục Part):** Truy cập `Production Management > Inventory Management > Setup > Part`.
2. **Bước 2 (Khai báo Alternate):** Tại tab `Alternate`, thêm mới một dòng và nhập mã sản phẩm thay thế (ví dụ: gán `PART_B` làm sản phẩm thay thế cho `PART_A`).
3. **Bước 3 (Vận hành):** Khi lập lịch hoặc chạy MRP, nếu `PART_A` bị thiếu hụt, hệ thống sẽ tự động hiển thị gợi ý hoán đổi sang `PART_B`.

### c. Hệ thống SAP S/4HANA (Triết lý Nhóm thay thế - Alternative Item Group)
SAP sở hữu cơ chế quản lý vật tư thay thế cực kỳ tinh vi thông qua phân nhóm trên dòng BOM:
1. **Bước 1 (Nhập mã nhóm):** Dùng T-Code `CS02` (Sửa BOM), tại dòng vật tư chính `MAT_A` và dòng vật tư phụ `MAT_B`, người dùng nhập cùng một ký tự vào cột **`AltItemGroup`** (ví dụ: nhập `Group_01`).
2. **Bước 2 (Cấu hình trọng số ưu tiên):** Bấm đúp vào dòng vật tư để cấu hình chi tiết:
   - **`Priority`**: Chọn độ ưu tiên (ví dụ: `MAT_A` đặt Priority = `1`, `MAT_B` đặt Priority = `2`).
   - **`Strategy`**: Chọn cách thức hoán đổi (ví dụ: chọn chiến lược `1` - tự động kiểm tra kho theo thứ tự ưu tiên).
   - **`Usage Probability`**: Nhập tỷ lệ sử dụng mong muốn (ví dụ: mặc định chạy `70%` cho A và `30%` cho B).

### d. Hệ thống Odoo ERP (Triết lý Thay thế thủ công trên MO)
Odoo tiếp cận đơn giản bằng cách gợi ý hoán đổi trực tiếp khi vận hành:
1. **Bước 1 (Cấu hình trên Product):** Vào form sản phẩm chính, tại tab `Sales/General`, thêm các sản phẩm tương thích vào mục `Alternative Products`.
2. **Bước 2 (Hoán đổi trên Lệnh sản xuất):** Khi tạo Lệnh sản xuất (MO), nếu hệ thống báo dòng vật tư chính hết hàng (màu đỏ), công nhân bấm nút chỉnh sửa để hoán đổi nhanh sang mã thay thế có sẵn trong kho dựa trên danh sách gợi ý.

---

## 3. Thuật toán Lập kế hoạch MRP đối với Vật tư thay thế

Khi chạy MRP, hệ thống xử lý tính toán nhu cầu vật tư thay thế theo hai chiến lược cốt lõi:

### Chiến lược 1: Phân bổ theo tỷ lệ xác suất (Usage Probability Split)
Thường áp dụng trong sản xuất liên tục khi nhà máy chủ động mua cả 2 mã nguyên liệu để san sẻ rủi ro nhà cung cấp.

$$\text{Nhu cầu mua hàng mã chính } A = \text{Tổng nhu cầu} \times \text{Tỷ lệ phân bổ } A (\%) $$

$$\text{Nhu cầu mua hàng mã thay thế } B = \text{Tổng nhu cầu} \times \text{Tỷ lệ phân bổ } B (\%) $$

*Ví dụ:* Nhà máy cần dệt vải, định mức cần 1.000 tấn sợi cotton. Kế sư cấu hình Sợi cotton của nhà cung cấp A chiếm 70%, nhà cung cấp B (thế thân) chiếm 30%. MRP tự động sinh ra 2 đề xuất mua hàng độc lập: 700 tấn cho A và 300 tấn cho B.

### Chiến lược 2: Dọn sạch kho mã chính rồi mới chuyển sang mã phụ (First-Exhausted-Then-Substitute)
Áp dụng trong bài toán dọn kho dứt điểm mã cũ trước khi nâng cấp lên mã mới.

$$\text{Nhu cầu bổ sung mã thay thế } B = \text{Tổng nhu cầu Lệnh sản xuất} - \text{Tồn kho khả dụng thực tế của mã chính } A$$

*Ví dụ:* Lệnh sản xuất yêu cầu **100 chiếc** đinh ốc loại `SCREW_A`. 
- Tồn kho khả dụng của `SCREW_A` trong kho hiện tại chỉ còn **40 chiếc**.
- Hệ thống tự động bốc toàn bộ 40 chiếc `SCREW_A` này vào Lệnh sản xuất.
- Đối với 60 chiếc còn thiếu, MRP sẽ tự động quét danh mục thay thế và tạo đề xuất cấp phát (hoặc mua hàng) cho **60 chiếc** đinh ốc loại phụ `SCREW_B`.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Vật tư thay thế

### Bài toán 1: Thiết lập chuỗi thay thế liên hoàn khi dọn sạch kho cũ (Run-out / Phase-out planning)
*   **Thách thức:** Nhà máy chuẩn bị ngừng sử dụng linh kiện cũ `PART_V1` để chuyển hẳn sang `PART_V2`. Tuy nhiên, phòng Kế toán yêu cầu phải sử dụng hết sạch lượng tồn kho của `PART_V1` đang có trong kho để tránh lãng phí vốn. Làm sao để MRP tự động tính toán điểm chuyển giao mượt mà này?
*   **Giải pháp thực tế:**
    - Trên **SAP S/4HANA**, cấu hình tính năng **`Discontinuation Group`** tại Material Master (View MRP 4). Ta khai báo mã `PART_V1` là mã bị ngưng (`Discontinued`) và chỉ định mã thay thế kế thừa là `PART_V2` kèm theo ngày bắt đầu chuyển giao (`Effective Date`).
    - Khi chạy MRP, hệ thống sẽ liên tục đối chiếu lượng tồn kho giảm dần của `PART_V1`. Tại thời điểm tồn kho của `PART_V1` chạm mức `0`, mọi nhu cầu phát sinh tiếp theo của các Lệnh sản xuất sẽ được MRP tự động hướng sang cho mã `PART_V2`.

### Bài toán 2: Sai biệt đơn vị tính (UOM) và Tỷ lệ quy đổi khi dùng vật tư thay thế
*   **Thách thức:** Khi sử dụng mã thay thế, không phải lúc nào tỷ lệ hoán đổi cũng là 1-1. Ví dụ: khi hết Keo hãng A (đóng gói dạng Hộp lớn - UOM: `Box`), nhà máy dùng Keo hãng B để thế thân (đóng gói dạng Tuýp nhỏ - UOM: `Tube`). Định mức yêu cầu dùng **1 Hộp keo A** tương đương với **12 Tuýp keo B**. Làm thế nào để hệ thống trừ kho chính xác?
*   **Giải pháp thực tế:**
    - Trong màn hình cấu hình Substitute của **Oracle EBS**, tại dòng khai báo mã thay thế `KEO_B` dưới mã chính `KEO_A`, người dùng nhập hệ số **`Usage Rate = 12`** (thay vì mặc định là 1).
    - Khi công nhân chọn hoán đổi sang Keo B trên Lệnh sản xuất, hệ thống sẽ lấy số lượng yêu cầu của Keo A nhân với hệ số quy đổi `12` để tự động tính toán nhu cầu xuất kho thực tế của Keo B là 12 Tuýp, tránh tình trạng trừ thiếu vật tư gây hụt chất lượng sản phẩm.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Vật tư thay thế

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách tất cả các vật tư thay thế (Substitute Components) được thiết lập trên từng dòng định mức BOM của các sản phẩm:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_p.segment1 AS "Parent Item",
    msib_p.description AS "Parent Description",
    msib_c1.segment1 AS "Primary Component",
    bic.component_quantity AS "Primary Qty per Assembly",
    msib_c2.segment1 AS "Substitute Component",
    bsc.substitute_item_quantity AS "Substitute Qty per Assembly",
    ROUND((bsc.substitute_item_quantity / bic.component_quantity), 2) AS "Conversion Rate"
FROM  apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.bom_substitute_components bsc ON bic.component_sequence_id = bsc.component_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c1 ON bic.component_item_id = msib_c1.inventory_item_id AND bbm.organization_id = msib_c1.organization_id
INNER JOIN apps.mtl_system_items_b msib_c2 ON bsc.substitute_item_id = msib_c2.inventory_item_id AND bbm.organization_id = msib_c2.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
ORDER BY 
    msib_p.segment1, msib_c1.segment1;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh mục sản phẩm thay thế toàn cục (Part Alternates) cấu hình từ phân hệ danh mục vật tư của Epicor:

```sql
SELECT 
    pa.Company,
    pa.PartNum AS [Primary Part Code],
    p_primary.Description AS [Primary Description],
    pa.AltPartNum AS [Alternate Part Code],
    p_alt.Description AS [Alternate Description],
    -- Loại thay thế (ví dụ: thay thế tương đương, nâng cấp...)
    CASE pa.AltType 
        WHEN 'S' THEN 'Substitution'
        WHEN 'U' THEN 'Upgrade'
        ELSE pa.AltType 
    END AS [Alternate Type]
FROM  Erp.PartAlt pa
INNER JOIN  Erp.Part p_primary ON pa.Company = p_primary.Company AND pa.PartNum = p_primary.PartNum
INNER JOIN  Erp.Part p_alt ON pa.Company = p_alt.Company AND pa.AltPartNum = p_alt.PartNum
WHERE pa.Company = 'EP01'
ORDER BY 
    pa.PartNum, pa.AltPartNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy xuất cấu hình Nhóm thay thế (Alternative Item Group) từ bảng BOM Line của SAP để kiểm tra độ ưu tiên (`ALFPR`) và tỷ lệ phần trăm phân bổ nhu cầu MRP (`EWAHR`):

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material",
    i.POSNR AS "BOM Item Number",
    i.IDNRK AS "Component Material",
    i.ALFGR AS "Alternative Item Group",  -- Mã nhóm thay thế
    i.ALFPR AS "Priority",                -- Độ ưu tiên (1, 2, 3...)
    i.EWAHR AS "Usage Probability (%)",   -- Tỷ lệ phân bổ nhu cầu khi chạy MRP
    -- Chiến lược hoán đổi (Strategy)
    CASE i.ALFST 
        WHEN '1' THEN 'Manual selection'
        WHEN '2' THEN '100% check / Auto-swap'
        ELSE i.ALFST 
    END AS "Substitution Strategy"
FROM  saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
WHERE m.WERKS = '1000'
    AND i.ALFGR <> ' ' -- Chỉ lọc các dòng BOM có cấu hình nhóm thay thế
    AND i.LKENZ = ' '
ORDER BY 
    m.MATNR, i.ALFGR, i.ALFPR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách các liên kết sản phẩm tương thích/thay thế được thiết lập trong cơ sở dữ liệu Odoo:

```sql
SELECT 
    pt.name AS "Primary Product Template",
    pt_alt.name AS "Alternative Product Template"
FROM product_alternative_rel rel
INNER JOIN product_template pt ON rel.src_id = pt.id
INNER JOIN product_template pt_alt ON rel.dest_id = pt_alt.id
ORDER BY 
    pt.name, pt_alt.name;