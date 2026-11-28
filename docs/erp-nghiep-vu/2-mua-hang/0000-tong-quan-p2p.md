---
id: tong-quan-p2p
title: "Tổng quan Mua hàng (Procure-to-Pay)"
sidebar_label: Tổng quan Mua hàng
slug: /mua-hang/tong-quan
sidebar_position: 0
description: "Bức tranh toàn cảnh Procure-to-Pay: nhu cầu, chọn nhà cung cấp, đơn mua, nhận hàng, khớp lệnh hóa đơn và công nợ phải trả — cùng ranh giới trách nhiệm với kho và kế toán."
date: 2026-08-06
last_update:
  date: 2026-11-19
tags: [erp, procurement, p2p, tong-quan]
---

# Tổng quan Mua hàng (Procure-to-Pay)

Mua hàng không phải "việc của phòng mua". Một đơn mua đi qua bốn bộ phận khác nhau — người có nhu cầu, người mua, người nhận hàng, người trả tiền — và hỏng ở bất kỳ khâu nào cũng dẫn tới cùng một kết quả: **doanh nghiệp trả tiền cho thứ mình không có, hoặc không có thứ mình đã trả tiền**.

Bài này mô tả toàn cảnh quy trình và ranh giới trách nhiệm giữa các bên. Chi tiết từng bước nằm ở các bài riêng trong cùng khối.

## Quy trình gồm bảy bước

```mermaid
flowchart LR
    PR["1. Nhu cầu<br/>PR"] --> SRC["2. Chọn nguồn<br/>báo giá / hợp đồng"]
    SRC --> PO["3. Đơn mua<br/>PO"]
    PO --> GR["4. Nhận hàng<br/>+ kiểm QC"]
    GR --> MATCH["6. Khớp lệnh<br/>PO · Nhận · HĐ"]
    GR -.->|có vấn đề| CHG["5. Thừa thiếu<br/>trả hàng"]
    CHG -.-> MATCH
    MATCH --> AP["7. Công nợ<br/>và thanh toán"]
```

Điểm mấu chốt: **bước 4 và 6 thuộc hai chuỗi kiểm soát khác nhau**. Bước 4 chứng minh *hàng có thật*; bước 6 chứng minh *giá và số lượng trên hóa đơn hợp lệ*. Một doanh nghiệp có thể nhận đúng hàng mà vẫn bị xuất hóa đơn sai giá — và ngược lại.

## Ba nhóm tài liệu

### 🟢 Nhóm 1: Dữ liệu gốc & Thiết lập nền tảng (Master Data & Setup)

*Mục đích: Xác lập mua gì, của ai, với điều kiện nào — trước khi phát sinh bất kỳ đơn mua nào.*

- **[1000 Nhu cầu mua hàng & lựa chọn nhà cung cấp](./1000-nhu-cau-va-lua-chon-ncc.md)** — Mua gì, bao nhiêu, cho ai, ai duyệt; chọn nguồn cung.
- **[1010 Danh mục & hợp đồng mua](./1010-danh-muc-va-hop-dong-mua.md)** — Danh mục nhà cung cấp, giá thỏa thuận, điều kiện giao và thanh toán.

### 🟡 Nhóm 2: Vận hành Procure-to-Pay (Operations)

*Mục đích: Luồng chạy thật của một đơn mua từ lúc đặt đến lúc khớp hóa đơn.*

- **[2000 Đơn mua hàng](./2000-don-mua-hang.md)** — Đặt chính thức những gì, khi nào, giao về đâu.
- **[2010 Nhận hàng & kiểm tra chất lượng](./2010-nhan-hang-va-kiem-qc.md)** — Thực tế nhận được gì, có đạt chất lượng không.
- **[2020 Đối soát hóa đơn & 3-Way Match](./2020-doi-soat-hoa-don-va-3-way-match.md)** — Hóa đơn có khớp với điều đã đặt và đã nhận.
- **[2030 Mô hình mua đặc thù](./2030-mo-hinh-mua-dac-thu.md)** — Hàng giao thẳng, mua dịch vụ, mua tài sản, mua kèm gia công.

### 🔴 Nhóm 3: Kiểm soát & Báo cáo (Control & Reporting)

*Mục đích: Đo lường hiệu quả mua hàng, đối soát với kế toán và học từ các sai sót thực tế.*

- **[3000 Báo cáo mua hàng](./3000-bao-cao-mua-hang.md)** — Chi tiêu theo nhà cung cấp/nhóm hàng, đơn treo, thời gian giao thực tế.
- **[9000 Bẫy thực chiến mua hàng](./9000-bay-mua-hang.md)** — Những lỗi khiến mua hàng thất thoát mà sổ sách vẫn cân.

## Ranh giới trách nhiệm

| Việc | Mua hàng quyết định | Kho quyết định | Kế toán quyết định |
|---|---|---|---|
| Mua bao nhiêu, của ai, giá nào | ✅ | — | — |
| Ghi nhận số lượng thực nhận | — | ✅ | — |
| Chất lượng hàng có đạt | Đàm phán với NCC khi lỗi | ✅ ghi nhận kết quả | — |
| Giá trị ghi sổ và công nợ | — | Cung cấp số lượng và giá trị nhập | ✅ |
| Được phép trả tiền hay chưa | ✅ duyệt sai lệch | — | ✅ khớp lệnh và giải ngân |

Nguyên tắc: **không ai được làm hai vai trò trên cùng một chứng từ** — người tạo đơn không duyệt chi, người nhận hàng không tự khớp hóa đơn.

## Mua hàng liên quan gì tới các phần khác

- **Kho** ghi nhận số lượng thực nhận và giữ hàng: [Nhận hàng & kiểm tra chất lượng](./2010-nhan-hang-va-kiem-qc.md), [Giao dịch nhập, xuất & chuyển](../1-kho/2000-giao-dich-nhap-xuat-chuyen.md)
- **Công nợ** nhận hóa đơn đã khớp và thực hiện trả tiền: [AP - Nguyên lý & tài khoản](../5-ke-toan/cong-no/1000-ap-nguyen-ly-va-tai-khoan.md)
- **Kế toán chung** nhận bút toán tăng tài sản và tài khoản trung gian: [Hạch toán & tài khoản trung gian](../5-ke-toan/ke-toan-tong-hop/1000-hach-toan-va-tai-khoan-trung-gian.md)
- **Sản xuất** tạo nhu cầu mua từ MRP và nhận nguyên liệu qua kho: [Lệnh sản xuất & WIP](../3-san-xuat/2000-lenh-san-xuat-va-wip.md)

## Bắt đầu đọc từ đâu

Nếu triển khai từ đầu, đọc theo thứ tự 1000 → 9000. Nếu đang xử lý sự cố, đi thẳng tới bài tương ứng:

- Hóa đơn lệch giá hoặc lệch số lượng → [Đối soát hóa đơn & 3-Way Match](./2020-doi-soat-hoa-don-va-3-way-match.md)
- Hàng về kho mà chưa có hóa đơn → [Hạch toán & tài khoản trung gian](../5-ke-toan/ke-toan-tong-hop/1000-hach-toan-va-tai-khoan-trung-gian.md)
- Hàng giao thẳng cho khách, không qua kho → [Mô hình mua đặc thù](./2030-mo-hinh-mua-dac-thu.md)
- Đơn mua treo hàng tháng không ai xử lý → [Bẫy thực chiến mua hàng](./9000-bay-mua-hang.md)

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>
