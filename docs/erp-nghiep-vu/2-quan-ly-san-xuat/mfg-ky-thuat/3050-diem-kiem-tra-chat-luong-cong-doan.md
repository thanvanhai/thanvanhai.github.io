---
id: 3050-diem-kiem-tra-chat-luong-cong-doan
title: Gắn điểm kiểm tra chất lượng vào công đoạn sản xuất (In-process Inspection Point)
description: Thiết lập dữ liệu gốc chỉ tiêu kỹ thuật, kế hoạch lấy mẫu và gắn điểm kiểm soát chất lượng (IPQC) trực tiếp vào quy trình công nghệ (Routing).
sidebar_label: Kiểm tra chất lượng công đoạn
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/3050-diem-kiem-tra-chat-luong-cong-doan
sidebar_position: 3050
date: 2026-10-15
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, quality-control, ipqc, routing, sql]
---

# 3050 - Kiểm tra chất lượng công đoạn

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập dữ liệu gốc (Master Data Setup)** - cách định nghĩa các chỉ tiêu kỹ thuật, kế hoạch lấy mẫu và gắn điểm kiểm soát chất lượng (Inspection Points) vào công đoạn sản xuất [2]. Đối với quy trình giao dịch thực tế kiểm thử IPQC trên chuyền, ghi nhận kết quả đo lường và xử lý hàng lỗi (Non-conformance), vui lòng tham khảo bài viết **`[4000 - Kiểm tra chất lượng công đoạn và lấy mẫu trên chuyền (In-Process Quality Inspection - IPQC)]`** *(Liên kết sẽ được cập nhật sau khi hoàn thành phân hệ Thực thi sản xuất)*.

---

Hoạt động kiểm soát chất lượng trong nhà máy hiện đại không chỉ diễn ra ở khâu cuối cùng khi nhập kho thành phẩm. Để ngăn ngừa phế phẩm phát sinh hàng loạt, doanh nghiệp bắt buộc phải kiểm soát chất lượng ngay trên dây chuyền (IPQC - In-Process Quality Control). Việc này được thực hiện bằng cách gán các **Điểm kiểm tra chất lượng (Inspection Points / Characteristics)** trực tiếp vào từng công đoạn của Quy trình công nghệ (Routing) [2].

Nếu không thiết lập trước các điểm kiểm soát này, hệ thống MES/WIP sẽ không thể bắt buộc công nhân dừng lại để đo lường thông số kỹ thuật, dẫn đến rủi ro lọt lỗi sang các công đoạn sau. Bài viết này phân tích sâu kiến trúc dữ liệu tích hợp QC - Sản xuất, luồng thiết lập và cách quản lý điểm kiểm tra trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu tích hợp QC - Routing

Để liên kết kiểm soát chất lượng vào sản xuất, hệ thống ERP kết nối: **Công đoạn sản xuất (Operation)** $\rightarrow$ **Kế hoạch kiểm tra (Inspection Plan)** $\rightarrow$ **Chỉ tiêu kỹ thuật chi tiết (Inspection Characteristics)**.

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Sử dụng phân hệ **Oracle Quality**; liên kết các Kế hoạch thu thập dữ liệu (Collection Plans) vào giao dịch dịch chuyển công đoạn (WIP Move). | Liên kết trực tiếp các Kế hoạch kiểm thử (**Inspection Plans**) vào dòng công đoạn sản xuất trên MoM. | Gán trực tiếp các **Chỉ tiêu chất lượng gốc (MIC)** vào từng dòng công đoạn của Routing. | Định nghĩa các **Điểm kiểm soát chất lượng (Quality Points)** liên kết với bước công nghệ của BoM. |
| **Bảng định nghĩa chính (Header)** | **`QA_PLANS`** (Kế hoạch thu thập dữ liệu kiểm thử chất lượng) [2]. | **`Erp.InspPlan`** (Kế hoạch kiểm tra chất lượng thiết bị/sản phẩm) [2]. | **`saphanadb.PLPO`** (Dòng công đoạn Routing) liên kết bảng chỉ tiêu **`saphanadb.PLMK`** [2]. | **`quality.point`** (Điểm kiểm soát chất lượng của phân hệ Quality) [2]. |
| **Bảng chi tiết chỉ tiêu (Lines)** | **`QA_PLAN_CHARS`** (Chi tiết các chỉ tiêu cần đo như độ dày, nhiệt độ) [2]. | **`Erp.InspPlanAttr`** (Các thuộc tính/thông số kỹ thuật cần đo lường) [2]. | **`saphanadb.QPMK`** (Master Inspection Characteristics - MIC / Chỉ tiêu chất lượng gốc) [2]. | Định nghĩa trực tiếp thông số kiểm tra trên form `quality.point` [2]. |
| **Khóa ngoại liên kết công đoạn** | Liên kết động qua bảng quy tắc kích hoạt giao dịch **`QA_PLAN_ASSOCIATION_RULES`** [2]. | `PartOpr.InspPlanID` (Trỏ trực tiếp sang mã kiểm tra của `Erp.InspPlan`) [2]. | `PLMK.PLNNR` và `PLMK.PLNKN` (Ánh xạ trực tiếp chỉ tiêu kỹ thuật vào mã công đoạn) [2]. | `quality.point.operation_id` (Trỏ sang mã công đoạn của `mrp.routing.workcenter`) [2]. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình qua Oracle Quality — Bảng: `QA_PLANS` / `QA_PLAN_CHARS` / `QA_PLAN_ASSOCIATION_RULES`)
Oracle EBS quản lý chất lượng thông qua việc kích hoạt các phiếu thu thập kết quả (Collection Plans) khi công nhân làm giao dịch Move:
1. **Bước 1 (Tạo Collection Plan):** Truy cập `Quality > Setup > Collection Plans`, tạo kế hoạch (ví dụ: `IPQC_WELD`). Gán các chỉ tiêu cần đo tại tab `Specification` (ví dụ: gán chỉ tiêu `Độ dày mối hàn` dạng số, `Ngoại quan mối hàn` dạng Pass/Fail).
2. **Bước 2 (Thiết lập quy tắc kích hoạt - Association Rules):** Bấm nút **`Transactions`** trên form để định nghĩa điểm kích hoạt:
   - `Transaction`: Chọn `WIP Move transaction` (Giao dịch chuyển công đoạn).
   - `Trigger`: Thiết lập điều kiện (ví dụ: kích hoạt khi di chuyển lệnh sản xuất từ công đoạn hàn `Op 20` sang công đoạn mài `Op 30`).
3. **Bước 3 (Bắt buộc nhập):** Tích chọn cờ **`Mandatory = Yes`**. Khi công nhân làm giao dịch chuyển công đoạn trên hệ thống, màn hình Oracle Quality sẽ tự động bật lên (Pop-up) bắt buộc phải nhập kết quả đo lường mới cho phép hoàn thành giao dịch.

### b. Hệ thống Epicor ERP (Cấu hình qua Inspection Plan — Bảng: `Erp.PartOpr` / `Erp.InspPlan`)
Epicor tích hợp trực tiếp kế hoạch kiểm tra chất lượng vào cấu hình kỹ thuật MoM:
1. **Bước 1 (Định nghĩa Inspection Plan):** Vào `Quality Assurance > Setup > Inspection Plan Maintenance`, tạo kế hoạch kiểm tra (ví dụ: `INSP_PLATE`). Khai báo các dải thông số dung sai cho phép (ví dụ: độ dày tấm thép phải từ `1.8mm` đến `2.2mm`).
2. **Bước 2 (Gán vào công đoạn của Part):** Trong màn hình `Engineering Workbench`, tại dòng công đoạn dập tôn (`Opr 10`), người dùng chọn mã kế hoạch kiểm tra tại trường **`Inspection Plan`** (field DB: `PartOpr.InspPlanID`).
3. **Bước 3 (Vận hành MES):** Khi công nhân khai báo hoàn thành số lượng sản xuất của công đoạn dập tôn trên màn hình MES, hệ thống Epicor sẽ bắt buộc hiển thị form nhập liệu kết quả đo lường theo đúng các tiêu chí của `INSP_PLATE`.

### c. Hệ thống SAP S/4HANA (Cấu hình qua Master Inspection Characteristics - MIC — Bảng: `PLPO` / `PLMK` / `QPMK`)
SAP sở hữu cơ chế quản lý chất lượng công đoạn sâu nhất thông qua việc gán trực tiếp các chỉ tiêu đo lường vào Routing:
1. **Bước 1 (Tạo chỉ tiêu chất lượng gốc - MIC):** Dùng T-Code `QS21` để tạo chỉ tiêu (ví dụ: `MIC_THICKNESS` - Đo độ dày vỏ tủ). Tại đây gán dải giá trị dung sai (Lower/Upper Limits - ví dụ: $2.0 \pm 0.1 \text{ mm}$).
2. **Bước 2 (Gán MIC vào Routing):** Trong T-Code `CA02` (Sửa Routing), chọn dòng công đoạn đột dập `VORNR = 0010`. Bấm chọn nút **`Inspection Char.`** (phím tắt trên thanh công cụ) để dẫn vào bảng khai báo chỉ tiêu của công đoạn (field DB: bảng `PLMK`).
3. **Bước 3 (Nhập thông số lấy mẫu):** Gán mã `MIC_THICKNESS` vào bảng lưới, đồng thời nhập tỷ lệ lấy mẫu (Sampling Procedure - ví dụ: cứ sản xuất 100 sản phẩm thì lấy mẫu ngẫu nhiên 5 sản phẩm để đo).

### d. Hệ thống Odoo ERP (Cấu hình qua Quality Control Points — Bảng: `quality.point` / `mrp.routing.workcenter`)
Odoo quản lý tinh gọn bằng việc tạo các điểm kiểm soát chất lượng bao ngoài quy trình sản xuất:
1. **Bước 1 (Tạo Quality Control Point):** Truy cập `Quality > Quality Control > Control Points`, bấm `New`.
2. **Bước 2 (Gán vị trí và công đoạn):** 
   - `Product`: Chọn sản phẩm cần kiểm tra.
   - `Operation`: Chọn công đoạn gán điểm kiểm soát (field DB: `operation_id` - ví dụ chọn bước `Cắt phôi sắt`).
   - `Type`: Chọn loại kiểm tra (ví dụ chọn `Register Measure` - đo kích thước, hoặc `Take a Picture` - chụp ảnh ngoại quan).
3. **Bước 3 (Vận hành):** Khi công nhân chạy Lệnh sản xuất (MO) và mở giao diện tablet vận hành công đoạn Cắt phôi, Odoo sẽ chèn một bước kiểm soát chất lượng bắt buộc. Công nhân phải nhập thông số đo hoặc chụp ảnh xác nhận thì hệ thống mới cho phép bấm nút hoàn thành công đoạn.

---

## 3. Thuật toán xử lý dung sai & Lấy mẫu đo lường (Sampling & Tolerance Logic)

Khi gán điểm kiểm soát chất lượng vào công đoạn, hệ thống ERP sẽ tự động áp dụng thuật toán kiểm tra dải dung sai cho phép để phân loại kết quả:

### Thuật toán kiểm tra dung sai định lượng (Quantitative Tolerance Algorithm):
Giả sử kỹ sư chất lượng thiết lập chỉ tiêu kỹ thuật đo độ dày vỏ tủ điện:
- **Target Value (Định mức tiêu chuẩn):** $2.0 \text{ mm}$
- **Upper Limit (Giới hạn trên cho phép):** $2.1 \text{ mm}$
- **Lower Limit (Giới hạn dưới cho phép):** $1.9 \text{ mm}$

Khi công nhân nhập kết quả kiểm thử thực tế ($V_{actual}$) tại màn hình MES:
- Nếu $1.9 \le V_{actual} \le 2.1$: Hệ thống đánh giá trạng thái **`PASSED / ACCEPT`** (Đạt chất lượng) $\rightarrow$ cho phép chuyển bán thành phẩm sang công đoạn tiếp theo.
- Nếu $V_{actual} < 1.9$ hoặc $V_{actual} > 2.1$: Hệ thống đánh giá trạng thái **`REJECT / REWORK`** (Không đạt) $\rightarrow$ tự động khóa không cho chuyển bước công nghệ dở dang và kích hoạt yêu cầu cách ly hàng lỗi.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Chất lượng công đoạn

### Bài toán 1: Chặn đứng rủi ro sản xuất hàng lỗi hàng loạt bằng cơ chế Mandatory Inspection
*   **Thách thức:** Trong dây chuyền sản xuất PCBA (Mạch điện tử), công đoạn đầu tiên là in kem keo hàn (`Op 10`) lên mạch thô. Nếu máy in kem keo bị lệch mà không phát hiện kịp thời, toàn bộ 500 bo mạch chạy qua các trạm gắp chíp tiếp theo sẽ bị hỏng hàng loạt, gây thiệt hại hàng trăm triệu đồng chi phí linh kiện.
*   **Giải pháp thực tế:**
    - Thiết lập một điểm kiểm soát chất lượng bắt buộc (**Mandatory IPQC Point**) ngay sau công đoạn `Op 10`.
    - Trên **SAP S/4HANA**, cấu hình mã kiểm soát công đoạn `Op 10` với thuộc tính bắt buộc phải xác nhận kết quả kiểm tra chất lượng (MIC) mới được phép thực hiện xác nhận sản lượng công đoạn tiếp theo (T-Code `CO11N`).
    - Khi đó, cứ mỗi khi hoàn thành 50 bo mạch, công nhân bắt buộc phải dừng máy để kiểm tra độ phủ kem keo dưới kính hiển vi và nhập kết quả vào hệ thống. Nếu phát hiện lỗi và nhập kết quả "Fail", hệ thống lập tức khóa lệnh sản xuất, ngăn chặn tuyệt đối lỗi lọt sang các công đoạn sau.

### Bài toán 2: Thiết lập Kế hoạch lấy mẫu ngẫu nhiên theo tỷ lệ (Statistical Sampling Plan)
*   **Thách thức:** Nhà máy dập đinh ốc với sản lượng 50.000 sản phẩm/ngày. Nhân viên QC không thể đo kích thước của từng con ốc được vì quá tốn thời gian. Nhà máy muốn thiết lập quy tắc lấy mẫu ngẫu nhiên: cứ 1.000 sản phẩm sản xuất ra thì QC chỉ cần lấy ngẫu nhiên 10 sản phẩm để đo.
*   **Giải pháp thực tế:**
    - Trong phân hệ Quality của **Oracle EBS**, tạo một **Sampling Procedure (Thủ tục lấy mẫu)** với quy tắc: *Lot Size = 1000*, *Sample Size = 10*, *Acceptance Number = 0* (chấp nhận cả lô nếu 10 mẫu đều đạt), *Rejection Number = 1* (loại bỏ cả lô nếu phát hiện 1 mẫu lỗi).
    - Gán thủ tục lấy mẫu này vào Collection Plan `QC_SCREW` tại công đoạn Dập.
    - Khi công nhân báo cáo hoàn thành sản lượng trên MES, hệ thống sẽ tự động tính toán dựa trên thuật toán lấy mẫu để hiển thị số lượng mẫu cần đo (Sample Qty) tương ứng trên màn hình của QC, giúp chuẩn hóa quy trình kiểm thử thống kê (SQC).

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Gắn điểm kiểm tra chất lượng

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh mục các Kế hoạch lấy mẫu kiểm thử chất lượng (Collection Plans) và chi tiết các chỉ tiêu kỹ thuật cần đo lường gán kèm:

```sql
SELECT 
    qp.name AS "Collection Plan Name",
    qp.description AS "Plan Description",
    qpc.prompt_sequence AS "Seq",
    qpc.char_name AS "Inspection Parameter",
    -- Giải mã kiểu dữ liệu đo lường (Character, Number, Date)
    DECODE(qpc.datatype, 
           1, 'Character', 
           2, 'Number', 
           3, 'Date', 
           qpc.datatype) AS "Data Type",
    DECODE(qpc.mandatory_flag, 1, 'Yes (Mandatory)', 2, 'Optional') AS "Is Mandatory?"
FROM 
    apps.qa_plans qp
INNER JOIN apps.qa_plan_chars qpc ON qp.plan_id = qpc.plan_id
WHERE 
    qp.plan_type_code = 'WIP' -- Chỉ lọc các kế hoạch thiết kế cho sàn sản xuất
ORDER BY 
    qp.name, qpc.prompt_sequence;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các công đoạn sản xuất (`PartOpr`) đang được gán kế hoạch kiểm tra chất lượng (`InspPlanID`) chi tiết của Epicor:

```sql
SELECT 
    po.Company,
    po.PartNum AS [Part Number],
    po.RevisionNum AS [Revision ID],
    po.OprSeq AS [Op Seq],
    po.OpCode AS [Operation Code],
    po.InspPlanID AS [Assigned Inspection Plan ID], -- Mã liên kết kế hoạch QC
    ip.Description AS [Inspection Plan Description],
    po.Active AS [Is Operation Active?]
FROM 
    Erp.PartOpr po
INNER JOIN 
    Erp.InspPlan ip ON po.Company = ip.Company AND po.InspPlanID = ip.InspPlanID
WHERE 
    po.Company = 'EP01'
ORDER BY 
    po.PartNum, po.OprSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn toàn bộ danh sách các Chỉ tiêu chất lượng gốc (MIC) được gán trực tiếp vào các bước công đoạn sản xuất trên Routing của SAP:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Parent Material Code",
    o.VORNR AS "Operation Seq",
    o.LTXA1 AS "Operation Description",
    cha.MERKNR AS "Inspection Char No",
    cha.VERWM AS "Master Inspection Char (MIC)", -- Mã chỉ tiêu QC gốc của SAP
    cha.KURZTEXT AS "Characteristic Short Text",
    -- Kiểm tra xem chỉ tiêu này có bắt buộc phải nhập số liệu không
    CASE WHEN cha.STEUERUP IN ('01', '02') THEN 'Quantitative / Numerical' ELSE 'Qualitative (Pass/Fail)' END AS "Measurement Type"
FROM 
    saphanadb.MAPL m
INNER JOIN saphanadb.PLKO h ON m.PLNTY = h.PLNTY AND m.PLNNR = h.PLNNR
INNER JOIN saphanadb.PLPO o ON h.PLNNR = o.PLNNR AND h.PLNTY = o.PLNTY
-- Bảng PLMK lưu trữ các dòng chỉ tiêu kỹ thuật gán cho công đoạn Routing
INNER JOIN saphanadb.PLMK cha ON h.PLNNR = cha.PLNNR AND o.PLNKN = cha.PLNKN 
WHERE 
    m.WERKS = '1000'
    AND o.LOEKZ = ' '
    AND cha.LOEKZ = ' ' -- Loại bỏ các chỉ tiêu đã bị xóa logic
ORDER BY 
    m.MATNR, o.VORNR, cha.MERKNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh mục Điểm kiểm soát chất lượng (Quality Points) liên kết trực tiếp với các bước công đoạn sản xuất trên cấu trúc định mức BoM của Odoo:

```sql
SELECT 
    qp.name AS "Quality Control Point ID",
    qp.title AS "Instruction Title",
    pt.name AS "Product BoM Parent",
    rwc.name AS "Assigned Operation Name",
    -- Giải mã kiểu kiểm thử của Odoo (chụp ảnh, đo đạc, hay pass/fail)
    CASE qp.test_type
        WHEN 'picture' THEN 'Take a Picture'
        WHEN 'measure' THEN 'Register Quantitative Measure'
        WHEN 'pass_fail' THEN 'Pass / Fail Attribute Check'
    END AS "Test Type",
    qp.active AS "Is Active?"
FROM 
    quality_point qp
INNER JOIN mrp_routing_workcenter rwc ON qp.operation_id = rwc.id
INNER JOIN mrp_bom bom ON rwc.bom_id = bom.id
INNER JOIN product_template pt ON bom.product_tmpl_id = pt.id
WHERE 
    qp.active = true
ORDER BY 
    pt.name, rwc.sequence;
