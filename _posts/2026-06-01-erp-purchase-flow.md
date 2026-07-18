---
title: "Quy trình Mua hàng trong ERP: Từ PR đến Invoice Matching"
date: 2026-06-01 08:00:00 +0700
categories: [ERP Nghiệp vụ, Purchasing]
tags: [erp, purchasing, procurement, oracle, epicor, workflow]
author: haicoi
---

## Tổng quan quy trình Mua hàng (Procure-to-Pay)

Quy trình mua hàng trong ERP là một trong những quy trình cốt lõi, thường được gọi là **P2P (Procure-to-Pay)**. Hiểu đúng luồng này giúp viết báo cáo chính xác và tránh các lỗi nghiệp vụ phổ biến.

```
PR (Purchase Requisition)
  ↓  Approve
PO (Purchase Order)
  ↓  Gửi nhà cung cấp
GR (Goods Receipt / Receiving)
  ↓  Nhận hàng vào kho
Invoice Matching (2-way / 3-way)
  ↓  Thanh toán
Payment
```

## Bước 1: Purchase Requisition (PR)

PR là yêu cầu mua hàng nội bộ — người dùng đề nghị mua một mặt hàng cụ thể.

| Field | Mô tả |
|---|---|
| Requestor | Người yêu cầu |
| Item / Description | Mặt hàng hoặc dịch vụ |
| Quantity & UOM | Số lượng và đơn vị đo |
| Need Date | Ngày cần hàng |
| Suggested Supplier | Nhà cung cấp đề xuất (tùy chọn) |
| Account Code | Tài khoản kế toán phân bổ chi phí |

```sql
-- Oracle EBS: bảng PR
SELECT prh.SEGMENT1 AS pr_number,
       prh.CREATION_DATE,
       prl.ITEM_DESCRIPTION,
       prl.QUANTITY,
       prl.UNIT_PRICE,
       prl.QUANTITY * prl.UNIT_PRICE AS line_amount
FROM PO_REQUISITION_HEADERS_ALL prh
JOIN PO_REQUISITION_LINES_ALL prl 
    ON prl.REQUISITION_HEADER_ID = prh.REQUISITION_HEADER_ID
WHERE prh.AUTHORIZATION_STATUS = 'APPROVED'
AND prh.ORG_ID = :org_id;
```

## Bước 2: Purchase Order (PO)

PO được tạo từ 1 hoặc nhiều PR đã approved. Đây là văn bản pháp lý cam kết mua hàng với nhà cung cấp.

### Các loại PO

| Loại | Mô tả | Dùng khi |
|---|---|---|
| **Standard PO** | Mua một lần, giao hàng 1 lần | Mua hàng thông thường |
| **Blanket PO** | Khung hợp đồng cả năm, call-off từng lần | Mua định kỳ, cố định nhà cung cấp |
| **Contract PO** | Hợp đồng dài hạn, không có số lượng cụ thể | Dịch vụ, SLA |
| **Planned PO** | PO từ MRP, release theo kế hoạch sản xuất | ERP Manufacturing |

```sql
-- Oracle EBS: PO và trạng thái
SELECT poh.SEGMENT1 AS po_number,
       poh.CREATION_DATE,
       poh.APPROVED_DATE,
       poh.AUTHORIZATION_STATUS,
       pol.LINE_NUM,
       pol.ITEM_DESCRIPTION,
       pol.QUANTITY,
       pol.UNIT_PRICE,
       pol.QUANTITY * pol.UNIT_PRICE AS line_amount
FROM PO_HEADERS_ALL poh
JOIN PO_LINES_ALL pol ON pol.PO_HEADER_ID = poh.PO_HEADER_ID
WHERE poh.TYPE_LOOKUP_CODE = 'STANDARD'
AND poh.ORG_ID = :org_id
ORDER BY poh.CREATION_DATE DESC;
```

## Bước 3: Goods Receipt (GR) — Nhận hàng

Khi hàng về, bộ phận kho tạo GR (Receiving Transaction). Đây là bước quan trọng nhất vì:
- GR làm tăng tồn kho (inventory quantity)
- GR tạo ra **Accrual** (nợ phải trả tạm thời) trước khi có invoice

```sql
-- Oracle EBS: Receiving transactions
SELECT rt.TRANSACTION_DATE,
       rt.TRANSACTION_TYPE,  -- RECEIVE, DELIVER, RETURN TO VENDOR
       rt.QUANTITY,
       rt.UNIT_OF_MEASURE,
       rt.PRIMARY_QUANTITY,
       poh.SEGMENT1 AS po_number,
       pol.LINE_NUM AS po_line
FROM RCV_TRANSACTIONS rt
JOIN PO_HEADERS_ALL poh ON poh.PO_HEADER_ID = rt.PO_HEADER_ID
JOIN PO_LINES_ALL pol    ON pol.PO_LINE_ID   = rt.PO_LINE_ID
WHERE rt.TRANSACTION_TYPE = 'RECEIVE'
AND rt.ORGANIZATION_ID = :org_id
ORDER BY rt.TRANSACTION_DATE DESC;
```

## Bước 4: Invoice Matching

Invoice Matching là bước đối chiếu invoice từ nhà cung cấp với PO và GR.

### 2-Way Matching
```
Invoice ↔ PO
```
Dùng cho dịch vụ, phí không có hàng vật lý.

### 3-Way Matching (phổ biến nhất)
```
Invoice ↔ PO ↔ GR
```
- Invoice quantity ≤ GR quantity
- Invoice price ≈ PO price (trong tolerance %)

### 4-Way Matching
```
Invoice ↔ PO ↔ GR ↔ Inspection/Acceptance
```
Dùng trong ngành có kiểm tra chất lượng nghiêm ngặt.

```sql
-- Oracle EBS: Invoice với matching status
SELECT aia.INVOICE_NUM,
       aia.INVOICE_DATE,
       aia.VENDOR_NAME,
       aia.INVOICE_AMOUNT,
       aia.AMOUNT_PAID,
       aia.INVOICE_AMOUNT - aia.AMOUNT_PAID AS outstanding,
       aia.APPROVAL_STATUS
FROM AP_INVOICES_ALL aia
WHERE aia.INVOICE_TYPE_LOOKUP_CODE = 'STANDARD'
AND aia.ORG_ID = :org_id
AND aia.INVOICE_DATE >= :from_date;
```

## Lỗi nghiệp vụ phổ biến

### 1. Invoice trước GR
Nhà cung cấp gửi invoice nhưng hàng chưa về → hệ thống không match được → payment bị hold.

### 2. Price Variance quá ngưỡng
Invoice price khác PO price hơn tolerance (vd: ±5%) → cần approval thêm.

```sql
-- Tìm invoice bị hold do Price Variance
SELECT aia.INVOICE_NUM,
       pol.UNIT_PRICE AS po_price,
       ail.UNIT_PRICE AS invoice_price,
       ABS(ail.UNIT_PRICE - pol.UNIT_PRICE) / pol.UNIT_PRICE * 100 AS variance_pct
FROM AP_INVOICE_LINES_ALL ail
JOIN AP_INVOICES_ALL aia ON aia.INVOICE_ID = ail.INVOICE_ID
JOIN PO_LINES_ALL pol    ON pol.PO_LINE_ID = ail.PO_LINE_ID
WHERE ABS(ail.UNIT_PRICE - pol.UNIT_PRICE) / pol.UNIT_PRICE * 100 > 5;
```

### 3. Quantity Mismatch
Invoice số lượng lớn hơn GR → không match → cần receiving thêm hoặc return invoice.

## Báo cáo quan trọng trong Purchasing

| Báo cáo | Mục đích |
|---|---|
| Open PO | PO chưa hoàn thành GR |
| PO Accrual | Nợ phải trả tạm thời (GR chưa có Invoice) |
| Invoice Aging | Invoice chưa thanh toán theo tuổi nợ |
| Price Variance | Chênh lệch giá PO vs Invoice |
| Vendor On-Time Delivery | Tỷ lệ giao hàng đúng hạn theo nhà cung cấp |

## Kết luận

Hiểu sâu quy trình P2P giúp bạn viết báo cáo chính xác và debug sự cố kịp thời. Điểm mấu chốt: **GR tạo ra Accrual (liability), Invoice tạo ra AP (accounts payable)** — hai thời điểm khác nhau và hai bảng khác nhau trong ERP.
