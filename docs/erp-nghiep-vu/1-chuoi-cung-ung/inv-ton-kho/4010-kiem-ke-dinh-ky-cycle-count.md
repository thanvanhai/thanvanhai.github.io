---
id: kiem-ke-dinh-ky-cycle-count
title: Nghiệp vụ Kiểm kê Định kỳ (Cycle Counting) 
description: Phân tích ABC, Đóng băng tồn kho và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Kiểm kê Định kỳ (Cycle Count)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/kiem-ke-dinh-ky
sidebar_position: 4010
date: 2026-08-02
tags: [erp, inventory, cycle-count, abc-analysis, freeze-inventory, variance, sql-audit, oracle-ebs, epicor]
---

# 4010 Nghiệp vụ Kiểm kê Định kỳ (Cycle Counting)

> Phân tích ABC, Đóng băng tồn kho và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong quản trị kho hiện đại, việc dừng hoạt động toàn bộ nhà máy trong 2 - 3 ngày để làm kiểm kê tổng thể (Physical Inventory) cuối năm là cực kỳ tốn kém và gián đoạn kinh doanh. Để thay thế, các doanh nghiệp áp dụng phương pháp **Kiểm kê định kỳ cuốn chiếu (Cycle Counting)** — chia nhỏ danh mục hàng hóa để kiểm kê liên tục hàng ngày, hàng tuần.

Dưới góc nhìn hệ thống ERP, Cycle Counting là một quy trình kiểm soát chất lượng dữ liệu khép kín. Nó bắt đầu bằng việc phân loại hàng hóa, lên lịch kiểm kê tự động, ghi nhận số đếm thực tế, và tự động xử lý chênh lệch (Variance) để đưa số liệu hệ thống về đúng với thực tế vật lý.

---

## 1. Trái tim của Cycle Count: Phân tích ABC (ABC Analysis)

Hệ thống ERP không kiểm kê cào bằng tất cả mọi thứ. Nó sử dụng nguyên lý Pareto (80/20) để chia hàng hóa thành 3 nhóm **ABC** dựa trên giá trị và tần suất luân chuyển của vật tư:

* **Nhóm A (Nhóm giá trị cao - Chiếm ~80% giá trị nhưng chỉ ~20% số lượng):** Bắt buộc phải kiểm kê rất thường xuyên (ví dụ: 1 lần/tháng).
* **Nhóm B (Nhóm trung bình - Chiếm ~15% giá trị):** Tần suất kiểm kê thưa hơn (ví dụ: 1 lần/quý).
* **Nhóm C (Nhóm giá trị thấp - Chiếm ~5% giá trị còn lại):** Tần suất kiểm kê rất thấp (ví dụ: 1 lần/nửa năm hoặc 1 lần/năm).

> **Cơ chế ERP:** Định kỳ hàng tháng/quý, hệ thống ERP sẽ tự động chạy thuật toán phân lớp ABC cho toàn bộ danh mục hàng hóa, sau đó tự động lập lịch (Scheduler) tạo ra các phiếu kiểm kê hàng ngày (Cycle Count Sheets) cho thủ kho dựa trên cấu hình tần suất của từng nhóm.

---

## 2. Cơ chế Đóng băng tồn kho hệ thống (Inventory Freeze)

Khi thủ kho cầm phiếu kiểm kê đi đếm hàng ngoài thực tế, hệ thống ERP sẽ thực hiện một tác vụ cực kỳ quan trọng gọi là **Đóng băng số lượng tồn kho (Freeze Inventory / Snapshot)**.

* **Bản chất kỹ thuật:** Tại thời điểm bấm nút Freeze, hệ thống chụp lại số lượng On-hand hiện tại trên máy (ví dụ: Mã `BUL-001` đang có 10 con). Thủ kho đi đếm thực tế được 8 con. Chênh lệch sẽ được tính bằng:
  $$\text{Chênh lệch (Variance)} = \text{Số thực đếm (8)} - \text{Số đóng băng hệ thống (10)} = -2$$
* **Bẫy vận hành (Backdated Transactions):** Trong lúc thủ kho đang đi đếm hàng, phân xưởng sản xuất làm phiếu xuất kho lùi ngày (Backdated Issue) có ngày giao dịch trước thời điểm Freeze. Giao dịch này sẽ làm thay đổi số dư tồn kho hệ thống tại thời điểm quá khứ, khiến con số đóng băng tạm tính bị sai lệch và tạo ra chênh lệch ảo.

---

## 3. Hai "Bẫy" thực chiến trong quy trình kiểm kê định kỳ

### ❌ Bẫy 1: Bỏ quên phê duyệt chênh lệch kiểm kê (Unposted Cycle Count Variances)

**Tình huống:** Thủ kho đã hoàn thành việc đếm hàng và nhập số thực đếm vào hệ thống ERP. Kết quả phát hiện thiếu hụt **50 con chip** giá trị cao (lệch âm) so với hệ thống. Do sợ bị phạt hoặc do kế toán thiếu giám sát, phiếu kiểm kê này **bị treo ở trạng thái "Chờ duyệt" (Pending Approval) suốt nhiều tuần** mà không ai bấm nút Xác nhận duyệt chênh lệch (Post Variance).

* **Hậu quả:** 
  1. Số dư tồn kho trên ERP vẫn báo có đủ hàng (vì phiếu chưa được Post để trừ kho thực tế), dẫn đến việc bộ phận sản xuất tin tưởng có đủ vật tư để chạy máy, đến khi ra lấy thì kho thực tế đã trống rỗng.
  2. Kế toán tài chính không ghi nhận khoản hao hụt tài sản này kịp thời vào Sổ cái (GL), làm sai lệch báo cáo tài chính trong kỳ.

---

### ❌ Bẫy 2: "Trốn tránh" kiểm kê hàng giá trị cao (Neglecting High-Value Items)

Kiểm kê hàng nhóm A (linh kiện đắt tiền, kim loại quý) rất phức tạp vì yêu cầu đếm chính xác tuyệt đối, cân đo tỉ mỉ và giải trình chênh lệch rất khắt khe từ ban giám đốc.

* **Hậu quả vận hành:** Thủ kho thường có xu hướng ưu tiên chọn kiểm các mã hàng nhóm C (ốc vít, bao bì dễ đếm, ít bị soi chênh lệch) và **bỏ quên hoặc trì hoãn** kiểm kê nhóm A. Kết quả là nhóm hàng dễ thất thoát nhất lại là nhóm có dữ liệu tồn kho ảo kéo dài lâu nhất trên hệ thống, vi phạm nghiêm trọng quy chuẩn kiểm toán kho.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát quy trình Cycle Count

---

### ❌ SQL Audit 1: Phát hiện các phiếu kiểm kê chênh lệch bị treo quá lâu không duyệt (Unposted Variances)
Tìm các dòng kiểm kê đã hoàn thành đếm, có phát sinh chênh lệch (khác 0) nhưng vẫn đang bị treo ở trạng thái chưa Post quá 14 ngày.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    ch.CCYear AS [Năm kiểm kê],
    ch.CycleSeq AS [Đợt kiểm kê],
    ch.WarehouseCode AS [Mã kho],
    ch.BinNum AS [Vị trí],
    ch.PartNum AS [Mã sản phẩm],
    ch.BaseSysQty AS [Tồn hệ thống],
    ch.BaseCountQty AS [Số thực đếm],
    (ch.BaseCountQty - ch.BaseSysQty) AS VarianceQty, -- Chênh lệch kiểm kê
    ch.CountDate AS [Ngày đếm thực tế]
FROM Erp.CCHand ch
WHERE ch.Posted = 0                                 -- Chưa được Post duyệt chênh lệch
  AND ch.Voided = 0                                 -- Phiếu chưa bị hủy
  AND ch.BaseCountQty <> ch.BaseSysQty               -- Có phát sinh chênh lệch thực tế
  AND ch.CountDate < GETDATE() - 14;                -- Bị treo quá 14 ngày chưa duyệt
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    mcch.cycle_count_header_name AS count_name,
    mcce.subinventory AS subinventory,
    msi.segment1 AS item_code,
    mcce.system_quantity_current AS system_qty,
    mcce.count_quantity_current AS count_qty,
    (mcce.count_quantity_current - mcce.system_quantity_current) AS variance_qty,
    mcce.count_date_current AS count_date,
    -- Giải nghĩa mã trạng thái chưa duyệt (2: Pending Recount, 3: Pending Approval)
    DECODE(mcce.entry_status_code, 2, 'Pending Recount', 3, 'Pending Approval', mcce.entry_status_code) AS status
FROM mtl_cycle_count_entries mcce
INNER JOIN mtl_cycle_count_headers mcch 
    ON mcce.cycle_count_header_id = mcch.cycle_count_header_id
INNER JOIN mtl_system_items_b msi 
    ON mcce.inventory_item_id = msi.inventory_item_id AND mcce.organization_id = msi.organization_id
WHERE mcce.entry_status_code IN (2, 3)             -- Trạng thái chưa được Post/Approved
  AND (mcce.count_quantity_current - mcce.system_quantity_current) <> 0
  AND mcce.count_date_current < SYSDATE - 14        -- Bị treo quá 14 ngày chưa xử lý
ORDER BY mcce.count_date_current DESC;
```

---

### ❌ SQL Audit 2: Phát hiện hàng giá trị cao (Nhóm A) bị bỏ quên không kiểm kê định kỳ
Quét ra danh sách các vật tư thuộc nhóm phân lớp A (ABC Class A) có giá trị cao nhưng đã quá 45 ngày chưa từng được đưa vào bất kỳ đợt kiểm kê thành công nào.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    p.PartNum AS [Mã vật tư],
    p.PartDescription AS [Mô tả],
    pp.ABCCode AS [Phân lớp ABC],
    -- Tìm ngày kiểm kê thành công gần nhất từ lịch sử giao dịch điều chỉnh kiểm kê
    (SELECT MAX(pt.TranDate) 
     FROM Erp.PartTran pt 
     WHERE pt.Company = p.Company 
       AND pt.PartNum = p.PartNum 
       AND pt.TranType = 'ADJ-QTY' AND pt.ReasonCode LIKE '%COUNT%') AS LastCountDate
FROM Erp.Part p
INNER JOIN Erp.PartPlant pp ON p.Company = pp.Company AND p.PartNum = pp.PartNum
WHERE pp.ABCCode = 'A'                              -- Lọc các vật tư nhóm A
  AND (
      -- Điều kiện: Ngày kiểm kê gần nhất cách đây hơn 45 ngày HOẶC chưa từng được kiểm kê bao giờ
      (SELECT MAX(pt.TranDate) FROM Erp.PartTran pt WHERE pt.Company = p.Company AND pt.PartNum = p.PartNum AND pt.TranType = 'ADJ-QTY' AND pt.ReasonCode LIKE '%COUNT%') < GETDATE() - 45
      OR 
      (SELECT MAX(pt.TranDate) FROM Erp.PartTran pt WHERE pt.Company = p.Company AND pt.PartNum = p.PartNum AND pt.TranType = 'ADJ-QTY' AND pt.ReasonCode LIKE '%COUNT%') IS NULL
  );
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    mac.abc_class_name AS abc_class,
    -- Tìm ngày kiểm kê thành công gần nhất
    (SELECT MAX(mcce_sub.count_date_current)
     FROM mtl_cycle_count_entries mcce_sub
     WHERE mcce_sub.inventory_item_id = msi.inventory_item_id
       AND mcce_sub.organization_id = msi.organization_id
       AND mcce_sub.entry_status_code = 5           -- 5: Completed/Posted
    ) AS last_posted_count_date
FROM mtl_system_items_b msi
INNER JOIN mtl_abc_assignments maa 
    ON msi.inventory_item_id = maa.inventory_item_id AND msi.organization_id = maa.organization_id
INNER JOIN mtl_abc_classes mac 
    ON maa.abc_class_id = mac.abc_class_id AND maa.organization_id = mac.organization_id
WHERE mac.abc_class_name LIKE '%A%'                 -- Chỉ lọc vật tư thuộc nhóm A
  AND (
      -- Điều kiện: Ngày kiểm kê gần nhất cách đây hơn 45 ngày HOẶC chưa từng được kiểm kê thành công
      (SELECT MAX(mcce_sub.count_date_current) FROM mtl_cycle_count_entries mcce_sub WHERE mcce_sub.inventory_item_id = msi.inventory_item_id AND mcce_sub.organization_id = msi.organization_id AND mcce_sub.entry_status_code = 5) < SYSDATE - 45
      OR
      (SELECT MAX(mcce_sub.count_date_current) FROM mtl_cycle_count_entries mcce_sub WHERE mcce_sub.inventory_item_id = msi.inventory_item_id AND mcce_sub.organization_id = msi.organization_id AND mcce_sub.entry_status_code = 5) IS NULL
  );
```

---

## 5. Checklist dành cho Developer khi phát triển phân hệ Cycle Counting

- [ ] **Khóa giao dịch khi Freeze kho:** Khi đợt kiểm kê được kích hoạt (Freeze), xây dựng cơ chế cảnh báo hoặc chặn các giao dịch lùi ngày (Backdated Transactions) có ngày giao dịch trước ngày Freeze để tránh làm lệch số liệu đối chiếu.
- [ ] **Tích hợp kiểm tra dung sai (Tolerance):** Khi thủ kho nhập số thực đếm, hệ thống tự động kiểm tra xem phần trăm chênh lệch có vượt quá hạn mức cho phép hay không. Nếu vượt quá, tự động chuyển trạng thái dòng thành **"Yêu cầu đếm lại" (Recount)** trước khi cho phép gửi duyệt Post.
- [ ] **Tự động hóa phân lớp ABC định kỳ:** Lập trình tác vụ tự động chạy hàng tháng (Background Job) để tính toán lại điểm số ABC của vật tư dựa trên tổng giá trị giao dịch xuất kho thực tế trong 12 tháng gần nhất.
- [ ] **Phân quyền duyệt chênh lệch nghiêm ngặt:** Đảm bảo nút "Post Variance" (Duyệt chênh lệch kiểm kê) được phân quyền chặt chẽ cho Kế toán kho hoặc Kế toán trưởng, tuyệt đối không cấp quyền này cho nhân viên thủ kho trực tiếp thực hiện.
