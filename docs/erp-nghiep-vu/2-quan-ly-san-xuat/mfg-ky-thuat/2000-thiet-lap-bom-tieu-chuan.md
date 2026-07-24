---
id: 2000-thiet-lap-bom-tieu-chuan
title: Thiết lập BOM tiêu chuẩn (Standard BOM Setup)
description: Thiết lập BOM tiêu chuẩn (Standard BOM Setup) - Tích hợp Công đoạn & Máy móc
sidebar_label: Thiết lập BOM tiêu chuẩn
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2000-thiet-lap-bom-tieu-chuan
sidebar_position: 2000
date: 2026-09-12
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, bom, master-data, sql]
---

# 2000 Thiết lập BOM tiêu chuẩn (Standard BOM Setup)

Định mức nguyên vật liệu (BOM - Bill of Materials) là danh sách chi tiết cấu thành sản phẩm, xác định rõ cần bao nhiêu linh kiện, nguyên vật liệu (UOM, số lượng) để sản xuất ra một đơn vị thành phẩm. Nếu ví quy trình công nghệ (Routing) là "công thức chế biến" thì BOM chính là "danh sách nguyên liệu". Thiết kế cấu trúc BOM sai lệch sẽ lập tức làm tê liệt hệ thống tính toán nhu cầu vật tư (MRP) và gây sai sót nghiêm trọng trong hạch toán giá thành.

Tuy nhiên, trong thực tế vận hành nhà máy, **BOM không tồn tại độc lập dưới dạng danh sách phẳng**. Mỗi dòng nguyên vật liệu trong BOM nên được liên kết trực tiếp với một Công đoạn (Operation) và một Trung tâm công việc/Máy móc (Work Center) cụ thể để tối ưu hóa thời điểm cấp phát vật tư và tự động hóa quy trình trừ kho sản xuất (Backflushing).

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu BOM cơ bản của các hãng ERP được thiết kế theo mối quan hệ cha - con (Parent - Child). Dưới đây là bảng so sánh kiến trúc dữ liệu, bổ sung thêm các thuộc tính liên kết công đoạn sản xuất và máy móc vận hành:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Phân tách độc lập giữa BOM (Vật tư) và Routing (Công đoạn). | **BOM và Routing gộp chung** thành cấu trúc cây MoM (Method of Manufacture). | Phân tách độc lập BOM và Routing. Cho phép quản lý nhiều loại BOM (Usage). | Phân tách độc lập. Định nghĩa BOM tối giản, linh hoạt. |
| **Bảng Header (Sản phẩm cha)** | `BOM_BILL_OF_MATERIALS` | `Erp.Part` / `Erp.PartRev` (BOM gắn liền với Revision của mã hàng). | `saphanadb.STKO` (BOM Header) và `saphanadb.MAST` (Material to BOM Link). | `mrp.bom` (BOM Header). |
| **Bảng Lines (Nguyên vật liệu con)** | `BOM_INVENTORY_COMPONENTS` | `Erp.PartMtl` (Danh sách vật tư cấu thành, liên kết với mã cha qua tổ hợp khóa `Company + PartNum + RevisionNum` — nên mỗi Revision có một tập dòng vật tư riêng). | `saphanadb.STPO` (BOM Item/Component details). | `mrp.bom.line` (BOM Component Line). |
| **Ngày hiệu lực (Effectivity)** | Quản lý bằng cột `effectivity_date` và `disable_date` trên từng dòng component. | Quản lý qua `PartRev.EffectiveDate` kết hợp cờ `PartRev.Approved` (Boolean) — hệ thống chỉ bốc Revision có `Approved = 1` và `EffectiveDate` gần nhất tính đến thời điểm hiện tại. | Quản lý bằng cột `DATUV` (Valid From) kết hợp hệ số thay đổi kỹ thuật (ECN). | Quản lý gián tiếp thông qua phiên bản (Version) hoặc tùy biến thủ công. |
| **Liên kết Công đoạn (Operation Link)** | Cột `operation_seq_num` trong `BOM_INVENTORY_COMPONENTS` liên kết với `BOM_OPERATION_SEQUENCES`. | Cột `RelatedOperation` trong bảng `Erp.PartMtl` liên kết trực tiếp với số công đoạn tương ứng (`OprSeq`) trong bảng `Erp.PartOpr` | Bảng liên kết trung gian **`saphanadb.PLMZ`** ánh xạ giữa `STPO` (BOM Line) và `PLPO` (Routing Operation). | Trường `operation_id` trong `mrp.bom.line` liên kết với `mrp.routing.workcenter`. |
| **Gắn kết Máy móc (Work Center)** | Thông qua `BOM_OPERATION_SEQUENCES.DEPARTMENT_ID` để trỏ tới tài nguyên của phòng ban. | Thông qua `PartOpr.ResourceGrpID` (Nhóm máy thực hiện công đoạn). | Thông qua trường `PLPO.ARBID` chứa Object ID của Work Center để liên kết trực tiếp với trường khóa chính `CRHD.OBJID` trong bảng **`saphanadb.CRHD`** (Work Center Header). | Thông qua `mrp.routing.workcenter.workcenter_id` trỏ tới Work Center thiết bị. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Triết lý Form BOM độc lập — Bảng: `BOM_BILL_OF_MATERIALS` / `BOM_INVENTORY_COMPONENTS`)
Trong Oracle EBS, BOM được quản lý riêng biệt tại phân hệ BOM, độc lập hoàn toàn với Inventory và WIP:
1. **Bước 1 (Chọn Org):** Người dùng chọn chi nhánh nhà máy (`Organization`) vận hành.
2. **Bước 2 (Khởi tạo BOM Header):** Vào `BOM > Bills > Bills`, nhập mã thành phẩm cha (ví dụ: `BIKE_01`). Hệ thống tự động tải đơn vị tính tiêu chuẩn (`UOM`) từ Item Master.
3. **Bước 3 (Nhập Component Lines):** Tại bảng lưới bên dưới, người dùng nhập:
   - `Item` (field DB: `component_item_id`): Mã vật tư con (ví dụ: `FRAME_01` - Khung xe).
   - `Quantity` (field DB: `component_quantity`): Số lượng định mức (ví dụ: `1`).
   - `Yield` (field DB: `component_yield_factor`): Hệ số thu hồi (ví dụ: `1.00` tương đương không hao hụt).
   - `Op Seq` (field DB: `operation_seq_num`): Gán số thứ tự công đoạn tiêu hao vật tư (ví dụ: gán công đoạn `10` cho Khung xe, gán công đoạn `30` cho Sơn). Hệ thống tự liên kết vật tư sang máy móc thuộc phòng ban đó.
   - `Supply Type`: Chọn phương thức cấp phát (ví dụ: `Push` - thủ công, hoặc `Assembly Pull` - tự động trừ kho khi hoàn thành).

### b. Hệ thống Epicor ERP (Triết lý Method of Manufacture - MoM — Bảng: `PartMtl` / `PartRev`)
Do Epicor gộp chung BOM và Routing vào cấu trúc cây MoM, luồng thiết lập bắt buộc phải đi qua môi trường kỹ thuật:
1. **Bước 1 (Vào Engineering Workbench):** Người dùng mở màn hình thiết kế `Engineering Workbench`, tiến hành "Check out" phiên bản sản phẩm cha (ví dụ: `PART_BIKE`) để khóa quyền chỉnh sửa.
2. **Bước 2 (Thêm vật tư vào cây MoM):** Trên cấu hình cây thư mục bên trái, người dùng chuột phải vào công đoạn sản xuất (Operation) tương ứng, chọn `Add Material`. Thao tác này tự động gán dòng vật tư này vào công đoạn cụ thể (field DB: `PartMtl.OprSeq`).
3. **Bước 3 (Khai báo định mức):** Nhập mã vật tư con (field DB: `MtlPartNum`, ví dụ: `PART_FRAME`) và định mức tại trường `Qty Per` (field DB: `QtyPer` — Số lượng trên 1 đơn vị cha). 
4. **Bước 4 (Phê duyệt - Approve):** "Check in" và bấm Approve phiên bản (field DB: `PartRev.Approved = 1`, `PartRev.EffectiveDate`) để chính thức áp dụng BOM vào sản xuất.

### c. Hệ thống SAP S/4HANA (Triết lý Phân loại mục đích sử dụng - BOM Usage — Bảng: `STKO` / `STPO` / `MAST`)
SAP quản lý rất chặt chẽ vòng đời sản phẩm thông qua việc phân nhóm mục đích sử dụng BOM:
1. **Bước 1 (Mở giao diện tạo BOM):** Dùng T-Code `CS01`, nhập mã sản phẩm cha, nhà máy (`Plant`) và chọn **`BOM Usage`**:
   - Chọn `1` (Production): Dùng cho sản xuất.
   - Chọn `2` (Engineering): Dùng cho nghiên cứu thiết kế R&D.
   - Chọn `3` (Universal): Dùng chung.
2. **Bước 2 (Nhập Base Quantity):** Khai báo sản lượng cơ sở (field DB: `BMENG`, ví dụ: nhập Base Qty = `100` chiếc bánh, để khi nhập định mức nguyên liệu bột mì, hương liệu dạng số lẻ nhỏ như `0.005 kg` sẽ được nhân lên dễ quản lý hơn).
3. **Bước 3 (Khai báo Item Lines):** Nhập mã linh kiện (field DB: `IDNRK`), số lượng (field DB: `MENGE`) và phân loại dòng (field DB: `POSTP` - Item Category — ví dụ: chọn `L` cho vật tư lưu kho, chọn `N` cho vật tư mua trực tiếp không lưu kho). 
4. **Bước 4 (Phân bổ công đoạn - Component Allocation):** Trong màn hình Routing (`CA01`), người dùng chọn nút `Component Allocation` để kéo thả các linh kiện ở Bước 3 vào các bước công đoạn và máy móc (`Work Center`) tương ứng lưu trong bảng `PLMZ`.

### d. Hệ thống Odoo ERP (Triết lý Tối giản - BOM Type — Bảng: `mrp.bom` / `mrp.bom.line`)
Odoo tối giản hóa cấu trúc để doanh nghiệp dễ dàng thiết lập trong vài giây:
1. **Bước 1 (Vào màn hình BOM):** Truy cập `Manufacturing > Products > Bills of Materials`, bấm `New`.
2. **Bước 2 (Cấu hình Header):** Chọn sản phẩm cha, nhập số lượng cơ sở (field DB: `product_qty`) và chọn **`BoM Type`** (field DB: `type`):
   - `Manufacture this product` (`normal`): Tạo lệnh sản xuất để chế tạo thành phẩm.
   - `Kit` (`phantom`): BOM bộ linh kiện lắp ráp.
3. **Bước 3 (Nhập dòng và gán công đoạn):** Nhập danh sách linh kiện (field DB: `product_id`), số lượng định mức (field DB: `product_qty`) trên tab `Components`. Tại đây, người dùng chọn công đoạn tiêu hao vật tư tương ứng tại cột `Consumed in Operation` (field DB: `operation_id`) để gắn kết thời điểm tiêu hao vật tư vào máy móc chạy công đoạn đó.

---

## 3. Thuật toán phân rã nhu cầu nguyên vật liệu (MRP BOM Explosion)

Khi bộ tính toán nhu cầu vật tư (MRP Run) hoạt động, hệ thống sử dụng thuật toán **Phân rã BOM (BOM Explosion)** từ cấp cao nhất xuống các cấp thấp hơn để tính ra nhu cầu mua hàng hoặc sản xuất linh kiện.

### Công thức tính nhu cầu Tổng vật tư con (Gross Requirement):
$$\text{Nhu cầu Tổng (Gross Requirement)} = \frac{\text{Số lượng sản phẩm cha cần sản xuất} \times \text{Định mức BOM (Quantity Per)}}{\text{Hệ số thu hồi (Component Yield Factor)}}$$

*Trong đó:*
- `Component Yield Factor`: Thể hiện tỷ lệ nguyên vẹn của vật tư con khi lắp ráp (thường chạy từ `0.00` đến `1.00`. Ví dụ: hệ số `0.95` nghĩa là dự kiến hao hụt 5% vật tư trong quá trình lắp ráp).

### Kịch bản tính toán thực tế:
Nhà máy cần sản xuất **2.000 chiếc xe đạp** (`BIKE_01`).
Theo cấu hình BOM:
- Mỗi xe đạp cần **1 chiếc khung** (`FRAME_01`). Hệ số thu hồi của khung xe là `1.00` (không hao hụt).
- Mỗi xe đạp cần **2 chiếc lốp** (`TYRE_01`). Hệ số thu hồi của lốp xe do rủi ro lỗi trong lắp ráp là `98%` (`0.98`).

**Hệ thống MRP chạy thuật toán phân rã định mức như sau:**
1. Tính nhu cầu cho Khung xe:
   $$\text{Nhu cầu Khung} = \frac{2,000 \times 1}{1.00} = 2,000 \text{ chiếc}$$
2. Tính nhu cầu cho Lốp xe:
   $$\text{Nhu cầu Lốp} = \frac{2,000 \times 2}{0.98} \approx 4,082 \text{ chiếc}$$

> **Ý nghĩa thực tế:** Dù trên lý thuyết chỉ cần 4.000 chiếc lốp cho 2.000 xe, hệ thống tính toán nhu cầu mua hàng của ERP sẽ tự động đề xuất mua **4.082 chiếc lốp** để bù đắp 2% hao hụt dự kiến trên sàn sản xuất.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến BOM

### Bài toán 1: Đồng nhất Đơn vị tính (UOM) giữa Thu mua và Định mức sản xuất
*   **Thách thức:** Nguyên vật liệu cuộn thép mạ kẽm được phòng Mua hàng mua về và quản lý kho theo đơn vị là **Cuộn** hoặc **Tấn**. Tuy nhiên, định mức sản xuất trên BOM để dập ra một chi tiết cơ khí lại tính bằng **Milimet** hoặc **Gram**. Làm sao để hệ thống tự động quy đổi chính xác từ Tấn sang Milimet khi xuất kho sản xuất và hạch toán chi phí?
*   **Giải pháp thực tế:**
    - Cấu hình thuộc tính vật tư tại Item Master với **Primary UOM (Đơn vị tính chính)** là đơn vị nhỏ nhất dùng cho sản xuất (ví dụ: `MM` - Milimet).
    - Cấu hình **Purchasing UOM (Đơn vị mua hàng)** là `TON` (Tấn).
    - Thiết lập bảng quy đổi đơn vị tính (UOM Conversion Rate) cụ thể cho mã vật tư đó (ví dụ: `1 Tấn = 250,000 Milimet`).
    - Khi viết BOM, kỹ sư thiết kế nhập định mức trực tiếp theo đơn vị sản xuất là `MM`. Khi hệ thống chạy MRP tính toán mua hàng, ERP sẽ tự động quy đổi nhu cầu tổng từ `MM` ngược lại thành `Tấn` để phòng Mua hàng làm việc với nhà cung cấp.
    - **Riêng trên Epicor:** Đơn vị tính của dòng định mức được lưu tại `PartMtl.UOMCode`. Nếu cần lấy đơn vị gốc chuẩn của bản thân vật tư con (không phụ thuộc dòng BOM cụ thể) để đối chiếu, nên tham chiếu thêm `Part.IUM` (Internal Unit of Measure) của vật tư con đó.

### Bài toán 2: Quản lý ngày hiệu lực (Effectivity Dates) khi thay đổi thiết kế sản phẩm
*   **Thách thức:** Kể từ ngày **15/09/2026**, nhà máy quyết định nâng cấp thiết kế xe đạp: ngừng sử dụng Khung xe cũ (`FRAME_OLD`) và chuyển sang sử dụng Khung xe phiên bản cải tiến (`FRAME_NEW`). Làm thế nào để điều phối viên không phải sửa thủ công hàng loạt BOM mà hệ thống vẫn tự động áp dụng đúng mã khung mới kể từ ngày quy định?
*   **Giải pháp thực tế:**
    Không cần tạo mã thành phẩm cha mới, người dùng cấu hình trực tiếp trên form BOM hiện tại:
    - Tại dòng vật tư `FRAME_OLD`: Cấu hình ngày ngưng hiệu lực (`Disable Date` / `Valid To`) là **`14/09/2026`**.
    - Tại dòng vật tư `FRAME_NEW`: Thêm mới dòng này vào BOM với ngày bắt đầu hiệu lực (`Effectivity Date` / `Valid From`) là **`15/09/2026`**.
    - Khi bộ phận sản xuất tạo lệnh sản xuất trước ngày 15/09, hệ thống tự động bốc mã `FRAME_OLD`. Từ ngày 15/09 trở đi, hệ thống tự động chuyển sang bốc mã `FRAME_NEW` cho lệnh sản xuất.
    - **Riêng trên Epicor:** Vì hiệu lực không nằm trên từng dòng `PartMtl` mà nằm trên cấp Revision (`PartRev.EffectiveDate` + `PartRev.Approved`), cách làm tương đương là tạo một Revision mới (ví dụ Rev `B`) chứa dòng `FRAME_NEW` thay cho `FRAME_OLD`, đặt `EffectiveDate = 15/09/2026` và Approve Revision đó. Hệ thống sẽ tự bốc đúng Revision có hiệu lực tại ngày tạo Job.

### Bài toán 3: Phân biệt vật tư Cụm lắp ráp trung gian (Sub-Assembly) với vật tư Nguyên liệu thô trong BOM nhiều cấp
*   **Thách thức:** BOM của xe đạp có 2 cấp: cấp 1 là các cụm lắp ráp trung gian (ví dụ `SUB_WHEEL` - Cụm bánh xe hoàn chỉnh, gồm nhiều chi tiết nhỏ hơn), cấp 2 là nguyên liệu thô. Khi chạy MRP hoặc tính giá thành, làm sao hệ thống biết được nên "kéo nguyên cụm" (coi `SUB_WHEEL` như một khối để cấp phát và tính chi phí gộp) hay "rã chi tiết" (bung ra từng ốc vít, nan hoa... để mua/sản xuất riêng)?
*   **Giải pháp thực tế trên Epicor:** Mỗi dòng `PartMtl` có cặp cờ Boolean riêng để điều khiển hành vi này:
    - `PullAsAsm`: Khi bật (`true`), hệ thống "kéo" cả cụm `SUB_WHEEL` vào Job cha như một khối lắp ráp độc lập (không tách rã khi cấp phát vật tư/tính giá thành ở Job cha).
    - `PlanAsAsm`: Khi bật (`true`), công cụ MRP sẽ tự động lên kế hoạch sản xuất/Job riêng cho cụm `SUB_WHEEL` đó thay vì gộp chung vào kế hoạch của sản phẩm cha.
    - Hai cờ này độc lập với nhau: Một cụm có thể được "Pull as Assembly" khi cấp phát nhưng vẫn "Plan as Assembly" để MRP tạo Job sản xuất con riêng biệt cho cụm đó.

### Bài toán 4: Chặn rủi ro âm kho ảo nhờ liên kết công đoạn (Operation Allocation & Backflush Lock) - *Bổ sung*
*   **Thách thức:** Nếu toàn bộ vật tư trong BOM không được gán vào từng công đoạn (Operation) mà mặc định gán hết vào đầu quy trình sản xuất (công đoạn đầu tiên). Khi hệ thống thực hiện trừ kho tự động (Backflush), toàn bộ sơn, dung môi, ốc vít... sẽ bị trừ sạch khỏi kho ngay khi công đoạn đầu tiên (ví dụ: cắt phôi) vừa hoàn thành. Điều này gây ra tình trạng âm kho ảo trầm trọng tại xưởng và sai lệch báo cáo vật tư tiêu hao thực tế.
*   **Giải pháp thực tế:**
    - Kỹ sư bắt buộc phải gán chính xác từng dòng vật tư vào công đoạn tiêu hao thực tế (Ví dụ: Thép tấm gán vào công đoạn Cắt phôi `Op 10`, Sơn gán vào công đoạn Sơn phủ `Op 30`).
    - Cấu hình phương thức trừ kho (Backflush Method) là **`Operation Pull`** (Oracle EBS/SAP) hoặc liên kết **`PartMtl.OprSeq`** (Epicor).
    - Khi đó, hệ thống chỉ chạy lệnh tự động trừ kho cho loại vật tư đó khi và chỉ khi công đoạn tương ứng (có gán vật tư) được công nhân quẹt thẻ báo cáo hoàn thành trên MES.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu BOM tích hợp Công đoạn & Máy móc

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn cấu trúc định mức BOM tiêu chuẩn, hiển thị rõ vật tư con được tiêu hao ở công đoạn nào (`Op Seq`) và máy móc/trung tâm công việc nào (`Department Code`):

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_p.segment1 AS "Parent Item",
    msib_p.description AS "Parent Description",
    bic.item_num AS "BOM Seq",
    msib_c.segment1 AS "Component Item",
    msib_c.description AS "Component Description",
    bic.component_quantity AS "Qty Per Assembly",
    msib_c.primary_uom_code AS "UOM",
    bic.component_yield_factor AS "Yield Factor",
    -- Trường liên kết sang Routing & Máy móc (Department)
    bic.operation_seq_num AS "Consumed at Op Seq",
    bd.department_code AS "Work Center / Dept Code",
    bd.description AS "Work Center Name",
    bic.effectivity_date AS "Effective From"
FROM 
    apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
-- Liên kết sang bảng Công đoạn của Routing để lấy thông tin máy móc/department thực thi
LEFT JOIN apps.bom_operational_routings bor ON bbm.assembly_item_id = bor.assembly_item_id AND bbm.organization_id = bor.organization_id
LEFT JOIN apps.bom_operation_sequences bos ON bor.routing_sequence_id = bos.routing_sequence_id AND bic.operation_seq_num = bos.operation_seq_num
LEFT JOIN apps.bom_departments bd ON bos.department_id = bd.department_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    AND (bic.disable_date IS NULL OR bic.disable_date > SYSDATE) -- Chỉ lấy linh kiện còn hiệu lực
ORDER BY 
    msib_p.segment1, bic.operation_seq_num, bic.item_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn cấu trúc định mức nguyên vật liệu từ bảng thiết kế `PartMtl` của Epicor, chỉ lấy Revision đang có hiệu lực, hiển thị rõ vật tư con được gán vào công đoạn nào (`OprSeq`) và chạy trên nhóm máy nào (`Resource Group`):

```sql
SELECT 
    pm.Company,
    pm.PartNum AS [Parent Item],
    p_parent.Description AS [Parent Description],
    pm.RevisionNum AS [Revision],
    pm.MtlSeq AS [Mtl Seq],
    pm.MtlPartNum AS [Component Item],
    p_comp.Description AS [Component Description],
    pm.QtyPer AS [Qty Per Parent],
    pm.UOMCode AS [UOM on Mtl Line],       -- Đơn vị tính khai báo riêng cho dòng định mức
    p_comp.IUM AS [Component Base UOM],     -- Đơn vị tính gốc của vật tư con, dùng để đối chiếu
    -- Trường liên kết sang Công đoạn sản xuất và Máy móc (Resource Group) của Epicor
    pm.OprSeq AS [Consumed at Op Seq],
    po.OprCode AS [Operation Code],
    po.ResourceGrpID AS [Work Center / Resource Group],
    rg.Description AS [Resource Group Name],
    pm.PullAsAsm AS [Pull As Assembly?],    -- true = kéo nguyên cụm, không rã chi tiết khi cấp phát/tính giá thành
    pm.PlanAsAsm AS [Plan As Assembly?]     -- true = MRP tự lập kế hoạch Job riêng cho cụm này
FROM 
    Erp.PartMtl pm
INNER JOIN 
    Erp.PartRev pr ON pm.Company = pr.Company AND pm.PartNum = pr.PartNum AND pm.RevisionNum = pr.RevisionNum
INNER JOIN 
    Erp.Part p_parent ON pm.Company = p_parent.Company AND pm.PartNum = p_parent.PartNum
INNER JOIN 
    Erp.Part p_comp ON pm.Company = p_comp.Company AND pm.MtlPartNum = p_comp.PartNum
-- Liên kết sang bảng công đoạn sản xuất (Routing) của Epicor
LEFT JOIN 
    Erp.PartOpr po ON pm.Company = po.Company AND pm.PartNum = po.PartNum AND pm.RevisionNum = po.RevisionNum AND pm.OprSeq = po.OprSeq
LEFT JOIN 
    Erp.ResourceGroup rg ON po.Company = rg.Company AND po.ResourceGrpID = rg.ResourceGrpID
WHERE 
    pm.Company = 'EP01'
    AND pr.Approved = 1
    AND pr.EffectiveDate = (
        SELECT MAX(pr2.EffectiveDate) FROM Erp.PartRev pr2 
        WHERE pr2.Company = pr.Company AND pr2.PartNum = pr.PartNum 
        AND pr2.Approved = 1 AND pr2.EffectiveDate <= GETDATE()
    )
ORDER BY 
    pm.PartNum, pm.OprSeq, pm.MtlSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Sử dụng bảng liên kết trung gian **`PLMZ`** của SAP để ánh xạ dòng vật tư của BOM sang công đoạn của Routing và Work Center (Máy móc) chạy công đoạn đó:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material",
    i.POSNR AS "BOM Item Number",
    i.IDNRK AS "Component Material",
    i.MENGE AS "Component Quantity",
    i.MEINS AS "Component UOM",
    -- Liên kết sang công đoạn và máy móc (Work Center) của SAP
    plpo.VORNR AS "Consumed at Op Seq",
    crhd.ARBPL AS "Work Center Code",
    crhd.KTEXT AS "Work Center Name"
FROM 
    saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
-- Sử dụng bảng liên kết trung gian PLMZ để ánh xạ sang Routing
LEFT JOIN saphanadb.PLMZ plmz ON m.WERKS = plmz.WERKS 
                             AND m.MATNR = plmz.MATNR 
                             AND i.STLKN = plmz.STLKN -- Khóa liên kết dòng vật tư
LEFT JOIN saphanadb.PLPO plpo ON plmz.PLNTY = plpo.PLNTY 
                             AND plmz.PLNNR = plpo.PLNNR 
                             AND plmz.PLNKN = plpo.PLNKN -- Khóa liên kết công đoạn
LEFT JOIN saphanadb.CRHD crhd ON plpo.ARBID = crhd.OBJID -- Liên kết lấy mã Work Center/Máy móc
WHERE 
    m.WERKS = '1000'
    AND i.LKENZ = ' ' -- Loại bỏ dòng vật tư đã bị xóa logic
ORDER BY 
    m.MATNR, plpo.VORNR, i.POSNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách BOM định mức từ cơ sở dữ liệu Odoo, hiển thị rõ dòng vật tư được gán cho công đoạn nào (`Operation`) và máy móc (`Work Center`) nào:

```sql
SELECT 
    pt_parent.name AS "Parent Product Template",
    bl.sequence AS "Line Sequence",
    pt_comp.name AS "Component Product Name",
    bl.product_qty AS "Quantity",
    uom.name AS "UOM",
    -- Liên kết lấy thông tin công đoạn và máy móc thực tế của Odoo
    rwc.name AS "Consumed at Operation",
    wc.name AS "Work Center / Machine Code"
FROM 
    mrp_bom bom
INNER JOIN mrp_bom_line bl ON bom.id = bl.bom_id
INNER JOIN product_template pt_parent ON bom.product_tmpl_id = pt_parent.id
INNER JOIN product_product pp_comp ON bl.product_id = pp_comp.id
INNER JOIN product_template pt_comp ON pp_comp.product_tmpl_id = pt_comp.id
LEFT JOIN uom_uom uom ON bl.product_uom_id = uom.id
-- Liên kết sang công đoạn và máy móc chạy công đoạn
LEFT JOIN mrp_routing_workcenter rwc ON bl.operation_id = rwc.id
LEFT JOIN mrp_workcenter wc ON rwc.workcenter_id = wc.id
WHERE 
    bom.active = true
ORDER BY 
    pt_parent.name, rwc.name, bl.sequence;