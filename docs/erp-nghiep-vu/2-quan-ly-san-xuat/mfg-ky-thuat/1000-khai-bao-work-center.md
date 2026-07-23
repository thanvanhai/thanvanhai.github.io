---
id: 1000-khai-bao-work-center
title: Khai báo Trung tâm công việc (Work Center Setup) - Kiến trúc đa hệ thống
sidebar_label: 1000 - Khai báo Work Center
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/1000-khai-bao-work-center
date: 2026-09-01
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, master-data, sql]
---

# Khai báo Trung tâm công việc (Work Center Setup)

Trong quản lý sản xuất, việc số hóa năng lực của nhà xưởng vật lý vào hệ thống ERP/MES là bước đầu tiên để vận hành. Đối tượng đại diện cho năng lực này thường được gọi là **Trung tâm công việc (Work Center)**. 

Tuy nhiên, mỗi hệ thống ERP lại có một triết lý thiết kế cơ sở dữ liệu và thuật ngữ khác nhau cho đối tượng này. Bài viết này phân tích chi tiết kiến trúc dữ liệu dưới nền (Database Tables), luồng thiết lập giao diện (UI Flows), thuật toán lập lịch và các câu lệnh SQL kiểm tra của 4 hệ thống phổ biến: **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Physical Database Schema)

Về bản chất logic, để mô hình hóa một Work Center cần kết nối giữa: **Mã nhận diện (Header)** $\rightarrow$ **Năng lực ca kíp (Capacities/Shifts)** $\rightarrow$ **Hạch toán tài chính (Costing/Cost Center)**. 

Bảng dưới đây ánh xạ các bảng dữ liệu vật lý thực tế chạy dưới nền của 4 hệ thống:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Đầu mục chính (Header)** | `BOM_DEPARTMENTS` | `Erp.ResourceGroup` | `CRHD` (Work Center Header) | `mrp.workcenter` |
| **Tài nguyên chi tiết (Resource)** | `BOM_RESOURCES` | `Erp.Resource` | Không tách bảng riêng (Nằm chung trong cấu hình `CRHD`) | Không tách bảng riêng (Định nghĩa trực tiếp bằng cột `capacity` trên `mrp.workcenter`) |
| **Liên kết Trung gian (Mapping)** | `BOM_DEPARTMENT_RESOURCES` | `Erp.ResourceGroup` (Trường `GroupSeq` liên kết sang `Resource`) | `CRCA` (Capacity Allocation) | Không cần (Mối quan hệ 1-1) |
| **Lịch làm việc (Calendar)** | `BOM_CALENDAR_DATES` | `Erp.ProdCal` | `TFACS` (Factory Calendar) | `resource.calendar` |
| **Ca kíp chi tiết (Shifts)** | `BOM_RESOURCE_SHIFTS` | `Erp.ProdCalShift` | `TPROG` (Shift Definition) | `resource.calendar.attendance` |
| **Hạch toán (Cost Center Link)** | Liên kết qua `Class Code` / Tài khoản WIP | Liên kết qua `JCDept` (Department GL Control) | `CRCO` (Work Center to Cost Center Link) | Định nghĩa trực tiếp bằng tài khoản chi phí trên Work Center |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

Do triết lý thiết kế khác nhau, quy trình thao tác cấu hình của người dùng trên màn hình các hệ thống cũng có sự khác biệt rõ rệt:

### a. Hệ thống Oracle EBS (Triết lý phân tách Department - Resource)
Oracle EBS tách biệt hoàn toàn giữa nơi quản lý hành chính (`Department`) và công cụ tạo ra năng suất (`Resource`).
1. **Bước 1 (Khai báo Resource):** Người dùng vào `BOM > Setup > Resources` để khai báo mã máy (ví dụ: `LASER`), chọn Resource Type là `Machine` hoặc `Person`, và chọn đơn vị tính năng suất (UOM) là `HR` (Hours).
2. **Bước 2 (Khai báo Department):** Vào `BOM > Departments > Departments` để tạo mã phòng ban/tổ sản xuất (ví dụ: `CUTTING` - Tổ cắt).
3. **Bước 3 (Gán Resource vào Department):** Tại màn hình Department, người dùng bấm vào nút `Resources` để gán mã `LASER` vào tổ `CUTTING`, đồng thời điền số lượng máy khả dụng (ví dụ: `2` máy) tại cột `Capacity Units`.
4. **Bước 4 (Gán Ca):** Bấm tiếp nút `Shifts` để gán lịch ca làm việc cho máy (ví dụ: gán Ca 1 và Ca 2).

### b. Hệ thống Epicor ERP (Triết lý Resource Group - Resource)
Epicor quản lý theo cụm tài nguyên tương đồng để phục vụ thuật toán lập lịch nâng cao (APS).
1. **Bước 1 (Khai báo Resource Group):** Người dùng truy cập `Production Management > Job Manager > Setup > Resource Group` để tạo nhóm máy (ví dụ: `LAS_GRP`). Tại đây, gán lịch làm việc nhà xưởng (`Calendar ID`) và tài khoản kế toán chi phí (`Department`).
2. **Bước 2 (Khai báo các Resource con):** Ngay trên cùng cây thư mục giao diện đó, người dùng thêm mới các `Resource` chi tiết nằm dưới Group này (ví dụ: tạo máy `LAS_01` và `LAS_02` thuộc nhóm `LAS_GRP`). Mỗi máy con này có thể cấu hình hiệu suất (`Efficiency`) và năng lực riêng.

### c. Hệ thống SAP S/4HANA (Triết lý Tích hợp hướng đối tượng - Tab-based)
SAP gộp toàn bộ các thuộc tính vào trong một màn hình duy nhất được phân chia theo các thẻ (Tabs).
1. **Bước 1 (Khởi tạo mã):** Người dùng dùng Transaction Code `CR01`, chọn phân xưởng (`Plant`) và loại Work Center (`Work Center Category` - ví dụ: `0001` cho máy móc).
2. **Bước 2 (Cấu hình trên các Tab):**
   - **Tab Basic Data:** Nhập mô tả, người chịu trách nhiệm.
   - **Tab Capacities:** Liên kết lịch nhà máy (`Factory Calendar`), định nghĩa ca kíp và số lượng máy khả dụng (`Capacity Utilization`).
   - **Tab Scheduling:** Nhập các công thức tính toán thời gian (Setup, Machine, Labor).
   - **Tab Cost Center:** Nhập mã `Cost Center` và các loại hoạt động (`Activity Types`) để tự động tính toán chi phí khi ghi nhận sản lượng.

### d. Hệ thống Odoo ERP (Triết lý Tối giản - Single Form)
Odoo đi theo hướng đơn giản hóa tối đa để doanh nghiệp vừa và nhỏ dễ tiếp cận.
1. **Bước 1 (Khai báo nhanh):** Vào `Manufacturing > Configuration > Work Centers`, bấm `New`.
2. **Bước 2 (Nhập tham số):** Trên một màn hình duy nhất, người dùng nhập:
   - Tên Work Center.
   - Lịch làm việc (`Working Hours`).
   - Năng lực thiết kế (`Capacity` - số sản phẩm có thể sản xuất đồng thời).
   - Hiệu suất mục tiêu (`Target OEE` - ví dụ: `85%`).
   - Chi phí trên mỗi giờ hoạt động (`Cost per hour`).

---

## 3. Thuật toán lập lịch & Cách máy tính vận hành (Scheduling Engine)

Mặc dù giao diện khác nhau, nhưng nhân tính toán (Scheduling Engine) của các hệ thống đều quy đổi định mức kỹ thuật thành thời gian vật lý trên trục lịch trình làm việc.

### Công thức tính thời gian thực thi tiêu chuẩn (Standard Duration Time):
$$\text{Duration (Hours)} = \frac{\text{Setup Time (Hours)}}{\text{Capacity Factor}} + \left( \frac{\text{Quantity} \times \text{Run Time per Unit}}{\text{Efficiency Rate} \times \text{Capacity Factor}} \right)$$

*Trong đó:*
- `Setup Time`: Thời gian chuẩn bị máy (cố định).
- `Run Time per Unit`: Thời gian gia công một đơn vị sản phẩm.
- `Efficiency Rate`: Hệ số hiệu quả cấu hình trên Work Center (thường từ `0.80` - `0.95`).
- `Capacity Factor` (hoặc `Capacity Units` trong Oracle EBS / `Count` trong SAP): Số máy chạy song song để chia sẻ công việc.

### Ví dụ áp dụng thực tế:
Nhà máy cần chạy một Lệnh sản xuất **1.000 sản phẩm** qua công đoạn cắt Laser.
- Setup Time = `0.5` giờ (30 phút).
- Run Time = `0.02` giờ / sản phẩm (1.2 phút).
- Hệ số hiệu quả của máy cắt Laser = `85%` (`0.85`).
- Nhà máy huy động `2` máy Laser cùng chạy song song để xử lý lô hàng này (`Capacity Factor = 2`).

**Hệ thống sẽ thực hiện tính toán:**
$$\text{Duration} = \frac{0.5}{2} + \left( \frac{1000 \times 0.02}{0.85 \times 2} \right) = 0.25 + 11.76 = 12.01 \text{ giờ}$$

Nếu lệnh bắt đầu lúc **08:00 sáng ngày 01/09/2026**:
* Hệ thống đối chiếu với lịch ca làm việc (ví dụ: máy chỉ chạy 1 ca hành chính 8 tiếng/ngày, từ 08:00 đến 17:00, nghỉ trưa 1 tiếng).
* Ngày thứ nhất (01/09): Chạy được tối đa 8 tiếng thực tế $\rightarrow$ Lệnh sản xuất còn dư $12.01 - 8 = 4.01$ giờ.
* Ngày thứ hai (02/09): Máy bắt đầu chạy từ 08:00 sáng và cần thêm 4.01 giờ máy chạy.
* **Kết quả:** Hệ thống lập lịch tự động ghi nhận thời gian hoàn thành dự kiến (Scheduled Completion Date) là **12:01 trưa ngày 02/09/2026**.

---

## 4. Giải quyết các bài toán sản xuất thực tế trên các ERP

### Bài toán 1: "Một nhân công đứng nhiều máy" (Multi-machine Operator)
*   **Thực trạng:** 1 công nhân vận hành lành nghề có thể trông cùng lúc 3 máy CNC tự động chạy song song. Nếu không thiết lập đúng, hệ thống lập lịch sẽ hiểu sai rằng cần tới 3 nhân công, dẫn đến tính toán sai nhu cầu nguồn nhân lực.
*   **Giải pháp trên các hệ thống:**
    *   **Oracle EBS:** Trong màn hình `Department Resources`, gán cả Resource Máy (`CNC_MACHINE`) và Resource Người (`CNC_LABOR`) vào Department. Trên Quy trình công nghệ (Routing), cấu hình dòng tài nguyên `CNC_LABOR` với chỉ số **`Assigned Units = 0.33`**.
    *   **Epicor ERP:** Sử dụng cơ chế cấu hình **`Crew Size = 0.33`** trên công đoạn (Operation) của Job để hệ thống tính toán chi phí nhân công chỉ bằng 1/3 chi phí giờ máy chạy.
    *   **SAP S/4HANA:** Trên tab *Capacities* của Work Center, khai báo số lượng công suất máy (`No. of individual capacities` = 3) nhưng số lượng công suất người tương ứng chỉ là 1. Hệ thống sẽ tự động giới hạn việc tính toán năng lực lập lịch theo tài nguyên hạn chế hơn.

### Bài toán 2: Ca sản xuất xuyên đêm (Cross-Midnight Shift)
*   **Thực trạng:** Ca 3 hoạt động từ **22:00 đêm hôm trước đến 06:00 sáng hôm sau**. Khi công nhân báo cáo sản lượng vào lúc 02:00 sáng ngày Thứ Ba, hệ thống cần ghi nhận sản lượng này thuộc về ca làm việc của ngày Thứ Hai (Logical Date) để khớp với kế hoạch cấp phát vật tư trước đó.
*   **Giải pháp trên các hệ thống:**
    *   **Oracle EBS & SAP S/4HANA:** Sử dụng cơ chế định nghĩa lịch sản xuất (Workday Calendar/Shift Definition) có thuộc tính **Shift Date / Logical Day Offset**. Toàn bộ giao dịch diễn ra trong khung giờ của Ca 3 sẽ được quy chiếu ngược về ngày bắt đầu ca (Thứ Hai) trên sổ sách kế toán phụ (Subledger) của phân hệ Sản xuất.
    *   **Odoo ERP:** Odoo xử lý đơn giản hơn bằng cách ghi nhận thời gian thực tế (`Work Center Productivity` - lưu vết theo múi giờ UTC chuẩn). Khi xuất báo cáo phân tích hiệu suất (OEE), hệ thống sử dụng bộ lọc múi giờ địa phương (Timezone) của nhà máy để nhóm các bản ghi thời gian về đúng ca sản xuất của ngày hoạt động tương ứng.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu (Database Check Queries)

Dưới đây là các câu lệnh SQL thực tế dùng để kiểm soát thông tin cấu hình của Work Center trực tiếp từ hệ quản trị cơ sở dữ liệu của từng hệ thống.

### a. Trên hệ thống Oracle EBS (PL/SQL)
Sử dụng câu lệnh này để kiểm tra toàn bộ mối quan hệ giữa Department, Resource, số lượng máy khả dụng (`capacity_units`) và hạch toán tài chính trong một Chi nhánh nhà máy (`Organization`):

```sql
SELECT 
    ood.organization_code AS "Org Code",
    bd.department_code AS "Dept Code",
    bd.description AS "Dept Name",
    br.resource_code AS "Resource Code",
    br.description AS "Resource Name",
    -- Decode loại tài nguyên
    DECODE(br.resource_type, 
           1, 'Machine', 
           2, 'Person', 
           3, 'Space', 
           4, 'Miscellaneous', 
           5, 'Amount') AS "Resource Type",
    bdr.capacity_units AS "Capacity Units",
    br.unit_of_measure AS "UOM",
    bdr.share_capacity_flag AS "Share Capacity?",
    -- Liên kết kiểm tra tài khoản hạch toán chi phí
    ca.activity AS "Activity Cost Code"
FROM 
    apps.bom_departments bd
INNER JOIN apps.bom_department_resources bdr ON bd.department_id = bdr.department_id
INNER JOIN apps.bom_resources br ON br.resource_id = bdr.resource_id
INNER JOIN apps.org_organization_definitions ood ON bd.organization_id = ood.organization_id
LEFT JOIN apps.cst_activities ca ON br.default_activity_id = ca.activity_id
WHERE 
    ood.organization_code = 'V1' -- Thay thế bằng mã Org thực tế của bạn
ORDER BY 
    bd.department_code, br.resource_code;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Sử dụng câu lệnh này để truy vấn xem các máy đơn lẻ (`Resource`) đang được gán vào nhóm nào (`Resource Group`) và chúng đang áp dụng lịch hoạt động nào:

```sql
SELECT 
    rg.Company AS [Company],
    rg.ResourceGrpID AS [Resource Group ID],
    rg.Description AS [Resource Group Name],
    r.ResourceID AS [Resource ID],
    r.Description AS [Resource Name],
    r.ActiveTrans AS [Is Resource Active?],
    rg.ProdCalID AS [Calendar ID],
    rg.JCDept AS [Department Code],
    r.DailyProdQty AS [Daily Production Qty Limit]
FROM 
    Erp.ResourceGroup rg
INNER JOIN 
    Erp.Resource r ON rg.Company = r.Company AND rg.ResourceGrpID = r.ResourceGrpID
WHERE 
    rg.ActiveGroup = 1 -- Chỉ lấy các nhóm tài nguyên đang hoạt động
ORDER BY 
    rg.Company, rg.ResourceGrpID, r.ResourceID;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Do SAP lưu trữ thông tin Work Center sử dụng cơ chế mã hóa Object (`OBJTY` / `OBJID`), câu lệnh dưới đây sẽ giải mã đối tượng và liên kết với bảng mô tả văn bản:

```sql
SELECT 
    h.WERKS AS "Plant",
    h.ARBPL AS "Work Center",
    t.KTEXT AS "Description",
    h.VERAN AS "Responsible Person Code",
    h.VERWE AS "Work Center Category",
    h.PLANV AS "Usage Key",
    -- Trạng thái xóa
    CASE WHEN h.LVORM = 'X' THEN 'Flagged for Deletion' ELSE 'Active' END AS "Status"
FROM 
    saphanadb.CRHD h
LEFT OUTER JOIN 
    saphanadb.CRTX t ON h.OBJTY = t.OBJTY 
                    AND h.OBJID = t.OBJID 
                    AND t.SPRAS = 'E' -- Lấy ngôn ngữ tiếng Anh (English)
WHERE 
    h.WERKS = '1000' -- Lọc theo Plant thực tế
ORDER BY 
    h.ARBPL;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh mục Work Center từ cơ sở dữ liệu PostgreSQL của Odoo để kiểm tra các thông số OEE mục tiêu và chi phí hoạt động trên mỗi giờ:

```sql
SELECT 
    wc.code AS "Work Center Code",
    wc.name AS "Work Center Name",
    rc.name AS "Working Hours Calendar",
    wc.capacity AS "Capacity units",
    wc.oee_target AS "Target OEE (%)",
    wc.costs_hour AS "Cost Per Hour",
    wc.active AS "Is Active?"
FROM 
    mrp_workcenter wc
LEFT JOIN 
    resource_calendar rc ON wc.resource_calendar_id = rc.id
WHERE 
    wc.active = true
ORDER BY 
    wc.code;
