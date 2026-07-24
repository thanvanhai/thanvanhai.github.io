---
id: xuat-kho-tra-nha-cung-cap-rtv
title: Nghiệp vụ Xuất kho trả Nhà cung cấp (Return to Vendor - RTV) 
description: Luồng hạch toán, Đối chiếu Debit Memo và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Xuất kho trả NCC (RTV)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/xuat-kho-tra-nha-cung-cap
sidebar_position: 2020
date: 2026-07-28
tags: [erp, inventory, purchasing, rtv, debit-memo, costing, sql-audit, oracle-ebs, epicor]
---

# 2020 Nghiệp vụ Xuất kho trả Nhà cung cấp (Return to Vendor - RTV) 

> Luồng hạch toán, Đối chiếu Debit Memo và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Trong vận hành chuỗi cung ứng, không phải lúc nào nguyên vật liệu mua về cũng đạt chất lượng 100%. Khi phát hiện hàng lỗi (qua QC đầu vào hoặc phát sinh lỗi trong quá trình sản xuất), doanh nghiệp sẽ thực hiện nghiệp vụ **Xuất kho trả lại nhà cung cấp (Return to Vendor - RTV / Purchase Return)**.

Dưới góc độ hệ thống ERP, đây là nghiệp vụ đi ngược lại luồng mua hàng (PO). Nó yêu cầu giảm trừ tài sản tồn kho, giảm trừ công nợ phải trả tạm tính (AP Accrual), và tự động tạo yêu cầu xuất **Hóa đơn giảm trừ công nợ mua hàng (Debit Memo)** gửi cho nhà cung cấp.

---

## 1. Bản chất Giao dịch và Bản đồ dữ liệu (Under the Hood)

Giao dịch RTV bắt buộc phải liên kết trực tiếp với phiếu nhập kho gốc (`PO Receipt`) để hệ thống xác định đúng giá mua và đơn vị tính (UOM) quy đổi gốc.

### Bản đồ dữ liệu giữa các hệ thống ERP:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Giao dịch xuất trả gốc** | `Erp.PartTran` (TranType: `STK-VEN` hoặc `PUR-RTV`) | `RCV_TRANSACTIONS` (Transaction Type: `RETURN TO VENDOR`) | `MSEG` (Movement Type: `122` - Return Delivery to Vendor) |
| **Yêu cầu giảm trừ nợ** | `Erp.RcvDtl` (Trạng thái Return) | `RCV_TRANSACTIONS` | Debit Memo |
| **Chứng từ công nợ giảm** | `Erp.APInvHed` / `APInvDtl` (Debit Memo) | `AP_INVOICES_ALL` (Invoice Type: `DEBIT`) | Credit Memo |

---

## 2. Luồng Hạch toán Kế toán (RTV Accounting)

Bút toán hạch toán RTV sẽ đảo ngược lại bút toán nhập kho từ PO trước đó dựa trên giá trị gốc của PO.

* **Nợ (Debit):** `Tài khoản AP Accrual` (3387/3388 - Phải trả tạm tính) — Giảm công nợ tạm tính của nhà cung cấp.
* **Có (Credit):** `Tài khoản Kho Nguyên vật liệu` (152, 156) — Giảm trừ trị giá hàng tồn kho vật lý.

> **Lưu ý nghiệp vụ:** Nếu PO nhập kho theo phương pháp giá Standard Cost, bất kỳ chênh lệch nào giữa đơn giá mua trên PO và giá tiêu chuẩn sẽ được hoàn lại vào tài khoản chênh lệch giá mua (`PPV`) tại bước xuất trả này.

---

## 3. Hai "Bẫy" thực chiến và Các câu SQL Audit rà soát lỗi hệ thống

### ❌ Kịch bản 1: Đã xuất kho trả hàng (RTV) nhưng kế toán "quên" xuất hóa đơn giảm trừ nợ (Debit Memo)

**Tình huống:** Thủ kho đã xuất trả 50 cái động cơ lỗi cho Nhà cung cấp và ký biên bản giao nhận. Tuy nhiên, do thiếu sót thông tin giữa kho và phòng kế toán, kế toán AP **quên không tạo phiếu giảm trừ nợ (Debit Memo)** trên hệ thống ERP.

* **Hậu quả:** Doanh nghiệp vẫn thanh toán đủ 100% tiền hàng cho NCC theo hóa đơn cũ mà không trừ đi giá trị của 50 sản phẩm lỗi đã trả lại. Đây là kẽ hở gây thất thoát dòng tiền cực kỳ nghiêm trọng.
* **SQL Audit rà soát:** Tìm tất cả các giao dịch xuất kho trả hàng nhà cung cấp (RTV) thành công nhưng chưa hề được kế toán liên kết đến bất kỳ hóa đơn giảm nợ (Debit Memo) nào trong phân hệ phải trả (AP).

#### 💻 Code SQL dành cho Epicor ERP:

```sql
SELECT 
    pt.TranDate AS [Ngày xuất trả],
    pt.PackNum AS [Số phiếu nhập gốc],
    pt.PartNum AS [Mã vật tư],
    pt.TranQty AS [Số lượng trả],
    pt.CreatedBy AS [Người thực hiện]
FROM Erp.PartTran pt
WHERE pt.TranType = 'STK-VEN' -- Xuất từ kho trả NCC (hoặc PUR-RTV)
  -- Điều kiện: Không tồn tại dòng Debit Memo nào liên kết với giao dịch xuất trả này
  AND NOT EXISTS (
      SELECT 1 
      FROM Erp.APInvDtl ad 
      WHERE ad.Company = pt.Company 
        AND ad.PackNum = pt.PackNum 
        AND ad.PackLine = pt.PackLine
  );
```

#### 💻 Code SQL dành cho Oracle EBS R12:

```sql
SELECT 
    rt.transaction_date AS rtv_date,
    we.wip_entity_name AS rtv_number, -- Số giao dịch RTV
    msi.segment1 AS item_code,
    rt.quantity AS rtv_quantity,
    poh.segment1 AS po_number
FROM rcv_transactions rt
INNER JOIN po_headers_all poh ON rt.po_header_id = poh.po_header_id
INNER JOIN mtl_system_items_b msi ON rt.organization_id = msi.organization_id AND rt.item_id = msi.inventory_item_id
WHERE rt.transaction_type = 'RETURN TO VENDOR'
  -- Điều kiện: Không tồn tại hóa đơn Debit Memo nào trong AP liên kết với giao dịch RTV này
  AND NOT EXISTS (
      SELECT 1 
      FROM ap_invoice_lines_all ail
      INNER JOIN ap_invoices_all aia ON ail.invoice_id = aia.invoice_id
      WHERE aia.invoice_type_lookup_code = 'DEBIT' -- Chỉ tìm hóa đơn Debit Memo
        AND ail.rcv_transaction_id = rt.transaction_id
  );
```

### ❌ Kịch bản 2: Số lượng xuất trả vượt quá số lượng thực tế đã nhập kho

**Tình huống:** Do nhầm lẫn số liệu hoặc thủ kho chọn nhầm dòng PO, thủ kho làm phiếu xuất trả nhà cung cấp 120 sản phẩm, trong khi lịch sử nhập kho của dòng PO đó thực tế chỉ nhập 100 sản phẩm.

* **Hậu quả:** Hệ thống ERP bị âm số dư công nợ tạm tính (AP Accrual) của dòng PO đó, gây lỗi nghiêm trọng khi kế toán chạy báo cáo đối chiếu tài khoản cuối tháng (AP Accrual Reconciliation).
* **SQL Audit rà soát:** Tìm các giao dịch RTV có tổng số lượng xuất trả lớn hơn số lượng đã nhận kho thực tế của dòng PO tương ứng.

#### 💻 Code SQL dành cho Epicor ERP:

```sql
SELECT 
    rd.PONum,
    rd.POLine,
    rd.PartNum,
    rd.VendorQty AS [Số lượng đã nhập PO],
    SUM(pt.TranQty) AS [Tổng số lượng xuất trả],
    (SUM(pt.TranQty) - rd.VendorQty) AS OverReturnedQty
FROM Erp.RcvDtl rd
INNER JOIN Erp.PartTran pt 
    ON rd.Company = pt.Company 
    AND rd.PackNum = pt.PackNum 
    AND rd.PackLine = pt.PackLine
WHERE pt.TranType IN ('STK-VEN', 'PUR-RTV')
GROUP BY rd.Company, rd.PONum, rd.POLine, rd.PartNum, rd.VendorQty
HAVING SUM(pt.TranQty) > rd.VendorQty;
```

#### 💻 Code SQL dành cho Oracle EBS R12:

```sql
SELECT 
    poh.segment1 AS po_number,
    pol.line_num AS po_line,
    msi.segment1 AS item_code,
    -- Tổng số lượng thực tế đã nhận kho trước đó (RECEIVE / DELIVER)
    (SELECT SUM(rt_rec.quantity) 
     FROM rcv_transactions rt_rec 
     WHERE rt_rec.po_line_id = pol.po_line_id AND rt_rec.transaction_type = 'DELIVER') AS total_received_qty,
    -- Tổng số lượng đã xuất trả NCC (RETURN TO VENDOR)
    SUM(rt.quantity) AS total_returned_qty
FROM rcv_transactions rt
INNER JOIN po_lines_all pol ON rt.po_line_id = pol.po_line_id
INNER JOIN po_headers_all poh ON pol.header_id = poh.header_id
INNER JOIN mtl_system_items_b msi ON rt.organization_id = msi.organization_id AND rt.item_id = msi.inventory_item_id
WHERE rt.transaction_type = 'RETURN TO VENDOR'
GROUP BY poh.segment1, pol.line_num, pol.po_line_id, msi.segment1
HAVING SUM(rt.quantity) > (
    SELECT SUM(rt_rec.quantity) 
    FROM rcv_transactions rt_rec 
    WHERE rt_rec.po_line_id = pol.po_line_id AND rt_rec.transaction_type = 'DELIVER'
);
```

---

## 4. Checklist dành cho Developer khi phát triển phân hệ RTV (Return to Vendor)

- [ ] **Bắt buộc tham chiếu PO Receipt gốc:** Khóa tính năng tạo phiếu RTV tự do, bắt buộc người dùng chọn đúng số Phiếu nhập kho gốc (PO Receipt) để lấy đúng đơn giá gốc.
- [ ] **Ràng buộc kiểm tra số lượng tối đa:** Không cho phép thủ kho nhập số lượng xuất trả vượt quá số lượng thực tế đã nhận kho trừ đi số lượng đã xuất trả trước đó của dòng PO đó (Kịch bản 2).
- [ ] **Đồng bộ hóa quy trình phê duyệt RTV:** Phiếu xuất trả nhà cung cấp phải đi qua quy trình phê duyệt (Approval Workflow) của trưởng phòng mua hàng hoặc giám đốc sản xuất trước khi thủ kho được phép làm thủ tục xuất hàng vật lý.
- [ ] **Tự động kích hoạt Debit Memo Request:** Lập trình cơ chế tự động gửi thông báo hoặc tạo bản ghi nháp (Draft Debit Memo) sang phân hệ kế toán AP ngay khi thủ kho bấm xác nhận xuất hàng RTV thành công (Kịch bản 1).