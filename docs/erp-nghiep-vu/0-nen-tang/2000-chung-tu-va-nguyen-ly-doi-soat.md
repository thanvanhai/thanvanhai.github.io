---
id: chung-tu-va-nguyen-ly-doi-soat
title: "2000 Chứng từ & nguyên lý đối soát"
slug: /erp-nghiep-vu/nen-tang/chung-tu-va-nguyen-ly-doi-soat
sidebar_position: 2000
description: "Nguyên lý chuỗi chứng từ ERP: chứng từ nào sinh từ chứng từ nào, ba cặp đối soát chuẩn, và vì sao đối soát ở cấp dòng quan trọng hơn cấp chứng từ."
tags: [erp, chung-tu, doi-soat, matching]
---

# 2000 Chứng từ & nguyên lý đối soát

Mọi giao dịch trong ERP đều bắt nguồn từ một chứng từ, và chứng từ đó lại bắt nguồn từ một chứng từ khác. Chuỗi này là thứ cho phép kế toán trả lời câu hỏi cơ bản nhất: **khoản tiền này đã trả cho cái gì**.

## 0. Nguyên lý (áp dụng mọi ERP)

1. **Không có chứng từ gốc, không có bút toán.** Bút toán không có căn cứ là bút toán không giải trình được khi kiểm toán.
2. **Chứng từ phải truy ngược được.** Từ hóa đơn về đơn mua, từ đơn mua về yêu cầu, từ phiếu nhận về đơn mua — mất một mắt xích là đứt toàn bộ chuỗi.
3. **Có ba cặp đối soát chuẩn, mỗi cặp giải quyết một câu hỏi khác nhau:** Mua hàng (đặt – nhận – trả tiền), Bán hàng (bán – giao – thu tiền), Sản xuất (lệnh – cấp liệu – nhập kho).
4. **Đối soát ở cấp dòng quan trọng hơn cấp chứng từ.** Khóa ở cấp dòng cho phép chặn đúng dòng sai lệch mà không chặn toàn bộ chứng từ.
5. **Mỗi chứng từ chỉ được sinh từ một chứng từ nguồn duy nhất.** Một sự kiện sinh nhiều chứng từ là dấu hiệu chồng chéo quy trình.
6. **Số liệu trên chứng từ phải là số thực tế, không phải số kế hoạch.** Phiếu nhận ghi số thực giao, không ghi số đặt trên PO.

## 1. Luồng vận hành

```mermaid
flowchart LR
    PR["Yêu cầu mua"] --> PO["Đơn mua"]
    PO --> GR["Phiếu nhận"]
    GR --> IV["Hóa đơn AP"]
    SO["Đơn bán"] --> DL["Phiếu giao"]
    DL --> IV2["Hóa đơn AR"]
    WO["Lệnh sản xuất"] --> ISS["Cấp liệu"]
    ISS --> FGR["Nhập kho thành phẩm"]
    GR --> STK[("Kho")]
    STK --> DL
    FGR --> STK
```

## 2. Ai làm gì ở module nào

| Cặp đối soát | Người tạo chứng từ nguồn | Người ghi nhận | Người đối soát |
|---|---|---|---|
| Đặt – Nhận – Trả tiền | Mua hàng (PO) | Kho (phiếu nhận) | Kế toán AP (khớp lệnh) |
| Bán – Giao – Thu tiền | Bán hàng (SO) | Kho (phiếu giao) | Kế toán AR (xuất hóa đơn) |
| Lệnh – Cấp liệu – Nhập kho | Sản xuất (lệnh SX) | Kho (giao dịch kho) | Kế toán giá thành |

**Ranh giới cốt lõi:** người **tạo** chứng từ nguồn không được là người **đối soát** chứng từ đó.

## 3. Hạch toán

Chứng từ tự nó không sinh bút toán — nó **cho phép** sinh bút toán.

- Chứng từ gốc là căn cứ để sinh bút toán.
- Bút toán không có chứng từ gốc là lỗi kiểm soát.
- Bút toán sinh từ chứng từ sai phải được đảo bằng chứng từ điều chỉnh, không sửa tay.

Bản đồ tài khoản ở [Hạch toán & tài khoản trung gian](../5-ke-toan/ke-toan-tong-hop/1000-hach-toan-va-tai-khoan-trung-gian.md).

## 4. Điểm chạm & rủi ro

- **Khớp lệnh mua hàng chi tiết**: [Đối soát hóa đơn & 3-Way Match](../2-mua-hang/2020-doi-soat-hoa-don-va-3-way-match.md)
- **Hạch toán tài khoản trung gian**: [Hạch toán & tài khoản trung gian](../5-ke-toan/ke-toan-tong-hop/1000-hach-toan-va-tai-khoan-trung-gian.md)
- **Giao dịch kho do chứng từ sinh ra**: [Giao dịch nhập, xuất & chuyển](../1-kho/2000-giao-dich-nhap-xuat-chuyen.md)
- **Đóng kỳ và đối soát sổ phụ**: [Đóng kỳ & đối soát sổ phụ](../5-ke-toan/ke-toan-tong-hop/2010-dong-ky-va-doi-soat-so-phu.md)
- **Phân tách nhiệm vụ**: [Kiểm soát nội bộ & phân tách nhiệm vụ](./2010-kiem-soat-noi-bo-va-phan-tach-nhiem-vu.md)

**Rủi ro chính:**

- **Bút toán không có chứng từ gốc** — không giải trình được khi kiểm toán.
- **Đứt chuỗi truy ngược** — không biết hóa đơn này trả cho lần nhận hàng nào.
- **Một sự kiện sinh nhiều chứng từ** — dòng chứng từ bị nhân đôi, số liệu sai.
- **Ghi số kế hoạch thay số thực tế** — đối soát về sau không khớp được.
- **Đối soát ở cấp chứng từ** — khóa cả hóa đơn vì một dòng lệch.

## 5. Triển khai tham chiếu ERP

### A. Ánh xạ chuỗi chứng từ

| Chứng từ | SAP | Oracle EBS | Epicor | Odoo |
|---|---|---|---|---|
| Yêu cầu mua | `EBAN` | `PO_REQUISITION_HEADERS_ALL` | `Erp.ReqHead` | `purchase.order` (draft) |
| Đơn mua | `EKKO`/`EKPO` | `PO_HEADERS_ALL`/`PO_LINES_ALL` | `Erp.POHeader`/`PODetail` | `purchase.order` |
| Phiếu nhận | `MKPF`/`MSEG` (101) | `RCV_TRANSACTIONS` | `Erp.RcvHead`/`RcvDtl` | `stock.picking` |
| Hóa đơn AP | `RBKP`/`RSEG` | `AP_INVOICES_ALL` | `Erp.APInvHed`/`APInvDtl` | `account.move` (`in_invoice`) |
| Đơn bán | `VBAK`/`VBAP` | `OE_ORDER_HEADERS_ALL` | `Erp.OrderHed`/`OrderDtl` | `sale.order` |
| Phiếu giao | `LIKP`/`LIPS` | `WSH_NEW_DELIVERIES` | `Erp.ShipHead`/`ShipDtl` | `stock.picking` |
| Hóa đơn AR | `VBRK`/`VBRP` | `RA_CUSTOMER_TRX_ALL` | `Erp.InvcHead`/`InvcDtl` | `account.move` (`out_invoice`) |
| Lệnh SX | `AUFK`/`AFKO` | `WIP_DISCRETE_JOBS` | `Erp.JobHead` | `mrp.production` |

### B. Nguyên tắc thiết kế cho hệ thống tự xây

Mọi chứng từ con phải có **hai cột tham chiếu**:

```sql
-- Ví dụ trên bảng phiếu nhận
CREATE TABLE Receipt_Line (
    Receipt_No       VARCHAR(30) NOT NULL,
    Line_No          INT NOT NULL,
    PO_No            VARCHAR(30) NOT NULL,   -- tham chiếu chứng từ nguồn
    PO_Line_No       INT NOT NULL,
    Item_ID          VARCHAR(50) NOT NULL,
    Qty_Received     DECIMAL(18,4) NOT NULL,
    PRIMARY KEY (Receipt_No, Line_No),
    FOREIGN KEY (PO_No, PO_Line_No) REFERENCES PO_Line (PO_No, Line_No)
);
```

Bốn ràng buộc bắt buộc:

1. **Khóa ngoại thật** từ chứng từ con về chứng từ cha, không chỉ lưu số chứng từ dạng text.
2. **Một chứng từ con chỉ có một chứng từ cha** — không cho phép nhiều nguồn.
3. **Chặn xóa chứng từ cha khi còn chứng từ con** tham chiếu.
4. **Mọi bút toán có `Source_Doc`** trỏ về chứng từ gốc.

### C. Truy vấn kiểm soát

**Bút toán không có chứng từ gốc:**

```sql
SELECT Journal_ID, Account_ID, Amount, Posted_By, Posting_Date
FROM GL_Journal
WHERE Source_Doc IS NULL
  AND Entry_Type = 'MANUAL'
ORDER BY Posting_Date DESC;
```

**Hóa đơn AP không tham chiếu phiếu nhận — không khớp lệnh 3 chiều được:**

```sql
SELECT i.Invoice_No, i.Invoice_Date, i.Amount_Total
FROM AP_Invoice i
WHERE i.PO_No IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM AP_Invoice_Line il
      WHERE il.Invoice_ID = i.Invoice_ID AND il.Receipt_Line_ID IS NOT NULL);
```

**Chứng từ nguồn bị xóa nhưng còn chứng từ con:**

```sql
SELECT po.PO_No, po.Status, COUNT(r.Receipt_No) AS So_Phieu_Nhan
FROM PO_Header po
LEFT JOIN Receipt_Line r ON r.PO_No = po.PO_No
WHERE po.Status = 'CANCELLED'
GROUP BY po.PO_No, po.Status
HAVING COUNT(r.Receipt_No) > 0;
```

**Epicor — phiếu nhận không gắn PO:**

```sql
SELECT rd.PackSlip, rd.PONum, rd.PartNum, rd.OurQty
FROM Erp.RcvDtl rd
WHERE rd.Company = 'YOUR_COMPANY_CODE'
  AND (rd.PONum IS NULL OR rd.PONum = 0)
ORDER BY rd.ReceiptDate DESC;
```

## 6. Bẫy thực chiến & Checklist

| # | Bẫy | Triệu chứng | Cách phòng tránh |
|---|---|---|---|
| 1 | Bút toán thủ công không chứng từ | Không giải trình được khi kiểm toán | Bắt buộc `Source_Doc` + phê duyệt |
| 2 | Lưu số chứng từ dạng text không có khóa ngoại | Chuỗi truy ngược đứt khi dữ liệu lệch | Khóa ngoại thật giữa chứng từ con và cha |
| 3 | Một sự kiện sinh hai chứng từ | Dòng chứng từ nhân đôi, số liệu sai | Một chứng từ nguồn duy nhất |
| 4 | Ghi số kế hoạch thay số thực tế | Đối soát về sau không khớp | Phiếu nhận ghi số thực giao |
| 5 | Đối soát cấp chứng từ | Khóa cả hóa đơn vì một dòng lệch | Đối soát cấp dòng |
| 6 | Cho xóa chứng từ cha khi có chứng từ con | Chứng từ con mồ côi | Chặn xóa, chỉ đóng/hủy |
| 7 | Không có cột tham chiếu dòng | Không biết dòng nào khớp dòng nào | `Source_Line_No` bắt buộc |
| 8 | Chứng từ nguồn và chứng từ con lệch ngày | Không xác định được kỳ hạch toán | Ngày chứng từ con ≥ ngày chứng từ cha |
| 9 | Kiểm tra đứt chuỗi chỉ khi kiểm toán | Phát hiện muộn, sửa rất tốn kém | Báo cáo kiểm tra chuỗi chạy định kỳ |
| 10 | Không phân biệt chứng từ hủy và chứng từ gốc | Báo cáo tính cả chứng từ đã hủy | Dùng trạng thái, không xóa bản ghi |

**Checklist trước go-live:**

- [ ] Mọi chứng từ con có khóa ngoại về chứng từ cha (đã test).
- [ ] Mọi bút toán có `Source_Doc` (trừ bút toán kết chuyển đặc biệt được khai báo).
- [ ] Chặn xóa chứng từ cha khi còn chứng từ con (đã test).
- [ ] Mỗi sự kiện chỉ sinh một chứng từ nguồn.
- [ ] Phiếu nhận ghi số thực giao, không ghi số PO.
- [ ] Có báo cáo kiểm tra đứt chuỗi chứng từ.
- [ ] Chứng từ hủy giữ trạng thái, không xóa bản ghi.
- [ ] Ngày chứng từ con không nhỏ hơn ngày chứng từ cha.
- [ ] Đối soát thực hiện ở cấp dòng (đã test một hóa đơn nhiều dòng).

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>
