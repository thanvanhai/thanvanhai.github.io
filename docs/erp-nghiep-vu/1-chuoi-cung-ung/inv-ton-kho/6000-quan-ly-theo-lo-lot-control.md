---
id: quan-ly-theo-lo-lot-control
title: Nghiệp vụ Quản lý theo Lô (Lot Control) — Truy xuất nguồn gốc, Quy trình FEFO và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Quản lý theo Lô (Lot Control)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/quan-ly-theo-lo
sidebar_position: 6000
date: 2026-08-08
tags: [erp, inventory, lot-control, fefo, traceability, quarantine, expiry-date, sql-audit, oracle-ebs, epicor]
---

# Nghiệp vụ Quản lý theo Lô (Lot Control) — Truy xuất nguồn gốc, Quy trình FEFO và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong các ngành công nghiệp đặc thù như Dược phẩm, Thực phẩm & Đồ uống (F&B), Hóa chất, và Chế tạo linh kiện điện tử, việc quản lý hàng hóa theo số lượng đơn thuần là hoàn toàn chưa đủ. Các ngành này bắt buộc phải áp dụng phân hệ **Quản lý theo Lô (Lot/Batch Control)** để theo dõi chặt chẽ từng nhóm sản phẩm có cùng đặc tính sản xuất và thời hạn sử dụng.

Dưới góc nhìn hệ thống ERP và quản lý chất lượng, số Lô (Lot Number) là "chìa khóa" cốt lõi phục vụ cho việc **Truy xuất nguồn gốc (Traceability)**. Khi xảy ra sự cố chất lượng, hệ thống phải ngay lập tức truy vết được lô hàng lỗi được làm từ nguyên liệu của nhà cung cấp nào (Upstream) và đã được xuất bán cho những khách hàng nào (Downstream) để tiến hành thu hồi.

---

## 1. Vòng đời và Thuộc tính của một Số Lô (Lot Life Cycle) trên ERP

Khi một mặt hàng được thiết lập thuộc tính quản lý theo Lô (`Lot Controlled`), hệ thống ERP sẽ bắt buộc người dùng phải gán hoặc tự sinh một số Lô độc nhất tại mọi điểm nhập kho (nhập từ PO hoặc nhập từ lệnh sản xuất WO).

### Các thuộc tính quan trọng của Lô dữ liệu (Lot Attributes):
1. **Origination Date (Ngày khởi tạo/Ngày sản xuất):** Ngày lô hàng thực tế được đóng gói hoặc sản xuất xong.
2. **Expiration Date (Ngày hết hạn - Expiry Date):** Ngày sản phẩm hết hạn sử dụng. Vượt quá ngày này, ERP sẽ tự động khóa không cho phép xuất kho bán hàng.
3. **Retest Date (Ngày tái kiểm tra):** Ngày bộ phận QC phải ra kho lấy mẫu kiểm tra lại chất lượng để gia hạn thời hạn sử dụng.
4. **Lot Status (Trạng thái lô):** `Active` (Khả dụng), `Quarantine` (Chờ kiểm định), `Blocked` (Bị khóa/Không cho phép xuất).

### Bản đồ dữ liệu quản lý Lô giữa các hệ thống ERP:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Bảng danh mục Lô gốc** | `Erp.PartLot` | `MTL_LOT_NUMBERS` | `MCHA` (Batch Master tại Plant) |
| **Bảng số dư tồn kho theo Lô** | `Erp.PartBin` (Chứa cột `LotNum`) | `MTL_ONHAND_QUANTITIES_DETAIL` | `LQUA` / `MARD` (Hiển thị Batch) |

---

## 2. Chiến lược xuất kho FEFO (First Expired, First Out) vs FIFO

Đối với hàng hóa thông thường, ta áp dụng phương pháp **FIFO (Nhập trước, Xuất trước)** để tránh tồn kho lâu năm. Tuy nhiên, đối với hàng hóa có hạn sử dụng (phẩm màu, hóa chất, sữa, thuốc), ERP bắt buộc phải áp dụng chiến lược xuất kho **FEFO (First Expired, First Out - Hết hạn trước, Xuất trước)**.

* **Cơ chế hoạt động:** Khi phân xưởng làm lệnh yêu cầu cấp nguyên liệu cho sản xuất, hệ thống WMS sẽ quét qua danh sách các Lô tồn kho thực tế, tự động chỉ định thủ kho ra vị trí của lô có **Ngày hết hạn (`Expiration Date`) gần nhất** để lấy hàng, bất kể lô đó được nhập kho trước hay nhập kho sau.

---

## 3. Hai "Bẫy" thực chiến phá hủy quy trình quản lý Lô

### ❌ Bẫy 1: Hàng hết hạn sử dụng bị "bỏ quên" và xuất nhầm đi bán (Expired Lot Issue)

**Tình huống:** Trong kho đang tồn **100 hộp nguyên liệu hóa chất** đã hết hạn sử dụng từ ngày hôm qua. Do hệ thống ERP cấu hình lỏng lẻo (hoặc lập trình viên bỏ qua bước check hạn sử dụng của Lô tại các màn hình xuất kho), thủ kho vẫn quét mã xuất lô hàng này đi giao cho khách hoặc đưa vào dây chuyền sản xuất bình thường.

* **Hậu quả nghiêm trọng:** 
  1. Nếu đưa vào sản xuất: Làm hỏng toàn bộ lô thành phẩm đầu ra, gây thiệt hại hàng ngàn USD chi phí hủy hàng.
  2. Nếu xuất bán cho khách hàng: Doanh nghiệp đối mặt với rủi ro bị kiện tụng pháp lý, thu hồi sản phẩm hàng loạt (Product Recall) và hủy hoại uy tín thương hiệu.
* **Giải pháp:** Viết các điều kiện chặn (Validation Rules) cứng trên Database: Khóa không cho phép phê duyệt hoặc lưu bất kỳ giao dịch xuất kho nào (`STK-CUS`, `STK-MTL`) nếu `Lot.ExpirationDate < TransactionDate`.

---

### ❌ Bẫy 2: Đứt gãy chuỗi truy xuất nguồn gốc do xuất kho "quên" gán số Lô (Broken Traceability)

**Tình huống:** Mặt hàng bu-lông hàng không được cấu hình bắt buộc quản lý theo Lô để theo dõi chứng chỉ chất lượng mác thép. Khi làm phiếu xuất vật tư cho sản xuất (`Issue to Job`), công nhân xưởng cần gấp nên thủ kho đã làm phiếu xuất kho thô trên ERP nhưng **bỏ trống không nhập số Lô (Lot Number = rỗng/null)**. Hệ thống vẫn cho lưu vì lập trình viên không bắt buộc trường Lot phải có dữ liệu.

* **Hậu quả mất dấu vết:** 3 tháng sau, máy bay gặp sự cố do nứt bu-lông. Cơ quan điều tra yêu cầu nhà máy truy xuất nguồn gốc xem lô bu-lông lỗi này được làm từ mác thép của nhà cung cấp nào. Khi quét lịch sử giao dịch trên ERP, dòng xuất kho vật tư bị trống thông tin Lot, chuỗi truy xuất nguồn gốc bị đứt gãy hoàn toàn. Nhà máy không thể chứng minh được quy trình sản xuất đạt chuẩn và phải gánh chịu toàn bộ trách nhiệm pháp lý.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát nghiệp vụ quản lý Lô

Định kỳ, bộ phận QA (Quản lý chất lượng) hoặc Admin hệ thống cần chạy các câu lệnh SQL dưới đây để quét lỗi dữ liệu số Lô:

---

### ❌ SQL Audit 1: Phát hiện hàng hóa đã hết hạn sử dụng vẫn đang tồn kho khả dụng (Expired Lots in Stock)
Tìm toàn bộ các mã hàng đang có số lượng On-hand thực tế lớn hơn 0 trong kho nhưng số Lô tương ứng đã bị quá hạn sử dụng so với thời điểm hiện tại.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartBin` & `PartLot`):
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ],
    pb.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả],
    pb.LotNum AS [Số Lô],
    pl.ExpirationDate AS [Ngày hết hạn sử dụng],
    pb.OnhandQty AS [Số lượng tồn kho]
FROM Erp.PartBin pb
INNER JOIN Erp.Part p 
    ON pb.Company = p.Company AND pb.PartNum = p.PartNum
INNER JOIN Erp.PartLot pl 
    ON pb.Company = pl.Company AND pb.PartNum = pl.PartNum AND pb.LotNum = pl.LotNum
WHERE pb.OnhandQty > 0
  AND pl.ExpirationDate IS NOT NULL
  AND pl.ExpirationDate < CURRENT_TIMESTAMP          -- Ngày hết hạn nhỏ hơn thời điểm hiện tại
ORDER BY pl.ExpirationDate ASC;
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_ONHAND_QUANTITIES_DETAIL` & `MTL_LOT_NUMBERS`):
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    moqd.locator_id AS locator,
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    moqd.lot_number AS lot_no,
    mln.expiration_date AS expiry_date,             -- Ngày hết hạn sử dụng của Lô
    SUM(moqd.transaction_quantity) AS onhand_qty
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
INNER JOIN mtl_lot_numbers mln 
    ON moqd.inventory_item_id = mln.inventory_item_id 
    AND moqd.lot_number = mln.lot_number 
    AND moqd.organization_id = mln.organization_id
WHERE mln.expiration_date IS NOT NULL
  AND mln.expiration_date < TRUNC(SYSDATE)          -- Đã hết hạn sử dụng so với ngày hiện tại
GROUP BY moqd.subinventory_code, moqd.locator_id, msi.segment1, msi.description, moqd.lot_number, mln.expiration_date
HAVING SUM(moqd.transaction_quantity) > 0
ORDER BY mln.expiration_date ASC;
```

---

### ❌ SQL Audit 2: Phát hiện các giao dịch bị rỗng số Lô của vật tư bắt buộc quản lý Lô (Broken Traceability)
Quét lịch sử giao dịch kho để tìm các dòng xuất/nhập thực tế có số lượng khác 0 nhưng trường thông tin số Lô bị trống (`Null` hoặc `Blank`) đối với các mặt hàng bắt buộc quản lý Lô trên hệ thống.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartTran`):
```sql
SELECT 
    pt.TranDate AS [Ngày giao dịch],
    pt.PackNum AS [Số chứng từ],
    pt.PartNum AS [Mã hàng],
    pt.TranType AS [Loại giao dịch],
    pt.TranQty AS [Số lượng],
    pt.LotNum AS [Số Lô ghi nhận]
FROM Erp.PartTran pt
INNER JOIN Erp.PartPlant pp 
    ON pt.Company = pp.Company AND pt.PartNum = pp.PartNum AND pt.Plant = pp.Plant
WHERE pp.LotTrack = 1                               -- 1: Vật tư cấu hình bắt buộc quản lý theo Lô
  AND (pt.LotNum IS NULL OR pt.LotNum = '')         -- Lỗi: Bị rỗng/null số Lô khi giao dịch
  AND pt.TranQty <> 0
ORDER BY pt.TranDate DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
Trong Oracle, `lot_control_code = 2` tương ứng với thiết lập bắt buộc quản lý Lô đầy đủ (Full Lot Control).
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS tx_date,
    msi.segment1 AS item_code,
    mmt.transaction_quantity AS tx_qty,
    msi.lot_control_code
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE msi.lot_control_code = 2                      -- 2: Bắt buộc quản lý theo Lô
  AND mmt.lot_number IS NULL                        -- Lỗi: Trường số Lô bị trống
  AND mmt.transaction_quantity <> 0
ORDER BY mmt.transaction_date DESC;
```

---

## 5. Checklist dành cho Developer khi phát triển phân hệ Lot Control

- [ ] **Chặn cứng xuất hàng hết hạn:** Khi viết logic cho các giao dịch xuất kho (`STK-CUS`, `STK-MTL`, `STK-STK`), bắt buộc viết câu lệnh kiểm tra (Validation Rule) so sánh ngày hết hạn của Lô với ngày giao dịch thực tế, chặn không cho lưu nếu Lô đã hết hạn (Kịch bản 1).
- [ ] **Ràng buộc trường số Lô bắt buộc (Mandatory Lot Field):** Nếu mặt hàng được cấu hình `LotTrack = 1` (Epicor) hoặc `lot_control_code = 2` (Oracle), giao diện nhập liệu của mọi nghiệp vụ kho bắt buộc phải để trường Số Lô ở trạng thái bắt buộc nhập (Required Field), không cho phép để trống (Kịch bản 2).
- [ ] **Tự động gán trạng thái Quarantine:** Khi làm phiếu nhập kho thành phẩm từ sản xuất (`Receipt from WO`) hoặc nhập hàng mua từ PO (`Receipt from PO`), hệ thống phải tự động gán trạng thái của Số Lô mới sinh là `Quarantine` (Chờ kiểm định), không cho phép xuất bán cho đến khi có xác nhận đạt chất lượng (Passed) từ QC.
- [ ] **Hỗ trợ thuật toán FEFO khi Picking:** Khi viết truy vấn gợi ý vị trí lấy hàng bán cho thủ kho, luôn sắp xếp danh sách các Lô tồn kho theo thứ tự ngày hết hạn tăng dần (`ORDER BY ExpirationDate ASC`) để hỗ trợ tối đa quy trình FEFO thực tế.
