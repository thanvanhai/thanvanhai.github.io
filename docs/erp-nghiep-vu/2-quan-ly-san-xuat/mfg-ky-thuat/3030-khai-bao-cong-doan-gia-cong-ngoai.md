---
id: 3030-khai-bao-cong-doan-gia-cong-ngoai
title: Khai báo Công đoạn thuê ngoài gia công (Subcontracting Operation)
description: Khai báo Công đoạn thuê ngoài gia công (Subcontracting Operation)
sidebar_label: Công đoạn gia công ngoài
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/3030-khai-bao-cong-doan-gia-cong-ngoai
sidebar_position: 3030
date: 2026-10-08
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, subcontracting, osp, purchasing, sql]
---

# 3030 Khai báo Công đoạn thuê ngoài gia công (Subcontracting Operation)

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập Master Data (Subcontracting Routing Setup)** trên Quy trình công nghệ - cách cấu hình công đoạn gia công ngoài, liên kết mã dịch vụ mua ngoài và nhà cung cấp mặc định. Đối với quy trình giao dịch thực tế (giao nguyên vật liệu cho đối tác, xuất kho ảo Subcontractor Location, lập PO dịch vụ và nhận hàng gia công WIP Receipt), vui lòng tham khảo các bài viết tương ứng trong phân hệ Thực thi sản xuất (WIP) và Thu mua (PO).

---

Trong chu trình sản xuất, không phải lúc nào nhà máy cũng tự thực hiện 100% các nguyên công. Có những công đoạn đặc thù đòi hỏi chứng chỉ môi trường hoặc thiết bị đắt tiền (như xử lý nhiệt luyện thép, xi mạ niken, sơn tĩnh điện bảo vệ) mà doanh nghiệp sẽ chọn phương án gửi bán thành phẩm sang đối tác gia công ngoài (Subcontractor/Vendor). Công đoạn này được gọi là **Gia công ngoài (Subcontracting Operation)** hoặc **Xử lý bên ngoài (OSP - Outside Processing)**.

Nếu không cấu hình chính xác thuộc tính gia công ngoài trên Routing, hệ thống ERP sẽ không thể tự động kích hoạt yêu cầu mua dịch vụ (Purchase Requisition) khi lệnh sản xuất chạy đến công đoạn đó, gây tắc nghẽn luồng vận hành của bộ phận Thu mua. Bài viết này phân tích sâu kiến trúc dữ liệu, thuật toán tích hợp Mua hàng - Sản xuất và luồng cấu hình OSP trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Để mô hình hóa một công đoạn gia công ngoài, hệ thống ERP cần thiết lập một tam giác dữ liệu: **Công đoạn sản xuất (Operation)** $\leftrightarrow$ **Mã dịch vụ mua sắm (Service Item/OSP Item)** $\leftrightarrow$ **Đơn giá & Nhà cung cấp mặc định (Vendor & Purchasing Rate)**.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Khai báo tài nguyên OSP gắn vào công đoạn Routing; tài nguyên liên kết với mã dịch vụ mua ngoài. | Định nghĩa cờ gia công ngoài trực tiếp trên dòng công đoạn MoM, liên kết mã nhà thầu phụ mặc định. | Sử dụng **Mã kiểm soát (Control Key)** để khai báo công đoạn mua ngoài, liên kết bảng giá dịch vụ kế toán. | Định nghĩa loại BoM đặc thù là Gia công ngoài, gán danh sách nhà thầu phụ trực tiếp trên Header. |
| **Bảng định nghĩa mẫu (BOM/Routing)** | `BOM_OPERATION_RESOURCES` (Với tài nguyên có loại `resource_type = 4` - OSP) [1]. | **`Erp.PartOpr`** (Trường cờ hiệu Boolean `SubContract` đánh dấu công đoạn thuê ngoài). | **`saphanadb.PLPO`** (Dòng công đoạn Routing lưu mã kiểm soát hạch toán `STEUS`). | **`mrp.bom`** (Định nghĩa BoM với trường phân loại `type` là `subcontract`). |
| **Mã dịch vụ mua ngoài (Service Item)** | Liên kết với mã hàng ảo lưu tại cột `osp_item_id` thuộc bảng `BOM_RESOURCES`. | Không bắt buộc có mã vật tư riêng (Sử dụng trực tiếp Operation Code làm mã dịch vụ mua ngoài). | Liên kết trực tiếp qua bảng ghi nhận đơn giá dịch vụ mua ngoài **Purchasing Info Record** (`EINA`/`EINE`). | Hệ thống tự động tạo mã dịch vụ hoặc gán trực tiếp chi phí gia công trên PO thu mua dịch vụ. |
| **Nhà cung cấp mặc định (Vendor)** | Khai báo tại Item Master của mã dịch vụ OSP (Mục Approved Supplier List - ASL). | `PartOpr.VendorNum` (Trỏ trực tiếp sang mã nhà thầu phụ tại bảng danh mục `Erp.Vendor`). | `PLPO.LIFNR` (Trỏ trực tiếp sang mã nhà cung cấp thuộc phân hệ MM - bảng `LFA1`). | Bảng liên kết **`mrp_bom_subcontractor`** (Ánh xạ các đối tác gia công được phê duyệt). |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Triết lý Outside Processing - OSP — Bảng: `BOM_RESOURCES` / `BOM_OPERATION_RESOURCES`)
Oracle EBS quản lý gia công ngoài cực kỳ chặt chẽ thông qua phân hệ mua sắm tích hợp:
1. **Bước 1 (Tạo OSP Item):** Phòng mua hàng vào Item Master tạo mã dịch vụ (ví dụ: `SERV_PLATING`), chọn thuộc tính `Outside Processing Item = Yes` và chọn đơn vị mua (ví dụ: `EA`).
2. **Bước 2 (Tạo OSP Resource):** Trong màn hình `BOM > Setup > Resources`, tạo tài nguyên OSP (ví dụ: `RES_PLATING`), chọn **`Resource Type = Outside Processing`** (field DB: `resource_type = 4`) [1] và gán mã `SERV_PLATING` vào trường `OSP Item` (field DB: `osp_item_id`).
3. **Bước 3 (Gán vào Routing):** Tại màn hình Routing, tại công đoạn mạ kẽm (`Op 30`), gán tài nguyên `RES_PLATING`. Khi Lệnh sản xuất (Discrete Job) chạy đến `Op 30`, hệ thống tự động bắn một yêu cầu mua dịch vụ (Purchase Requisition) gửi sang phòng Mua hàng.

### b. Hệ thống Epicor ERP (Cơ chế Subcontract Operation — Bảng: `Erp.PartOpr` / `Erp.Op`)
Epicor tối giản hóa quy trình bằng cách tích hợp cờ thuê ngoài trực tiếp trên cây cơ cấu sản xuất MoM:
1. **Bước 1 (Định nghĩa Op Code gia công):** Vào `Operation Maintenance`, tạo mã công đoạn mẫu (ví dụ: `SUB_ANODIZE` - Thuê mạ anod), tích chọn cờ mặc định **`Subcontract = True`**.
2. **Bước 2 (Gán vào MoM):** Trong màn hình `Engineering Workbench`, thêm công đoạn dập mạ cho sản phẩm, chọn `Op Code` là `SUB_ANODIZE`. Epicor tự động đánh dấu cờ **`Subcontract = True`** (field DB: `PartOpr.SubContract = 1`) cho công đoạn sản xuất của sản phẩm.
3. **Bước 3 (Gán nhà cung cấp & đơn giá):** Tại tab `Subcontract` dưới công đoạn, người dùng gán mã nhà cung cấp mặc định (field DB: `PartOpr.VendorNum`) và số ngày gia công dự kiến (field DB: `PartOpr.DaysOut` - ví dụ: 3 ngày).

### c. Hệ thống SAP S/4HANA (Triết lý Control Key & Info Record — Bảng: `saphanadb.PLPO` / `saphanadb.EINE`)
SAP quản lý hạch toán gia công ngoài thông qua mã kiểm soát công đoạn và bảng ghi nhận thông tin mua hàng (Info Record):
1. **Bước 1 (Gán Control Key thuê ngoài):** Trong T-Code `CA02` (Sửa Routing), tại dòng công đoạn thuê ngoài (ví dụ: `Op 0030`), người dùng gán cột **`Control Key = PP02`** (field DB: `STEUS`) (PP02 đại diện cho công đoạn được gia công và kiểm soát bởi đối tác bên ngoài).
2. **Bước 2 (Liên kết Purchasing Info Record):** Bấm đúp vào dòng công đoạn, tại màn hình chi tiết, người dùng bắt buộc nhập:
   - `Purchasing Info Record` (field DB: `INFNR`): Mã bảng giá dịch vụ đã thỏa thuận trước với nhà cung cấp (lưu trữ đơn giá dập, sơn trên mỗi sản phẩm).
   - `Purchasing Group`: Mã nhóm mua hàng phụ trách.
3. **Bước 3 (Vận hành):** Khi dập lệnh sản xuất, SAP tự động tạo một Purchase Requisition loại Subcontracting dựa trên thông số đơn giá kế hoạch và nhà cung cấp lưu trong Info Record.

### d. Hệ thống Odoo ERP (Thiết lập BoM Type = Subcontracting — Bảng: `mrp.bom` / `mrp_bom_subcontractor`)
Odoo quản lý gia công ngoài ở cấp độ cấu trúc BoM cha thay vì tách lẻ theo từng dòng công đoạn:
1. **Bước 1 (Thiết lập BoM Type):** Trên màn hình thiết lập BoM của cụm bán thành phẩm cần gửi đi gia công (ví dụ: vỏ tủ điện sơn phủ), tại trường `BoM Type`, chọn **`Subcontracting`** (field DB: `type = 'subcontract'`).
2. **Bước 2 (Gán đối tác gia công):** Hệ thống hiển thị thêm tab `Subcontractors`. Người dùng gán danh sách các đối tác được duyệt để gia công mã hàng này (field DB: lưu vết trong bảng `mrp_bom_subcontractor`).
3. **Bước 3 (Kích hoạt tuyến đường):** Trên form sản phẩm vỏ tủ, tại tab `Inventory`, tích chọn tuyến đường (Routes) mua hàng là **`Subcontracting`** và thiết lập đơn giá gia công tại tab `Purchase`. Khi có nhu cầu sản xuất tủ điện chính, Odoo tự sinh PO gia công gửi đối tác.

---

## 3. Thuật toán Tích hợp Mua hàng - Sản xuất (WIP-to-PO Integration)

Khi Lệnh sản xuất đi đến công đoạn Gia công ngoài, hệ thống ERP sẽ tự động đồng bộ thời gian và số lượng sang phân hệ **Thu mua (PO)** theo thuật toán khép kín:

```text
       [ LỆNH SẢN XUẤT (WIP) ]
                  │
                  ▼ (Sản lượng đạt Op 20 chuyển sang Op 30)
       [ OP 30: GIA CÔNG NGOÀI ]
                  │
                  ▼ (Hệ thống tự động kích hoạt thuật toán)
       [ PURCHASE REQUISITION ] ──► Tự động lấy Vendor & Price từ Info Record/PartOpr
                  │
                  ▼ (Phê duyệt yêu cầu mua hàng)
       [ PURCHASE ORDER (PO) ]  ──► PO dịch vụ gia công gửi cho đối tác
                  │
                  ▼ (Xuất kho nguyên vật liệu giao cho đối tác)
       [ SHIPMENT TO VENDOR ]   ──► Chuyển bán thành phẩm sang kho ảo nhà thầu phụ
                  │
                  ▼ (Đối tác giao trả hàng đã xi mạ về nhà máy)
       [ WIP PO RECEIPT ]       ──► Tự động ghi nhận hoàn thành Op 30 & Trừ kho nguyên liệu
```

> **Ý nghĩa thực tế:** Thuật toán WIP-to-PO đảm bảo thời gian chạy máy của xưởng sản xuất khớp 100% với tiến độ giao hàng của đối tác mua ngoài. Khi đối tác chậm giao hàng, hệ thống APS sẽ tự động cập nhật thời gian trễ của PO trực tiếp lên lịch trình hoàn thành của Lệnh sản xuất.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Gia công ngoài

### Bài toán 1: Quản lý hao hụt và hao phí nguyên vật liệu gửi đi gia công (Subcontract Material Loss)
*   **Thách thức:** Nhà máy gửi 1.000 kg thép cuộn nguyên bản đi thuê đối tác cắt dập thành vỏ tủ. Định mức kỹ thuật cần 1.2 kg thép cho 1 vỏ tủ. Tuy nhiên, trong thực tế dập định hình, đối tác luôn làm hỏng hoặc hao hụt khoảng 3% nguyên liệu. Làm thế nào để ERP quản lý được lượng thép hao hụt này tại kho của đối tác để đối chiếu khi quyết toán?
*   **Giải pháp thực tế:**
    - Trên **BOM sản xuất**, cấu hình dòng nguyên liệu Thép cuộn có hệ số hao hụt biến đổi **`Scrap Pct = 3%`** (hoặc `Yield = 0.97`) [1].
    - Khi PO gia công được giải phóng, hệ thống sẽ tính toán nhu cầu nguyên liệu gửi đi là $1.000 \times 1.2 / 0.97 \approx 1.237$ kg thép.
    - Giao dịch chuyển kho sẽ xuất đúng 1.237 kg thép sang kho ảo của nhà thầu phụ (`Subcontractor Location`). Khi nhà thầu giao trả vỏ tủ, hệ thống tự động trừ kho thép theo định mức đã cộng hao hụt (1.237 kg) tại kho ảo, đảm bảo khớp số liệu đối soát vật tư cuối kỳ với đối tác.

### Bài toán 2: Đồng bộ hóa bán thành phẩm dở dang không qua nhập kho (Direct WIP Transfer to Vendor)
*   **Thách thức:** Sản phẩm sau khi tiện CNC (`Op 10`) sẽ được chuyển thẳng sang xe tải của đối tác để mang đi mạ kẽm (`Op 20` - Gia công ngoài) mà không hề làm thủ tục nhập kho trung gian. Làm sao hệ thống ghi nhận được số lượng bán thành phẩm đang nằm ở xe tải của đối tác?
*   **Giải pháp thực tế:**
    - Trong **Oracle EBS**, cấu hình tài nguyên OSP sử dụng thuộc tính **`WIP Move`** tại trường Autocharge.
    - Khi công nhân báo cáo hoàn thành công đoạn `Op 10` và thực hiện giao dịch di chuyển công đoạn (`Move Transaction`) sang `Op 20`, hệ thống sẽ tự động chuyển trạng thái của bán thành phẩm dở dang sang khu vực **`Queue of Outside Processing Operation`** (Hàng đợi gia công ngoài) [1]. Trạng thái này lưu vết chính xác số lượng dở dang đang nằm tại xưởng của đối tác mà không cần bất kỳ giao dịch nhập-xuất kho vật lý nào trên hệ thống.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Gia công ngoài

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách các công đoạn sản xuất được cấu hình sử dụng tài nguyên gia công ngoài (OSP Resources - `resource_type = 4`) [1]:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_p.segment1 AS "Assembly Item",
    msib_p.description AS "Assembly Description",
    bos.operation_seq_num AS "Op Seq",
    br.resource_code AS "OSP Resource Code",
    br.description AS "OSP Resource Description",
    -- Giải mã mã dịch vụ mua ngoài liên kết với tài nguyên OSP
    msib_osp.segment1 AS "Linked OSP Service Item",
    msib_osp.description AS "Service Item Description",
    msib_osp.primary_uom_code AS "UOM"
FROM 
    apps.bom_operation_resources bor
INNER JOIN apps.bom_operation_sequences bos ON bor.operation_sequence_id = bos.operation_sequence_id
INNER JOIN apps.bom_operational_routings bor_route ON bos.routing_sequence_id = bor_route.routing_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bor_route.assembly_item_id = msib_p.inventory_item_id AND bor_route.organization_id = msib_p.organization_id
INNER JOIN apps.bom_resources br ON bor.resource_id = br.resource_id
INNER JOIN apps.mtl_system_items_b msib_osp ON br.osp_item_id = msib_osp.inventory_item_id AND br.organization_id = msib_osp.organization_id
INNER JOIN apps.org_organization_definitions ood ON bor_route.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    AND br.resource_type = 4     -- Lọc riêng tài nguyên Outside Processing (OSP)
ORDER BY 
    msib_p.segment1, bos.operation_seq_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn toàn bộ các công đoạn sản xuất gán mác gia công ngoài (`SubContract = 1`) kèm theo thông tin nhà thầu phụ và số ngày gia công định mức của Epicor:

```sql
SELECT 
    po.Company,
    po.PartNum AS [Part Number],
    p.Description AS [Part Description],
    po.RevisionNum AS [Revision ID],
    po.OprSeq AS [Op Seq],
    po.OpCode AS [Operation Code],
    po.SubContract AS [Is Subcontract? (1=True)],
    po.VendorNum AS [Default Vendor ID],
    v.Name AS [Vendor Name],
    po.DaysOut AS [Subcontract Lead Time (Days)] -- Số ngày đối tác gia công định mức
FROM 
    Erp.PartOpr po
INNER JOIN 
    Erp.Part p ON po.Company = p.Company AND po.PartNum = p.PartNum
LEFT JOIN 
    Erp.Vendor v ON po.Company = v.Company AND po.VendorNum = v.VendorNum
WHERE 
    po.Company = 'EP01'
    AND po.SubContract = 1 -- Lọc riêng các công đoạn thuê ngoài gia công
ORDER BY 
    po.PartNum, po.OprSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh sách công đoạn sản xuất có cấu hình mã kiểm soát là thuê ngoài gia công (`STEUS = PP02` hoặc `PP03`) và liên kết bảng giá dịch vụ Purchasing Info Record của SAP:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material",
    o.VORNR AS "Operation Seq",
    o.LTXA1 AS "Operation Description",
    o.STEUS AS "Control Key",          -- PP02, PP03 đại diện cho thuê ngoài
    o.LIFNR AS "Default Subcontractor Vendor", -- Mã nhà cung cấp hạch toán trên Routing
    o.INFNR AS "Purchasing Info Record ID",    -- Mã liên kết bảng giá dịch vụ gia công ngoài
    o.PLNNR AS "Routing Group ID"
FROM 
    saphanadb.MAPL m
INNER JOIN saphanadb.PLKO h ON m.PLNTY = h.PLNTY AND m.PLNNR = h.PLNNR
INNER JOIN saphanadb.PLPO o ON h.PLNNR = o.PLNNR AND h.PLNTY = o.PLNTY
WHERE 
    m.WERKS = '1000'
    AND o.STEUS IN ('PP02', 'PP03') -- Thường đại diện cho Externally Processed Operations
    AND o.LOEKZ = ' '               -- Loại bỏ công đoạn đã xóa logic
ORDER BY 
    m.MATNR, o.VORNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách các BoM được phân loại là Subcontracting kèm theo tên các nhà thầu phụ chịu trách nhiệm gia công được phê duyệt trong cơ sở dữ liệu Odoo:

```sql
SELECT 
    pt.name AS "Subcontracted Product Template",
    bom.code AS "BoM Reference Code",
    bom.type AS "BoM Type Key",
    -- Liên kết lấy thông tin nhà thầu phụ được gán cho BoM Subcontracting
    partner.name AS "Designated Subcontractor Vendor",
    partner.ref AS "Vendor Reference Code"
FROM 
    mrp_bom bom
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
-- Liên kết bảng trung gian lưu danh sách nhà thầu phụ của BoM
LEFT JOIN mrp_bom_subcontractor rel ON bom.id = rel.bom_id
LEFT JOIN res_partner partner ON rel.subcontractor_id = partner.id
WHERE 
    bom.type = 'subcontract' -- Lọc riêng loại định mức gia công ngoài
    AND bom.active = true
ORDER BY 
    pt.name, partner.name;