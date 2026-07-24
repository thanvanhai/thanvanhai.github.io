---
id: 3040-thiet-lap-quy-trinh-cong-nghe-thay-the
title: Thiết lập Quy trình công nghệ thay thế (Alternative / Group Routing)
description: Thiết lập Quy trình công nghệ thay thế (Alternative / Group Routing)
sidebar_label: Quy trình công nghệ thay thế
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/3040-thiet-lap-quy-trinh-cong-nghe-thay-the
sidebar_position: 3040
date: 2026-10-12
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, alternate-routing, operations, sql]
---

# 3040 Thiết lập Quy trình công nghệ thay thế (Alternative / Group Routing)

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này giải quyết bài toán thiết lập **Quy trình công nghệ thay thế (Alternative Routing)** - tức là thay đổi *toàn bộ trình tự và số lượng các công đoạn* sản xuất. Đối với bài toán hoán đổi máy móc đơn lẻ tại cùng một công đoạn sản xuất (giữ nguyên trình tự quy trình, chỉ thay đổi thiết bị thực thi), vui lòng tham khảo bài viết **[1050 - Thiết lập Trung tâm công việc thay thế khi quá tải công suất](./1050-thiet-lap-work-center-thay-the.md)**.

---

Khi vận hành xưởng, có những thời điểm nhà máy buộc phải thay đổi toàn bộ trình tự chế tạo sản phẩm chứ không chỉ đơn thuần là hoán đổi một cái máy. Ví dụ: Quy trình tiêu chuẩn là *Cắt phôi $\rightarrow$ Hàn khung $\rightarrow$ Sơn phủ tĩnh điện $\rightarrow$ Đóng gói*. Nhưng khi trạm hàn và trạm sơn bị quá tải, nhà máy buộc phải chuyển sang quy trình dự phòng: *Cắt phôi $\rightarrow$ Gửi đi thuê ngoài gia công gộp cả hàn và sơn $\rightarrow$ Đóng gói*. Lúc này, số lượng và bản chất các công đoạn đã thay đổi hoàn toàn.

Để quản lý tính linh hoạt này, hệ thống ERP cung cấp giải pháp **Quy trình công nghệ thay thế (Alternative Routing / Alternate Method)**. Bài viết này phân tích sâu kiến trúc dữ liệu quy trình dự phòng, luồng thiết lập và thuật toán tự động đề xuất quy trình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Để thiết kế các quy trình công nghệ song song cho cùng một sản phẩm, các hệ thống ERP sử dụng các cơ chế phân nhánh dữ liệu dưới nền như sau:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Định nghĩa nhiều Routing độc lập cho cùng một sản phẩm cha, phân biệt bằng nhãn hiệu thay thế. | Quản lý thông qua việc tạo nhiều phương pháp sản xuất (**Alternate Method**) trên cùng một Revision. | Sử dụng cơ chế phân loại nhiều phiên bản quy trình (**Group Counter**) hoặc rẽ nhánh công đoạn (**Alternative Sequence**). | Tạo nhiều cấu trúc định mức BoM song song cho cùng một sản phẩm, mỗi BoM chứa một danh sách công đoạn riêng. |
| **Bảng định nghĩa chính (Header)** | `BOM_OPERATIONAL_ROUTINGS` (Phân biệt bằng cột tên phương pháp dự phòng `alternate_routing_designator`). | **`Erp.PartRev`** (Phân biệt bằng trường lưu mã phương pháp thay thế `AltMethod`). | **`saphanadb.PLKO`** (Phân biệt bằng trường `PLNAL` - Group Counter) và bảng rẽ nhánh **`saphanadb.PLFL`** (Routing Sequences). | **`mrp.bom`** (Mỗi BoM đại diện cho một phương án quy trình công nghệ độc lập). |
| **Bảng chi tiết công đoạn (Lines)** | `BOM_OPERATION_SEQUENCES` (Mỗi dòng thuộc một `routing_sequence_id` riêng biệt của Alternate). | `Erp.PartOpr` (Lưu danh sách công đoạn của riêng tổ hợp `PartNum + RevisionNum + AltMethod`). | `saphanadb.PLPO` (Các công đoạn được gán tương ứng theo từng Group Counter hoặc Sequence). | `mrp.routing.workcenter` (Danh sách công đoạn gắn riêng theo từng ID của BoM). |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Triết lý Alternate Routing Designator — Bảng: `BOM_OPERATIONAL_ROUTINGS` / `BOM_OPERATION_SEQUENCES`)
Oracle EBS quản lý quy trình thay thế bằng cách nhân bản cấu trúc và đánh nhãn dự phòng:
1. **Bước 1 (Định nghĩa mã nhãn):** Người dùng truy cập `BOM > Setup > Alternates` để tạo mã nhãn dự phòng (ví dụ: `ALT_MANUAL` - Quy trình chạy thủ công, `ALT_LINE_2` - Quy trình chạy trên dây chuyền 2).
2. **Bước 2 (Khởi tạo Alternate Routing):** Vào `BOM > Routings > Routings`, nhập mã sản phẩm cha. Tại trường **`Alternate`** (field DB: `alternate_routing_designator`), chọn mã nhãn `ALT_MANUAL`.
3. **Bước 3 (Thiết kế công đoạn riêng):** Nhập chuỗi công đoạn hoàn toàn mới dành riêng cho quy trình chạy tay này (ví dụ: gán công đoạn dập tay, sơn tay vào bảng `BOM_OPERATION_SEQUENCES`).

### b. Hệ thống Epicor ERP (Triết lý Alternate Method — Bảng: `Erp.PartRev` / `Erp.PartOpr`)
Epicor quản lý quy trình thay thế cực kỳ chặt chẽ gắn liền với cấu trúc cây MoM (Method of Manufacture):
1. **Bước 1 (Check out tạo Alternate Method):** Trong màn hình `Engineering Workbench`, người dùng thực hiện Check out sản phẩm cha. Khi chọn phiên bản, người dùng khai báo mã phương pháp thay thế tại trường **`Alt Method`** (field DB: `PartRev.AltMethod` - ví dụ: nhập `ALT01` và đặt tên mô tả là "Quy trình gia công ngoài khi quá tải").
2. **Bước 2 (Xây dựng MoM dự phòng):** Trên cây cấu trúc MoM mới tạo của mã `ALT01`, người dùng thiết lập danh sách công đoạn và vật tư hoàn toàn mới.
3. **Bước 3 (Approve):** Thực hiện Approve phiên bản `ALT01` để đưa vào vận hành. Khi tạo Job sản xuất, điều độ viên có thể chọn trực tiếp Method `ALT01` thay cho Method mặc định.

### c. Hệ thống SAP S/4HANA (Triết lý Group Counter & Alternative Sequence — Bảng: `PLKO` / `PLFL` / `PLPO`)
SAP cung cấp hai giải pháp thay thế linh hoạt tùy theo nhu cầu kiểm soát:
*   **Giải pháp 1 (Group Counter - Tạo phiên bản độc lập):** Trong T-Code `CA01`, dùng chung một mã Group (`PLKO-PLNNR`) nhưng tạo thêm một **`Group Counter = 02`** (field DB: `PLKO-PLNAL` - ví dụ gán tên "Quy trình chạy máy dự phòng"). Người dùng nhập danh sách công đoạn độc lập cho Group Counter 02 này.
*   **Giải pháp 2 (Alternative Sequence - Rẽ nhánh công đoạn):** Trong cùng một Group Counter, người dùng chuyển sang tab `Sequences`, tạo một nhánh phụ song song có mã loại Sequence là **`Alternative Sequence`** (field DB: `PLFL-FLGTY = 'A'`). Nhánh phụ này sẽ rẽ nhánh từ công đoạn chính `Op 20` và tự động sáp nhập quay lại quy trình chính tại công đoạn `Op 50` sau khi chạy qua các máy thay thế.

### d. Hệ thống Odoo ERP (Triết lý Đa BoM song song — Bảng: `mrp.bom` / `mrp.routing.workcenter`)
Odoo quản lý thay thế quy trình bằng cách đơn giản hóa thông qua việc tạo nhiều BoM song song cho cùng một sản phẩm:
1. **Bước 1 (Tạo BoM thứ hai):** Truy cập `Manufacturing > Products > Bills of Materials`, bấm tạo mới một BoM cho cùng một sản phẩm thành phẩm (ví dụ: cùng tạo BoM cho `Xe đạp`).
2. **Bước 2 (Khai báo mã phân biệt):** Tại trường `Reference` trên Header của BoM mới, nhập mã phân biệt (ví dụ nhập: `BOM_BACKUP_MANUAL`).
3. **Bước 3 (Thiết kế công đoạn mới):** Chuyển sang tab `Operations`, thiết lập chuỗi công đoạn sản xuất thủ công riêng cho BoM này. Khi chạy nhu cầu sản xuất, hệ thống cho phép người dùng chọn BoM mong muốn để thực thi.

---

## 3. Thuật toán tự động lựa chọn Quy trình sản xuất (Routing Selection Logic)

Trong vận hành thực tế, hệ thống ERP sử dụng ba thuật toán cốt lõi để tự động quyết định xem Lệnh sản xuất nên áp dụng Quy trình chính (Primary) hay Quy trình dự phòng (Alternative):

### Thuật toán 1: Lựa chọn theo quy mô lô sản xuất (Lot-size Dependent Routing)
Thường áp dụng khi nhà máy có dây chuyền tự động hóa tốc độ cao (chỉ hiệu quả khi chạy lô lớn do tốn nhiều thời gian setup máy) và tổ sản xuất thủ công chạy bằng tay (phù hợp chạy lô nhỏ, hàng mẫu).

*   **Công thức kiểm tra điều kiện kích hoạt:**
    - Nếu $\text{Sản lượng đơn hàng} < \text{Lô sản xuất tối thiểu (Min Lot Size)}$, hệ thống tự động bốc **Quy trình chạy tay (Alternative Manual Routing)**.
    - Nếu $\text{Sản lượng đơn hàng} \ge \text{Min Lot Size}$, hệ thống tự động bốc **Quy trình chạy máy tự động (Primary Auto Routing)**.

### Thuật toán 2: Lựa chọn theo mức độ khả dụng của tài nguyên (Resource-constrained Selection)
Thuật toán này chạy dưới nền của các công cụ lập lịch nâng cao (APS):
- Hệ thống quét qua lịch sản xuất của máy chính trên quy trình tiêu chuẩn.
- Nếu phát hiện máy chính bị quá tải 100% công suất và lệnh sản xuất có rủi ro bị trễ hạn giao hàng (Late Delivery Penalty), thuật toán sẽ tự động phân rã thử quy trình dự phòng (Alternative Routing) trên máy phụ.
- Nếu thời gian hoàn thành trên máy phụ sớm hơn thời gian chờ đợi máy chính, APS tự động chuyển hướng lệnh sản xuất sang Quy trình dự phòng.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Quy trình thay thế

### Bài toán 1: Tối ưu hóa chi phí sản xuất tủ điện theo quy mô lô hàng (Lot-size dependent)
*   **Thực tế:** Quy trình dập vỏ tủ điện tiêu chuẩn chạy trên máy dập tự động CNC (`Op 10` tiêu tốn thời gian setup máy là 2 giờ, nhưng thời gian dập 1 sản phẩm chỉ mất 0.5 phút). Quy trình dự phòng chạy trên máy dập cơ khí cầm tay (`Op 10` tiêu tốn thời gian setup máy chỉ 10 phút, nhưng thời gian dập 1 sản phẩm mất tới 10 phút). Nếu khách đặt dập mẫu **5 sản phẩm**, làm sao để hệ thống tự động bốc quy trình dập tay để tránh lãng phí 2 giờ setup máy tự động?
*   **Giải pháp thực tế trên SAP S/4HANA:**
    - Tạo Group Counter `01` (Quy trình máy tự động): Cấu hình dải sản lượng hiệu lực (**`Lot Size From - To`**) là từ **`100` đến `99.999` sản phẩm**.
    - Tạo Group Counter `02` (Quy trình dập tay thủ công): Cấu hình dải sản lượng hiệu lực là từ **`1` đến `99` sản phẩm**.
    - Khi đơn hàng bán (Sales Order) yêu cầu sản xuất 5 sản phẩm dập, hệ thống MRP khi chạy sẽ tự động đối chiếu dải sản lượng hiệu lực và bốc đúng quy trình dập tay (Group Counter `02`) để tính thời gian và giá thành kế hoạch, loại bỏ hoàn toàn việc lãng phí thời gian setup máy tự động.

### Bài toán 2: Bẻ nhánh quy trình công nghệ dở dang khi máy chính gặp sự cố đột xuất (WIP Routing Swap)
*   **Thách thức:** Lệnh sản xuất đang dập dở dang đến công đoạn Sơn phủ (`Op 30` - chạy trên dây chuyền sơn tự động) thì dây chuyền sơn bị cháy động cơ, dự kiến phải sửa mất 1 tuần. Nhà máy muốn bẻ nhánh lệnh sản xuất này sang quy trình sơn tay thủ công dã chiến ngay lập tức để kịp giao hàng mà không cần phải hủy lệnh và tạo lại từ đầu.
*   **Giải pháp thực tế trên Epicor ERP:**
    - Epicor cho phép điều độ viên thực hiện hiệu chỉnh trực tiếp cấu trúc dở dang ngay trên lệnh sản xuất đang chạy (Job WIP).
    - Bộ phận điều độ mở Job sản xuất đang bận, dùng tính năng **`Job Details > Assembly > Operations`**, bấm vào nút `Change Method/Revision`.
    - Chọn mã phương án thay thế là `ALT_PAINT_MANUAL`. Hệ thống Epicor sẽ tự động giữ nguyên sản lượng và chi phí dở dang tích lũy của các công đoạn `Op 10`, `Op 20` đã hoàn thành trước đó, đồng thời xóa bỏ công đoạn sơn tự động cũ và nạp chuỗi công đoạn sơn tay mới vào Job bắt đầu từ `Op 30` trở đi để công nhân sàn sản xuất quẹt thẻ MES thực thi ngay lập tức.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Quy trình công nghệ thay thế

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách tất cả các Quy trình công nghệ dự phòng (Alternate Routings) được thiết lập cho các sản phẩm trong nhà máy:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Assembly Item",
    msib.description AS "Assembly Description",
    -- Cột alternate_routing_designator lưu tên nhãn của quy trình thay thế
    bor.alternate_routing_designator AS "Alternate Routing Designator",
    bos.operation_seq_num AS "Op Seq",
    bd.department_code AS "Work Center Code",
    bos.operation_description AS "Operation Description",
    bos.effectivity_date AS "Effective From"
FROM 
    apps.bom_operational_routings bor
INNER JOIN apps.bom_operation_sequences bos ON bor.routing_sequence_id = bos.routing_sequence_id
INNER JOIN apps.mtl_system_items_b msib ON bor.assembly_item_id = msib.inventory_item_id AND bor.organization_id = msib.organization_id
INNER JOIN apps.bom_departments bd ON bos.department_id = bd.department_id
INNER JOIN apps.org_organization_definitions ood ON bor.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1'
    -- Lọc riêng các quy trình thay thế (Alternate Routing Designator không bị rỗng)
    AND bor.alternate_routing_designator IS NOT NULL
    AND (bos.disable_date IS NULL OR bos.disable_date > SYSDATE)
ORDER BY 
    msib.segment1, bor.alternate_routing_designator, bos.operation_seq_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các phương án sản xuất thay thế (Alternate Methods) được xây dựng cho sản phẩm và trạng thái phê duyệt thiết kế kỹ thuật của Epicor:

```sql
SELECT 
    pr.Company,
    pr.PartNum AS [Part Number],
    p.Description AS [Part Description],
    pr.RevisionNum AS [Revision ID],
    -- Trường AltMethod lưu mã định danh của phương pháp sản xuất thay thế
    pr.AltMethod AS [Alternate Method Code],
    pr.AltMethodDesc AS [Method Description],
    pr.Approved AS [Is Method Approved?], -- 1 = Đã phê duyệt, sẵn sàng cho sản xuất
    pr.ApprovedBy AS [Approved By],
    pr.EffectiveDate AS [Effective Date]
FROM 
    Erp.PartRev pr
INNER JOIN 
    Erp.Part p ON pr.Company = p.Company AND pr.PartNum = p.PartNum
WHERE 
    pr.Company = 'EP01'
    -- Chỉ lọc các phiên bản cấu hình phương án sản xuất thay thế
    AND pr.AltMethod <> '' 
ORDER BY 
    pr.PartNum, pr.AltMethod;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh sách các quy trình công nghệ của sản phẩm có từ 2 phiên bản quy trình trở lên (Group Counter > 1) để rà soát dữ liệu thiết lập của SAP:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Material Code",
    h.PLNNR AS "Routing Group ID",
    h.PLNAL AS "Group Counter (Version)", -- Phiên bản quy trình (01, 02...)
    h.KTEXT AS "Routing Version Description",
    h.ANDAT AS "Created Date",
    h.ANNAM AS "Created By"
FROM 
    saphanadb.MAPL m
INNER JOIN 
    saphanadb.PLKO h ON m.PLNTY = h.PLNTY AND m.PLNNR = h.PLNNR
WHERE 
    m.WERKS = '1000'
    AND m.PLNTY = 'N' -- Lọc loại 'N' (Normal Routing)
    -- Tìm các sản phẩm có từ 2 Group Counter trở lên gán kèm trong cùng một nhóm Group
    AND m.MATNR IN (
        SELECT MATNR FROM saphanadb.MAPL 
        WHERE WERKS = m.WERKS AND PLNTY = 'N' 
        GROUP BY MATNR, PLNNR HAVING COUNT(DISTINCT PLNAL) > 1
    )
ORDER BY 
    m.MATNR, h.PLNAL;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách các sản phẩm đang có nhiều hơn một cấu trúc BoM (đồng nghĩa có nhiều quy trình công nghệ thay thế song song) trong hệ thống Odoo:

```sql
SELECT 
    pt.name AS "Product Name Template",
    bom.code AS "BOM / Routing Reference",
    bom.id AS "BOM ID",
    -- Decode mục đích sử dụng BoM của Odoo
    CASE bom.type 
        WHEN 'normal' THEN 'Manufacture (Discrete Routing)'
        WHEN 'phantom' THEN 'Kit (Blow-through Routing)'
    END AS "Routing Operating Type",
    bom.active AS "Is Active?"
FROM 
    mrp_bom bom
INNER JOIN 
    product_template pt ON bom.product_tmpl_id = pt.id
WHERE 
    bom.active = true
    -- Tìm các sản phẩm đang có từ 2 BoM (quy trình chạy) trở lên hoạt động song song
    AND bom.product_tmpl_id IN (
        SELECT product_tmpl_id FROM mrp_bom 
        WHERE active = true GROUP BY product_tmpl_id HAVING COUNT(id) > 1
    )
ORDER BY 
    pt.name, bom.code;