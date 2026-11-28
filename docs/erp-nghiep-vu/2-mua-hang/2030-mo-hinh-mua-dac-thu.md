---
id: mo-hinh-mua-dac-thu
title: "Mô hình mua đặc thù"
slug: /erp-nghiep-vu/mua-hang/mo-hinh-mua-dac-thu
sidebar_position: 2030
description: "Sáu mô hình mua không theo chuẩn: gia công ngoài, ký gửi và VMI, mua nội bộ giữa pháp nhân, mua dịch vụ và tài sản cố định, drop-ship, nhập khẩu — kèm điểm khác biệt cốt lõi của từng mô hình."
date: 2026-08-13
last_update:
  date: 2026-11-19
tags: [erp, procurement, subcontracting, consignment, vmi, intercompany, service-po, drop-ship, import]
---

# Mô hình mua đặc thù

Sáu mô hình dưới đây đều là "mua hàng" nhưng **không mô hình nào chạy đúng nếu dùng chung quy trình Standard PO**. Mỗi mô hình thất bại theo một cách khác nhau: mất giá trị vật tư, ghi nhận tài sản không thuộc sở hữu, hoặc sinh tồn kho ảo.

Bài này chỉ ra điểm khác biệt cốt lõi của từng mô hình và cách xử lý để không mắc các lỗi đó.

## Nguyên lý (áp dụng mọi ERP)

1. **Quyền sở hữu và vị trí vật lý là hai thứ khác nhau.** Hàng ký gửi nằm trong kho doanh nghiệp nhưng thuộc nhà cung cấp. Hàng gửi gia công ra ngoài không còn trong kho doanh nghiệp nhưng vẫn thuộc doanh nghiệp. Mọi mô hình trong bài này đều xoay quanh việc tách rời hai khái niệm đó.
2. **Gia công ngoài không phải mua dịch vụ.** Vật tư gửi đi vẫn là tài sản của doanh nghiệp; nhà thầu chỉ thêm giá trị gia công. Ghi nhận thành phẩm bằng đúng giá trị dịch vụ sẽ **làm biến mất** giá trị nguyên vật liệu gốc.
3. **Hàng ký gửi không phải tài sản của doanh nghiệp cho tới khi tiêu dùng.** Ghi tăng tài sản và công nợ ngay khi nhận là vi phạm nguyên tắc kế toán và tạo ra khoản nợ phải trả không có thực.
4. **Mua nội bộ giữa các pháp nhân là giao dịch bán/mua, không phải chuyển kho.** Cùng một tập đoàn nhưng hai pháp nhân là hai thực thể kế toán độc lập — phải có hóa đơn, có doanh thu và giá vốn ở cả hai bên.
5. **Mua dịch vụ và tài sản cố định không qua kho.** Không có phiếu nhận hàng, không có tồn kho, không khớp 3 chiều — chỉ khớp 2 chiều và hạch toán thẳng vào chi phí hoặc tài sản.
6. **Drop-ship có giao dịch kho nhưng phải là giao dịch ảo.** Hàng không đi qua kho vật lý nhưng vẫn cần dòng chứng từ để khớp công nợ hai đầu. Ghi nhận nhập xuất thật sẽ sinh tồn kho ảo.
7. **Nhập khẩu thêm ba biến số mà mua nội địa không có:** tỷ giá, chi phí đi đường, và thời điểm chuyển quyền sở hữu theo điều kiện giao hàng.

## 1. Luồng vận hành

```mermaid
flowchart TB
    subgraph M{"Chọn mô hình"}
        direction TB
        Q1{"Hàng có qua<br/>kho mình không?"}
        Q2{"Ai sở hữu<br/>hàng?"}
        Q3{"Cùng pháp nhân<br/>không?"}
    end

    M1["Gia công ngoài<br/>vật tư gửi đi, nhận về"]
    M2["Ký gửi / VMI<br/>hàng NCC trong kho mình"]
    M3["Mua nội bộ<br/>bán/mua giữa pháp nhân"]
    M4["Dịch vụ / tài sản<br/>không qua kho"]
    M5["Drop-ship<br/>NCC giao thẳng khách"]
    M6["Nhập khẩu<br/>tỷ giá và chi phí đi đường"]

    Q1 -->|Có — nhưng gửi ra ngoài| M1
    Q1 -->|Có — nhưng của NCC| M2
    Q1 -->|Không — giao thẳng khách| M5
    Q1 -->|Không — không có hàng| M4
    Q2 --> Q3
    Q3 -->|Khác pháp nhân| M3
    Q2 -->|NCC giữ quyền sở hữu| M2
    Q1 -->|Qua biên giới| M6
```

## 2. Ai làm gì ở module nào

| Mô hình | Mua hàng (PO) | Kho | Sản xuất | Kế toán | Ghi chú ranh giới |
|---|---|---|---|---|---|
| **Gia công ngoài** | Tạo PO dịch vụ gia công | Ghi xuất gửi NCC, ghi nhập về | Quản lý công đoạn thuê ngoài trong routing | Tổng hợp giá trị NVL + gia công | Giá trị thành phẩm phải gồm cả hai phần |
| **Ký gửi / VMI** | Tạo PO ký gửi, đối soát tiêu dùng | Theo dõi tồn kho VENDOR, tách khỏi tồn sẵn dùng | Tiêu dùng kích hoạt chuyển sở hữu | Chỉ hạch toán tại thời điểm tiêu dùng | Tồn kho theo chủ sở hữu, không theo kho |
| **Mua nội bộ** | PO giữa hai pháp nhân | Ghi xuất ở bên bán, nhập ở bên mua | — | Doanh thu + giá vốn ở cả hai bên | Chuyển kho vượt pháp nhân là bán/mua |
| **Dịch vụ / tài sản** | PO dịch vụ, gán tài khoản chi phí/tài sản | Không ghi giao dịch | — | Hạch toán thẳng, không qua trung gian | Khớp 2 chiều, không có phiếu nhận |
| **Drop-ship** | PO ship-to là địa chỉ khách | Ghi giao dịch ảo, không đụng tồn vật lý | — | Công nợ AP và AR đồng thời | Cần cờ logical để loại khỏi On-hand |
| **Nhập khẩu** | PO ngoại tệ, điều kiện giao hàng | Ghi nhận theo ngày chuyển sở hữu | — | Tỷ giá + chi phí thu mua phân bổ | Chi phí đi đường phải vào giá trị hàng |

## 3. Hạch toán

Bài này **không định nghĩa lại tài khoản** — bản đồ duy nhất ở [Hạch toán & tài khoản trung gian](../5-ke-toan/ke-toan-tong-hop/1000-hach-toan-va-tai-khoan-trung-gian.md). Nhưng mỗi mô hình có một nguyên tắc hạch toán phải nhớ:

| Mô hình | Nguyên tắc bắt buộc |
|---|---|
| Gia công ngoài | Giá trị nhập kho thành phẩm = giá trị vật tư gửi đi **+** phí gia công. Không được chỉ ghi phí gia công. |
| Ký gửi | **Không** hạch toán tăng tài sản khi nhận. Chỉ hạch toán khi tiêu dùng, dùng đúng giá thỏa thuận tại thời điểm tiêu dùng. |
| Mua nội bộ | Phải có **cả hai bút toán** ở hai pháp nhân: bên bán ghi doanh thu và giá vốn, bên mua ghi tài sản và công nợ. |
| Dịch vụ | Hạch toán thẳng chi phí theo tài khoản trên distribution. Không dùng tài khoản trung gian nhận hàng. |
| Tài sản cố định | Hạch toán tăng tài sản và bắt đầu khấu hao từ ngày đưa vào sử dụng, không từ ngày nhận hóa đơn. |
| Drop-ship | Sinh đồng thời công nợ phải trả (AP) và phải thu (AR) — cần khớp cả hai đầu trước khi trả tiền NCC. |
| Nhập khẩu | Chi phí vận chuyển, thuế nhập khẩu, phí thông quan phải **phân bổ vào giá trị hàng**, không ghi thẳng chi phí kỳ. |

## 4. Điểm chạm & rủi ro

- **Gia công ngoài từ góc sản xuất**: [Gia công ngoài](../3-san-xuat/2010-gia-cong-ngoai.md)
- **Giao dịch kho (kể cả giao dịch ảo)**: [Giao dịch nhập, xuất & chuyển](../1-kho/2000-giao-dich-nhap-xuat-chuyen.md)
- **Tồn kho theo chủ sở hữu**: [Cấu trúc kho & vị trí](../1-kho/1000-cau-truc-kho-va-vi-tri.md)
- **Công nợ AP và AR hai đầu drop-ship**: [AP - Nguyên lý & tài khoản](../5-ke-toan/cong-no/1000-ap-nguyen-ly-va-tai-khoan.md)
- **Chi phí thu mua phân bổ vào giá trị hàng**: [Giá vốn & định giá tồn kho](../5-ke-toan/ke-toan-tong-hop/1010-gia-von-va-dinh-gia-ton-kho.md)
- **Tỷ giá và chênh lệch tỷ giá**: [Đối trừ công nợ, netting & đa tiền tệ](../5-ke-toan/cong-no/3000-cong-no-doi-tru-netting-va-tien-te.md)

**Rủi ro chính:**

- **Gia công ngoài ghi thiếu giá trị vật tư** — giá thành thấp giả, lợi nhuận ảo, hàng tồn kho bị đánh giá sai.
- **Ký gửi ghi tăng tài sản ngay khi nhận** — vi phạm nguyên tắc kế toán, nợ phải trả khống.
- **Ký gửi nằm trong tồn khả dụng** — bán hàng hứa giao hàng không thuộc sở hữu mình.
- **Mua nội bộ không sinh hóa đơn** — sổ sách tập đoàn không khớp, loại trừ công nợ nội bộ thất bại.
- **Drop-ship ghi nhận nhập xuất thật** — tồn kho ảo xuất hiện trong báo cáo.
- **Nhập khẩu ghi chi phí đi đường vào chi phí kỳ** — giá vốn hàng nhập thấp giả, lãi kỳ nhập bị thổi phồng.

## 5. Triển khai tham chiếu ERP

### A. Ánh xạ theo mô hình

| Mô hình | Oracle EBS R12 | Epicor ERP | SAP S/4HANA | Odoo |
|---|---|---|---|---|
| Gia công ngoài | Outside Processing PO + `WIP_OSP` | `Subcontract Operation` trên Job + PO | Subcontracting PO (Item Category `L`) + `541`/`101` | `subcontracting` route |
| Ký gửi | Consigned Subinventory + Consignment PO | Consignment Warehouse + `Consignment PO` | Consignment (`Special Stock K`) + `411 K` | `owner_id` trên location |
| VMI | Supplier Managed Inventory + Supplier Portal | `Supplier Managed Inventory` | `VMI` trong SNC / `Consignment` | Cần tùy biến |
| Mua nội bộ | Intercompany PO / `MOAC` | `Intercompany PO` + `Company` | Intercompany (`STO` hoặc PO + IV) | `inter-company` rules |
| Dịch vụ | Standard PO loại Service, không shipment | `Purchase Order` item type Service | Item Category `D` (Service) | `product.type = service` |
| Tài sản cố định | PO loại Asset + Mass Additions | PO → `Asset Entry` | PO với Account Assignment `A` (Asset) | `asset` module |
| Drop-ship | Drop Ship Sales Order → PO (`OE_DROP_SHIP_SOURCES`) | `DropShip` trên OrderRel → PO | Item Category `TAS` → PO ship-to khách | Route `Dropship` |
| Nhập khẩu | Import PO + Landed Cost Management | `Landed Cost` / `Import PO` | Import PO + Customs + Landed Cost | `landed_costs` module |

### B. Hệ thống tự xây — điểm dữ liệu bắt buộc

```sql
-- Bổ sung vào bảng PO_Header đã có
ALTER TABLE PO_Header ADD
    PO_Model         VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    -- STANDARD | SUBCONTRACT | CONSIGNMENT | VMI | INTERCOMPANY | SERVICE | DROPSHIP | IMPORT
    Ship_To_Type     VARCHAR(20) NOT NULL DEFAULT 'WAREHOUSE',
    -- WAREHOUSE | CUSTOMER | SUBCONTRACTOR | PROJECT
    Counterparty_Company VARCHAR(20) NULL;  -- dùng cho INTERCOMPANY
```

Bốn ràng buộc bắt buộc:

1. **`SUBCONTRACT` phải gắn với vật tư gửi đi** — nếu không có bản ghi vật tư gửi, giá trị nhập về sẽ thiếu phần nguyên vật liệu.
2. **`CONSIGNMENT` / `VMI` phải ghi tồn với `Ownership = 'VENDOR'`** và bị loại khỏi báo cáo tài sản và On-hand khả dụng.
3. **`INTERCOMPANY` bắt buộc `Counterparty_Company`**, và phải sinh chứng từ ở cả hai bên.
4. **`DROPSHIP` phải đánh cờ `Is_Logical = 1`** trên giao dịch kho để loại khỏi báo cáo tồn.

### C. Truy vấn kiểm soát

**Hàng ký gửi đang bị tính vào giá trị tài sản — ghi nhận sai sở hữu:**

```sql
SELECT t.Item_ID, t.To_Location, SUM(t.Qty) AS Qty_Consigned
FROM Inventory_Transaction t
JOIN Inventory_Location l ON l.Location_ID = t.To_Location
WHERE l.Ownership = 'VENDOR'
GROUP BY t.Item_ID, t.To_Location
HAVING SUM(t.Qty) > 0;
```

**Đơn gia công ngoài nhưng không có vật tư gửi đi — giá thành sẽ thiếu:**

```sql
SELECT ph.PO_No, ph.Vendor_ID, pl.Item_ID, pl.Qty_Ordered
FROM PO_Header ph
JOIN PO_Line pl ON pl.PO_ID = ph.PO_ID
WHERE ph.PO_Model = 'SUBCONTRACT'
  AND NOT EXISTS (
      SELECT 1 FROM Subcontract_Material_Issue s
      WHERE s.PO_ID = ph.PO_ID AND s.Line_No = pl.Line_No);
```

**Đơn nội bộ thiếu chứng từ ở phía đối tác — sổ tập đoàn sẽ lệch:**

```sql
SELECT ph.PO_No, ph.Counterparty_Company, ph.Total_Value
FROM PO_Header ph
WHERE ph.PO_Model = 'INTERCOMPANY'
  AND ph.Status IN ('APPROVED', 'SENT')
  AND NOT EXISTS (
      SELECT 1 FROM Intercompany_Link il
      WHERE il.PO_ID = ph.PO_ID AND il.Counter_Doc_No IS NOT NULL);
```

**Nhập khẩu chưa phân bổ chi phí đi đường — giá vốn đang thấp giả:**

```sql
SELECT ph.PO_No, ph.Vendor_ID, SUM(pl.Amount) AS Goods_Value
FROM PO_Header ph
JOIN PO_Line pl ON pl.PO_ID = ph.PO_ID
WHERE ph.PO_Model = 'IMPORT'
  AND ph.Status = 'RECEIVED'
  AND NOT EXISTS (
      SELECT 1 FROM Landed_Cost_Allocation a WHERE a.PO_ID = ph.PO_ID)
GROUP BY ph.PO_No, ph.Vendor_ID;
```

## 6. Bẫy thực chiến & Checklist

| # | Bẫy | Triệu chứng | Cách phòng tránh |
|---|---|---|---|
| 1 | Gia công ngoài ghi chỉ phí gia công | Giá trị thành phẩm 2 USD thay vì 10 USD, mất 8 USD vật tư gốc | Ràng buộc: nhập thành phẩm phải gồm giá trị vật tư gửi đi |
| 2 | Vật tư gửi gia công không được theo dõi | Vật tư biến mất khỏi sổ, không ai biết còn ở nhà thầu bao nhiêu | Bảng `Subcontract_Material_Issue`, đối chiếu định kỳ với nhà thầu |
| 3 | Ký gửi hạch toán tài sản ngay khi nhận | Báo cáo tài sản phồng bằng hàng của NCC, nợ phải trả khống | `Ownership = VENDOR`, chỉ hạch toán khi tiêu dùng |
| 4 | Hàng ký gửi tính vào On-hand khả dụng | Bán hàng hứa giao hàng không thuộc sở hữu mình | Loại khỏi ATP và báo cáo tài sản theo `Ownership` |
| 5 | Mua nội bộ chỉ ghi ở một bên | Sổ tập đoàn lệch, loại trừ công nợ nội bộ không khớp | Bắt buộc sinh chứng từ đối ứng, có `Intercompany_Link` |
| 6 | Mua nội bộ không có hóa đơn | Không có căn cứ thuế và hạch toán doanh thu | Bắt buộc hóa đơn giữa hai pháp nhân |
| 7 | Đơn dịch vụ gán tài khoản kho | Chi phí nằm chờ trong tồn kho mãi mãi | Chặn gán tài khoản tồn kho cho đơn `SERVICE` |
| 8 | Tài sản cố định khấu hao từ ngày hóa đơn | Khấu hao sai kỳ, lệch chi phí | Khấu hao từ ngày đưa vào sử dụng |
| 9 | Drop-ship sinh tồn kho ảo | Báo cáo On-hand có hàng chưa từng nhập | Cờ `Is_Logical`, loại khỏi báo cáo tồn |
| 10 | Drop-ship trả tiền NCC trước khi khách nhận hàng | Rủi ro mất tiền nếu khách hủy đơn | Chỉ giải phóng AP khi có xác nhận khách đã nhận |
| 11 | Nhập khẩu ghi phí đi đường vào chi phí kỳ | Giá vốn thấp giả, lãi kỳ nhập bị thổi phồng | Phân bổ landed cost vào giá trị hàng trước khi tính giá vốn |

**Checklist trước go-live:**

- [ ] `PO_Model` có giá trị cho 100% đơn mua, không mặc định STANDARD cho tất cả.
- [ ] Gia công ngoài: đã có bảng vật tư gửi đi, đã test tính đủ giá trị thành phẩm.
- [ ] Ký gửi: tồn kho theo `Ownership`, đã test On-hand loại trừ hàng VENDOR.
- [ ] Ký gửi: đã test chỉ hạch toán tại thời điểm tiêu dùng.
- [ ] Mua nội bộ: đã test sinh chứng từ hai bên và khớp công nợ nội bộ.
- [ ] Đơn dịch vụ: đã chặn gán tài khoản tồn kho.
- [ ] Tài sản cố định: đã test khấu hao theo ngày đưa vào sử dụng.
- [ ] Drop-ship: cờ logical đã bật, đã test On-hand không bị ảnh hưởng.
- [ ] Nhập khẩu: đã test phân bổ landed cost trước khi tính giá vốn.
- [ ] Có 4 truy vấn kiểm soát ở §5.C chạy định kỳ.

## Xem thêm

- [Tổng quan Mua hàng](./0000-tong-quan-p2p.md)
- [Gia công ngoài](../3-san-xuat/2010-gia-cong-ngoai.md)
- [Giao dịch nhập, xuất & chuyển](../1-kho/2000-giao-dich-nhap-xuat-chuyen.md)
- [Giá vốn & định giá tồn kho](../5-ke-toan/ke-toan-tong-hop/1010-gia-von-va-dinh-gia-ton-kho.md)
- [Mô hình bán đặc thù](../4-ban-hang/2030-mo-hinh-ban-dac-thu.md)

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>
