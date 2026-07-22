---
id: thiet-lap-danh-muc-item-master
title: Thiết lập Danh mục Hàng hóa (Item Master) — Triết lý đặt mã, Ràng buộc Đơn vị tính gốc và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Danh mục Hàng hóa (Item Master)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/item-master
sidebar_position: 7000
date: 2026-08-11
tags: [erp, inventory, item-master, primary-uom, naming-convention, database, sql-audit, oracle-ebs, epicor]
---

# Thiết lập Danh mục Hàng hóa (Item Master) — Triết lý đặt mã, Ràng buộc Đơn vị tính gốc và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Danh mục Hàng hóa (**Item Master** hoặc **Part Master**) là "bộ mã di truyền - DNA" của mọi hệ thống ERP. Tất cả các phân hệ từ Thu mua (PO), Bán hàng (SO), Sản xuất (MFG) cho đến Kế toán (FI) đều phải tham chiếu trực tiếp đến mã hàng hóa được định nghĩa tại đây.

Nếu danh mục Item Master bị thiết lập sai, mập mờ hoặc thiếu nhất quán ngay từ đầu, toàn bộ hệ thống ERP sẽ vận hành lệch lạc. Thu mua sẽ mua sai quy cách vật tư, sản xuất sẽ lắp ráp sai linh kiện, và kế toán sẽ không thể tính nổi giá thành sản phẩm.

---

## 1. Triết lý đặt mã vật tư: Có ý nghĩa (Intelligent) vs Vô nghĩa (Non-intelligent)

Khi triển khai dự án ERP, cuộc tranh luận lớn nhất giữa các phòng ban luôn là: **Nên đặt mã hàng hóa theo quy luật có ý nghĩa (Intelligent) hay để hệ thống tự sinh số vô nghĩa (Non-intelligent)?**

### A. Đặt mã có ý nghĩa (Intelligent Coding)
Mã hàng hóa chứa các ký tự đại diện cho nhóm hàng, quy cách, kích thước (Ví dụ: `BUL-M8-100-GAL` là Bu-lông, kích thước M8, dài 100mm, mạ kẽm).
* **Ưu điểm:** Người dùng nhìn vào mã là biết ngay đó là hàng gì mà không cần tra cứu mô tả.
* **Nhược điểm:** Khi danh mục vật tư phình to lên hàng trăm ngàn mã, quy luật đặt mã sẽ bị phá vỡ (hết ký tự đại diện, người dùng tự sáng tạo quy luật mới). Khi quy cách sản phẩm thay đổi, việc đổi mã sẽ gây đứt gãy lịch sử giao dịch.

### B. Đặt mã vô nghĩa (Non-intelligent Coding)
Mã hàng là một chuỗi số tăng tự động (Sequenced Number) do hệ thống tự sinh (Ví dụ: `10000001`, `10000002`).
* **Ưu điểm:** Khả năng mở rộng vô hạn, không bao giờ lo hết mã hoặc sai quy luật. Hệ thống ERP chuẩn quốc tế (SAP, Oracle) cực kỳ khuyến khích phương pháp này.
* **Nhược điểm:** Người dùng bắt buộc phải tìm kiếm bằng mô tả (Description) hoặc từ khóa (Keyword), không thể nhớ và gõ tắt mã hàng được.

---

## 2. Tính bất biến của Đơn vị tính gốc (Primary/Base UOM)

Mỗi mã hàng hóa bắt buộc phải được gán duy nhất một **Đơn vị tính gốc (Primary UOM / Base UOM)** để hệ thống dùng làm đơn vị lưu trữ số dư tồn kho vật lý (On-hand Qty) và định giá vốn.

> **Ràng buộc thép của ERP:** Một khi mã hàng hóa đã phát sinh bất kỳ một giao dịch kho nào (dù chỉ là nhập kho 1 cái), **tuyệt đối không bao giờ được phép sửa đổi Đơn vị tính gốc của mã hàng đó**. 

Nếu bạn cố tình dùng các thủ thuật can thiệp Database để sửa đơn vị gốc (ví dụ từ `PCS` sửa thành `BOX` trong khi trước đó đã có giao dịch nhập kho 10 PCS), toàn bộ số liệu tồn kho, giá trị tồn kho trung bình và giá vốn xuất kho của mã hàng đó sẽ bị nhân/chia sai lệch và phá hủy hoàn toàn dữ liệu kế toán.

---

## 3. Hai "Bẫy" thực chiến phá hủy tính toàn vẹn của Item Master

### ❌ Bẫy 1: Sửa đơn vị tính gốc (Primary UOM Modification) lách qua lỗ hổng hệ thống

**Tình huống:** Mã hàng bu-lông đang có đơn vị gốc là `PCS` (Con) và đã chạy giao dịch nhập/xuất suốt 2 năm qua. Do quy trình mới chuyển sang mua bán theo hộp, kế toán yêu cầu IT phải sửa đơn vị tính gốc của mã này thành `BOX` (Hộp) để đỡ phải làm quy đổi. Lập trình viên do chiều lòng người dùng đã viết câu lệnh SQL để UPDATE trực tiếp trường đơn vị gốc trong Database.

* **Hậu quả thảm khốc:** 
  * Trước khi sửa: Tồn kho trên máy là **1.000 PCS** trị giá **1.000 USD** (1 USD/con).
  * Sau khi sửa: Hệ thống đọc số lượng tồn kho tổng vẫn là 1.000, nhưng đơn vị đã bị đổi thành **1.000 BOX**. Trị giá tồn kho bỗng nhiên vọt lên thành **100.000 USD** (vì 1 BOX giá 100 USD).
  * Toàn bộ lịch sử giao dịch kho trong quá khứ bị tính sai lệch đơn vị, kế toán trưởng hoàn toàn bất lực trong việc giải trình chênh lệch sổ sách với kiểm toán thuế.

---

### ❌ Bẫy 2: Trùng lặp mã hàng do đặt tên mập mờ (Duplicate Item Master)

**Tình huống:** Quy luật đặt mã của doanh nghiệp lỏng lẻo. Bộ phận thu mua tạo mã `BUL-M8` với mô tả "Bu lông M8". Một thời gian sau, bộ phận sản xuất cần dùng loại bu-lông tương tự, do không tìm thấy trên hệ thống liền tạo tiếp mã `BUL001` với mô tả "Bulong mạ kẽm M8". Thực tế ngoài đời, hai mã này là **cùng một loại bu-lông vật lý**.

* **Hậu quả vận hành:** 
  1. Số liệu tồn kho bị chia xẻ (máy báo kho `BUL-M8` hết hàng, kho `BUL001` còn hàng). Phòng mua hàng nhìn hệ thống thấy mã `BUL-M8` hết liền làm đơn mua thêm, gây lãng phí dòng tiền mua sắm trùng lặp.
  2. Khi chạy MRP, hệ thống tính toán nhu cầu vật tư bị sai lệch hoàn toàn vì không thể gộp nhu cầu của cùng một linh kiện bị phân mảnh dưới hai mã khác nhau.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát danh mục Item Master

Hãy sử dụng các câu lệnh SQL dưới đây để quét sạch các mã vật tư rác hoặc trùng lặp trước khi chúng tàn phá dữ liệu hệ thống của bạn:

---

### ❌ SQL Audit 1: Phát hiện các mã hàng bị tạo trùng lặp do mô tả tương đồng (Potential Duplicate Items)
Quét toàn bộ danh mục hàng hóa để tìm các cặp mã hàng có phần mô tả giống hệt nhau (sau khi đã loại bỏ khoảng trắng và chuyển về chữ viết hoa) để tiến hành gộp mã (Merge Items).

#### 💻 Code SQL dành cho Epicor ERP (Bảng `Part`):
```sql
SELECT 
    p1.PartNum AS [Mã hàng A],
    p1.PartDescription AS [Mô tả A],
    p2.PartNum AS [Mã hàng B],
    p2.PartDescription AS [Mô tả B]
FROM Erp.Part p1
INNER JOIN Erp.Part p2 
    ON p1.Company = p2.Company 
    AND p1.PartNum < p2.PartNum                      -- Tránh trùng lặp lặp cặp ngược lại
    -- Thuật toán so sánh mô tả không tính khoảng trắng và không phân biệt chữ hoa/thường
    AND UPPER(REPLACE(p1.PartDescription, ' ', '')) = UPPER(REPLACE(p2.PartDescription, ' ', ''))
WHERE p1.Company = 'your_company_code';              -- Điền mã công ty của bạn
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_SYSTEM_ITEMS_B`):
```sql
SELECT 
    msi1.segment1 AS item_code_a,
    msi1.description AS item_desc_a,
    msi2.segment1 AS item_code_b,
    msi2.description AS item_desc_b
FROM mtl_system_items_b msi1
INNER JOIN mtl_system_items_b msi2 
    ON msi1.organization_id = msi2.organization_id
    AND msi1.inventory_item_id < msi2.inventory_item_id -- Tránh lặp cặp
    AND UPPER(REPLACE(msi1.description, ' ', '')) = UPPER(REPLACE(msi2.description, ' ', ''))
WHERE msi1.organization_id = :your_org_id;          -- Điền mã Organization của bạn
```

---

### ❌ SQL Audit 2: Phát hiện lệch Đơn vị tính giữa giao dịch kho thực tế và Danh mục gốc (UOM Discrepancy)
Tìm các trường hợp giao dịch xuất/nhập kho có đơn vị tính ghi nhận thực tế (`Transaction UOM`) bị khác biệt so với Đơn vị tính gốc (`Primary/Inventory UOM`) cấu hình tại danh mục hàng hóa mà không có hệ số quy đổi tương thích.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartTran` & `Part`):
```sql
SELECT 
    pt.TranDate AS [Ngày giao dịch],
    pt.PackNum AS [Số chứng từ],
    pt.PartNum AS [Mã hàng],
    p.IUM AS [UOM gốc danh mục],
    pt.UM AS [UOM thực tế giao dịch],
    pt.TranQty AS [Số lượng giao dịch]
FROM Erp.PartTran pt
INNER JOIN Erp.Part p 
    ON pt.Company = p.Company AND pt.PartNum = p.PartNum
-- Tìm các giao dịch có đơn vị tính thực tế khác với đơn vị tính gốc của danh mục
WHERE pt.UM <> p.IUM 
  AND pt.TranQty <> 0;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS tx_date,
    msi.segment1 AS item_code,
    msi.primary_uom_code AS primary_uom,            -- UOM gốc trong Item Master
    mmt.transaction_uom AS tx_uom,                  -- UOM thực tế phát sinh giao dịch
    mmt.transaction_quantity AS tx_qty
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
-- Tìm giao dịch có đơn vị tính thực tế khác đơn vị gốc của Item Master
WHERE mmt.transaction_uom <> msi.primary_uom_code
  AND mmt.transaction_quantity <> 0;
```

---

## 5. Checklist dành cho Developer khi phát triển danh mục Item Master

- [ ] **Khóa trường Đơn vị tính gốc (Lock Primary UOM):** Viết logic kiểm tra (Validation Rule) trên màn hình chỉnh sửa mã hàng: Nếu hệ thống kiểm tra thấy mã hàng này đã phát sinh ít nhất 1 giao dịch trong bảng lịch sử giao dịch kho (`PartTran`/`MTL_MATERIAL_TRANSACTIONS`), ngay lập tức khóa cứng (Disable) không cho phép người dùng thay đổi trường Đơn vị tính gốc.
- [ ] **Chặn tạo trùng mô tả (Unique Description Validation):** Thiết lập cảnh báo hoặc chặn đứng (Block) hành vi lưu mã hàng mới nếu người dùng nhập phần mô tả sản phẩm trùng lặp với một mã đã có sẵn trên hệ thống (Kịch bản 2).
- [ ] **Ràng buộc các thuộc tính bắt buộc theo Loại hàng (Item Type Constraints):** 
  * Nếu hàng là sản phẩm tự sản xuất (`Make`): Bắt buộc phải chọn phương pháp tính giá vốn, khóa không cho để trống.
  * Nếu hàng là sản phẩm mua ngoài (`Buy`): Bắt buộc phải cấu hình danh mục đơn vị mua (`Purchasing UOM`) và hệ số quy đổi tương ứng với đơn vị gốc.
- [ ] **Kiểm soát quy trình duyệt mã mới (Item Creation Workflow):** Thiết lập quy trình phê duyệt nhiều bước khi tạo mã mới. Mã mới tạo sẽ ở trạng thái `Draft/In-Active` (Chưa sẵn sàng hoạt động) cho đến khi được Trưởng phòng dữ liệu (MDM - Master Data Manager) kiểm tra quy cách và bấm phê duyệt hoạt động.
