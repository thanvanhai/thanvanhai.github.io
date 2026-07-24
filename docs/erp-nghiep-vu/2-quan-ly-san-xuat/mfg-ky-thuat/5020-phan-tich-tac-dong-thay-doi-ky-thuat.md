---
id: 5020-phan-tich-tac-dong-thay-doi-ky-thuat
title: Phân tích tác động khi phát sinh thay đổi kỹ thuật (Impact / Where-used Analysis for ECO)
description: Thiết lập quy trình chạy báo cáo Where-used, truy vấn hệ quả lên cây BOM/Routing và phân tích tồn kho tĩnh/dở dang tại sàn trước khi phê duyệt áp dụng ECO.
sidebar_label: Phân tích tác động ECO
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/5020-phan-tich-tac-dong-thay-doi-ky-thuat
sidebar_position: 5020
date: 2026-11-08
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, where-used, impact-analysis, eco, sql]
---

# 5020 - Phân tích tác động ECO

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập hệ thống (Master Data Setup & Analysis)** - cách chạy báo cáo truy vấn nơi sử dụng (Where-used), phân tích hệ quả thay đổi lên cấu trúc cây sản phẩm và đánh giá số liệu tồn kho kế hoạch trước khi phê duyệt ECO [2]. Đối với quy trình dập lệnh thu hồi vật tư lỗi thời thực tế tại sàn (Unused Material Return) hoặc hủy/sửa nóng lệnh sản xuất đang chạy, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP).

---

Trước khi chính thức phê duyệt một Lệnh thay đổi kỹ thuật (ECO) để thay đổi linh kiện A sang linh kiện B, kỹ sư R&D bắt buộc phải trả lời được câu hỏi: **"Việc thay đổi này sẽ ảnh hưởng đến những sản phẩm nào khác trong nhà máy?"** và **"Lượng tồn kho hiện tại của linh kiện cũ là bao nhiêu để xác định thời điểm thay thế tối ưu?"**. 

Nếu phê duyệt ECO mà không chạy **Phân tích tác động (Impact Analysis)** và **Truy vấn nơi sử dụng (Where-Used Analysis)**, doanh nghiệp sẽ phải đối mặt với nguy cơ lãng phí hàng tỷ đồng tiền vật tư cũ đang nằm trong kho hoặc làm tắc nghẽn hàng loạt đơn hàng đang sản xuất dở dang. Bài viết này phân tích sâu kiến trúc dữ liệu phân tích tác động kép và cách thức vận hành trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu phân tích tác động kép (Dual-Impact Architecture)

Để thực hiện phân tích tác động toàn diện, hệ thống ERP phải quét dữ liệu theo hai chiều: **Chiều dọc (Cấu trúc kỹ thuật - BOM/Routing)** và **Chiều ngang (Vận hành thực tế - Stock/WIP/PO)**:

```text
                                [ LINH KIỆN CŨ A ]
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼ (Chiều dọc: Structural Impact)                          ▼ (Chiều ngang: Operational Impact)
   [ TRUY VẤN WHERE-USED ]                                   [ TRUY VẤN VẬN HÀNH THỰC TẾ ]
   - Tìm mọi sản phẩm cha chứa A                             - Kiểm tra tồn kho tĩnh thực tế (On-hand)
   - Tìm các công đoạn Routing dùng A                        - Kiểm tra nguyên liệu dở dang tại sàn (WIP)
   - Tìm các công thức PV/Recipe chứa A                      - Kiểm tra các Đơn mua hàng đang treo (Open POs)
```

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Truy vấn Where-used (BOM)** | Sử dụng tính năng **BOM Where-Used Inquiry** quét đệ quy ngược từ con lên cha. | Sử dụng công cụ **Part Where Used Tracker** để tìm tất cả MoM chứa linh kiện. | Sử dụng T-Code báo cáo hệ thống **`CS15`** (BOM Where-Used List: Single/Multi-level). | Sử dụng nút thông minh **Used in BoMs** trực tiếp trên form sản phẩm. |
| **Bảng dữ liệu truy vấn** | `BOM_BILL_OF_MATERIALS` và `BOM_INVENTORY_COMPONENTS` | Bảng cấu hình định mức nguyên liệu gốc **`Erp.PartMtl`**. | Bảng liên kết `saphanadb.MAST` và bảng dòng `saphanadb.STPO`. | Bảng quản lý dòng định mức nguyên liệu **`mrp.bom.line`**. |
| **Kiểm tra Open PO / WIP** | Truy vấn chéo sang phân hệ WIP (`WIP_DISCRETE_JOBS`) và PO (`PO_LINES_ALL`). | Truy vấn chéo sang bảng lệnh sản xuất `Erp.JobMtl` và đơn mua hàng `Erp.PODetail`. | Truy vấn chéo sang bảng đơn sản xuất `saphanadb.AFKO` và đơn mua hàng `saphanadb.EKPO`. | Truy vấn chéo sang phân hệ Purchases (`purchase.order.line`) và Manufacturing (`mrp.production`). |

---

## 2. So sánh luồng thiết lập và truy vấn giao diện (UI & Inquiry Flows)

### a. Hệ thống Oracle EBS (BOM Where-Used Inquiry — Bảng: `BOM_BILL_OF_MATERIALS` / `BOM_INVENTORY_COMPONENTS`)
Oracle EBS cung cấp màn hình truy vấn nơi sử dụng độc lập và tích hợp trực tiếp vào quy trình ECO:
1. **Bước 1 (Truy vấn nhanh):** Người dùng truy cập `BOM > Inquiry > Where-Used`. Nhập mã linh kiện cũ cần kiểm tra (ví dụ: `CHIP_A`). Hệ thống hiển thị toàn bộ danh sách các sản phẩm cha có chứa `CHIP_A` kèm theo số lượng định mức.
2. **Bước 2 (Tích hợp ECO):** Khi tạo một ECO mới (`ENG > ECOs > ECOs`), tại màn hình `Revised Items`, người dùng sử dụng tính năng `Where-Used` để hệ thống tự động tải (Auto-populate) toàn bộ danh sách các sản phẩm cha bị tác động vào lệnh thay đổi mà không cần gõ thủ công từng mã.

### b. Hệ thống Epicor ERP (Part Where Used Tracker — Bảng: `Erp.PartMtl`)
Epicor quản lý truy vết thông qua một màn hình Tracker chuyên dụng:
1. **Bước 1 (Mở Part Tracker):** Người dùng truy cập `Production Management > Inventory Management > Use > Part Tracker`, chọn mã linh kiện cần kiểm tra.
2. **Bước 2 (Chạy phân tích):** Chuyển sang tab `Where Used`, bấm `Retrieve`. Giao diện hiển thị cấu trúc cây ngược: Chỉ rõ linh kiện này đang nằm dưới những Revision nào của những mã sản phẩm cha nào.
3. **Bước 3 (Kiểm tra Job dở dang):** Chuyển tiếp sang tab `WIP` để hệ thống hiển thị danh sách các lệnh sản xuất hiện hành (Jobs) đang tiêu thụ linh kiện này dở dang trên xưởng.

### c. Hệ thống SAP S/4HANA (BOM Where-Used List T-Code CS15 — Bảng: `saphanadb.MAST` / `saphanadb.STPO`)
SAP cung cấp công cụ phân rã ngược vô cùng mạnh mẽ cho phép lọc theo nhà máy và loại BOM:
1. **Bước 1 (Chạy báo cáo):** Người dùng truy cập T-Code **`CS15`** (BOM Where-Used List).
2. **Bước 2 (Nhập tham số lọc):** Nhập mã vật tư con (field DB: `IDNRK`), chọn nhà máy (`Plant`) và chọn loại phân rã:
   - `Direct`: Chỉ tìm sản phẩm cha trực tiếp ở cấp kề trên (Single-level).
   - `Multi-level`: Phân rã đệ quy ngược lên tận thành phẩm cuối cùng ở đỉnh của cây (ví dụ: Chíp A $\rightarrow$ cụm mạch $\rightarrow$ tủ điều khiển $\rightarrow$ máy nén khí).
3. **Bước 3 (Đánh giá):** Hệ thống xuất ra bảng kết quả chi tiết, phục vụ đắc lực cho công tác đánh giá tác động kỹ thuật.

### d. Hệ thống Odoo ERP (Used in BoMs Smart Button — Bảng: `mrp.bom.line`)
Odoo tối giản hóa bằng việc thiết kế một nút bấm thông minh ngay trên giao diện danh mục sản phẩm:
1. **Bước 1 (Mở form sản phẩm):** Truy cập `Manufacturing > Products > Products`, tìm linh kiện con cần kiểm tra.
2. **Bước 2 (Truy cập Used in BoMs):** Trên góc phải của form sản phẩm, bấm vào nút thông minh **`Used in BoMs`**.
3. **Bước 3 (Vận hành):** Odoo hiển thị danh sách các BoM hoạt động đang chứa linh kiện này. Từ màn hình này, kỹ sư có thể bấm mở trực tiếp các BoM tương ứng để tiến hành sửa đổi.

---

## 3. Thuật toán phân tích Tác động kép (Dual-Impact Analysis Algorithm)

Khi kỹ sư nhấn nút chạy tiến trình phân tích tác động trên form ECO, hệ thống ERP sẽ kích hoạt thuật toán truy vấn quét chéo cơ sở dữ liệu để ước tính tổng thiệt hại chi phí nếu thay đổi ngay lập tức:

### Các bước chạy thuật toán của hệ thống:
1. **Bước 1 (Quét dọc - Structural):** Quét bảng `BOM Line` để tìm toàn bộ các sản phẩm cha bị ảnh hưởng $\rightarrow$ Lưu danh sách vào bảng tạm $T_{parent}$.
2. **Bước 2 (Quét ngang - Operational):**
   - Đọc bảng tồn kho tĩnh để lấy số lượng khả dụng thực tế của linh kiện cũ: $Q_{stock}$ (On-hand Stock).
   - Đọc bảng phân hệ mua hàng để tổng hợp lượng linh kiện cũ đang nằm trên các đơn mua hàng chưa giao: $Q_{open\_po}$ (Open PO Quantity).
   - Đọc bảng thực thi WIP để tổng hợp nhu cầu linh kiện cũ đang nằm trên các Lệnh sản xuất dở dang chưa đóng: $Q_{wip\_demand}$.
3. **Bước 3 (Tính toán điểm hòa vốn thời gian - Break-even Date):**
   Hệ thống ước tính tốc độ tiêu thụ trung bình của linh kiện cũ dựa trên kế hoạch sản xuất tuần (`Average Weekly Demand`) để đưa ra ngày dự kiến sạch kho (Run-out Date):
   $$\text{Run-out Date} = \text{Current Date} + \left( \frac{Q_{stock} + Q_{open\_po} - Q_{wip\_demand}}{\text{Average Weekly Demand}} \right) \text{ tuần}$$

> **Ý nghĩa thực tế:** Ngày **Run-out Date** tính toán được chính là ngày hiệu lực tối ưu nhất mà hệ thống đề xuất cho ECO. Nếu kỹ sư đặt ngày hiệu lực của linh kiện mới trước ngày này, nhà máy sẽ bị dư thừa phế liệu linh kiện cũ trong kho gây lãng phí chi phí.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Phân tích tác động

### Bài toán 1: Đánh giá thiệt hại tài chính trước khi thay đổi nhà cung cấp chíp IC nguồn
*   **Thách thức:** Phòng R&D muốn duyệt một ECO thay thế chíp IC nguồn hãng cũ `IC_A` (đơn giá $2) sang chíp hãng mới `IC_B` (đơn giá $2.5). Kế sư cần biết tổng số tiền chênh lệch chi phí nguyên vật liệu trực tiếp của cả nhà máy tăng thêm trong năm tới là bao nhiêu nếu áp dụng ECO này?
*   **Giải pháp thực tế:**
    - Chạy báo cáo **`Where-Used`** cho mã `IC_A`. Hệ thống xác định có **15 sản phẩm thành phẩm** đang sử dụng chíp này.
    - Hệ thống đọc kế hoạch dự báo sản xuất (Demand Forecast/MPS) của cả năm tới cho 15 sản phẩm này, tổng sản lượng dự kiến sản xuất là **100.000 sản phẩm**.
    - Hệ thống tự động thực hiện phép tính phân tích tác động tài chính:
      $$\text{Chi phí tăng thêm} = 100,000 \times (\$2.5 - \$2.0) = \$50,000 / \text{năm}$$
    - Con số $50.000 USD tăng thêm này sẽ được tự động hiển thị trên form phê duyệt ECO để Ban giám đốc cân nhắc giữa lợi ích nâng cao chất lượng và chi phí phát sinh trước khi ký duyệt.

### Bài toán 2: Xử lý các Đơn mua hàng đang treo (Open POs) khi ECO có hiệu lực khẩn cấp do lỗi cháy nổ
*   **Thách thức:** Do chíp `IC_A` cũ có rủi ro gây chập cháy khi hoạt động quá tải, R&D yêu cầu duyệt ECO khẩn cấp để thay sang `IC_B` bắt đầu từ ngày mai, không chấp nhận dọn sạch kho cũ (No Run-out). Tuy nhiên, phòng Mua hàng đang có một Đơn mua hàng 5.000 chíp `IC_A` đang trên đường vận chuyển về nhà máy và không thể hủy ngang. Làm sao hệ thống cảnh báo và xử lý trường hợp này?
*   **Giải pháp thực tế:**
    - Khi ECO khẩn cấp được duyệt, hệ thống chạy thuật toán phân tích tác động ngang và phát hiện ra Đơn mua hàng `PO_10025` của chíp `IC_A` đang ở trạng thái "Open".
    - ERP lập tức bắn cảnh báo khẩn cấp (Workflow Notification) đến tài khoản của nhân viên thu mua phụ trách PO đó.
    - Đồng thời, hệ thống tự động kích hoạt tính năng **WIP Hold** đối với tất cả các lệnh sản xuất dở dang đang dùng `IC_A` và tự động đổi hướng yêu cầu cấp phát sang `IC_B`. Đối với 5.000 chíp cũ sắp về kho, hệ thống tự động gán trạng thái lưu kho là **`Restricted / Scrap`** (Hạn chế sử dụng/Chờ thanh lý) để thủ kho không vô tình cấp phát nhầm ra sàn sản xuất.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Phân tích tác động (Where-Used)

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn Where-Used để tìm toàn bộ các sản phẩm cha (Active) đang sử dụng một linh kiện mục tiêu cụ thể trên hệ thống Oracle EBS:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_c.segment1 AS "Target Component",
    msib_p.segment1 AS "Affected Parent Item",
    msib_p.description AS "Parent Description",
    bic.component_quantity AS "Qty Per Assembly",
    msib_p.inventory_item_status_code AS "Parent Status"
FROM 
    apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    AND msib_c.segment1 = 'CHIP_IC_A' -- THAY BẰNG MÃ LINH KIỆN CẦN KIỂM TRA TÁC ĐỘNG
    AND (bic.disable_date IS NULL OR bic.disable_date > SYSDATE) -- Chỉ lấy các liên kết đang hoạt động
ORDER BY 
    msib_p.segment1;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn đệ quy ngược từ bảng `PartMtl` để tìm tất cả các phương pháp sản xuất (MoM Revisions) đang tiêu thụ linh kiện mục tiêu của Epicor:

```sql
SELECT 
    pm.Company,
    pm.MtlPartNum AS [Target Component],
    pm.PartNum AS [Affected Parent Part],
    p.Description AS [Parent Description],
    pm.RevisionNum AS [Parent Revision ID],
    pm.MtlSeq AS [Material Sequence],
    pm.QtyPer AS [Qty Per Parent]
FROM 
    Erp.PartMtl pm
INNER JOIN 
    Erp.Part p ON pm.Company = p.Company AND pm.PartNum = p.PartNum
WHERE 
    pm.Company = 'EP01'
    AND pm.MtlPartNum = 'PART_CHIP_A' -- THAY BẰNG MÃ VẬT TƯ CẦN TRA CỨU
ORDER BY 
    pm.PartNum, pm.RevisionNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn Where-Used kết nối bảng `STPO` và `MAST` để tìm kiếm toàn bộ các sản phẩm cha trong nhà máy đang chứa mã vật tư SAP mục tiêu:

```sql
SELECT 
    m.WERKS AS "Plant",
    i.IDNRK AS "Target Component Material",
    m.MATNR AS "Affected Parent Material",
    i.POSNR AS "BOM Item Number",
    i.MENGE AS "Quantity Used Standard",
    i.MEINS AS "UOM"
FROM 
    saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
WHERE 
    m.WERKS = '1000'
    AND i.IDNRK = 'MAT_CHIP_A' -- THAY BẰNG MÃ VẬT TƯ SAP CẦN TRA CỨU
    AND i.LKENZ = ' ' -- Loại bỏ các dòng đã xóa logic
ORDER BY 
    m.MATNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn tìm kiếm tất cả các cấu trúc BoM hoạt động đang tiêu thụ sản phẩm mục tiêu phục vụ công tác đánh giá tác động thay đổi của Odoo PLM:

```sql
SELECT 
    pt_comp.name AS "Target Component Name",
    pt_parent.name AS "Affected Parent Product Template",
    bom.code AS "BoM Reference Code",
    bl.product_qty AS "Standard Quantity Used",
    uom.name AS "UOM"
FROM 
    mrp_bom_line bl
INNER JOIN mrp_bom bom ON bl.bom_id = bom.id
INNER JOIN product_template pt_parent ON bom.product_tmpl_id = pt_parent.id
INNER JOIN product_product pp_comp ON bl.product_id = pp_comp.id
INNER JOIN product_template pt_comp ON pp_comp.product_tmpl_id = pt_comp.id
LEFT JOIN uom_uom uom ON bl.product_uom_id = uom.id
WHERE 
    pt_comp.name ILIKE '%Chíp IC Nguồn%' -- THAY BẰNG TÊN LINH KIỆN CẦN TRA CỨU
    AND bom.active = true
ORDER BY 
    pt_parent.name;
