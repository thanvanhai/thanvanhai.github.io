---
id: 4020-thiet-lap-dieu-kien-lua-chon-phien-ban
title: Thiết lập điều kiện lựa chọn phiên bản sản xuất tự động (Production Version Selection Criteria)
description: Thiết lập dữ liệu gốc quy tắc ưu tiên (Preference/Sequence), phương thức bốc tự động và chia hạn ngạch (Quota Arrangement) để điều khiển hành vi bốc công thức sản xuất của MRP.
sidebar_label: Lựa chọn phiên bản tự động
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/4020-thiet-lap-dieu-kien-lua-chon-phien-ban
sidebar_position: 4020
date: 2026-10-28
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, production-version, recipe, quota-arrangement, sql]
---

# 4020 - Lựa chọn phiên bản tự động

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập các tham số điều kiện lựa chọn phiên bản sản xuất tự động (Selection Criteria, Preference, Quota Split)** trên dữ liệu gốc phục vụ cho thuật toán MRP và WIP [2]. Đối với quy trình giao dịch thực tế sửa đổi hoặc hoán đổi phiên bản thủ công trực tiếp trên Lệnh sản xuất dở dang tại sàn, vui lòng tham khảo các bài viết thuộc phân hệ Thực thi sản xuất (WIP).

---

Khi một sản phẩm có nhiều cách thức sản xuất khả thi (nhiều Phiên bản sản xuất/Recipe hoạt động song song), hệ thống ERP cần một bộ quy tắc thông minh để tự động quyết định xem nên bốc phiên bản nào khi chạy MRP hoặc khi dập Lệnh sản xuất. Nếu không thiết lập các **Tiêu chí lựa chọn tự động (Selection Criteria / Preference)**, hệ thống sẽ rơi vào trạng thái bốc ngẫu nhiên, dẫn đến việc xếp lịch chạy máy bị sai lệch hoàn toàn so với ý đồ điều độ của xưởng.

Bài viết này phân tích sâu kiến trúc dữ liệu quy tắc chọn lọc, thuật toán phân bổ hạn ngạch (Quota Arrangement) và cách cấu hình trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo** [2].

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Để điều khiển hành vi chọn lọc tự động, các hệ thống ERP sử dụng các chỉ số ưu tiên (Priority/Sequence) hoặc các cờ cài đặt phương thức bốc (Selection Methods) lưu trong cơ sở dữ liệu:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Định nghĩa thứ tự ưu tiên gán trực tiếp trên bảng quy tắc hiệu lực của Công thức (Recipe Validity Rules). | Hệ thống tự động chọn phiên bản có ngày hiệu lực mới nhất; hoặc điều phối tự động qua APS. | Điều khiển qua trường **Selection Method** tại Material Master kết hợp bảng hạn ngạch sản lượng. | Điều khiển thứ tự chọn lọc tự động thông qua trường chỉ số **Sequence** trên Header của BoM. |
| **Bảng dữ liệu gốc (Table)** | **`GMD_RECIPE_VALIDITY_RULES`** (Bảng quản lý quy tắc hiệu lực của Recipe OPM). | **`Erp.PartRev`** (Bảng quản lý phiên bản sản phẩm gốc). | **`saphanadb.MARC`** (Material Master Plant) và bảng hạn ngạch **`saphanadb.EQUIP`** / **`EQUT`**. | **`mrp.bom`** (Bảng định nghĩa định mức sản phẩm). |
| **Mức độ ưu tiên (Priority)** | Cột `preference` (Lưu điểm ưu tiên dạng số. Số nhỏ hơn sẽ được ưu tiên bốc trước). | Tự động tính toán thứ tự ưu tiên dựa trên ngày hiệu lực `EffectiveDate` gần nhất. | Điều khiển thông qua mã thiết lập **Selection Method** kết hợp bảng Quota Arrangement. | Cột `sequence` (Mã số thứ tự ưu tiên. BoM có số sequence nhỏ hơn được ưu tiên bốc trước). |
| **Phân bổ hạn ngạch (Quota Split)** | Không hỗ trợ tự động chia % ở cấp Recipe (Thường chia ở cấp phân bổ nhu cầu lập kế hoạch mua). | Thường phải tùy biến viết code BPM để phân bổ tỷ lệ phát hành Job tự động cho các xưởng. | Hỗ trợ phân bổ tỷ lệ % sản lượng tự động cho từng phiên bản qua tính năng **Quota Arrangement**. | Thường sử dụng các tuyến đường phân bổ (Routes) kết hợp quy tắc tái cung ứng kho nâng cao. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình Recipe Preference — Bảng: `GMD_RECIPE_VALIDITY_RULES`)
Trong phân hệ sản xuất hóa chất (OPM) của Oracle, việc chọn lọc công thức được điều khiển qua màn hình quy tắc hiệu lực:
1. **Bước 1 (Mở Recipe):** Truy cập màn hình `Recipe Maintenance`, tìm công thức cần cấu hình. Bấm nút `Validity Rules`.
2. **Bước 2 (Thiết lập mục đích sử dụng):** Tại trường `Recipe Use` (field DB: `recipe_use`), chọn loại nghiệp vụ áp dụng (ví dụ chọn `Production` cho sản xuất, hoặc `Costing` cho tài chính).
3. **Bước 3 (Nhập điểm ưu tiên):** Tại trường **`Preference`** (field DB: `preference`), người dùng nhập điểm số ưu tiên (ví dụ: Quy trình chạy máy tự động nhập `1` - ưu tiên cao nhất; Quy trình chạy tay nhập `2` - dự phòng khi máy bận).

### b. Hệ thống Epicor ERP (Triết lý Effective Date & Approved — Bảng: `Erp.PartRev`)
Epicor áp dụng triết lý chọn lọc tự động dựa trên dòng thời gian và trạng thái phê duyệt thiết kế kỹ thuật:
1. **Bước 1 (Khai báo ngày hiệu lực):** Trên màn hình `Part Maintenance`, kỹ sư gán ngày hiệu lực cho từng Revision tại trường **`Effective Date`** (field DB: `EffectiveDate`).
2. **Bước 2 (Phê duyệt):** Tích chọn cờ **`Approved`** (field DB: `Approved = True`).
3. **Hành vi tự động:** Khi tạo Job sản xuất vào ngày $D$, Epicor MRP Engine sẽ chạy thuật toán tự động quét: Hệ thống chỉ bốc Revision có `Approved = True` và có ngày `EffectiveDate <= D` gần nhất tính đến thời điểm hiện tại.

### c. Hệ thống SAP S/4HANA (Cấu hình Selection Method — Bảng: `saphanadb.MARC` / `saphanadb.MKAL`)
SAP cung cấp giải pháp điều khiển hành vi bốc công thức cực kỳ đa dạng thông qua Material Master:
1. **Bước 1 (Chọn phương thức bốc):** Dùng T-Code `MM02` (View MRP 4), tại trường **`Selection Method`** (field DB: `ALTSL`), người dùng chọn phương án hoạt động:
   - Chọn ` ` (Blank) hoặc `1`: Hệ thống tự động bốc Production Version dựa trên quy mô lô sản xuất (**Selection by Lot Size**).
   - Chọn `2`: Hệ thống tự động bốc Production Version dựa trên ngày hiệu lực của lệnh (**Selection by Explosion Date**).
   - Chọn `3`: Chọn phiên bản dựa trên cấu hình chỉ định sẵn của từng đợt chạy máy.
2. **Bước 2 (Xếp thứ tự ưu tiên):** Trong T-Code `C223`, các phiên bản được sắp xếp thứ tự từ trên xuống dưới. Nếu 2 phiên bản có cùng ngày hiệu lực và lô sản xuất, SAP sẽ ưu tiên bốc phiên bản nằm ở dòng trên trước.

### d. Hệ thống Odoo ERP (Cấu hình BoM Sequence — Bảng: `mrp.bom`)
Odoo quản lý thứ tự bốc công thức đơn giản thông qua việc đánh số thứ tự ưu tiên trực tiếp trên BoM:
1. **Bước 1 (Mở BoM):** Vào màn hình tạo BoM của sản phẩm, bấm vào tab `Miscellaneous` (Thông tin khác).
2. **Bước 2 (Nhập mã Sequence):** Tại trường **`Sequence`** (field DB: `sequence`), người dùng nhập số thứ tự ưu tiên (ví dụ: quy trình tiêu chuẩn nhập `10`, quy trình dự phòng nhập `20`).
3. **Hành vi tự động:** Khi Lệnh sản xuất (MO) được tạo ra, Odoo sẽ tự động quét qua danh sách BoM hoạt động của sản phẩm và bốc BoM có số Sequence nhỏ nhất gán cho MO.

---

## 3. Thuật toán Quyết định chọn lọc tự động của Hệ thống (Cascading Check)

Khi hệ thống MRP chạy, thuật toán quyết định lựa chọn phiên bản sản xuất (Production Version) sẽ được thực hiện thông qua một ma trận kiểm tra thác nước (Cascading Check):

```text
               [ PHÁT SINH LỆNH SẢN XUẤT ] (Sản lượng: Q, Ngày chạy: D)
                               │
                               ▼
               [ BƯỚC 1: TRẠNG THÁI HIỆU LỰC ]
            - Lọc bỏ các phiên bản có Approved = False
            - Lọc bỏ các phiên bản đang bị Locked (Khoá)
                               │
                               ▼
               [ BƯỚC 2: KHUNG THỜI GIAN HIỆU LỰC ]
            - Lọc bỏ các phiên bản có Valid From > D hoặc Valid To < D
                               │
                               ▼
               [ BƯỚC 3: DẢI SẢN LƯỢNG LÔ ]
            - Lọc bỏ các phiên bản có Min Lot Size > Q hoặc Max Lot Size < Q
                               │
                               ▼
               [ BƯỚC 4: THỨ TỰ ƯU TIÊN (PREFERENCE / SEQUENCE) ]
            - Nếu còn lại > 1 phiên bản thỏa mãn:
              Bốc phiên bản có chỉ số Preference / Sequence nhỏ nhất
                               │
                               ▼
            [ ÁP DỤNG PHIÊN BẢN SẢN XUẤT PHÙ HỢP NHẤT ]
```

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Lựa chọn phiên bản

### Bài toán 1: Phân bổ sản lượng dệt nhuộm tự động theo hạn ngạch (Quota Arrangement)
*   **Thách thức:** Nhà máy dệt nhuộm có 2 phân xưởng sản xuất: Phân xưởng A chạy máy tự động (Production Version `V001` - đảm nhiệm 70% sản lượng sản xuất trong kỳ), Phân xưởng B chạy máy thủ công dự phòng (Production Version `V002` - đảm nhiệm 30% sản lượng). Nếu để MRP tự động bốc, hệ thống sẽ bốc 100% cho `V001` vì đây là phiên bản ưu tiên rẻ hơn, gây ra tình trạng phân xưởng B bị bỏ trống máy và phân xưởng A bị quá tải.
*   **Giải pháp thực tế trên SAP S/4HANA:**
    - Sử dụng tính năng **`Quota Arrangement`** (T-Code `MEQ1`). Thiết lập hạn ngạch cho mã sản phẩm thành phẩm:
      - Đối với dòng gán mã `V001`: Nhập tỷ lệ Quota = **`70`**.
      - Đối với dòng gán mã `V002`: Nhập tỷ lệ Quota = **`30`**.
    - Khi MRP chạy quét qua tổng nhu cầu dệt nhuộm là 10.000 mét vải, hệ thống sẽ sử dụng thuật toán chia tách hạn ngạch tự động tạo ra 2 Lệnh sản xuất kế hoạch độc lập: 1 lệnh dập sản lượng 7.000 mét vải bốc phiên bản `V001` gửi xuống phân xưởng A, và 1 lệnh dập sản lượng 3.000 mét vải bốc phiên bản `V002` gửi xuống phân xưởng B, đảm bảo san tải đều cho cả 2 khu vực.

### Bài toán 2: Chặn lỗi trễ hạn do bốc nhầm phiên bản sản xuất đã hết hạn (Effective Date Mismatch)
*   **Thách thức:** Phiên bản sản xuất tủ điện `V001` (sử dụng loại khóa cửa cũ) đã hết hiệu lực vào ngày 15/10/2026. Thay vào đó là phiên bản nâng cấp `V002` (dùng khóa cửa bảo mật mới) bắt đầu hoạt động từ ngày 16/10/2026. Bộ phận mua hàng đã dừng nhập khóa cũ từ lâu. Nếu điều độ viên vô tình lên lệnh sản xuất cho tuần sau (ngày 22/10) nhưng hệ thống vẫn bốc nhầm phiên bản `V001`, xưởng sản xuất sẽ bị dừng máy hoàn toàn vì không có khóa cũ để lắp ráp.
*   **Giải pháp thực tế:**
    - Cấu hình chính xác **`Valid To Date / Disable Date`** của `V001` là **`15/10/2026`** và **`Valid From Date`** của `V002` là **`16/10/2026`**.
    - Khi người dùng dập lệnh sản xuất có ngày chạy thực tế (Start Date) là ngày `22/10/2026`, thuật toán bốc tự động của hệ thống ERP sẽ đối chiếu ngày hiệu lực, tự động bỏ qua `V001` và nạp thẳng cấu hình `V002` vào lệnh sản xuất, ngăn chặn tuyệt đối rủi ro sai lệch vật tư dở dang tại sàn.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Lựa chọn phiên bản tự động

### a. Trên hệ thống Oracle EBS (PL/SQL - Phân hệ OPM Recipe Validity Rules)
Truy vấn danh sách các quy tắc hiệu lực của Recipe, sắp xếp theo thứ tự ưu tiên (`preference`) và dải ngày hiệu lực của Oracle OPM:

```sql
SELECT 
    gr.recipe_no AS "Recipe Code",
    gr.recipe_version AS "Recipe Version",
    -- Decode mục đích sử dụng của Recipe (0: Production, 1: Planning, 2: Costing)
    DECODE(grv.recipe_use, 
           0, 'Production (WIP)', 
           1, 'Planning (MRP)', 
           2, 'Costing (FICO)') AS "Recipe Use",
    -- Điểm ưu tiên (số nhỏ hơn ưu tiên cao hơn)
    grv.preference AS "Preference Level", 
    grv.min_qty AS "Min Lot Size",
    grv.max_qty AS "Max Lot Size",
    grv.start_date AS "Valid From",
    grv.end_date AS "Valid To"
FROM 
    apps.gmd_recipe_validity_rules grv
INNER JOIN apps.gmd_recipes_b gr ON grv.recipe_id = gr.recipe_id
WHERE 
    grv.delete_mark = 0 -- Lọc các quy tắc đang hoạt động
ORDER BY 
    gr.recipe_no, "Recipe Use", grv.preference;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các phiên bản Revision (`PartRev`) của Epicor, hiển thị thứ tự ưu tiên bốc tự động mặc định dựa trên ngày hiệu lực (`EffectiveDate` gần nhất):

```sql
SELECT 
    pr.Company,
    pr.PartNum AS [Part Number],
    pr.RevisionNum AS [Revision ID],
    pr.AltMethod AS [Method ID],
    pr.Approved AS [Is Approved?],
    pr.EffectiveDate AS [Effective Date],
    -- Thuật toán xếp thứ tự ưu tiên bốc tự động mặc định của Epicor (Rank 1 là mặc định hoạt động)
    ROW_NUMBER() OVER (
        PARTITION BY pr.Company, pr.PartNum 
        ORDER BY pr.Approved DESC, pr.EffectiveDate DESC
    ) AS [Active Priority Rank]
FROM 
    Erp.PartRev pr
WHERE 
    pr.Company = 'EP01'
ORDER BY 
    pr.PartNum, [Active Priority Rank];
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn kiểm tra phương thức lựa chọn phiên bản sản xuất tự động (`ALTSL`) gán tại Material Master (MRP 4) của SAP:

```sql
SELECT 
    marc.WERKS AS "Plant",
    marc.MATNR AS "Material Code",
    makt.MAKTX AS "Material Description",
    -- Trường ALTSL lưu phương thức tự động bốc Production Version của SAP S/4HANA
    marc.ALTSL AS "Selection Method Key",
    CASE marc.ALTSL 
        WHEN ' ' THEN 'By Lot Size (Default)'
        WHEN '1' THEN 'By Lot Size'
        WHEN '2' THEN 'By Validity Date / Explosion Date'
        WHEN '3' THEN 'By Manual Selection / Production Version'
        ELSE 'Other'
    END AS "MRP Selection Method Description"
FROM 
    saphanadb.MARC marc
INNER JOIN 
    saphanadb.MAKT makt ON marc.MATNR = makt.MATNR AND makt.SPRAS = 'E' -- Tiếng Anh
WHERE 
    marc.WERKS = '1000'
    AND marc.ALTSL <> ' ' -- Chỉ lọc các mã hàng có thay đổi phương thức lựa chọn
ORDER BY 
    marc.MATNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh sách tất cả các BoM đang hoạt động của cùng một sản phẩm, sắp xếp theo thứ tự ưu tiên Sequence từ nhỏ đến lớn để rà soát quy tắc bốc tự động của Odoo:

```sql
SELECT 
    pt.name AS "Product Name Template",
    bom.code AS "BoM/Recipe Reference",
    -- Số sequence nhỏ hơn sẽ được Odoo ưu tiên bốc trước
    bom.sequence AS "Priority Sequence Number", 
    bom.type AS "BoM Type",
    bom.product_qty AS "Base Qty"
FROM 
    mrp_bom bom
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
WHERE 
    bom.active = true
    -- Chỉ tìm các sản phẩm đang có từ 2 BoM hoạt động trở lên để so sánh mức độ ưu tiên
    AND bom.product_tmpl_id IN (
        SELECT product_tmpl_id FROM mrp_bom 
        WHERE active = true GROUP BY product_tmpl_id HAVING COUNT(id) > 1
    )
ORDER BY 
    pt.name, bom.sequence;

```