---
id: tong-quan-ky-thuat-san-xuat-mfg
title: Tổng quan Kỹ thuật Sản xuất (MFG-TECH)
sidebar_label: Tổng quan Kỹ thuật (MFG-TECH)
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/tong-quan
sidebar_position: 1
date: 2026-07-22
tags: [erp, manufacturing, mes, master-data, bom, routing]
---

# Tổng quan Kỹ thuật Sản xuất (MFG-TECH)

Trang này tổng hợp lộ trình các bài viết về nghiệp vụ **Kỹ thuật Sản xuất (Manufacturing Technical / Master Data)** trong hệ thống ERP và MES. Đây là phân hệ nền tảng định nghĩa dữ liệu gốc trước khi tiến hành thực thi hay giám sát sản xuất.

Các mục dưới đây sẽ được cập nhật liên kết dần sau khi bài viết tương ứng được hoàn thành.

## 1. Nguồn lực & Trung tâm công việc (Work Center & Resource)

- [x] [1000 - Khai báo Trung tâm công việc (Work Center Setup)](./1000-khai-bao-work-center.md)
- [x] [1010 - Quản lý Máy móc, Thiết bị & Khuôn gá (Machine & Tooling)](./1010-quan-ly-may-moc-thiet-bi-tooling.md)
- [x] [1020 - Khai báo Ca kíp & Nguồn nhân lực sản xuất (Labor & Shifts)](./1020-khai-bao-ca-kip-nhan-luc.md)
- [x] [1030 - Xác định Năng suất & Hiệu suất thiết kế (Capacity & Efficiency)](./1030-nang-suat-hieu-suat-thiet-ke.md)

## 2. Định mức nguyên vật liệu (BOM - Bill of Materials)

- [x] [2000 - Thiết lập BOM tiêu chuẩn (Standard BOM Setup)](./2000-thiet-lap-bom-tieu-chuan.md)
- [x] [2010 - Cấu trúc sản phẩm & BOM nhiều cấp (Multi-level BOM)](./2010-bom-nhieu-cap-cau-truc-san-pham.md)
- [x] [2020 - Quản lý tỷ lệ hao hụt vật tư trong BOM (Scrap & Loss Factor)](./2020-quan-ly-hao-hut-vat-tu.md)
- [ ] 2030 - Thiết lập Vật tư thay thế (Substitute / Alternative Material)
- [ ] 2040 - Ứng dụng BOM ảo (Phantom BOM) trong sản xuất lắp ráp

## 3. Quy trình công nghệ & Công đoạn (Routing & Operations)

- [ ] 3000 - Thiết lập Quy trình công nghệ tổng thể (Routing Setup)
- [ ] 3010 - Định nghĩa các Công đoạn sản xuất chuẩn (Standard Operations)
- [ ] 3020 - Thiết lập Định mức thời gian: Setup, Run, Transit & Wait time
- [ ] 3030 - Khai báo Công đoạn thuê ngoài gia công (Subcontracting Operation)

## 4. Phiên bản sản xuất & Công thức (Production Version / Recipe)

- [ ] 4000 - Thiết lập Phiên bản sản xuất (Production Version Setup - Ghép BOM & Routing)
- [ ] 4010 - Quy định Quy mô lô sản xuất (Min/Max Batch Size & Lot Size)

## 5. Quản lý thay đổi kỹ thuật (Engineering Change Management)

- [ ] 5000 - Quy trình Yêu cầu & Lệnh thay đổi kỹ thuật (ECR / ECO)
- [ ] 5010 - Quản lý Lịch sử, Phiên bản và Ngày hiệu lực của BOM/Routing

## 6. Thiết lập nâng cao & Đồng sản phẩm

- [ ] 6000 - Quản lý Đồng sản phẩm (Co-product) và Phụ phẩm thu hồi (By-product)
- [ ] 6010 - Liên kết BOM/Routing với bài toán Tính giá thành định mức (Standard Cost Rollup)
- [ ] 6020 - Mối quan hệ đồng bộ thông tin giữa Item Master (INV) và BOM/Routing (MFG)