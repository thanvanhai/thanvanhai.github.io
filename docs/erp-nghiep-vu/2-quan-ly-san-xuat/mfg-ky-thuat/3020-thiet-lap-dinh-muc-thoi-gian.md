---
id: 3020-thiet-lap-dinh-muc-thoi-gian
title: "Thiết lập Định mức thời gian theo từng công đoạn: Setup, Run, Transit & Wait time"
description: "Thiết lập Định mức thời gian theo từng công đoạn: Setup, Run, Transit & Wait time"
sidebar_label: Thiết lập Định mức thời gian
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/3020-thiet-lap-dinh-muc-thoi-gian
sidebar_position: 3020
date: 2026-10-04
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, routing, routing-times, sql]
---

# 3020 Thiết lập Định mức thời gian theo từng công đoạn: Setup, Run, Transit & Wait time

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập các thông số thời gian định mức tiêu chuẩn (Standard Planning Times)** trên Routing phục vụ cho tính giá thành kế hoạch và lập lịch sản xuất [2]. Đối với quy trình ghi nhận giờ công lao động trực tiếp và giờ máy chạy thực tế tại xưởng (Labor & Machine Hour Logging), vui lòng tham khảo bài viết **`[3020 (Thực thi) - Ghi nhận giờ công lao động trực tiếp và thời gian máy chạy (Labor & Machine Hour Logging)]`** *(Liên kết sẽ được cập nhật sau khi hoàn thành phân hệ Thực thi sản xuất)* [2].

---

Tổng chu kỳ sản xuất (Manufacturing Lead Time) của một sản phẩm không chỉ được quyết định bởi thời gian máy chạy gia công thực tế. Trong thực tế vận hành xưởng, dòng chảy của bán thành phẩm đi qua quy trình công nghệ bị tác động bởi 4 loại thời gian chuẩn (Time Buckets): **Setup Time (Chuẩn bị máy)**, **Run Time (Gia công)**, **Wait Time (Chờ nguội/Chờ khô)**, và **Transit/Move Time (Vận chuyển)** [2].

Nếu thiết lập thiếu các loại thời gian phụ trợ này, hệ thống ERP sẽ tính toán thời điểm bắt đầu lệnh sản xuất quá muộn, gây ra tình trạng chậm trễ tiến độ giao hàng trên chuỗi cung ứng. Bài viết này phân tích sâu kiến trúc dữ liệu thời gian, luồng thiết lập và thuật toán quy đổi năng lực trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc cơ sở dữ liệu của các hãng ERP lưu trữ 4 nhóm thời gian này tại cấp độ dòng công đoạn như sau:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Định nghĩa thời gian qua các bảng chỉ số gán kèm cho Tài nguyên của công đoạn. | Lưu trực tiếp các tham số thời gian dạng số thập phân ngay trên dòng công đoạn MoM. | Quản lý qua hệ thống **Standard Values (Định mức chuẩn)** liên kết mã công đoạn `PLPO`. | Định nghĩa tối giản gồm thời gian chuẩn bị máy, thời gian chạy và dọn dẹp máy. |
| **Bảng dòng dữ liệu (Table)** | `BOM_OPERATION_RESOURCES` và `BOM_OPERATION_SEQUENCES` [2]. | **`Erp.PartOpr`** (Bảng quản lý chi tiết công đoạn sản xuất) [2]. | **`saphanadb.PLPO`** (Routing Operation / Operation details) [2]. | **`mrp.routing.workcenter`** (Công đoạn gán với BoM) [2]. |
| **Thời gian chuẩn bị (Setup Time)** | `usage_rate_or_amount` (Với loại `usage_rate_or_amount_type = 1` - Lot). | **`EstSetHours`** (Estimated Setup Hours - Số giờ gá đặt cố định). | **`VGW01`** (Được liên kết qua mã Standard Value Key của Work Center) [2]. | **`time_start`** (Setup Time - Số phút chuẩn bị máy trước khi chạy) [2]. |
| **Thời gian gia công (Run Time)** | `usage_rate_or_amount` (Với loại `usage_rate_or_amount_type = 2` - Item). | **`ProdStandard`** (Sản lượng định mức, tính theo giờ/sản phẩm). | **`VGW02`** (Định mức thời gian máy chạy thực tế trên đơn vị sản phẩm) [2]. | **`time_cycle`** (Manual Duration - Số phút chạy máy cho 1 sản phẩm) [2]. |
| **Thời gian xếp hàng (Queue Time)** | Không có cột cố định trên Operation (Thường dùng hệ số trễ của Resource). | **`QueueHours`** (Thời gian nằm chờ xếp hàng trước khi đưa vào máy). | **`WARTE`** (Queue Time - Khoảng thời gian chờ xếp hàng của trạm máy) [2]. | Không hỗ trợ mặc định (Thường gộp chung vào thời gian chuẩn bị). |
| **Thời gian vận chuyển (Transit/Move)** | `minimum_delay` (Hệ số trễ dịch chuyển công đoạn vật lý). | **`MoveHours`** (Thời gian di chuyển bán thành phẩm sang công đoạn sau). | **`TRAZE`** (Transit Time - Khoảng thời gian vận chuyển nội bộ giữa các trạm) [2]. | Không hỗ trợ mặc định (Thường sử dụng tính năng tuyến đường - Lead time of Routes). |
| **Thời gian chờ nguội (Wait Time)** | `BOM_OPERATION_SEQUENCES` (Cấu hình gián tiếp qua thời gian chuyển giao). | Không có cột riêng (Thường cấu hình gộp vào MoveHours hoặc Setup của công đoạn sau). | **`LIEGE`** (Wait Time - Thời gian chờ hóa học bắt buộc sau khi gia công) [2]. | **`time_stop`** (Cleanup/Wait Time - Số phút dọn dẹp máy hoặc chờ nguội) [2]. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình qua Resource Usage — Bảng: `BOM_OPERATION_RESOURCES` / `BOM_OPERATION_SEQUENCES`)
Oracle EBS chia định mức thời gian chạy máy dựa trên phương thức hạch toán của Tài nguyên:
1. **Bước 1 (Chọn công đoạn):** Truy cập `BOM > Routings > Routings`, chọn công đoạn sản xuất, bấm nút `Resources`.
2. **Bước 2 (Thiết lập Setup Time):** Thêm một dòng Resource (ví dụ: máy dập `STAMP`), chọn:
   - `Basis` (field DB: `usage_rate_or_amount_type`): Chọn **`Lot`** (Hệ thống hiểu đây là thời gian chuẩn bị máy, cố định cho cả lô sản xuất).
   - `Value` (field DB: `usage_rate_or_amount`): Nhập số giờ gá đặt (ví dụ: `0.5` giờ).
3. **Bước 3 (Thiết lập Run Time):** Thêm tiếp dòng Resource, chọn:
   - `Basis`: Chọn **`Item`** (Hệ thống hiểu thời gian này nhân tuyến tính theo số lượng sản phẩm).
   - `Value`: Nhập thời gian dập cho 1 chi tiết (ví dụ: `0.02` giờ/sản phẩm).

### b. Hệ thống Epicor ERP (Cấu hình trực tiếp trên PartOpr — Bảng: `Erp.PartOpr`)
Epicor hiển thị trực quan toàn bộ các tham số thời gian ngay trên form cấu hình của công đoạn:
1. **Bước 1 (Nhập thời gian chuẩn bị):** Trong `Engineering Workbench > Operations`, tại tab `Detail`, người dùng nhập:
   - `Est. Setup Hours` (field DB: `EstSetHours`): Nhập thời gian gá đặt máy (ví dụ: `1.5` giờ).
2. **Bước 2 (Nhập định mức gia công):**
   - `Prod Standard` (field DB: `ProdStandard`): Nhập năng suất (ví dụ: `100`).
   - `Std Format` (field DB: `StdFormat`): Chọn cách tính năng suất (ví dụ: chọn `PH` - Pieces/Hour - hệ thống tự hiểu năng suất máy là dập được 100 sản phẩm/giờ).
3. **Bước 3 (Nhập thời gian chờ & vận chuyển):**
   - `Queue Hours` (field DB: `QueueHours`): Nhập thời gian chờ trước máy dập (ví dụ: `2` giờ).
   - `Move Hours` (field DB: `MoveHours`): Nhập thời gian chuyển thùng hàng dập sang tổ hàn (ví dụ: `0.5` giờ).

### c. Hệ thống SAP S/4HANA (Cấu hình qua Standard Values — Bảng: `saphanadb.PLPO`)
SAP quản lý thời gian cực kỳ chặt chẽ thông qua việc liên kết các ô nhập liệu của công đoạn với Standard Value Key của Work Center:
1. **Bước 1 (Mở màn hình công đoạn):** Trong T-Code `CA02` (Sửa Routing), chọn dòng công đoạn và mở chi tiết. Giao diện hiển thị các ô nhập liệu thuộc mục **`Standard Values`** [2].
2. **Bước 2 (Nhập Setup & Machine time):**
   - Ô `Setup` (field DB: `VGW01`): Nhập thời gian chuẩn bị gá máy (ví dụ: `30` phút).
   - Ô `Machine` (field DB: `VGW02`): Nhập thời gian máy chạy dập phôi (ví dụ: `2` phút/đơn vị).
3. **Bước 3 (Nhập thông số vận chuyển - Interoperation Times):**
   - Ô `Queue time` (field DB: `WARTE`): Nhập thời gian nằm chờ trước trạm máy [2].
   - Ô `Move time` (field DB: `TRAZE`): Nhập thời gian chuyển giao xe đẩy hàng sang công đoạn sau [2].
   - Ô `Wait time` (field DB: `LIEGE`): Nhập thời gian chờ nguội, chờ sơn khô bắt buộc của sản phẩm [2].

### d. Hệ thống Odoo ERP (Cấu hình Tối giản — Bảng: `mrp.routing.workcenter`)
Odoo tối giản hóa bằng việc thiết kế 3 tham số thời gian ngay trên form cấu hình Operation của BoM:
1. **Bước 1 (Mở form Operation):** Vào tab `Operations` trên BoM, mở chi tiết dòng công đoạn [2].
2. **Bước 2 (Thiết lập thời gian chuẩn bị & dọn dẹp):**
   - `Setup Time` (field DB: `time_start`): Nhập số phút chuẩn bị máy (ví dụ: `15` phút) [2].
   - `Cleanup Time` (field DB: `time_stop`): Nhập số phút dọn dẹp khuôn máy hoặc thời gian chờ nguội tự nhiên của máy (ví dụ: `10` phút) [2].
3. **Bước 3 (Thiết lập thời gian chạy):**
   - `Manual Duration` (field DB: `time_cycle`): Nhập số phút chạy máy thực tế để hoàn thành 1 sản phẩm [2].

---

## 3. Thuật toán quy đổi Năng lực & Lập kế hoạch chi tiết (APS Scheduling Mechanics)

Công cụ lập lịch sản xuất nâng cao (APS Engine) sử dụng 4 tham số thời gian này để tính toán thời điểm bắt đầu (Start Time) và kết thúc (End Time) của từng công đoạn trên trục thời gian thực tế của nhà máy.

### Công thức tính toán tổng thời gian của một công đoạn (WIP Job Operation Lead Time):
$$\text{Total Operation Time} = \text{Queue Time} + \text{Setup Time} + \left( \frac{\text{Order Qty} \times \text{Run Time}}{\text{Resource Count} \times \text{Efficiency Rate}} \right) + \text{Wait Time} + \text{Move Time}$$

### Kịch bản tính toán thực tế:
Lệnh sản xuất yêu cầu dập **500 chi tiết sắt vỏ tủ điện** đi qua Tổ dập.
Thông số định mức thời gian cấu hình trên Routing:
- `Queue Time` (Chờ xếp hàng): **1 giờ** (60 phút).
- `Setup Time` (Chuẩn bị máy): **0.5 giờ** (30 phút).
- `Run Time` (Thời gian dập): **0.02 giờ / sản phẩm** (1.2 phút).
- `Wait Time` (Chờ nguội/Xử lý hóa học sau dập): **1.5 giờ** (90 phút).
- `Move Time` (Vận chuyển sang tổ sơn): **0.5 giờ** (30 phút).
- Xưởng dập có **1 máy chạy dập** (`Resource Count = 1`), hiệu suất hoạt động máy = **90%** (`0.90`).

**Hệ thống lập lịch APS tính toán tổng thời gian chiếm dụng tài nguyên và Lead Time:**
1. Thời gian dập máy thực tế sau khi nhân hệ số hiệu suất:
   $$\text{Run Time thực tế} = \frac{500 \text{ sản phẩm} \times 0.02 \text{ giờ/sản phẩm}}{1 \text{ máy} \times 0.90} \approx 11.11 \text{ giờ}$$
2. Tổng thời gian chiếm dụng máy dập (Setup + Run) để tính toán độ tải máy dập:
   $$\text{Thời gian chiếm dụng máy} = 0.5 \text{ giờ} + 11.11 \text{ giờ} = 11.61 \text{ giờ}$$
3. Tổng chu kỳ thời gian vật lý (Lead Time) kể từ lúc phôi thép được đưa vào tổ dập cho đến khi xếp hàng tại tổ sơn:
   $$\text{Total Operation Time} = 1 \text{ giờ (Queue)} + 0.5 \text{ giờ (Setup)} + 11.11 \text{ giờ (Run)} + 1.5 \text{ giờ (Wait)} + 0.5 \text{ giờ (Move)} \approx 14.61 \text{ giờ}$$

> **Ý nghĩa thực tế:** Khi chạy MRP tính toán thời điểm bắt đầu dập vỏ tủ để kịp giao hàng, hệ thống tự động lùi ngược thời gian bắt đầu chạy máy về trước **14.61 giờ**, đảm bảo tính toán thời gian chờ đợi vật lý giữa các tổ được khớp 100% với năng lực vận hành của xưởng.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Định mức thời gian

### Bài toán 1: Quản lý thời gian chờ hóa học bắt buộc (Ủ nhiệt, Sơn khô, Làm nguội)
*   **Thách thức:** Trong quy trình tôi luyện thép, chi tiết sau khi ra khỏi lò nung ở nhiệt độ 800 độ C bắt buộc phải nằm chờ ở khu vực làm nguội tự nhiên trong **3 giờ** (`Wait Time`) trước khi được phép đưa sang tổ dập tiếp theo. Làm sao cấu hình hệ thống để máy dập tiếp theo không xếp lịch chạy máy ngay khi lò nung vừa tắt, và nhân công không phải làm thủ công lệnh chờ trên giấy?
*   **Giải pháp thực tế:**
    - Cấu hình trường **`Wait Time / Liegezeit`** trên công đoạn tôi luyện thép của Routing là **`3.00`** giờ (trong SAP sử dụng trường `LIEGE` trên `PLPO`, trong Odoo sử dụng trường `time_stop` trên `mrp.routing.workcenter`) [2].
    - Khi chạy máy sản xuất, công cụ APS tự động tạo một block thời gian trống dài 3 tiếng ngay sau khi công đoạn tôi luyện hoàn thành. Hệ thống sẽ khóa và không cho phép xếp bất kỳ một lệnh chạy máy nào đối với lô hàng đó tại tổ dập trong suốt 3 tiếng này, đảm bảo chất lượng kỹ thuật của sản phẩm.

### Bài toán 2: Chênh lệch đơn giá chi phí nhân công chuẩn bị máy (Setup Labor) và chi phí dập sản xuất (Run Labor)
*   **Thách thức:** Công việc chuẩn bị căn chỉnh gá lắp khuôn máy dập đòi hỏi kỹ sư cơ khí bậc cao thực hiện (đơn giá giờ công cao: 150.000 VNĐ/giờ). Nhưng khi máy dập đã chạy tự động ổn định, công việc trông máy dập chỉ cần công nhân bậc thấp thực hiện (đơn giá giờ công thấp: 45.000 VNĐ/giờ). Làm sao để hệ thống hạch toán chính xác chi phí nhân công khi Lệnh sản xuất dập chạy xong?
*   **Giải pháp thực tế:**
    - Trên **Oracle EBS** và **SAP S/4HANA**, hệ thống cho phép phân tách dòng Resource:
      - Resource 1: Gán mã hoạt động `Setup Labor`, gán đơn giá nhân công bậc cao, chọn Basis là `Lot` (Cố định).
      - Resource 2: Gán mã hoạt động `Run Labor`, gán đơn giá nhân công bậc thấp, chọn Basis là `Item` (Biến đổi).
    - Khi đóng lệnh sản xuất, hệ thống sẽ lấy thời gian chuẩn bị máy thực tế nhân với đơn giá 150.000 VNĐ, cộng với thời gian chạy máy thực tế nhân với đơn giá 45.000 VNĐ để trích xuất chính xác chi phí nhân công trực tiếp (Direct Labor Cost) cấu thành nên giá thành vỏ tủ điện dập.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Định mức thời gian

### a. Trên hệ thống Oracle EBS (PL/SQL)
Kiểm tra chi tiết định mức thời gian chuẩn bị máy (Setup) và gia công sản xuất (Run) của các tài nguyên được cấu hình trên Quy trình công nghệ của sản phẩm:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Assembly Item",
    bos.operation_seq_num AS "Op Seq",
    br.resource_code AS "Resource Code",
    br.description AS "Resource Description",
    bor.usage_rate_or_amount AS "Rate / Hours",
    -- Giải mã Basis Type (1: Setup per Lot, 2: Run per Item)
    DECODE(bor.usage_rate_or_amount_type, 
           1, 'Standard Setup (per Lot)', 
           2, 'Standard Run (per Item)') AS "Time Basis Type"
FROM 
    apps.bom_operation_resources bor
INNER JOIN apps.bom_operation_sequences bos ON bor.operation_sequence_id = bos.operation_sequence_id
INNER JOIN apps.bom_operational_routings bor_route ON bos.routing_sequence_id = bor_route.routing_sequence_id
INNER JOIN apps.mtl_system_items_b msib ON bor_route.assembly_item_id = msib.inventory_item_id AND bor_route.organization_id = msib.organization_id
INNER JOIN apps.bom_resources br ON bor.resource_id = br.resource_id
INNER JOIN apps.org_organization_definitions ood ON bor_route.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
ORDER BY 
    msib.segment1, bos.operation_seq_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn toàn bộ các tham số thời gian (Setup, Run, Queue, Move) cấu hình trên các công đoạn sản xuất (`PartOpr`) của Epicor:

```sql
SELECT 
    po.Company,
    po.PartNum AS [Part Number],
    po.RevisionNum AS [Revision ID],
    po.OprSeq AS [Op Seq],
    po.EstSetHours AS [Setup Hours (Fixed)],         -- Thời gian chuẩn bị máy (giờ)
    po.ProdStandard AS [Run Rate (Variable)],        -- Định mức sản lượng gia công
    po.StdFormat AS [Rate UOM Code],                 -- Đơn vị tính (ví dụ: HP - Hours/Piece)
    po.QueueHours AS [Queue Hours (Wait Before)],    -- Thời gian chờ xếp hàng trước máy (giờ)
    po.MoveHours AS [Move Hours (Transit After)]     -- Thời gian di chuyển sang tổ sau (giờ)
FROM 
    Erp.PartOpr po
WHERE 
    po.Company = 'EP01'
ORDER BY 
    po.PartNum, po.OprSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn các tham số định mức chuẩn (Standard Values) và thông số thời gian chuyển giao công đoạn (Queue, Move, Wait) lưu trong bảng `PLPO` của SAP:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Material Code",
    o.VORNR AS "Operation Seq",
    wc.ARBPL AS "Work Center Code",
    o.VGW01 AS "Standard Setup Time",              -- Định mức Setup (lưu theo khóa Standard Value)
    o.VGW02 AS "Standard Machine Run Time",          -- Định mức Machine Run
    o.WARTE AS "Queue Time (Wartezeit)",             -- Thời gian chờ trước máy
    o.TRAZE AS "Transit Time (Transportzeit)",       -- Thời gian vận chuyển
    o.LIEGE AS "Wait Time (Liegezeit)"               -- Thời gian chờ hóa học sau gia công
FROM 
    saphanadb.MAPL m
INNER JOIN saphanadb.PLKO h ON m.PLNTY = h.PLNTY AND m.PLNNR = h.PLNNR
INNER JOIN saphanadb.PLPO o ON h.PLNNR = o.PLNNR AND h.PLNTY = o.PLNTY
LEFT JOIN saphanadb.CRHD wc ON o.ARBID = wc.OBJID -- Liên kết lấy mã Work Center
WHERE 
    m.WERKS = '1000'
    AND o.LOEKZ = ' ' -- Loại bỏ công đoạn đã xóa logic
ORDER BY 
    m.MATNR, o.VORNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn định mức thời gian dọn máy/chờ nguội (`time_stop`), thời gian chuẩn bị (`time_start`) và thời gian chạy máy định mức (`time_cycle`) từ cơ sở dữ liệu Odoo:

```sql
SELECT 
    pt.name AS "Product Name Template",
    rwc.name AS "Operation Name",
    wc.name AS "Assigned Work Center",
    rwc.time_start AS "Setup Duration (Mins)",       -- Thời gian chuẩn bị máy
    rwc.time_cycle AS "Run Duration/Unit (Mins)",    -- Thời gian gia công thực tế/SP
    rwc.time_stop AS "Cleanup/Wait Duration (Mins)"  -- Thời gian dọn dẹp/chờ nguội máy
FROM 
    mrp_routing_workcenter rwc
INNER JOIN mrp_bom bom ON rwc.bom_id = bom.id
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
LEFT JOIN mrp_workcenter wc ON rwc.workcenter_id = wc.id
WHERE 
    bom.active = true
ORDER BY 
    pt.name, rwc.sequence;