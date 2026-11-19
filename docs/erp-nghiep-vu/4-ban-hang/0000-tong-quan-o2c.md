---
id: tong-quan-o2c
title: "Tổng quan Bán hàng (Order-to-Cash)"
sidebar_label: Tổng quan Bán hàng
slug: /erp-nghiep-vu/ban-hang/tong-quan
sidebar_position: 0
description: "Bức tranh toàn cảnh Order-to-Cash: báo giá, đơn bán, kiểm tra tín dụng và ATP, giao hàng, xuất hóa đơn, đổi trả và thu tiền — cùng ranh giới trách nhiệm với kho và kế toán."
date: 2026-08-12
last_update:
  date: 2026-11-19
tags: [erp, sales, o2c, tong-quan]
---

# Tổng quan Bán hàng (Order-to-Cash)

Bán hàng không kết thúc ở lúc ký đơn. Nó kết thúc khi tiền về tài khoản — và trên đường đi có bốn bộ phận khác nhau cùng tham gia: người bán, người kho, người xuất hóa đơn, người thu tiền. Đơn hàng hứa giao thứ kho không có, hóa đơn xuất trước khi hàng đi, tiền thu về nhưng không khớp hóa đơn — đều là những lỗi xảy ra ở **ranh giới giữa các bộ phận**, không phải trong từng bộ phận.

Bài này mô tả toàn cảnh quy trình và ranh giới trách nhiệm. Chi tiết từng bước ở các bài riêng trong cùng khối.

## Quy trình gồm bảy bước

```mermaid
flowchart LR
    Q["1. Báo giá"] --> SO["2. Đơn bán<br/>SO"]
    SO --> CHK["3. Kiểm tra<br/>tín dụng và ATP"]
    CHK --> PICK["4. Chuẩn bị hàng<br/>và xuất kho"]
    PICK --> SHIP["5. Xác nhận giao<br/>và POD"]
    SHIP --> BILL["6. Xuất hóa đơn<br/>AR"]
    BILL --> CASH["7. Thu tiền<br/>và đối trừ"]
    SHIP -.->|hàng có vấn đề| RMA["Đổi trả<br/>RMA"]
    RMA -.-> BILL
```

Điểm mấu chốt: **bước 3 là chốt chặn kép** — kiểm tra cả *khách có đủ khả năng trả tiền* (tín dụng) lẫn *mình có đủ hàng để giao* (ATP). Bỏ qua một trong hai thì hoặc mất tiền, hoặc mất uy tín.

## Mỗi bước trả lời một câu hỏi

| Bước | Câu hỏi cần trả lời | Bài chi tiết |
|---|---|---|
| Báo giá & danh mục | Bán cho ai, giá nào, chiết khấu bao nhiêu? | [Danh mục & chính sách bán](./1000-danh-muc-va-chinh-sach-ban.md) |
| Đơn bán | Đặt gì, khi nào, giao về đâu? | [Tiếp nhận đơn & ATP](./2000-tiep-nhan-don-va-atp.md) |
| Kiểm tra | Khách có đủ hạn mức? Mình có đủ hàng? | [Tiếp nhận đơn & ATP](./2000-tiep-nhan-don-va-atp.md) |
| Giao hàng | Lấy hàng nào, đóng gói và giao ra sao? | [Giao hàng & xuất kho](./3000-giao-hang-va-xuat-kho.md) |
| Hóa đơn | Xuất hóa đơn cho đúng thứ đã giao? | [AR - Xuất hóa đơn & hạn mức tín dụng](../5-cong-no/ar/6000-ar-xuat-hoa-don-va-han-muc-tin-dung.md) |
| Thu tiền | Tiền về đối trừ hóa đơn nào? | [AR - Thu tiền & nhắc nợ](../5-cong-no/ar/7000-ar-thu-tien-va-dunning.md) |
| Đổi trả | Nhận lại hàng và trả tiền khách thế nào? | [RMA & đổi trả](./4000-rma-va-doi-tra.md) |

## Ranh giới trách nhiệm

| Việc | Bán hàng quyết định | Kho quyết định | Kế toán quyết định |
|---|---|---|---|
| Bán cho ai, giá bao nhiêu | ✅ | — | — |
| Có đủ hàng để hứa giao | Đọc ATP để trả lời khách | ✅ tính ATP và giữ hàng | — |
| Có xuất hàng được không | Yêu cầu xuất | ✅ kiểm tra và ghi giao dịch | Chặn xuất nếu khách quá hạn nợ |
| Hóa đơn ghi bao nhiêu | Cung cấp điều kiện giá | Cung cấp số lượng thực giao | ✅ xuất và ghi sổ |
| Được bán chịu hay không | ✅ xin duyệt vượt hạn mức | — | ✅ sở hữu hạn mức tín dụng |
| Thu tiền và xóa nợ | Hỗ trợ đối chiếu | — | ✅ |

Nguyên tắc cốt lõi: **người bán không được tự tăng hạn mức tín dụng, người kho không được tự đổi giá, người thu tiền không được tự hủy hóa đơn.**

## Bán hàng liên quan gì tới các phần khác

- **Kho** giữ hàng, trừ tồn và ghi giao dịch xuất: [Giữ hàng, phân bổ & ATP](../1-kho/4000-giu-hang-phan-bo-va-atp.md), [Giao dịch nhập, xuất & chuyển](../1-kho/3000-giao-dich-nhap-xuat-chuyen.md)
- **Công nợ** nhận hóa đơn đã xuất và thực hiện thu tiền: [AR - Nguyên lý & tài khoản](../5-cong-no/ar/5000-ar-nguyen-ly-va-tai-khoan.md)
- **Kế toán chung** nhận bút toán doanh thu và giá vốn: [Hạch toán & tài khoản trung gian](../6-ke-toan-chung/1000-hach-toan-va-tai-khoan-trung-gian.md)
- **Sản xuất** cung cấp thành phẩm cho kho trước khi bán: [Lệnh sản xuất & WIP](../3-san-xuat/thuc-thi/6000-lenh-san-xuat-va-wip.md)

## Bắt đầu đọc từ đâu

Nếu triển khai từ đầu, đọc theo thứ tự 1000 → 9000. Nếu đang xử lý sự cố, đi thẳng tới bài tương ứng:

- Hứa giao hàng nhưng kho không có → [Tiếp nhận đơn & ATP](./2000-tiep-nhan-don-va-atp.md)
- Khách quá hạn nợ vẫn đặt được đơn → [Danh mục & chính sách bán](./1000-danh-muc-va-chinh-sach-ban.md)
- Giá bán sai, chiết khấu cộng dồn → [Danh mục & chính sách bán](./1000-danh-muc-va-chinh-sach-ban.md)
- Hàng không qua kho, giao thẳng từ nhà cung cấp → [Mô hình bán đặc thù](./5000-mo-hinh-ban-dac-thu.md)
- Khách trả hàng nhưng công nợ không giảm → [RMA & đổi trả](./4000-rma-va-doi-tra.md)

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>
