---
id: 1040-lien-ket-work-center-cost-center
title: Liên kết Trung tâm công việc với Trung tâm chi phí và Loại hoạt động
description: Liên kết Trung tâm công việc với Trung tâm chi phí và Loại hoạt động (Cost Center & Activity Type Assignment)
sidebar_label: Liên kết Cost Center & Activity Type
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/1040-lien-ket-work-center-cost-center
sidebar_position: 1040
date: 2026-09-09
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, cost-center, activity-type, costing, sql]
---

# 1040 Liên kết Trung tâm công việc với Trung tâm chi phí và Loại hoạt động (Cost Center & Activity Type Assignment)

> **Lưu ý nghiệp vụ:** Bài viết này giả định các Trung tâm chi phí (Cost Center) và Loại hoạt động (Activity Type) đã được phòng Kế toán quản trị / Controlling tạo sẵn trên hệ thống tài chính. Quy trình khởi tạo các đối tượng này sẽ được trình bày chi tiết trong bài viết **1000 (FIN - Cấu hình thành phần chi phí sản xuất, trung tâm chi phí và tài khoản giá thành)** thuộc phân hệ Kế toán Giá thành (bài viết này hiện đang trong lộ trình biên soạn, chưa có liên kết).

---

Trung tâm công việc (Work Center) không chỉ là nơi chế tạo ra sản phẩm mà còn là nơi tiêu hao chi phí (khấu hao máy, nhân công, điện năng, nhà xưởng). Để hệ thống ERP tự động tính toán giá thành sản phẩm chính xác theo thời gian thực (WIP Costing), phân hệ **Sản xuất (MFG)** bắt buộc phải liên kết chặt chẽ với phân hệ **Tài chính/Kế toán quản trị (FICO)** thông qua việc gán Work Center vào một **Trung tâm chi phí (Cost Center)** và định nghĩa các đơn giá hoạt động (**Activity Types & Rates**).

Bài viết này phân tích sâu kiến trúc dữ liệu liên kết tài chính sản xuất, luồng thiết lập và cách kiểm tra cấu hình giá thành hoạt động trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu liên kết Tài chính - Sản xuất

Về mặt dữ liệu, mối liên kết này nối một đối tượng đại diện cho năng lực sản xuất (Work Center) với một tài khoản gom chi phí kế toán (Cost Center) và một danh mục đơn giá giờ công chạy máy (Activity Type Rates).

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất liên kết** | Liên kết phòng ban (`Department`) sang phân hệ kế toán giá thành (`Costing`) thông qua Resource Rate. | Liên kết nhóm máy (`ResourceGroup`) sang mã phân bổ tài chính phòng ban (`Department GL Control`). | Liên kết trực tiếp giữa đầu mục `Work Center` sang `Cost Center` và gán bảng đơn giá giờ công hoạt động. | Gán trực tiếp tài khoản phân tích giá thành và đơn giá chạy máy vào Work Center. |
| **Bảng liên kết chính (Mapping Table)** | `BOM_DEPARTMENT_RESOURCES` và **`CST_RESOURCE_COSTS`** (Lưu trữ đơn giá hoạt động của tài nguyên). | **`Erp.JCDept`** (Department master chứa các GL Control định khoản chi phí nhân công và máy). | **`saphanadb.CRCO`** (Bảng trung gian liên kết trực tiếp giữa Work Center và Cost Center). | **`mrp.workcenter`** (Lưu trữ đơn giá giờ chạy máy và liên kết tài khoản phân tích). |
| **Trung tâm chi phí (Cost Center)** | Liên kết gián tiếp qua cặp tài khoản Cost Code trên phòng ban (`BOM_DEPARTMENTS`). | `Erp.JCDept` liên kết sang các tài khoản chi phí sản xuất dở dang (WIP). | `CRCO.KOSTL` (Trỏ trực tiếp sang mã Cost Center thuộc phân hệ CO - bảng `CSKS`). | `mrp.workcenter.analytic_account_id` (Trỏ sang tài khoản phân tích giá thành). |
| **Loại hoạt động (Activity Type)** | `BOM_RESOURCES.default_activity_id` (Liên kết sang hoạt động tính giá thành). | Phân tách sẵn thành hai cột giá trị trực tiếp: `LaborRate` (Nhân công) và `BurdenRate` (Máy móc). | `CRCO.LSTAR` (Trỏ sang mã Activity Type định nghĩa loại hoạt động dập, sơn, hàn - bảng `CSLA`). | Không phân tách mặc định (Gộp chung thành chi phí vận hành máy và người trên mỗi giờ). |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình qua Department Resources — Bảng: `BOM_DEPARTMENT_RESOURCES` / `CST_RESOURCE_COSTS`)
Oracle EBS quản lý đơn giá hoạt động độc lập theo từng chi nhánh nhà máy:
1. **Bước 1 (Gán Resource vào Phòng ban):** Truy cập `BOM > Departments > Departments`, bấm nút `Resources` để gán tài nguyên vào phòng ban.
2. **Bước 2 (Thiết lập Đơn giá hoạt động):** Truy cập phân hệ giá thành `Costing > Setup > Sub-Elements > Resources`, chọn nút **`Rates`** (field DB: `resource_rate`). Người dùng nhập đơn giá cho mỗi đơn vị hoạt động (ví dụ: `15.00` USD / giờ máy chạy).
3. **Bước 3 (Gán hoạt động mặc định):** Trên form Resource, tại trường `Default Activity` (field DB: `default_activity_id`), chọn loại hoạt động hạch toán chi phí tương ứng.

### b. Hệ thống Epicor ERP (Cấu hình trên Resource Group / Department — Bảng: `Erp.ResourceGroup` / `Erp.JCDept`)
Epicor phân tách rõ ràng đơn giá nhân công trực tiếp và đơn giá khấu hao vận hành máy:
1. **Bước 1 (Cấu hình Department GL Control):** Phòng Kế toán truy cập `JC Department Maintenance` để định nghĩa mã phòng ban sản xuất (field DB: `JCDept`) và cấu hình bộ tài khoản hạch toán chi phí (GL Control).
2. **Bước 2 (Gán vào nhóm máy):** Truy cập `Resource Group Maintenance`, tại trường `Department` (field DB: `JCDept`), người dùng chọn mã phòng ban đã khai báo ở Bước 1.
3. **Bước 3 (Nhập đơn giá giờ công):** Tại tab `Detail`, người dùng cấu hình trực tiếp:
   - `Labor Rate` (field DB: `LaborRate`): Đơn giá nhân công vận hành (ví dụ: `50,000` VNĐ/giờ).
   - `Burden Rate` (field DB: `BurdenRate`): Đơn giá vận hành máy/khấu hao (ví dụ: `150,000` VNĐ/giờ).

### c. Hệ thống SAP S/4HANA (Cấu hình trên tab Costing — Bảng: `CRHD` / `CRCO`)
SAP quản lý hạch toán giá thành sản xuất tinh vi nhất thông qua việc liên kết trực tiếp Work Center với Cost Center và Activity Types:
1. **Bước 1 (Vào tab Costing):** Trong T-Code `CR02` (Sửa Work Center), người dùng chuyển sang tab **`Link to Cost Center / Controlling`**.
2. **Bước 2 (Gán Cost Center):** Tại trường `Cost Center` (field DB: `KOSTL`), nhập mã trung tâm chi phí đại diện cho xưởng sản xuất (ví dụ: `CC_CUTTING` - Xưởng cắt phôi).
3. **Bước 3 (Nhập Activity Types & Công thức):** Tại bảng lưới bên dưới, gán các hoạt động công nghệ tương ứng:
   - Cột `Activity Type` (field DB: `LSTAR`): Chọn loại hoạt động nhân công (ví dụ: `LAB_STD`) hoặc hoạt động chạy máy (ví dụ: `MAC_STD`).
   - Cột `Formula Key` (field DB: `FORMA`): Gán công thức tính toán chi phí tương ứng (ví dụ: chọn công thức `SAP006` để hệ thống tự động nhân thời gian chạy máy thực tế của lệnh sản xuất với đơn giá kế hoạch cấu hình tại bảng đơn giá `KP26`).

### d. Hệ thống Odoo ERP (Cấu hình Tối giản — Bảng: `mrp.workcenter` / `account.analytic.account`)
Odoo tối giản hóa bằng cách gộp chi phí chạy máy và nhân công thành một đơn giá giờ công duy nhất liên kết với tài khoản phân tích:
1. **Bước 1 (Vào form cấu hình):** Truy cập `Manufacturing > Configuration > Work Centers`.
2. **Bước 2 (Nhập chi phí giờ chạy):** Tại trường **`Cost per hour`** (field DB: `costs_hour`), nhập đơn giá tổng hợp trên mỗi giờ hoạt động (ví dụ: nhập `350,000` VNĐ/giờ bao gồm cả khấu hao máy và lương nhân công trông máy).
3. **Bước 3 (Liên kết Tài khoản phân tích):** Tại trường **`Analytic Account`** (field DB: `analytic_account_id`), chọn tài khoản phân tích tương ứng để hệ thống tự động hạch toán chi phí phát sinh khi đóng Lệnh sản xuất.

---

## 3. Thuật toán phân bổ chi phí hoạt động vào Giá thành sản phẩm

Khi một Lệnh sản xuất hoàn thành, hệ thống ERP sẽ tự động trích xuất dữ liệu ghi nhận thời gian chạy máy thực tế để nhân với đơn giá hoạt động cấu hình trên Work Center, từ đó tính ra chi phí sản xuất dở dang (WIP).

### Công thức tính Chi phí hoạt động thực tế (Actual Activity Cost):
$$\text{Chi phí Hoạt động thực tế} = \text{Thời gian thực tế ghi nhận (Giờ)} \times \text{Đơn giá hoạt động của Activity Type (Rate/Hour)}$$

### Ví dụ áp dụng thực tế:
Lệnh sản xuất dập thép tấm hoàn thành công đoạn dập hết **5.5 giờ chạy máy thực tế** và **1.2 giờ chuẩn bị máy (Setup)** của nhân công.
Thông số đơn giá cấu hình trên hệ thống liên kết với Work Center:
- Đơn giá chạy máy dập (`Activity Type: MACHINE`): **150.000 VNĐ / Giờ**.
- Đơn giá chuẩn bị máy (`Activity Type: LABOR`): **80.000 VNĐ / Giờ**.

**Hệ thống kế toán sản xuất tự động chạy thuật toán phân bổ chi phí:**
1. Tính chi phí vận hành máy dập thực tế:
   $$\text{Chi phí chạy máy} = 5.5 \text{ giờ} \times 150,000 \text{ VNĐ/giờ} = 825,000 \text{ VNĐ}$$
2. Tính chi phí nhân công setup thực tế:
   $$\text{Chi phí nhân công setup} = 1.2 \text{ giờ} \times 80,000 \text{ VNĐ/giờ} = 96,000 \text{ VNĐ}$$
3. Tổng chi phí hoạt động phân bổ vào lệnh sản xuất này = $825,000 + 96,000 = 921,000 \text{ VNĐ}$.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Giá thành hoạt động

### Bài toán 1: Tách biệt chi phí khấu hao máy (Burden Cost) và chi phí nhân công (Labor Cost)
*   **Thách thức:** Trong nhà máy tự động hóa, một cánh tay robot hàn có chi phí khấu hao máy cực kỳ cao (ví dụ: 1.000.000 VNĐ/giờ), nhưng chi phí nhân công đứng giám sát lại rất thấp (chỉ 40.000 VNĐ/giờ). Nếu hệ thống gộp chung hai chi phí này vào một đơn giá, doanh nghiệp sẽ không thể phân tích được đâu là chi phí khấu hao tài sản cố định, đâu là chi phí lao động để tối ưu hóa hiệu quả đầu tư.
*   **Giải pháp thực tế:**
    - Trên **SAP S/4HANA**, ta gán đồng thời 2 dòng Activity Type khác nhau trên cùng một Work Center: Dòng 1 chọn loại hoạt động máy `MACHINE` kết hợp công thức tính giờ máy; Dòng 2 chọn loại hoạt động nhân công `LABOR` kết hợp công thức tính giờ công nhân. Hệ thống kế toán chi phí (CO-PC) sẽ tách biệt rõ ràng hai khoản này trên báo cáo giá thành sản phẩm chi tiết (Cost Component Split).
    - Trên **Epicor ERP**, cấu hình trực tiếp hai tài khoản GL Control khác nhau cho `Labor` và `Burden` trên bảng Department của nhóm máy đó. Hệ thống sẽ tự động hạch toán tách biệt chi phí nhân công trực tiếp (Direct Labor) và chi phí khấu hao sản xuất (Applied Burden) trên sổ cái kế toán.

### Bài toán 2: Đồng bộ biến động đơn giá hoạt động giữa kỳ kế toán tài chính
*   **Thách thức:** Đơn giá chạy máy tính toán dựa trên chi phí điện năng tiêu thụ thực tế. Vào đầu năm, đơn giá điện rẻ nên kế toán đặt đơn giá chạy máy dập là 100.000 VNĐ/giờ. Giữa năm, giá điện tăng khiến chi phí thực tế vọt lên 130.000 VNĐ/giờ. Làm thế nào để cập nhật đơn giá này mà không gây xáo trộn số liệu lịch sử của các tháng trước đó?
*   **Giải pháp thực tế:**
    Hệ thống ERP lớn quản lý đơn giá hoạt động theo **Kỳ kế toán (Accounting Periods / Fiscal Year)**:
    - Trong **SAP S/4HANA**, đơn giá hoạt động trong T-Code `KP26` được thiết lập theo từng tháng cụ thể (ví dụ: Tháng 1 - Tháng 6 nhập đơn giá `100,000`, Tháng 7 - Tháng 12 cập nhật đơn giá `130,000`).
    - Khi đóng kỳ kế toán tháng, hệ thống sẽ tự động đối chiếu và áp đúng đơn giá của tháng đó để chạy tiến trình đánh giá lại giá thành thực tế (Actual Costing Rollup - T-Code `CKMLCP`), đảm bảo tính chính xác tuyệt đối của giá trị hàng tồn kho cuối kỳ mà không ảnh hưởng đến số liệu lịch sử.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu liên kết giá thành

### a. Trên hệ thống Oracle EBS (PL/SQL)
Kiểm tra mối liên kết giữa Department, Resource, mã hoạt động mặc định và đơn giá hoạt động kế hoạch của tài nguyên trong nhà máy:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    bd.department_code AS "Dept Code",
    bd.description AS "Dept Name",
    br.resource_code AS "Resource Code",
    br.description AS "Resource Name",
    -- Đọc đơn giá hoạt động kế hoạch của tài nguyên
    crc.resource_rate AS "Resource Rate/Hour",
    ca.activity AS "Default Activity Code",
    ca.description AS "Activity Description"
FROM 
    apps.bom_departments bd
INNER JOIN apps.bom_department_resources bdr ON bd.department_id = bdr.department_id
INNER JOIN apps.bom_resources br ON br.resource_id = bdr.resource_id
INNER JOIN apps.org_organization_definitions ood ON bd.organization_id = ood.organization_id
-- Liên kết sang phân hệ giá thành Costing để lấy đơn giá hoạt động
LEFT JOIN apps.cst_resource_costs crc ON br.resource_id = crc.resource_id AND ood.organization_id = crc.organization_id
LEFT JOIN apps.cst_activities ca ON br.default_activity_id = ca.activity_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
ORDER BY 
    bd.department_code, br.resource_code;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn thông tin nhóm máy, phòng ban kế toán liên kết (`JCDept`) và chi tiết đơn giá lao động (`LaborRate`), đơn giá máy (`BurdenRate`) của Epicor:

```sql
SELECT 
    rg.Company,
    rg.ResourceGrpID AS [Resource Group ID],
    rg.Description AS [Resource Group Name],
    -- Liên kết sang bộ tài khoản hạch toán JCDept
    rg.JCDept AS [Department / Cost Center],
    dept.Description AS [Department Description],
    rg.LaborRate AS [Labor Rate/Hour],       -- Đơn giá nhân công trực tiếp
    rg.BurdenRate AS [Burden/Machine Rate]    -- Đơn giá khấu hao máy vận hành
FROM 
    Erp.ResourceGroup rg
LEFT JOIN 
    Erp.JCDept dept ON rg.Company = dept.Company AND rg.JCDept = dept.JCDept
WHERE 
    rg.Company = 'EP01'
ORDER BY 
    rg.ResourceGrpID;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Giải mã thông tin liên kết trực tiếp giữa Work Center Header (`CRHD`), Cost Center (`KOSTL`) và các loại hoạt động hạch toán (`LSTAR`) từ bảng liên kết trung gian `CRCO` của SAP:

```sql
SELECT 
    co.WERKS AS "Plant",
    h.ARBPL AS "Work Center Code",
    h.KTEXT AS "Work Center Name",
    co.KOSTL AS "Assigned Cost Center", -- Trung tâm chi phí thuộc phân hệ CO
    co.LSTAR AS "Activity Type Code",    -- Loại hoạt động hạch toán (Máy, người, setup)
    co.FORMA AS "Costing Formula Key"    -- Khóa công thức tính chi phí sản xuất
FROM 
    saphanadb.CRCO co
INNER JOIN 
    saphanadb.CRHD h ON co.OBJTY = h.OBJTY AND co.OBJID = h.OBJID
WHERE 
    co.MANDT = '100' -- Client của hệ thống SAP S/4HANA
    AND h.LVORM = ' ' -- Loại bỏ các Work Center đã bị xóa
ORDER BY 
    co.WERKS, h.ARBPL;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh mục Work Center kèm đơn giá chi phí chạy máy tổng hợp và tài khoản phân tích giá thành liên kết trong Odoo:

```sql
SELECT 
    wc.code AS "Work Center Code",
    wc.name AS "Work Center Name",
    wc.costs_hour AS "Total Cost Per Hour", -- Đơn giá tổng hợp chạy máy/giờ
    -- Liên kết tài khoản phân tích kế toán của Odoo
    aa.name AS "Linked Analytic Account (Cost Center)"
FROM 
    mrp_workcenter wc
LEFT JOIN 
    account_analytic_account aa ON wc.analytic_account_id = aa.id
WHERE 
    wc.active = true
ORDER BY 
    wc.code;
