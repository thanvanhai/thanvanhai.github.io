---
id: tong-quan-quan-ly-ton-kho-inv
title: Tổng quan Quản lý Tồn kho (INV)
sidebar_label: Tổng quan Tồn kho (INV)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/tong-quan
sidebar_position: 1
date: 2026-07-21
tags: [erp, inventory, inv, tong-quan, roadmap]
---
# Tổng quan Quản lý Tồn kho (INV)

Trang này tổng hợp lộ trình các bài viết về nghiệp vụ **Tồn kho (Inventory)** trong hệ thống ERP, chia theo từng nhóm chủ đề. Các mục đã có link là bài viết đã hoàn thành, các mục còn lại sẽ được cập nhật dần.

## 1. Nghiệp vụ nhập kho (Inbound)

- [x] [Nhập kho từ mua hàng (Receipt from PO)](./1-nhap-kho-tu-mua-hang-po.md)
- [x] [Nhập kho từ sản xuất (Receipt from Work Order)](./2-nhap-kho-tu-san-xuat-wo.md)
- [x] [Nhập kho trả hàng từ khách (Sales Return)](./3-nhap-kho-tra-hang-khach-rma.md)

## 2. Nghiệp vụ xuất kho (Outbound)

- [x] [Xuất kho bán hàng (Issue for Sales Order)](./4-xuat-kho-ban-hang-shipment.md)
- [x] [Xuất kho cho sản xuất (Issue for Work Order/BOM)](./5-xuat-kho-cho-san-xuat-bom.md)
- [x] [Xuất kho trả nhà cung cấp (Return to Vendor - RTV)](./6-xuat-kho-tra-nha-cung-cap-rtv.md)

## 3. Điều chuyển & tổ chức kho

- [x] [Chuyển kho nội bộ (Inter-warehouse Transfer)](./7-chuyen-kho-noi-bo-transfer.md)
- [x] [Chuyển vị trí trong kho (Bin/Location Transfer)](./8-chuyen-vi-tri-trong-kho-bin-transfer.md)
- [x] [Quản lý nhiều kho, nhiều địa điểm (Multi-warehouse)](./9-quan-ly-nhieu-kho-nhieu-dia-diem-multi-warehouse.md)
- [x] [Cấu trúc Zone - Aisle - Rack - Bin (WMS)](./10-cau-truc-zone-aisle-rack-bin-wms.md)

## 4. Kiểm kê & đối soát

- [x] [Nghiệp vụ Điều chỉnh Tồn kho (Inventory Adjustment - Tăng/Giảm)](./11-dieu-chinh-ton-kho-adjustment.md)
- [x] [Kiểm kê định kỳ (Cycle Count)](./12-kiem-ke-dinh-ky-cycle-count.md)
- [x] [Kiểm kê toàn bộ (Physical Inventory)](./13-kiem-ke-toan-bo-physical-inventory.md)
- [x] [Xử lý chênh lệch kiểm kê (Count Variance)](./14-xu-ly-chenh-lech-kiem-ke-count-variance.md)

## 5. Phương pháp tính giá & định giá tồn kho

- [x] [FIFO / LIFO / Weighted Average / Standard Cost](./15-phuong-phap-tinh-gia-fifo-lifo-average-standard.md)
- [x] [Ảnh hưởng phương pháp tính giá đến giá vốn hàng bán (COGS)](./16-anh-huong-phuong-phap-tinh-gia-den-cogs.md)
- [x] [Định giá tồn kho cuối kỳ (Inventory Valuation)](./17-dinh-gia-ton-kho-cuoi-ky-inventory-valuation.md)

## 6. Quản lý theo Lot/Serial

- [ ] Quản lý theo lô (Lot Control)
- [ ] Quản lý theo số serial (Serial Control)
- [ ] FEFO (First Expired First Out)

## 7. Danh mục & thiết lập cơ bản

- [ ] Item Master (thiết lập mã hàng hoá, đơn vị tính)
- [ ] Đơn vị tính và quy đổi (UOM Conversion)
- [ ] Nhóm hàng hoá / danh mục vật tư (Item Category)
- [ ] Thiết lập điểm đặt hàng lại (Reorder Point / Min-Max)

## 8. Báo cáo & phân tích

- [ ] Báo cáo tồn kho theo thời điểm (Stock on Hand)
- [ ] Báo cáo nhập-xuất-tồn (Inventory Movement/Ledger)
- [ ] Báo cáo tồn kho chậm luân chuyển (Slow-moving/Dead Stock)
- [ ] Dự báo nhu cầu tồn kho (Inventory Forecasting)

## 9. Tích hợp & lỗi thường gặp

- [ ] Đồng bộ tồn kho giữa các module (INV ↔ PO ↔ SO ↔ MFG)
- [x] [Lỗi quy đổi đơn vị tính (UOM) — Pattern lỗi phổ biến khiến báo cáo ERP sai lệch](./30-loi-quy-doi-uom-thuong-gap.md)
- [ ] Xử lý âm kho (Negative Inventory)
- [ ] Xử lý tồn kho khi đổi kỳ kế toán (Period Close)