---
id: phuong-phap-tinh-gia-fifo-lifo-average-standard
title: Các phương pháp Tính giá hàng Tồn kho 
description: Standard Cost, Average, FIFO, LIFO và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Phương pháp Tính giá
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/phuong-phap-tinh-gia
sidebar_position: 5000
date: 2026-08-05
tags: [erp, inventory, costing, standard-cost, average-cost, fifo, lifo, cost-elements, sql-audit, oracle-ebs, epicor]
---

# 5000 Các phương pháp Tính giá hàng Tồn kho 

> Standard Cost, Average, FIFO, LIFO và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong hệ thống ERP, việc quản lý số lượng tồn kho vật lý (On-hand Qty) mới chỉ là một nửa chặng đường. Nửa chặng đường còn lại quyết định sự sống còn của phòng kế toán tài chính là **Định giá hàng tồn kho (Inventory Costing / Valuation)**.

Hệ thống ERP sử dụng các phương pháp tính giá vốn khác nhau để xác định xem mỗi khi hàng hóa được xuất kho (để bán hoặc đưa vào sản xuất), giá trị tiền tệ rút ra khỏi kho và chuyển vào Giá vốn hàng bán (COGS) hoặc Chi phí dở dang (WIP) sẽ là bao nhiêu.

> **Phạm vi bài viết:** Bài này tập trung vào **cơ chế mà phân hệ Kho (INV) dùng để chọn lô/xác định đơn giá khi xuất kho** (cost layers, backdated transactions, đối chiếu tồn kho vs đơn giá). Phần **cách tính ra** đơn giá tiêu chuẩn/thực tế của sản phẩm (Cost Rollup, cấu thành yếu tố chi phí, phân tích chênh lệch giá thành sản xuất) thuộc phạm vi phân hệ **Kế toán Giá thành (FIN-Cost)** — xem link ở cuối bài.

---

## 1. Giải mã 4 phương pháp tính giá tồn kho cốt lõi

### A. Giá thành tiêu chuẩn (Standard Costing)
Doanh nghiệp tự định nghĩa trước một đơn giá cố định (Budgeted Cost) cho vật tư/thành phẩm dựa trên kế hoạch đầu năm.
* **Đặc tính:** Giá trị tồn kho và đơn giá xuất kho luôn cố định theo giá tiêu chuẩn suốt cả năm. 
* **Hạch toán:** Mọi chênh lệch giữa giá mua thực tế (PO Price), giá sản xuất thực tế (Actual WIP) so với giá tiêu chuẩn sẽ được đẩy thẳng vào các tài khoản chênh lệch (Variance) như `PPV` (Purchase Price Variance) hay `Job Variance` tại thời điểm phát sinh giao dịch.

### B. Giá bình quân (Weighted / Moving Average Costing)
Đơn giá của vật tư được tính toán lại sau mỗi lần nhập kho mua hàng (`PO Receipt`) mới theo công thức:
$$\text{Đơn giá bình quân mới} = \frac{\text{Giá trị hàng tồn hiện tại} + \text{Giá trị lô hàng mới nhập}}{\text{Số lượng tồn hiện tại} + \text{Số lượng lô hàng mới nhập}}$$
* **Đặc tính:** Đơn giá xuất kho biến động liên tục theo giá thị trường. Phù hợp với các doanh nghiệp thương mại hoặc sản xuất có giá vật tư biến động mạnh.

### C. Nhập trước - Xuất trước (FIFO - First In, First Out)
Hệ thống ERP quản lý tồn kho theo từng "Lớp giá" (Cost Layers) tương ứng với từng lô hàng nhập kho theo thời gian. Khi xuất kho, ERP tự động rút hàng từ lớp giá cổ nhất trước, rồi mới gối đầu sang lớp giá tiếp theo.
* **Đặc tính:** Đảm bảo giá trị hàng tồn kho trên Báo cáo tài chính phản ánh sát nhất với giá trị thị trường hiện tại.

### D. Nhập sau - Xuất trước (LIFO - Last In, First Out)
Hệ thống rút hàng từ lớp giá mới nhất vừa nhập kho để tính giá vốn xuất trước.
* **Đặc tính:** Hiện tại phương pháp này đã bị **nghiêm cấm** bởi hầu hết các chuẩn mực kế toán quốc tế (IFRS) và Việt Nam (VAS 02) vì nó cho phép doanh nghiệp can thiệp giảm lợi nhuận ảo để trốn thuế. Tuy nhiên, một số doanh nghiệp Mỹ áp dụng chuẩn US-GAAP hoặc các hệ thống ERP đời cũ vẫn duy trì tính năng này.

---

## 2. Đơn giá tồn kho được cấu thành từ đâu? (tóm tắt)

Đơn giá của một mặt hàng trên ERP hiếm khi chỉ là một con số đơn lẻ — các hệ thống chuẩn quốc tế (Oracle EBS, Epicor, SAP) thường bóc tách đơn giá thành nhiều yếu tố chi phí (Cost Elements) như: chi phí nguyên vật liệu, nhân công trực tiếp, sản xuất chung, gia công ngoài, và chi phí quản lý/vận chuyển vật tư. Đây là lý do vì sao khi kiểm tra một mã hàng bị lỗi giá, kế toán kho cần biết đơn giá đó được **cộng dồn từ những cấu phần nào**, thay vì chỉ nhìn một con số tổng.

Việc tính toán chi tiết từng yếu tố này (Cost Rollup, phân bổ Overhead, xử lý chi phí gia công ngoài...) thuộc quy trình của phân hệ Giá thành — xem chi tiết tại bài **[Cấu hình thành phần chi phí sản xuất (COST-1000)]()** và **[Standard Cost Rollup (COST-1010)]()**.

---

## 3. Hai "Bẫy" thực chiến phá hủy hệ thống Giá thành ERP

### ❌ Bẫy 1: Thảm họa bỏ trống giá tiêu chuẩn (Standard Cost = 0 USD) — góc nhìn từ Kho

**Tình huống:** Doanh nghiệp áp dụng phương pháp giá Standard Cost. Khi phòng mua hàng tạo mới một mã hàng hóa (Item/Part) trên hệ thống, kế toán chưa kịp chạy quy trình tính toán và áp giá tiêu chuẩn (Cost Rollup & Cost Posting — xem quy trình chi tiết tại **COST-1010**). Mã hàng này được lưu trên ERP với đơn giá Standard Cost bằng **0 USD**.

* **Hậu quả nhìn từ phía kho:**
  1. Khi xuất kho vật tư này đi sản xuất hoặc bán hàng: giao dịch xuất kho vẫn chạy bình thường về mặt số lượng, nhưng trị giá xuất kho ghi nhận bằng 0 USD — kho "cho không" giá trị mà không hề có cảnh báo.
  2. Giá trị tồn kho trên sổ chi tiết kho (Inventory Ledger) bị lệch so với thực tế, khiến báo cáo tồn kho theo giá trị (không chỉ theo số lượng) sai ngay từ gốc.
  3. Đến cuối kỳ, kế toán kho không thể đối chiếu nổi giá trị tồn kho với Sổ cái (GL), dù số lượng vật lý hoàn toàn khớp.

> Nguyên nhân gốc (quy trình Cost Rollup bị bỏ sót, ai chịu trách nhiệm duyệt giá mới) và cách xử lý hậu quả vào WIP/thành phẩm thuộc phạm vi phân hệ Giá thành — xem **[Standard Cost Rollup, Marking & Releasing (COST-1010)]()**.

---

### ❌ Bẫy 2: Giao dịch ngược thời gian (Backdated Entries) phá hủy lớp giá của FIFO và Average Costing

**Tình huống:** Hôm nay là ngày 15/08. Do thủ kho quên nhập phiếu, họ thực hiện tạo phiếu nhập kho mua hàng lùi ngày giao dịch về ngày 01/08 (Backdated Transaction).

* **Thảm họa tính giá:** 
  * Đối với **Average Costing**: Hệ thống ERP buộc phải chạy lại toàn bộ thuật toán tính giá bình quân của tất cả các ngày từ 01/08 đến 15/08 và cập nhật lại đơn giá xuất kho của hàng loạt giao dịch xuất kho đã xảy ra trong khoảng thời gian này. Hệ thống sẽ bị quá tải (Performance drops) và kế toán kho sẽ hoang mang vì "tại sao giá vốn xuất kho hôm qua tự nhiên hôm nay bị thay đổi?".
  * Đối với **FIFO Costing**: Việc chèn một giao dịch nhập kho vào quá khứ làm xáo trộn hoàn toàn các lớp giá cũ đã được phân bổ trước đó, dễ dẫn đến hiện tượng xuất hiện lớp giá bị âm hoặc lớp giá rỗng (Zero-cost Layers).

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát hệ thống Tính giá vốn

Định kỳ trước khi chạy khóa sổ đóng kỳ kế toán kho (Period Close), bạn cần quét 2 câu lệnh SQL dưới đây để phát hiện các lỗi định giá nghiêm trọng:

---

### ❌ SQL Audit 1: Phát hiện các vật tư cấu hình Standard Cost bị bỏ trống giá thành (Standard Cost = 0 USD)
Tìm toàn bộ các mã hàng hóa đang chạy phương pháp tính giá tiêu chuẩn (`Standard Cost`) nhưng tổng đơn giá tiêu chuẩn trên hệ thống đang bằng 0 USD.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartCost` & `PartPlant`):
```sql
SELECT 
    p.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả],
    p.ClassID AS [Nhóm hàng],
    pp.CostMethod AS [Phương pháp giá],
    pc.StdMaterial AS [Giá vật tư],
    pc.StdLabor AS [Giá nhân công],
    pc.StdBurden AS [Giá sx chung],
    (pc.StdMaterial + pc.StdLabor + pc.StdBurden) AS [Tổng giá tiêu chuẩn]
FROM Erp.Part p
INNER JOIN Erp.PartCost pc 
    ON p.Company = pc.Company AND p.PartNum = pc.PartNum
INNER JOIN Erp.PartPlant pp 
    ON p.Company = pp.Company AND p.PartNum = pp.PartNum
WHERE pp.CostMethod = 'S'                          -- 'S' là phương pháp tính giá Standard Cost
  AND (pc.StdMaterial = 0 AND pc.StdLabor = 0 AND pc.StdBurden = 0); -- Lỗi: Bằng 0 tuyệt đối
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `CST_ITEM_COSTS`):
Trong Oracle EBS, giá thành tiêu chuẩn thực tế đang chạy được lưu tại `cost_type_id = 1` (Frozen Cost).
```sql
SELECT 
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    cic.cost_type_id,
    cic.material_cost,
    cic.resource_cost,
    cic.overhead_cost,
    cic.item_cost AS total_standard_cost            -- Tổng đơn giá tiêu chuẩn
FROM cst_item_costs cic
INNER JOIN mtl_system_items_b msi 
    ON cic.inventory_item_id = msi.inventory_item_id AND cic.organization_id = msi.organization_id
WHERE cic.cost_type_id = 1                          -- Cost Type 1: Frozen (Standard Cost thực tế)
  AND cic.item_cost = 0;                            -- Lỗi: Giá thành tiêu chuẩn bằng 0
```

---

### ❌ SQL Audit 2: Phát hiện vật tư chạy Average/FIFO bị âm hoặc bằng 0 đơn giá trong khi vẫn còn hàng
Tìm các mã hàng chạy phương pháp giá bình quân (`Average`) hoặc `FIFO` đang có đơn giá kho bằng 0 hoặc bị âm bất thường mặc dù số lượng tồn thực tế trong kho vẫn là số dương.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    p.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả],
    pp.CostMethod AS [Phương pháp giá],
    pc.AvgMaterial AS [Giá bình quân hiện tại],
    -- Lấy tổng tồn kho thực tế từ PartBin
    (SELECT SUM(pb.OnhandQty) 
     FROM Erp.PartBin pb 
     WHERE pb.Company = p.Company AND pb.PartNum = p.PartNum) AS [Tồn kho thực tế]
FROM Erp.Part p
INNER JOIN Erp.PartCost pc 
    ON p.Company = pc.Company AND p.PartNum = pc.PartNum
INNER JOIN Erp.PartPlant pp 
    ON p.Company = pp.Company AND p.PartNum = pp.PartNum
WHERE pp.CostMethod IN ('A', 'F')                  -- 'A': Average, 'F': FIFO
  AND pc.AvgMaterial <= 0                           -- Đơn giá bị âm hoặc bằng 0
  -- Điều kiện: Tồn kho thực tế ngoài kho vẫn lớn hơn 0
  AND (SELECT SUM(pb.OnhandQty) FROM Erp.PartBin pb WHERE pb.Company = p.Company AND pb.PartNum = p.PartNum) > 0;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
Trong Oracle, giá bình quân lưu tại `cost_type_id = 2` (Average) và giá FIFO lưu tại `cost_type_id = 5` (FIFO).
```sql
SELECT 
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    cic.cost_type_id,                               -- 2: Average, 5: FIFO
    cic.item_cost AS current_item_cost,             -- Đơn giá kho hiện tại
    -- Lấy tổng tồn kho thực tế
    (SELECT SUM(moqd.transaction_quantity) 
     FROM mtl_onhand_quantities_detail moqd 
     WHERE moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id) AS total_onhand
FROM cst_item_costs cic
INNER JOIN mtl_system_items_b msi 
    ON cic.inventory_item_id = msi.inventory_item_id AND cic.organization_id = msi.organization_id
WHERE cic.cost_type_id IN (2, 5)                    -- Chỉ quét Average hoặc FIFO Costing
  AND cic.item_cost <= 0                            -- Lỗi: Giá thành âm hoặc bằng 0
  -- Điều kiện: Số lượng tồn kho vẫn còn lớn hơn 0
  AND (SELECT SUM(moqd.transaction_quantity) FROM mtl_onhand_quantities_detail moqd WHERE moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id) > 0;
```

---

## 5. Checklist dành cho Developer khi phát triển phân hệ Tính giá tồn kho

- [ ] **Khóa chặn giao dịch xuất kho nếu giá bằng 0:** Thiết lập cảnh báo hoặc chặn đứng giao dịch xuất kho bán hàng (`STK-CUS`) hoặc xuất cho sản xuất (`STK-MTL`) nếu hệ thống kiểm tra thấy đơn giá tính toán của sản phẩm tại thời điểm xuất đang bằng 0 USD (tránh hỏng báo cáo giá vốn).
- [ ] **Hạn chế giao dịch lùi ngày (Backdated Control):** Thiết lập quy định chặn không cho phép người dùng tự ý làm giao dịch lùi ngày về các tháng trước đã khóa sổ tài chính (GL Closed), chỉ cho phép lùi ngày giới hạn trong vòng vài ngày của kỳ hiện tại đang mở.

> Các kiểm soát ở tầng **thiết lập giá thành** (bắt buộc duyệt trước khi ghi đè Standard Cost mới vào GL, tự động sinh bút toán chênh lệch giá PPV/Job Variance) thuộc checklist của phân hệ Giá thành — xem **COST-1010 (Cost Rollup)** và **COST-4010 (Variance Settlement & Posting)**.

---

## Xem thêm

- **[COST 1000 - Cấu hình thành phần chi phí sản xuất]()** — chi tiết 5 yếu tố cấu thành đơn giá (Material/Labor/Burden/Subcontract/Material Burden).
- **[COST 1010 - Standard Cost Rollup, Marking & Releasing]()** — quy trình tính toán và phê duyệt giá tiêu chuẩn, nguyên nhân gốc của lỗi "Standard Cost = 0".
- **[COST 4000-4010 - Variance Analysis & Settlement]()** — phân tích và kết chuyển chênh lệch giá thành (PPV, Job Variance).
- **[INV 9020 - Xử lý âm kho (Negative Inventory)](./9020-xu-ly-am-kho-negative-inventory.md)** — các tình huống liên quan khi đơn giá/số lượng tồn kho bất thường.

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>