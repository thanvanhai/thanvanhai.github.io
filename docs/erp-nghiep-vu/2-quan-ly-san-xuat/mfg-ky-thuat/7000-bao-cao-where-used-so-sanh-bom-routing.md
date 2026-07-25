---
id: 7000-bao-cao-where-used-so-sanh-bom-routing
title: Báo cáo Where-used và so sánh phiên bản BOM/Routing (Where-used Report & Version Comparison)
description: Thiết lập và sử dụng các công cụ phân tích kỹ thuật hệ thống sản xuất bao gồm phân rã ngược Where-Used và đối chiếu chênh lệch giữa hai phiên bản BOM/Routing.
sidebar_label: Where-used & So sánh BOM/Routing
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/7000-bao-cao-where-used-so-sanh-bom-routing
sidebar_position: 7000
date: 2026-11-22
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, where-used, bom-comparison, analytics, sql]
---

# 7000 - Báo cáo Where-used & So sánh BOM

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Báo cáo phân tích (Analytics & Audit Setup)** - cách chạy báo cáo Where-used đa cấp và thực hiện so sánh đối chiếu kỹ thuật giữa các phiên bản BOM/Routing để đánh giá tác động kỹ thuật [2]. Đối với các quy trình báo cáo phân tích biến động chi phí sản xuất thực tế tại xưởng (Production Cost Variance), vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP) hoặc Tài chính (FIN).

---

Khi nhà máy vận hành với hàng ngàn cấu trúc định mức phức tạp, kỹ sư công nghệ và nhân viên kiểm soát thay đổi (Change Manager) cần hai công cụ phân tích cực kỳ mạnh mẽ để giám sát dữ liệu: **Báo cáo nơi sử dụng (Where-Used Report)** [2] và **Công cụ đối chiếu phiên bản (BOM/Routing Comparison)** [2]. 

Công cụ Where-Used giúp khoanh vùng khẩn cấp các sản phẩm bị ảnh hưởng khi một linh kiện con bị lỗi chất lượng hoặc ngưng hoạt động [2]. Trong khi đó, công cụ đối chiếu phiên bản giúp kế toán và kỹ sư nhìn thấy rõ rệt từng con ốc, sợi dây nào đã được thêm mới, thay đổi số lượng hay bị xóa bỏ giữa hai phiên bản kỹ thuật [2]. Bài viết này phân tích sâu kiến trúc dữ liệu phân tích báo cáo và cách thức vận hành trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ Kiến trúc dữ liệu báo cáo phân tích (Reporting Database Architecture)

Bản đồ dưới đây tổng hợp các chương trình chạy báo cáo tiêu chuẩn và các bảng dữ liệu kỹ thuật làm cơ sở dữ liệu để hệ thống ERP thực hiện truy vấn đối chiếu:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Công cụ Where-Used** | Chương trình concurrent **BOM Where-Used Report** quét ngược đệ quy từ bảng dòng linh kiện [2]. | Tracker chuyên dụng **Part Where Used** hiển thị cấu trúc cây ngược của vật tư [2]. | T-Code chuẩn hệ thống **`CS15`** (BOM Where-Used List: Single/Multi-level) [2]. | Nút bấm thông minh **Used in BoMs** tích hợp trực tiếp tại form Product Template [2]. |
| **Công cụ đối chiếu BOM** | Báo cáo hệ thống **BOM Comparison Report** so sánh hai cấu trúc dập nhãn Alternate. | Tính năng **Method Compare** tích hợp trong Engineering Workbench để đối chiếu 2 MoM [2]. | T-Code chuẩn hệ thống **`CS14`** (BOM Comparison - So sánh 2 BOM đa dạng tham số) [2]. | Tính năng so sánh **BoM Difference** nằm trực tiếp trên thẻ ECO của phân hệ Odoo PLM [2]. |
| **Bảng dữ liệu truy vấn** | `BOM_BILL_OF_MATERIALS` và `BOM_INVENTORY_COMPONENTS` | `Erp.PartMtl` (Lines) và `Erp.PartOpr` (Công đoạn) [2]. | `saphanadb.MAST`, `STKO` và `STPO` [2]. | `mrp.bom`, `mrp.bom.line` và `mrp.eco` [2]. |

---

## 2. So sánh tính năng và luồng vận hành báo cáo (UI & Feature Comparison)

### a. Hệ thống Oracle EBS (BOM Where-Used & Comparison — Bảng: `BOM_BILL_OF_MATERIALS` / `BOM_INVENTORY_COMPONENTS`)
Oracle EBS quản lý báo cáo thông qua phân hệ truy vấn tích hợp:
1. **Báo cáo Where-Used:** Người dùng vào `BOM > Inquiry > Where-Used`. Nhập mã linh kiện con (field DB: `component_item_id`). Hệ thống cho phép chọn hiển thị `Single-level` (Chỉ cấp cha trực tiếp) hoặc `Multi-level` (Quét ngược toàn bộ các cấp lên đỉnh) để hiển thị danh sách sản phẩm bị ảnh hưởng.
2. **Báo cáo So sánh BOM:** Chạy chương trình concurrent `Bill of Materials Comparison Report`. Người dùng nhập mã sản phẩm cha A và sản phẩm cha B (hoặc so sánh giữa Primary và Alternate của cùng 1 sản phẩm) để hệ thống xuất ra báo cáo so sánh chênh lệch dạng văn bản (Text Report).

### b. Hệ thống Epicor ERP (Method Compare & Part Where-Used — Bảng: `Erp.PartMtl` / `Erp.PartOpr` [2])
Epicor cung cấp giao diện đối chiếu trực quan vô cùng hiện đại cho kỹ sư công nghệ:
1. **Công cụ Part Where Used:** Truy cập `Part Where Used Tracker` [2]. Nhập mã vật tư (field DB: `MtlPartNum`) [2]. Hệ thống hiển thị sơ đồ cây ngược rất trực quan, cho thấy linh kiện này đang xuất hiện ở những Job sản xuất dở dang nào và Revisions nào [2].
2. **Công cụ Method Compare:** Trong `Engineering Workbench`, người dùng mở tính năng `Compare Methods` [2]. Giao diện hiển thị hai cây cấu trúc MoM song song [2]. Hệ thống tự động quét và tô màu trực quan các dòng chênh lệch:
   - Dòng màu **Xanh lá**: Nguyên liệu hoặc công đoạn được thêm mới ở Rev mới [2].
   - Dòng màu **Đỏ**: Nguyên liệu hoặc công đoạn đã bị xóa bỏ ở Rev mới [2].
   - Dòng màu **Vàng**: Có sự thay đổi về thông số (ví dụ thay đổi định mức số lượng `QtyPer` hoặc thời gian chạy máy) [2].

### c. Hệ thống SAP S/4HANA (CS14 / CS15 Tools — Bảng: `MAST` / `STKO` / `STPO` [2])
SAP cung cấp các T-Code phân tích chuyên sâu cho cả BOM và Quy trình công nghệ (Routing):
1. **T-Code CS15 (Where-Used List):** Cho phép nhập mã vật tư con (field DB: `IDNRK`), chọn phạm vi quét và hiển thị toàn bộ cây sản phẩm cha [2]. Kế toán thường dùng CS15 để đánh giá tác động giá thành trước khi thay đổi đơn giá nguyên liệu.
2. **T-Code CS14 (BOM Comparison):** Cho phép đối chiếu chi tiết giữa 2 BOM khác nhau. Người dùng có thể so sánh giữa 2 mã sản phẩm khác nhau, hoặc so sánh 2 phiên bản BOM khác nhau (`Alternative BOM` - field DB: `STLAL`) của cùng một sản phẩm [2]. Kết quả xuất ra bảng báo cáo phân tích chi tiết từng mã linh kiện bị thừa/thiếu hoặc lệch định mức.

### d. Hệ thống Odoo ERP (ECO BoM Difference & Used in BoMs — Bảng: `mrp.bom` / `mrp.eco` [2])
Odoo sử dụng sức mạnh của ứng dụng PLM để hiển thị trực quan các thay đổi:
1. **Used in BoMs:** Trên form sản phẩm con, bấm nút thông minh `Used in BoMs` để xem nhanh danh sách định mức chứa vật tư [2].
2. **BoM Difference trong ECO:** Khi kỹ sư tạo một yêu cầu thay đổi ECO trên phân hệ PLM để cập nhật BoM mới [2], Odoo cung cấp tab **`BoM Changes`**. Tại đây, hệ thống tự động đối chiếu bản BoM nháp hiện tại với bản BoM sản xuất chính đang hoạt động dưới xưởng và hiển thị dạng log so sánh: tự động bôi đỏ dòng linh kiện bị loại bỏ và bôi xanh dòng linh kiện mới được đưa vào thiết kế, giúp hội đồng duyệt ECO nhìn thấy rõ rệt hệ quả thay đổi trước khi bấm duyệt [2].

---

## 3. Thuật toán Đối chiếu chênh lệch giữa hai phiên bản BOM (BOM Comparison)

Khi chạy tiến trình so sánh hai phiên bản BOM (Ví dụ: So sánh BOM phiên bản $A$ và phiên bản $B$ của cùng một sản phẩm), công cụ Costing/Engineering của hệ thống ERP sẽ thực hiện thuật toán **FULL OUTER JOIN** dựa trên khóa liên kết gồm: `Số thứ tự (Sequence)` + `Mã nguyên liệu (Component ID)`.

### Các trạng thái chênh lệch được phân loại bởi thuật toán:
*   **ADDED (Thêm mới):** Dòng vật tư tồn tại trong BOM $B$ nhưng không tồn tại trong BOM $A$.
*   **DELETED (Xóa bỏ):** Dòng vật tư tồn tại trong BOM $A$ nhưng không tồn tại trong BOM $B$.
*   **MODIFIED (Thay đổi):** Dòng vật tư tồn tại ở cả hai phiên bản, nhưng có sự sai lệch về định mức số lượng ($Quantity_{A} \neq Quantity_{B}$) hoặc hệ số hao hụt.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Phân tích so sánh

### Bài toán 1: Truy vết khẩn cấp và thu hồi toàn bộ cụm sản phẩm chứa linh kiện lỗi (Component Recall)
*   **Thách thức:** Nhà máy sản xuất ô tô nhận được thông báo từ nhà cung cấp: Lô chíp cảm biến phanh `SENSOR_A` nhập kho vào tháng 8 có rủi ro bị đoản mạch khi gặp nước. Nhà máy bắt buộc phải thu hồi và khóa lập tức toàn bộ các xe đang sản xuất dở dang có chứa loại cảm biến của lô lỗi này. Làm sao để truy vết chính xác?
*   **Giải pháp thực tế:**
    - Điều hành viên chạy báo cáo **`Where-Used`** đa cấp (Multi-level) cho mã chíp lỗi `SENSOR_A`.
    - Hệ thống tự động phân rã ngược: Chỉ ra chíp `SENSOR_A` được dùng trực tiếp ở Cụm mạch phanh `SUB_BRAKE`, cụm này tiếp tục lắp vào Bộ trục bánh xe `SUB_AXLE`, và bộ trục này cuối cùng lắp vào mẫu xe thành phẩm `CAR_MODEL_05`.
    - Kết hợp với số lô nhập kho (Lot tracking), hệ thống truy xuất chính xác danh sách các Lệnh sản xuất dở dang (WIP Jobs) và số khung xe đang nằm trên chuyền có tiêu hao đúng lô chíp hỏng, giúp nhà máy thực hiện phong tỏa và thay thế linh kiện lỗi kịp thời, ngăn chặn rủi ro an toàn nghiêm trọng.

### Bài toán 2: Giải trình biến động giá vốn sản phẩm cho Ban giám đốc cuối năm
*   **Thách thức:** Cuối năm, Giám đốc tài chính yêu cầu phòng Công nghệ giải trình: Tại sao giá vốn định mức (Standard Cost) của sản phẩm Máy hút bụi gia đình năm nay lại tăng vọt thêm 12% so với giá thành định mức của năm ngoái, trong khi đơn giá mua nguyên liệu đầu vào từ các nhà cung cấp không hề biến động?
*   **Giải pháp thực tế:**
    - Kế toán chạy công cụ đối chiếu BOM **T-Code `CS14`** của SAP hoặc chạy chương trình **`Method Compare`** của Epicor để so sánh BOM năm ngoái (BOM Rev `A`) và BOM năm nay (BOM Rev `B`) [2].
    - Kết quả đối chiếu hiển thị rõ: Trong cấu trúc mới năm nay, kỹ sư thiết kế đã thêm mới 2 dòng gioăng cao su chống rung (`ADDED` - đơn giá tăng thêm 8%), đồng thời công đoạn kiểm thử cuối quy trình (`Op 80`) trên Routing được bổ sung thêm 5 phút chạy máy test an toàn (`MODIFIED` - làm tăng chi phí hoạt động Work Center thêm 4%).
    - Báo cáo đối chiếu trực quan này giúp phòng công nghệ có đầy đủ bằng chứng khoa học để giải trình minh bạch cho ban giám đốc về việc tăng chi phí là do nâng cấp tiêu chuẩn kỹ thuật của sản phẩm.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra & Đối chiếu dữ liệu

### a. Trên hệ thống Oracle EBS (PL/SQL - Báo cáo Where-Used)
Truy vấn Where-Used đa cấp tìm toàn bộ các sản phẩm cha có chứa linh kiện mục tiêu để phục vụ công tác đánh giá tác động thu hồi hàng lỗi:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_c.segment1 AS "Target Component Code",
    msib_c.description AS "Component Description",
    msib_p.segment1 AS "Affected Parent Item Code",
    msib_p.description AS "Parent Description",
    bic.item_num AS "BOM Sequence",
    bic.component_quantity AS "Qty Used per Parent",
    msib_p.inventory_item_status_code AS "Parent Status"
FROM 
    apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1'
    AND msib_c.segment1 = 'SENSOR_RECALL_01' -- THAY BẰNG MÃ LINH KIỆN LỖI CẦN THU HỒI
    AND (bic.disable_date IS NULL OR bic.disable_date > SYSDATE)
ORDER BY 
    msib_p.segment1;
```

### b. Trên hệ thống Epicor ERP (SQL Server - Thuật toán Đối chiếu 2 phiên bản Revision)
Sử dụng câu lệnh SQL FULL OUTER JOIN để đối chiếu chi tiết chênh lệch cấu trúc định mức nguyên liệu giữa phiên bản Revision `A` và Revision `B` của cùng một sản phẩm trên Epicor [2]:

```sql
SELECT 
    COALESCE(revA.MtlPartNum, revB.MtlPartNum) AS [Component Part Code],
    revA.MtlSeq AS [Rev A Sequence],
    revA.QtyPer AS [Qty in Rev A],
    revB.MtlSeq AS [Rev B Sequence],
    revB.QtyPer AS [Qty in Rev B],
    -- Thuật toán phân loại trạng thái chênh lệch giữa 2 phiên bản [2]
    CASE 
        WHEN revA.MtlPartNum IS NULL THEN 'ADDED IN REVISION B'
        WHEN revB.MtlPartNum IS NULL THEN 'DELETED IN REVISION B'
        WHEN revA.QtyPer <> revB.QtyPer THEN 'QUANTITY MODIFIED'
        ELSE 'NO CHANGE'
    END AS [Comparison Result Status]
FROM 
    -- Nạp dữ liệu BOM của Revision A
    (SELECT MtlPartNum, MtlSeq, QtyPer 
     FROM Erp.PartMtl 
     WHERE Company = 'EP01' AND PartNum = 'PART_MOTORBIKE' AND RevisionNum = 'A') revA
-- Thực hiện FULL OUTER JOIN để tìm kiếm chênh lệch 2 chiều [2]
FULL OUTER JOIN 
    -- Nạp dữ liệu BOM của Revision B
    (SELECT MtlPartNum, MtlSeq, QtyPer 
     FROM Erp.PartMtl 
     WHERE Company = 'EP01' AND PartNum = 'PART_MOTORBIKE' AND RevisionNum = 'B') revB 
     ON revA.MtlPartNum = revB.MtlPartNum
ORDER BY 
    [Component Part Code];
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL - Đối chiếu 2 phiên bản Alternative BOM)
Thực hiện truy vấn đối chiếu chênh lệch dòng vật tư giữa phiên bản Alternative BOM `01` và phiên bản `02` của cùng một sản phẩm thuộc SAP S/4HANA [2]:

```sql
SELECT 
    COALESCE(bom1.IDNRK, bom2.IDNRK) AS "Component Material Code",
    bom1.POSNR AS "Alt 01 BOM Item No",
    bom1.MENGE AS "Quantity in Alt 01",
    bom2.POSNR AS "Alt 02 BOM Item No",
    bom2.MENGE AS "Quantity in Alt 02",
    -- Đánh giá chênh lệch kỹ thuật [2]
    CASE 
        WHEN bom1.IDNRK IS NULL THEN 'ADDED IN ALT 02'
        WHEN bom2.IDNRK IS NULL THEN 'DELETED IN ALT 02'
        WHEN bom1.MENGE <> bom2.MENGE THEN 'QUANTITY RE-SPECIFIED'
        ELSE 'IDENTICAL'
    END AS "Comparison Status"
FROM 
    -- BOM Alternative 01
    (SELECT i.IDNRK, i.POSNR, i.MENGE 
     FROM saphanadb.MAST m 
     INNER JOIN saphanadb.STPO i ON m.STLNUM = i.STLNUM 
     WHERE m.WERKS = '1000' AND m.MATNR = 'MAT_VACUUM_CLEANER' AND m.STLAL = '01' AND i.LKENZ = ' ') bom1
FULL OUTER JOIN 
    -- BOM Alternative 02
    (SELECT i.IDNRK, i.POSNR, i.MENGE 
     FROM saphanadb.MAST m 
     INNER JOIN saphanadb.STPO i ON m.STLNUM = i.STLNUM 
     WHERE m.WERKS = '1000' AND m.MATNR = 'MAT_VACUUM_CLEANER' AND m.STLAL = '02' AND i.LKENZ = ' ') bom2 
     ON bom1.IDNRK = bom2.IDNRK
ORDER BY 
    "Component Material Code";
```

### d. Trên hệ thống Odoo ERP (PostgreSQL - Đối chiếu cấu trúc 2 BoM ID khác nhau)
Đối chiếu chi tiết chênh lệch linh kiện giữa hai bản ghi BoM khác nhau của cùng một sản phẩm mẫu trong cơ sở dữ liệu Odoo [2]:

```sql
SELECT 
    COALESCE(pt_c1.name, pt_c2.name) AS "Component Product Name",
    l1.product_qty AS "BoM ID 01 Qty",
    l2.product_qty AS "BoM ID 02 Qty",
    -- Phân loại chênh lệch vật tư [2]
    CASE 
        WHEN l1.id IS NULL THEN 'ADDED IN BoM 2'
        WHEN l2.id IS NULL THEN 'DELETED IN BoM 2'
        WHEN l1.product_qty <> l2.product_qty THEN 'QTY CHANGED'
        ELSE 'IDENTICAL'
    END AS "Comparison Result"
FROM 
    -- Dòng linh kiện của BoM thứ nhất
    (SELECT bl.product_id, bl.product_qty, bl.id 
     FROM mrp_bom_line bl WHERE bl.bom_id = 1) l1 -- Thay bằng BoM ID 1 thực tế
FULL OUTER JOIN 
    -- Dòng linh kiện của BoM thứ hai
    (SELECT bl.product_id, bl.product_qty, bl.id 
     FROM mrp_bom_line bl WHERE bl.bom_id = 2) l2 -- Thay bằng BoM ID 2 thực tế
     ON l1.product_id = l2.product_id
LEFT JOIN product_product pp ON COALESCE(l1.product_id, l2.product_id) = pp.id
LEFT JOIN product_template pt_c1 ON pp.product_tmpl_id = pt_c1.id
LEFT JOIN product_template pt_c2 ON pp.product_tmpl_id = pt_c2.id
ORDER BY 
    "Component Product Name";