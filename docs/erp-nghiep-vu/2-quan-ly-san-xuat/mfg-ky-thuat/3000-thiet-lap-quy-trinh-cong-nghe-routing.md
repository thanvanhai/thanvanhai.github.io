---
id: 3000-thiet-lap-quy-trinh-cong-nghe-routing
title: Thiết lập Quy trình công nghệ tổng thể (Routing Setup)
description: Thiết lập Quy trình công nghệ tổng thể (Routing Setup)
sidebar_label: Quy trình công nghệ (Routing)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/3000-thiet-lap-quy-trinh-cong-nghe-routing
sidebar_position: 3000
date: 2026-09-28
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, routing, operations, scheduling, sql]
---

# 3000 Thiết lập Quy trình công nghệ tổng thể (Routing Setup)

Quy trình công nghệ (Routing) định nghĩa chuỗi tuần tự các bước công đoạn (Operations) cần thiết để chế tạo ra một sản phẩm hoàn chỉnh. Mỗi bước công đoạn trong Routing xác định rõ: nội dung công việc cần làm, máy móc/trung tâm công việc thực hiện (`Work Center`), định mức thời gian chạy máy (`Run Time`) và thời gian chuẩn bị (`Setup Time`). Thiết lập Routing chính xác là nền tảng để hệ thống ERP lập lịch sản xuất chi tiết (WIP Scheduling) và phân bổ chi phí nhân công, khấu hao máy vào giá thành sản phẩm.

Bài viết này phân tích sâu kiến trúc dữ liệu Routing, luồng thiết lập và thuật toán lập lịch trình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu Routing được thiết kế theo cấu trúc Đầu mục - Dòng (Header - Lines). Trong đó, Header liên kết với sản phẩm cha, còn Lines lưu trữ chuỗi tuần tự các bước công đoạn và gán máy móc thực thi.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Routing độc lập hoàn toàn với BOM, liên kết thông qua mã sản phẩm cha. | **BOM và Routing gộp chung** thành cấu trúc MoM (Method of Manufacture). | Routing độc lập (Arbeitsplan). Cho phép quản lý nhiều phiên bản quy trình (Group). | Tích hợp trực tiếp các công đoạn sản xuất vào form cấu hình BOM. |
| **Bảng Header (Routing Header)** | `BOM_OPERATIONAL_ROUTINGS` (Mỗi sản phẩm có 1 Primary và nhiều Alternate Routings). | `Erp.PartRev` (Quy trình sản xuất gắn liền với phiên bản Revision của Part). | `saphanadb.PLKO` (Routing Header) và `saphanadb.MAPL` (Material to Routing Link). | `mrp.bom` (Quy trình công nghệ nằm trực tiếp trên BoM Header). |
| **Bảng Lines (Operations)** | `BOM_OPERATION_SEQUENCES` (Danh sách các công đoạn lắp ráp, gia công). | `Erp.PartOpr` (Danh sách công đoạn liên kết trực tiếp trên cây cấu trúc MoM). | `saphanadb.PLPO` (Chi tiết các công đoạn sản xuất và định mức thời gian). | `mrp.routing.workcenter` (Danh sách các công đoạn chạy trên Work Center). |
| **Liên kết Máy móc (Work Center)** | `BOM_OPERATION_SEQUENCES.DEPARTMENT_ID` (Liên kết sang phòng ban/tổ máy). | `PartOpr.ResourceGrpID` (Gán nhóm máy thực hiện công đoạn). | `PLPO.ARBID` (Trỏ tới ID của Work Center - bảng `CRHD`). | `mrp.routing.workcenter.workcenter_id` (Gán trực tiếp Work Center). |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Triết lý Routing độc lập)
Trong Oracle EBS, Routing là một đối tượng độc lập, được tạo riêng biệt tại phân hệ BOM:
1. **Bước 1 (Khởi tạo Header):** Người dùng truy cập `BOM > Routings > Routings`, chọn chi nhánh nhà máy (`Organization`) và nhập mã sản phẩm cha (ví dụ: `MOTORBIKE_X`).
2. **Bước 2 (Khai báo chuỗi công đoạn):** Tại bảng lưới bên dưới, người dùng nhập:
   - `Seq` (field DB: `operation_seq_num`): Nhập số thứ tự công đoạn (thường đặt bước nhảy là 10, 20, 30... để dễ chèn thêm công đoạn phát sinh sau này).
   - `Department` (field DB: `department_id`): Chọn tổ máy thực hiện (ví dụ: Tổ hàn `WELD_DEPT`).
   - `Description`: Nhập nội dung công việc (ví dụ: Hàn khung xe máy).
3. **Bước 3 (Gán Tài nguyên/Thời gian):** Chọn dòng công đoạn, bấm nút `Resources` để khai báo chi tiết số giờ máy chạy (`Run Time`) hoặc giờ nhân công.

### b. Hệ thống Epicor ERP (Triết lý Method of Manufacture - MoM)
Do Epicor gộp chung BOM và Routing, việc thiết lập công đoạn được thực hiện đồng thời với việc gán vật tư:
1. **Bước 1 (Check out sản phẩm):** Trong màn hình `Engineering Workbench`, người dùng "Check out" sản phẩm cha để mở quyền chỉnh sửa cây MoM.
2. **Bước 2 (Thêm công đoạn - Operation):** Trên cây thư mục bên trái, người dùng chuột phải vào mục `Operations`, chọn `Add Operation`.
3. **Bước 3 (Nhập thông số công đoạn):** 
   - `OprSeq` (field DB: `OprSeq`): Chỉ số thứ tự công đoạn (ví dụ: `10`, `20`).
   - `Op Code` (field DB: `OpCode`): Chọn mã công đoạn chuẩn từ danh mục (ví dụ: `WELD` - Hàn).
   - `Resource Group`: Chọn nhóm máy thực thi (ví dụ: `RG_WELD`).
   - Nhập định mức thời gian chuẩn bị máy (`Est Set Hours`) và năng suất chạy máy (`Prod Standard` - ví dụ: 0.5 giờ/sản phẩm).

### c. Hệ thống SAP S/4HANA (Triết lý Task List & Group Counter)
SAP quản lý quy trình công nghệ cực kỳ chặt chẽ thông qua khái niệm Group và Group Counter:
1. **Bước 1 (Mở giao diện tạo Routing):** Sử dụng T-Code `CA01`, nhập mã sản phẩm, nhà máy (`Plant`). Hệ thống tự động sinh ra một mã **`Group`** quản lý chung.
2. **Bước 2 (Khai báo Group Counter):** Định nghĩa phiên bản quy trình (ví dụ: Group Counter `01` cho quy trình sản xuất tiêu chuẩn, Group Counter `02` cho quy trình chạy máy dự phòng).
3. **Bước 3 (Nhập danh sách công đoạn):** Tại màn hình Operations, nhập số thứ tự công đoạn (`VORNR`), mã Work Center (`ARBPL`), mã kiểm soát (`Control Key` - ví dụ: chọn `PP01` để bắt buộc báo cáo sản lượng và tính giá thành), và mô tả công đoạn.

### d. Hệ thống Odoo ERP (Triết lý Tích hợp trực tiếp trên BoM Form)
Odoo tối giản hóa bằng cách đặt tab cấu hình công đoạn trực tiếp bên trong form định mức BoM:
1. **Bước 1 (Mở BoM):** Vào màn hình cấu hình BoM của sản phẩm, chuyển sang tab **`Operations`**.
2. **Bước 2 (Thêm công đoạn):** Bấm `Add a line`, nhập tên công đoạn (ví dụ: `Lắp ráp cụm động cơ`).
3. **Bước 3 (Gán máy móc & thời gian):**
   - `Work Center`: Chọn máy thực hiện (ví dụ: `Dây chuyền lắp ráp 02`).
   - `Duration Computation`: Chọn cách tính thời gian:
     - `Manual`: Nhập thủ công thời gian định mức (ví dụ: `25` phút).
     - `Compute based on real time`: Hệ thống tự động tính toán thời gian trung bình dựa trên lịch sử quẹt thẻ MES của các lệnh sản xuất thực tế trước đó.

---

## 3. Thuật toán Lập lịch trình Công nghệ (Routing Scheduling Logic)

Khi bộ lập lịch sản xuất (WIP Scheduler Engine) tính toán lịch trình chạy máy cho một Lệnh sản xuất, hệ thống sẽ duyệt qua từng công đoạn trong Routing theo thứ tự tuần tự từ dưới lên trên.

### Quy trình tính toán thời gian thực thi của một Công đoạn (Operation Duration):
$$\text{Duration of Op (Hours)} = \frac{\text{Setup Time}}{\text{Resource Count}} + \left( \frac{\text{Order Qty} \times \text{Run Time per Unit}}{\text{Efficiency Rate} \times \text{Resource Count}} \right) + \text{Queue Time} + \text{Move Time}$$

*Trong đó:*
- `Queue Time` (Thời gian đợi trước máy): Thời gian bán thành phẩm phải nằm chờ tại trạm trước khi được đưa vào máy để gia công.
- `Move Time` (Thời gian vận chuyển): Thời gian vận chuyển bán thành phẩm từ công đoạn trước sang công đoạn sau.

```text
Mô hình lập lịch tuần tự (Finish-to-Start):
[ Op 10: Cắt Phôi ] ──(Move Time: 1h)──► [ Op 20: Gia Công CNC ] ──(Queue Time: 0.5h)──► [ Op 30: Đóng Gói ]
```

> **Ý nghĩa thực tế:** Tổng chu kỳ sản xuất (Manufacturing Lead Time) của một lệnh sản xuất không chỉ là tổng thời gian máy chạy thực tế, mà là tổng hòa của cả thời gian chuẩn bị máy (Setup), thời gian xếp hàng chờ (Queue) và thời gian vận chuyển (Move) được cấu hình trên Routing.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Routing

### Bài toán 1: Thiết lập quy trình công nghệ thay thế (Alternate Routing) khi dây chuyền chính quá tải
*   **Thách thức:** Quy trình công nghệ tiêu chuẩn của sản phẩm đi qua máy đột dập CNC tự động (`Op 10` chạy trên máy `CNC_01`). Tuy nhiên, trong mùa cao điểm, máy `CNC_01` liên tục bị nghẽn (Bottleneck). Nhà máy muốn thiết lập một quy trình dự phòng đi qua tổ dập thủ công chạy bằng tay (`CNC_MANUAL`) để điều độ viên linh hoạt lựa chọn khi máy chính bị quá tải.
*   **Giải pháp thực tế:**
    - Trong **Oracle EBS**, tạo thêm một dòng Routing cho sản phẩm và cấu hình trường **`Alternate`** (ví dụ đặt tên Alternate là `BACKUP_MANUAL`). Tại công đoạn `Op 10` của Alternate Routing này, gán Department là tổ dập tay `CNC_MANUAL` với định mức thời gian chạy máy dài hơn. Khi tạo Lệnh sản xuất (WIP Job), điều độ viên có quyền lựa chọn sử dụng Primary Routing (mặc định) hoặc chọn hoán đổi sang Alternate Routing `BACKUP_MANUAL` để giải phóng nghẽn.
    - Trong **SAP S/4HANA**, sử dụng tính năng **`Alternative Sequences`** ngay trong cùng một Routing. Khi hệ thống lập lịch phát hiện máy chính bị quá tải, thuật toán lập lịch nâng cao (APS/DS) có thể tự động đề xuất chuyển đổi công đoạn sang chuỗi công đoạn thay thế.

### Bài toán 2: Xử lý bài toán "Gối đầu công đoạn" (Operation Overlap / Lead Time Offset)
*   **Thách thức:** Lệnh sản xuất yêu cầu dập **10.000 chi tiết** (`Op 10`) rồi chuyển sang công đoạn mạ kẽm (`Op 20`). Nếu chạy tuần tự (Finish-to-Start), `Op 20` phải đợi cho đến khi cả 10.000 chi tiết của `Op 10` dập xong hoàn toàn mới được bắt đầu, gây lãng phí thời gian chết. Thực tế, cứ dập xong **1.000 chi tiết**, nhà xưởng đã đóng thùng chuyển ngay sang tổ mạ kẽm để mạ gối đầu song song.
*   **Giải pháp thực tế:**
    - Cấu hình chỉ số **`Minimum Transfer Quantity` (Sản lượng chuyển giao tối thiểu)** trên dòng công đoạn của Routing là **`1.000`**.
    - Hoặc cấu hình trường **`Overlap Percentage`** (Phần trăm gối đầu - ví dụ: `80%`). Hệ thống lập lịch sẽ tự động tính toán lồng thời gian (Overlap): `Op 20` sẽ được phép bắt đầu chạy sớm khi `Op 10` mới chỉ hoàn thành được 20% sản lượng lô hàng, giúp rút ngắn tổng chu kỳ sản xuất của cả lệnh sản xuất đi từ 30% - 40%.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Quy trình công nghệ (Routing)

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách toàn bộ các bước công đoạn trong quy trình công nghệ (bao gồm cả quy trình chính và quy trình thay thế) của sản phẩm:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Assembly Item",
    msib.description AS "Assembly Description",
    -- Nếu NULL thì là quy trình chính (Primary), ngược lại là quy trình thay thế
    NVL(bor.alternate_routing_designator, 'PRIMARY') AS "Routing Type",
    bos.operation_seq_num AS "Op Seq",
    bd.department_code AS "Work Center / Dept Code",
    bos.operation_description AS "Operation Description",
    bos.effectivity_date AS "Effective From",
    bos.disable_date AS "Effective To"
FROM 
    apps.bom_operational_routings bor
INNER JOIN apps.bom_operation_sequences bos ON bor.routing_sequence_id = bos.routing_sequence_id
INNER JOIN apps.mtl_system_items_b msib ON bor.assembly_item_id = msib.inventory_item_id AND bor.organization_id = msib.organization_id
INNER JOIN apps.bom_departments bd ON bos.department_id = bd.department_id
INNER JOIN apps.org_organization_definitions ood ON bor.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    AND (bos.disable_date IS NULL OR bos.disable_date > SYSDATE) -- Chỉ lấy công đoạn còn hiệu lực
ORDER BY 
    msib.segment1, "Routing Type", bos.operation_seq_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các công đoạn sản xuất (`PartOpr`) và định mức thời gian chuẩn bị máy, thời gian chạy máy của từng sản phẩm trên Epicor:

```sql
SELECT 
    po.Company,
    po.PartNum AS [Parent Part],
    po.RevisionNum AS [Revision],
    po.OprSeq AS [Op Seq],
    po.OpCode AS [Operation Code],
    o.Description AS [Operation Description],
    po.ResourceGrpID AS [Resource Group / WC],
    po.EstSetHours AS [Est Setup Hours],         -- Thời gian chuẩn bị máy định mức (giờ)
    po.ProdStandard AS [Production Standard],    -- Năng suất định mức (ví dụ: số giờ/sản phẩm)
    po.StdFormat AS [Standard UOM]               -- Cách tính năng suất (ví dụ: HP - Hours/Piece)
FROM 
    Erp.PartOpr po
INNER JOIN 
    Erp.Op o ON po.Company = o.Company AND po.OpCode = o.OpCode
WHERE 
    po.Company = 'EP01'
ORDER BY 
    po.PartNum, po.RevisionNum, po.OprSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy xuất mối quan hệ liên kết giữa Vật tư (`MAPL`), Đầu mục quy trình (`PLKO`) và danh sách công đoạn sản xuất (`PLPO`) của SAP:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Material Code",
    h.PLNNR AS "Routing Group ID",
    h.PLNAL AS "Group Counter", -- Phiên bản quy trình
    o.VORNR AS "Operation Seq",
    o.LTXA1 AS "Operation Description",
    wc.ARBPL AS "Work Center Code",
    o.STEUS AS "Control Key",   -- Mã kiểm soát hạch toán/báo cáo
    o.VGE01 AS "Unit of Setup Time",
    o.VGW01 AS "Setup Time Standard"
FROM 
    saphanadb.MAPL m
INNER JOIN saphanadb.PLKO h ON m.PLNTY = h.PLNTY AND m.PLNNR = h.PLNNR
INNER JOIN saphanadb.PLPO o ON h.PLNNR = o.PLNNR AND h.PLNTY = o.PLNTY
LEFT JOIN saphanadb.CRHD wc ON o.ARBID = wc.OBJID -- Liên kết lấy mã Work Center
WHERE 
    m.WERKS = '1000'
    AND m.PLNTY = 'N' -- Lọc loại 'N' (Normal Routing)
    AND o.LOEKZ = ' '  -- Loại bỏ công đoạn đã bị xóa
ORDER BY 
    m.MATNR, h.PLNAL, o.VORNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách công đoạn sản xuất liên kết trực tiếp trên các cấu trúc định mức BoM của Odoo:

```sql
SELECT 
    pt.name AS "Product Name",
    bom.code AS "BoM Reference",
    rwc.sequence AS "Operation Sequence",
    rwc.name AS "Operation Name",
    wc.name AS "Assigned Work Center",
    rwc.time_cycle AS "Standard Duration (Mins)",
    -- Cách tính thời gian công đoạn (manual là nhập tay, compute là tính tự động)
    CASE rwc.time_mode
        WHEN 'manual' THEN 'Manual Entry'
        WHEN 'auto' THEN 'Computed from Real Time History'
    END AS "Duration Computation Mode"
FROM 
    mrp_routing_workcenter rwc
INNER JOIN mrp_bom bom ON rwc.bom_id = bom.id
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
LEFT JOIN mrp_workcenter wc ON rwc.workcenter_id = wc.id
WHERE 
    bom.active = true
ORDER BY 
    pt.name, rwc.sequence;