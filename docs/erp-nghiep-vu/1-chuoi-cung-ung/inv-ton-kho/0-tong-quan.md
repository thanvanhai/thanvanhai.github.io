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

## 1. Nghiệp vụ nhập kho

- [x] [Nhập kho từ mua hàng (Receipt from PO)](./nhap-kho-tu-mua-hang-po.md)
- [x] [Nhập kho từ sản xuất (Receipt from Work Order)](./nhap-kho-tu-san-xuat-wo.md)
- [ ] Nhập kho trả hàng từ khách (Sales Return)
- [ ] Nhập kho điều chỉnh (Inventory Adjustment - tăng)

## 2. Nghiệp vụ xuất kho

- [ ] Xuất kho bán hàng (Issue for Sales Order)
- [ ] Xuất kho cho sản xuất (Issue for Work Order/BOM)
- [ ] Xuất kho trả nhà cung cấp (Return to Vendor)
- [ ] Xuất kho điều chỉnh (Inventory Adjustment - giảm, hao hụt)

## 3. Điều chuyển & tổ chức kho

- [ ] Chuyển kho nội bộ (Inter-warehouse Transfer)
- [ ] Chuyển vị trí trong kho (Bin/Location Transfer)
- [ ] Quản lý nhiều kho, nhiều địa điểm (Multi-warehouse)
- [ ] Cấu trúc Zone - Aisle - Rack - Bin (WMS)

## 4. Kiểm kê & đối soát

- [ ] Kiểm kê định kỳ (Cycle Count)
- [ ] Kiểm kê toàn bộ (Physical Inventory)
- [ ] Xử lý chênh lệch kiểm kê (Count Variance)

## 5. Phương pháp tính giá & định giá tồn kho

- [ ] FIFO / LIFO / Weighted Average / Standard Cost
- [ ] Ảnh hưởng phương pháp tính giá đến giá vốn hàng bán (COGS)
- [ ] Định giá tồn kho cuối kỳ (Inventory Valuation)

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
- [x] [Lỗi quy đổi đơn vị tính (UOM) — Pattern lỗi phổ biến khiến báo cáo ERP sai lệch](./loi-quy-doi-uom-thuong-gap.md)
- [ ] Xử lý âm kho (Negative Inventory)
- [ ] Xử lý tồn kho khi đổi kỳ kế toán (Period Close)