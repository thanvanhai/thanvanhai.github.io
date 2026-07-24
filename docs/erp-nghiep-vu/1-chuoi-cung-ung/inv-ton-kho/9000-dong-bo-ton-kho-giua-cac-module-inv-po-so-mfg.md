---
id: dong-bo-ton-kho-giua-cac-module-inv-po-so-mfg
title: Đồng bộ Tồn kho giữa các Module (INV ↔ PO ↔ SO ↔ MFG) 
description: Điểm chạm dữ liệu, Bẫy đứt gãy hệ thống và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Đồng bộ liên Module (INV-PO-SO-MFG)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/dong-bo-lien-module
sidebar_position: 9000
date: 2026-08-19
tags: [erp, inventory, integration, sales-order, purchase-order, production-order, subledger, sql-audit, oracle-ebs, epicor]
---

# 9000 Đồng bộ Tồn kho giữa các Module (INV ↔ PO ↔ SO ↔ MFG)

> Điểm chạm dữ liệu, Bẫy đứt gãy hệ thống và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Một hệ thống ERP không phải là tập hợp các phần mềm rời rạc. Sức mạnh lớn nhất của ERP nằm ở tính **Tích hợp thời gian thực (Real-time Integration)**. Một giao dịch phát sinh ở phân hệ này sẽ lập tức kích hoạt sự thay đổi trạng thái và số liệu ở phân hệ khác. Trong đó, phân hệ **Tồn kho (INV)** đóng vai trò là "trái tim" trao đổi dữ liệu với Mua hàng (PO), Bán hàng (SO) và Sản xuất (MFG).

Tuy nhiên, trong môi trường vận hành thực tế với hàng triệu giao dịch, luồng tích hợp này rất dễ bị **đứt gãy dữ liệu (Data Desynchronization)** do lỗi thao tác của người dùng, bug code tùy biến của developer, hoặc lỗi xung đột khóa bảng (Database Locking) khi hệ thống xử lý đồng thời.

---

## 1. Bản đồ điểm chạm dữ liệu chéo Module (Integration Touchpoints)

Hãy nhìn vào cách số liệu tồn kho khả dụng (`Qty Available`) được tính toán động trên ERP:

$$\text{Qty Available} = \text{Qty On-Hand (INV)} + \text{Qty On-Order (PO)} - \text{Qty Allocated (SO)} - \text{Qty WIP Demand (MFG)}$$

* **Điểm chạm INV $\leftrightarrow$ PO (Procurement):** Khi PO được duyệt $\rightarrow$ Tăng `On-Order Qty`. Khi làm phiếu nhập kho `PO Receipt` $\rightarrow$ Giảm `On-Order Qty` và tăng tài sản `On-Hand Qty` (INV).
* **Điểm chạm INV $\leftrightarrow$ SO (Sales):** Khi đơn hàng SO được duyệt $\rightarrow$ Tăng `Allocated Qty` (Giữ hàng). Khi thủ kho làm phiếu xuất hàng `Shipment` $\rightarrow$ Giảm `Allocated Qty` và giảm tài sản `On-Hand Qty` (INV).
* **Điểm chạm INV $\leftrightarrow$ MFG (Manufacturing):** Khi lệnh sản xuất WO được duyệt $\rightarrow$ Tăng `WIP Demand` (Nhu cầu nguyên liệu). Khi làm phiếu xuất vật tư `Issue to Job` $\rightarrow$ Giảm `WIP Demand`, giảm tài sản `On-Hand Qty` (INV) và tăng giá trị `WIP` (MFG).

---

## 2. Ba kịch bản đứt gãy đồng bộ dữ liệu kinh điển

### ❌ Kịch bản 1: Thảm họa "Giữ hàng ảo" trên đơn bán hàng (Ghost Sales Reservations)

**Tình huống:** Nhân viên kinh doanh tạo đơn SO bán 100 sản phẩm. Hệ thống tự động khóa giữ hàng (`Allocated Qty = 100`). Sau đó, khách hàng hủy đơn. Nhân viên kinh doanh bấm nút **Hủy dòng SO (Cancel Line)** hoặc **Đóng SO (Close SO)** trên máy. Do lỗi đồng bộ giữa phân hệ SO và INV, hệ thống quên không giải phóng số lượng giữ hàng này.

* **Hậu quả đứt gãy:** 100 sản phẩm này mặc dù thực tế vẫn nằm yên trong kho, nhưng trên ERP luôn hiển thị trạng thái `Allocated Qty = 100` và `Available Qty = 0`. Nhân viên kinh doanh khác không thể bán được lô hàng này cho khách mới. Tồn kho ảo bị đóng băng vĩnh viễn trên máy.

---

### ❌ Kịch bản 2: Lệch dở dang sản xuất (WIP Ledger Mismatch) trên các Lệnh đã đóng

**Tình huống:** Phân xưởng chạy một lệnh sản xuất (Job/WO) để may áo. Kế toán sản xuất đã bấm **Đóng hoàn toàn lệnh sản xuất (Closed)** trên ERP. 

* **Hậu quả đứt gãy:** Theo đúng quy tắc hệ thống, khi đóng Job, ERP phải chạy tiến độ dọn sạch tài khoản dở dang (`WIP Clearing`), kết chuyển toàn bộ chênh lệch thừa/thiếu sang tài khoản chênh lệch (`Variance`). Tuy nhiên, do lỗi luồng hạch toán tùy biến, hệ thống đóng Job nhưng **số dư tài khoản WIP dở dang của Job đó trên Sổ cái vẫn khác 0**. Kế toán trưởng không thể làm sạch tài khoản 154 cuối tháng.

---

### ❌ Kịch bản 3: Hủy phiếu nhập kho PO sau khi kế toán đã ghi nhận hóa đơn (Invoice Matching Mismatch)

**Tình huống:** Thủ kho làm phiếu nhận hàng PO thực tế 100 cái (`PO Receipt`). Kế toán AP đã lấy số liệu nhận hàng này để đối chiếu và ghi nhận hóa đơn nhà cung cấp (`AP Invoice`). Tuy nhiên ngày hôm sau, thủ kho phát hiện nhập sai thông tin và **bấm nút Xóa/Hủy phiếu nhận hàng (Void Receipt)** trên ERP.

* **Hậu quả đứt gãy:** Hệ thống INV cho phép hủy phiếu và trừ đi 100 cái trong kho, nhưng phân hệ Kế toán AP đã chốt hóa đơn nợ 100 cái của NCC trước đó vẫn tồn tại. Việc này gây ra sự lệch khớp nghiêm trọng giữa công nợ thực tế phải trả và số liệu hàng tồn kho thực tế nhập về.

---

## 3. Các câu lệnh SQL Audit rà soát đứt gãy dữ liệu liên Module

Định kỳ hàng tuần, Admin hệ thống hoặc kiểm toán viên nội bộ cần chạy các câu lệnh SQL dưới đây để phát hiện sớm các điểm đứt gãy dữ liệu chéo phân hệ:

---

### ❌ SQL Audit 1: Phát hiện lỗi "Giữ hàng ảo" trên các đơn SO đã đóng/hủy (Ghost Sales Reservations)
Quét toàn bộ các dòng lưu số dư giữ hàng (Allocations/Reservations) trên ERP đang liên kết với các đơn hàng SO đã bị đóng (`Closed`) hoặc hủy (`Cancelled`) ở phân hệ bán hàng.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pw.WarehouseCode AS [Mã kho],
    pw.PartNum AS [Mã sản phẩm],
    pw.AllocQty AS [Lượng giữ hàng tổng (PartWhse)],
    -- Tính tổng số giữ hàng thực tế từ các đơn hàng SO đang mở hoạt động
    COALESCE((SELECT SUM(oa.AllocQty) 
              FROM Erp.OrderAlloc oa 
              INNER JOIN Erp.OrderHed oh ON oa.Company = oh.Company AND oa.OrderNum = oh.OrderNum
              WHERE oa.Company = pw.Company 
                AND oa.PartNum = pw.PartNum 
                AND oa.WarehouseCode = pw.WarehouseCode
                AND oh.OpenOrder = 1), 0) AS [Tổng giữ thực tế từ SO mở]
FROM Erp.PartWhse pw
WHERE pw.Company = 'your_company_code'
  -- Lỗi: Lượng giữ hàng ghi nhận trên tổng kho khác với tổng lượng giữ thực tế từ các đơn SO đang mở
  AND pw.AllocQty <> COALESCE((SELECT SUM(oa.AllocQty) 
                               FROM Erp.OrderAlloc oa 
                               INNER JOIN Erp.OrderHed oh ON oa.Company = oh.Company AND oa.OrderNum = oh.OrderNum
                               WHERE oa.Company = pw.Company 
                                 AND oa.PartNum = pw.PartNum 
                                 AND oa.WarehouseCode = pw.WarehouseCode
                                 AND oh.OpenOrder = 1), 0);
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    mr.subinventory_code AS subinventory,
    msi.segment1 AS item_code,
    SUM(mr.primary_reservation_quantity) AS ghost_reserved_qty, -- Số lượng giữ hàng bị treo ảo
    ooh.order_number AS so_number,
    ooh.flow_status_code AS order_status
FROM mtl_reservations mr
INNER JOIN mtl_system_items_b msi 
    ON mr.inventory_item_id = msi.inventory_item_id AND mr.organization_id = msi.organization_id
INNER JOIN oe_order_lines_all ool 
    ON mr.demand_source_line_id = ool.line_id
INNER JOIN oe_order_headers_all ooh 
    ON ool.header_id = ooh.header_id
-- Tìm các dòng Reservations vẫn tồn tại nhưng đơn SO thực tế đã bị hủy (CANCELLED) hoặc đóng (CLOSED)
WHERE ooh.flow_status_code IN ('CANCELLED', 'CLOSED')
GROUP BY mr.subinventory_code, msi.segment1, ooh.order_number, ooh.flow_status_code
HAVING SUM(mr.primary_reservation_quantity) > 0;
```

---

### ❌ SQL Audit 2: Phát hiện tài khoản dở dang WIP bị treo trên các Lệnh sản xuất đã đóng hoàn toàn (WIP Mismatch)
Tìm các lệnh sản xuất đã đóng (`JobClosed = 1` / `status_type = 12`) nhưng tài khoản chi phí dở dang WIP của lệnh đó trên sổ phụ vẫn còn số dư khác 0 (chưa được hệ thống clear sạch chênh lệch).

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    jh.JobNum AS [Số lệnh sản xuất],
    jh.PartNum AS [Mã thành phẩm],
    jh.ClosedDate AS [Ngày đóng Job],
    ja.WIPMTL AS [WIP Nguyên vật liệu dở dang],
    ja.WIPLbr AS [WIP Nhân công dở dang],
    ja.WIPBur AS [WIP Chi phí chung dở dang],
    (ja.WIPMTL + ja.WIPLbr + ja.WIPBur) AS [Tổng WIP còn dư thừa]
FROM Erp.JobHead jh
INNER JOIN Erp.JobAsmbl ja 
    ON jh.Company = ja.Company AND jh.JobNum = ja.JobNum AND ja.AssemblySeq = 0
WHERE jh.JobClosed = 1                              -- Lệnh sản xuất đã đóng hoàn toàn
  AND (ja.WIPMTL + ja.WIPLbr + ja.WIPBur) <> 0;      -- Nhưng số dư WIP vẫn chưa bằng 0
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    wdj.wip_entity_name AS job_number,
    msi.segment1 AS assembly_code,
    wpb.class_code AS wip_class,
    -- Tính toán số dư WIP dở dang nguyên vật liệu còn sót lại trên Job đã đóng
    (NVL(wpb.tl_material_in,0) + NVL(wpb.pl_material_in,0) - NVL(wpb.tl_material_out,0) - NVL(wpb.pl_material_out,0)) AS material_wip_balance
FROM wip_period_balances wpb
INNER JOIN wip_discrete_jobs wdj 
    ON wpb.wip_entity_id = wdj.wip_entity_id AND wpb.organization_id = wdj.organization_id
INNER JOIN mtl_system_items_b msi 
    ON wdj.primary_item_id = msi.inventory_item_id AND wdj.organization_id = msi.organization_id
WHERE wdj.status_type = 12                          -- 12: Closed (Đã đóng hoàn toàn)
  -- Lọc các Job đã đóng nhưng số dư dở dang nguyên vật liệu (WIP Balance) khác 0
  AND (NVL(wpb.tl_material_in,0) + NVL(wpb.pl_material_in,0) - NVL(wpb.tl_material_out,0) - NVL(wpb.pl_material_out,0)) <> 0;
```

---

## 4. Cơ chế xử lý sự cố & Checklist thiết kế hệ thống tích hợp (System Design)

Để ngăn chặn triệt để hiện tượng lệch dữ liệu chéo phân hệ, lập trình viên và kiến trúc sư hệ thống ERP bắt buộc phải tuân theo các nguyên tắc thiết kế sau:

- [ ] **Tuân thủ nguyên tắc giao dịch ACID (Database Transactions):** Mọi giao dịch liên kết chéo (ví dụ: Xuất kho bán hàng vừa cập nhật bảng `ShipDtl` vừa cập nhật bảng số dư sê-ri `SerialNo`) bắt buộc phải được bọc trong một Database Transaction duy nhất. Nếu một bảng bị lỗi, toàn bộ giao dịch phải được Rollback, không cho phép cập nhật nửa vời gây lệch số liệu.
- [ ] **Khóa chặt quy trình đảo ngược (Reverse Transaction Locks):** Khi một phiếu nhập kho PO đã được đối chiếu hóa đơn kế toán (`Invoice Matched`), hệ thống ERP bắt buộc phải khóa tính năng hủy phiếu nhận hàng (`Void Receipt`), yêu cầu kế toán phải làm Credit Memo đảo ngược trước mới cho phép kho xuất trả hàng (Kịch bản 3).
- [ ] **Cơ chế tự động dọn dẹp hàng giữ ảo (Auto-Unallocate Engine):** Lập trình tác vụ tự động chạy quét (Background Job) mỗi khi người dùng bấm Hủy/Đóng dòng SO hoặc dòng Job sản xuất, tự động giải phóng toàn bộ số lượng đang bị khóa giữ (`Allocated Qty`) tương ứng về trạng thái khả dụng tự do (Kịch bản 1).
- [ ] **Ràng buộc quy trình khóa sổ sản xuất (Job Close Rules):** Khi người dùng thực hiện đóng lệnh sản xuất (`Job/WO closing`), hệ thống bắt buộc phải tự động chạy thuật toán quét dọn dẹp tài khoản WIP, hạch toán toàn bộ chi phí dở dang còn dư thừa vào tài khoản chênh lệch giá thành trước khi chính thức cho phép đóng Job (Kịch bản 2).
