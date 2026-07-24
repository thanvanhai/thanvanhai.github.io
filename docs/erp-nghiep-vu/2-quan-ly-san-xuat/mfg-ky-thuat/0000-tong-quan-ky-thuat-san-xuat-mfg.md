---
id: tong-quan-ky-thuat-san-xuat-mfg
title: Tổng quan Kỹ thuật Sản xuất (ERP - Master Data)
sidebar_label: Tổng quan Kỹ thuật (ERP - Master Data)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/tong-quan
sidebar_position: 1
date: 2026-07-21
tags: [erp, manufacturing, mes, master-data, bom, routing, oracle-ebs, sap, epicor, odoo]
---

# Tổng quan Kỹ thuật Sản xuất ERP Master Data

Trang này tổng hợp lộ trình các bài viết về nghiệp vụ **Kỹ thuật Sản xuất (Manufacturing Technical / Master Data)** trong hệ thống ERP và MES. Đây là phân hệ nền tảng định nghĩa dữ liệu gốc trước khi tiến hành thực thi hay giám sát sản xuất.

Các mục dưới đây sẽ được cập nhật liên kết dần sau khi bài viết tương ứng được hoàn thành.

## 1. Nguồn lực & Trung tâm công việc (Work Center & Resource)

- [x] [1000 - Khai báo Trung tâm công việc (Work Center Setup)](./1000-khai-bao-work-center.md)
- [x] [1010 - Quản lý Máy móc, Thiết bị & Khuôn gá (Machine & Tooling)](./1010-quan-ly-may-moc-thiet-bi-tooling.md)
- [x] [1020 - Khai báo Ca kíp & Nguồn nhân lực sản xuất (Labor & Shifts)](./1020-khai-bao-ca-kip-nhan-luc.md)
- [x] [1030 - Xác định Năng suất & Hiệu suất thiết kế (Capacity & Efficiency)](./1030-nang-suat-hieu-suat-thiet-ke.md)
- [x] [1040 - Liên kết Trung tâm công việc với Trung tâm chi phí và Loại hoạt động (Cost Center & Activity Type Assignment)](./1040-lien-ket-work-center-cost-center.md)
- [x] [1050 - Thiết lập Trung tâm công việc thay thế khi quá tải công suất (Alternative Work Center)](./1050-thiet-lap-work-center-thay-the.md)

## 2. Định mức nguyên vật liệu (BOM - Bill of Materials)

- [x] [2000 - Thiết lập BOM tiêu chuẩn (Standard BOM Setup)](./2000-thiet-lap-bom-tieu-chuan.md)
- [x] [2010 - Cấu trúc sản phẩm đa tầng và cơ chế nổ bom nhiều cấp (Multi-level BOM & Explosion)](./2010-bom-nhieu-cap-cau-truc-san-pham.md)
- [x] [2020 - Quản lý tỷ lệ hao hụt vật tư trong BOM (Scrap & Loss Factor)](./2020-quan-ly-hao-hut-vat-tu.md)
- [x] [2030 - Thiết lập Vật tư thay thế (Substitute / Alternative Material)](./2030-thieth-lap-vat-tu-thay-the.md)
- [x] [2040 - Ứng dụng BOM ảo (Phantom BOM) trong sản xuất lắp ráp](./2040-ung-dung-bom-ao-phantom-bom.md)
- [x] [2050 - Phân biệt BOM Kỹ thuật và BOM Sản xuất (Engineering BOM vs Manufacturing BOM)](./2050-phan-biet-ebom-vs-mbom.md)
- [x] [2060 - Thiết lập BOM cấu hình cho mô hình Sản xuất theo đơn đặt hàng (Configurable BOM / ATO - CTO)](./2060-thiet-lap-super-bom.md)
- [x] [2070 - Phân loại BOM theo mục đích sử dụng (BOM Type - Manufacture / Kit / Subcontracting)]()

## 3. Quy trình công nghệ & Công đoạn (Routing & Operations)

- [x] [3000 - Thiết lập Quy trình công nghệ tổng thể (Routing Setup)](./3000-thiet-lap-quy-trinh-cong-nghe-routing.md)
- [x] [3010 - Định nghĩa các Công đoạn sản xuất chuẩn (Standard Operations)](./3010-dinh-nghia-cong-doan-chuan.md)
- [x] [3020 - Thiết lập Định mức thời gian theo từng công đoạn: Setup, Run, Transit & Wait time](./3020-thiet-lap-dinh-muc-thoi-gian.md)
- [x] [3030 - Khai báo Công đoạn thuê ngoài gia công (Subcontracting Operation)](./3030-khai-bao-cong-doan-gia-cong-ngoai.md)
- [x] [3040 - Thiết lập Quy trình công nghệ thay thế (Alternative / Group Routing)](./3040-thiet-lap-quy-trinh-cong-nghe-thay-the.md)
- [x] [3050 - Gắn điểm kiểm tra chất lượng vào công đoạn sản xuất (In-process Inspection Point)](./3050-diem-kiem-tra-chat-luong-cong-doan.md)
- [x] [3060 - Quản lý hao hụt và tỷ lệ thu hồi theo từng công đoạn (Operation Scrap / Yield)](./3060-hao-hut-ty-le-thu-hoi-cong-doan.md)

## 4. Phiên bản sản xuất & Công thức (Production Version / Recipe)

- [x] [4000 - Thiết lập Phiên bản sản xuất (Production Version Setup - Ghép BOM & Routing)](./4000-thiet-lap-phien-ban-san-xuat.md)
- [x] [4010 - Quy định Quy mô lô sản xuất (Min/Max Batch Size & Lot Size)](./4010-quy-mo-lo-san-xuat.md)
- [x] [4020 - Thiết lập điều kiện lựa chọn phiên bản sản xuất tự động (Production Version Selection Criteria)](./4020-thiet-lap-dieu-kien-lua-chon-phien-ban.md)

## 5. Quản lý thay đổi kỹ thuật (Engineering Change Management)

- [x] [5000 - Quy trình Yêu cầu & Lệnh thay đổi kỹ thuật (ECR / ECO)](./5000-quy-trinh-yeu-cau-va-lenh-thay-doi-ky-thuat.md)
- [x] [5010 - Quản lý Lịch sử, Phiên bản và Ngày hiệu lực của BOM/Routing](./5010-quan-ly-lich-su-phien-ban-bom-routing.md)
- [x] [5020 - Phân tích tác động khi phát sinh thay đổi kỹ thuật (Impact / Where-used Analysis for ECO)](./5020-phan-tich-tac-dong-thay-doi-ky-thuat.md)

## 6. Thiết lập nâng cao & Đồng sản phẩm

- [ ] 6000 - Quản lý Đồng sản phẩm (Co-product) và Phụ phẩm thu hồi (By-product)
- [ ] 6010 - Liên kết BOM/Routing với bài toán Tính giá thành định mức (Standard Cost Rollup)
- [ ] 6020 - Mối quan hệ đồng bộ thông tin giữa Item Master (INV) và BOM/Routing (MFG)

## 7. Báo cáo & Xử lý sự cố kỹ thuật (Analytics & Troubleshooting)

- [ ] 7000 - Báo cáo Where-used và so sánh phiên bản BOM/Routing (Where-used Report & Version Comparison)
- [ ] 7010 - Công cụ thay đổi hàng loạt BOM/Routing (Mass Change / Mass Maintenance)
- [ ] 7020 - Xử lý lỗi BOM vòng lặp và lệch đơn vị tính giữa BOM và Item Master (Circular BOM & UOM Mismatch Troubleshooting)

---

## Ghi chú đặc thù theo từng hệ thống

| Hệ thống | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP** | Work Center – Cost Center – Activity Type là bộ ba bắt buộc phải khai báo, ảnh hưởng trực tiếp đến giá thành. Routing có khái niệm Rate Routing/Reference Operation Set để tái sử dụng giữa nhiều sản phẩm. Sản phẩm cấu hình dùng Super BOM kết hợp Variant Configuration. |
| **Oracle EBS** | Module BOM tách biệt rõ Standard Item / Model / Option Class Item, phục vụ trực tiếp cho Configure-to-Order. Module Engineering quản lý ECO bằng Change Order tách biệt khỏi BOM module chính, cho phép kiểm soát phiên bản chặt chẽ trước khi phát hành sang sản xuất. |
| **Epicor** | Gộp BOM và Routing thành khái niệm thống nhất **Method of Manufacturing (MOM)**, quản lý qua Engineering Workbench với khả năng theo dõi revision trực quan. |
| **Odoo** | BOM phân loại rõ theo Type (Manufacture / Kit / Subcontracting) ngay tại màn hình khai báo. Quản lý thay đổi kỹ thuật (ECO) tách thành ứng dụng riêng (PLM app), không nằm chung với Manufacturing app mặc định. |