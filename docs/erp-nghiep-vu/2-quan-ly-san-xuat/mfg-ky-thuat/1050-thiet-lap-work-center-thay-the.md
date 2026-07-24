---
id: 1050-thiet-lap-work-center-thay-the
title: Thiết lập Trung tâm công việc thay thế khi quá tải công suất
description: Thiết lập Trung tâm công việc thay thế khi quá tải công suất (Alternative Work Center)
sidebar_label: Thiết lập Work Center thay thế
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/1050-thiet-lap-work-center-thay-the
sidebar_position: 1050
date: 2026-09-10
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, alternative-work-center, aps, scheduling, sql]
---

# 1050 Thiết lập Trung tâm công việc thay thế khi quá tải công suất (Alternative Work Center)

Trong nhà xưởng, tình trạng quá tải cục bộ tại một số công đoạn (Bottleneck - Cổ chai) là rủi ro thường trực. Ví dụ: Máy cắt laser tốc độ cao chính (`CNC_01`) liên tục bị quá tải lệnh sản xuất, trong khi máy cắt cũ đời thấp hơn (`CNC_02`) đang rảnh rỗi. Để giải quyết bài toán này, hệ thống ERP cung cấp tính năng cấu hình **Trung tâm công việc thay thế (Alternative Work Center / Alternate Resource)**. 

Khi chạy công cụ lập lịch nâng cao (APS), nếu phát hiện máy chính bị quá tải và có nguy cơ trễ hạn giao hàng, hệ thống sẽ tự động chuyển hướng lệnh sản xuất sang máy thay thế dựa trên các thuật toán ràng buộc công suất. Bài viết này phân tích sâu kiến trúc dữ liệu, luồng thiết lập và thuật toán điều tiết tải trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu quản lý năng lực thay thế phản ánh rõ nét triết lý lập lịch của từng hệ thống:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Gán các tài nguyên thay thế trực tiếp vào từng dòng công đoạn của Quy trình (Routing). | Sử dụng phân hệ **Capability Scheduling** (Lập lịch theo năng lực) để hệ thống tự động chọn máy rảnh. | Khai báo chuỗi công đoạn dự phòng song song (**Alternative Sequence**) trên Routing. | Gán trực tiếp danh sách các Work Center thay thế đồng cấp trên Master Data của Work Center chính. |
| **Bảng định nghĩa liên kết (Mapping Table)** | **`BOM_SUBSTITUTE_RESOURCES`** (Ánh xạ các tài nguyên thay thế cho `BOM_OPERATION_RESOURCES`). | **`Erp.ResGroupCap`** (Bảng trung gian liên kết Resource Group với mã năng lực `Erp.Capability`)⚠️. | **`saphanadb.PLFL`** (Routing Sequences) liên kết với bảng operations `saphanadb.PLPO`. | Bảng quan hệ Many-to-Many **`mrp_workcenter_alternative_rel`** (Liên kết các WC thay thế). |
| **Mã máy thay thế (Alternate Resource)** | `substitute_resource_id` (Trỏ sang bảng danh mục máy `BOM_RESOURCES`). | `ResourceGrpID` / `ResourceID` (Các tài nguyên con có chung mã năng lực). | `PLPO.ARBID` (Mã Work Center thay thế nằm trong chuỗi công đoạn dự phòng). | `alternative_workcenter_id` (Trỏ sang bảng danh mục `mrp.workcenter`). |
| **Độ ưu tiên lựa chọn (Priority)** | Không quản lý cứng (Lập lịch ASCP tự động tính dựa trên thời gian hoàn thành sớm nhất). | Cấu hình tại trường **`Priority`** trên bảng liên kết `ResGroupCap`⚠️. | Quản lý thông qua thứ tự ưu tiên của Sequence hoặc thiết lập điều độ trong PP/DS. | Tự động lựa chọn theo thứ tự xếp lịch rảnh của máy nào trống trước trên lịch. |

> ⚠️ **Lưu ý về schema Epicor:** Tên bảng/trường Capability (`Erp.Capability`, `Erp.ResGroupCap`) trong bài này là tên mang tính minh họa cho khái niệm, chưa được xác minh 100% qua Epicor Data Dictionary chính thức. Trên thực tế triển khai, cấu hình Priority thường được gắn ở cấp **Resource riêng lẻ** (field `ResourcePriority` trên từng Resource trong Capability) chứ không nhất thiết ở cấp Resource Group như mô tả đơn giản hóa trong bảng trên. Trước khi dùng để đối chiếu production, nên tra cứu lại tên bảng/trường chính xác qua BAQ Designer hoặc Application Studio của phiên bản Epicor bạn đang chạy.

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình qua Alternate Resources — Bảng: `BOM_SUBSTITUTE_RESOURCES` / `BOM_OPERATION_RESOURCES`)
Oracle EBS quản lý thiết lập thay thế gắn chặt với từng công đoạn cụ thể trên Quy trình công nghệ:
1. **Bước 1 (Vào màn hình Resource của Routing):** Truy cập `BOM > Routings > Routings`, chọn công đoạn sản xuất, bấm nút `Resources`.
2. **Bước 2 (Mở form Substitute):** Chọn dòng máy chính, bấm nút **`Substitutes`** dưới chân form.
3. **Bước 3 (Khai báo máy thay thế):** Tại bảng lưới phụ, người dùng nhập:
   - `Resource` (field DB: `substitute_resource_id`): Mã máy thay thế (ví dụ: `LASER_OLD`).
   - `Runtime Scale Factor` (field DB: `runtime_factor`): Hệ số thay đổi thời gian chạy máy (ví dụ: máy cũ chậm hơn máy mới 1.5 lần, nhập hệ số `1.5` để hệ thống tự kéo dài thời gian lập lịch khi hoán đổi máy).

### b. Hệ thống Epicor ERP (Cấu hình qua Capability Scheduling — Bảng: `Erp.Capability` / `Erp.ResGroupCap`)
Epicor giải quyết bài toán cực kỳ thông minh bằng cách tách biệt tên máy vật lý khỏi quy trình sản xuất (MoM):
1. **Bước 1 (Định nghĩa năng lực - Capability):** Truy cập `Production Management > Job Manager > Setup > Capability`, tạo mã năng lực dập (ví dụ: `CAP_STAMP_100T`).
2. **Bước 2 (Gán máy vào năng lực & đặt độ ưu tiên):** Tại tab `Out of Box/Resource Groups`, người dùng gán các nhóm máy có thể dập được lực 100 tấn và đặt độ ưu tiên:
   - Nhóm máy dập tự động 1: `RG_STAMP_AUTO_01` (field DB: `Priority = 1` - Ưu tiên cao nhất).
   - Nhóm máy dập thủ công 2: `RG_STAMP_MANUAL` (field DB: `Priority = 2` - Dự phòng khi máy 1 bận).
3. **Bước 3 (Thiết lập trên MoM):** Khi viết quy trình sản xuất, thay vì chọn trực tiếp Resource Group, kỹ sư thiết kế chỉ chọn yêu cầu năng lực là `CAP_STAMP_100T` (field DB: `PartOpr.CapabilityID`).

### c. Hệ thống SAP S/4HANA (Cấu hình qua Alternative Sequence — Bảng: `PLFL` / `PLPO`)
SAP quản lý thay thế thông qua việc xây dựng một nhánh công đoạn phụ song song với quy trình chính:
1. **Bước 1 (Tạo chuỗi công đoạn phụ):** Trong màn hình sửa Routing (`CA02`), bấm vào tab `Sequences`, thêm mới một dòng chuỗi công đoạn.
2. **Bước 2 (Chọn loại Sequence):** 
   - `Sequence Type` (field DB: `FLGTY`): Chọn loại **`Alternative Sequence`** (Chuỗi thay thế).
   - `Branch Operation`: Chọn điểm bắt đầu tách nhánh quy trình (ví dụ: tách từ công đoạn `10`).
   - `Return Operation`: Chọn điểm quay lại quy trình chính (ví dụ: nhập `30` - quay lại tổ đóng gói).
3. **Bước 3 (Nhập công đoạn chạy trên máy dự phòng):** Chuyển sang màn hình nhập công đoạn của Sequence vừa tạo, người dùng khai báo công đoạn dập chạy trên máy dự phòng `CNC_02` (field DB: `PLPO.ARBID`).

### d. Hệ thống Odoo ERP (Cấu hình qua Alternative Work Center — Bảng: `mrp.workcenter`)
Odoo quản lý thay thế trực tiếp ngay trên danh mục thiết bị của nhà máy:
1. **Bước 1 (Mở form Work Center chính):** Truy cập `Manufacturing > Configuration > Work Centers`, mở máy chính (ví dụ: `Dây chuyền sơn tự động`).
2. **Bước 2 (Gán máy thay thế):** Tại trường **`Alternative Workcenters`** (field DB: `alternative_workcenter_ids`), bấm chọn các máy rảnh tương đương có thể làm thay (ví dụ: chọn `Tổ sơn thủ công 02`).
3. **Bước 3 (Vận hành tự động):** Khi chạy kế hoạch sản xuất, nếu máy chính bị nghẽn lịch, Odoo sẽ tự động chuyển hướng thời gian sấy/sơn sang máy phụ.

---

## 3. Thuật toán điều phối Lập lịch tự động chuyển đổi Tài nguyên (APS Logic)

Khi động cơ lập lịch nâng cao (APS Engine) chạy, hệ thống sẽ tự động tính toán thời gian trễ của lệnh sản xuất để quyết định có hoán đổi sang máy dự phòng hay không.

### Lưu đồ logic của APS Scheduler:
```text
        [ Bắt đầu lập lịch Lệnh sản xuất ]
                       │
                       ▼
         [ Kiểm tra Máy chính RẢNH? ] ───(YES)───► [ Xếp lịch lên Máy chính ]
                       │ (NO)
                       ▼
      [ Máy chính bị trễ hạn giao hàng? ] ───(NO)───► [ Xếp hàng đợi Máy chính ]
                       │ (YES)
                       ▼
      [ Kiểm tra Máy phụ có khả dụng? ] ───(NO)───► [ Giữ nguyên kế hoạch & Cảnh báo ]
                       │ (YES)
                       ▼
     [ Tính tổng thời gian trên Máy phụ: ]
   Duration_alt = Setup_alt + (Qty * Run_alt)
                       │
                       ▼
   [ Duration_alt < Thời gian trễ trên Máy chính? ] ──(NO)─► [ Giữ nguyên Máy chính ]
                       │ (YES)
                       ▼
   [ Hoán đổi sang Máy phụ & Cập nhật hạch toán ]
```

> **Ý nghĩa thực tế:** Việc chuyển đổi sang máy dự phòng không phải lúc nào cũng mang lại hiệu quả tốt hơn. Máy dự phòng thường có hiệu suất thấp hơn và tốn nhiều thời gian setup hơn. Thuật toán APS thông minh chỉ thực hiện hoán đổi khi tổng thời gian thực hiện trên máy phụ (bao gồm cả hao hụt hiệu suất) ngắn hơn thời gian chờ đợi máy chính được giải phóng.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Work Center thay thế

### Bài toán 1: Tự động hóa phân bổ máy dập linh hoạt dựa trên độ rộng phôi dập (Epicor Capability Pricing)
*   **Thực tế:** Nhà máy có 3 máy dập khác nhau: Máy dập CNC 50T, Máy dập CNC 100T và Máy dập CNC 150T. Khi dập sản phẩm có chiều rộng tôn dưới 50mm, cả 3 máy đều dập được. Nhưng dập sản phẩm rộng 120mm thì chỉ có máy 150T dập được. Làm thế nào để điều độ viên không phải chọn máy thủ công cho từng lệnh sản xuất?
*   **Giải pháp thực tế trên Epicor:**
    - Định nghĩa một năng lực là `CAP_METAL_STAMPING`. Gán cả 3 máy dập vào năng lực này.
    - Đối với từng máy, cấu hình thông số giới hạn vật lý (UD fields) trên bảng liên kết: máy 50T giới hạn `Max_Width = 50`, máy 150T giới hạn `Max_Width = 150`.
    - Khi tạo Job cho sản phẩm dập rộng 120mm, hệ thống kiểm tra thuộc tính chiều rộng sản phẩm trên bản vẽ và tự động loại bỏ máy 50T, máy 100T ra khỏi danh sách tài nguyên khả dụng của Capability `CAP_METAL_STAMPING`. Hệ thống chỉ cho phép lập lịch xếp lệnh này trực tiếp lên máy dập 150T.

### Bài toán 2: Xử lý sai lệch đơn giá hoạt động khi chuyển đổi máy tự động sang máy thủ công
*   **Thách thức:** Khi chạy máy CNC tự động (`CNC_01`), chi phí khấu hao máy cao nhưng tốn ít nhân công. Khi chuyển sang máy dập thủ công dự phòng (`MANUAL_01`), chi phí khấu hao máy thấp nhưng chi phí nhân công tăng gấp 3 lần. Làm thế nào để kế toán tính đúng giá thành thực tế khi lệnh sản xuất bị hoán đổi máy?
*   **Giải pháp thực tế:**
    - Trong **SAP S/4HANA**, khi chuỗi công đoạn thay thế (Alternative Sequence) được kích hoạt trên Lệnh sản xuất thực tế, hệ thống sẽ tự động hủy liên kết đơn giá của máy chính `CNC_01` và nạp toàn bộ danh mục Activity Types mới của máy phụ `MANUAL_01` vào Lệnh sản xuất.
    - Kế toán giá thành khi chạy tiến trình tổng hợp chi phí thực tế cuối tháng sẽ ghi nhận chính xác chi phí nhân công tăng thêm và chi phí khấu hao giảm đi của riêng Lệnh sản xuất đó, đảm bảo không bị sai lệch giá thành thực tế.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Work Center thay thế

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách tất cả các tài nguyên thay thế (Substitute Resources) được cấu hình cho các công đoạn trên Quy trình công nghệ của sản phẩm:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Assembly Item",
    msib.description AS "Assembly Description",
    bos.operation_seq_num AS "Op Seq",
    br_primary.resource_code AS "Primary Resource",
    br_sub.resource_code AS "Alternative Resource",
    -- Hệ số kéo dài thời gian chạy máy khi sử dụng máy thay thế
    bsr.runtime_factor AS "Runtime Scale Factor",
    DECODE(bsr.basis_type, 1, 'Item', 2, 'Lot') AS "Basis Type"
FROM 
    apps.bom_substitute_resources bsr
INNER JOIN apps.bom_operation_resources bor ON bsr.resource_id = bor.resource_id AND bsr.operation_sequence_id = bor.operation_sequence_id
INNER JOIN apps.bom_operation_sequences bos ON bor.operation_sequence_id = bos.operation_sequence_id
INNER JOIN apps.bom_operational_routings bor_route ON bos.routing_sequence_id = bor_route.routing_sequence_id
INNER JOIN apps.mtl_system_items_b msib ON bor_route.assembly_item_id = msib.inventory_item_id AND bor_route.organization_id = msib.organization_id
INNER JOIN apps.bom_resources br_primary ON bor.resource_id = br_primary.resource_id
INNER JOIN apps.bom_resources br_sub ON bsr.substitute_resource_id = br_sub.resource_id
INNER JOIN apps.org_organization_definitions ood ON bor_route.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
ORDER BY 
    msib.segment1, bos.operation_seq_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn mối liên kết giữa danh mục Năng lực (`Erp.Capability`) và các nhóm máy thay thế đồng cấp (`Erp.ResourceGroup`) kèm theo độ ưu tiên tuyển chọn máy của Epicor:

> ⚠️ **Lưu ý:** Tên bảng `Erp.ResGroupCap` / `Erp.Capability` và các trường bên dưới mang tính minh họa khái niệm, chưa được xác minh chính thức qua Data Dictionary. Vui lòng đối chiếu lại qua BAQ Designer/Application Studio trên phiên bản Epicor thực tế của bạn trước khi dùng.

```sql
SELECT 
    rgc.Company,
    rgc.CapabilityID AS [Capability Code],
    cap.Description AS [Capability Description],
    rgc.ResourceGrpID AS [Alternative Work Center ID],
    rg.Description AS [Alternative Work Center Name],
    -- Độ ưu tiên chọn máy khi lập lịch (1 là ưu tiên cao nhất, sau đó đến 2, 3...)
    rgc.Priority AS [Selection Priority Key],
    rg.DailyProdQty AS [Daily Capacity Limit]
FROM 
    Erp.ResGroupCap rgc
INNER JOIN 
    Erp.Capability cap ON rgc.Company = cap.Company AND rgc.CapabilityID = cap.CapabilityID
INNER JOIN 
    Erp.ResourceGroup rg ON rgc.Company = rg.Company AND rgc.ResourceGrpID = rg.ResourceGrpID
WHERE 
    rgc.Company = 'EP01'
ORDER BY 
    rgc.CapabilityID, rgc.Priority;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn các chuỗi công đoạn thay thế (Alternative Sequences) định nghĩa dự phòng cho sản phẩm trên hệ thống SAP S/4HANA:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material",
    h.PLNNR AS "Routing Group ID",
    h.PLNAL AS "Group Counter",
    f.PLNFL AS "Alternative Sequence Code",
    f.LTXA1 AS "Sequence Description",
    o.VORNR AS "Alternative Operation Seq",
    o.LTXA1 AS "Operation Description",
    wc.ARBPL AS "Alternative Work Center Code"
FROM 
    saphanadb.MAPL m
INNER JOIN saphanadb.PLKO h ON m.PLNTY = h.PLNTY AND m.PLNNR = h.PLNNR
-- Liên kết sang bảng Sequence để lọc riêng các chuỗi thay thế (Sequence Type FLGTY = 'A')
INNER JOIN saphanadb.PLFL f ON h.PLNNR = f.PLNNR AND h.PLNTY = f.PLNTY 
-- QUAN TRỌNG: phải khớp thêm theo PLNFL (Sequence number), nếu không sẽ lấy lẫn operation của TẤT CẢ các sequence khác trong cùng routing group
INNER JOIN saphanadb.PLPO o ON f.PLNNR = o.PLNNR AND f.PLNTY = o.PLNTY AND f.PLNFL = o.PLNFL
LEFT JOIN saphanadb.CRHD wc ON o.ARBID = wc.OBJID
WHERE 
    m.WERKS = '1000'
    AND f.FLGTY = 'A' -- Lọc loại 'A' (Alternative Sequence)
    AND o.LOEKZ = ' '  -- Loại bỏ công đoạn đã bị xóa
ORDER BY 
    m.MATNR, f.PLNFL, o.VORNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh mục thiết bị chính và các máy móc thay thế dự phòng được gán đồng cấp từ cơ sở dữ liệu Odoo:

```sql
SELECT 
    wc_primary.code AS "Primary WC Code",
    wc_primary.name AS "Primary Work Center Name",
    wc_alt.code AS "Alternative WC Code",
    wc_alt.name AS "Alternative Work Center Name"
FROM 
    mrp_workcenter_alternative_rel rel
INNER JOIN 
    mrp_workcenter wc_primary ON rel.mrp_workcenter_id = wc_primary.id
INNER JOIN 
    mrp_workcenter wc_alt ON rel.alternative_workcenter_id = wc_alt.id
WHERE 
    wc_primary.active = true
ORDER BY 
    wc_primary.code, wc_alt.code;
