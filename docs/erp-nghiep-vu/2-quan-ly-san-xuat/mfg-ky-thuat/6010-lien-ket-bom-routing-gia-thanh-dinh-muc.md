---
id: 6010-lien-ket-bom-routing-gia-thanh-dinh-muc
title: Liên kết BOM/Routing với bài toán Tính giá thành định mức (Standard Cost Rollup)
description: Thiết lập cấu hình quét chéo dữ liệu BOM và Routing để tự động tính toán kế hoạch giá thành tiêu chuẩn (Standard Cost) cho toàn bộ cây sản phẩm.
sidebar_label: Giá thành định mức (Cost Rollup)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/6010-lien-ket-bom-routing-gia-thanh-dinh-muc
sidebar_position: 6010
date: 2026-11-15
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, costing, cost-rollup, finance, sql]
---

# 6010 - Tính giá thành định mức

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập Master Data (Standard Cost Rollup Setup)** - cách công cụ kế toán quét chéo cấu trúc BOM và Routing để tự động tính toán ra giá thành kế hoạch tiêu chuẩn phục vụ cho định giá hàng tồn kho. Đối với quy trình giao dịch hạch toán kết chuyển chênh lệch giá thành thực tế cuối tháng (WIP Costing & Variances), vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP) hoặc Tài chính (FIN).

---

Giá thành định mức (Standard Cost) là chiếc "neo" tài chính giúp doanh nghiệp định giá giá trị hàng tồn kho và thiết lập đơn giá bán hàng mục tiêu. Tuy nhiên, giá thành định mức không tự sinh ra từ các con số gõ tay của phòng kế toán. Hệ thống ERP tự động tính toán chỉ số này bằng phương pháp **Cộng dồn giá thành (Cost Rollup)**: Quét đệ quy ngược từ đáy cây cấu trúc sản phẩm, lấy định mức nguyên liệu (BOM) nhân đơn giá mua kế hoạch, cộng với định mức giờ chạy máy (Routing) nhân đơn giá giờ hoạt động của Work Center [2].

Nếu dữ liệu BOM và Routing bị thiết lập sai lệch dù chỉ một chi tiết nhỏ, tiến trình chạy giá thành cuối năm của ERP sẽ lập tức tính toán ra đơn giá sản phẩm bị sai lệch trầm trọng so với thực tế [2]. Bài viết này phân tích sâu kiến trúc dữ liệu cộng dồn giá vốn, thuật toán toán học và cách thức vận hành trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ Kiến trúc dữ liệu tính giá thành định mức

Để chạy tiến trình tính giá thành định mức, hệ thống ERP thực hiện quét chéo dữ liệu từ 3 bảng danh mục độc lập dưới nền cơ sở dữ liệu:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Sử dụng phân hệ **Cost Management** chạy tiến trình Standard Cost Rollup để tính giá Frozen. | Sử dụng phân hệ **Costing Workbench** để quét MoM và lưu giá trị tính toán vào bảng định giá [2.1]. | Sử dụng phân hệ **Product Cost Controlling (CO-PC)** chạy tiến trình tạo ước tính chi phí dở dang [2]. | Sử dụng tính năng tính toán giá vốn trực tiếp trên nút thông minh của form BoM [2.1]. |
| **Bảng lưu trữ giá thành (Costs)** | **`apps.cst_item_costs`** (Lưu trữ chi tiết đơn giá thành phẩm đã dập băng đóng băng - Frozen Cost). | **`Erp.PartCost`** (Lưu trữ chi tiết đơn giá vật liệu, nhân công, khấu hao dập mác tiêu chuẩn) [2.1]. | Bảng **`saphanadb.KEKO`** (Cost Estimate Header) và bảng phân tách cấu phần **`saphanadb.KEPH`** [2]. | Bảng thuộc tính sản phẩm **`product.template`** (Cột `standard_price` - Đơn giá tiêu chuẩn) [2.1]. |
| **Bảng chi tiết cấu phần (Details)** | `CST_ITEM_COST_DETAILS` (Phân rã chi tiết cấu phần chi phí Material, Labor, Overhead). | `PartCost` (Phân rã sẵn thành các cột `StdMaterialCost`, `StdLaborCost`, `StdBurdenCost`) [2.1]. | `KEPH` (Lưu trữ chi tiết các cột phân bổ chi phí hoạt động - Cost Component Split) [2]. | Không phân rã mặc định (Chỉ lưu một con số giá thành gộp tổng hợp tại cột `standard_price`) [2.1]. |
| **Loại giá thành (Cost Type)** | Phân biệt bằng cột `cost_type_id` (`1` là Frozen Cost, `2` là Average Cost). | Sử dụng các trường cấu hình phương pháp định giá trên xưởng (`Part.CostMethod = 'S'`). | Xác định thông qua tham số cấu hình **Costing Variant** (`KLVAR` - ví dụ dập giá PPC1). | Xác định thông qua tham số cấu hình **Costing Method** là `standard` trên form nhóm hàng. |

---

## 2. So sánh luồng vận hành và tiến trình tính toán (Inquiry & Rollup)

### a. Hệ thống Oracle EBS (Cơ chế Standard Cost Rollup — Bảng: `CST_ITEM_COSTS` / `CST_ITEM_COST_DETAILS`)
Oracle EBS quản lý giá thành định mức thông qua tiến trình dập băng chi phí (Frozen Cost):
1. **Bước 1 (Chọn Cost Type):** Kế toán vào `Costing > Item Costs > Item Costs`, chọn loại giá thành cần lập kế hoạch (thường chọn loại `Pending` để chạy thử nghiệm trước khi dập đóng băng `Frozen`).
2. **Bước 2 (Chạy tiến trình cộng dồn):** Chạy chương trình đồng thời **`Standard Cost Rollup`** [2]. Hệ thống tự động quét qua BOM và Routing, lấy thời gian công nghệ nhân đơn giá tài nguyên (`CST_RESOURCE_COSTS`) để tính toán.
3. **Bước 3 (Đóng băng đơn giá - Update Cost):** Chạy tiếp chương trình `Update Standard Costs` để chuyển toàn bộ đơn giá từ loại `Pending` sang loại `Frozen` (field DB: `cost_type_id = 1`), chính thức ghi nhận đơn giá kho mới cho toàn bộ chi nhánh.

### b. Hệ thống Epicor ERP (Cơ chế Costing Workbench — Bảng: `Erp.PartCost` [2.1])
Epicor cung cấp bộ công cụ Workbench để kế toán giá thành giả lập và đối chiếu đơn giá trước khi phê duyệt:
1. **Bước 1 (Tạo nhóm tính giá):** Vào `Production Management > Costing > Costing Workbench`, tạo một mã nhóm hạch toán mới (ví dụ: `ROLL_2026_Q4`) [2.1].
2. **Bước 2 (Nạp cấu trúc MoM):** Chọn tính năng `Load Parts`, nạp toàn bộ danh mục bán thành phẩm và thành phẩm cần tính toán [2.1].
3. **Bước 3 (Chạy Rollup):** Bấm nút `Rollup` [2.1]. Hệ thống Epicor quét qua cây MoM của sản phẩm, lấy định mức nguyên liệu nhân đơn giá mua, cộng với định mức thời gian chạy máy nhân với đơn giá gán tại `ResourceGroup` [2.1]. Giá thành mới được tính toán lưu tạm ở bảng `PartCost` [2.1].
4. **Bước 4 (Phê duyệt):** Bấm nút `Post` để hệ thống cập nhật đơn giá mới vào sổ sách kho [2.1].

### c. Hệ thống SAP S/4HANA (T-Code CK11N / CK40N — Bảng: `saphanadb.KEKO` / `saphanadb.KEPH` [2])
SAP quản lý hạch toán giá thành định mức theo phương pháp ước tính chi phí (Cost Estimate) cực kỳ chuyên sâu:
1. **Bước 1 (Chọn tham số tính toán):** Kế toán dùng T-Code **`CK11N`** (hoặc `CK40N` cho chạy hàng loạt cho cả nhà máy). Nhập mã sản phẩm, nhà máy (`Plant`) và chọn **`Costing Variant`** (ví dụ chọn `PPC1` - Ước tính chi phí tiêu chuẩn).
2. **Bước 2 (Tải cấu trúc số lượng - Quantity Structure):** SAP tự động quét bốc đúng Production Version khả dụng để lấy BOM và Routing làm cấu trúc số lượng [2].
3. **Bước 3 (Chạy phân tách cấu phần - Cost Component Split):** Hệ thống tự động nhân định mức và xuất ra bảng phân tích chi tiết `KEPH` phân bổ thành các cột chi phí nguyên liệu thô, chi phí nhân công trực tiếp, chi phí khấu hao máy và chi phí Overheads [2].
4. **Bước 4 (Phát hành đơn giá):** Sử dụng T-Code `CK24` để thực hiện 2 bước: `Marking` (Xác nhận giá trị kế hoạch) và `Releasing` (Phát hành đơn giá mới làm giá gốc Standard cho Material Master).

### d. Hệ thống Odoo ERP (Cơ chế Compute Price from BoM — Bảng: `product.template` [2.1])
Odoo tối giản hóa quy trình bằng việc bấm nút cập nhật nhanh trực tiếp từ BoM:
1. **Bước 1 (Cấu hình nhóm hàng):** Vào cấu hình Nhóm sản phẩm (Product Category), thiết lập trường `Costing Method` là **`Standard Price`** [2.1].
2. **Bước 2 (Vào form cấu hình BoM):** Kế toán vào màn hình định mức BoM của sản phẩm cần tính giá thành [2.1].
3. **Bước 3 (Bấm nút cộng dồn):** Bấm nút thông minh **`Compute Price from BoM`** [2.1]. Odoo sẽ tự động chạy thuật toán: Lấy tổng tiền nguyên liệu trong BoM cộng với tích của thời gian chạy máy công đoạn nhân với đơn giá giờ chạy gán tại Work Center (`costs_hour`) [2.1]. Giá trị tổng được hệ thống tự động ghi đè thẳng vào trường `standard_price` của sản phẩm cha [2.1].

---

## 3. Thuật toán toán học Cộng dồn Giá thành (BOM Cost Rollup Logic)

Thuật toán cộng dồn giá thành định mức được thực hiện dựa trên nguyên lý tích lũy đệ quy từ cấp thấp nhất lên cấp cao nhất:

### Công thức tổng quát:
$$\text{Standard Cost} = \text{Direct Material Cost (Chi phí nguyên liệu)} + \text{Direct Labor Cost (Chi phí nhân công)} + \text{Burden Cost (Chi phí khấu hao/Overheads)}$$

$$\text{Direct Material Cost} = \sum_{i=1}^{n} \left( \frac{\text{Component Standard Cost}_{i} \times \text{Quantity Per}_{i}}{\text{Component Yield Factor}_{i}} \right)$$

$$\text{Direct Labor Cost} = \sum_{j=1}^{m} \left( \text{Operation Labor Time}_{j} \times \text{Labor Rate Hour}_{j} \right)$$

$$\text{Burden Cost} = \sum_{j=1}^{m} \left( \text{Operation Machine Time}_{j} \times \text{Burden Rate Hour}_{j} \right)$$

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Giá thành định mức

### Bài toán 1: Tìm nguyên nhân lệch giá thành định mức khi phát sinh thay đổi cấu trúc kỹ thuật (BOM Change Cost Variance)
*   **Thách thức:** Sau khi kỹ sư R&D duyệt một ECO thay thế khung nhôm cũ sang khung thép mới đắt tiền hơn, kế toán chạy tiến trình Cost Rollup và phát hiện giá thành tủ điện tăng vọt thêm 500.000 VNĐ. Làm sao kế toán bóc tách được chính xác nguyên nhân tăng chi phí này là do thay đổi vật tư hay do công đoạn dập bị kéo dài thời gian?
*   **Giải pháp thực tế:**
    - Sử dụng công cụ phân tích cấu phần chi phí của hệ thống ERP (ví dụ: bảng `KEPH` của SAP hoặc báo cáo `Item Cost Details` của Oracle).
    - Hệ thống cho phép xuất bảng so sánh song song giữa phiên bản giá thành định mức cũ (Frozen Cost cũ) và phiên bản giá thành nháp mới (Pending Cost).
    - Báo cáo sẽ chỉ rõ: Lượng chênh lệch 500.000 VNĐ được phân bổ thành: `Material Cost Variance = +480,000` (Chênh lệch do đổi khung nhôm sang thép), và `Labor Cost Variance = +20,000` (Chênh lệch do uốn khung thép tốn nhiều thời gian hơn khung nhôm), giúp ban giám đốc có cơ sở kiểm soát biến động chi phí thiết kế cực kỳ minh bạch.

### Bài toán 2: Lỗi tính sai giá thành do thiếu hụt giờ công chuẩn bị máy (Setup Hour Costing Error) khi sản xuất lô siêu nhỏ
*   **Thách thức:** Một công đoạn dập yêu cầu thời gian chuẩn bị máy (Setup Time) cố định là 2 giờ (chi phí nhân công là 300.000 VNĐ). Thời gian dập 1 sản phẩm là 1 phút (chi phí 2.000 VNĐ). Khi hệ thống ERP chạy tính giá thành định mức tiêu chuẩn, làm sao để phân bổ chính xác 300.000 VNĐ tiền setup máy này vào đơn giá của 1 chiếc tủ điện dập?
*   **Giải pháp thực tế:**
    - Hệ thống sử dụng thuộc tính **`Costing Lot Size` (Lô sản xuất tính giá)** cấu hình trên Material Master hoặc Production Version để làm bàn cân phân bổ.
    - Nếu kế toán cấu hình `Costing Lot Size = 1.000` sản phẩm.
    - Hệ thống ERP tự động phân bổ chi phí setup cho 1 sản phẩm đầu ra:
      $$\text{Chi phí setup phân bổ cho 1 sản phẩm} = \frac{300,000 \text{ VNĐ}}{1,000 \text{ sản phẩm}} = 300 \text{ VNĐ/sản phẩm}$$
    - Do đó, giá thành định mức cuối cùng của sản phẩm sẽ bao gồm $300 \text{ VNĐ}$ chi phí setup và $2.000 \text{ VNĐ}$ chi phí dập chạy máy. Nếu kế toán đặt nhầm `Costing Lot Size` quá nhỏ (ví dụ: bằng 10), chi phí gán cho 1 sản phẩm sẽ bị đội vọt lên vô lý ($30.000 \text{ VNĐ}$ setup), gây sai lệch toàn bộ hạch toán tồn kho kế hoạch.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Giá thành định mức

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn đơn giá giá thành định mức đã được đóng băng (Frozen Cost) phân rã chi tiết theo từng cấu phần chi phí (Material, Resource, Overhead) của sản phẩm:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Item Code",
    msib.description AS "Description",
    -- Cost Type ID = 1 đại diện cho Frozen Cost (Giá thành định mức chính thức)
    cic.cost_type_id AS "Cost Type ID",
    cic.material_cost AS "Direct Material Cost",
    cic.resource_cost AS "Direct Labor/Resource Cost",
    cic.outside_processing_cost AS "Outside Processing Cost",
    cic.overhead_cost AS "Overhead Cost",
    cic.item_cost AS "Total Standard Cost"
FROM 
    apps.cst_item_costs cic
INNER JOIN apps.mtl_system_items_b msib ON cic.inventory_item_id = msib.inventory_item_id AND cic.organization_id = msib.organization_id
INNER JOIN apps.org_organization_definitions ood ON cic.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1' -- Thay bằng mã Org thực tế của bạn
    AND cic.cost_type_id = 1     -- Lọc riêng loại Frozen Cost
ORDER BY 
    msib.segment1;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn chi tiết các cấu phần giá thành định mức (Standard Cost) được cộng dồn của danh mục sản phẩm từ bảng hạch toán giá gốc `PartCost` của Epicor [2.1]:

```sql
SELECT 
    pc.Company,
    pc.PartNum AS [Part Number],
    p.Description AS [Part Description],
    -- Epicor tách nhỏ đơn giá thành từng cấu phần chi phí riêng biệt [2.1]
    pc.StdMaterialCost AS [Standard Material Cost],     -- Giá thành nguyên liệu
    pc.StdLaborCost AS [Standard Labor Cost],           -- Giá thành nhân công trực tiếp
    pc.StdBurdenCost AS [Standard Burden/Machine Cost],  -- Giá thành khấu hao máy chạy
    pc.StdSubContCost AS [Standard Subcontract Cost],   -- Giá thành gia công ngoài
    -- Tính tổng cộng giá thành dập mác tiêu chuẩn
    (pc.StdMaterialCost + pc.StdLaborCost + pc.StdBurdenCost + pc.StdSubContCost) AS [Total Standard Cost]
FROM 
    Erp.PartCost pc
INNER JOIN 
    Erp.Part p ON pc.Company = p.Company AND pc.PartNum = p.PartNum
WHERE 
    pc.Company = 'EP01'
ORDER BY 
    pc.PartNum;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn danh sách các mẻ ước tính chi phí giá thành kế hoạch (Cost Estimates) từ bảng Header `KEKO` của SAP để đối chiếu quy mô lô tính giá (`LOSGR`):

```sql
SELECT 
    ck.WERKS AS "Plant",
    ck.MATNR AS "Material Code",
    ck.KALNR AS "Cost Estimate ID",
    ck.LOSGR AS "Costing Lot Size",                  -- Quy mô lô dồn tính giá thành (MRP 1)
    ck.CMKOP AS "Total Standard Cost Value",         -- Giá trị tổng cộng của ước tính chi phí
    ck.WAERS AS "Currency",
    ck.ALPLN AS "Routing Group Counter Used",        -- Phiên bản quy trình đã bốc để tính giá
    ck.FEOLD AS "Costing Valid From Date"
FROM 
    saphanadb.KEKO ck -- Bảng lưu thông tin Cost Estimate Header
WHERE 
    ck.MANDT = '100'
    AND ck.WERKS = '1000' -- Lọc theo Plant thực tế
ORDER BY 
    ck.MATNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn đơn giá tiêu chuẩn (`standard_price`) được ghi đè trực tiếp sau tiến trình cộng dồn BoM của Odoo [2.1]:

```sql
SELECT 
    pt.name AS "Product Name Template",
    -- Đơn giá tiêu chuẩn (Standard Price) chính là kết quả của tiến trình cộng dồn BoM [2.1]
    pt.standard_price AS "BoM Rolled-up Standard Cost",
    -- Phương pháp hạch toán và định giá kho của Odoo [2.1]
    pt.costing_method AS "Costing Method (standard)",
    pt.valuation AS "Inventory Valuation Type"
FROM 
    product_template pt
WHERE 
    pt.active = true 
    AND pt.costing_method = 'standard' -- Lọc các sản phẩm áp dụng giá thành định mức
ORDER BY 
    pt.name;