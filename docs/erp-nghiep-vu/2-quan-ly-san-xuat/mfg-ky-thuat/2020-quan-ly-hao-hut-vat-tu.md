---
id: 2020-quan-ly-hao-hut-vat-tu
title: Quản lý tỷ lệ hao hụt vật tư trong BOM (Scrap & Loss Factor)
sidebar_label: 2020 - Hao hụt vật tư trong BOM
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/2020-quan-ly-hao-hut-vat-tu
date: 2026-09-18
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, scrap, loss, yield, sql]
---

# Quản lý tỷ lệ hao hụt vật tư trong BOM (Scrap & Loss Factor)

Trong thực tế sản xuất, nguyên vật liệu hầu như không bao giờ được tiêu hao trọn vẹn 100%. Luôn luôn tồn tại các khoảng hao hụt vật lý: hao hụt do vải vụn, phôi thép thừa thừa đầu thừa đuôi (Scrap), hao hụt do co ngót, bay hơi (Shrinkage/Loss), hoặc hao hụt khi bắt đầu set-up căn chỉnh khuôn máy (Setup Scrap). 

Nếu hệ thống ERP không tính toán các hệ số này vào MRP, nhà xưởng sẽ liên tục rơi vào trạng thái thiếu hụt vật tư khi chạy máy thực tế. Ngược lại, nếu thiết lập hệ số quá cao, lượng tồn kho an toàn ảo sẽ tăng vọt gây đọng vốn. Bài viết này phân tích sâu kiến trúc dữ liệu, thuật toán tính toán và cách quản lý hao hụt vật tư trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Để mô hình hóa lượng hao hụt, các hệ thống ERP chia thành 3 cấp độ: **Hao hụt thành phẩm (Assembly Scrap)** $\rightarrow$ **Hao hụt linh kiện con (Component Scrap)** $\rightarrow$ **Hao hụt công đoạn (Operation Scrap)**.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Hao hụt Thành phẩm (Assembly level)** | `MTL_SYSTEM_ITEMS_B` (Cột `shrinkage_rate` - Tỷ lệ co ngót/lỗi của cả cụm). | `Erp.Part` / `Erp.PartRev` (Cột `EstScrap` - Tỷ lệ lỗi thành phẩm dự kiến). | `saphanadb.MARC` (Cột `AUSSS` - Assembly Scrap %). | Không có trường tiêu chuẩn trên Product Header (Thường gán vào OEE của Work Center). |
| **Hao hụt Linh kiện (Component level)** | `BOM_INVENTORY_COMPONENTS` (Cột `component_yield_factor` - Hệ số thu hồi vật tư con). | `Erp.PartMtl` (Cột `ScrapPct` - Hao hụt % biến đổi, và `ScrapQty` - Hao hụt cố định). | `saphanadb.STPO` (Cột `KAUSF` - Component Scrap %). | Trường `Manual Scrap` hoặc cấu hình tỷ lệ thất thoát thủ công trên dòng vật tư. |
| **Hao hụt Công đoạn (Operation level)** | `BOM_INVENTORY_COMPONENTS` (Liên kết gián tiếp thông qua hệ số hiệu quả công đoạn của Routing). | Quản lý thông qua cấu hình hiệu suất `OprSeq` trên `PartOpr`. | `saphanadb.STPO` (Cột `AVOAU` - Operation Scrap %). | Theo dõi trực tiếp thông qua thời gian hỏng hóc và dừng máy tại Work Center. |

---

## 2. So sánh luồng thiết lập giao diện và Triết lý toán học (UI & Mathematical Philosophy)

Mỗi hãng ERP sử dụng một triết lý toán học khác nhau để tính toán lượng hao hụt:

### a. Hệ thống Oracle EBS (Triết lý Hệ số thu hồi - Yield Factor)
Oracle EBS tiếp cận theo hướng **Hệ số thu hồi (Yield Factor)** thay vì tỷ lệ phế liệu trực tiếp:
*   **Triết lý toán học:** Hệ số thu hồi (Yield Factor) là một số thập phân từ `0.00` đến `1.00`. Nếu tỷ lệ phế liệu dự kiến là $5\%$, thì Yield Factor tương ứng là $95\%$ (`0.95`).
*   **Công thức tính:**
    $$\text{Tổng nhu cầu vật tư con} = \frac{\text{Sản lượng sản xuất cha} \times \text{Định mức}}{\text{Component Yield Factor}}$$
*   **Giao diện thiết lập:** Trong màn hình `BOM > Bills`, tại dòng vật tư con, người dùng nhập hệ số thu hồi vào cột `Yield` (field DB: `component_yield_factor`). Ví dụ nhập `0.98` cho lốp xe (dự kiến lỗi lắp ráp 2%).

### b. Hệ thống Epicor ERP (Triết lý Song song Cố định và Biến đổi)
Epicor hỗ trợ quản lý chi tiết cả hai loại hao hụt xảy ra trong nhà máy:
*   **Triết lý toán học:** Tách biệt rõ ràng **Hao hụt cố định (Scrap Qty)** xảy ra khi thiết lập máy và **Hao hụt biến đổi (Scrap %)** tăng dần theo sản lượng sản xuất.
*   **Công thức tính:**
    $$\text{Tổng nhu cầu vật tư con} = \left( \text{Sản lượng sản xuất cha} \times \text{Định mức} \times \left(1 + \frac{\text{ScrapPct}}{100}\right) \right) + \text{ScrapQty}$$
*   **Giao diện thiết lập:** Trong `Engineering Workbench > Materials`, tại dòng vật tư, người dùng nhập:
    - `Scrap Qty` (field DB: `ScrapQty`): Số lượng hao hụt cố định (ví dụ: cần 2 mét dây cáp cắt thử để căn chỉnh máy dập đầu cốt).
    - `Scrap Pct` (field DB: `ScrapPct`): Phần trăm hao hụt biến đổi trong suốt quá trình chạy máy (ví dụ: `3%`).

### c. Hệ thống SAP S/4HANA (Triết lý Phân cấp 3 tầng)
SAP quản lý hao hụt đồng bộ ở mọi cấp độ của cấu trúc sản phẩm:
*   **Triết lý toán học:** Cho phép áp dụng cộng dồn cả 3 loại hệ số hao hụt:
    - **Assembly Scrap (Baugruppenausschuss):** Cấu hình tại Material Master (View MRP 1). Nếu thành phẩm bị lỗi 2%, hệ thống tự động tăng quy mô sản xuất của lệnh lên 2% $\rightarrow$ kéo theo tăng nhu cầu của tất cả các vật tư con lên 2%.
    - **Component Scrap (Komponentenausschuss):** Cấu hình tại BOM Line, chỉ tăng nhu cầu của riêng vật tư đó.
    - **Operation Scrap (Vorgangsausschuss):** Cấu hình tại Routing, chỉ tăng nhu cầu vật tư con tại một công đoạn cụ thể (triệt tiêu ảnh hưởng của hao hụt ở các công đoạn trước đó).

### d. Hệ thống Odoo ERP (Triết lý Quản trị OEE sàn sản xuất)
Odoo tiếp cận đơn giản hơn, tập trung vào việc quản lý phế liệu phát sinh thực tế hơn là tính toán định mức phức tạp trên kế hoạch:
*   **Triết lý toán học:** Hệ thống mặc định tính toán theo định mức 100%. Sự hao hụt được theo dõi thông qua báo cáo phế liệu phát sinh thực tế (Scrap Order) trong quá trình sản xuất.
*   **Giao diện thiết lập:** Khi công nhân vận hành bấm hoàn thành Lệnh sản xuất (Manufacturing Order) và phát hiện phế liệu, họ bấm nút **`Scrap`** trên màn hình để hệ thống tự động xuất kho lượng phế liệu đó ra một kho phế thải riêng biệt, đảm bảo khớp số liệu tồn kho thực tế.

---

## 3. Thuật toán quy đổi Nhu cầu vật tư có hao hụt (Scrap/Yield Math Formulas)

Để hiểu rõ cách các hệ thống xử lý tính toán, hãy xem xét kịch bản sản xuất của một nhà máy dập cuộn thép mạ kẽm thành các tấm vỏ tủ điện:

### Kịch bản sản xuất:
Nhà máy cần dập **1.000 tấm vỏ tủ điện**.
Thông số cấu hình trên BOM:
- Mỗi tấm vỏ tủ điện cần **1.5 kg thép cuộn**.
- **Hao hụt cố định (Setup Scrap):** Mỗi lần khởi động máy dập cần dập thử mất **10 kg** phôi thép để căn chỉnh dao cắt và cối dập.
- **Hao hụt biến đổi (Scrap %):** Trong quá trình chạy máy, rủi ro lệch phôi, móp góc gây phế liệu chiếm **4%** tổng sản lượng (`ScrapPct = 4%`, tương đương `Component Yield Factor = 0.96`).

### Cách máy tính quy đổi nhu cầu thực tế của MRP:

#### Cách tính của Epicor (Sử dụng công thức kết hợp Cố định + Biến đổi):
$$\text{Tổng thép cần cấp phát} = \left( 1,000 \text{ vỏ} \times 1.5 \text{ kg} \times (1 + 0.04) \right) + 10 \text{ kg} = 1,560 + 10 = 1,570 \text{ kg}$$

#### Cách tính của Oracle EBS (Sử dụng công thức Yield Factor quy đổi):
*Do Oracle không có trường hao hụt cố định trực tiếp trên dòng BOM, kỹ sư vận hành sẽ quy đổi 10 kg hao hụt set-up thành tỷ lệ % phân bổ, hoặc Oracle sẽ xử lý thông qua định mức phụ trợ. Nếu chỉ tính theo Yield Factor:*
$$\text{Tổng thép cần cấp phát} = \frac{1,000 \text{ vỏ} \times 1.5 \text{ kg}}{0.96} = 1,562.5 \text{ kg}$$

> **Ý nghĩa thực tế:** Công thức của Epicor ưu việt hơn đối với các ngành dập, cắt dây, hóa chất vì thời gian chạy thử máy (Setup) luôn tiêu tốn một lượng nguyên liệu cố định bất kể lô sản xuất là 100 hay 10.000 sản phẩm. Công thức Epicor giúp MRP tính toán chính xác lượng cần cấp phát cho các lô sản xuất quy mô nhỏ.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Hao hụt

### Bài toán 1: Phân bổ chi phí và xử lý phế liệu thu hồi có giá trị thương mại (Scrap Recovery)
*   **Thách thức:** Trong quá trình dập tấm thép, phần rìa thép dư thừa (phế liệu dập) được thu hồi lại để bán thanh lý cho đơn vị thu mua phế liệu với giá trị bằng 20% giá thép nguyên bản. Làm sao để hệ thống vừa trừ kho thép nguyên bản, vừa tự động nhập kho lượng phế liệu thu hồi này và hạch toán giảm trừ giá thành sản phẩm?
*   **Giải pháp thực tế:**
    - Thiết lập sản phẩm phụ thu hồi (**By-product / Scrap Recovery**) trực tiếp trên cây BOM của sản phẩm cha.
    - Tại dòng vật tư con (Thép cuộn): Khai báo định mức `1.5 kg` và `Scrap Pct = 4%` (tức là phát sinh 0.06 kg phế liệu trên 1 sản phẩm).
    - Tại dòng sản phẩm phụ thu hồi (Phế liệu thép dập): Khai báo định mức là **`-0.06 kg`** (định mức âm biểu thị sản phẩm thu hồi được) với đơn giá kế hoạch bằng 20% đơn giá phôi thép.
    - Khi đóng lệnh sản xuất (Job Close), hệ thống ERP sẽ tự động tạo giao dịch xuất kho `1.56 kg` thép cuộn, đồng thời tạo giao dịch nhập kho `-0.06 kg` phế liệu thép dập vào kho Phế liệu, đồng thời ghi nhận giảm trừ chi phí nguyên vật liệu trực tiếp (Direct Material Cost) của sản phẩm chính tương ứng với giá trị phế liệu thu hồi.

### Bài toán 2: Đồng bộ kế hoạch chạy máy với hao hụt cụm thành phẩm (Assembly Scrap)
*   **Thách thức:** Nhà máy sản xuất mạch điện tử (PCBA). Tỷ lệ lỗi kiểm thử (FCT Test) cuối quy trình trung bình là 3%. Nếu khách hàng đặt mua đúng **1.000 mạch**, bộ phận kế hoạch không thể chỉ lên lệnh sản xuất 1.000 mạch được, vì thực tế sẽ chỉ có khoảng 970 mạch đạt chất lượng để giao hàng.
*   **Giải pháp thực tế:**
    - Trên cấu hình sản phẩm cha (PCBA), khai báo hệ số **Assembly Scrap / Shrinkage Rate = 3%**.
    - Khi bộ phận kế hoạch tạo Lệnh sản xuất với sản lượng yêu cầu (Target Qty) là `1.000` chiếc, hệ thống ERP sẽ tự động chạy thuật toán quy đổi quy mô lệnh sản xuất lên:
      $$\text{Sản lượng lệnh sản xuất thực tế} = \frac{1,000}{1 - 0.03} \approx 1,031 \text{ chiếc}$$
    - Hệ thống sẽ tự động lập lịch chạy máy cho **1.031 chiếc** và yêu cầu cấp phát toàn bộ nguyên vật liệu con (chíp, tụ điện, bo mạch thô) tương ứng với sản lượng 1.031 chiếc này.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Hao hụt vật tư

### a. Trên hệ thống Oracle EBS (PL/SQL)
Kiểm tra danh sách các linh kiện có cấu hình hao hụt (Yield Factor < 1) và thành phẩm cha có cấu hình tỷ lệ co ngót (`shrinkage_rate`) để rà soát dữ liệu MRP:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib_p.segment1 AS "Parent Item",
    msib_p.description AS "Parent Description",
    msib_p.shrinkage_rate AS "Assembly Shrinkage (%)", -- Tỷ lệ hao hụt cụm cha
    msib_c.segment1 AS "Component Item",
    bic.component_quantity AS "Qty Per Assembly",
    bic.component_yield_factor AS "Component Yield Factor", -- Ví dụ: 0.95 (Hao hụt 5%)
    -- Tính tỷ lệ hao hụt % thực tế của dòng vật tư con
    ROUND((1 - bic.component_yield_factor) * 100, 2) AS "Component Scrap (%)"
FROM 
    apps.bom_bill_of_materials bbm
INNER JOIN apps.bom_inventory_components bic ON bbm.bill_sequence_id = bic.bill_sequence_id
INNER JOIN apps.mtl_system_items_b msib_p ON bbm.assembly_item_id = msib_p.inventory_item_id AND bbm.organization_id = msib_p.organization_id
INNER JOIN apps.mtl_system_items_b msib_c ON bic.component_item_id = msib_c.inventory_item_id AND bbm.organization_id = msib_c.organization_id
INNER JOIN apps.org_organization_definitions ood ON bbm.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1'
    -- Lọc các dòng phát sinh cấu hình hao hụt
    AND (bic.component_yield_factor < 1 OR msib_p.shrinkage_rate > 0)
ORDER BY 
    msib_p.segment1, bic.item_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Kiểm tra chi tiết hệ số hao hụt cố định (`ScrapQty`) và hao hụt biến đổi (`ScrapPct`) của tất cả các dòng định mức nguyên vật liệu trên Epicor:

```sql
SELECT 
    pm.Company,
    pm.PartNum AS [Parent Item],
    p_parent.Description AS [Parent Description],
    p_parent.EstScrap AS [Assembly Est Scrap %], -- Hao hụt thành phẩm cha
    pm.MtlSeq AS [Mtl Seq],
    pm.MtlPartNum AS [Component Item],
    p_comp.Description AS [Component Description],
    pm.QtyPer AS [Qty Per Parent],
    pm.ScrapQty AS [Fixed Scrap Qty (Setup)],    -- Hao hụt cố định (Lượng căn chỉnh máy)
    pm.ScrapPct AS [Variable Scrap (%)],          -- Hao hụt biến đổi theo tỷ lệ chạy
    pm.UOMCode AS [UOM]
FROM 
    Erp.PartMtl pm
INNER JOIN 
    Erp.Part p_parent ON pm.Company = p_parent.Company AND pm.PartNum = p_parent.PartNum
INNER JOIN 
    Erp.Part p_comp ON pm.Company = p_comp.Company AND pm.MtlPartNum = p_comp.PartNum
WHERE 
    pm.Company = 'EP01'
    -- Lọc các dòng phát sinh cấu hình hao hụt
    AND (pm.ScrapQty > 0 OR pm.ScrapPct > 0 OR p_parent.EstScrap > 0)
ORDER BY 
    pm.PartNum, pm.MtlSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn tích hợp các thông số Assembly Scrap (`AUSSS`), Component Scrap (`KAUSF`) và Operation Scrap (`AVOAU`) của SAP từ các bảng `MARC` và `STPO`:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material",
    marc.AUSSS AS "Assembly Scrap (%)",       -- Baugruppenausschuss (MRP 1)
    i.POSNR AS "BOM Item Number",
    i.IDNRK AS "Component Material",
    i.MENGE AS "Component Quantity",
    i.KAUSF AS "Component Scrap (%)",         -- Komponentenausschuss (BOM Line)
    i.AVOAU AS "Operation Scrap (%)",         -- Vorgangsausschuss (BOM Line)
    i.MEINS AS "UOM"
FROM 
    saphanadb.MAST m
INNER JOIN saphanadb.STKO h ON m.STLNUM = h.STLNUM
INNER JOIN saphanadb.STPO i ON h.STLNUM = i.STLNUM
INNER JOIN saphanadb.MARC marc ON m.MATNR = marc.MATNR AND m.WERKS = marc.WERKS
WHERE 
    m.WERKS = '1000'
    AND i.LKENZ = ' '
    -- Lọc các dòng phát sinh cấu hình hao hụt
    AND (i.KAUSF > 0 OR marc.AUSSS > 0 OR i.AVOAU > 0)
ORDER BY 
    m.MATNR, i.POSNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn các sản phẩm phụ thu hồi phế liệu (By-product với định mức âm `-`) được thiết lập trên cấu trúc BoM của Odoo:

```sql
SELECT 
    pt_parent.name AS "Parent Product Template",
    pt_byproduct.name AS "By-product (Scrap Recovery)",
    bp.product_qty AS "Recovery Quantity",
    uom.name AS "UOM"
FROM 
    mrp_bom_byproduct bp
INNER JOIN mrp_bom bom ON bp.bom_id = bom.id
INNER JOIN product_template pt_parent ON bom.product_tmpl_id = pt_parent.id
INNER JOIN product_product pp_byproduct ON bp.product_id = pp_byproduct.id
INNER JOIN product_template pt_byproduct ON pp_byproduct.product_tmpl_id = pt_byproduct.id
LEFT JOIN uom_uom uom ON bp.product_uom_id = uom.id
WHERE 
    bom.active = true
    -- Định mức âm biểu thị sản phẩm phụ thu hồi được giải phóng ra từ quy trình
    AND bp.product_qty < 0
ORDER BY 
    pt_parent.name;