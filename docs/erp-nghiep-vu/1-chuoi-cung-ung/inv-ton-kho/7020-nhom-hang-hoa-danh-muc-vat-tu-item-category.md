---
id: nhom-hang-hoa-danh-muc-vat-tu-item-category
title: Nhóm Hàng hóa và Danh mục Vật tư (Item Category) — Cơ chế hạch toán SLA, Phân cấp tài sản và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Nhóm Hàng hóa (Item Category)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/nhom-hang-hoa-item-category
sidebar_position: 7020
date: 2026-08-13
tags: [erp, inventory, item-category, part-class, product-group, sla, sql-audit, oracle-ebs, epicor]
---

# Nhóm Hàng hóa và Danh mục Vật tư (Item Category) — Cơ chế hạch toán SLA, Phân cấp tài sản và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Khi số lượng mã hàng hóa trong hệ thống ERP phình to lên hàng chục ngàn mã, kế toán không thể cấu hình tài khoản định khoản riêng biệt cho từng mã hàng cụ thể. Để giải quyết bài toán này, ERP sử dụng phân hệ **Nhóm hàng hóa / Danh mục vật tư (Item Category / Part Class / Product Group)** làm bộ lọc trung gian để phân loại tài sản và cấu hình hạch toán tự động.

Thiết lập cấu trúc phân nhóm hàng hóa là bước đi mang tính chiến lược trong dự án triển khai ERP. Nó không chỉ phục vụ cho việc xuất báo cáo phân tích số liệu của phòng thu mua, bán hàng, mà còn quyết định cách dòng tiền dịch chuyển tự động từ phân hệ Kho lên Sổ cái kế toán (GL).

---

## 1. Cơ chế hạch toán tự động dựa trên Phân nhóm hàng hóa (SLA)

Hệ thống ERP lớn ứng dụng cơ chế **Hạch toán kế toán tự động (SLA - Subledger Accounting / Posting Engine)** để định khoản các giao dịch kho. Thay vì gán tài khoản trực tiếp vào mã hàng, kế toán sẽ gán tài khoản vào **Nhóm hàng hóa**.

### Sự phân tách vai trò phân nhóm trong hệ thống (Ví dụ trên Epicor ERP):
* **Part Class (Nhóm hàng hóa/Tài sản):** Quản lý luồng hạch toán tài sản kho (Bảng cân đối kế toán). Khi nhập kho hoặc xuất kho nguyên vật liệu, hệ thống tự động tìm tài khoản tồn kho (ví dụ: 152, 155, 156) được cấu hình tại *Part Class* của mã hàng đó để định khoản.
* **Product Group (Nhóm sản phẩm/Doanh thu):** Quản lý luồng hạch toán doanh thu và giá vốn (Báo cáo kết quả kinh doanh P&L). Khi xuất hóa đơn bán hàng cho khách, hệ thống tự động tìm tài khoản doanh thu (511) và tài khoản giá vốn (632) được cấu hình tại *Product Group* của mã hàng đó để hạch toán.

### Đối với Oracle EBS:
Oracle sử dụng hệ thống **Category Sets** cực kỳ mạnh mẽ. Một mã hàng có thể nằm trong nhiều nhóm Category khác nhau tùy theo mục đích sử dụng:
* Nằm trong nhóm *Inventory Category* phục vụ hạch toán kho.
* Nằm trong nhóm *Purchasing Category* phục vụ phê duyệt hạn mức mua hàng của phòng mua sắm.
* Nằm trong nhóm *Costing Category* phục vụ cấu hình phân bổ chi phí giá thành.

---

## 2. Hai "Bẫy" thực chiến phá hủy hệ thống hạch toán tự động (SLA)

### ❌ Bẫy 1: "Vật tư bơ vơ" — Mã hàng hoạt động nhưng trống phân nhóm cấu hình tài khoản

**Tình huống:** Khi bộ phận Master Data tạo mới một mã thành phẩm trên máy, do vội vàng hoặc thiếu quy trình kiểm soát, họ đã lưu mã hàng nhưng **bỏ trống không chọn nhóm tài sản (Part Class / Category)**. Hệ thống vẫn cho phép lưu vì trường này không được thiết lập bắt buộc nhập cứng trên database.

* **Hậu quả tắc nghẽn kế toán:** 
  1. Khi thủ kho làm thủ tục nhập kho thành phẩm từ sản xuất (`Receipt from WO`), hệ thống ERP quét tìm tài khoản tồn kho (155) tại Part Class của mã hàng để định khoản nhưng kết quả trả về là rỗng (`Null`).
  2. Giao dịch nhập kho bị chặn cứng không cho phép Post sổ, hoặc tệ hơn là hệ thống tự động đẩy vào tài khoản tạm treo hệ thống (Suspense Account). 
  3. Cuối tháng, kế toán phải mất hàng tuần để rà soát thủ công hàng ngàn giao dịch bị treo chỉ vì một vài mã hàng "bơ vơ" không có phân nhóm kế toán.

---

### ❌ Bẫy 2: Bất đồng bộ giữa Thuộc tính vật lý và Phân nhóm hạch toán kế toán

**Tình huống:** Mã vật tư là thép cuộn được cấu hình thuộc tính vật lý là **Mua ngoài (Buy Item)** để phòng thu mua làm PO đặt hàng. Tuy nhiên, do chọn nhầm danh mục, mã hàng này lại bị gán vào nhóm tài sản **Thành phẩm tự sản xuất (Manufactured Class)**.

* **Hậu quả lệch sổ tài chính:** 
  * Khi nhập kho từ PO, hệ thống sẽ lấy tài khoản tồn kho thành phẩm (155) để hạch toán tăng tài sản thay vì lấy tài khoản nguyên vật liệu (152).
  * Đến cuối tháng, báo cáo chi tiết kho nguyên vật liệu thô thực tế bị thiếu hụt số liệu, báo cáo kho thành phẩm bị thừa số liệu ảo. Kế toán trưởng hoàn toàn bất lực trong việc giải trình chênh lệch tài sản trước cơ quan kiểm toán thuế vì "ngoài kho thực tế là thép thô nhưng trên sổ sách kế toán lại báo cáo là tủ thép thành phẩm".

---

## 3. Các câu lệnh SQL Audit thực chiến rà soát danh mục Phân nhóm hàng hóa

Hãy chạy các câu lệnh SQL dưới đây để rà soát và dọn sạch các mã hàng lỗi cấu hình phân nhóm trước mỗi kỳ chạy hạch toán cuối tháng:

---

### ❌ SQL Audit 1: Phát hiện các mã hàng đang hoạt động nhưng bị bỏ trống cấu hình phân nhóm tài sản/doanh thu
Tìm toàn bộ các mã hàng hóa đang ở trạng thái hoạt động (`Active`) nhưng trường nhóm tài sản (`Part Class / Inventory Category Set`) hoặc nhóm doanh thu (`Product Group`) đang bị rỗng.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `Part`):
```sql
SELECT 
    p.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả],
    p.TypeCode AS [Make/Buy],
    p.ClassID AS [Mã nhóm tài sản (Class)],
    p.ProdCode AS [Mã nhóm doanh thu (ProdGrup)]
FROM Erp.Part p
WHERE p.InActive = 0                                -- Chỉ quét các mã hàng đang hoạt động
  -- Tìm các mã hàng bị trống ClassID (tài sản) HOẶC ProdCode (doanh thu/giá vốn)
  AND (p.ClassID = '' OR p.ClassID IS NULL OR p.ProdCode = '' OR p.ProdCode IS NULL);
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_SYSTEM_ITEMS_B` & `MTL_ITEM_CATEGORIES`):
Quét các Item đang hoạt động nhưng không được gán vào bất kỳ Category nào của bộ Category Set mặc định dùng cho hạch toán tồn kho (`category_set_id = 1`).
```sql
SELECT 
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    msi.inventory_item_status_code AS status
FROM mtl_system_items_b msi
WHERE msi.inventory_item_status_code = 'Active'     -- Chỉ quét các vật tư đang hoạt động
  -- Lọc các Item hoạt động nhưng không tồn tại cấu hình Category cho Inventory Set (id = 1)
  AND NOT EXISTS (
      SELECT 1 
      FROM mtl_item_categories mic 
      WHERE mic.inventory_item_id = msi.inventory_item_id 
        AND mic.organization_id = msi.organization_id
        AND mic.category_set_id = 1                 -- 1: Inventory Category Set
  );
```

---

### ❌ SQL Audit 2: Phát hiện bất đồng bộ giữa thuộc tính Make/Buy và Phân nhóm tài sản
Tìm các trường hợp mã hàng là hàng mua ngoài (`Buy`) nhưng lại được gán vào nhóm tài sản của hàng tự sản xuất (`Manufactured/Finished Goods`), hoặc ngược lại, gây lệch hạch toán tài khoản kế toán 152/155.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    p.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả],
    p.TypeCode AS [Bản chất thực tế (M:Make/P:Buy)],
    p.ClassID AS [Mã nhóm tài sản gán sai],
    pc.Description AS [Mô tả nhóm tài sản]
FROM Erp.Part p
INNER JOIN Erp.PartClass pc 
    ON p.Company = pc.Company AND p.ClassID = pc.ClassID
WHERE -- Trường hợp 1: Hàng mua ngoài (P) nhưng gán vào nhóm Thành phẩm/Sản xuất
      (p.TypeCode = 'P' AND (pc.Description LIKE '%Manufactured%' OR pc.Description LIKE '%Thành phẩm%'))
   -- Trường hợp 2: Hàng tự sản xuất (M) nhưng gán vào nhóm Mua ngoài/Nguyên liệu
   OR (p.TypeCode = 'M' AND (pc.Description LIKE '%Purchased%' OR pc.Description LIKE '%Mua ngoài%'));
```

#### 💻 Code SQL dành cho Oracle EBS R12:
Cột `planning_make_buy_code = 1` là hàng tự sản xuất (Make), `= 2` là hàng mua ngoài (Buy).
```sql
SELECT 
    msi.segment1 AS item_code,
    msi.planning_make_buy_code AS [Bản chất (1:Make/2:Buy)],
    mc.segment1 || '.' || mc.segment2 AS category_name -- Tên nhóm vật tư
FROM mtl_system_items_b msi
INNER JOIN mtl_item_categories mic 
    ON msi.inventory_item_id = mic.inventory_item_id AND msi.organization_id = mic.organization_id
INNER JOIN mtl_categories_b mc 
    ON mic.category_id = mc.category_id
WHERE mic.category_set_id = 1                       -- Chỉ quét trên Inventory Category Set
  -- Trường hợp 1: Vật tư mua ngoài (2) nằm trong nhóm thành phẩm sản xuất (tên chứa MFG/FG/THANH_PHAM)
  AND ((msi.planning_make_buy_code = 2 AND (mc.segment1 LIKE '%MFG%' OR mc.segment1 LIKE '%FG%' OR mc.segment1 LIKE '%THANH_PHAM%'))
  -- Trường hợp 2: Vật tư tự sản xuất (1) nằm trong nhóm mua ngoài (tên chứa PURCHASE/RAW/MUA_NGOAI)
   OR (msi.planning_make_buy_code = 1 AND (mc.segment1 LIKE '%PURCHASE%' OR mc.segment1 LIKE '%RAW%' OR mc.segment1 LIKE '%MUA_NGOAI%')));
```

---

## 4. Checklist dành cho Developer khi phát triển phân hệ Item Category

- [ ] **Bắt buộc nhập phân nhóm hạch toán (Mandatory Class ID):** Khóa chức năng cho phép để trống trường nhóm tài sản (`Part Class / Inventory Category Set`) trên giao diện tạo mới mã hàng, bắt buộc người dùng phải chọn một phân nhóm hợp lệ mới cho phép lưu dữ liệu (Kịch bản 1).
- [ ] **Tự động kiểm tra tính bất đồng bộ (Compatibility Check):** Thiết lập hàm kiểm tra tự động trước khi lưu: Nếu người dùng chọn thuộc tính sản xuất là hàng mua ngoài (`Buy / Code 2`), nhưng lại chọn nhóm tài sản thuộc nhóm thành phẩm (`MFG/Finished Goods`), hệ thống sẽ tự động chặn lại và đưa ra cảnh báo lỗi (Kịch bản 2).
- [ ] **Khóa sửa danh mục khi có số dư tồn kho:** Đảm bảo hệ thống chặn không cho phép người dùng thay đổi nhóm tài sản (`Part Class`) của mã hàng hóa nếu mã hàng đó đang có số lượng tồn kho khác 0 thực tế ngoài kệ (tránh làm lệch báo cáo kế toán kho).
- [ ] **Thiết lập tài khoản đối ứng mặc định:** Khi tạo mới một nhóm hàng hóa (`Item Category`), lập trình giao diện bắt buộc bộ phận kế toán phải điền đầy đủ hệ thống tài khoản định khoản tự động (Tài khoản kho, tài khoản giá vốn, tài khoản chênh lệch...) trước khi cho phép kích hoạt (Active) nhóm hàng đó trên hệ thống.
