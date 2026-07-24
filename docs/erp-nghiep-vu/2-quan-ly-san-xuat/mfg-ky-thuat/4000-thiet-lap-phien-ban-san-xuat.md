---
id: 4000-thiet-lap-phien-ban-san-xuat
title: Thiết lập Phiên bản sản xuất (Production Version Setup - Ghép BOM & Routing)
description: Khai báo dữ liệu gốc ghép cặp đồng bộ giữa Định mức vật tư (BOM) và Quy trình công nghệ (Routing) để tạo thành công thức sản xuất (Recipe) chuẩn hóa cho MRP.
sidebar_label: Phiên bản sản xuất
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/4000-thiet-lap-phien-ban-san-xuat
sidebar_position: 4000
date: 2026-10-22
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, production-version, recipe, sql]
---

# 4000 - Phiên bản sản xuất

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập dữ liệu gốc (Master Data Setup)** - cách ghép cặp đồng bộ giữa một phiên bản BOM cụ thể với một phiên bản Routing cụ thể để tạo thành công thức sản xuất chuẩn phục vụ cho MRP và tính giá thành kế hoạch [2]. Đối với quy trình giao dịch thực tế tự động chọn phiên bản sản xuất trên Lệnh sản xuất khi chạy xưởng, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP).

---

Trong môi trường sản xuất đa dạng, một sản phẩm có thể có nhiều cách chế tạo khác nhau. Ví dụ: Để sản xuất cùng một sản phẩm vỏ tủ điện, nhà máy có thể dùng Định mức vật tư sơn tĩnh điện (BOM 1) kết hợp Quy trình phun sơn bằng dây chuyền tự động (Routing 1); hoặc dùng Định mức sơn phun tay (BOM 2) kết hợp Quy trình sơn thủ công (Routing 2). 

Để hệ thống ERP không bị nhầm lẫn khi tự động tính toán nhu cầu vật tư và lập lịch chạy máy, hệ thống cần một "cầu nối" trung gian để khóa chặt cặp đôi BOM và Routing này lại thành một công thức sản xuất duy nhất, đối tượng này được gọi là **Phiên bản sản xuất (Production Version / Recipe)** [2].

Bài viết này phân tích sâu kiến trúc dữ liệu liên kết, thuật toán tự động bốc phiên bản và cách cấu hình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ Kiến trúc dữ liệu liên kết (Database Schema Comparison)

Kiến trúc dữ liệu quản lý Phiên bản sản xuất phản ánh rõ nét triết lý thiết kế module của từng nhà cung cấp ERP:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Phân hệ Discrete dùng nhãn Alternate để map gián tiếp. Phân hệ OPM (Hóa chất/liên tục) dùng bảng **Recipe** để ghép cặp Formula và Routing. | **BOM và Routing gộp chung** thành MoM nên không cần bảng trung gian. Phiên bản Revision đại diện cho cả hai. | Bắt buộc phải khai báo bảng **Production Version** để liên kết cứng BOM Alternative và Routing Group Counter [2]. | Công đoạn sản xuất nằm trực tiếp trong BoM nên BoM ID đại diện cho công thức sản xuất duy nhất. |
| **Bảng liên kết chính (Junction Table)** | **`GMD_RECIPES_B`** (Bảng quản lý Recipe liên kết Formula và Routing trong OPM). | Không cần (Sử dụng trực tiếp bảng phiên bản sản phẩm gốc **`Erp.PartRev`**). | **`saphanadb.MKAL`** (Bảng quản lý các Phiên bản sản xuất - Production Versions) [2]. | Không cần (Sử dụng trực tiếp bảng định mức BoM chính **`mrp.bom`**). |
| **Liên kết BOM (Material Link)** | `GMD_RECIPES_B.formula_id` (Trỏ sang bảng định mức công thức Formula). | `PartRev.RevisionNum` (Gắn kết trực tiếp danh sách vật tư `PartMtl`). | `MKAL.STLAL` (Trỏ sang mã phiên bản BOM Alternative cụ thể) [2]. | `mrp.bom.id` (Mã định danh của BoM). |
| **Liên kết Quy trình (Routing Link)** | `GMD_RECIPES_B.routing_id` (Trỏ sang bảng Quy trình công nghệ OPM). | `PartRev.AltMethod` (Gắn kết trực tiếp danh sách công đoạn `PartOpr`). | `MKAL.PLNAL` (Trỏ sang mã Group Counter của Routing cụ thể) [2]. | `mrp.bom.id` (Công đoạn nằm trực tiếp trên tab Operations của BoM). |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống SAP S/4HANA (Triết lý Production Version — Bảng: `saphanadb.MKAL`)
Trong SAP S/4HANA, Production Version là dữ liệu gốc bắt buộc phải có cho mọi mô hình sản xuất (Discrete và Process) để chạy MRP và tính giá thành:
1. **Bước 1 (Vào màn hình cấu hình):** Người dùng dùng T-Code `C223` (Quản lý Production Version tập trung) hoặc cấu hình trực tiếp từ màn hình sửa Material Master (View MRP 4).
2. **Bước 2 (Khởi tạo mã phiên bản):** 
   - `Production Version` (field DB: `VERID`): Tạo mã phiên bản sản xuất (ví dụ: `V001` - Sơn tự động, `V002` - Sơn thủ công) [2].
   - Nhập ngày hiệu lực (`Valid From` / `Valid To`) và dải sản lượng hiệu lực (ví dụ: `V001` chạy cho lô từ 100 sản phẩm trở lên).
3. **Bước 3 (Ghép cặp BOM & Routing):** 
   - Tại mục Planning: Nhập mã nhóm Routing (`PLNNR`) và Group Counter (`PLNAL` - ví dụ chọn `01`) [2].
   - Tại mục BOM: Nhập BOM Alternative (field DB: `STLAL` - ví dụ chọn `1`) [2].
4. **Bước 4 (Check tính hợp lệ):** Bấm nút `Check` để hệ thống tự động kiểm tra xem BOM và Routing gán kèm có đang hoạt động tốt không. Trạng thái hiển thị đèn xanh nghĩa là phiên bản hợp lệ sẵn sàng sản xuất.

### b. Hệ thống Oracle EBS (Triết lý OPM Recipe — Bảng: `GMD_RECIPES_B` / `GMD_RECIPE_VALIDITY_RULES`)
Đối với luồng sản xuất liên tục/hóa chất (OPM) của Oracle, việc ghép cặp được quản lý thông qua đối tượng Recipe:
1. **Bước 1 (Định nghĩa công thức - Formula):** Tạo danh sách hóa chất cấu thành trong màn hình `Formula Maintenance` (tương đương BOM).
2. **Bước 2 (Định nghĩa quy trình - OPM Routing):** Tạo chuỗi bể trộn, bồn chứa và nhiệt độ trong màn hình `Routing Maintenance`.
3. **Bước 3 (Ghép cặp bằng Recipe):** Vào màn hình `Recipe Maintenance`, tạo mã Recipe (ví dụ: `RC_SƠN_PHỦ`). Tại đây gán liên kết:
   - `Formula`: Chọn mã công thức ở Bước 1.
   - `Routing`: Chọn quy trình công nghệ ở Bước 2.
4. **Bước 4 (Cấu hình điều kiện hiệu lực):** Bấm nút `Validity Rules` để cấu hình dải sản lượng lô và ngày hiệu lực tương ứng cho Recipe.

### c. Hệ thống Epicor ERP (Triết lý MoM Tích hợp — Bảng: `Erp.PartRev`)
Do Epicor đi theo triết lý gộp chung BOM và Routing vào cấu trúc MoM, hệ thống hoàn toàn tối giản hóa, loại bỏ bước ghép cặp trung gian:
1. **Bước 1 (Khai báo Revision):** Trong màn hình `Part Maintenance`, người dùng tạo một phiên bản `Revision` mới (ví dụ: Rev `A`).
2. **Bước 2 (Thiết kế MoM đồng thời):** Khi Check out Rev `A` vào `Engineering Workbench`, kỹ sư công nghệ thiết kế đồng thời cả phần vật tư (`Materials`) và công đoạn (`Operations`) trên cùng một màn hình. Sự kết hợp này mặc định tạo thành một công thức sản xuất duy nhất, không thể tách rời của Rev `A`.

### d. Hệ thống Odoo ERP (Triết lý Thiết lập trực tiếp trên BoM — Bảng: `mrp.bom`)
Tương tự Epicor, Odoo không quản lý độc lập hai đầu dữ liệu mà tích hợp toàn bộ trên form định mức:
1. **Bước 1 (Khai báo BoM):** Tạo BoM mới cho sản phẩm.
2. **Bước 2 (Nhập nguyên liệu & Công đoạn):** Người dùng nhập nguyên liệu tại tab `Components` và nhập trình tự chạy máy trực tiếp tại tab `Operations`. BoM ID này tự động đại diện cho phiên bản sản xuất duy nhất của sản phẩm.

---

## 3. Thuật toán Tự động chọn Phiên bản sản xuất (Automatic Version Selection)

Khi bộ tính toán MRP hoạt động hoặc khi nhân viên tạo Lệnh sản xuất (Work Order/Discrete Job), hệ thống sẽ tự động quét danh mục phiên bản để bốc đúng công thức sản xuất theo thuật toán 3 lớp điều kiện:

```text
               [ PHÁT SINH NHU CẦU SẢN XUẤT ] (Sản lượng: Q, Ngày chạy: D)
                               │
                               ▼
            [ Lớp 1: Kiểm tra Ngày hiệu lực (Validity Dates) ]
              - Lọc các phiên bản có: Valid From <= D <= Valid To
                               │
                               ▼
            [ Lớp 2: Kiểm tra Quy mô lô hàng (Lot Size Range) ]
              - Lọc các phiên bản có: Min Lot Size <= Q <= Max Lot Size
                               │
                               ▼
            [ Lớp 3: Kiểm tra Trạng thái kích hoạt (Active Status) ]
              - Chỉ lấy phiên bản được đánh dấu Active/Approved = True
                               │
                               ▼
                  [ ÁP DỤNG PHIÊN BẢN PHÙ HỢP ]
```

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Phiên bản sản xuất

### Bài toán 1: Khóa nhanh phiên bản lỗi thời khi phát hiện sự cố nghiêm trọng (Recipe Lockout)
*   **Thách thức:** Nhà máy đang dùng phiên bản sản xuất `V002` để chạy sản xuất bánh. Đột ngột phát hiện lò nung phụ trách trong quy trình `V002` gặp sự cố nhiệt độ không đều làm hỏng bánh. Làm sao để bộ phận kỹ thuật khóa lập tức không cho phép hệ thống tự động bốc phiên bản `V002` này vào các Lệnh sản xuất mới của ngày mai, bắt buộc hệ thống phải chuyển hướng sang phiên bản sơn tay `V001` dự phòng?
*   **Giải pháp thực tế:**
    - Trên **SAP S/4HANA**, truy cập T-Code `C223` sửa phiên bản `V002`, tại cột trường **`Locked`** (field DB: `MKAL-PLNME`), chọn cờ **`Locked for RM / MRP`** (Khóa sản xuất và lập kế hoạch). Lúc này, MRP khi chạy đêm sẽ tự động bỏ qua `V002` và chuyển hướng toàn bộ nhu cầu dở dang sang bốc phiên bản khả dụng tiếp theo là `V001`.
    - Trên **Epicor ERP**, truy cập `Part Maintenance` của sản phẩm, mở Revision tương ứng của quy trình lỗi và bỏ tích chọn cờ **`Approved`** (field DB: `PartRev.Approved = 0`). Hệ thống sẽ lập tức chặn đứng việc tạo Job mới cho Revision này.

### Bài toán 2: Tính giá thành định mức khi có nhiều phương án sản xuất song song (Standard Cost Rollup)
*   **Thách thức:** Sản phẩm của nhà máy có 2 phiên bản sản xuất song song chạy bằng máy tự động (giá thành rẻ) và chạy thủ công (giá thành cao). Khi phòng kế toán chạy tiến trình tính giá thành kế hoạch định mức (Standard Cost Rollup) cho cả năm tài chính, làm sao hệ thống biết được nên lấy đơn giá của phiên bản nào làm giá thành chuẩn để lưu kho?
*   **Giải pháp thực tế:**
    - ERP cung cấp cơ chế đánh dấu phiên bản sản xuất mặc định phục vụ tính giá thành.
    - Trong **SAP S/4HANA**, trên cấu hình của Production Version, kế toán tích chọn thuộc tính **`Production Version for Costing`** cho phiên bản máy tự động. Khi chạy T-Code `CK11N` (Tính giá thành định mức), hệ thống sẽ ưu tiên bốc duy nhất phiên bản này để làm giá chuẩn.
    - Trong **Oracle EBS OPM**, tại màn hình `Recipe Validity Rules`, kế toán tạo một dòng quy tắc cho mục đích giá thành bằng cách chọn **`Recipe Use = Costing`** cho Recipe chạy máy tự động. Hệ thống Costing sẽ bỏ qua các Recipe chạy thử hoặc chạy thủ công khác khi chạy mẻ tính toán giá thành định mức cuối kỳ.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Phiên bản sản xuất

### a. Trên hệ thống Oracle EBS (PL/SQL - Phân hệ OPM Recipes)
Truy vấn danh mục các Recipe của phân hệ sản xuất hóa chất/liên tục, hiển thị rõ sự ghép cặp giữa mã công thức (Formula) và quy trình công nghệ (Routing):

```sql
SELECT 
    gr.recipe_no AS "Recipe Code",
    gr.recipe_version AS "Recipe Version",
    gr.recipe_desc AS "Recipe Description",
    ffh.formula_no AS "Formula Code",
    ffh.formula_vers AS "Formula Version",
    frh.routing_no AS "OPM Routing Code",
    frh.routing_vers AS "OPM Routing Version",
    -- Kiểm tra trạng thái phê duyệt của Recipe
    gs.status_desc AS "Approved Status"
FROM 
    apps.gmd_recipes_b gr
INNER JOIN apps.fm_form_mst_b ffh ON gr.formula_id = ffh.formula_id
LEFT JOIN apps.gmd_routings_b frh ON gr.routing_id = frh.routing_id
INNER JOIN apps.gmd_status_b gs ON gr.recipe_status = gs.status_code
ORDER BY 
    gr.recipe_no, gr.recipe_version;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Do Epicor tích hợp MoM trực tiếp trên Revision, câu lệnh này truy vấn danh mục các phiên bản Revision (`PartRev`) đang hoạt động và phương án chạy máy thay thế (`AltMethod`) tương ứng:

```sql
SELECT 
    pr.Company,
    pr.PartNum AS [Part Number],
    p.Description AS [Part Description],
    pr.RevisionNum AS [Revision ID],
    -- Trường AltMethod đại diện cho các phương án Recipe khác nhau của cùng 1 mã hàng
    CASE WHEN pr.AltMethod = '' THEN 'PRIMARY' ELSE pr.AltMethod END AS [Method ID],
    pr.AltMethodDesc AS [Method Description],
    pr.Approved AS [Is Approved?], -- 1 = Sẵn sàng chạy máy
    pr.EffectiveDate AS [Effective Date],
    pr.ApprovedBy AS [Approved By]
FROM 
    Erp.PartRev pr
INNER JOIN 
    Erp.Part p ON pr.Company = p.Company AND pr.PartNum = p.PartNum
WHERE 
    pr.Company = 'EP01'
ORDER BY 
    pr.PartNum, pr.RevisionNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh sách tất cả các Phiên bản sản xuất (Production Versions) đã được thiết lập của vật tư, hiển thị chi tiết cặp đôi liên kết BOM (`STLAL`) và Routing (`PLNAL`):

```sql
SELECT 
    mkal.WERKS AS "Plant",
    mkal.MATNR AS "Material Code",
    mkal.VERID AS "Production Version ID",
    mkal.TEXT1 AS "Version Description",
    -- Ghép cặp liên kết của SAP
    mkal.STLAL AS "Linked BOM Alternative",
    mkal.PLNAL AS "Linked Routing Group Counter",
    mkal.ADATU AS "Valid From Date",
    mkal.BDATU AS "Valid To Date",
    -- Kiểm tra trạng thái khóa sản xuất
    CASE mkal.PLNME WHEN ' ' THEN 'Active' ELSE 'Locked for Production' END AS "Lock Status"
FROM 
    saphanadb.MKAL mkal
WHERE 
    mkal.MANDT = '100'
    AND mkal.WERKS = '1000' -- Thay bằng Plant thực tế của bạn
ORDER BY 
    mkal.MATNR, mkal.VERID;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Do Odoo tích hợp trực tiếp, câu lệnh dưới đây thực hiện thống kê các BoM của sản phẩm kèm theo tổng số linh kiện con và tổng số bước công nghệ dập máy được gán trực tiếp trên BoM đó:

```sql
SELECT 
    pt.name AS "Product Name Template",
    bom.code AS "BoM/Recipe Reference Code",
    -- Đếm tổng số linh kiện con của BoM
    (SELECT COUNT(bl.id) FROM mrp_bom_line bl WHERE bl.bom_id = bom.id) AS "Total Component Materials",
    -- Đếm tổng số công đoạn chạy máy gán trực tiếp trên BoM
    (SELECT COUNT(rwc.id) FROM mrp_routing_workcenter rwc WHERE rwc.bom_id = bom.id) AS "Total Operations",
    bom.active AS "Is Active?"
FROM 
    mrp_bom bom
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
WHERE 
    bom.active = true
ORDER BY 
    pt.name;