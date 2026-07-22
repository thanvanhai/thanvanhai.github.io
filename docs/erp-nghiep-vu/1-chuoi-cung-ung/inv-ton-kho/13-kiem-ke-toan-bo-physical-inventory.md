---
id: kiem-ke-toan-bo-physical-inventory
title: Nghiệp vụ Kiểm kê Toàn bộ (Physical Inventory) — Quy trình Tag Counting, Đóng băng giao dịch và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Kiểm kê Toàn bộ (Physical Inventory)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/kiem-ke-toan-bo
sidebar_position: 14
date: 2026-08-03
tags: [erp, inventory, physical-inventory, tag-counting, system-lockout, audit, sql-audit, oracle-ebs, epicor]
---

# Nghiệp vụ Kiểm kê Toàn bộ (Physical Inventory) — Quy trình Tag Counting, Đóng băng giao dịch và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Khác với kiểm kê định kỳ cuốn chiếu (Cycle Counting), **Kiểm kê toàn bộ (Physical Inventory)** là sự kiện lớn thường diễn ra 1 hoặc 2 lần trong năm (vào giữa năm hoặc cuối năm tài chính). Để thực hiện nghiệp vụ này, doanh nghiệp bắt buộc phải dừng toàn bộ hoạt động xuất - nhập - sản xuất của nhà máy trong vòng 2 - 3 ngày để đếm chính xác từng sản phẩm đang có trong kho.

Dưới góc độ hệ thống ERP và kiểm toán tài chính, đây là giao dịch cực kỳ nhạy cảm. Kết quả kiểm kê toàn bộ sẽ được dùng để điều chỉnh trực tiếp giá trị tài sản hàng tồn kho trên báo cáo tài chính chính thức của doanh nghiệp trước khi gửi cho cơ quan Thuế và các bên kiểm toán độc lập.

---

## 1. Trái tim của kiểm kê toàn bộ: Quy trình Thẻ kiểm kê (Tag Counting)

Để tránh hiện tượng đếm sót hoặc đếm trùng trong một kho hàng khổng lồ, hệ thống ERP sử dụng cơ chế **Thẻ kiểm kê (Tag Counting / Physical Tags)**. Quy trình vận hành thẻ diễn ra nghiêm ngặt theo các bước sau:

1. **Khởi tạo và In thẻ (Generate & Print Tags):** Hệ thống tự sinh ra hàng ngàn mã thẻ kiểm kê có số Series độc nhất vô nhị (`Tag Number`) ứng với từng vị trí ô kệ và mã hàng hóa.
2. **Dán thẻ vật lý (Placing Tags):** Tổ kiểm kê đi dán các thẻ giấy này lên từng pallet, ô kệ tương ứng ngoài thực tế.
3. **Ghi nhận số đếm (Counting & Entering):** Tổ kiểm kê đếm hàng thực tế, viết số lượng đếm được lên thẻ giấy, sau đó gom phần cuống thẻ về cho tổ nhập liệu nhập vào hệ thống ERP.
4. **Đối chiếu và Duyệt (Reconciliation & Posting):** Hệ thống so sánh tổng số lượng đếm được trên các thẻ với số lượng tồn kho lúc đóng băng trên ERP để tính chênh lệch (Variance) và tiến hành duyệt Post điều chỉnh kho.

---

## 2. Nguyên tắc Đóng băng hệ thống tuyệt đối (System Lockout)

Trong suốt thời gian kiểm kê, hệ thống ERP bắt buộc phải được đặt trong trạng thái **Đóng băng giao dịch kho (System Lockout)**.

* **Nguyên tắc cốt lõi:** Tuyệt đối không được phát sinh bất kỳ giao dịch xuất kho bán hàng (`Shipment`), nhận hàng mua (`Receipt`), hay xuất vật tư cho sản xuất (`Issue`) nào trong thời gian đếm hàng thực tế.
* **Tại sao phải làm vậy?** Nếu thủ kho vừa đi đếm hàng, hệ thống trên máy lại vừa nhảy số lượng do các phòng ban khác thao tác, số dư tồn kho hệ thống (Snapshot) tại thời điểm đối chiếu sẽ bị sai lệch hoàn toàn, làm vô hiệu hóa kết quả đếm thực tế của tổ kiểm kê.

---

## 3. Hai "Bẫy" thực chiến kinh điển trong đợt kiểm kê toàn bộ

### ❌ Bẫy 1: Thảm họa "Mất thẻ kiểm kê" (Missing/Unreturned Tags)

Trong một đợt kiểm kê lớn, hàng ngàn thẻ giấy được in ra và phân phát cho hàng chục nhân sự đi đếm hàng ở các khu vực khác nhau.

* **Tình huống:** Một nhân viên kiểm kê đếm xong một pallet hàng trị giá **50.000 USD**, viết số lượng lên thẻ nhưng vô tình **làm rơi mất tờ thẻ giấy** này trên đường mang về tổ nhập liệu.
* **Hậu quả thảm khốc:** Vì tờ thẻ đó không được nhập số đếm lên ERP, hệ thống mặc định coi như số thực đếm của vị trí đó bằng **0**. Khi chạy đối chiếu chênh lệch, ERP sẽ hiểu là vị trí đó bị mất sạch hàng và tự động tạo giao dịch điều chỉnh giảm mất mát tài sản trị giá 50.000 USD. Do doanh nghiệp đếm quá nhiều mặt hàng, lỗi này rất dễ bị chìm xuôi nếu không có câu lệnh rà soát thẻ bị mất.
* **Giải pháp:** Hệ thống bắt buộc phải quản lý trạng thái của 100% thẻ được in ra: Thẻ nào đã nhập số đếm (`Used`), thẻ nào bị hỏng hủy bỏ (`Voided`), tuyệt đối không được phép còn thẻ nào ở trạng thái "Đã in nhưng chưa nhập" (`Unreturned`).

---

### ❌ Bẫy 2: Trùng lặp ghi nhận số liệu trên thẻ (Duplicate Tag Entry)

**Tình huống:** Do phân chia khu vực kiểm kê không rõ ràng, Tổ kiểm kê 1 đi qua dãy kệ A đếm dòng bu-lông và dán thẻ số `TAG-001`. Tổ kiểm kê 2 đi qua sau đó thấy pallet đó chưa được gom cuống thẻ, liền đếm lại một lần nữa và dán thêm thẻ số `TAG-002`. Tổ nhập liệu nhập cả 2 thẻ này lên ERP.

* **Hậu quả:** Số lượng tồn kho thực tế của mã bu-lông đó bị **nhân đôi ảo** trên hệ thống, làm giá trị tồn kho của doanh nghiệp tăng vọt sai thực tế.
* **Giải pháp:** Phải có cơ chế kiểm tra (Validation) trên hệ thống: Cảnh báo hoặc chặn nếu phát hiện có từ 2 thẻ kiểm kê khác nhau cùng được nhập số đếm cho cùng một mã hàng tại cùng một vị trí ô kệ vật lý (trừ trường hợp hàng ký gửi có nhiều chủ sở hữu).

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát kỳ Kiểm kê toàn bộ

Khi kỳ kiểm kê đang diễn ra (hoặc chuẩn bị duyệt Post chênh lệch), Admin hệ thống hoặc kiểm toán viên cần chạy ngay 2 câu lệnh SQL dưới đây để quét lỗi dữ liệu:

---

### ❌ SQL Audit 1: Phát hiện các thẻ kiểm kê bị mất hoặc "quên" chưa nhập số liệu (Missing/Unreturned Tags)
Tìm toàn bộ các thẻ kiểm kê đã được in ra hệ thống nhưng chưa được tổ kiểm kê trả lại để nhập số đếm thực tế (và thẻ đó không bị đánh dấu hủy - Void).

#### 💻 Code SQL dành cho Epicor ERP (Bảng `TagCnt`):
```sql
SELECT 
    tc.TagNum AS [Số thẻ bị thiếu],
    tc.WarehouseCode AS [Mã kho],
    tc.BinNum AS [Vị trí ô kệ],
    tc.PartNum AS [Mã sản phẩm],
    tc.BaseQty AS [Tồn hệ thống lúc đóng băng]
FROM Erp.TagCnt tc
WHERE tc.TagReturned = 0                            -- Thẻ chưa được trả lại để nhập số đếm
  AND tc.VoidTag = 0                                -- Thẻ này không bị hủy bỏ
  AND tc.Company = 'your_company_code';             -- Điền mã công ty của bạn
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_PHYSICAL_INVENTORY_TAGS`):
```sql
SELECT 
    mpi.physical_inventory_name AS pi_name,
    mpit.tag_number AS [Số thẻ bị thiếu],
    mpit.subinventory AS subinventory,
    msi.segment1 AS item_code,
    mpit.system_quantity AS frozen_sys_qty          -- Tồn hệ thống lúc đóng băng
FROM mtl_physical_inventory_tags mpit
INNER JOIN mtl_physical_inventories mpi 
    ON mpit.physical_inventory_id = mpi.physical_inventory_id
INNER JOIN mtl_system_items_b msi 
    ON mpit.inventory_item_id = msi.inventory_item_id AND mpit.organization_id = msi.organization_id
WHERE mpit.void_flag = 'N'                          -- Thẻ không bị hủy bỏ
  AND mpit.entered_flag = 'N'                       -- Thẻ chưa được nhập số thực đếm
  AND mpi.physical_inventory_name = 'your_pi_name'; -- Điền tên đợt kiểm kê toàn bộ của bạn
```

---

### ❌ SQL Audit 2: Phát hiện trùng lặp ghi nhận số liệu thẻ trên cùng một ô kệ (Duplicate Tag Entries)
Tìm các trường hợp một ô kệ chứa hàng bị đếm trùng và nhập số liệu từ 2 thẻ khác nhau trở lên, gây nhân đôi giá trị tồn kho ảo.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    tc.WarehouseCode AS [Mã kho],
    tc.BinNum AS [Vị trí ô kệ],
    tc.PartNum AS [Mã sản phẩm],
    COUNT(tc.TagNum) AS [Số lượng thẻ phát sinh],
    -- Gộp danh sách các số thẻ bị đếm trùng hiển thị trên 1 dòng
    STRING_AGG(CAST(tc.TagNum AS VARCHAR), ', ') AS [Danh sách mã thẻ đếm trùng]
FROM Erp.TagCnt tc
WHERE tc.VoidTag = 0 
  AND tc.TagReturned = 1                             -- Chỉ quét các thẻ đã nhập số đếm
GROUP BY tc.Company, tc.WarehouseCode, tc.BinNum, tc.PartNum
HAVING COUNT(tc.TagNum) > 1;                       -- Lọc các vị trí bị đếm từ 2 thẻ trở lên
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    mpit.subinventory AS subinventory,
    mpit.locator_id AS locator,
    msi.segment1 AS item_code,
    COUNT(mpit.tag_number) AS tag_count             -- Số lượng thẻ phát sinh tại vị trí
FROM mtl_physical_inventory_tags mpit
INNER JOIN mtl_system_items_b msi 
    ON mpit.inventory_item_id = msi.inventory_item_id AND mpit.organization_id = msi.organization_id
WHERE mpit.void_flag = 'N' 
  AND mpit.entered_flag = 'Y'                       -- Chỉ quét các thẻ đã nhập số đếm
GROUP BY mpit.organization_id, mpit.subinventory, mpit.locator_id, msi.segment1
HAVING COUNT(mpit.tag_number) > 1;                  -- Lọc các vị trí bị đếm từ 2 thẻ trở lên
```

---

## 5. Checklist dành cho Developer khi phát triển phân hệ Physical Inventory

- [ ] **Khóa cứng tính năng tạo giao dịch kho:** Viết logic kiểm tra (Validation Rule) chặn đứng mọi giao dịch chuyển dịch kho (Nhập, Xuất, Sản xuất) có ngày giao dịch nằm trong khoảng thời gian diễn ra đợt kiểm kê toàn bộ đang mở.
- [ ] **Ràng buộc kiểm tra trạng thái thẻ (No Missing Tags):** Tuyệt đối không cho phép kế toán trưởng bấm nút duyệt Post chênh lệch kiểm kê (`Post Physical Inventory Variance`) nếu hệ thống kiểm tra vẫn còn tồn tại thẻ kiểm kê ở trạng thái chưa nhập số đếm (`entered_flag = 'N'` hoặc `TagReturned = 0`) mà không bị hủy (Kịch bản 1).
- [ ] **Cảnh báo đếm trùng (Duplicate Warning):** Thiết lập cảnh báo đỏ trên giao diện nhập liệu thẻ kiểm kê nếu người dùng nhập số đếm cho một vị trí ô kệ đã được ghi nhận số đếm từ một mã thẻ trước đó (Kịch bản 2).
- [ ] **Sao lưu số dư tồn kho (Snapshot Backup):** Luôn tự động sao lưu số dư On-hand Qty của toàn bộ hệ thống vào một bảng tạm (History Table) tại thời điểm bấm nút Đóng băng (Freeze) để phục vụ việc đối soát, đối chiếu số liệu sau này khi có thanh tra Thuế hoặc Kiểm toán độc lập yêu cầu.
