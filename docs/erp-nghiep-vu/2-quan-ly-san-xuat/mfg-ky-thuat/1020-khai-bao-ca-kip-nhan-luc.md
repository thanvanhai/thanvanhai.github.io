---
id: 1020-khai-bao-ca-kip-nhan-luc
title: Khai báo Ca kíp & Nguồn nhân lực sản xuất (Labor & Shifts)
sidebar_label: 1020 - Ca kíp & Nguồn nhân lực
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/1020-khai-bao-ca-kip-nhan-luc
date: 2026-09-05
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, labor, shift, calendar, sql]
---

# Khai báo Ca kíp & Nguồn nhân lực sản xuất (Labor & Shifts)

Trong quản lý sản xuất, nếu máy móc đại diện cho năng lực phần cứng thì **Nguồn nhân lực (Labor)** và **Ca kíp (Shifts)** chính là yếu tố điều tiết thời gian thực thi của nhà máy. Khác với máy móc có thể chạy 24/7, nguồn nhân lực còn bị ràng buộc bởi luật lao động (giờ làm việc tối đa, giờ nghỉ ăn ca), trình độ tay nghề (Skills/Kỹ năng), và chi phí tăng ca (Overtime Rates).

Lập lịch sản xuất không thể chính xác nếu hệ thống không nắm được: Nhà máy chạy mấy ca? Mỗi ca nghỉ giữa ca vào khung giờ nào? Tỷ lệ nhân công khả dụng là bao nhiêu? Đơn giá giờ công ca đêm khác ca ngày như thế nào? Và cuối cùng, giờ công thực tế được ghi nhận về hệ thống ra sao để tính giá thành?

Bài viết này phân tích kiến trúc thiết kế ca kíp, cách quản lý nguồn nhân lực và hạch toán chi phí nhân công — từ khâu **thiết lập (setup)** đến khâu **ghi nhận thực tế (actuals)** — trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Để quản lý ca kíp và nhân lực, các hệ thống ERP tổ chức các bảng dữ liệu theo 4 nhóm, đi từ thiết lập đến vận hành thực tế:

**Lịch chung (Calendar)** → **Khung giờ Ca & Giờ nghỉ (Shifts & Breaks)** → **Nguồn nhân lực & Hồ sơ nhân viên (Labor Resource & Employee Master)** → **Ghi nhận chấm công thực tế (Labor Actuals)**.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Lịch nhà máy (Factory Calendar)** | `BOM_WORKDAY_CALENDARS` | `Erp.ProdCal` (Production Calendar) | `TFACS` (Factory Calendar Header) | `resource.calendar` |
| **Định nghĩa Ca kíp (Shift Master)** | `BOM_SHIFT_TIMES` (lưu giờ Start/End của ca) | `Erp.ProdCalShift` (khung giờ ca kíp) | `TPROG` (Shift Definition) / `TPERID` | `resource.calendar.attendance` (khung giờ chi tiết) |
| **Giờ nghỉ giữa ca (Shift Breaks)** | Cấu hình trừ trực tiếp vào khoảng thời gian trên `BOM_SHIFT_TIMES` | `Erp.ProdCalShiftBreak` | `TC30` / `TPAUS` (Break Schedules) | Khai báo thành nhiều dòng Attendance trong cùng 1 ca |
| **Nguồn nhân lực (Labor Resource)** | `BOM_RESOURCES` (`resource_type = 2` - Person) | `Erp.Resource` (`ResourceType = 'L'` - Labor) | `CRHD` (Work Center, `Category = 0002` - Labor) | `mrp.workcenter` (`resource_type = 'human'`) |
| **Đơn giá giờ công (Labor Rates)** | `CST_RESOURCE_COSTS` | `Erp.ResourceGroup` / `Erp.EmpBasic` | `CSLA` / `COKL` (Activity Type Rates) | Cấu hình trực tiếp trên Work Center hoặc `hr.contract` |
| **Hồ sơ công nhân (Employee Master)** | `PER_ALL_PEOPLE_F` / `PER_ALL_ASSIGNMENTS_F` | `Erp.EmpBasic` (danh mục nhân viên) | `PA0001` (HR Master Data - Personnel Assignment) | `hr.employee` |
| **Ghi nhận chấm công sản xuất** | `WIP_LABOR_ACTUALS` | `Erp.LaborDtl` (giao dịch báo cáo giờ công MES) | `AFRU` (Order Completion Confirmations) | `mrp.workcenter.productivity` |

> **Ghi chú:** Ba nhóm bảng đầu (Calendar → Shift → Resource) phục vụ khâu **thiết lập (setup)**, quyết định năng lực *lý thuyết* của nhà máy. Nhóm cuối (Employee Master → Labor Actuals) phục vụ khâu **vận hành thực tế**, ghi nhận năng lực *đã tiêu thụ* — đây là mắt xích bắt buộc phải có để đối chiếu Kế hoạch (Plan) với Thực tế (Actual) và tính giá thành nhân công trực tiếp.

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Workday Calendar & BOM Resources)
Oracle EBS quản lý lịch nhà máy tập trung, sau đó gán các khung giờ ca vào từng Resource:
1. **Bước 1 (Định nghĩa Lịch & Ca):** Truy cập `BOM > Setup > Workday Calendars`. Tạo mã lịch (ví dụ: `24x7_CAL`), chọn các ngày làm việc trong tuần và ngày nghỉ lễ (Exceptions). Tại nút `Shifts`, định nghĩa chi tiết thời gian:
   - Ca 1: `06:00` - `14:00`
   - Ca 2: `14:00` - `22:00`
   - Ca 3: `22:00` - `06:00`
2. **Bước 2 (Định nghĩa Nhân lực):** Vào `BOM > Setup > Resources`, tạo mã nhân công (ví dụ: `OPERATOR_WELDER`), chọn `Type = Person`.
3. **Bước 3 (Gán Ca cho Resource):** Tại màn hình `Department Resources`, gán mã nhân công vào Department và chọn các Ca khả dụng từ Workday Calendar.

### b. Hệ thống Epicor ERP (Production Calendar & Employee Association)
Epicor tách bạch giữa Lịch sản xuất chuẩn và Danh mục nhân viên thực tế, đồng thời hỗ trợ quản lý chi tiết đến từng khoảng thời gian nghỉ ăn trưa/ăn tối của công nhân:
1. **Bước 1 (Thiết lập Production Calendar):** Truy cập `Production Management > Job Manager > Setup > Production Calendar`. Tạo mã lịch (ví dụ: `2SHIFT_CAL`).
2. **Bước 2 (Thêm Ca & Giờ nghỉ):** Trong tab `Shifts`, tạo Ca 1 (`08:00` - `17:00`). Chuyển sang tab `Breaks`, thêm giờ nghỉ trưa từ `12:00` đến `13:00` và các khoảng giải lao để hệ thống tự động trừ giờ.
3. **Bước 3 (Gán vào Resource/Group):** Gán Production Calendar này vào Resource Group hoặc từng Resource cụ thể.
4. **Bước 4 (Liên kết Nhân viên):** Vào `Payroll > Payroll Setup > Employee`, trên màn hình khai báo nhân viên (`EmpBasic`), gán mã nhân viên vào đúng `ResourceID` hoặc `ResourceGroupID` thuộc xưởng sản xuất để công nhân có thể quẹt thẻ báo cáo giờ công trên giao diện MES (Work Center Tracker).

### c. Hệ thống SAP S/4HANA (Capacity Category & Activity Types)
SAP quản lý nhân lực gắn liền với việc phân bổ chi phí kế toán quản trị (CO), sử dụng các T-Code chuyên dụng:
1. **Bước 1 (Cấu hình Lịch & Ca):** Dùng T-Code `SCAL`/`OP4A` để khai báo Factory Calendar, các ngày nghỉ cố định/di động và các khoảng thời gian Ca/Nghỉ (`Break Schedules`).
2. **Bước 2 (Tạo Work Center Nhân công):** Dùng T-Code `CR01`, chọn `Category = 0002` (Labor). Trên tab *Capacities*, chọn loại năng lực `002` (Labor) và gán `Shift Sequence`.
3. **Bước 3 (Gán đơn giá giờ công):** Trên tab *Costing*, gán `Activity Type` đại diện cho giờ công (ví dụ: `LABOR_STD`) để hệ thống tự động tính giá thành.

### d. Hệ thống Odoo ERP (Working Hours & Resource Attendance)
Odoo tích hợp quản lý ca kíp sản xuất chung với phân hệ Nhân sự (HR):
1. **Bước 1 (Định nghĩa Working Hours):** Vào `Settings > Technical > Resource > Working Times` (hoặc trong `Payroll/HR`), tạo lịch làm việc.
2. **Bước 2 (Khai báo các dòng ca):** Mỗi ca được định nghĩa thành các dòng khoảng thời gian. Nếu có nghỉ trưa, tạo 2 dòng cho cùng một ngày (Sáng: `08:00 - 12:00`, Chiều: `13:00 - 17:00`).
3. **Bước 3 (Gán vào Work Center/Employee):** Trong `Manufacturing > Configuration > Work Centers`, chọn lịch làm việc tại trường `Working Hours`, hoặc gán trực tiếp vào hồ sơ nhân viên (`hr.employee`).

---

## 3. Thuật toán Lập lịch Ca kíp & Nguồn nhân lực (Shift & Labor Scheduling Logic)

Thuật toán lập lịch cần xác định được **Năng lực khả dụng thực tế (Net Available Capacity)** sau khi đã khấu trừ thời gian nghỉ cố định và cộng thêm phần năng lực tăng ca.

### Công thức tổng quát:
$$\text{Net Labor Capacity (Hours)} = N \times \left[ (T_{shift} - T_{break}) \times \text{Efficiency} \right] + (T_{OT} \times K_{OT})$$

*Trong đó:*
- $N$: Số lượng công nhân khả dụng cùng trình độ/tay nghề (`Labor Count`).
- $T_{shift}$: Tổng thời gian lý thuyết của ca làm việc (giờ).
- $T_{break}$: Tổng thời gian nghỉ ăn ca/nghỉ giải lao cố định (giờ).
- $\text{Efficiency}$: Hệ số hiệu suất làm việc thực tế của công nhân (thường từ `0.85` - `0.95`), phản ánh hao hụt do thao tác, chờ vật tư, chuyển đổi công đoạn...
- $T_{OT}$: Số giờ tăng ca dự kiến (Overtime Hours).
- $K_{OT}$: Hệ số quy đổi năng suất/chi phí tăng ca (ví dụ: OT ngày thường = `1.5`, OT ngày lễ = `2.0` hoặc `3.0`).

### Ví dụ 1 — Quy đổi năng lực Tổ may (không có OT, tập trung vào Break Time):
Một xưởng may có ca làm việc hành chính từ **07:30 đến 16:30** (9 tiếng vật lý), Tổ may có **20 công nhân**.
- Giờ nghỉ trưa: `11:30 - 12:30` (1 tiếng).
- Giờ nghỉ giải lao sáng: `09:30 - 09:45` (15 phút = 0.25 giờ).
- Giờ nghỉ giải lao chiều: `14:30 - 14:45` (15 phút = 0.25 giờ).

**Tính toán:**
1. Thời gian làm việc thực tế của 1 công nhân trong ca = $9 - 1 - 0.25 - 0.25 = 7.5 \text{ giờ/ngày}$.
2. Tổng số giờ công khả dụng của cả Tổ may = $7.5 \times 20 = 150 \text{ giờ công/ngày}$.

> **Ý nghĩa thực tế:** Khi có một Lệnh sản xuất yêu cầu tổng cộng **300 giờ công**, hệ thống lập lịch sẽ tính toán chính xác Lệnh này cần đúng **2 ngày làm việc** của Tổ may để hoàn thành.

### Ví dụ 2 — Quy đổi năng lực có tính Hiệu suất và Tăng ca:
Tổ Hàn có **5 công nhân** (`N = 5`), làm trong **Ca 1** (08:00 - 17:00, tổng 9 tiếng vật lý).
- Thời gian nghỉ trưa cố định: 1 tiếng (`T_break = 1`).
- Hệ số hiệu suất tay nghề trung bình: `90%` (`Efficiency = 0.90`).
- Nhà máy đăng ký tăng ca thêm **2 tiếng** vào cuối ca cho cả tổ (`T_OT = 2`, `K_OT = 1` cho phần quy đổi giờ công — hệ số chi phí OT tính riêng ở phần lương).

**Tính toán:**
1. Thời gian làm việc tiêu chuẩn của 1 công nhân/ngày: $(9 - 1) \times 0.90 = 7.2 \text{ giờ}$.
2. Năng lực làm việc ngày thường của cả tổ: $7.2 \times 5 = 36 \text{ giờ công}$.
3. Năng lực tăng ca của cả tổ: $2 \times 5 = 10 \text{ giờ công}$.
4. **Tổng năng lực khả dụng thực tế trong ngày:** $36 + 10 = 46 \text{ giờ công}$.

> **Ứng dụng:** Khi Lệnh sản xuất yêu cầu tổng cộng **40 giờ công hàn**, thuật toán lập lịch sẽ xếp lệnh này hoàn thành trọn vẹn trong **ngày đầu tiên**, vì 40 giờ < 46 giờ khả dụng thực tế (đã bao gồm OT).

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Ca kíp & Nhân lực

### Bài toán 1: Khai báo Ca kíp xoay vòng và phụ cấp ca đêm (Shift Differential Costing)
*   **Thách thức:** Nhà máy chạy 3 ca liên tục. Công nhân làm Ca 3 (22:00 - 06:00) được hưởng đơn giá lương cao hơn 30% so với ca ngày. Nếu hệ thống tính chung một đơn giá giờ công tiêu chuẩn, giá thành sản phẩm sản xuất vào ca đêm sẽ bị phản ánh sai lệch so với chi phí thực tế.
*   **Giải pháp trên các hệ thống:**
    *   **Trong SAP S/4HANA:** Tạo các Activity Types riêng biệt cho ca ngày (`LAB_DAY`) và ca đêm (`LAB_NIGHT`) với đơn giá khác nhau. Khi báo cáo sản lượng qua T-Code `CO11N`, người dùng chọn đúng Activity Type ca đêm để hệ thống tự động ghi nhận chi phí tăng thêm.
    *   **Trong Epicor ERP:** Sử dụng tính năng **Payroll Class / Shift Differential**. Trên `Resource Group`, cấu hình phụ cấp theo ca. Khi công nhân quẹt thẻ MES vào Ca 3, hệ thống sẽ tự động nhân tỷ lệ phụ cấp (Shift Rate) vào chi phí nhân công trực tiếp (Direct Labor Cost), ghi nhận qua bảng `Erp.LaborDtl` gắn với Job.

### Bài toán 2: Quản lý Ca gãy & Giờ nghỉ giữa ca (Break Time Deductions)
*   **Thách thức:** Nhà máy cho công nhân nghỉ giữa ca 15 phút vào lúc 10:00 và 15:00. Nếu hệ thống ERP không tự động trừ 15 phút này ra khỏi dung lượng ca, thuật toán lập lịch sẽ xếp lệnh sản xuất chạy qua khung giờ nghỉ, dẫn đến trễ tiến độ thực tế trên sàn sản xuất.
*   **Giải pháp:**
    *   **Trong Oracle EBS & Epicor:** Cần cấu hình chi tiết bảng **`Break Schedule`** (Lịch nghỉ, `BOM_SHIFT_TIMES`/`Erp.ProdCalShiftBreak`) gắn liền với ca kíp. Khi chạy công cụ lập lịch (Scheduler Engine), hệ thống sẽ tự động tách một Operation thành 2 khoảng thời gian dừng (Split Operation) để "bước qua" khung giờ nghỉ mà không tính năng lực.
    *   **Trong SAP:** Sử dụng thuộc tính `Break Schedule` trong T-Code `OP4A`. SAP sẽ tự động ngắt dòng thời gian tính toán của Lệnh sản xuất ngay tại mốc bắt đầu giờ nghỉ.

### Bài toán 3: Đăng ký Tăng ca (OT) đột xuất mà không sửa Lịch nhà máy chuẩn (Calendar Exceptions)
*   **Thách thức:** Lịch nhà máy chuẩn chỉ chạy 8 tiếng/ngày. Do tiến độ đơn hàng gấp, Tổ trưởng đăng ký cho công nhân tăng ca thêm 2-3 tiếng vào một ngày cụ thể (kể cả ngày nghỉ chuẩn như Thứ Bảy). Làm thế nào để hệ thống ghi nhận năng lực tăng thêm này mà **không làm thay đổi** lịch làm việc tiêu chuẩn của các tuần sau?
*   **Giải pháp trên các hệ thống:**
    *   **Trong Oracle EBS:** Sử dụng tính năng **Calendar Exceptions / Shift Exceptions** — khai báo trực tiếp năng lực tăng thêm trên màn hình `Capacity Changes` của Department Resource, hoặc gán bổ sung khung giờ làm việc đặc biệt cho đúng ngày cụ thể mà không phá vỡ cấu trúc mẫu ca kíp (`Workday Pattern`) ban đầu.
    *   **Trong Epicor ERP:** Vào `Production Calendar > Exception Days`, chọn ngày cụ thể đó và sửa khung giờ của Ca làm việc (ví dụ mở rộng từ `08:00 - 17:00` thành `08:00 - 19:00`), hoặc thêm hẳn một khoảng `Overtime Shift` riêng. Việc sửa đổi trên Exception Days chỉ có hiệu lực duy nhất cho ngày được chọn, hệ thống APS sẽ tự mở rộng năng lực khả dụng riêng cho ngày đó.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Ca kíp & Nhân lực

### a. Trên hệ thống Oracle EBS (PL/SQL)

**Truy vấn 1 — Danh sách ca làm việc gán cho các phòng ban sản xuất:**
```sql
SELECT 
    ood.organization_code AS "Org Code",
    wbc.calendar_code AS "Calendar Code",
    bd.department_code AS "Dept Code",
    br.resource_code AS "Labor Resource",
    bst.shift_num AS "Shift Num",
    bst.from_time/3600 AS "Start Hour (24h)",
    bst.to_time/3600 AS "End Hour (24h)",
    ((bst.to_time - bst.from_time)/3600) AS "Gross Shift Hours"
FROM 
    apps.bom_workday_calendars wbc
INNER JOIN apps.bom_shift_times bst ON wbc.calendar_code = bst.calendar_code
INNER JOIN apps.bom_resource_shifts brs ON bst.shift_num = brs.shift_num
INNER JOIN apps.bom_department_resources bdr ON brs.resource_id = bdr.resource_id AND brs.department_id = bdr.department_id
INNER JOIN apps.bom_departments bd ON bdr.department_id = bd.department_id
INNER JOIN apps.bom_resources br ON bdr.resource_id = br.resource_id
INNER JOIN apps.org_organization_definitions ood ON bd.organization_id = ood.organization_id
WHERE 
    br.resource_type = 2 -- Resource Type = 2 (Person/Labor)
    AND ood.organization_code = 'V1'
ORDER BY 
    bd.department_code, br.resource_code, bst.shift_num;
```

**Truy vấn 2 — Chi tiết khung giờ bắt đầu/kết thúc của các Ca gắn với Lịch nhà máy:**
```sql
SELECT 
    cal.calendar_code AS "Calendar Code",
    cal.calendar_description AS "Calendar Name",
    shift.shift_num AS "Shift No",
    shift.description AS "Shift Name",
    times.from_time / 3600 AS "Start Hour", -- Quy đổi từ Giây sang Giờ
    times.to_time / 3600 AS "End Hour",
    (times.to_time - times.from_time) / 3600 AS "Total Shift Hours"
FROM 
    apps.bom_workday_calendars cal
INNER JOIN apps.bom_shift_details shift ON cal.calendar_code = shift.calendar_code
INNER JOIN apps.bom_shift_times times ON shift.calendar_code = times.calendar_code 
                                      AND shift.shift_num = times.shift_num
ORDER BY 
    cal.calendar_code, shift.shift_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Kiểm tra cấu hình chi tiết các ca làm việc và thời gian nghỉ giữa ca (Breaks) gán cho từng Production Calendar:

```sql
SELECT 
    pc.Company,
    pc.ProdCalID AS [Calendar Code],
    pc.Description AS [Calendar Name],
    pcs.ShiftNum AS [Shift Num],
    pcs.Description AS [Shift Name],
    -- Chuyển đổi số giây thành định dạng Giờ:Phút
    RIGHT('0' + CAST(pcs.StartTime / 3600 AS VARCHAR), 2) + ':' + 
    RIGHT('0' + CAST((pcs.StartTime % 3600) / 60 AS VARCHAR), 2) AS [Start Time],
    RIGHT('0' + CAST(pcs.EndTime / 3600 AS VARCHAR), 2) + ':' + 
    RIGHT('0' + CAST((pcs.EndTime % 3600) / 60 AS VARCHAR), 2) AS [End Time],
    b.BreakName AS [Break Name],
    (b.BreakDuration / 60) AS [Break Duration (Mins)]
FROM 
    Erp.ProdCal pc
INNER JOIN Erp.ProdCalShift pcs ON pc.Company = pcs.Company AND pc.ProdCalID = pcs.ProdCalID
LEFT JOIN Erp.ProdCalShiftBreak b ON pcs.Company = b.Company AND pcs.ProdCalID = b.ProdCalID AND pcs.ShiftNum = b.ShiftNum
ORDER BY 
    pc.ProdCalID, pcs.ShiftNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn năng lực nhân công (Labor Capacity) và liên kết ca kíp của các Work Center thuộc nhóm Labor:

```sql
SELECT 
    h.WERKS AS "Plant",
    h.ARBPL AS "Labor Work Center",
    t.KTEXT AS "Description",
    c.KAPAR AS "Capacity Category", -- 002 = Labor
    c.AZPRO AS "Shift Sequence Key",
    c.MEINS AS "Unit of Measure"
FROM 
    saphanadb.CRHD h
INNER JOIN saphanadb.KAKO c ON h.OBJID = c.OBJID
LEFT OUTER JOIN saphanadb.CRTX t ON h.OBJTY = t.OBJTY AND h.OBJID = t.OBJID AND t.SPRAS = 'E'
WHERE 
    h.VERWE = '0002' -- Work Center Category for Labor
    AND h.WERKS = '1000'
ORDER BY 
    h.ARBPL;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn khung giờ ca làm việc chi tiết và các khoảng thời gian nghỉ trong tuần từ bảng điều hành thời gian của Odoo:

```sql
SELECT 
    rc.name AS "Working Schedule Name",
    att.name AS "Shift Line Name",
    -- Decode ngày trong tuần (0 = Monday, 6 = Sunday)
    CASE att.dayofweek
        WHEN '0' THEN 'Monday'
        WHEN '1' THEN 'Tuesday'
        WHEN '2' THEN 'Wednesday'
        WHEN '3' THEN 'Thursday'
        WHEN '4' THEN 'Friday'
        WHEN '5' THEN 'Saturday'
        WHEN '6' THEN 'Sunday'
    END AS "Day of Week",
    att.hour_from AS "Start Hour",
    att.hour_to AS "End Hour",
    (att.hour_to - att.hour_from) AS "Net Hours"
FROM 
    resource_calendar rc
INNER JOIN resource_calendar_attendance att ON rc.id = att.calendar_id
ORDER BY 
    rc.name, att.dayofweek, att.hour_from;
