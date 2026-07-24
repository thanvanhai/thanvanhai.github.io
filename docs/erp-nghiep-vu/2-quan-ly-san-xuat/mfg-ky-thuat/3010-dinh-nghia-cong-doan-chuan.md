---
id: 3010-dinh-nghia-cong-doan-chuan
title: Định nghĩa các Công đoạn sản xuất chuẩn (Standard Operations)
description: Định nghĩa các Công đoạn sản xuất chuẩn (Standard Operations)
sidebar_label: Công đoạn sản xuất chuẩn
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/3010-dinh-nghia-cong-doan-chuan
sidebar_position: 3010
date: 2026-10-02
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, standard-operations, routing, sql]
---

# 3010 Định nghĩa các Công đoạn sản xuất chuẩn (Standard Operations)

Khi nhà máy sản xuất hàng ngàn mã hàng khác nhau, việc thiết lập thủ công Quy trình công nghệ (Routing) cho từng sản phẩm là một gánh nặng hành chính khổng lồ và tiềm ẩn rủi ro sai lệch dữ liệu. Để giải quyết bài toán này, các hệ thống ERP cung cấp tính năng **Công đoạn sản xuất chuẩn (Standard Operations / Reference Operations)**. 

Đây là một "thư viện" các công đoạn mẫu đã được định nghĩa sẵn mô tả, máy móc thực hiện, tài nguyên tiêu hao và các cờ hạch toán kế toán. Khi xây dựng Routing, người dùng chỉ cần gọi mã công đoạn chuẩn, hệ thống sẽ tự động sao chép hoặc liên kết toàn bộ cấu hình mẫu sang sản phẩm mới.

Bài viết này phân tích sâu kiến trúc dữ liệu thư viện công đoạn chuẩn, luồng thiết lập và cách ứng dụng thực tế trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Để quản lý thư viện công đoạn mẫu, các hệ thống ERP thiết lập các bảng danh mục chuẩn (Master Data) độc lập, đóng vai trò làm khuôn mẫu để ánh xạ sang quy trình công nghệ của từng sản phẩm.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Định nghĩa danh mục công đoạn chuẩn (`Standard Operations`) độc lập theo từng Chi nhánh (Organization). | Quản lý qua danh mục **Operation Code** toàn cục, bắt buộc mọi công đoạn trên MoM phải liên kết về mã này. | Hỗ trợ 2 cấp độ: **Standard Text Key** (Công đoạn đơn lẻ) và **Reference Operation Set** (Nhóm công đoạn mẫu nhiều cấp). | Không có bảng danh mục công đoạn mẫu riêng biệt (Quản lý gián tiếp qua Work Center hoặc copy cấu hình). |
| **Bảng định nghĩa mẫu (Master Header)** | **`BOM_STANDARD_OPERATIONS`** (Lưu thông tin mã công đoạn chuẩn và Department mặc định). | **`Erp.OpMaster`** (Bảng danh mục các Operation gốc của hệ thống, kèm bảng chi tiết `Erp.OpMasDtl`). | **`T435T`** (Mã văn bản chuẩn) hoặc **`saphanadb.PLKO`** (Với loại Task List `PLNTY = S` - Reference Operation Set). | Sử dụng trực tiếp bảng **`mrp.routing.workcenter`** để lưu trữ các mẫu công đoạn chạy máy. |
| **Bảng tài nguyên gán kèm (Resources)** | `BOM_STD_OP_RESOURCES` (Gán sẵn các máy móc/nhân công mặc định cho công đoạn chuẩn). | `Erp.OpMaster` (Trường `ResourceGrpID` lưu nhóm máy mặc định của công đoạn). | `saphanadb.PLPO` (Định nghĩa sẵn danh sách Work Center và định mức thời gian trong nhóm mẫu). | Gán trực tiếp thiết bị bảo trì hoặc cấu hình mặc định trên Work Center. |

---

## 2. So sánh luồng thiết lập và Triết lý vận hành (UI Flows)

### a. Hệ thống Oracle EBS (Triết lý Thư viện Standard Operations)
Oracle EBS cho phép xây dựng danh mục công đoạn chuẩn rất chi tiết theo từng nhà máy:
1. **Bước 1 (Định nghĩa công đoạn mẫu):** Người dùng truy cập `BOM > Setup > Standard Operations`. Tạo mã công đoạn (ví dụ: `WELD_TIG` - Hàn TIG), gán Department mặc định (ví dụ: Tổ hàn) và cấu hình các cờ kiểm soát (ví dụ: bật cờ `Count Point` để bắt buộc trạm này phải báo cáo sản lượng).
2. **Bước 2 (Gán tài nguyên mặc định):** Bấm nút `Resources` dưới form để gán sẵn máy hàn và thợ hàn bậc 3 kèm đơn giá định mức vào công đoạn `WELD_TIG`.
3. **Bước 3 (Gọi ra sử dụng trên Routing):** Khi tạo Routing cho một sản phẩm mới, tại dòng công đoạn, người dùng chỉ cần chọn mã công đoạn chuẩn là `WELD_TIG`. Hệ thống tự động điền toàn bộ mô tả, Department, máy móc và đơn giá mà không cần nhập lại.

### b. Hệ thống Epicor ERP (Triết lý Bắt buộc liên kết Operation Code)
Epicor quản lý cực kỳ chặt chẽ dữ liệu sản xuất thông qua việc bắt buộc mọi công đoạn trong MoM phải tham chiếu về danh mục Operation gốc:
1. **Bước 1 (Tạo Operation Code gốc):** Truy cập `Production Management > Job Manager > Setup > Operation`. Tạo mã công đoạn (ví dụ: `PAINT_POWDER` - Sơn tĩnh điện), gán nhóm máy mặc định (`ResourceGrpID = RG_PAINT`) và thiết lập tài khoản hạch toán chi phí nhân công.
2. **Bước 2 (Áp dụng bắt buộc):** Khi kỹ sư thiết kế MoM trong Engineering Workbench, khi thêm một công đoạn (`Add Operation`), hệ thống **bắt buộc** người dùng phải chọn một `Op Code` hợp lệ từ danh mục ở Bước 1. Hệ thống sẽ kế thừa toàn bộ cấu hình gốc của mã `PAINT_POWDER` sang công đoạn đó.

### c. Hệ thống SAP S/4HANA (Triết lý Reference Operation Set - Task List Type S)
SAP cung cấp giải pháp mạnh mẽ hơn cho phép gom một chuỗi các công đoạn chuẩn thành một nhóm để tái sử dụng:
1. **Bước 1 (Tạo Reference Operation Set):** Dùng T-Code `CA11`, tạo một bộ quy trình công nghệ mẫu với loại Task List `PLNTY = S`. Tại đây, thiết lập một chuỗi các công đoạn (ví dụ: công đoạn 10: Vệ sinh bề mặt $\rightarrow$ công đoạn 20: Phun sơn lót $\rightarrow$ công đoạn 30: Sấy khô).
2. **Bước 2 (Gán điểm tham chiếu vào Routing):** Khi tạo Routing cho sản phẩm thực tế (`CA01`), người dùng không cần nhập lại 3 bước trên. Chỉ cần chọn tính năng gán và tham chiếu đến mã **Reference Operation Set** đã tạo ở Bước 1.

### d. Hệ thống Odoo ERP (Triết lý Tối giản và Tái sử dụng)
Odoo tối giản hóa bằng cách cho phép người dùng nhân bản (Duplicate) cấu hình nhanh chóng:
*   Hệ thống không quản lý danh mục công đoạn mẫu độc lập. Tuy nhiên, khi thiết lập BoM cho sản phẩm mới, người dùng có thể chọn tính năng sao chép toàn bộ công đoạn sản xuất từ một BoM của sản phẩm tương tự đã có sẵn để tiết kiệm thời gian nhập liệu.

---

## 3. Bản chất hành vi khi thay đổi dữ liệu mẫu: Reference vs. Copy

Một câu hỏi kiến trúc cực kỳ quan trọng khi triển khai ERP là: **"Khi chúng ta thay đổi cấu hình (mô tả, máy móc) của Công đoạn chuẩn trong danh mục mẫu, các Routing đang sử dụng công đoạn đó có tự động cập nhật theo không?"**.

Các hệ thống ERP lớn giải quyết bài toán này bằng hai cơ chế hành vi khác biệt:

```text
CƠ CHẾ COPY (Bản sao tĩnh):
[ Danh mục mẫu: WELD ] ──(Copy lúc tạo Routing)──► [ Routing SP A: WELD (Tĩnh) ]
   * Nếu sửa Danh mục mẫu WELD -> Routing SP A KHÔNG thay đổi.

CƠ CHẾ REFERENCE (Liên kết động):
[ Danh mục mẫu: WELD ] ◄──────(Liên kết động)─────── [ Routing SP A: WELD (Động) ]
   * Nếu sửa Danh mục mẫu WELD -> Routing SP A TỰ ĐỘNG cập nhật theo.
```

- **Hành vi Copy (Bản sao tĩnh):** Khi người dùng gọi công đoạn chuẩn vào Routing, hệ thống chỉ lấy thông tin tại thời điểm đó để nhân bản vào Routing của sản phẩm. Sau khi lưu, dòng công đoạn trên Routing trở thành một thực thể độc lập. Việc sửa đổi công đoạn mẫu trong tương lai sẽ **không ảnh hưởng** đến các sản phẩm cũ. (Đây là hành vi mặc định của Epicor và Odoo).
- **Hành vi Reference (Liên kết động):** Khi gọi công đoạn chuẩn, hệ thống chỉ lưu trữ con trỏ liên kết (Pointer). Mỗi khi chạy sản xuất hoặc tính giá thành, ERP sẽ đọc trực tiếp dữ liệu từ danh mục mẫu. Nếu sửa đổi cấu hình mẫu, hàng ngàn Routing đang liên kết sẽ **tự động cập nhật theo**. (Đây là tùy chọn nâng cao trên Oracle EBS qua cờ `Reference` và trên SAP S/4HANA thông qua việc gán Reference Operation Set).

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Công đoạn chuẩn

### Bài toán 1: Chuẩn hóa quy trình kiểm tra chất lượng (QC Operation) trên hàng ngàn sản phẩm
*   **Thách thức:** Nhà máy có 1.500 sản phẩm khác nhau. Tất cả đều phải qua bước kiểm thử mạch điện tử PCBA tại công đoạn cuối (`QC_TEST`). Do quy trình kiểm thử thay đổi, phòng Quản lý chất lượng yêu cầu bổ sung thêm một cờ kiểm soát trên hệ thống: bắt buộc công nhân phải nhập số Serial của thiết bị kiểm thử vào báo cáo MES. Nếu sửa thủ công 1.500 Routing thì quá tốn nguồn lực và dễ sai sót.
*   **Giải pháp thực tế:**
    Thiết lập công đoạn `QC_TEST` dưới dạng **Reference Operation (Liên kết động)**. 
    - Trên **Oracle EBS**, cấu hình mã `QC_TEST` trong danh mục Standard Operations với cờ kiểm soát bắt buộc nhập Serial. Khi gán vào 1.500 Routing, luôn tích chọn cờ **`Referenced = True`**.
    - Khi có yêu cầu thay đổi quy trình, người dùng chỉ cần truy cập vào danh mục mẫu Standard Operations, sửa đổi cấu hình duy nhất của mã `QC_TEST`. Toàn bộ 1.500 Routing của hệ thống sẽ lập tức áp dụng quy trình kiểm soát mới ngay trong giây tiếp theo mà không cần bất kỳ thao tác sửa đổi thủ công nào khác.

### Bài toán 2: Đồng bộ hóa đơn giá nhân công khi tính giá thành sản phẩm
*   **Thách thức:** Khi lương cơ bản của công nhân tổ may tăng lên, kéo theo đơn giá giờ công định mức của công đoạn may (`OP_SEWING`) tăng từ 50.000 VNĐ lên 60.000 VNĐ/giờ. Làm sao để kế toán giá thành cập nhật đơn giá mới này cho toàn bộ cấu trúc sản phẩm của nhà máy?
*   **Giải pháp thực tế:**
    - Trong **Epicor ERP**, cấu hình đơn giá lao động (`Labor Rate`) gắn trực tiếp trên mã Operation gốc `SEW` trong danh mục `Erp.OpMaster`.
    - Khi chạy tiến trình tính toán và cập nhật giá thành định mức cuối kỳ (Standard Cost Rollup), hệ thống Epicor sẽ quét trực tiếp đơn giá mới từ danh mục `Erp.OpMaster` để áp vào công đoạn sản xuất của tất cả các sản phẩm, đảm bảo giá thành kế hoạch của sản phẩm luôn phản ánh chính xác biến động chi phí nhân sự.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Công đoạn chuẩn

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh mục các Công đoạn sản xuất chuẩn (Standard Operations) kèm theo tài nguyên máy móc gán mặc định cho từng công đoạn:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    bso.standard_operation_code AS "Std Op Code",
    bso.operation_description AS "Std Op Description",
    bd.department_code AS "Default Department",
    bd.description AS "Department Name",
    br.resource_code AS "Default Resource",
    br.description AS "Resource Description",
    bsor.usage_rate_or_amount AS "Default Usage Rate",
    -- Kiểm tra xem công đoạn này có bắt buộc báo cáo sản lượng không
    DECODE(bso.count_point_type, 1, 'Yes (Autocharge)', 2, 'No (Direct Charge)', 'No') AS "Count Point?"
FROM 
    apps.bom_standard_operations bso
INNER JOIN apps.bom_departments bd ON bso.department_id = bd.department_id
LEFT JOIN apps.bom_std_op_resources bsor ON bso.standard_operation_id = bsor.standard_operation_id
LEFT JOIN apps.bom_resources br ON bsor.resource_id = br.resource_id
INNER JOIN apps.org_organization_definitions ood ON bso.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
ORDER BY 
    bso.standard_operation_code;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách danh mục Operation Code gốc (`Erp.OpMaster`) của Epicor để kiểm tra nhóm máy thực thi và phương pháp tính năng suất mặc định:

```sql
SELECT 
    Company,
    OpCode AS [Operation Code],
    Description AS [Operation Description],
    ResourceGrpID AS [Default Work Center / Resource Group],
    SchedRelation AS [Scheduling Relation], -- Quy định quan hệ lập lịch (ví dụ: FS - Finish to Start)
    DailyProdQty AS [Default Daily Prod Qty],
    -- Kiểm tra xem công đoạn này có yêu cầu báo cáo sản lượng không
    AutoReceive AS [Auto Receive on MES?],
    Active AS [Is Active?]
FROM 
    Erp.OpMaster
WHERE 
    Company = 'EP01'
    AND Active = 1
ORDER BY 
    OpCode;
```

> **Lưu ý:** Tên các trường (`SchedRelation`, `DailyProdQty`, `AutoReceive`...) có thể khác nhau tùy phiên bản Epicor cụ thể (10.0/10.1/10.2/Kinetic). Nên đối chiếu lại qua Epicor Data Dictionary (BAQ Designer hoặc Application Studio) trước khi dùng trong production.

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh sách các công đoạn chuẩn thuộc nhóm quy trình mẫu Reference Operation Set (Task List Type `PLNTY = S`) trong SAP S/4HANA:

```sql
SELECT 
    h.PLNNR AS "Reference Set Group ID",
    h.KTEXT AS "Reference Set Description",
    o.VORNR AS "Operation Sequence",
    o.LTXA1 AS "Operation Text / Description",
    wc.ARBPL AS "Default Work Center Code",
    o.STEUS AS "Control Key" -- Mã kiểm soát hoạt động
FROM 
    saphanadb.PLKO h
INNER JOIN 
    saphanadb.PLPO o ON h.PLNNR = o.PLNNR AND h.PLNTY = o.PLNTY
LEFT JOIN 
    saphanadb.CRHD wc ON o.ARBID = wc.OBJID -- Liên kết lấy mã Work Center mặc định
WHERE 
    h.PLNTY = 'S' -- Lọc riêng loại 'S' (Reference Operation Set)
    AND o.LOEKZ = ' ' -- Loại bỏ các công đoạn đã bị xóa logic
ORDER BY 
    h.PLNNR, o.VORNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Do Odoo không có bảng danh mục công đoạn chuẩn độc lập, câu lệnh dưới đây thực hiện thống kê các tên công đoạn đang được sử dụng nhiều nhất trên các BoM để rà soát mức độ chuẩn hóa dữ liệu đặt tên của kỹ sư:

```sql
SELECT 
    rwc.name AS "Operation Name Used in BoMs",
    wc.name AS "Assigned Work Center / Machine",
    COUNT(rwc.id) AS "Total Times Used", -- Số lần công đoạn này được tái sử dụng trong hệ thống
    ROUND(AVG(rwc.time_cycle), 2) AS "Average Standard Duration (Mins)"
FROM 
    mrp_routing_workcenter rwc
LEFT JOIN 
    mrp_workcenter wc ON rwc.workcenter_id = wc.id
GROUP BY 
    rwc.name, wc.name
HAVING 
    COUNT(rwc.id) > 1 -- Chỉ lấy các công đoạn được tái sử dụng từ 2 lần trở lên
ORDER BY 
    "Total Times Used" DESC;