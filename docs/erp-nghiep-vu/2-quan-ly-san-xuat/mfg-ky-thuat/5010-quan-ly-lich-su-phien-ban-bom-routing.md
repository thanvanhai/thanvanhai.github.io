---
id: 5010-quan-ly-lich-su-phien-ban-bom-routing
title: Quản lý Lịch sử, Phiên bản và Ngày hiệu lực của BOM/Routing
description: Thiết lập cấu hình ngày hiệu lực (Effectivity Dates), quản lý lịch sử thay đổi (Audit Trail) và phân cấp phiên bản (Revisions/Versions) của BOM và Routing để kiểm soát chặt chẽ vòng đời sản phẩm.
sidebar_label: Lịch sử & Phiên bản BOM/Routing
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/5010-quan-ly-lich-su-phien-ban-bom-routing
sidebar_position: 5010
date: 2026-11-05
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, version-control, effectivity-dates, sql]
---

# 5010 - Lịch sử & Phiên bản BOM/Routing

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập dữ liệu gốc (Master Data Setup & Version Control)** - cách cấu hình ngày hiệu lực (Effectivity Dates), quản lý lịch sử thay đổi (Audit Trail) và phân cấp phiên bản (Revisions/Versions) của BOM và Routing. Đối với quy trình giao dịch thực tế tự động chọn phiên bản sản xuất trên Lệnh sản xuất dở dang tại sàn, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP).

---

Trong môi trường sản xuất, dữ liệu định mức (BOM) và quy trình (Routing) không bao giờ đứng yên mà liên tục được cập nhật. Nếu hệ thống ERP chỉ cho phép ghi đè (overwrite) dữ liệu cũ, doanh nghiệp sẽ mất hoàn toàn dấu vết kiểm toán (Audit Trail): Không biết ai đã sửa đổi gì? Tại sao giá thành sản phẩm đột ngột thay đổi? Và làm thế nào để bóc tách lịch sử giá vốn của các lô hàng sản xuất trong quá khứ?

Để kiểm soát chặt chẽ, các hệ thống ERP thiết lập cơ chế **Quản lý lịch sử, Phiên bản và Ngày hiệu lực (Version Control & Effectivity Dates)**. Bài viết này phân tích sâu kiến trúc dữ liệu lưu vết lịch sử, thuật toán hiệu lực thời gian và luồng cấu hình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu lưu vết lịch sử

Để lưu vết lịch sử mà không làm gián đoạn hệ thống chạy dở dang, các hãng ERP sử dụng hai triết lý thiết kế cơ sở dữ liệu cốt lõi: **Quản lý theo Dòng thời gian hiệu lực (Date-Effectivity)** hoặc **Quản lý theo Phiên bản đóng gói (Revision-Control)**.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Triết lý kiểm soát** | **Date-Effectivity**: Quản lý hiệu lực theo ngày bắt đầu/kết thúc trên từng dòng nguyên liệu lẻ. | **Revision-Control**: Gom toàn bộ thay đổi thành một gói phiên bản (Revision) có ngày hiệu lực chung. | **Date-Effectivity + ECN**: Kết hợp thời gian hiệu lực trên dòng với mã thay đổi kỹ thuật (Change Number). | **Revision-Control + PLM**: Quản lý lịch sử qua các thẻ ECO; lưu vết phiên bản qua lịch sử đóng gói BoM. |
| **Bảng lưu vết lịch sử (Audit Trail)** | `BOM_INVENTORY_COMPONENTS` (Lưu trực tiếp lịch sử thay đổi trên từng dòng linh kiện). | **`Erp.PartRev`** (Lưu lịch sử đổi phiên bản) và **`Erp.PartOpr`** / **`Erp.PartMtl`** [2]. | Bảng **`saphanadb.STPO`** (Dòng BOM) liên kết mã thay đổi kỹ thuật `AENNR` [2]. | Bảng **`mrp.eco`** (Lưu vết chi tiết toàn bộ lịch sử phê duyệt và người thay đổi cấu trúc) [2]. |
| **Ngày bắt đầu hiệu lực** | `effectivity_date` (Ngày dòng linh kiện này bắt đầu được phép đưa vào sản xuất). | `PartRev.EffectiveDate` (Ngày toàn bộ gói thiết kế Revision này bắt đầu có hiệu lực). | `STPO.DATUV` (Valid-From date - Ngày dòng vật tư có hiệu lực theo mã Change Master) [2]. | Kích hoạt tự động khi thẻ ECO chuyển sang trạng thái `Effective` (Done). |
| **Ngày hết hiệu lực** | `disable_date` (Ngày dòng linh kiện này bị ngưng sử dụng trên hệ thống). | Tự động hết hiệu lực khi có một Revision mới hơn được Approved và đạt ngày hiệu lực. | `STPO.LKENZ` (Đánh dấu xóa logic bằng cờ Deletion Indicator khi có Change Master mới). | Ghi đè tự động bằng cấu trúc BoM mới sau khi lệnh thay đổi kỹ thuật ECO được duyệt [2]. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Triết lý Date-Effectivity trên dòng BOM — Bảng: `BOM_INVENTORY_COMPONENTS`)
Oracle EBS quản lý lịch sử thay đổi trực tiếp trên từng dòng linh kiện con của BOM:
1. **Bước 1 (Mở form BOM):** Truy cập `BOM > Bills > Bills`, mở cấu hình sản phẩm cha.
2. **Bước 2 (Thiết lập hiệu lực cho linh kiện cũ):** Tại dòng linh kiện cũ (ví dụ: Chíp A), người dùng tìm cột **`To`** (field DB: `disable_date`) và nhập ngày hết hạn (ví dụ nhập: `14/11/2026`).
3. **Bước 3 (Thêm linh kiện mới):** Tạo một dòng mới cho linh kiện thay thế (ví dụ: Chíp B). Tại cột **`From`** (field DB: `effectivity_date`), nhập ngày bắt đầu có hiệu lực (ví dụ nhập: `15/11/2026`). Hệ thống tự động ghi vết lịch sử người dùng và ngày chỉnh sửa vào các trường hệ thống `last_updated_by`, `last_update_date`.

### b. Hệ thống Epicor ERP (Triết lý Revision-Control — Bảng: `Erp.PartRev` / `Erp.PartMtl`)
Epicor bắt buộc mọi thay đổi cấu trúc MoM phải được đóng gói dưới một mã phiên bản Revision cụ thể:
1. **Bước 1 (Tạo Revision mới):** Trong màn hình `Part Maintenance`, tại tab `Revisions`, người dùng tạo một mã phiên bản mới (ví dụ tạo Rev `B` để thay thế cho Rev `A` hiện tại).
2. **Bước 2 (Cấu hình ngày hiệu lực):** Trên form Revision, tại trường **`Effective Date`** (field DB: `EffectiveDate`), nhập ngày bắt đầu áp dụng (ví dụ: `15/11/2026`).
3. **Bước 3 (Thiết lập MoM mới):** Check out Rev `B` vào `Engineering Workbench` để sửa đổi cấu trúc. Sau khi hoàn thành, bấm nút `Approved` (field DB: `Approved = True`). Kể từ ngày 15/11/2026, khi xưởng dập lệnh sản xuất, Epicor sẽ tự động bốc toàn bộ cấu trúc của Rev `B` và lưu vết lịch sử người sửa trong bảng `PartRev`.

### c. Hệ thống SAP S/4HANA (Triết lý ECN Date-Effectivity — Bảng: `saphanadb.STPO` / `saphanadb.AENR`)
SAP quản lý lịch sử thay đổi rất nghiêm ngặt thông qua việc bắt buộc sử dụng mã số hiệu thay thế kỹ thuật (Change Number):
1. **Bước 1 (Tạo Change Number):** Dùng T-Code `CC01` để tạo mã thay thế (ví dụ: `CN_1009`). Nhập ngày bắt đầu hiệu lực cho mã này là `15/11/2026`.
2. **Bước 2 (Sửa BOM có ghi vết):** Truy cập T-Code `CS02` để sửa BOM, tại màn hình đăng nhập, bắt buộc phải nhập mã `Change Number = CN_1009`. 
3. **Bước 3 (Vận hành tự động):** Tiến hành xóa linh kiện cũ, thêm linh kiện mới. SAP S/4HANA sẽ không ghi đè mất dữ liệu cũ. Hệ thống tự động tạo 2 bản ghi lịch sử trong bảng `STPO`:
   - Dòng linh kiện cũ: Tự động đánh dấu xóa logic bằng cờ `LKENZ = 'X'` kể từ ngày 15/11/2026.
   - Dòng linh kiện mới: Tự tạo ngày có hiệu lực `DATUV = 15/11/2026` và gán mã thay thế tạo dòng `AENNR = CN_1009`.

### d. Hệ thống Odoo ERP (Triết lý PLM Versioning — Bảng: `mrp.eco` / `mrp.bom`)
Odoo kết hợp quản lý lịch sử thay đổi trực quan thông qua phân hệ PLM:
1. **Bước 1 (Khởi tạo lệnh thay đổi ECO):** Người dùng tạo một ECO trong phân hệ PLM để bắt đầu quá trình cải tiến sản phẩm.
2. **Bước 2 (Chạy duyệt và lưu vết):** Toàn bộ lịch sử trao đổi bản vẽ, các ý kiến đóng góp của kỹ sư được lưu vết trực tiếp tại khu vực **Chatter (Nhật ký trao đổi)** nằm bên phải màn hình ECO.
3. **Bước 3 (Tự động cập nhật BoM):** Khi ECO được duyệt, Odoo tự động cập nhật BoM sản xuất chính. Đồng thời, Odoo PLM tự động lưu trữ một bản ghi lịch sử BoM cũ trong kho lưu trữ để người dùng có thể mở ra so sánh phiên bản (Version Comparison) bất kỳ lúc nào.

---

## 3. Thuật toán Đối chiếu Ngày hiệu lực của Hệ thống (Effectivity Dates Engine)

Khi bộ phận kế hoạch chạy kế hoạch nhu cầu vật tư (MRP) hoặc khi xưởng dập Lệnh sản xuất vào một ngày cụ thể (gọi là ngày nổ BOM - Explosion Date $D_{explosion}$):

### Thuật toán đối chiếu hiệu lực (Date Matching Logic):
Hệ thống ERP sẽ duyệt qua toàn bộ các dòng linh kiện của BOM để kiểm tra điều kiện:
- Nếu $D_{explosion} \ge \text{Effectivity Date}$ **VÀ** ($D_{explosion} < \text{Disable Date}$ hoặc $\text{Disable Date IS NULL}$): dòng linh kiện đó được đánh giá là **Khả dụng (Active)** và được đưa vào Lệnh sản xuất.
- Nếu ngày $D_{explosion}$ nằm ngoài dải thời gian trên: dòng linh kiện bị đánh giá là **Không khả dụng (Inactive)** và bị hệ thống tự động loại bỏ.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Vòng đời BOM

### Bài toán 1: Truy xuất lịch sử giá thành và cấu trúc BOM của lô hàng sản xuất trong quá khứ (Retroactive Auditing)
*   **Thách thức:** Khách hàng khiếu nại một lô sản phẩm xe đạp sản xuất vào ngày **01/01/2026** bị lỗi bo mạch điều khiển. Tuy nhiên, kể từ ngày 01/06/2026, nhà máy đã nâng cấp thiết kế lên bo mạch phiên bản mới hoàn toàn khác. Làm thế nào để kế toán giá thành và QA mở lại chính xác cấu trúc BOM và đơn giá của lô hàng đã sản xuất vào ngày 01/01/2026?
*   **Giải pháp thực tế:**
    - Nhờ kiến trúc dữ liệu lưu vết lịch sử không ghi đè, hệ thống ERP luôn giữ nguyên vẹn cấu trúc BOM cũ.
    - Người dùng chỉ cần truy cập màn hình tra cứu cấu trúc (ví dụ: màn hình `Indented Bill` của Oracle hoặc T-Code `CS11` của SAP), nhập ngày hiệu lực cần tra cứu (Explosion Date) lùi về ngày **`01/01/2026`**.
    - Hệ thống ERP sẽ tự động sử dụng thuật toán đối chiếu ngày hiệu lực, lọc bỏ toàn bộ các linh kiện nâng cấp sau tháng 6 và hiển thị chính xác 100% danh sách bo mạch điều khiển cũ cùng đơn giá hạch toán của đúng ngày 01/01/2026 để phục vụ công tác điều tra lỗi chất lượng.

### Bài toán 2: Chặn lỗi "Cấp phát nhầm vật tư lỗi thời" nhờ cơ chế khóa ngày hiệu lực tự động
*   **Thách thức:** Do thay đổi thiết kế, nhà máy quyết định ngừng sử dụng ốc vít nhựa `SCREW_PL` kể từ ngày **15/11/2026** để chuyển sang ốc vít sắt `SCREW_IR`. Kế hoạch mua hàng đã dừng nhập ốc vít nhựa từ lâu. Nếu điều độ viên vô tình lên lệnh sản xuất cho tuần sau (ngày 22/11/2026) mà hệ thống vẫn bốc nhầm ốc vít nhựa cũ, xưởng sẽ bị dừng máy hoàn toàn vì không có ốc nhựa trong kho để lắp ráp.
*   **Giải pháp thực tế:**
    - Cấu hình chính xác ngày ngưng hiệu lực (`Disable Date` / `Valid To`) của `SCREW_PL` là **`14/11/2026`** và ngày bắt đầu hiệu lực (`Effectivity Date` / `Valid From`) của `SCREW_IR` là **`15/11/2026`**.
    - Khi người dùng dập lệnh sản xuất có ngày chạy thực tế (Start Date) là ngày `22/11/2026`, thuật toán bốc tự động của hệ thống ERP sẽ đối chiếu ngày hiệu lực, tự động loại bỏ ốc vít nhựa cũ và nạp thẳng cấu hình ốc vít sắt mới vào lệnh sản xuất, ngăn chặn tuyệt đối rủi ro sai lệch vật tư dở dang tại sàn.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Lịch sử & Phiên bản

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn toàn bộ lịch sử thay đổi dòng linh kiện của BOM, hiển thị rõ khoảng thời gian hiệu lực (`From Date` - `To Date`) và kiểm tra trạng thái hoạt động hiện tại của linh kiện:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_p.segment1 AS "Parent Item",
    bic.item_num AS "Seq",
    msib_c.segment1 AS "Component Item",
    bic.effectivity_date AS "Effective From (From Date)",
    bic.disable_date AS "Effective To (To Date)",
    -- Kiểm tra trạng thái hoạt động thực tế ở thời điểm chạy query
    CASE 
        WHEN SYSDATE BETWEEN bic.effectivity_date AND NVL(bic.disable_date, SYSDATE + 1) THEN 'ACTIVE (Currently Used)'
        ELSE 'INACTIVE (Expired / Future)'
    END AS "Current Status",
    -- Ghi vết người dùng sửa đổi cuối cùng
    fu.user_name AS "Last Modified By",
    bic.last_update_date AS "Last Modified Date"
FROM 
    apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
LEFT JOIN apps.fnd_user fu ON bic.last_updated_by = fu.user_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
ORDER BY 
    msib_p.segment1, bic.effectivity_date DESC, bic.item_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn lịch sử phê duyệt các phiên bản Revision (`PartRev`) của sản phẩm kèm theo ngày hiệu lực và thông tin kỹ sư chịu trách nhiệm ký duyệt trên Epicor:

```sql
SELECT 
    pr.Company,
    pr.PartNum AS [Part Number],
    pr.RevisionNum AS [Revision ID],
    pr.Description AS [Rev Description],
    -- Trạng thái phê duyệt (1 = Approved, 0 = Draft)
    CASE pr.Approved 
        WHEN 1 THEN 'Approved - Active MBOM'
        ELSE 'Draft - EBOM'
    END AS [Approval Status],
    pr.EffectiveDate AS [Effective Date],       -- Ngày bắt đầu có hiệu lực của cả gói Revision
    pr.ChangedBy AS [Last Modified By],
    pr.ChangeDate AS [Last Modified Date],
    pr.ApprovedBy AS [Approved By]
FROM 
    Erp.PartRev pr
WHERE 
    pr.Company = 'EP01'
ORDER BY 
    pr.PartNum, pr.EffectiveDate DESC;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn dữ liệu định mức BOM Line (`STPO`) của SAP kết hợp mã số hiệu thay thế kỹ thuật (`AENNR`) để kiểm tra lịch sử người dùng và ngày hiệu lực:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material",
    i.POSNR AS "BOM Item Number",
    i.IDNRK AS "Component Material",
    i.DATUV AS "Valid From Date",         -- Ngày bắt đầu hiệu lực của dòng
    i.AENNR AS "Created by Change No",     -- Mã ECO gốc khi tạo dòng
    i.AENRA AS "Changed by Change No",     -- Mã ECO sửa đổi/hủy dòng
    -- Đánh giá trạng thái xóa logic của SAP (LKENZ = 'X' tương đương đã hết hạn hiệu lực)
    CASE i.LKENZ 
        WHEN 'X' THEN 'Expired / Deleted Logic' 
        ELSE 'Active' 
    END AS "Line Status"
FROM 
    saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
WHERE 
    m.WERKS = '1000'
ORDER BY 
    m.MATNR, i.DATUV DESC, i.POSNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn nhật ký thay đổi và lưu vết phiên bản của cấu trúc BoM từ cơ sở dữ liệu Odoo phục vụ công tác kiểm toán dữ liệu:

```sql
SELECT 
    pt.name AS "Product Name Template",
    bom.code AS "BoM Version Code",
    bom.write_date AS "Last Modified Date",
    -- Đọc thông tin người sửa đổi cuối cùng từ hệ thống Odoo
    res_partner.name AS "Last Modified By"
FROM 
    mrp_bom bom
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
LEFT JOIN res_users ON bom.write_uid = res_users.id
LEFT JOIN res_partner ON res_users.partner_id = res_partner.id
WHERE 
    bom.active = true
ORDER BY 
    pt.name, bom.write_date DESC;