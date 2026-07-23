---
id: 1030-nang-suat-hieu-suat-thiet-ke
title: Xác định Năng suất & Hiệu suất thiết kế (Capacity & Efficiency)
sidebar_label: 1030 - Năng suất & Hiệu suất
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/1030-nang-suat-hieu-suat-thiet-ke
date: 2026-09-08
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, capacity, efficiency, oee, sql]
---

# Xác định Năng suất & Hiệu suất thiết kế (Capacity & Efficiency)

Một sai lầm phổ biến khi lập kế hoạch sản xuất là giả định nhà xưởng hoạt động với 100% năng lực thiết kế. Thực tế, máy móc cần dừng để thay dao, bảo trì; công nhân cần thời gian chuyển giao ca; và tỷ lệ sản phẩm lỗi luôn tồn tại. Nếu không cấu hình chính xác **Hệ số năng suất (Capacity)** và **Hiệu suất (Efficiency)**, hệ thống ERP sẽ tính toán thời gian giao hàng (Lead Time) quá ngắn, dẫn đến trễ hạn đơn hàng hàng loạt.

Bài viết này phân tích kiến trúc dữ liệu, thuật toán tính toán độ tải năng lực (Capacity Load) và các kịch bản điều tiết năng suất thực tế trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Để tính toán năng lực khả dụng, các hệ thống ERP lưu trữ các tham số về số lượng tài nguyên chạy song song (`Capacity Units` / `Count`), hệ số hiệu quả công nghệ (`Efficiency`) và hệ số khai thác thời gian (`Utilization`).

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Số lượng máy/Người song song (Units)** | `BOM_DEPARTMENT_RESOURCES` (Cột `capacity_units`) | Không có cột cố định trên `Erp.ResourceGroup`; năng lực được tính động theo số bản ghi con trong `Erp.Resource` có cùng `ResourceGrpID`. | `saphanadb.KAKO` (Cột `ANZAP` - No. of Individual Capacities) | `mrp.workcenter` (Cột `capacity`) |
| **Hệ số hiệu suất (Efficiency Rate)** | `BOM_DEPARTMENT_RESOURCES` (Cột `efficiency` dưới dạng số thập phân) | `Erp.ResourceGroup` / `Erp.Resource` (Cột `EfficiencyPercent`) | `saphanadb.KAKO` (Tính gián tiếp thông qua hệ số hiệu suất định mức) | `mrp.workcenter` (Cột `time_efficiency` dưới dạng tỷ lệ %) |
| **Hệ số khai thác thời gian (Utilization)** | `BOM_DEPARTMENT_RESOURCES` (Cột `utilization` - tỷ lệ khai thác) | Không tách riêng (Nằm chung trong `EfficiencyPercent`) | `saphanadb.KAKO` (Cột `NUTZG` - Capacity Utilization Rate %) | `mrp.workcenter` (Cột `oee_target` - OEE mục tiêu) |
| **Cờ giới hạn năng lực (Finite Capacity Flag)** | Ngầm định qua cơ chế Constraint-Based Scheduling của phân hệ APS. | `Erp.ResourceGroup` (Cột `FiniteCapacity` - Boolean) | Ngầm định qua Capacity Category + Finite Scheduling trong PP/DS. | Ngầm định qua Work Center + module Advanced Planning. |
| **Lịch sử dừng máy (Downtime Logs)** | Tích hợp qua hệ thống EAM / WIP Transactions | Ghi nhận trực tiếp dưới dạng dòng lao động gián tiếp trong **`Erp.LaborDtl`** (trường `IndirectCode`) liên kết với danh mục lý do dừng máy thuộc bảng **`Erp.Indirect`** | `saphanadb.AFIH` / `saphanadb.AUFK` (Lịch sử bảo trì và dừng máy PM) | `mrp.workcenter.productivity` (Lưu chi tiết các block dừng máy và mã lỗi OEE) |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

Do triết lý thiết kế khác nhau, quy trình thao tác cấu hình của người dùng trên màn hình các hệ thống cũng có sự khác biệt rõ rệt:

### a. Hệ thống Oracle EBS (Cấu hình qua Department Resources — Bảng: `BOM_DEPARTMENT_RESOURCES`)
Oracle EBS cho phép khai báo chi tiết Hiệu suất (`Efficiency`) và Hệ số sử dụng (`Utilization`) độc lập cho từng cặp Department - Resource:
1. **Bước 1 (Vao màn hình cấu hình):** Truy cập `BOM > Departments > Departments`, tìm phòng ban sản xuất và chọn nút `Resources`.
2. **Bước 2 (Nhập tham số năng lực):** Tại dòng Resource tương ứng, người dùng nhập:
   - `Assigned Units` (field DB: `CAPACITY_UNITS`): Số lượng máy/người chạy song song (ví dụ: `3`).
   - `Efficiency` (field DB: `EFFICIENCY`): Nhập hệ số hiệu suất dưới dạng số thập phân (ví dụ: `0.90` tương đương 90%).
   - `Utilization` (field DB: `UTILIZATION`): Nhập hệ số khai thác thời gian dưới dạng số thập phân (ví dụ: `0.95` tương đương 95%).
3. **Bước 3 (Kế hoạch chạy MRP/WIP):** Hệ thống sẽ nhân cả 2 hệ số này để tính ra năng lực khả dụng thực tế.

### b. Hệ thống Epicor ERP (Cấu hình trên Resource Group / Resource — Bảng: `Erp.ResourceGroup` / `Erp.Resource`)
Epicor cho phép kế thừa thông số hiệu suất từ cấp Group xuống cấp Resource chi tiết:
1. **Bước 1 (Thiết lập cấp Group):** Vào `Resource Group Maintenance`, nhập các tham số:
   - `Efficiency` (field DB: `EfficiencyPercent`): Hệ số hiệu suất của cả nhóm (ví dụ: `85.00%`).
   - `Finite Capacity` (field DB: `FiniteCapacity`): Tích chọn cờ này (Boolean) để báo cho công cụ lập lịch APS biết phải giới hạn tải sản xuất khi máy đạt 100% công suất cấu hình.
2. **Bước 2 (Gán đặc thù cho từng Resource máy con):** Nếu có một máy hoạt động tốt hơn, người dùng có thể vào `Resource Maintenance` của riêng máy đó để ghi đè trường `Efficiency %` (field DB: `EfficiencyPercent` - ví dụ: sửa thành `95.00%`).

### c. Hệ thống SAP S/4HANA (Cấu hình trên các Tab — Bảng: `CRHD` / `KAKO` / `CRCA`)
SAP tách biệt rõ ràng giữa thời gian hoạt động vật lý và tỷ lệ khai thác năng lực thực tế:
1. **Bước 1 (Thiết lập Capacity Header):** Trong T-Code `CR02` (Sửa Work Center), chuyển sang tab `Capacities`, bấm đúp vào Capacity Category.
2. **Bước 2 (Nhập tham số định mức):**
   - `No. of indiv. capacities` (field DB: `ANZAP`): Nhập số lượng tài nguyên chạy song song (ví dụ: `2` máy).
   - `Operating time` (field DB: `NGEHT`): Thời gian hoạt động cơ sở lưu dưới dạng giây (ví dụ: `8` giờ/ngày).
   - `Capacity utilization` (field DB: `NUTZG`): Nhập tỷ lệ khai thác năng lực thực tế (ví dụ: `90%`). Hệ thống tự động tính toán năng lượng khả dụng dựa trên tỷ lệ này.

### d. Hệ thống Odoo ERP (Cấu hình Tối giản — Bảng: `mrp.workcenter`)
Odoo đi theo triết lý tối giản thông tin để người dùng vận hành nhanh chóng:
1. **Bước 1 (Vào form cấu hình):** Truy cập `Manufacturing > Configuration > Work Centers`.
2. **Bước 2 (Nhập tham số hiệu suất):**
   - `Capacity` (field DB: `capacity`): Số lượng bán thành phẩm có thể xử lý cùng một lúc (ví dụ: máy sấy sơn sấy được `10` sản phẩm/mẻ).
   - `Time Efficiency` (field DB: `time_efficiency`): Hệ số hiệu suất thời gian dưới dạng tỷ lệ % (ví dụ: nhập `90` tương đương 90%).
   - `OEE Target` (field DB: `oee_target`): Thiết lập hiệu suất thiết bị tổng thể mục tiêu dưới dạng % để hệ thống đo lường và hiển thị biểu đồ phân tích thực tế.

---

## 3. Thuật toán quy đổi Năng suất & Cân bằng năng lực (Capacity Load Calculation)

Khi chạy kế hoạch sản xuất, công cụ MRP/APS sẽ so sánh **Nhu cầu năng lực (Required Capacity)** từ các Lệnh sản xuất với **Năng lực khả dụng (Available Capacity)** của Work Center để tính ra **Độ tải (Capacity Load %)**.

### Công thức tính Năng lực khả dụng thực tế trong kỳ (Available Capacity):
$$\text{Available Capacity (Hours)} = \text{Operating Hours} \times \text{Capacity Units} \times \text{Efficiency Rate} \times \text{Utilization Rate}$$

### Công thức tính Độ tải (Load %):
$$\text{Capacity Load (\%)} = \left( \frac{\text{Required Capacity (Hours)}}{\text{Available Capacity (Hours)}} \right) \times 100$$

### Kịch bản tính toán thực tế:
Nhà máy cần kiểm tra độ tải của Tổ hàn (`WC_WELD`) trong tuần đầu tiên của tháng 09/2026.
- Tổ hàn hoạt động 1 ca **8 giờ/ngày**, tuần làm việc **6 ngày** $\rightarrow$ Tổng thời gian hoạt động cơ sở = **48 giờ/tuần**.
- Tổ hàn có **5 công nhân** (`Capacity Units = 5`).
- Hệ số hiệu suất thực tế của tổ = **85%** (`0.85`), hệ số khai thác thời gian = **95%** (`0.95`).
- Bộ phận Kế hoạch giải phóng 4 Lệnh sản xuất yêu cầu tổng thời gian hàn thực tế của cả tuần là **220 giờ**.

**Bộ tính toán lập lịch (APS Engine) sẽ chạy thuật toán:**
1. Tính năng lực khả dụng thực tế của Tổ hàn trong tuần:
   $$\text{Available Capacity} = 48 \text{ giờ} \times 5 \text{ người} \times 0.85 \times 0.95 = 193.8 \text{ giờ công}$$
2. Tính Độ tải (Load %):
   $$\text{Capacity Load} = \left( \frac{220 \text{ giờ}}{193.8 \text{ giờ}} \right) \times 100 \approx 113.52\%$$

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Năng lực & Hiệu suất

### Bài toán 1: Khấu trừ thời gian dừng máy đột xuất (Downtime) và bảo trì vào kế hoạch năng lực
*   **Thách thức:** Máy CNC đang chạy thì gặp sự cố hỏng trục khuỷu, phải dừng sửa chữa 4 tiếng. Làm thế nào để hệ thống ERP lập tức cập nhật năng lực khả dụng còn lại của ngày hôm đó để điều tiết các lệnh sản xuất khác đang xếp hàng đợi?
*   **Giải pháp thực tế:**
    *   **Trong Odoo ERP:** Công nhân báo cáo máy hỏng qua giao diện MES, hệ thống tự động tạo bản ghi dừng máy trong bảng `mrp.workcenter.productivity` với mã lỗi OEE là `Equipment Failure` (Dừng máy do hỏng thiết bị). Bản ghi này lập tức khóa (block) năng lực của Work Center trong 4 tiếng đó. Công cụ scheduler của Odoo sẽ tự động đẩy lùi thời gian bắt đầu dự kiến của các Lệnh sản xuất tiếp theo xuống 4 tiếng trên trục thời gian.
    *   **Trong SAP S/4HANA:** Khi phân hệ PM (Plant Maintenance) phát sinh một Lệnh sửa chữa khẩn cấp (Breakdown Maintenance Order), hệ thống tự động cập nhật tình trạng thiết bị. Khi chạy kiểm tra năng lực sản xuất (T-Code `CM21`), điều độ viên sẽ nhìn thấy vùng năng lực bị chiếm dụng bởi lệnh bảo trì (màu đỏ) và tiến hành kéo thả (Drag & Drop) dời lịch các lệnh sản xuất khác sang máy dự phòng.

### Bài toán 2: Điều tiết năng lực sản xuất linh hoạt khi thiếu hụt nhân sự đột xuất (Dynamic Capacity Change)
*   **Thách thức:** Ngày Thứ Tư, có 2 công nhân trong Tổ lắp ráp xin nghỉ ốm, khiến số lượng nhân công thực tế giảm từ 5 xuống 3. Làm sao để bộ phận kế hoạch điều chỉnh nhanh năng lực của ngày Thứ Tư đó mà không làm ảnh hưởng đến cấu hình năng lực chuẩn của các ngày khác?
*   **Giải pháp thực tế trên Oracle EBS:**
    *   Vào màn hình cấu hình `Department Resources`, bấm nút `Capacity Changes`.
    *   Thêm mới một dòng ghi đè năng lực cho ngày cụ thể:
        - `Date`: Chọn ngày Thứ Tư (`09/09/2026`).
        - `Capacity Change Type`: Chọn `Reduce Capacity` (Giảm năng lực).
        - `Value`: Nhập `-2` (Giảm 2 nhân công).
    *   Hệ thống sẽ chạy tính toán lại năng lực khả dụng duy nhất cho ngày Thứ Tư đó là 3 nhân công, các ngày khác vẫn giữ nguyên cấu hình tiêu chuẩn là 5 nhân công.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Năng suất & Hiệu suất

### a. Trên hệ thống Oracle EBS (PL/SQL)
Kiểm tra chi tiết năng suất lý thuyết và năng suất thực tế (sau khi nhân hệ số Efficiency và Utilization) của tất cả các tài nguyên trong các phòng ban sản xuất:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    bd.department_code AS "Dept Code",
    bd.description AS "Dept Name",
    br.resource_code AS "Resource Code",
    bdr.capacity_units AS "Capacity Units",
    bdr.efficiency AS "Efficiency Rate",
    bdr.utilization AS "Utilization Rate",
    -- Tính toán năng lực thực tế khả dụng cho 1 giờ chạy máy tiêu chuẩn của nhóm
    (bdr.capacity_units * bdr.efficiency * bdr.utilization) AS "Real Capacity per Hour"
FROM 
    apps.bom_departments bd
INNER JOIN apps.bom_department_resources bdr ON bd.department_id = bdr.department_id
INNER JOIN apps.bom_resources br ON br.resource_id = bdr.resource_id
INNER JOIN apps.org_organization_definitions ood ON bd.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Lọc theo Org thực tế của bạn
ORDER BY 
    bd.department_code, br.resource_code;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách tất cả các Resource Group để kiểm tra hệ số hiệu suất (`EfficiencyPercent`) và xem nhóm nào đang áp dụng cơ chế giới hạn năng lực khi lập lịch (`Finite Capacity`):

```sql
SELECT 
    Company,
    ResourceGrpID AS [Resource Group ID],
    Description AS [Group Name],
    ActiveGroup AS [Is Active?],
    FiniteCapacity AS [Is Finite Capacity?],
    EfficiencyPercent AS [Efficiency (%)],
    ProdCalID AS [Production Calendar ID],
    JCDept AS [Dept Code]
FROM 
    Erp.ResourceGroup
WHERE 
    Company = 'EP01'
ORDER BY 
    ResourceGrpID;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Giải mã thông tin Work Center để truy vấn số lượng tài nguyên chạy song song (`ANZAP`) và tỷ lệ khai thác năng lực (`NUTZG`) lưu trong bảng cấu hình năng lực của SAP:

```sql
SELECT 
    h.WERKS AS "Plant",
    h.ARBPL AS "Work Center",
    t.KTEXT AS "Description",
    c.KAPID AS "Capacity ID",
    c.ANZAP AS "No. of Indiv. Capacities",
    c.NUTZG AS "Capacity Utilization (%)",
    -- Định mức thời gian làm việc chuẩn trong ngày (lưu dưới dạng 1/10000 giây trong database)
    (c.NGEHT / 10000 / 3600) AS "Standard Work Hours/Day"
FROM 
    saphanadb.CRHD h
INNER JOIN saphanadb.KAKO c ON h.OBJID = c.OBJID
LEFT OUTER JOIN saphanadb.CRTX t ON h.OBJTY = t.OBJTY AND h.OBJID = t.OBJID AND t.SPRAS = 'E'
WHERE 
    h.WERKS = '1000'
ORDER BY 
    h.ARBPL;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn thông số năng lực sấy/gia công đồng thời (`Capacity`), hiệu suất thời gian (`Time Efficiency`) và đích OEE để đánh giá chất lượng thiết lập Work Center:

```sql
SELECT 
    name AS "Work Center",
    capacity AS "Batch Capacity Units",
    time_efficiency AS "Time Efficiency (%)",
    oee_target AS "Target OEE (%)",
    active AS "Is Active?"
FROM 
    mrp_workcenter
WHERE 
    active = true
ORDER BY 
    name;