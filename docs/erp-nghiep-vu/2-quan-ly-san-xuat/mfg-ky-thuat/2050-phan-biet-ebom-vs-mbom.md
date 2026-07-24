---
id: 2050-phan-biet-ebom-vs-mbom
title: Phân biệt BOM Kỹ thuật và BOM Sản xuất (Engineering BOM vs Manufacturing BOM)
description: Phân biệt BOM Kỹ thuật và BOM Sản xuất (Engineering BOM vs Manufacturing BOM)
sidebar_label: EBOM vs MBOM
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2050-phan-biet-ebom-vs-mbom
sidebar_position: 2050
date: 2026-09-25
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, ebom, mbom, plm, sql]
---

# 2050 Phân biệt BOM Kỹ thuật và BOM Sản xuất (Engineering BOM vs Manufacturing BOM)

> **Lưu ý nghiệp vụ:** Bài viết này giải quyết bài toán cầu nối giữa phân hệ Thiết kế sản phẩm (PLM/R&D) và phân hệ Vận hành sản xuất dở dang (WIP/Shop Floor). Đây là bước chuyển giao dữ liệu gốc mang tính quyết định để hệ thống ERP hiểu đúng thiết kế kỹ thuật của sản phẩm.

Trong các nhà máy sản xuất chế tạo, sự mâu thuẫn dữ liệu lớn nhất thường phát sinh giữa phòng R&D (Thiết kế) và phòng Công nghệ sản xuất (Xưởng). Phòng R&D thiết kế sản phẩm theo các module chức năng hình học (EBOM), trong khi xưởng sản xuất lại cần cấp phát vật tư theo trình tự lắp ráp thực tế, bao gồm cả vật tư đóng gói và hóa chất tiêu hao (MBOM). 

Nếu không phân biệt và có cơ chế chuyển đổi chặt chẽ giữa hai loại BOM này, hệ thống ERP sẽ liên tục bị sai lệch dữ liệu tồn kho và kế toán không thể tính đúng giá thành. Bài viết này phân tích sâu kiến trúc dữ liệu, thuật toán đồng bộ và cách quản lý EBOM/MBOM trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. So sánh Bản chất nghiệp vụ: EBOM và MBOM

| Tiêu chí | BOM Kỹ thuật (EBOM - Engineering BOM) | BOM Sản xuất (MBOM - Manufacturing BOM) |
| :--- | :--- | :--- |
| **Bản chất** | Sản phẩm được **thiết kế** như thế nào. | Sản phẩm được **chế tạo** như thế nào. |
| **Phòng ban phụ trách** | Phòng R&D / Thiết kế kỹ thuật. | Phòng Công nghệ sản xuất / Kỹ thuật hệ thống. |
| **Nguồn dữ liệu gốc** | Xuất ra từ các phần mềm vẽ kỹ thuật CAD / PLM. | Khởi tạo trực tiếp hoặc đồng bộ sang phân hệ ERP để chạy MRP. |
| **Thành phần vật tư** | Chỉ bao gồm các chi tiết cấu thành vật lý, bản vẽ, linh kiện cơ khí/điện tử. | Bổ sung thêm: Vật tư đóng gói (thùng carton, pallet), vật tư tiêu hao (keo, mỡ bôi trơn, dung môi, mối hàn), và phế liệu thu hồi. |
| **Cấu trúc phân cấp** | Chia theo cụm chức năng module (ví dụ: cụm bó cáp, cụm mạch). | Chia theo trạm làm việc (Work Centers) và trình tự lắp ráp của Routing. |

---

## 2. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu quản lý sự khác biệt giữa EBOM và MBOM của các hãng ERP được thiết kế như sau:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Cơ chế phân tách** | Tách biệt hoàn toàn bằng trường phân loại loại BOM trên cùng một bảng dữ liệu gốc. | Không tách bảng riêng. Quản lý thông qua phiên bản thiết kế (**Revision**) và trạng thái phê duyệt. | Tách biệt hoàn toàn bằng cơ chế **BOM Usage** (Mục đích sử dụng BOM). | Quản lý vòng đời qua ứng dụng **Odoo PLM** riêng biệt; sau khi duyệt mới ghi đè vào BoM chính. |
| **Bảng dữ liệu gốc (Tables)** | `BOM_BILL_OF_MATERIALS` (Phân biệt bằng cột `assembly_type`). | `Erp.PartRev` (Revision đang thiết kế / chưa Approved vs Revision đã Approved). | `saphanadb.MAST` (Phân biệt bằng trường mục đích sử dụng `STLAN`). | Bảng lịch sử thay đổi thiết kế **`mrp.eco`** (Engineering Change Orders). |
| **Mã định danh loại BOM** | - `assembly_type = 2`: Engineering BOM<br/>- `assembly_type = 1`: Manufacturing BOM | - `Approved = 0`: EBOM đang phác thảo.<br/>- `Approved = 1`: MBOM sẵn sàng sản xuất. | - `STLAN = 2`: Engineering BOM<br/>- `STLAN = 1`: Manufacturing BOM | - `state = 'progress'`: EBOM đang sửa.<br/>- `state = 'done'`: MBOM hoạt động. |

---

## 3. So sánh luồng thiết lập và đồng bộ giao diện (UI Flows)

### a. Hệ thống Oracle EBS (Cơ chế Transfer/Copy Engineering Items — Bảng: `BOM_BILL_OF_MATERIALS`)
Oracle EBS phân tách hai phân hệ quản lý rất rõ ràng: **Engineering (ENG)** và **Bills of Material (BOM)**.
1. **Bước 1 (Thiết kế EBOM):** Kỹ sư vào phân hệ Engineering (`ENG > Bills > Engineering Bills`) để tạo BOM kỹ thuật cho sản phẩm. Hệ thống ghi nhận mã hàng này với thuộc tính `assembly_type = 2`.
2. **Bước 2 (Chuyển đổi sang MBOM):** Sau khi thiết kế hoàn tất, người dùng truy cập màn hình `ENG > Prototypes > Transfer Items` để chạy tiến trình đồng bộ hàng loạt (Mass Transfer).
3. **Bước 3 (Vận hành):** Hệ thống tự động sao chép cấu trúc EBOM sang phân hệ sản xuất chính thành MBOM với nhãn `assembly_type = 1`, cho phép xưởng sản xuất nhìn thấy dữ liệu và MRP bắt đầu tính toán nhu cầu vật tư.

### b. Hệ thống Epicor ERP (Triết lý Workbench Revision Approval — Bảng: `Erp.PartRev`)
Epicor không duy trì hai bảng BOM song song mà quản lý trạng thái sẵn sàng của Method of Manufacture (MoM):
1. **Bước 1 (Check out EBOM):** Kỹ sư đưa mã sản phẩm vào màn hình `Engineering Workbench` để xây dựng cấu trúc vật tư và công đoạn (EBOM). Lúc này, phiên bản Revision được ghi nhận ở trạng thái chưa phê duyệt (`Approved = false`).
2. **Bước 2 (Bổ sung vật tư MBOM):** Phòng công nghệ sản xuất gán thêm các vật tư tiêu hao (keo, mỡ bôi trơn) trực tiếp vào các công đoạn chạy máy tương ứng.
3. **Bước 3 (Phê duyệt MBOM):** Tích chọn cờ **`Approved`** và đặt ngày hiệu lực (`Effective Date`). Revision chuyển trạng thái sang `Approved = true` (chính thức trở thành MBOM). Lúc này, lệnh sản xuất và MRP mới có quyền truy cập dữ liệu.

### c. Hệ thống SAP S/4HANA (Triết lý BOM Usage — Bảng: `saphanadb.MAST` / `saphanadb.STKO`)
SAP quản lý đa dạng các loại cấu trúc sản phẩm thông qua chỉ số mục đích sử dụng BOM:
1. **Bước 1 (Tạo EBOM):** Kỹ sư R&D dùng T-Code `CS01` để tạo BOM, tại trường **`BOM Usage`**, chọn giá trị **`2`** (Engineering/Design). Đây là nơi lưu trữ cấu trúc nguyên bản từ bản vẽ CAD.
2. **Bước 2 (Tạo MBOM kế thừa):** Dùng T-Code `CS01` để tạo tiếp BOM sản xuất, tại trường **`BOM Usage`**, chọn giá trị **`1`** (Production). Tại màn hình nhập liệu, người dùng chọn tính năng `Copy From` và trỏ đến BOM Usage `2` đã tạo ở Bước 1.
3. **Bước 3 (Tinh chỉnh):** Trên BOM Usage `1` mới tạo, phòng công nghệ bổ sung thêm thùng carton, bao bì đóng gói. Hệ thống lưu vết riêng biệt 2 cấu trúc này.

### d. Hệ thống Odoo ERP (Triết lý Odoo PLM ECO — Bảng: `mrp.eco` / `mrp.bom`)
Odoo sử dụng phân hệ PLM (Product Lifecycle Management) độc lập để kiểm soát điểm chuyển giao dữ liệu:
1. **Bước 1 (Tạo Lệnh thay đổi ECO):** Khi có thiết kế mới, kỹ sư tạo một bản ghi **ECO (Engineering Change Order)** trong ứng dụng PLM.
2. **Bước 2 (Phác thảo EBOM):** Trong màn hình ECO, kỹ sư thực hiện chỉnh sửa, thêm bớt vật tư trên giao diện BoM phác thảo (Draft BoM) của lệnh thay đổi mà không làm ảnh hưởng đến BoM đang sản xuất dưới xưởng.
3. **Bước 3 (Duyệt và áp dụng):** Khi ECO đi qua toàn bộ các bước phê duyệt của các phòng ban (R&D, QA, MFG), người dùng bấm nút `Apply Change`. Hệ thống Odoo PLM sẽ tự động ghi đè cấu trúc thiết kế mới từ ECO trực tiếp vào BoM sản xuất chính (`mrp.bom`), chính thức biến nó thành MBOM đang hoạt động.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến EBOM & MBOM

### Bài toán 1: Xử lý vật tư tiêu hao không có trong bản vẽ thiết kế (Hóa chất, Keo dán, Sơn)
*   **Thực tế:** Bản vẽ CAD của chiếc tủ điện không hiển thị lượng Keo silicon dùng để chống nước tại các viền cửa. Tuy nhiên, nếu trên MBOM không khai báo Keo silicon, thủ kho sẽ không cấp phát được keo ra xưởng, và kế toán giá thành sẽ bỏ sót chi phí keo khi tính giá thành tủ điện.
*   **Giải pháp thực tế:**
    - Phòng R&D chỉ lưu trữ khung kim loại, bản lề trên cấu trúc thiết kế (EBOM).
    - Khi chuyển giao dữ liệu sang sản xuất (MBOM), kỹ sư công nghệ sẽ gán thêm Keo silicon (đơn vị: `Gram` hoặc `ML`) trực tiếp vào công đoạn dán viền (`Op 20`) trên MBOM.
    - Để tối ưu hóa hoạt động xuất kho lẻ tẻ, dòng vật tư keo silicon này thường được cấu hình phương thức cấp phát là **`Bulk`** hoặc **`Floor Stock`** (không chạy MRP cho mã này, xuất kho gộp một lần vào xưởng và tự động phân bổ chi phí).

### Bài toán 2: Chênh lệch cấp độ đóng gói (Packaging level) giữa hai đầu dữ liệu
*   **Thách thức:** Phòng R&D thiết kế chiếc lò vi sóng chỉ quan tâm đến các linh kiện điện tử, vỏ lò, khay kính (EBOM). Nhưng khi đóng gói xuất xưởng, MBOM bắt buộc phải có: thùng carton, xốp chống sốc, sách hướng dẫn sử dụng và tem nhãn dán ngoài thùng.
*   **Giải pháp thực tế:**
    - Toàn bộ vật tư đóng gói và sách hướng dẫn sử dụng được kỹ sư công nghệ gán trực tiếp vào công đoạn cuối cùng - công đoạn đóng gói (`Op 80`) trên cấu trúc MBOM của lò vi sóng.
    - Việc này đảm bảo khi hệ thống chạy MRP tính toán nhu cầu mua sắm, ERP sẽ gom cả nhu cầu của bo mạch điện tử lẫn nhu cầu của thùng carton đóng gói để gửi cho phòng mua hàng đồng thời.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu EBOM & MBOM

### a. Trên hệ thống Oracle EBS (PL/SQL)
Kiểm tra chênh lệch số lượng dòng vật tư giữa cấu trúc thiết kế (Engineering) và cấu trúc sản xuất (Manufacturing) để phát hiện sai sót dữ liệu đồng bộ:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Item Code",
    msib.description AS "Description",
    -- Đếm số lượng dòng vật tư của EBOM (assembly_type = 2)
    (SELECT COUNT(bic1.component_item_id) 
     FROM apps.bom_bill_of_materials bbm1
     INNER JOIN apps.bom_inventory_components bic1 ON bbm1.bill_sequence_id = bic1.bill_sequence_id
     WHERE bbm1.assembly_item_id = bbm.assembly_item_id 
       AND bbm1.organization_id = bbm.organization_id 
       AND bbm1.assembly_type = 2) AS "EBOM Component Count",
    -- Đếm số lượng dòng vật tư của MBOM (assembly_type = 1)
    (SELECT COUNT(bic2.component_item_id) 
     FROM apps.bom_bill_of_materials bbm2
     INNER JOIN apps.bom_inventory_components bic2 ON bbm2.bill_sequence_id = bic2.bill_sequence_id
     WHERE bbm2.assembly_item_id = bbm.assembly_item_id 
       AND bbm2.organization_id = bbm.organization_id 
       AND bbm2.assembly_type = 1) AS "MBOM Component Count"
FROM 
    apps.bom_bill_of_materials bbm
INNER JOIN apps.mtl_system_items_b msib ON bbm.assembly_item_id = msib.inventory_item_id AND bbm.organization_id = msib.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1'
GROUP BY 
    ood.organization_code, bbm.assembly_item_id, bbm.organization_id, msib.segment1, msib.description
ORDER BY 
    msib.segment1;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Kiểm tra danh sách các phiên bản Revision (`PartRev`) của sản phẩm, lọc ra các phiên bản chưa được Approve (vẫn ở trạng thái EBOM của R&D) và đã được Approve (sẵn sàng làm MBOM cho xưởng):

```sql
SELECT 
    pr.Company,
    pr.PartNum AS [Part Number],
    p.Description AS [Part Description],
    pr.RevisionNum AS [Revision ID],
    -- Trạng thái phê duyệt đại diện cho chuyển giao EBOM -> MBOM
    CASE pr.Approved 
        WHEN 1 THEN 'Approved - MBOM (Ready for WIP)'
        ELSE 'Draft - EBOM (Engineering Workbench)'
    END AS [BOM Status],
    pr.ApprovedBy AS [Approved By],
    pr.EffectiveDate AS [Effective Date],
    pr.DrawNum AS [Drawing Number / Blueprint Link]
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
Kiểm tra các mã vật tư đang tồn tại đồng thời cả hai loại BOM Usage `1` (MBOM) và Usage `2` (EBOM) để đối chiếu thông số hạch toán:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Material Code",
    m.STLAL AS "Alternative BOM",
    -- Phân loại mục đích sử dụng BOM (Usage)
    CASE m.STLAN 
        WHEN '1' THEN 'Production (MBOM)'
        WHEN '2' THEN 'Engineering/Design (EBOM)'
        ELSE m.STLAN 
    END AS "BOM Usage",
    h.ANDAT AS "Created On",
    h.ANNAM AS "Created By"
FROM 
    saphanadb.MAST m
INNER JOIN 
    saphanadb.STKO h ON m.STLNUM = h.STLNUM
WHERE 
    m.WERKS = '1000'
    AND m.STLAN IN ('1', '2') -- Chỉ lọc loại MBOM và EBOM
ORDER BY 
    m.MATNR, m.STLAN;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách các yêu cầu thay đổi kỹ thuật ECO (`mrp.eco`) đang được xử lý trong phân hệ PLM của Odoo để theo dõi tiến độ cập nhật thiết kế:

```sql
SELECT 
    eco.name AS "ECO Reference ID",
    pt.name AS "Affected Product",
    eco_type.name AS "ECO Change Category",
    -- Giai đoạn phê duyệt của ECO
    CASE eco.state
        WHEN 'confirmed' THEN 'Confirmed / Draft'
        WHEN 'progress' THEN 'In Progress / R&D Testing (EBOM)'
        WHEN 'done' THEN 'Approved & Applied to Production (MBOM)'
    END AS "Lifecycle Stage",
    eco.create_date AS "Initiated Date"
FROM 
    mrp_eco eco
INNER JOIN mrp_bom bom ON eco.bom_id = bom.id
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
LEFT JOIN mrp_eco_type eco_type ON eco.type_id = eco_type.id
WHERE 
    eco.active = true
ORDER BY 
    eco.create_date DESC;