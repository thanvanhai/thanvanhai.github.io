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
| **Lịch nhà máy (Factory Calendar)** | `BOM_CALENDARS` (header lịch — Code, mô tả, ngày bắt đầu/kết thúc) | `Erp.ProdCal` (Production Calendar — chỉ quản lý ngày làm việc/nghỉ, KHÔNG chứa thông tin ca) | `TFACS` (Factory Calendar Header) | `resource.calendar` |
| **Định nghĩa Ca kíp (Shift Master)** | `BOM_CALENDAR_SHIFTS` (định nghĩa ca theo Calendar) + `BOM_SHIFT_TIMES` (giờ Start/End) | `Erp.JCShift` (bảng master ca độc lập, KHÔNG nằm dưới `ProdCal*` — lưu `Shift`, `StartTime`, `EndTime`, `LunchStart`/`LunchEnd`, và cả `DiffRate`/`DiffQualifier`/`DiffMethod` cho phụ cấp ca) | `TPROG` (Shift Definition) / `TPERID` — *chưa xác minh độc lập* | `resource.calendar.attendance` (khung giờ chi tiết) |
| **Giờ nghỉ giữa ca (Shift Breaks)** | Cấu hình trừ trực tiếp vào khoảng thời gian trên `BOM_SHIFT_TIMES` | `Erp.ShiftBrk` (bảng con của `JCShift`, liên kết qua field `Shift` — hỗ trợ nhiều break/ca) | `TC30` / `TPAUS` (Break Schedules) — *chưa xác minh độc lập* | Khai báo thành nhiều dòng Attendance trong cùng 1 ca |
| **Nguồn nhân lực (Labor Resource)** | `BOM_RESOURCES` (`resource_type = 2` - Person) | `Erp.Resource` (`ResourceType = 'L'` - Labor) | `CRHD` (Work Center, `Category = 0002` - Labor) | `mrp.workcenter` (`resource_type = 'human'`) |
| **Đơn giá giờ công (Labor Rates)** | `CST_RESOURCE_COSTS` | `Erp.ResourceGroup` / `Erp.EmpBasic` (đơn giá cơ bản) + `Erp.JCShift` (phụ cấp/hệ số theo ca — `DiffRate`) | `CSLA` / `COKL` (Activity Type Rates) | Cấu hình trực tiếp trên Work Center hoặc `hr.contract` |
| **Hồ sơ công nhân (Employee Master)** | `PER_ALL_PEOPLE_F` / `PER_ALL_ASSIGNMENTS_F` | `Erp.EmpBasic` (danh mục nhân viên) | `PA0001` (HR Master Data - Personnel Assignment) | `hr.employee` |
| **Ghi nhận chấm công sản xuất** | `WIP_LABOR_ACTUALS` | `Erp.LaborDtl` (giao dịch báo cáo giờ công MES) | `AFRU` (Order Completion Confirmations) | `mrp.workcenter.productivity` |

> **Ghi chú kiến trúc quan trọng (Epicor):** Khác với giả định ban đầu, **Ca kíp không phải là con của Production Calendar**. `Erp.JCShift` là "Job Shop production shift master file" độc lập, dùng chung cho toàn nhà máy; còn `Erp.ProdCal`/`Erp.ProdCalDay` chỉ trả lời câu hỏi "ngày này có làm việc hay không", không trả lời "ca nào chạy giờ nào". Hai trục dữ liệu này gán riêng vào Resource/Employee chứ không lồng vào nhau.
>
> **Lưu ý cần xác minh thêm:** Chưa tìm được nguồn xác nhận độc lập cho tên bảng SAP `TPROG`/`TPERID` (Shift Master) và `TC30`/`TPAUS` (Shift Breaks), cũng như giá trị `resource_type = 'human'` trên `mrp.workcenter` của Odoo. Nên đối chiếu lại trên hệ thống thật trước khi dùng cho ABAP thực tế.

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Workday Calendar & BOM Resources — Bảng: `BOM_CALENDARS` / `BOM_CALENDAR_SHIFTS` / `BOM_SHIFT_TIMES` / `BOM_RESOURCES`)
Oracle EBS quản lý lịch nhà máy tập trung, sau đó gán các khung giờ ca vào từng Resource:
1. **Bước 1 (Định nghĩa Lịch & Ca):** Truy cập `BOM > Setup > Workday Calendars`. Tạo mã lịch (field DB: `calendar_code` trên `BOM_CALENDARS`, ví dụ: `24x7_CAL`), chọn các ngày làm việc trong tuần và ngày nghỉ lễ (Exceptions). Tại nút `Shifts`, định nghĩa chi tiết thời gian (field DB: `shift_num`, `from_time`, `to_time` trên `BOM_SHIFT_TIMES`):
   - Ca 1: `06:00` - `14:00`
   - Ca 2: `14:00` - `22:00`
   - Ca 3: `22:00` - `06:00`
2. **Bước 2 (Định nghĩa Nhân lực):** Vào `BOM > Setup > Resources`, tạo mã nhân công (field DB: `resource_code`, ví dụ: `OPERATOR_WELDER`), chọn `Type = Person` (field DB: `resource_type`).
3. **Bước 3 (Gán Ca cho Resource):** Tại màn hình `Department Resources`, gán mã nhân công vào Department và chọn các Ca khả dụng từ Workday Calendar.

### b. Hệ thống Epicor ERP (Shift Master độc lập & Production Calendar riêng biệt — Bảng: `JCShift` / `ShiftBrk` / `ProdCal` / `EmpBasic`)
Epicor tách hoàn toàn 2 trục: **Ca kíp** (khung giờ chạy) và **Lịch sản xuất** (ngày làm/nghỉ) — đây là điểm khác biệt lớn nhất so với 3 hệ thống còn lại:
1. **Bước 1 (Tạo Shift Master):** Vào màn hình khai báo Ca kíp (Shift Maintenance), tạo mã ca (field DB: `Shift` — số ID ca, trên `Erp.JCShift`) và nhập giờ bắt đầu/kết thúc (field DB: `StartTime`, `EndTime`, ví dụ `08:00` - `17:00`), giờ nghỉ trưa (field DB: `LunchStart`, `LunchEnd`). Đồng thời có thể khai báo luôn phụ cấp ca ngay tại đây (field DB: `DiffRate`, `DiffQualifier`, `DiffMethod`) — ví dụ ca đêm phụ cấp thêm 30%.
2. **Bước 2 (Thêm giờ nghỉ giữa ca):** Trên cùng màn hình hoặc tab con, thêm các dòng giờ nghỉ giải lao (field DB: `BreakNum`, `BreakStart`, `BreakEnd` trên `Erp.ShiftBrk`, liên kết ngược lại `JCShift` qua field `Shift`) — hỗ trợ nhiều break trong cùng 1 ca.
3. **Bước 3 (Thiết lập Production Calendar riêng):** Song song, vào `Production Management > Job Manager > Setup > Production Calendar` để khai báo ngày nào là ngày làm việc/ngày nghỉ (field DB: `ProdCalID` trên `Erp.ProdCal`, chi tiết từng ngày trên `Erp.ProdCalDay`) — bảng này **không chứa** thông tin giờ ca.
4. **Bước 4 (Gán cả 2 trục vào Resource & Nhân viên):** Vào `Payroll > Payroll Setup > Employee`, trên màn hình khai báo nhân viên, gán mã nhân viên vào `ResourceID`/`ResourceGrpID` (thuộc xưởng sản xuất, quyết định `ProdCalID` áp dụng) **và** gán `Shift` mặc định (field DB trên `Erp.EmpBasic`) để công nhân quẹt thẻ báo cáo giờ công đúng ca trên giao diện MES (Work Center Tracker / Time Entry).

### c. Hệ thống SAP S/4HANA (Capacity Category & Activity Types — Bảng: `TFACS` / `CRHD` / `KAKO` / `CSLA`)
SAP quản lý nhân lực gắn liền với việc phân bổ chi phí kế toán quản trị (CO), sử dụng các T-Code chuyên dụng:
1. **Bước 1 (Cấu hình Lịch & Ca):** Dùng T-Code `SCAL`/`OP4A` để khai báo Factory Calendar (field DB liên quan: `TFACS`), các ngày nghỉ cố định/di động và các khoảng thời gian Ca/Nghỉ (`Break Schedules`).
2. **Bước 2 (Tạo Work Center Nhân công):** Dùng T-Code `CR01`, chọn `Category = 0002` (Labor — field DB: `CRHD.VERWE`). Trên tab *Capacities*, chọn loại năng lực `002` (Labor) và gán `Shift Sequence` (field DB: `KAKO.AZPRO`).
3. **Bước 3 (Gán đơn giá giờ công):** Trên tab *Costing*, gán `Activity Type` đại diện cho giờ công (field DB liên quan: `CSLA`/`COKL`, ví dụ: `LABOR_STD`) để hệ thống tự động tính giá thành.

### d. Hệ thống Odoo ERP (Working Hours & Resource Attendance — Bảng: `resource.calendar` / `resource.calendar.attendance`)
Odoo tích hợp quản lý ca kíp sản xuất chung với phân hệ Nhân sự (HR):
1. **Bước 1 (Định nghĩa Working Hours):** Vào `Settings > Technical > Resource > Working Times` (hoặc trong `Payroll/HR`), tạo lịch làm việc (field DB: `resource.calendar.name`).
2. **Bước 2 (Khai báo các dòng ca):** Mỗi ca được định nghĩa thành các dòng khoảng thời gian (field DB: `dayofweek`, `hour_from`, `hour_to` trên `resource.calendar.attendance`). Nếu có nghỉ trưa, tạo 2 dòng cho cùng một ngày (Sáng: `08:00 - 12:00`, Chiều: `13:00 - 17:00`).
3. **Bước 3 (Gán vào Work Center/Employee):** Trong `Manufacturing > Configuration > Work Centers`, chọn lịch làm việc tại trường `Working Hours` (field DB: `resource_calendar_id` trên `mrp.workcenter`), hoặc gán trực tiếp vào hồ sơ nhân viên (`hr.employee.resource_calendar_id`).

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
    *   **Trong Epicor ERP:** Phụ cấp ca được khai báo **trực tiếp trên Shift Master**, không phải qua Resource Group. Trên `Erp.JCShift` của Ca 3, nhập `DiffRate` (mức phụ cấp — có thể là % hoặc số tiền cố định tùy `DiffQualifier`) và `DiffMethod` (quy tắc áp dụng: luôn tính, hay chỉ tính khi đây không phải ca mặc định của nhân viên đó). Khi công nhân quẹt thẻ MES vào Ca 3, hệ thống tự động cộng phụ cấp vào chi phí nhân công trực tiếp, ghi nhận qua bảng `Erp.LaborDtl` gắn với Job.

### Bài toán 2: Quản lý Ca gãy & Giờ nghỉ giữa ca (Break Time Deductions)
*   **Thách thức:** Nhà máy cho công nhân nghỉ giữa ca 15 phút vào lúc 10:00 và 15:00. Nếu hệ thống ERP không tự động trừ 15 phút này ra khỏi dung lượng ca, thuật toán lập lịch sẽ xếp lệnh sản xuất chạy qua khung giờ nghỉ, dẫn đến trễ tiến độ thực tế trên sàn sản xuất.
*   **Giải pháp:**
    *   **Trong Oracle EBS:** Cần cấu hình chi tiết bảng **`BOM_SHIFT_TIMES`** gắn liền với ca kíp trên `BOM_CALENDAR_SHIFTS`. Khi chạy công cụ lập lịch (Scheduler Engine), hệ thống sẽ tự động tách một Operation thành 2 khoảng thời gian dừng (Split Operation) để "bước qua" khung giờ nghỉ mà không tính năng lực.
    *   **Trong Epicor:** Khai báo các dòng break trên `Erp.ShiftBrk` (nhiều break/ca, mỗi break có `BreakStart`/`BreakEnd` riêng) gắn với `Shift` tương ứng trên `JCShift`. Vì đây là thuộc tính của bản thân Ca kíp, mọi Resource dùng chung ca đó đều tự động áp dụng đúng giờ nghỉ mà không cần cấu hình lại theo từng máy/nhân viên.
    *   **Trong SAP:** Sử dụng thuộc tính `Break Schedule` trong T-Code `OP4A`. SAP sẽ tự động ngắt dòng thời gian tính toán của Lệnh sản xuất ngay tại mốc bắt đầu giờ nghỉ.

### Bài toán 3: Đăng ký Tăng ca (OT) đột xuất mà không sửa Lịch nhà máy chuẩn (Calendar Exceptions)
*   **Thách thức:** Lịch nhà máy chuẩn chỉ chạy 8 tiếng/ngày. Do tiến độ đơn hàng gấp, Tổ trưởng đăng ký cho công nhân tăng ca thêm 2-3 tiếng vào một ngày cụ thể (kể cả ngày nghỉ chuẩn như Thứ Bảy). Làm thế nào để hệ thống ghi nhận năng lực tăng thêm này mà **không làm thay đổi** lịch làm việc tiêu chuẩn của các tuần sau?
*   **Giải pháp trên các hệ thống:**
    *   **Trong Oracle EBS:** Sử dụng tính năng **Calendar Exceptions / Shift Exceptions** — khai báo trực tiếp năng lực tăng thêm trên màn hình `Capacity Changes` của Department Resource, hoặc gán bổ sung khung giờ làm việc đặc biệt cho đúng ngày cụ thể mà không phá vỡ cấu trúc mẫu ca kíp (`Workday Pattern`) ban đầu.
    *   **Trong Epicor ERP:** Vào `Production Calendar > Exception Days`, chọn ngày cụ thể đó và đánh dấu là ngày làm việc bổ sung trên `Erp.ProdCalDay` (vì OT là vấn đề "ngày này có làm hay không", thuộc trục Production Calendar). Nếu cần thêm hẳn 1 ca OT riêng với giờ và phụ cấp khác, tạo thêm 1 bản ghi mới trên `Erp.JCShift` (ví dụ `Shift = 9`, đại diện ca tăng ca) rồi gán tạm thời cho Resource/nhân viên liên quan trong ngày đó.

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
    apps.bom_calendars wbc
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
    apps.bom_calendars cal
INNER JOIN apps.bom_calendar_shifts shift ON cal.calendar_code = shift.calendar_code
INNER JOIN apps.bom_shift_times times ON shift.calendar_code = times.calendar_code 
                                      AND shift.shift_num = times.shift_num
ORDER BY 
    cal.calendar_code, shift.shift_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Kiểm tra cấu hình chi tiết các ca làm việc (Shift Master) và thời gian nghỉ giữa ca (Breaks) — lưu ý đây là 2 bảng độc lập với Production Calendar:

```sql
SELECT 
    js.Company,
    js.Shift AS [Shift ID],
    js.Description AS [Shift Description],
    js.DspStartTime AS [Start Time],
    js.DspEndTime AS [End Time],
    js.DspLunchStart AS [Lunch Start],
    js.DspLunchEnd AS [Lunch End],
    js.DiffRate AS [Differential Rate],
    js.DiffQualifier AS [Differential Qualifier], -- ví dụ: % hoặc số tiền cố định
    b.BreakNum AS [Break Num],
    b.Description AS [Break Name],
    b.BreakStart AS [Break Start],
    b.BreakEnd AS [Break End]
FROM 
    Erp.JCShift js
LEFT JOIN Erp.ShiftBrk b ON js.Company = b.Company AND js.Shift = b.Shift
WHERE 
    js.Company = 'EP01'
ORDER BY 
    js.Shift, b.BreakNum;
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