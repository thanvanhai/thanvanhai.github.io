---
id: xu-ly-ton-kho-khi-doi-ky-ke-toan-period-close
title: Xử lý Tồn kho khi Đổi kỳ kế toán (Period Close) — Cơ chế khóa kỳ, Giao dịch bị nghẽn và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Khóa sổ kỳ kế toán (Period Close)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/khoa-so-ky-ke-toan
sidebar_position: 9030
date: 2026-08-21
tags: [erp, inventory, period-close, month-end, cost-processor, sla, posting-engine, sql-audit, oracle-ebs, epicor]
---

# Xử lý Tồn kho khi Đổi kỳ kế toán (Period Close) — Cơ chế khóa kỳ, Giao dịch bị nghẽn và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Quy trình **Khóa sổ kho kỳ kế toán (Period Close / Month-End Closing)** là điểm chạm cuối cùng và quan trọng nhất kết nối dòng chảy Logistics của phân hệ Tồn kho (INV) với luồng hạch toán tài chính của phân hệ Sổ cái (GL). Mục tiêu của quy trình này là đóng băng toàn bộ các giao dịch phát sinh trong kỳ cũ để kế toán trưởng xuất ra báo cáo tài chính chính xác và hợp pháp gửi cho các cơ quan chức năng.

Tuy nhiên, đây cũng là "điểm nghẽn" kỹ thuật lớn nhất của hệ thống ERP mỗi khi đến ngày cuối tháng. Nếu hệ thống tồn tại các giao dịch chưa được tính giá thành, hoặc bị nghẽn ở cổng hạch toán tự động, ERP sẽ chặn đứng quy trình khóa sổ, gây áp lực cực kỳ lớn cho cả đội ngũ vận hành lẫn đội ngũ IT hỗ trợ.

---

## 1. Quy trình 5 bước Khóa sổ kho chuẩn mực trên ERP

Để khóa sổ kho thành công và không bị lệch khớp số liệu, doanh nghiệp bắt buộc phải thực hiện nghiêm ngặt theo quy trình 5 bước sau:

```text
Hoàn thành GD vật lý 🡪 Chạy tính Giá thành 🡪 Đồng bộ sang Sổ cái (GL) 🡪 Đối chiếu khớp số liệu 🡪 Khóa kỳ kế toán
```

1. **Bước 1: Hoàn thành tất cả các giao dịch vật lý:** Thủ kho bắt buộc phải nhập hết các phiếu nhận hàng PO, xuất hàng SO, xuất sản xuất WO thực tế phát sinh trong tháng.
2. **Bước 2: Chạy tính giá thành (Cost Processor):** Chạy bộ công cụ tính toán đơn giá xuất kho và giá vốn (đối với Average/FIFO) hoặc tính toán chênh lệch (đối với Standard Cost).
3. **Bước 3: Đồng bộ sang Sổ cái (Subledger to GL Transfer):** Chạy tiến trình hạch toán tự động (Posting Engine / SLA) để đẩy toàn bộ định khoản kế toán của giao dịch kho sang phân hệ Sổ cái (GL).
4. **Bước 4: Đối chiếu số liệu (Reconciliation):** Đối chiếu xem tổng trị giá báo cáo tồn kho chi tiết có khớp với số dư nợ tài khoản kho (152, 155, 156) trên Sổ cái hay không.
5. **Bước 5: Khóa kỳ (Close Period):** Thực hiện đổi trạng thái kỳ kế toán từ `Open` sang `Closed`.

---

## 2. Ba kịch bản đứt gãy nghiệp vụ chặn đứng quy trình Khóa sổ kho

### ❌ Kịch bản 1: Giao dịch kho chưa chạy tính giá thành (Uncosted Transactions)

**Tình huống:** Thủ kho làm phiếu xuất kho bán hàng vào ngày cuối tháng. Tuy nhiên, hệ thống tính giá vốn tự động (Cost Processor) chưa chạy quét qua giao dịch này nên trường đơn vị giá vốn của giao dịch vẫn đang bị bỏ trống.

* **Hậu quả đứt gãy:** Hệ thống ERP (đặc biệt là Oracle EBS) sẽ khóa cứng không cho phép bạn chuyển trạng thái kỳ kế toán sang `Closed`. Hệ thống sẽ báo lỗi đỏ liên tục (`APP-INV-05453`) vì tồn tại giao dịch chưa được định giá, khiến kế toán không thể khóa sổ đúng hạn.
* **Giải pháp:** Phải có câu lệnh SQL quét nhanh để tìm ra đích danh ID giao dịch bị lỗi tính giá nhằm xử lý thủ công trước khi chạy lại bộ tính giá.

---

### ❌ Kịch bản 2: Giao dịch bị nghẽn ở cổng hạch toán tự động (SLA/PE Posting Errors)

**Tình huống:** Giao dịch kho đã được tính giá thành xong, nhưng do kế toán thiết lập thiếu tài khoản hạch toán tự động cho nhóm hàng hóa mới tạo, bộ hạch toán tự động (Posting Engine / SLA) bị lỗi định khoản và treo giao dịch này lại ở hàng đợi (`Error Queue`).

* **Hậu quả đứt gãy:** 
  * Số liệu tồn kho trên sổ phụ đã thay đổi (do thủ kho đã bấm xuất/nhập).
  * Sổ cái kế toán (GL) không nhận được bút toán này vì giao dịch bị lỗi hạch toán.
  * Kết quả: Sổ phụ kho và Sổ cái bị lệch khớp số liệu, và ERP sẽ chặn không cho phép đóng kỳ kế toán kho cho đến khi lỗi hạch toán được sửa đổi.

---

### ❌ Kịch bản 3: "Thảm họa" mở lại kỳ cũ để hạch toán lùi ngày (Backdated Entry after Re-open)

**Tình huống:** Kỳ kế toán tháng 7 đã được khóa sổ an toàn vào ngày 05/08. Đến ngày 10/08, phòng mua hàng phát hiện quên chưa nhập một phiếu PO của tháng 7 và yêu cầu kế toán phải **Mở lại kỳ tháng 7 (Re-open Period)** để họ hạch toán lùi ngày về 31/07. Kế toán đồng ý mở kỳ và cho họ nhập phiếu.

* **Hậu quả đứt gãy cực kỳ nghiêm trọng:** 
  * Giao dịch nhập kho lùi ngày làm thay đổi số dư tồn cuối kỳ tháng 7 đã báo cáo tài chính trước đó.
  * Việc này làm **phá hủy hoàn toàn tính liên tục của số liệu**: Số dư cuối kỳ tháng 7 trên báo cáo cũ không còn khớp với số dư đầu kỳ tháng 8 hiện tại. Đây là lỗi nghiêm trọng nhất về mặt kiểm toán tài chính doanh nghiệp.

---

## 3. Các câu lệnh SQL Audit thực chiến rà soát lỗi Khóa sổ kho

Hãy chạy các câu lệnh SQL dưới đây vào ngày cuối tháng để chủ động phát hiện và dọn sạch các điểm nghẽn dữ liệu trước khi kế toán chạy quy trình đóng kỳ:

---

### ❌ SQL Audit 1: Phát hiện các giao dịch kho chưa chạy tính giá thành (Uncosted Transactions)
Tìm toàn bộ các giao dịch kho phát sinh trong kỳ đang chuẩn bị đóng nhưng trường giá trị giá vốn vẫn chưa được tính toán xong hoặc bị lỗi tính giá.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pt.TranDate AS [Ngày giao dịch],
    pt.PackNum AS [Số chứng từ],
    pt.PartNum AS [Mã hàng],
    pt.TranType AS [Loại giao dịch],
    pt.TranQty AS [Số lượng]
FROM Erp.PartTran pt
WHERE pt.PostedToGL = 0                             -- Chưa được hạch toán sang GL
  -- Thay thế ngày kết thúc kỳ kế toán bạn đang muốn khóa sổ vào đây (ví dụ: tháng 7/2026)
  AND pt.TranDate <= '2026-07-31' 
  AND pt.Company = 'your_company_code';
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_MATERIAL_TRANSACTIONS`):
Trong Oracle, các giao dịch chưa được tính giá sẽ có cột `costed_flag = 'N'` (Not costed) hoặc `'E'` (Error). Nếu còn bất kỳ dòng nào ở trạng thái này, EBS sẽ chặn không cho khóa sổ.
```sql
SELECT 
    mmt.transaction_id,
    mmt.transaction_date AS tx_date,
    msi.segment1 AS item_code,
    mmt.transaction_quantity AS tx_qty,
    mmt.costed_flag,                                -- 'N': Chưa tính giá, 'E': Lỗi tính giá
    mmt.error_explanation AS error_desc              -- Chi tiết lỗi tính giá hệ thống trả về
FROM mtl_material_transactions mmt
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE mmt.costed_flag IN ('N', 'E')                 -- Lọc giao dịch chưa tính giá thành công
  -- Thay thế ngày kết thúc kỳ kế toán bạn đang muốn khóa sổ vào đây
  AND mmt.transaction_date <= TO_DATE('2026-07-31', 'YYYY-MM-DD') 
  AND mmt.organization_id = :org_id;
```

---

### ❌ SQL Audit 2: Phát hiện các giao dịch bị lỗi cổng hạch toán tự động sang Sổ cái (SLA/PE Posting Errors)
Tìm các giao dịch kho đã hoàn thành tính giá thành công nhưng bị nghẽn lại ở cổng truyền dữ liệu sang Sổ cái (GL) do lỗi định khoản hoặc thiếu cấu hình tài khoản kế toán chéo phân hệ.

#### 💻 Code SQL dành cho Epicor ERP (Quét bảng lịch sử lỗi Posting Engine `PELog`):
```sql
SELECT 
    pt.TranDate AS [Ngày giao dịch],
    pt.PartNum AS [Mã sản phẩm],
    pt.TranType AS [Loại giao dịch],
    pt.TranQty AS [Số lượng],
    -- Lấy ra mô tả lỗi hạch toán kế toán chi tiết trong bảng PELog
    (SELECT TOP 1 pel.LogText 
     FROM Erp.PELog pel 
     WHERE pel.Company = pt.Company AND pel.Key1 = CAST(pt.SysRowID AS VARCHAR(36))
     ORDER BY pel.CreatedDate DESC) AS ErrorLog
FROM Erp.PartTran pt
WHERE pt.PostedToGL = 0                             -- Chưa được post thành công sang GL
  AND pt.TranDate <= '2026-07-31'                   -- Kỳ đang muốn đóng sổ
  -- Điều kiện: Tồn tại bản ghi ghi nhận lỗi hạch toán trong bảng PELog của giao dịch này
  AND (SELECT COUNT(*) FROM Erp.PELog pel WHERE pel.Company = pt.Company AND pel.Key1 = CAST(pt.SysRowID AS VARCHAR(36))) > 0;
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Quét cổng hạch toán SLA `XLA_EVENTS`):
Tìm các sự kiện hạch toán tồn kho/WIP (`application_id = 401`) đang ở trạng thái lỗi (`event_status_code = 'E'`) hoặc chưa được hạch toán (`'U'`).
```sql
SELECT 
    xe.event_id,
    xe.event_date AS accounting_date,
    xe.event_status_code,                           -- 'E': Error, 'U': Unprocessed
    mmt.transaction_id,
    msi.segment1 AS item_code
FROM xla_events xe
INNER JOIN xla_transaction_entities xte 
    ON xe.entity_id = xte.entity_id AND xe.application_id = xte.application_id
INNER JOIN mtl_material_transactions mmt 
    ON xte.source_id_int_1 = mmt.transaction_id
INNER JOIN mtl_system_items_b msi 
    ON mmt.inventory_item_id = msi.inventory_item_id AND mmt.organization_id = msi.organization_id
WHERE xte.application_id = 401                      -- 401: Phân hệ Inventory/WIP trong Oracle EBS
  AND xe.event_status_code IN ('E', 'U')            -- Lọc sự kiện hạch toán bị lỗi hoặc chưa xử lý
  AND xe.event_date <= TO_DATE('2026-07-31', 'YYYY-MM-DD');
```

---

## 4. Cơ chế tự động hóa & Checklist thiết kế hệ thống kiểm soát Khóa sổ kho

Để quy trình đóng kỳ kế toán kho diễn ra trơn tru và không bị lệch khớp số liệu, lập trình viên bắt buộc phải thiết kế các cơ chế kiểm soát cứng sau trên hệ thống:

- [ ] **Khóa chặt ngày hạch toán sau khi đóng sổ:** Khi trạng thái kỳ kế toán chuyển sang `Closed`, lập trình cơ chế khóa cứng Database, chặn đứng 100% mọi hành vi tạo phiếu xuất/nhập lùi ngày giao dịch (Backdated) về kỳ đã đóng đó (Kịch bản 3).
- [ ] **Ràng buộc kiểm tra giao dịch dở dang trước khi Close:** Thiết lập điều kiện chặn (Validation Rule) trên màn hình khóa sổ: Chặn không cho phép người dùng bấm nút khóa sổ nếu hệ thống quét thấy vẫn còn giao dịch chưa tính giá (`costed_flag = 'N'` hoặc `PostedToGL = 0`) (Kịch bản 1).
- [ ] **Xây dựng Dashboard theo dõi lỗi hạch toán thời gian thực:** Lập trình màn hình theo dõi lỗi hạch toán tự động (SLA/PE Error Dashboard) để kế toán có thể nhìn thấy ngay các giao dịch bị lỗi định khoản và sửa tài khoản kịp thời trong tháng, tránh dồn cục bộ vào ngày cuối tháng (Kịch bản 2).
- [ ] **Tính năng đối chiếu tự động Subledger vs GL (Auto-Reconciliation Tool):** Phát triển công cụ tự động đối chiếu số dư nợ tài khoản kho trên Sổ cái (GL) với tổng trị giá tồn kho trên sổ phụ chi tiết (Subledger), tự động highlight dòng bị lệch để kế toán kho dễ dàng xử lý.