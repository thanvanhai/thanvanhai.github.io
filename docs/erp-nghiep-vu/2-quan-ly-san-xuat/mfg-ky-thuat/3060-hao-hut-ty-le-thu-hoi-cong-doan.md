---
id: 3060-hao-hut-ty-le-thu-hoi-cong-doan
title: Quản lý hao hụt và tỷ lệ thu hồi theo từng công đoạn (Operation Scrap / Yield)
description: Thiết lập và quản lý tỷ lệ thu hồi kế hoạch (Planned Yield) và hao hụt (Operation Scrap) theo từng bước công nghệ trên Quy trình (Routing).
sidebar_label: Hao hụt theo công đoạn
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/3060-hao-hut-ty-le-thu-hoi-cong-doan
sidebar_position: 3060
date: 2026-10-18
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, operation-scrap, yield, routing, sql]
---

# 3060 - Hao hụt theo công đoạn

> **Lưu ý ranh giới nghiệp vụ:** Bài viết này tập trung vào khía cạnh **Kỹ thuật & Thiết lập định mức kế hoạch (Planned Operation Yield & Scrap)** trên Routing - cách cấu hình tỷ lệ thu hồi hao hụt lý thuyết và thuật toán tích lũy năng lực MRP. Đối với quy trình giao dịch ghi nhận thực tế sản lượng phế phẩm phát sinh tại sàn (MES Scrap Reporting) và phân tích chênh lệch phế liệu thực tế vs. định mức, vui lòng tham khảo bài viết **`[3010 - Ghi nhận sản lượng hoàn thành và phế phẩm theo từng công đoạn (Yield & Scrap Reporting with Reason Codes)]`** *(Liên kết sẽ được cập nhật sau khi hoàn thành phân hệ Thực thi sản xuất)*.

---

Trong sản xuất liên tục hoặc chế tạo cơ khí nhiều công đoạn, hao hụt nguyên vật liệu không chỉ diễn ra một lần ở đầu quy trình. Khi đi qua từng bước chạy máy, sản phẩm dở dang luôn chịu rủi ro phế phẩm tích lũy theo từng công đoạn. Ví dụ: qua công đoạn Đột dập lỗi 5% sản phẩm, qua tiếp công đoạn Sơn tĩnh điện lại lỗi tiếp 2%. 

Nếu hệ thống ERP không tính toán **Tỷ lệ thu hồi tích lũy (Cumulative Yield)** theo từng bước công nghệ, MRP sẽ không biết phải bắt đầu đưa bao nhiêu phôi vào máy ở công đoạn đầu tiên để thu về đủ sản lượng thành phẩm yêu cầu ở công đoạn cuối cùng. Bài viết này phân tích sâu kiến trúc dữ liệu, thuật toán tích lũy và cách cấu hình hao hụt công đoạn trên **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc dữ liệu quản lý hao hụt công đoạn của các hãng ERP được cấu hình trực tiếp trên các dòng của Quy trình công nghệ (Routing Lines):

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất kiến trúc** | Định nghĩa tỷ lệ thu hồi dưới dạng số thập phân trực tiếp trên từng dòng công đoạn Routing. | Định nghĩa tỷ lệ phần trăm dập đạt (Yield %) ngay trên dòng công đoạn của cấu trúc MoM. | Cấu hình tỷ lệ hao hụt công đoạn dưới dạng % phế liệu (Operation Scrap) trên dòng công đoạn. | Không có tham số tính toán hao hụt lũy kế tự động trên công đoạn (Theo dõi gián tiếp qua OEE). |
| **Bảng dữ liệu gốc (Table)** | **`BOM_OPERATION_SEQUENCES`** (Bảng quản lý chi tiết công đoạn Routing). | **`Erp.PartOpr`** (Bảng quản lý chi tiết công đoạn MoM). | **`saphanadb.PLPO`** (Chi tiết các công đoạn sản xuất). | **`mrp.workcenter`** (Theo dõi năng lực và tỷ lệ hư hỏng của máy). |
| **Trường cấu hình (Field)** | `yield` (Hệ số thu hồi dưới dạng số thập phân, ví dụ: `0.95` tương đương đạt 95%). | `Yield` (Hệ số thu hồi dưới dạng tỷ lệ %, ví dụ: `95.00` tương đương đạt 95%). | `ASCHW` (Vorgangsausschuss - Tỷ lệ phần trăm hao hụt công đoạn, ví dụ: `5.00` tương đương phế phẩm 5%). | `oee_target` (Tính gián tiếp thông qua hao phí hiệu suất và phế phẩm mục tiêu). |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Cấu hình qua Operation Yield — Bảng: `BOM_OPERATION_SEQUENCES`)
Oracle EBS quản lý hao hụt công đoạn theo cơ chế Hệ số thu hồi (Yield):
1. **Bước 1 (Mở Routing):** Truy cập `BOM > Routings > Routings`, tìm sản phẩm cha.
2. **Bước 2 (Thiết lập Yield từng bước):** Tại màn hình danh sách công đoạn, người dùng chuyển sang tab `Page 2` hoặc kéo thanh cuộn ngang để tìm cột **`Yield`** (field DB: `yield`).
3. **Bước 3 (Nhập tham số):** Nhập hệ số thu hồi kế hoạch (ví dụ: công đoạn cắt tôn `Op 10` nhập `0.95` tương đương dập đạt 95%; công đoạn chấn `Op 20` nhập `0.98` tương đương đạt 98%). Hệ thống tự động khóa và tính toán lùi khi có lệnh sản xuất.

### b. Hệ thống Epicor ERP (Cấu hình qua Operation Yield % — Bảng: `Erp.PartOpr`)
Epicor hiển thị trực quan thông số phần trăm thu hồi ngay trên cây MoM:
1. **Bước 1 (Mở Engineering Workbench):** Tìm sản phẩm cha trong Workbench, chọn dòng công đoạn sản xuất (ví dụ: `Opr 10`).
2. **Bước 2 (Nhập tỷ lệ dập đạt):** Tại tab `Detail`, người dùng nhập thông số vào trường **`Yield %`** (field DB: `PartOpr.Yield`). Ví dụ nhập `95.00` (đại diện cho tỷ lệ đạt 95%).
3. **Bước 3 (Vận hành):** Khi dập Job sản xuất, Epicor APS Engine sẽ tự động nhân lũy kế ngược để tăng số lượng phôi yêu cầu ở các công đoạn trước.

### c. Hệ thống SAP S/4HANA (Cấu hình qua Operation Scrap — Bảng: `saphanadb.PLPO`)
SAP quản lý theo hướng tỷ lệ phế phẩm (Scrap) ngược với triết lý Yield của Oracle/Epicor:
1. **Bước 1 (Mở Routing):** Trong T-Code `CA02` (Sửa Routing), chọn dòng công đoạn dập mác `VORNR = 0010`.
2. **Bước 2 (Mở chi tiết và nhập phế liệu):** Bấm đúp vào dòng công đoạn, kéo xuống mục *Interoperation Times / Scrap*. Nhập thông số tại trường **`Operation Scrap`** (field DB: `ASCHW`). Ví dụ nhập `5.00` (đại diện cho dự kiến phát sinh 5% phế phẩm tại công đoạn này).
3. **Bước 3 (Vận hành):** Khi chạy MRP và tạo đơn sản xuất, SAP tự tính lượng hao hụt tích lũy cho toàn bộ chuỗi công đoạn.

### d. Hệ thống Odoo ERP (Quản lý qua OEE và Yield trên dòng BoM — Bảng: `mrp.workcenter`)
Odoo tối giản hóa bằng việc quản trị chất lượng thông qua bộ đo lường hiệu suất thiết bị tổng thể (OEE):
*   Hệ thống không có trường nhập tỷ lệ phế phẩm độc lập cho từng công đoạn trên BoM. Tuy nhiên, hiệu suất vận hành của máy móc và tỷ lệ lỗi mục tiêu được hạch toán gián tiếp thông qua trường **`OEE Target`** (field DB: `oee_target` - ví dụ: cấu hình OEE mục tiêu = `85%`, hệ thống tự hiểu 15% còn lại bao gồm cả hao hụt dừng máy và phế phẩm công đoạn).

---

## 3. Thuật toán Lập kế hoạch Tích lũy ngược (Cumulative Yield Algorithm)

Khi bộ phận kế hoạch chạy MRP hoặc APS cho một lệnh sản xuất để thu về sản lượng thành phẩm đạt chất lượng cuối cùng là $Q_{target}$, hệ thống ERP bắt buộc phải chạy thuật toán **Tính toán lũy kế ngược (Backward Cumulative Calculation)** để xác định số lượng phôi đầu vào cho từng công đoạn.

### Công thức tính Hệ số thu hồi lũy kế (Cumulative Yield):
$$\text{Cumulative Yield} = \text{Yield}_{Op1} \times \text{Yield}_{Op2} \times \dots \times \text{Yield}_{OpN}$$

### Công thức tính Số lượng phôi đầu vào yêu cầu cho Công đoạn $X$ ($Q_{start}$):
$$Q_{start} \text{ (Op } X\text{)} = \frac{Q_{target}}{\text{Yield}_{OpX} \times \text{Yield}_{OpX+1} \times \dots \times \text{Yield}_{OpN}}$$

### Ví dụ áp dụng thực tế:
Nhà máy cần hoàn thành **100 chiếc vỏ tủ điện** chất lượng đạt chuẩn ở công đoạn cuối cùng.
Quy trình công nghệ gồm 3 công đoạn với tỷ lệ đạt kế hoạch:
- `Op 10` (Đột dập): Yield = `95%` (`0.95`).
- `Op 20` (Uốn gập): Yield = `98%` (`0.98`).
- `Op 30` (Sơn phủ): Yield = `97%` (`0.97`).

**Hệ thống lập lịch sản xuất (APS Engine) chạy thuật toán tích lũy ngược:**
1. Tính Hệ số thu hồi lũy kế của toàn bộ quy trình:
   $$\text{Cumulative Yield} = 0.95 \times 0.98 \times 0.97 \approx 0.903 \text{ (tương đương đạt 90.3\%)}$$
2. Tính số lượng phôi thép cần đưa vào máy ở công đoạn đầu tiên (`Op 10`):
   $$Q_{start} \text{ (Op 10)} = \frac{100 \text{ thành phẩm}}{0.903} \approx 111 \text{ tấm phôi}$$
3. Tính sản lượng dở dang cần chuyển giao sang công đoạn uốn gập (`Op 20`):
   $$Q_{start} \text{ (Op 20)} = \frac{100}{0.98 \times 0.97} \approx 105 \text{ tấm dở dang}$$

> **Ý nghĩa thực tế:** Thuật toán giúp điều độ viên tự động cấp phát đúng **111 tấm phôi thép** cho công đoạn dập đầu tiên. Tránh tình trạng chỉ cấp đúng 100 tấm, đến khi qua 3 công đoạn lỗi mất 10 sản phẩm, chỉ thu được 90 tủ điện thành phẩm dẫn đến thiếu hàng giao cho khách.

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Hao hụt công đoạn

### Bài toán 1: Đồng bộ hóa định mức cấp phát vật tư bổ sung giữa kỳ (Component Yield Link)
*   **Thách thức:** Tại công đoạn lắp ráp mạch điện tử PCBA (`Op 20`), công nhân lắp chip tụ điện lên mạch. Công đoạn này có tỷ lệ hỏng móp chip là 2%. Bo mạch thô rất đắt tiền nên hỏng bo mạch nào QC sẽ loại bỏ bo mạch đó ngay tại chỗ. Làm sao để hệ thống tự tính và yêu cầu cấp phát dư thêm 2% lượng chíp tụ điện cho riêng công đoạn này?
*   **Giải pháp thực tế:**
    - Trên **Oracle EBS**, tại dòng nguyên vật liệu chip tụ điện trong BOM, người dùng gán liên kết với `Op Seq = 20`.
    - Hệ thống ERP khi chạy MRP sẽ tự động nhân sản lượng của Lệnh sản xuất với tỷ lệ Yield của công đoạn 20 để tự động nâng số lượng chíp tụ điện cần cấp phát lên 2%, đảm bảo công nhân có sẵn chíp sơ cua để bù đắp lượng hỏng dập ngay tại chuyền.

### Bài toán 2: Phân tích chênh lệch giá vốn phế phẩm kế hoạch và thực tế (Scrap Variance)
*   **Thách thức:** Phòng kế hoạch đặt định mức hao hụt công đoạn dập là 5% (Planned Scrap). Nhưng tháng này xưởng tuyển nhiều công nhân mới tay nghề yếu, làm hỏng vỏ tủ dập lên tới 12% (Actual Scrap). Làm sao để kế toán giá thành hạch toán và phân tích rõ khoản thiệt hại do tay nghề yếu này?
*   **Giải pháp thực tế:**
    - Trong **SAP S/4HANA**, hệ thống kế toán chi phí sản xuất dở dang (WIP Costing) tự động tách biệt chênh lệch giá vốn thành các nhóm (Variance Categories).
    - Lượng hao hụt 5% kế hoạch nằm trong giá thành định mức tiêu chuẩn của sản phẩm.
    - Lượng hao hụt dôi dư 7% thực tế phát sinh (12% - 5%) sẽ được hệ thống bóc tách riêng thành **Scrap Variance (Chênh lệch phế phẩm)** và định khoản trực tiếp vào tài khoản chi phí lãng phí sản xuất trong kỳ kế toán, giúp ban giám đốc nhìn rõ hao phí do vận hành yếu kém để cải tiến.

---

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Hao hụt công đoạn

### a. Trên hệ thống Oracle EBS (PL/SQL)
Truy vấn danh sách các công đoạn sản xuất trên Routing đang được cấu hình hệ số thu hồi kế hoạch (Yield < 1.00) để kiểm soát tham số MRP:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Assembly Item",
    msib.description AS "Assembly Description",
    bos.operation_seq_num AS "Op Seq",
    bos.operation_description AS "Op Description",
    -- Trường yield lưu hệ số thu hồi công đoạn dưới dạng số thập phân
    bos.yield AS "Operation Yield (Decimal)", -- ví dụ: 0.95 (Hao hụt 5%)
    ROUND((1 - bos.yield) * 100, 2) AS "Planned Scrap (%)"
FROM 
    apps.bom_operation_sequences bos
INNER JOIN apps.bom_operational_routings bor ON bos.routing_sequence_id = bor.routing_sequence_id
INNER JOIN apps.mtl_system_items_b msib ON bor.assembly_item_id = msib.inventory_item_id AND bor.organization_id = msib.organization_id
INNER JOIN apps.org_organization_definitions ood ON bor.organization_id = ood.organization_id
WHERE 
    ood.organization_code = 'V1'
    -- Lọc các công đoạn có cấu hình tỷ lệ đạt nhỏ hơn 100% (Yield < 1)
    AND bos.yield < 1 
    AND (bos.disable_date IS NULL OR bos.disable_date > SYSDATE)
ORDER BY 
    msib.segment1, bos.operation_seq_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server)
Truy vấn danh sách các công đoạn sản xuất trên cấu trúc MoM của Epicor đang gán tỷ lệ đạt nhỏ hơn 100%:

```sql
SELECT 
    po.Company,
    po.PartNum AS [Part Number],
    p.Description AS [Part Description],
    po.RevisionNum AS [Revision ID],
    po.OprSeq AS [Op Seq],
    po.OpCode AS [Operation Code],
    -- Trường Yield trong PartOpr của Epicor lưu tỷ lệ dập đạt dạng %
    po.Yield AS [Operation Yield (%)], -- ví dụ: 95.00
    (100.00 - po.Yield) AS [Planned Scrap (%)]
FROM 
    Erp.PartOpr po
INNER JOIN 
    Erp.Part p ON po.Company = p.Company AND po.PartNum = p.PartNum
WHERE 
    po.Company = 'EP01'
    -- Lọc các công đoạn có cấu hình hao hụt (Yield < 100%)
    AND po.Yield < 100.00
ORDER BY 
    po.PartNum, po.OprSeq;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn các công đoạn trên Routing có cấu hình tỷ lệ phế phẩm kế hoạch (Operation Scrap `ASCHW` > 0) trong hệ thống SAP S/4HANA:

```sql
SELECT 
    m.WERKS AS "Plant",
    m.MATNR AS "Material Code",
    o.VORNR AS "Operation Seq",
    o.LTXA1 AS "Operation Description",
    wc.ARBPL AS "Work Center Code",
    -- Trường ASCHW lưu tỷ lệ phế phẩm công đoạn (Vorgangsausschuss)
    o.ASCHW AS "Operation Scrap (%)" 
FROM 
    saphanadb.MAPL m
INNER JOIN saphanadb.PLKO h ON m.PLNTY = h.PLNTY AND m.PLNNR = h.PLNNR
INNER JOIN saphanadb.PLPO o ON h.PLNNR = o.PLNNR AND h.PLNTY = o.PLNTY
LEFT JOIN saphanadb.CRHD wc ON o.ARBID = wc.OBJID -- Liên kết lấy mã Work Center
WHERE 
    m.WERKS = '1000'
    AND o.ASCHW > 0 -- Chỉ lấy công đoạn có cấu hình phế phẩm
    AND o.LOEKZ = ' '
ORDER BY 
    m.MATNR, o.VORNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Do Odoo không có trường cấu hình tỷ lệ phế phẩm trên từng công đoạn, câu lệnh dưới đây thực hiện truy vấn hiệu suất OEE mục tiêu cấu hình tại từng Work Center để kế toán rà soát mức hao phí kế hoạch:

```sql
SELECT 
    wc.code AS "Work Center Code",
    wc.name AS "Work Center Name",
    wc.time_efficiency AS "Time Efficiency (%)",
    wc.oee_target AS "Target OEE (%)",
    -- Hao phí năng lực kế hoạch (gồm cả rủi ro phế phẩm máy) = 100 - OEE Target
    (100 - wc.oee_target) AS "Target Capacity Loss (%)"
FROM 
    mrp_workcenter wc
WHERE 
    wc.active = true
    AND wc.oee_target < 100 -- Chỉ lấy các Work Center có dự kiến hao phí năng lực
ORDER BY 
    wc.code;