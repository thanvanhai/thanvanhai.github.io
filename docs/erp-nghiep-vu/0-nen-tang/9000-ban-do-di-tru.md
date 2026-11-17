---
id: ban-do-bai-viet-cu-sang-moi
title: "9000 Bản đồ di trú bài viết cũ → khung mới"
slug: /erp-nghiep-vu/nen-tang/ban-do-di-tru
sidebar_position: 9000
description: "Bảng đối chiếu toàn bộ bài viết cũ theo module (PO, OM, INV, MFG, FIN) sang 58 file của khung 7 khối — dùng để kiểm soát không sót nội dung và không trùng lặp khi di trú."
tags: [erp, roadmap, di-tru, noi-bo]
---

# 9000 Bản đồ di trú bài viết cũ → khung mới

> **Trạng thái:** tài liệu nội bộ dùng để kiểm soát quá trình di trú. Đánh dấu `✅` khi bài mới đã có nội dung.

## 0. Quy ước

- **Gộp** = nội dung bài cũ được viết lại, cô đọng, đưa vào bài mới (nhiều bài cũ → một bài mới).
- **Chủ** = bài cũ trở thành nội dung chính (giữ gần nguyên, chỉ chuẩn hóa định dạng).
- **Bỏ** = nội dung trùng/không còn phù hợp sau tái cấu trúc.
- Mỗi khái niệm (tài khoản trung gian, UOM, khớp lệnh, logical receipt, PPV/IPV) chỉ có **một** bài chủ — bài khác dẫn link.

**Cấu trúc đích:** 7 khối, 58 file.
`0-nen-tang` (9) · `1-kho` (7) · `2-mua-hang` (9) · `3-san-xuat` (10) · `4-ban-hang` (8) · `5-cong-no` (9) · `6-ke-toan-chung` (7) · `index.mdx`

## 1. Nền tảng — `0-nen-tang` (9 file)

| Bài mới | Nguồn |
|---|---|
| `0000-cach-doc-tai-lieu.md` | Viết mới |
| `1000-to-chuc-va-phap-nhan.md` | `fin-so-cai/kien-truc-legal-entity-ledger.md` + `inv-ton-kho/3020`, `3030` + phần cơ cấu tổ chức của PO/OM |
| `2000-glossary-va-anh-xa-he-thong.md` | Gom bảng "Ghi chú đặc thù hệ thống" từ 6 bài tổng quan cũ |
| `2000-item-master-va-thuoc-tinh.md` | `inv-ton-kho/7000`, `7020`, `7030`, `6000`, `6010`, `6020` |
| `3000-chung-tu-va-nguyen-ly-doi-soat.md` | `inv-ton-kho/9000` + phần nguyên lý của `po-mua-hang/7000` |
| `4000-kiem-soat-noi-bo-va-phan-tach-nhiem-vu.md` | `po-mua-hang/7010` (mục SoD) + `4010` (approval) |
| `5000-nguyen-ly-quy-doi-uom.md` | `inv-ton-kho/9010` (**chủ**) + `7010` + `po-mua-hang/9000` |
| `6000-thuat-ngu-ky-thuat-va-du-lieu.md` | Viết mới |
| `9000-ban-do-di-tru.md` | Chính trang này |

## 2. Kho — `1-kho` (7 file) ← **thêm mới**

Đây là thay đổi lớn nhất so với khung cũ: 32 bài INV **không còn bị xé** vào mua/bán/sản xuất, mà có nhà riêng.

| Bài mới | Gộp từ bài cũ | Cách xử lý |
|---|---|---|
| `0000-tong-quan-kho.md` | `inv-ton-kho/0000-tong-quan.md` | Viết lại: 5 loại giao dịch + vai trò sổ cái vật chất (bỏ sơ đồ tầng bị trùng) |
| `1000-cau-truc-kho-va-vi-tri.md` | `inv-ton-kho/3020-quan-ly-nhieu-kho-nhieu-dia-diem-multi-warehouse.md`, `3030-cau-truc-zone-aisle-rack-bin-wms.md` | Gộp 2 → 1 |
| `2000-item-master-va-thuoc-tinh-kho.md` | `inv-ton-kho/7010-don-vi-tinh-va-quy-doi-uom-conversion.md`, `6000-quan-ly-theo-lo-lot-control.md`, `6010-quan-ly-theo-so-serial-serial-control.md`, `6020-chien-luoc-xuat-kho-fefo-first-expired-first-out.md`, `7030-thiet-lap-diem-dat-hang-lai-reorder-point-min-max.md` | Gộp 5 → 1 (danh mục gốc chi tiết ở `0-nen-tang/2000`, bài này giữ góc kho) |
| `3000-giao-dich-nhap-xuat-chuyen.md` | `inv-ton-kho/1000-nhap-kho-tu-mua-hang-po.md`, `1010-nhap-kho-tu-san-xuat-wo.md`, `1020-nhap-kho-tra-hang-khach-rma.md`, `2000-xuat-kho-ban-hang-shipment.md`, `2010-xuat-kho-cho-san-xuat-bom.md`, `2020-xuat-kho-tra-nha-cung-cap-rtv.md`, `3000-chuyen-kho-noi-bo-transfer.md`, `3010-chuyen-vi-tri-trong-kho-bin-transfer.md` | Gộp 8 → 1 — trở thành **bài gốc** về giao dịch kho; PO/OM/MFG chỉ mô tả *sự kiện nghiệp vụ dẫn tới* giao dịch |
| `4000-giu-hang-phan-bo-va-atp.md` | `om-ban-hang/4000-co-che-kiem-tra-kha-nang-cung-ung-hang-hoa-atp.md`, `om-ban-hang/4010-quy-tac-giu-hang-va-phan-bo-ton-kho-toi-uu.md`, `om-ban-hang/8020-cach-xu-ly-loi-giu-hang-ao-va-nghen-don-gio-cao-diem.md` | Gộp 3 → 1 — **bài gốc** cho giữ hàng/ATP, OM chỉ dẫn link |
| `5000-kiem-ke-va-dieu-chinh.md` | `inv-ton-kho/4000-dieu-chinh-ton-kho-adjustment.md`, `4010-kiem-ke-dinh-ky-cycle-count.md`, `4020-kiem-ke-toan-bo-physical-inventory.md`, `4030-xu-ly-chenh-lech-kiem-ke-count-variance.md`, `9020-xu-ly-am-kho-negative-inventory.md` | Gộp 5 → 1 |
| `6000-dinh-gia-va-bao-cao-kho.md` | `inv-ton-kho/5000-phuong-phap-tinh-gia-fifo-lifo-average-standard.md`, `5010-anh-huong-phuong-phap-tinh-gia-den-cogs.md`, `5020-dinh-gia-ton-kho-cuoi-ky-inventory-valuation.md`, `8000-bao-cao-ton-kho-theo-thoi-diem-stock-on-hand.md`, `8010-bao-cao-nhap-xuat-ton-inventory-movement-ledger.md`, `8020-bao-cao-ton-kho-cham-luan-chuyen-slow-moving-dead-stock.md`, `8030-du-bao-nhu-cau-ton-kho-inventory-forecasting.md`, `9030-xu-ly-ton-kho-khi-doi-ky-ke-toan-period-close.md` | Gộp 8 → 1 (giá vốn/COGS chi tiết ở `6-ke-toan-chung/2000`, bài này giữ góc kho) |

**Toàn bộ 32 bài INV đã có nhà — không còn bài nào bị xé lẻ.**

## 3. Mua hàng (PO) — 29 bài cũ → 9 file mới — `2-mua-hang`

| Bài mới | Bài cũ | Cách xử lý |
|---|---|---|
| `0000-tong-quan-p2p.md` | `po-mua-hang/0000-tong-quan-mua-hang-po.md` | Chủ (giữ sơ đồ P2P) |
| `1000-nhu-cau-va-lua-chon-ncc.md` | `3000-nghiep-vu-yeu-cau-mua-hang-va-quy-trinh-gom-nhu-cau.md`, `3010-thiet-lap-luong-phe-duyet-pr.md`, `3020-quy-trinh-moi-thau-yeu-cau-bao-gia-va-so-sanh.md`, `3030-mua-sam-tu-phuc-vu-qua-danh-muc-dien-tu-va-punch-out.md` | Gộp 4 → 1 |
| `2000-danh-muc-va-hop-dong-mua.md` | `1000-thiet-lap-co-cau-to-chuc-mua-sam.md`, `1010-thiet-lap-va-phan-loai-chung-tu-mua-hang.md`, `2000-quan-ly-ho-so-nha-cung-cap.md`, `2010-thiet-lap-bang-gia-nha-cung-cap-va-thoa-thuan-mua-hang.md`, `2020-quy-tac-xac-dinh-nguon-cung-tu-dong.md`, `2030-thiet-lap-quy-tac-tinh-thue-dau-vao.md`, `2040-quan-ly-hop-dong-va-thoa-thuan-khung.md` | Gộp 7 → 1 (cơ cấu tổ chức dẫn sang [`0-nen-tang/1000`](../0-nen-tang/1000-to-chuc-va-phap-nhan.md)) |
| `3000-don-mua-hang.md` | `4000-khoi-tao-va-cau-hinh-don-mua-hang-tieu-chuan.md`, `4010-thiet-lap-luong-phe-duyet-po.md`, `4020-quy-trinh-quan-ly-thay-doi-va-phien-ban-po.md`, `5000-theo-doi-tien-do-giao-hang-qua-cong-thong-tin-nha-cung-cap.md` | Gộp 4 → 1 |
| `4000-nhan-hang-va-kiem-qc.md` | `5010-nghiep-vu-nhan-hang-mua-kiem-tra-chat-luong-va-nhap-kho.md`, `5020-xu-ly-tinh-huong-giao-hang-loi-thua-thieu-va-hoan-tra.md`, `inv-ton-kho/1000-nhap-kho-tu-mua-hang-po.md` | Gộp 3 → 1 ✅ **đã viết** |
| `5000-doi-soat-hoa-don-va-3-way-match.md` | `7000-nguyen-ly-doi-soat-khop-lenh-3-chieu-va-2-chieu.md`, `7010-xu-ly-chenh-lech-gia-so-luong-tren-hoa-don.md` | Gộp 2 → 1 (bỏ định nghĩa tài khoản trung gian, dẫn link) |
| `6000-mo-hinh-mua-dac-thu.md` | `6000-nghiep-vu-mua-hang-gia-cong-ngoai-dinh-muc.md`, `6010-nghiep-vu-mua-hang-ky-gui-nha-cung-cap-va-vmi.md`, `6020-quan-ly-don-mua-hang-noi-bo-giua-cac-phap-nhan.md`, `6030-mua-sam-dich-vu-phi-vat-chat-va-tai-san-co-dinh.md`, `6040-mua-hang-giao-thang-den-khach-hang-drop-ship.md`, `5030-thu-tuc-nhap-khau-thong-quan-va-dieu-kien-giao-hang-quoc-te.md` | Gộp 6 → 1 |
| `7000-bao-cao-mua-hang.md` | `8000-phan-tich-co-cau-chi-phi-mua-hang-va-hieu-qua-chi-tieu.md`, `8010-thiet-lap-bo-chi-so-danh-gia-hieu-suat-nha-cung-cap.md` | Gộp 2 → 1 |
| `9000-bay-mua-hang.md` | `9000-xu-ly-loi-lech-don-vi-tinh-mua-hang-va-luu-kho.md`, `9010-ky-thuat-dong-va-don-dep-yeu-cau-pr-po-treo.md` | Gộp 2 → 1 (lý thuyết UOM → [`0-nen-tang/5000`](../0-nen-tang/5000-nguyen-ly-quy-doi-uom.md)) |

## 4. Sản xuất (MFG) — `3-san-xuat` (10 file)

| Bài mới | Bài cũ | Cách xử lý |
|---|---|---|
| `0000-tong-quan-san-xuat.md` | `2-quan-ly-san-xuat/index.mdx`, `mfg-ky-thuat/0000-tong-quan...`, `mfg-thuc-thi/0000-tong-quan...` | Gộp 3 → 1 |
| `ky-thuat/1000-work-center-va-nang-luc.md` | `1000-khai-bao-work-center.md`, `1010-quan-ly-may-moc-thiet-bi-tooling.md`, `1020-khai-bao-ca-kip-nhan-luc.md`, `1030-nang-suat-hieu-suat-thiet-ke.md`, `1040-lien-ket-work-center-cost-center.md`, `1050-thiet-lap-work-center-thay-the.md` | Gộp 6 → 1 |
| `ky-thuat/2000-bom-va-dinh-muc.md` | `2000` → `2070` (8 bài BOM: tiêu chuẩn, đa cấp, hao hụt, thay thế, phantom, EBOM/MBOM, super BOM, phân loại) | Gộp 8 → 1 |
| `ky-thuat/3000-routing-va-cong-doan.md` | `3000` → `3060` (7 bài Routing) | Gộp 7 → 1 |
| `ky-thuat/4000-phien-ban-san-xuat-va-lo.md` | `4000-thiet-lap-phien-ban-san-xuat.md`, `4010-quy-mo-lo-san-xuat.md`, `4020-thiet-lap-dieu-kien-lua-chon-phien-ban.md` | Gộp 3 → 1 |
| `ky-thuat/5000-thay-doi-ky-thuat-va-eco.md` | `5000-quy-trinh-yeu-cau-va-lenh-thay-doi-ky-thuat.md`, `5010-quan-ly-lich-su-phien-ban-bom-routing.md`, `5020-phan-tich-tac-dong-thay-doi-ky-thuat.md` | Gộp 3 → 1 |
| `thuc-thi/6000-lenh-san-xuat-va-wip.md` | `inv-ton-kho/1010`, `inv-ton-kho/2010`, toàn bộ 24 mục còn trống của `mfg-thuc-thi` | **Viết mới** phần lớn |
| `thuc-thi/7000-gia-cong-ngoai.md` | `po-mua-hang/6000-...gia-cong-ngoai-dinh-muc.md` (góc mua) + `mfg-ky-thuat/3030-...cong-doan-gia-cong-ngoai.md` (góc SX) | Tách góc nhìn; góc mua ở `2-mua-hang/6000` |
| `thuc-thi/8000-gia-thanh-san-xuat.md` | `mfg-ky-thuat/6010-lien-ket-bom-routing-gia-thanh-dinh-muc.md`, `mfg-ky-thuat/6000-quan-ly-dong-san-pham-va-phu-pham.md`, `fin-gia-thanh/*` (18 mục trống) | Gộp 2 + viết mới |
| `9000-bay-san-xuat.md` | `mfg-ky-thuat/7020-xu-ly-loi-bom-vong-lap-va-lech-uom.md`, `mfg-ky-thuat/6020-dong-bo-item-master-inv-mfg.md`, `7000-bao-cao-where-used...`, `7010-cong-cu-thay-doi-hang-loat...` | Gộp 4 → 1 |

## 5. Bán hàng (OM) — `4-ban-hang` (8 file)

| Bài mới | Bài cũ | Cách xử lý |
|---|---|---|
| `0000-tong-quan-o2c.md` | `om-ban-hang/0000-tong-quan-ban-hang-om.md` | Chủ |
| `1000-danh-muc-va-chinh-sach-ban.md` | `1000-thiet-lap-co-cau-to-chuc-ban-hang.md`, `1010-thiet-lap-loai-chung-tu-don-hang.md`, `2000-thiet-lap-ho-so-khach-hang-va-phan-nhom.md`, `2010-quan-ly-han-muc-tin-dung-va-khoa-don.md`, `2020-thiet-lap-bang-gia-da-kenh-va-chiet-khau.md`, `2030-thiet-lap-khuyen-mai-va-qua-tang-tu-dong.md`, `2040-thiet-lap-chinh-sach-chiet-khau-hoi-to-rebate.md`, `4020-thiet-lap-luong-phe-duyet-don-hang-tu-dong.md` | Gộp 8 → 1 |
| `2000-tiep-nhan-don-va-atp.md` | `3000` → `3060` (7 bài tiếp nhận đơn), `4030-co-che-kiem-tra-tin-dung-va-chan-giao-xuat-hoa-don.md` | Gộp 8 → 1 (ATP/giữ hàng → [`1-kho/4000`](../1-kho/4000-giu-hang-phan-bo-va-atp.md)) |
| `3000-giao-hang-va-xuat-kho.md` | `5000` → `5030` (4 bài), `inv-ton-kho/2000-xuat-kho-ban-hang-shipment.md` | Gộp 5 → 1 |
| `4000-rma-va-doi-tra.md` | `om-ban-hang/7000-quy-trinh-phe-duyet-yeu-cau-khach-tra-hang-rma.md`, `inv-ton-kho/1020-nhap-kho-tra-hang-khach-rma.md` | Gộp 2 + viết mới mục đổi hàng/bồi thường |
| `5000-mo-hinh-ban-dac-thu.md` | `6000-drop-shipment`, `6010-back-to-back`, `6020-ky-gui-dai-ly`, `6030-xuat-khau`, `6040-noi-bo` | Gộp 5 → 1 (kiến trúc SO↔PO → `2-mua-hang/6000`) |
| `6000-bao-cao-ban-hang.md` | Các mục `8000`, `8010`, `8030` (còn trống) | Viết mới |
| `9000-bay-ban-hang.md` | `om-ban-hang/8020-...giu-hang-ao-va-nghen-don...` | Chuyển nội dung kỹ thuật sang [`1-kho/4000`](../1-kho/4000-giu-hang-phan-bo-va-atp.md), bài này giữ checklist vận hành |

## 6. Công nợ (AP/AR) — `5-cong-no` (9 file)

| Bài mới | Bài cũ | Cách xử lý |
|---|---|---|
| `0000-tong-quan-cong-no.md` | `fin-cong-no/0000-tong-quan-quan-ly-cong-no-fin.md` | Chủ |
| `ap/1000-ap-nguyen-ly-va-tai-khoan.md` | `fin-cong-no/3010`, `fin-cong-no/3040` | Gộp 2 → 1 |
| `ap/2000-ap-nhan-hoa-don-va-doi-tat-tam-ung.md` | `fin-cong-no/3000`, `fin-cong-no/3040`, `fin-cong-no/6020` | Gộp 3 → 1 |
| `ap/3000-ap-thanh-toan-va-cash-out.md` | `fin-cong-no/3020`, `fin-cong-no/3030` | Gộp 2 → 1 |
| `ap/4000-ap-bay-va-kiem-soat.md` | `fin-cong-no/6030`, `6040`, `6000`, `6010` | Gộp 4 → 1 |
| `ar/5000-ar-nguyen-ly-va-tai-khoan.md` | `fin-cong-no/2000`, `fin-cong-no/2030` | Gộp 2 → 1 |
| `ar/6000-ar-xuat-hoa-don-va-han-muc-tin-dung.md` | `fin-cong-no/2000`, `fin-cong-no/2040`, `fin-cong-no/2050` | Gộp 3 → 1 |
| `ar/7000-ar-thu-tien-va-dunning.md` | `fin-cong-no/2010`, `fin-cong-no/2030`, `fin-cong-no/5000` | Gộp 3 → 1 |
| `8000-cong-no-doi-tru-netting-va-tien-te.md` + `9000-bao-cao-cong-no-aging-cashflow.md` | `fin-cong-no/2020`, `3050`, `4040` / `4010`, `5000`–`5030` | Gộp 3 + 5 |

## 7. Kế toán chung — `6-ke-toan-chung` (7 file)

| Bài mới | Bài cũ | Cách xử lý |
|---|---|---|
| `0000-tong-quan-ke-toan.md` | `3-tai-chinh-ke-toan/index.mdx` | Chủ |
| `1000-hach-toan-va-tai-khoan-trung-gian.md` | GR/IR rải rác ở `po-mua-hang/7000`, `inv-ton-kho/1000`, `inv-ton-kho/2020`, `fin-cong-no/4040`, `fin-gia-thanh/4030` | **Chủ + chốt duy nhất** ✅ **đã viết** |
| `2000-gia-von-va-dinh-gia-ton-kho.md` | `inv-ton-kho/5000`, `5010`, `5020` | Gộp 3 → 1 (góc kế toán của valuation) |
| `3000-thue-va-tai-san-co-dinh.md` | `fin-thue/*` (21 mục trống), `fin-tai-san-co-dinh/*` (25 mục trống) | Viết mới |
| `4000-so-cai-va-bao-cao-tai-chinh.md` | `fin-so-cai/0000-tong-quan...` + 23 mục trống | Gộp + viết mới |
| `5000-dong-ky-va-doi-soat-so-phu.md` | `fin-cong-no/4020`, `fin-cong-no/4030` + chuỗi đóng kỳ | Gộp, chuyển thao tác kho sang [`1-kho/5000`](../1-kho/5000-kiem-ke-va-dieu-chinh.md) |
| `9000-bay-ke-toan.md` | `fin-cong-no/4040` (ERV), `fin-gia-thanh/4030` | Gộp, không lặp UOM |

## 8. Kiểm soát chống trùng (bắt buộc khi viết)

| Khái niệm | Bài gốc duy nhất | Bài khác chỉ được |
|---|---|---|
| Tài khoản trung gian (GR/IR) | [`6-ke-toan-chung/1000`](../6-ke-toan-chung/1000-hach-toan-va-tai-khoan-trung-gian.md) | Link, 1–2 câu ngữ cảnh |
| Quy đổi UOM | [`0-nen-tang/5000`](../0-nen-tang/5000-nguyen-ly-quy-doi-uom.md) | Link |
| Item master & thuộc tính bất biến | [`0-nen-tang/2000`](../0-nen-tang/2000-item-master-va-thuoc-tinh.md) | Link |
| **Giao dịch kho (nhập/xuất/chuyển/ảo)** | [`1-kho/3000`](../1-kho/3000-giao-dich-nhap-xuat-chuyen.md) | Link |
| **Giữ hàng & ATP** | [`1-kho/4000`](../1-kho/4000-giu-hang-phan-bo-va-atp.md) | Link |
| Cấu trúc kho & vị trí | [`1-kho/1000`](../1-kho/1000-cau-truc-kho-va-vi-tri.md) | Link |
| Kiểm kê & điều chỉnh | [`1-kho/5000`](../1-kho/5000-kiem-ke-va-dieu-chinh.md) | Link |
| Quy trình nhận hàng 3 bước | [`2-mua-hang/4000`](../2-mua-hang/4000-nhan-hang-va-kiem-qc.md) | Link |
| Khớp lệnh 2/3/4 chiều | [`2-mua-hang/5000`](../2-mua-hang/5000-doi-soat-hoa-don-va-3-way-match.md) | Link |
| Cấu trúc dữ liệu SO↔PO / logical receipt | [`2-mua-hang/6000`](../2-mua-hang/6000-mo-hinh-mua-dac-thu.md) + [`4-ban-hang/5000`](../4-ban-hang/5000-mo-hinh-ban-dac-thu.md) | Mỗi bên chỉ giữ góc nhìn của mình |
| Giá vốn / COGS | [`6-ke-toan-chung/2000`](../6-ke-toan-chung/2000-gia-von-va-dinh-gia-ton-kho.md) | Link |
| PPV / IPV | [`6-ke-toan-chung/1000`](../6-ke-toan-chung/1000-hach-toan-va-tai-khoan-trung-gian.md) | Link |
| Phân tách nhiệm vụ (SoD) | [`0-nen-tang/4000`](../0-nen-tang/4000-kiem-soat-noi-bo-va-phan-tach-nhiem-vu.md) | Link |
| Đóng kỳ | [`6-ke-toan-chung/5000`](../6-ke-toan-chung/5000-dong-ky-va-doi-soat-so-phu.md) | Link |

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>
