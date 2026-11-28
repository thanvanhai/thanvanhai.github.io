---
id: tong-quan-san-xuat
title: "Tổng quan Sản xuất (Plan-to-Produce)"
sidebar_label: Tổng quan Sản xuất
slug: /erp-nghiep-vu/san-xuat/tong-quan
sidebar_position: 0
description: "Bức tranh toàn cảnh Plan-to-Produce: kỹ thuật sản xuất (Work Center, BOM, Routing, phiên bản, ECO), thực thi (lệnh sản xuất, WIP, gia công ngoài) và giá thành — nằm giữa mua hàng và bán hàng."
date: 2026-08-17
last_update:
  date: 2026-11-19
tags: [erp, manufacturing, mfg, tong-quan]
---

# Tổng quan Sản xuất (Plan-to-Produce)

Sản xuất là **khúc giữa** của dòng chảy: nhận nguyên vật liệu từ mua hàng, tạo ra thành phẩm cho bán hàng. Nó cũng là phân hệ duy nhất **tạo ra giá trị** — mua hàng chỉ chuyển quyền sở hữu, bán hàng chỉ chuyển hàng đi; chỉ sản xuất mới biến nguyên liệu thành thứ đáng giá hơn.

Nhưng chính vì đứng giữa, sản xuất chịu ảnh hưởng từ cả hai phía: mua trễ thì thiếu nguyên liệu, bán đổi đơn thì lệnh sản xuất phải sửa. Bài này mô tả toàn cảnh và ranh giới trách nhiệm.

## Sản xuất gồm hai tầng

```mermaid
flowchart LR
    subgraph ENG["Kỹ thuật sản xuất<br/>dữ liệu nền"]
        direction TB
        WC["Work Center<br/>và ca kíp"]
        BOM["BOM<br/>định mức nguyên vật liệu"]
        RT["Routing<br/>công đoạn và thời gian"]
        PV["Phiên bản sản xuất"]
        ECO["Thay đổi kỹ thuật<br/>và phiên bản"]
    end

    subgraph EXE["Thực thi sản xuất<br/>dữ liệu giao dịch"]
        direction TB
        WO["Lệnh sản xuất"]
        WIP["Cấp liệu và WIP"]
        OSP["Gia công ngoài"]
        FG["Nhập kho thành phẩm"]
    end

    subgraph COST["Giá thành"]
        C["Giá thành thực tế<br/>và chênh lệch"]
    end

    WC --> PV
    BOM --> PV
    RT --> PV
    ECO -.->|tạo phiên bản mới| PV
    PV --> WO
    WO --> WIP
    WIP --> OSP
    OSP --> FG
    FG --> C

    KHO[("Kho")] -.->|xuất nguyên vật liệu| WIP
    FG -.->|nhập thành phẩm| KHO
```

**Đọc sơ đồ:** khối kỹ thuật là *dữ liệu nền, ít thay đổi*; khối thực thi là *giao dịch hằng ngày*; giá thành là *kết quả tổng hợp cuối cùng*. Sai ở tầng kỹ thuật sẽ làm sai hàng nghìn lệnh sản xuất về sau — đây là lý do tầng này phải được chốt trước khi go-live.

## Ba nhóm tài liệu

### 🟢 I. Kỹ thuật sản xuất (Engineering / Master Data)

*Mục đích: Xác lập sản phẩm được làm từ gì, qua công đoạn nào, với phiên bản nào — dữ liệu nền ít thay đổi.*

- **[1000 Work Center & năng lực](./1000-work-center-va-nang-luc.md)** — Nhà máy có bao nhiêu năng lực, chạy mấy ca.
- **[1010 BOM & định mức](./1010-bom-va-dinh-muc.md)** — Sản phẩm cần những gì, bao nhiêu.
- **[1020 Routing & công đoạn](./1020-routing-va-cong-doan.md)** — Làm qua những công đoạn nào, mất bao lâu.
- **[1030 Phiên bản sản xuất & quy mô lô](./1030-phien-ban-san-xuat-va-lo.md)** — Với sản phẩm này thì dùng BOM và Routing nào.
- **[1040 Thay đổi kỹ thuật & ECO](./1040-thay-doi-ky-thuat-va-eco.md)** — Ai duyệt thay đổi kỹ thuật, có hiệu lực khi nào.

### 🟡 II. Thực thi sản xuất (Execution)

*Mục đích: Giao dịch hằng ngày — chạy lệnh, cấp liệu, nhập thành phẩm và tính ra giá thành thực tế.*

- **[2000 Lệnh sản xuất & WIP](./2000-lenh-san-xuat-va-wip.md)** — Lệnh sản xuất đang ở đâu, đã tiêu bao nhiêu.
- **[2010 Gia công ngoài](./2010-gia-cong-ngoai.md)** — Gửi nguyên liệu ra ngoài gia công thế nào.
- **[2020 Giá thành sản xuất](./2020-gia-thanh-san-xuat.md)** — Chi phí thực tế chênh định mức bao nhiêu, vì sao.

### 🔴 III. Bẫy & triển khai tham chiếu (Pitfalls & Reference)

*Mục đích: Lỗi đã gặp ngoài thực tế và cách triển khai cụ thể trên hệ thống.*

- **[9000 Bẫy thực chiến sản xuất](./9000-bay-san-xuat.md)** — Những lỗi khiến giá thành sai mà sổ sách vẫn cân.
- **[9100 Triển khai Epicor: đếm số shot của khuôn](./9100-trien-khai-epicor-shot-count-khuon.md)** — Cấu hình tuổi thọ khuôn trên Epicor.

## Ranh giới trách nhiệm

| Việc | Sản xuất quyết định | Kho quyết định | Mua hàng quyết định | Kế toán quyết định |
|---|---|---|---|---|
| BOM, Routing, phiên bản | ✅ | — | — | — |
| Có đủ nguyên liệu để chạy lệnh | Đọc tồn khả dụng | ✅ giữ và cấp liệu | ✅ cung cấp theo tiến độ | — |
| Số lượng thực nhập thành phẩm | ✅ báo cáo sản lượng | ✅ ghi giao dịch | — | — |
| Ghi nhận chi phí WIP | ✅ cung cấp số thực tế | Ghi giá trị xuất kho | Ghi giá nhập | ✅ hạch toán |
| Đánh giá chênh lệch giá thành | Phân tích nguyên nhân | — | — | ✅ hạch toán và quyết định phân bổ |
| Mua nguyên vật liệu gì | Đề xuất từ MRP | Đề xuất từ tồn | ✅ quyết định và đặt | — |

Nguyên tắc: **kỹ thuật sản xuất chỉ được sửa qua quy trình thay đổi kỹ thuật**, không sửa trực tiếp BOM/Routing đang chạy. Sửa trực tiếp làm lệnh đang sản xuất dở bị đổi định mức giữa chừng.

## Sản xuất liên quan gì tới các phần khác

- **Kho** cấp nguyên vật liệu và nhận thành phẩm: [Giao dịch nhập, xuất & chuyển](../1-kho/2000-giao-dich-nhap-xuat-chuyen.md)
- **Mua hàng** cung cấp nguyên vật liệu theo nhu cầu MRP: [Đơn mua hàng](../2-mua-hang/2000-don-mua-hang.md)
- **Bán hàng** tạo nhu cầu sản xuất theo đơn và đọc ngày hoàn thành: [Tiếp nhận đơn & ATP](../4-ban-hang/2000-tiep-nhan-don-va-atp.md)
- **Kế toán** nhận chi phí WIP và hạch toán giá vốn: [Giá vốn & định giá tồn kho](../5-ke-toan/ke-toan-tong-hop/1010-gia-von-va-dinh-gia-ton-kho.md)

## Bắt đầu đọc từ đâu

Nếu triển khai từ đầu, đọc theo thứ tự 1000 → 9000. Nếu đang xử lý sự cố, đi thẳng tới bài tương ứng:

- Lệnh sản xuất không chạy được vì thiếu nguyên liệu → [Lệnh sản xuất & WIP](./2000-lenh-san-xuat-va-wip.md)
- Giá thành thực tế lệch định mức lớn → [Giá thành sản xuất](./2020-gia-thanh-san-xuat.md)
- Thay đổi thiết kế nhưng hàng cũ vẫn sản xuất theo bản mới → [Thay đổi kỹ thuật & ECO](./1040-thay-doi-ky-thuat-va-eco.md)
- BOM không khớp với hàng thực tế nhập kho → [BOM & định mức](./1010-bom-va-dinh-muc.md)

<div align="center" style={{color: 'var(--ifm-color-primary)'}}>
  <strong>Chúc các bạn thành công và vui vẻ!</strong>
</div>
