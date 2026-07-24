---
id: 5000-quy-trinh-yeu-cau-va-lenh-thay-doi-ky-thuat
title: Quy trình Yêu cầu & Lệnh thay đổi kỹ thuật (ECR / ECO)
description: Thiết lập và quản lý quy trình kiểm soát thay đổi dữ liệu kỹ thuật sản phẩm thông qua chuỗi phê duyệt ECR/ECO, giảm thiểu rủi ro gián đoạn dây chuyền.
sidebar_label: Yêu cầu & Lệnh thay đổi kỹ thuật
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/5000-quy-trinh-yeu-cau-va-lenh-thay-doi-ky-thuat
sidebar_position: 5000
date: 2026-11-01
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, ecb, eco, ecr, plm, sql]
---

# 5000 - Thay đổi kỹ thuật ECR & ECO

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập quy trình mẫu (Master Data Setup & Workflow)** - cách định cấu hình luồng phê duyệt ECR/ECO, quản lý hồ sơ kiểm soát thay đổi dữ liệu kỹ thuật trước khi chính thức ban hành. Đối với các quy trình sửa đổi nóng (WIP Routing Bypass) trực tiếp ngoài hiện trường do sự cố máy hỏng đột xuất, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP).

---

Trong sản xuất, dữ liệu BOM và Routing luôn biến động theo thời gian do có các hoạt động cải tiến sản phẩm, thay thế linh kiện lỗi thời hoặc tối ưu hóa công đoạn của phòng R&D. Nếu kỹ sư tự ý vào chỉnh sửa trực tiếp dữ liệu sản xuất mà không có quy trình kiểm soát, nhà máy sẽ gặp rủi ro lớn: vật tư cũ chưa xài hết đã bị bỏ, vật tư mới mua chưa về xưởng đã dập lệnh sản xuất, gây tắc nghẽn hoàn toàn dây chuyền. 

Để kiểm soát chặt chẽ, các hệ thống ERP cung cấp phân hệ **Quản lý thay đổi kỹ thuật (Engineering Change Management / PLM)** thông qua cặp quy trình **Yêu cầu thay đổi (ECR - Engineering Change Request)** và **Lệnh thay đổi (ECO - Engineering Change Order)**. Bài viết này phân tích sâu kiến trúc dữ liệu vòng đời thay đổi, luồng phê duyệt và cách cấu hình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu quản lý thay thế của các hệ thống ERP được thiết kế dạng bảng kiểm soát kiểm toán (Audit Log Tables) bao bọc xung quanh dữ liệu BOM/Routing chính:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Có riêng phân hệ **Engineering (ENG)** để quản lý ECO độc lập trước khi đẩy sang phân hệ BOM. | Sử dụng cơ chế **ECO Group** để khóa quyền sửa. Mọi thay đổi lưu tạm ở bảng Eco, duyệt mới ghi vào bảng gốc [2]. | Sử dụng đối tượng **Change Master (Änderungsstammsatz)** để kiểm soát ngày và điều kiện hiệu lực. | Có riêng ứng dụng **Odoo PLM** quản lý quy trình thay đổi dạng thẻ Kanban trực quan [2]. |
| **Bảng đầu mục thay đổi (Header)** | **`ENG_ENGINEERING_CHANGES`** (Lưu thông tin mã số lệnh ECO, người yêu cầu, trạng thái phê duyệt). | **`Erp.ECOGroup`** (Lưu trữ thông tin nhóm kiểm soát check-out dữ liệu của kỹ sư) [2]. | **`saphanadb.AENR`** (Bảng quản lý mã thay thế Change Master Header). | **`mrp.eco`** (Bảng quản lý Lệnh thay đổi kỹ thuật ECO) [2]. |
| **Bảng đối tượng ảnh hưởng (Lines)** | `ENG_REVISED_ITEMS` (Các mặt hàng bị tác động) và `ENG_REVISED_COMPONENTS` (Các linh kiện con bị sửa). | **`Erp.EcoMtl`** / **`Erp.EcoOpr`** (Bảng lưu tạm các thay đổi vật tư/công đoạn trước khi Check-in) [2]. | **`saphanadb.AEOI`** (Bảng liên kết các đối tượng như BOM, Routing chịu tác động của Change Master). | `mrp.eco.stage` (Bảng định nghĩa các bước phê duyệt trên Kanban) [2]. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình Engineering Change Orders — Bảng: `ENG_ENGINEERING_CHANGES` / `ENG_REVISED_ITEMS`)
Oracle EBS sở hữu một phân hệ Engineering riêng biệt để "cách ly" các thay đổi đang thiết kế khỏi xưởng sản xuất:
1. **Bước 1 (Khởi tạo ECO):** Người dùng truy cập màn hình `ENG > ECOs > ECOs`. Tạo một mã ECO mới.
   - `ECO` (field DB: `change_notice`): Nhập số hiệu lệnh thay đổi (ví dụ: `ECO_2026_005`).
   - `Status`: Hệ thống gán trạng thái ban đầu là `Open` (Chưa phê duyệt).
2. **Bước 2 (Khai báo mặt hàng ảnh hưởng):** Bấm nút `Revised Items` để khai báo các sản phẩm bị tác động.
   - `Item` (field DB: `revised_item_id`): Nhập mã sản phẩm cần sửa (ví dụ: `TỦ_ĐIỆN`).
   - `New Revision`: Nhập mã phiên bản mới sẽ được sinh ra sau khi duyệt ECO (ví dụ: Rev `B`).
3. **Bước 3 (Sửa đổi cấu trúc vật tư):** Chọn dòng sản phẩm, bấm nút `Components` để thực hiện thêm, sửa hoặc xóa linh kiện con. Sau khi kiểm tra, chuyển trạng thái ECO sang `Approved` để hệ thống tự chạy tiến trình cập nhật BOM sản xuất.

### b. Hệ thống Epicor ERP (Mô hình ECO Group Checkout — Bảng: `Erp.ECOGroup` / `Erp.EcoMtl`)
Epicor áp dụng cơ chế khóa dữ liệu chặt chẽ thông qua hành vi Check-out/Check-in bắt buộc:
1. **Bước 1 (Tạo ECO Group):** Người dùng vào `Engineering Workbench`, tạo một mã nhóm kiểm soát.
   - `Group ID` (field DB: `GroupID`): Tạo mã nhóm (ví dụ: `ENG_PROJ_A`).
2. **Bước 2 (Check-out dữ liệu để sửa):** Tìm sản phẩm cần sửa, thực hiện lệnh "Check out" về nhóm `ENG_PROJ_A` [2]. Hệ thống sẽ khóa không cho kỹ sư khác chỉnh sửa sản phẩm này. Toàn bộ thay đổi thêm bớt linh kiện lúc này chỉ được lưu tạm tại bảng **`Erp.EcoMtl`** (field DB: `MtlPartNum`, `QtyPer`) mà chưa hề tác động đến BOM sản xuất thật [2].
3. **Bước 3 (Check-in phê duyệt):** Sau khi hoàn thành thiết kế, người dùng thực hiện lệnh "Check in" và bấm nút Approve [2]. Lúc này, dữ liệu từ bảng tạm `Erp.EcoMtl` mới được ghi đè vào bảng thật `Erp.PartMtl`, chính thức phát hành bản vẽ mới xuống xưởng [2].

### c. Hệ thống SAP S/4HANA (Cấu hình Change Master — Bảng: `AENR` / `AEOI`)
SAP điều khiển ngày hiệu lực của thay đổi thông qua một mã số trung gian là Change Number:
1. **Bước 1 (Tạo Change Master):** Dùng T-Code `CC01` để tạo một mã thay thế.
   - `Change Number` (field DB: `AENNR`): Tạo mã số hiệu thay thế (ví dụ: `CN_10025`).
   - `Valid From` (field DB: `DATUV`): Nhập ngày bắt đầu có hiệu lực của thay thế (ví dụ: `15/11/2026`).
2. **Bước 2 (Gán đối tượng thay đổi):** Trong tab `Object Types`, tích chọn các đối tượng được phép thay đổi bằng mã này (ví dụ chọn BOM, chọn Routing).
3. **Bước 3 (Thực hiện sửa đổi):** Khi vào sửa BOM (`CS02`) hoặc sửa Routing (`CA02`), tại màn hình đăng nhập, bắt buộc người dùng phải điền mã `Change Number = CN_10025`. Toàn bộ lịch sử thêm bớt vật tư sau đó sẽ được SAP gán chặt với mã `CN_10025` và tự động áp ngày hiệu lực chạy máy đồng bộ từ ngày 15/11/2026.

### d. Hệ thống Odoo ERP (Quy trình ECO Kanban — Bảng: `mrp.eco` / `mrp.eco.stage`)
Odoo quản lý quy trình thay đổi trực quan bằng bảng Kanban kéo thả của phân hệ PLM:
1. **Bước 1 (Tạo ECO):** Vào ứng dụng `PLM > Engineering Change Orders`, tạo ECO mới.
   - `Product`: Chọn sản phẩm cần cải tiến.
   - `ECO Type` (field DB: `type_id`): Chọn phân loại thay đổi (ví dụ chọn: `Sửa đổi BoM sản phẩm`).
2. **Bước 2 (Phê duyệt theo giai đoạn):** ECO sẽ xuất hiện dưới dạng một thẻ (Card) trên màn hình Kanban gồm các cột giai đoạn phê duyệt (field DB: `stage_id` - ví dụ các bước: `Draft` $\rightarrow$ `R&D Test` $\rightarrow$ `QA Approved` $\rightarrow$ `Effective`).
3. **Bước 3 (Hệ thống tự động đồng bộ):** Khi kéo thẻ ECO sang cột cuối cùng `Effective`, Odoo PLM tự động kích hoạt tiến trình ngầm ghi đè BoM nháp vào BoM chính, chính thức phát hành cấu trúc sản phẩm mới xuống phân hệ sản xuất dở dang [2].

---

## 3. Thuật toán Quy trình Vòng đời Thay đổi kỹ thuật (ECO Lifecycle Workflow)

Quy trình vận hành của một Lệnh thay đổi kỹ thuật (ECO) đi qua chuỗi phê duyệt liên phòng ban khép kín để đảm bảo kiểm soát rủi ro:

```text
       [ 1. PHÁT SINH ECR (YÊU CẦU THAY ĐỔI) ] ──► (QC báo lỗi chốt cửa nhựa bị gãy)
                          │
                          ▼
       [ 2. R&D KHỞI TẠO ECO & SỬA BOM NHÁP ]  ──► (Thiết kế chốt sắt thay cho chốt nhựa)
                          │
                          ▼
       [ 3. PHÂN TÍCH TÁC ĐỘNG (IMPACT ANALYSIS) ]──► (MRP quét dọn kho chốt nhựa cũ)
                          │
                          ▼
       [ 4. LUỒNG PHÊ DUYỆT (APPROVAL WORKFLOW) ]
         - QA duyệt (Đạt chuẩn chất lượng)
         - Kế toán duyệt (Đơn giá chốt sắt phù hợp)
         - Xưởng trưởng duyệt (Công cụ máy gá lắp đáp ứng)
                          │
                          ▼
       [ 5. BAN HÀNH & KÍCH HOẠT NGÀY HIỆU LỰC ] ──► (Tự động cập nhật BOM sản xuất thật)
```

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến ECO

### Bài toán 1: Quy trình xử lý ECR khẩn cấp khi phát hiện lỗi gãy chốt sắt từ sàn sản xuất
*   **Thách thức:** Nhà máy đang dập lắp ráp tủ lạnh thì công đoạn QA phát hiện chốt khóa cửa bằng nhựa rất dễ bị gãy gập trong quá trình vận chuyển thực tế. Trưởng phòng QA yêu cầu dừng ngay việc lắp chốt nhựa và gửi yêu cầu thay đổi khẩn cấp (ECR) sang phòng R&D để đổi sang chốt bằng kim loại tấm. Làm sao để hệ thống ghi vết quy trình xử lý khẩn cấp này?
*   **Giải pháp thực tế:**
    - Kỹ sư QA tạo một phiếu **ECR (Engineering Change Request)** trực tiếp từ màn hình kiểm soát chất lượng lỗi công đoạn. Phiếu này tự động đính kèm mã sản phẩm tủ lạnh và biên bản lỗi.
    - Hệ thống tự động bắn thông báo sang màn hình của Trưởng phòng R&D. R&D duyệt ECR và tạo tiếp một phiếu **ECO** để sửa đổi BOM: Hủy mã chốt nhựa, thêm mã chốt kim loại.
    - Toàn bộ tài liệu biên bản lỗi QA, bản vẽ thiết kế mới của R&D và lịch sử phê duyệt của các sếp được lưu giữ chung trong một hồ sơ ECO duy nhất, phục vụ công tác tra cứu lịch sử nâng cấp sản phẩm (Auditing) sau này.

### Bài toán 2: Quản lý thu hồi và giải quyết tồn kho dở dang (WIP & Stock Disposition) khi ECO được duyệt
*   **Thách thức:** Khi ECO đổi chốt nhựa sang chốt sắt được phê duyệt và ban hành, trong kho thành phẩm dở dang tại sàn sản xuất (WIP) đang tồn đọng **50 bộ vỏ tủ điện đã lỡ lắp chốt nhựa cũ**. Làm thế nào để điều phối viên xử lý mớ hàng dở dang lỗi thời này theo đúng quy định?
*   **Giải pháp thực tế:**
    Trên form cấu hình của ECO, hệ thống ERP cung cấp trường thuộc tính **`WIP & Stock Disposition (Hướng xử lý tồn kho dở dang)`**:
    - Người dùng cấu hình lựa chọn hướng xử lý (Disposition Code) cho 50 bộ tủ dở dang: Chọn **`Rework (Làm lại)`** hoặc **`Scrap (Loại bỏ)`** hoặc **`Use Up (Dùng nốt)`**.
    - Nếu chọn `Rework`: Hệ thống tự động tạo một lệnh sửa chữa con (Rework Job) đi kèm ECO để chỉ thị công nhân tháo bỏ chốt nhựa cũ, xuất kho chốt sắt mới gán vào thay thế.
    - Nếu chọn `Use Up`: Hệ thống sẽ tự động dời ngày hiệu lực của chốt sắt mới lùi lại cho đến khi 50 bộ tủ lắp chốt nhựa cũ được tiêu thụ hết sạch tại xưởng.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu ECO

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách các lệnh thay đổi kỹ thuật ECO đang ở trạng thái chờ phê duyệt hoặc đã được ban hành trong hệ thống Oracle EBS:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    eec.change_notice AS "ECO Number",
    eec.description AS "ECO Description",
    -- Decode trạng thái của ECO (1: Open, 4: Approved, 5: Released)
    DECODE(eec.status_type, 
           1, 'Open (Draft)', 
           4, 'Approved (Waiting Release)', 
           5, 'Released (Applied to BOM)', 
           eec.status_type) AS "ECO Status",
    msib.segment1 AS "Revised Parent Item",
    eri.new_item_revision AS "New Revision",
    eec.creation_date AS "Created Date"
FROM 
    apps.eng_engineering_changes eec
INNER JOIN apps.eng_revised_items eri ON eec.change_id = eri.change_id
INNER JOIN apps.mtl_system_items_b msib ON eri.revised_item_id = msib.inventory_item_id AND eec.organization_id = msib.organization_id
INNER JOIN apps.org_organization_definitions ood ON eec.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
ORDER BY 
    eec.creation_date DESC;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các nhóm thiết kế kỹ thuật ECO Groups đang được mở và chi tiết các dòng vật tư đang nằm ở bảng tạm chờ phê duyệt (`Erp.EcoMtl`) của Epicor:

```sql
SELECT 
    em.Company,
    em.GroupID AS [ECO Group ID],
    em.PartNum AS [Parent Part Code],
    em.RevisionNum AS [Target Revision],
    em.MtlSeq AS [Mtl Seq],
    em.MtlPartNum AS [Checked-out Component],
    em.QtyPer AS [Pending Qty Per],
    -- Ghi vết hành động thay đổi vật tư (A: Added, M: Modified, D: Deleted)
    CASE em.RowAction 
        WHEN 'A' THEN 'Added New Material'
        WHEN 'M' THEN 'Modified Quantity'
        WHEN 'D' THEN 'Deleted Material'
        ELSE em.RowAction 
    END AS [Change Action]
FROM 
    Erp.EcoMtl em
WHERE 
    em.Company = 'EP01'
ORDER BY 
    em.GroupID, em.PartNum, em.MtlSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh sách các mã hiệu thay thế Change Masters (`AENR`) đang hoạt động trong hệ thống SAP S/4HANA để kiểm soát ngày bắt đầu có hiệu lực của thay đổi:

```sql
SELECT 
    aenr.AENNR AS "Change Number ID",
    aenr.AEGWR AS "Change Reason Code",
    aenr.AETXT AS "Change Description",
    aenr.DATUV AS "Valid From Date", -- Ngày tự động kích hoạt BOM/Routing mới
    aenr.ANNAM AS "Created By",
    -- Giải mã trạng thái của Change Master
    CASE aenr.AESTA 
        WHEN '1' THEN 'Active / Approved' 
        WHEN '2' THEN 'Locked / Blocked' 
        ELSE 'Draft' 
    END AS "Status"
FROM 
    saphanadb.AENR aenr
WHERE 
    aenr.MANDT = '100'
ORDER BY 
    aenr.AENNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách các lệnh thay đổi thiết kế ECO đang được xử lý trong ứng dụng Odoo PLM, hiển thị chi tiết các bước phê duyệt trên bảng Kanban:

```sql
SELECT 
    eco.name AS "ECO Reference ID",
    pt.name AS "Affected Product Name",
    eco_type.name AS "ECO Category Type",
    eco_stage.name AS "Current Approval Stage (Kanban Column)",
    -- State trạng thái (confirmed là đã xác nhận, progress là đang sửa, done là đã duyệt)
    CASE eco.state
        WHEN 'confirmed' THEN 'Confirmed / Draft'
        WHEN 'progress' THEN 'R&D In-Progress (EBOM Phase)'
        WHEN 'done' THEN 'Effective (MBOM Merged)'
    END AS "Lifecycle State",
    eco.create_date AS "Created Date"
FROM 
    mrp_eco eco
INNER JOIN mrp_bom bom ON eco.bom_id = bom.id
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
LEFT JOIN mrp_eco_stage eco_stage ON eco.stage_id = eco_stage.id
LEFT JOIN mrp_eco_type eco_type ON eco.type_id = eco_type.id
WHERE 
    eco.active = true
ORDER BY 
    eco.create_date DESC;
