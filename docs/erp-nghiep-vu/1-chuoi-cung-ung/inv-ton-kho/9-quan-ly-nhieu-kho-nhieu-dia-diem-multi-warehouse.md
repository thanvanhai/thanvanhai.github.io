---
id: quan-ly-nhieu-kho-nhieu-dia-diem-multi-warehouse
title: Nghiệp vụ Quản lý Nhiều kho, Nhiều địa điểm (Multi-Warehouse) — Thiết lập Sites, Kho Ký gửi, Gia công ngoài và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Quản lý Nhiều kho (Multi-Warehouse)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/quan-ly-nhieu-kho
sidebar_position: 10
date: 2026-07-31
tags: [erp, inventory, multi-warehouse, multi-site, consignment, subcontracting, sql-audit, oracle-ebs, epicor]
---

# Nghiệp vụ Quản lý Nhiều kho, Nhiều địa điểm (Multi-Warehouse) — Thiết lập Sites, Kho Ký gửi, Gia công ngoài và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Khi doanh nghiệp phát triển đến một quy mô nhất định, họ không còn quản lý hàng hóa tập trung tại một nhà kho duy nhất. Hệ thống ERP bắt buộc phải mở rộng để quản lý **Nhiều kho, Nhiều địa điểm (Multi-Warehouse / Multi-Site / Multi-Organization)** bao gồm: Kho tổng, các kho chi nhánh, kho ký gửi tại đại lý, hay thậm chí là kho nguyên vật liệu đang gửi tại xưởng gia công ngoài của đối tác.

Dưới góc độ hệ thống, việc phân cấp và thiết lập cấu trúc tổ chức kho (Organization Hierarchy) quyết định cách dữ liệu tồn kho được tổng hợp lên Sổ cái (GL) và cách hệ thống hoạch định nhu cầu vật tư (MRP) vận hành.

---

## 1. Cấu trúc phân cấp tổ chức kho trong hệ thống ERP

Mỗi hệ thống ERP có cách gọi và phân cấp tổ chức kho khác nhau, nhưng bản chất đều tuân theo mô hình 3 cấp chính:

* **Cấp 1: Pháp nhân (Legal Entity / Company):** Đơn vị báo cáo tài chính cao nhất.
* **Cấp 2: Site / Plant / Inventory Org:** Địa điểm vật lý (Nhà máy, Chi nhánh, Trung tâm phân phối). Cấp này quyết định cách cấu hình lập lịch sản xuất, tính giá thành (Costing) riêng biệt.
* **Cấp 3: Warehouse / Subinventory:** Thư mục kho con bên trong một Site (ví dụ: Kho Nguyên liệu, Kho Thành phẩm, Kho Bảo hành, Kho Phế liệu).

### Bản đồ đối chiếu thuật ngữ:

| Hệ thống | Cấp 1 (Pháp nhân) | Cấp 2 (Nhà máy / Chi nhánh) | Cấp 3 (Kho con) |
| :--- | :--- | :--- | :--- |
| **Epicor ERP** | `Company` | `Site` (Plant) | `Warehouse` |
| **Oracle EBS** | `Operating Unit` (OU) | `Inventory Organization` (Org) | `Subinventory` |
| **SAP ERP** | `Company Code` | `Plant` | `Storage Location` |

---

## 2. Luồng nghiệp vụ đặc thù trong hệ thống Nhiều kho

### A. Hàng ký gửi (Consignment Inventory)
Doanh nghiệp có thể nhận hàng ký gửi từ Nhà cung cấp (chưa thanh toán tiền cho đến khi sử dụng) hoặc gửi hàng ký gửi tại Đại lý/Khách hàng (chưa xuất hóa đơn cho đến khi họ bán được hàng).
* **Bài toán hệ thống:** ERP phải ghi nhận số lượng hàng này trong On-hand Qty để thủ kho quản lý vị trí vật lý, nhưng **không được phép tính giá trị của chúng vào tài sản tồn kho của công ty** (Tài khoản 156/152) trên Sổ cái (GL) để tránh sai lệch báo cáo tài chính.

### B. Hàng gửi đi gia công ngoài (Subcontracting / Outside Processing - OSP)
Khi doanh nghiệp xuất nguyên vật liệu gửi sang nhà máy của đối tác gia công, số vật tư này đã rời khỏi nhà máy của bạn nhưng vẫn thuộc quyền sở hữu của bạn.
* **Bài toán hệ thống:** ERP phải thiết lập một **Kho gia công ngoài ảo (Subcontractor/Vendor Warehouse)**. Khi xuất hàng đi gia công, hệ thống làm lệnh chuyển kho nội bộ sang kho ảo này để kế toán theo dõi số lượng và giá trị dở dang ngoài nhà máy.

---

## 3. Ba "Bẫy" thực chiến trong dự án Multi-Warehouse

### ❌ Bẫy 1: "Nhận nhầm" và hạch toán sai giá trị Hàng ký gửi của nhà cung cấp

**Tình huống:** Nhà cung cấp gửi ký gửi **500 con chip** giá trị cao vào kho của bạn. Thủ kho do nhầm lẫn đã làm phiếu nhập kho mua hàng thường (`PO Receipt`) thay vì làm phiếu nhận hàng ký gửi (`Consignment Receipt`).

* **Hậu quả:** Hệ thống ERP lập tức hạch toán tăng tài sản tồn kho của công ty thêm hàng chục ngàn USD và sinh công nợ phải trả tạm tính (AP Accrual) khống. Đến cuối tháng, hệ thống MRP chạy quét và báo bộ phận mua hàng hủy các đơn mua chip mới vì "kho vẫn còn thừa 500 con", gây trễ tiến độ sản xuất thực tế khi 500 con chip ký gửi kia bị NCC thu hồi.
* **Giải pháp:** Sử dụng tính năng quản lý hàng ký gửi chuẩn (Consigned Inventory) của ERP để hệ thống tự động gắn cờ sở hữu (`Owner = Vendor`), ngăn không cho hạch toán tăng tài sản công ty khi chưa có giao dịch tiêu dùng (Consignment Consumption).

---

### ❌ Bẫy 2: Thất thoát vật tư khi gửi đi gia công ngoài (Subcontracting)

**Tình huống:** Bạn gửi **1.000 mét vải** sang xưởng đối tác để may áo. Tuy nhiên, hệ thống ERP của bạn không cấu hình kho gia công ngoài (Subcontractor Warehouse) mà kế toán sản xuất lại thực hiện giao dịch xuất thẳng nguyên vật liệu vào lệnh sản xuất (`Issue to Job`).

* **Hậu quả:** 1.000 mét vải biến mất khỏi hệ thống tồn kho của bạn ngay lập tức. Sau đó đối tác báo bị hỏng mất **100 mét vải** trong quá trình may, nhưng trên ERP của bạn không hề có số liệu theo dõi số vải đang nằm bên xưởng đối tác để đối chiếu và yêu cầu đền bù. Số vải hao hụt bị hòa tan vào giá thành sản phẩm một cách bất thường.

---

### ❌ Bẫy 3: Giao dịch điều chuyển liên công ty pháp nhân (Intercompany Transaction) bị lệch Thuế và Giá bán nội bộ

Khi bạn chuyển hàng giữa 2 kho thuộc **2 công ty khác nhau (Legal Entity A $\rightarrow$ Legal Entity B)** trong cùng một tập đoàn, đây không phải là giao dịch chuyển kho nội bộ thông thường.

* **Bẫy kế toán:** Giao dịch này bắt buộc phải là luồng **Mua bán nội bộ**: Công ty A xuất hóa đơn bán hàng nội bộ (Intercompany SO) cho Công ty B, và Công ty B làm phiếu nhập kho mua hàng nội bộ (Intercompany PO) kèm theo hóa đơn đầu vào. 
* **Hậu quả:** Nếu lập trình viên thiết lập đường đi tắt, cho phép thủ kho dùng lệnh chuyển kho 1 bước (Direct Transfer) để chuyển thẳng từ kho Công ty A sang kho Công ty B:
  * Hệ thống sẽ báo lỗi hạch toán kế toán vì hai công ty có hai mã số thuế và hệ thống kế toán hoàn toàn độc lập.
  * Vi phạm pháp luật về thuế vì di chuyển hàng hóa xuyên công ty mà không có hóa đơn chứng từ đối ứng.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát lỗi dữ liệu Nhiều kho

---

### ❌ SQL Audit 1: Phát hiện hàng ký gửi của Nhà cung cấp (Consignment) bị hạch toán nhầm thành tài sản công ty
Tìm các mã hàng đang nằm trong kho ký gửi của nhà cung cấp nhưng hệ thống lại ghi nhận thuộc sở hữu của doanh nghiệp (hoặc ngược lại).

#### 💻 Code SQL dành cho Epicor ERP:
Quét các kho được thiết lập là kho thuộc sở hữu của Nhà cung cấp (`VendorNum > 0`) để kiểm tra số dư tồn kho.
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho ký gửi],
    wh.Name AS [Tên kho],
    pb.PartNum AS [Mã sản phẩm],
    pb.OnhandQty AS [Số lượng tồn],
    v.Name AS [Nhà cung cấp chủ sở hữu]
FROM Erp.PartBin pb
INNER JOIN Erp.Warehouse wh 
    ON pb.Company = wh.Company AND pb.WarehouseCode = wh.WarehouseCode
INNER JOIN Erp.Vendor v 
    ON wh.Company = v.Company AND wh.VendorNum = v.VendorNum
WHERE wh.VendorNum > 0                         -- Chỉ lọc kho ký gửi liên kết với NCC
  AND pb.OnhandQty > 0;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
Trong Oracle EBS, hàng ký gửi của nhà cung cấp được gắn cờ sở hữu thông qua cột `owning_tp_type = 2` (2 nghĩa là Supplier owned) trong bảng số dư tồn kho chi tiết.
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    pov.vendor_name AS supplier_owner,                -- Tên nhà cung cấp sở hữu hàng
    SUM(moqd.transaction_quantity) AS consigned_qty
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
INNER JOIN ap_suppliers pov 
    ON moqd.owning_party_id = pov.vendor_id
WHERE moqd.owning_tp_type = 2                       -- 2: Consigned Inventory từ Nhà cung cấp
GROUP BY moqd.subinventory_code, msi.segment1, msi.description, pov.vendor_name
HAVING SUM(moqd.transaction_quantity) > 0;
```

---

### ❌ SQL Audit 2: Phát hiện vật tư gửi gia công ngoài (Subcontracting) bị "bỏ quên" tại kho đối tác
Quét số lượng nguyên vật liệu đang nằm tại các kho gia công ngoài (`Subcontractor / OSP` Warehouse) để cảnh báo cho bộ phận sản xuất đối chiếu định kỳ.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho gia công],
    wh.Name AS [Tên kho đối tác],
    pb.PartNum AS [Mã vật tư gửi đi],
    pb.OnhandQty AS [Số lượng đang gửi]
FROM Erp.PartBin pb
INNER JOIN Erp.Warehouse wh 
    ON pb.Company = wh.Company AND pb.WarehouseCode = wh.WarehouseCode
WHERE wh.WarehouseType = 'S'                        -- 'S' là loại kho Subcontractor trong Epicor
  AND pb.OnhandQty > 0;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    SUM(moqd.transaction_quantity) AS subcontractor_wip_qty
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
-- Quét các Subinventory được đặt tên đặc thù cho việc gia công ngoài (OSP hoặc GIA_CONG)
WHERE moqd.subinventory_code LIKE '%OSP%' OR moqd.subinventory_code LIKE '%GIA_CONG%'
GROUP BY moqd.subinventory_code, msi.segment1, msi.description
HAVING SUM(moqd.transaction_quantity) > 0;
```

---

## 5. Checklist dành cho Developer khi phát triển hệ thống Nhiều kho (Multi-Warehouse)

- [ ] **Kiểm soát quy tắc hạch toán tự động (GL Account Mapping):** Đảm bảo mỗi kho con (Warehouse/Subinventory) có thể cấu hình tài khoản kế toán riêng biệt để khi thủ kho điều chuyển hàng nội bộ giữa các kho, hệ thống tự động sinh bút toán hạch toán đúng tài khoản.
- [ ] **Tích hợp cờ Ký gửi (Consignment Flag):** Khi viết báo cáo Giá trị tồn kho cuối kỳ, bắt buộc phải viết câu lệnh loại trừ (Exclude) các dòng tồn kho có cờ sở hữu là Nhà cung cấp (`owning_tp_type = 2` hoặc `VendorNum > 0`) để tránh khống giá trị tài sản tồn kho của doanh nghiệp (Kịch bản 1).
- [ ] **Ràng buộc giao dịch liên công ty (Intercompany Mapping):** Khi phát triển tính năng chuyển kho, nếu phát hiện kho nguồn và kho đích thuộc hai Công ty khác nhau (Company Code/Legal Entity khác nhau), chặn không cho thực hiện lệnh chuyển kho trực tiếp, bắt buộc người dùng đi qua luồng Intercompany PO/SO (Kịch bản 3).
- [ ] **Báo cáo đối soát hao hụt gia công:** Thiết kế báo cáo đối soát tự động so sánh giữa lượng vật tư xuất gửi đi gia công (`Issue to OSP`) và lượng thành phẩm thực tế nhận về nhân với định mức BOM để phát hiện ngay các hao hụt bất thường tại kho đối tác (Kịch bản 2).
