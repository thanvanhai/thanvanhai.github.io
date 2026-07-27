---
id: chuoi-cung-ung
title: Chuỗi cung ứng (SCM)
description: "Nghiệp vụ Tồn kho (INV), Mua hàng (PO) và Bán hàng (OM) trong chuỗi cung ứng doanh nghiệp — từ nhập kho, xuất kho đến xử lý đơn hàng."
---

import DocCardList from '@theme/DocCardList';

# Chuỗi cung ứng (SCM)

Chuỗi cung ứng (Supply Chain Management - SCM) là phân hệ trung tâm kết nối dòng chảy vật tư — từ khi phát sinh nhu cầu mua hàng, nhập kho, lưu trữ tồn kho, cho đến khi xuất kho giao hàng cho khách. Đây cũng là phân hệ tạo ra phần lớn dữ liệu giao dịch (transaction) làm đầu vào cho phân hệ Sản xuất (MFG) và Tài chính kế toán (FIN).

## Tương quan phân hệ con với các ERP phổ biến

| Phân hệ con trong tài liệu | SAP | Oracle EBS | Epicor |
|---|---|---|---|
| **Mua hàng (PO)** | MM-PUR (Purchasing) | Purchasing (PO) | Purchase Management |
| **Tồn kho (INV)** | MM-IM (Inventory Management) | Inventory (INV) | Inventory Management |
| **Bán hàng (SO/OM)** | SD (Sales & Distribution) | Order Management (OM) | Sales Order Management |

## Sơ đồ luồng nghiệp vụ

```mermaid
flowchart LR
    PO[Mua hàng - PO<br/>Đơn mua hàng, Nhận hàng]
    INV[Tồn kho - INV<br/>Nhập/Xuất/Chuyển kho]
    OM[Bán hàng - SO/OM<br/>Đơn bán hàng, Giao hàng]

    PO -->|Nhập kho từ PO| INV
    INV -->|Xuất kho giao hàng| OM

    PO -->|Đối soát công nợ| AP[Tài chính - AP]
    OM -->|Đối soát công nợ| AR[Tài chính - AR]
    INV -->|Hạch toán giá vốn| COST[Tài chính - COST/GL]
```

## Danh mục tài liệu

<DocCardList />

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>
