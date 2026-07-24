---
id: xu-ly-am-kho-negative-inventory
title: Xử lý Âm kho (Negative Inventory) 
description: Thảm họa nổ giá bình quân, Cơ chế khóa âm kho và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Xử lý Âm kho (Negative Inventory)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/xu-ly-am-kho
sidebar_position: 9020
date: 2026-08-21
tags: [erp, inventory, negative-inventory, costing, average-cost, backflushing, subledger-reconciliation, sql-audit, oracle-ebs, epicor]
---

# 9020 Xử lý Âm kho (Negative Inventory)

> Thảm họa nổ giá bình quân, Cơ chế khóa âm kho và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong vận hành thực tế tại các nhà máy, **Âm tồn kho hệ thống (Negative Inventory)** thường phát sinh do độ trễ thời gian (Time Lag) giữa dòng dịch chuyển vật lý và dòng dữ liệu trên phần mềm (ví dụ: hàng thực tế đã được xếp lên xe xuất đi giao cho khách, nhưng phiếu nhập kho mua hàng PO của lô hàng đó vẫn đang chờ phòng mua hàng duyệt trên máy).

Mặc dù việc cho phép xuất âm kho mang lại sự linh hoạt tạm thời cho thủ kho, đây lại là **"cơn ác mộng kinh hoàng"** đối với kế toán giá thành. Việc xuất âm kho phá hủy hoàn toàn thuật toán tính giá vốn tồn kho của hệ thống, dẫn đến những sai lệch khổng lồ về mặt giá trị tài sản mà không có công cụ kế toán nào có thể tự động sửa chữa.

---

## 1. Tại sao Âm kho là "Thảm họa toán học" đối với Kế toán giá thành?

Để hiểu tại sao âm kho lại tàn phá hệ thống định giá, hãy nhìn vào cách hệ thống ERP tính toán giá trị tồn kho:

### A. Tác động hủy diệt đối với Giá bình quân (Average Costing)
Thuật toán tính giá bình quân di động (Moving Average) hoạt động bằng cách chia tổng giá trị tồn kho cho số lượng tồn kho. 
* Khi số lượng tồn kho bị **âm** (ví dụ: đang âm **-10 cái** với giá trị kho tạm tính bằng **-100 USD**).
* Bạn làm phiếu nhập kho mua hàng mới: Nhập **10 cái** với giá thực tế là **15 USD/cái** (trị giá nhập kho là **+150 USD**).
* **Công thức ERP tính đơn giá bình quân mới:**
  $$\text{Đơn giá mới} = \frac{\text{Giá trị cũ (-100 USD)} + \text{Giá trị nhập mới (+150 USD)}}{\text{Số lượng cũ (-10)} + \text{Số lượng mới (+10)}} = \frac{+50 \text{ USD}}{0 \text{ cái}}$$
  * **Thảm họa toán học:** Phép toán chia cho 0 xuất hiện. Công cụ tính giá vốn (Cost Processor) của ERP sẽ bị lỗi crash hệ thống, hoặc tự động gán đơn giá vốn mới bằng 0, hoặc tệ hơn là gây ra hiện tượng **"nổ giá bình quân"** vọt lên hàng ngàn USD/cái, làm sai lệch hoàn toàn giá vốn (COGS) của các đơn hàng xuất bán tiếp theo.

### B. Tác động đối với Giá FIFO (First In, First Out)
Dưới phương pháp FIFO, âm kho bắt buộc hệ thống phải sinh ra một **"Lớp giá âm" (Negative Cost Layer)**. Việc này là phi thực tế về mặt vật lý (làm sao có một pallet hàng có trọng lượng âm và giá trị âm nằm trong kho?). Khi có hàng dương nạp vào để bù đắp, việc triệt tiêu lớp giá âm này thường sinh ra các khoản chênh lệch giá thành lớn (Variance Write-off) cực kỳ khó giải trình khi kiểm toán.

---

## 2. Các cơ chế kiểm soát Âm kho trên ERP

Hệ thống ERP cung cấp hai tùy chọn cấu hình chính để kiểm soát bài toán này:

* **Tùy chọn A: Khóa cứng âm kho (Strict Disallow Negative) — Khuyên dùng:** Hệ thống chặn đứng mọi giao dịch làm On-hand Qty của sản phẩm xuống dưới 0.
  * *Ưu điểm:* Bảo vệ tuyệt đối tính trung thực của dữ liệu giá vốn và kế toán.
  * *Nhược điểm:* Gây tắc nghẽn vận hành thực tế nếu phòng mua hàng hoặc thủ kho đầu vào làm việc chậm trễ.
* **Tùy chọn B: Cho phép âm kho cục bộ kèm cảnh báo (Allow with Warnings):** Hệ thống cho phép xuất hàng trước, ghi nhận âm kho tạm thời, và tự động chạy quy trình tính lại giá vốn (Cost Adjustment) để bù trừ chênh lệch ngay khi có giao dịch nhập kho dương nạp vào.

---

## 3. Ba kịch bản đứt gãy nghiệp vụ do Âm kho gây ra

### ❌ Kịch bản 1: Thảm họa nổ giá bình quân khi nhập hàng bù đắp

**Tình huống:** Sản phẩm `Part-A` đang bị âm tồn kho hệ thống **-5 cái** với giá trị kho tạm tính là **-50 USD** (đơn giá -10 USD/cái). Do nhà cung cấp tăng giá, bạn làm phiếu nhập kho mua mới **6 cái** với giá thực tế **20 USD/cái** (trị giá nhập mới +120 USD).

* **ERP hạch toán sai lệch:** Hệ thống tính toán đơn giá bình quân mới sau khi nhập kho dương:
  $$\text{Đơn giá bình quân mới} = \frac{-50 \text{ USD} + 120 \text{ USD}}{-5 \text{ cái} + 6 \text{ cái}} = \frac{+70 \text{ USD}}{1 \text{ cái}} = 70 \text{ USD/cái}$$
  * *Hậu quả:* Đơn giá bình quân của 1 cái `Part-A` bỗng nhiên bị **"thổi phồng" lên thành 70 USD** (trong khi thực tế giá mua đắt nhất chỉ là 20 USD). Khi bạn xuất bán cái sản phẩm thứ 1 này đi, Giá vốn hàng bán (COGS) sẽ ghi nhận 70 USD, kéo tụt lợi nhuận gộp của bạn xuống một cách vô lý.

---

### ❌ Kịch bản 2: Âm kho cục bộ tại vị trí ô kệ (Local Bin/Locator Negative) trong khi tổng kho vẫn dương

**Tình huống:** Tổng kho của nhà máy báo đang tồn dương **100 cái áo**. Tuy nhiên, do thủ kho cất hàng một nơi nhưng quét mã hệ thống một nẻo, trên ERP báo vị trí `Kệ A` đang bị **âm -10 cái**, còn vị trí `Kệ B` đang tồn **dương 110 cái**.

* **Hậu quả đứt gãy:** Khi nhân viên kinh doanh làm đơn hàng xuất bán 5 cái từ `Kệ A`, hệ thống ERP sẽ chặn giao dịch vì vị trí `Kệ A` đang bị âm, mặc dù thực tế ngoài kho và tổng kho trên máy vẫn có đủ 100 cái. Việc này gây tắc nghẽn khâu giao hàng chỉ vì lỗi định vị vị trí ô kệ.

---

### ❌ Kịch bản 3: Vòng lặp âm kho vô hạn từ cơ chế trừ kho tự động (Negative Backflushing Loop)

**Tình huống:** Doanh nghiệp áp dụng cơ chế tự động trừ kho nguyên vật liệu khi nhập kho thành phẩm sản xuất (Backflushing). Thủ kho liên tục làm lệnh nhập kho thành phẩm, hệ thống tự động chạy lệnh xuất ngầm trừ kho nguyên vật liệu. 

* **Hậu quả đứt gãy:** Do phòng mua hàng chưa kịp làm phiếu nhập kho cho nguyên vật liệu thô, cơ chế Backflush ngầm vẫn liên tục trừ kho khiến tồn kho của nguyên vật liệu thô bị **âm âm thầm lên tới hàng chục ngàn cái** cuối tháng mà không ai hay biết, cho đến khi kế toán chạy báo cáo định giá tồn kho thấy giá trị tài sản bị âm bất thường.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát lỗi Âm kho

Hãy chạy các câu lệnh SQL dưới đây định kỳ hàng tuần để phát hiện và xử lý sớm các mã hàng bị lỗi âm kho trên hệ thống:

---

### ❌ SQL Audit 1: Phát hiện các mã hàng bị âm tồn kho tổng (Negative Total On-Hand)
Tìm toàn bộ các mã hàng đang bị âm số dư tồn kho tổng ở mức nhà kho (`Warehouse / Subinventory` level), là lỗi nghiêm trọng tàn phá thuật toán tính giá vốn.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartWhse`):
```sql
SELECT 
    pw.WarehouseCode AS [Mã kho],
    pw.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả sản phẩm],
    pw.OnhandQty AS [Số lượng tồn âm tổng]
FROM Erp.PartWhse pw
INNER JOIN Erp.Part p 
    ON pw.Company = p.Company AND pw.PartNum = p.PartNum
WHERE pw.OnhandQty < 0;                              -- Quét các mã bị âm tồn kho tổng của nhà kho
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_ONHAND_QUANTITIES_DETAIL`):
```sql
SELECT 
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    SUM(moqd.transaction_quantity) AS total_onhand  -- Tổng lượng tồn kho của toàn Org
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
GROUP BY moqd.organization_id, msi.segment1, msi.description
HAVING SUM(moqd.transaction_quantity) < 0;          -- Quét các mã bị âm tồn kho tổng của Org
```

---

### ❌ SQL Audit 2: Phát hiện âm kho cục bộ tại vị trí ô kệ trong khi tổng kho vẫn dương (Local Bin Negatives)
Tìm các mã hàng đang bị âm số lượng tại các ô kệ chi tiết (`Bin / Locator`) nhưng tổng kho lớn vẫn dương (biểu hiện của việc thủ kho cất hàng một vị trí nhưng quét mã vị trí khác).

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ bị âm],
    pb.PartNum AS [Mã sản phẩm],
    pb.OnhandQty AS [Số lượng âm cục bộ],
    pw.OnhandQty AS [Số lượng dương tổng kho]        -- Tổng kho lớn vẫn dương
FROM Erp.PartBin pb
INNER JOIN Erp.PartWhse pw 
    ON pb.Company = pw.Company AND pb.PartNum = pw.PartNum AND pb.WarehouseCode = pw.WarehouseCode
WHERE pb.OnhandQty < 0                              -- Lọc ô kệ chi tiết bị âm
  AND pw.OnhandQty >= 0;                            -- Nhưng tồn tổng của nhà kho vẫn dương
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
WITH org_onhand AS (
    -- Tính tổng tồn kho của toàn Org trước
    SELECT 
        inventory_item_id,
        organization_id,
        SUM(transaction_quantity) AS total_qty
    FROM mtl_onhand_quantities_detail
    GROUP BY inventory_item_id, organization_id
)
SELECT 
    moqd.subinventory_code AS subinventory,
    mil.segment1 || '.' || mil.segment2 AS locator_name, -- Tên vị trí ô kệ bị âm
    msi.segment1 AS item_code,
    SUM(moqd.transaction_quantity) AS local_negative_qty, -- Số lượng âm cục bộ tại ô kệ
    oo.total_qty AS total_org_qty                         -- Nhưng tổng lượng tồn của Org vẫn dương
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
INNER JOIN mtl_item_locations mil 
    ON moqd.locator_id = mil.inventory_location_id AND moqd.organization_id = mil.organization_id
INNER JOIN org_onhand oo 
    ON moqd.inventory_item_id = oo.inventory_item_id AND moqd.organization_id = oo.organization_id
GROUP BY moqd.subinventory_code, mil.segment1, mil.segment2, msi.segment1, oo.total_qty, moqd.inventory_item_id, moqd.organization_id, moqd.locator_id
HAVING SUM(moqd.transaction_quantity) < 0           -- Lọc Locator bị âm số lượng
   AND oo.total_qty >= 0;                           -- Nhưng tổng Org vẫn dương/bằng 0
```

---

## 5. Cơ chế xử lý sự cố & Checklist thiết kế hệ thống kiểm soát Âm kho

Để xây dựng một hệ thống ERP an toàn về mặt dữ liệu kế toán và kho, lập trình viên bắt buộc phải thiết kế các cơ chế kiểm soát sau:

- [ ] **Ràng buộc khóa âm kho cứng theo nhóm hàng:** Thiết lập cờ cấu hình `Disallow Negative Inventory` trên danh mục Nhóm hàng hóa (`Item Category`). Hệ thống bắt buộc phải kiểm tra số dư khả dụng trước khi lưu mọi giao dịch xuất kho, chặn đứng hành vi xuất hàng nếu số lượng khả dụng nhỏ hơn số lượng xuất.
- [ ] **Lập trình cảnh báo âm kho cục bộ:** Khi thủ kho làm phiếu chuyển vị trí kho nội bộ (`Bin Transfer`), hệ thống phải tự động cảnh báo đỏ nếu giao dịch làm âm cục bộ tại một ô kệ, yêu cầu thủ kho thực hiện đếm lại vị trí thực tế trước khi lưu.
- [ ] **Cấu hình chặn âm kho trên luồng Backflush:** Đối với cơ chế trừ kho tự động khi sản xuất (`Backflushing`), nếu hệ thống quét thấy số lượng nguyên vật liệu chuẩn bị trừ kho bị âm trên máy, lập trình hệ thống tự động đẩy giao dịch này vào hàng đợi chờ xử lý (`Pending Queue / Error Log`) thay vì cho phép trừ âm trực tiếp, tránh gây âm kho hàng loạt ngoài tầm kiểm soát (Kịch bản 3).
- [ ] **Tác vụ tự động tính lại giá vốn khi hết âm kho (Cost Adjustment Engine):** Lập trình quy trình tự động chạy hàng đêm (Nightly Job): Khi phát hiện một mã hàng bị âm kho được nạp giao dịch nhập kho dương, hệ thống tự động tính toán lại đơn giá bình quân thực tế và tự động tạo bút toán điều chỉnh giá vốn (`Cost Adjustment`) gửi sang Sổ cái để sửa sai lệch kế toán (Kịch bản 1).