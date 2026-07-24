---
id: nhap-kho-tu-san-xuat-wo
title: Nghiệp vụ Nhập kho từ Sản xuất (Receipt from Work Order)
description: Luồng dữ liệu hệ thống, WIP, Kế toán giá thành và 3 "Bẫy" thực chiến thường gặp khi nhập kho từ mua hàng trên Epicor & Oracle EBS.
sidebar_label: Nhập kho từ Sản xuất
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/nhap-kho-tu-wo
sidebar_position: 1010
date: 2026-07-23
tags: [erp, inventory, work-order, production, costing, wip, accounting]
---

# 1010 Nghiệp vụ Nhập kho từ Sản xuất (Receipt from Work Order)

> Luồng dữ liệu hệ thống, WIP, Kế toán giá thành và 3 "Bẫy" thực chiến thực chiến thường gặp khi nhập kho từ mua hàng trên Epicor & Oracle EBS.

Nếu như nhập kho từ PO là việc mang vật tư từ ngoài vào doanh nghiệp, thì **Nhập kho từ sản xuất (Receipt from Work Order / Goods Receipt from Production)** là việc ghi nhận kết quả lao động nội bộ: Chuyển đổi nguyên vật liệu thô thành Bán thành phẩm (SFG) hoặc Thành phẩm (FG) để nhập vào kho.

Đây là nghiệp vụ giao thoa trực tiếp giữa 3 phân hệ lớn: **Kho (INV)**, **Sản xuất (MFG)**, và **Kế toán giá thành (CO - Costing)**. Dưới góc độ hệ thống, đây là thời điểm chi phí dở dang (WIP) được kết chuyển thành tài sản tồn kho.

---

## 1. Luồng dữ liệu và Giao dịch gốc (Under the Hood)

Khi phân xưởng hoàn thành một lệnh sản xuất (Work Order / Job) và bàn giao thành phẩm cho thủ kho, thủ kho sẽ thực hiện giao dịch nhập kho thành phẩm từ sản xuất.

### Bản đồ dữ liệu giữa các hệ thống ERP:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Lệnh sản xuất** | `Erp.JobHead` | `WIP_DISCRETE_JOBS` | `AUFK` / `AFKO` (Production Order) |
| **Giao dịch gốc (Transaction)** | `Erp.PartTran` (TranType: `MFG-STK`) | `MTL_MATERIAL_TRANSACTIONS` (Transaction Action: Assembly Completion) | `MSEG` (Movement Type: `101` với reference Order) |
| **Chi phí tích lũy** | `Erp.JobAsmbl` (Lưu WIP chi tiết: Material, Labor, Burden...) | `WIP_PERIOD_BALANCES` | `COSB` (CO Objects: Cost Totals) |

### Bản chất chuyển dịch chi phí:
Khi lệnh sản xuất được chạy, chi phí nguyên vật liệu, nhân công và máy móc được tích lũy vào tài khoản **WIP (Work in Process - Chi phí sản xuất dở dang)**. Khi giao dịch nhập kho thành phẩm diễn ra, chi phí này được rút ra khỏi WIP để nạp vào kho Thành phẩm.

---

## 2. Hạch toán kế toán sản xuất tự động (WIP Accounting)

Bút toán nhập kho từ sản xuất phản ánh việc giảm chi phí dở dang trên phân xưởng và tăng giá trị thành phẩm trong kho.

### Tài khoản sử dụng:
* **Tài khoản Thành phẩm (Finished Goods Account):** Ghi nhận giá trị thành phẩm nhập kho (155, 152...).
* **Tài khoản WIP (Work in Process Account):** Tài khoản trung gian tích lũy chi phí sản xuất (154).

### Bút toán hạch toán:
* **Nợ (Debit):** `Tài khoản Kho Thành phẩm` (155) — Tăng tài sản tồn kho.
* **Có (Credit):** `Tài khoản WIP` (154) — Giảm chi phí dở dang tương ứng của lệnh sản xuất.

---

## 3. Ba "Bẫy" thực chiến kinh điển khi làm dự án sản xuất

### ❌ Bẫy 1: Thảm họa tính giá khi "Nhập kho từng phần" (Partial Receipts) dưới phương pháp Average Costing

Đây là lỗi thiết kế hệ thống cực kỳ đau đầu đối với các doanh nghiệp áp dụng phương pháp **Tính giá thực tế / Bình quân gia quyền (Actual/Average Costing)**.

**Tình huống:** Lệnh sản xuất yêu cầu sản xuất **100 sản phẩm**.
* Ngày 1: Phân xưởng xuất kho đầy đủ 100% nguyên vật liệu trị giá **10.000 USD** vào sản xuất. WIP lúc này có **10.000 USD**.
* Ngày 2: Phân xưởng hoàn thành trước **10 sản phẩm** và làm thủ tục nhập kho trước (Partial Receipt). Lúc này, chi phí nhân công (Labor) và chi phí chung (Overhead) của ngày hôm đó **chưa được chấm công và ghi nhận** vào hệ thống.

**Hệ thống ERP sẽ tính giá trị của 10 sản phẩm nhập kho này như thế nào?**

* **Logic đúng:**

$$
\text{Giá trị nhập kho} = 10 \text{ sp} \times (\text{NVL tiêu chuẩn} + \text{Nhân công ước tính})
$$

* **Thực tế lỗi hệ thống (Cực kỳ phổ biến):** Nhiều hệ ERP tự phát triển hoặc cấu hình sai sẽ lấy tổng chi phí hiện có trong WIP chia cho số lượng nhận:

$$
\text{Đơn giá tạm tính} = \frac{10{,}000 \text{ USD}}{10 \text{ sp}} = 1{,}000 \text{ USD/sp}
$$

  *(Trong khi giá trị thực tế của sản phẩm chỉ khoảng 110 USD/sản phẩm)*.

* **Hậu quả:** 10 sản phẩm đầu tiên bị "đội giá" lên gấp 10 lần. Khi xuất bán 10 sản phẩm này, **Giá vốn hàng bán (COGS) bị khống lên cực kỳ cao**, làm sai lệch hoàn toàn báo cáo lỗ lãi trong tháng. Đến cuối tháng khi đóng lệnh sản xuất (Job Close), phần chênh lệch (Variance) mới được xử lý thì đã quá muộn cho các báo cáo vận hành trong kỳ.

* **Giải pháp thực chiến:**
  * Ưu tiên dùng **Standard Costing** thay vì Average Costing cho các lệnh sản xuất có nhiều đợt nhập kho từng phần (Partial Receipts).
  * Nếu bắt buộc dùng Average/Actual Costing, cấu hình **Estimated Labor/Overhead theo % hoàn thành** (dựa trên Routing) thay vì chờ chấm công thực tế mới ghi nhận.
  * Bắt buộc review **Variance** cuối kỳ trước khi chốt báo cáo lãi/lỗ tạm thời trong tháng, không chỉ chờ đến khi Job Close.

---

### ❌ Bẫy 2: Thảm họa "Âm kho" nguyên vật liệu do cơ chế Trừ kho tự động (Backflushing)

Để giảm thiểu việc nhập liệu cho thủ kho, nhiều doanh nghiệp áp dụng cơ chế **Backflushing** (Tự động xuất kho nguyên vật liệu dựa trên định mức BOM khi nhập kho thành phẩm).

**Tình huống:** Thành phẩm `A` cần 2 cái ốc vít `B` để hoàn thành. Khi thủ kho nhập kho **100 sản phẩm `A`**, hệ thống ERP sẽ tự động tạo một giao dịch xuất kho ngầm (Backflush) trừ đi **200 cái ốc vít `B`** trong kho.

* **Bẫy thực tế:** Tại thời điểm nhập kho sản phẩm `A`, số lượng thực tế của ốc vít `B` trong kho hệ thống **chỉ còn 150 cái** (mặc dù thực tế ngoài kho vẫn có đủ do thủ kho trước đó quên chưa nhập phiếu mua hàng).
* **Kết quả:**
  * Nếu ERP cho phép **Âm kho (Negative Inventory)**: Kho ốc vít `B` sẽ bị âm **-50 cái**. Kéo theo đó là giá trị tồn kho bị tính sai lệch hoàn toàn (nhiều hệ thống tính giá bình quân sẽ bị lỗi chia cho số âm).
  * Nếu ERP **Khóa âm kho**: Hệ thống sẽ chặn đứng giao dịch nhập kho thành phẩm `A`. Thủ kho không thể nhận hàng, dây chuyền sản xuất bị đình trệ trên hệ thống chỉ vì lỗi dữ liệu của một linh kiện nhỏ.

---

### ❌ Bẫy 3: Bài toán "Sản phẩm đồng hành" (Co-product) và "Sản phẩm phụ" (By-product)

Trong sản xuất, không phải lúc nào một lệnh sản xuất cũng chỉ cho ra một sản phẩm duy nhất.
* **Co-product (Sản phẩm đồng hành):** Xẻ một khúc gỗ (Work Order) ra tấm gỗ lớn (Sản phẩm A) và tấm gỗ nhỏ (Sản phẩm B - cũng có giá trị cao).
* **By-product (Sản phẩm phụ/Phế liệu):** Quá trình xẻ gỗ sinh ra mùn cưa (Sản phẩm phụ - có giá trị thấp hoặc bán thanh lý).

**Hạch toán giá thành khi nhập kho:**
* **Bẫy hệ thống:** Làm sao để chia chi phí từ WIP (10.000 USD) cho cả Sản phẩm A và Sản phẩm B khi nhập kho? Nếu không cấu hình tỷ lệ phân bổ chi phí (Cost Split Percentage) trong định mức BOM/Routing, hệ thống sẽ dồn toàn bộ 100% chi phí vào sản phẩm chính, khiến sản phẩm đồng hành nhập kho với giá bằng 0, hoặc ngược lại.
* **Giải pháp:** Phải thiết lập bảng phân bổ giá thành tiêu chuẩn cho Co-product (ví dụ: Sản phẩm A gánh 70% chi phí, Sản phẩm B gánh 30% chi phí). Đối với By-product (mùn cưa), giá trị nhập kho thường được ghi giảm trực tiếp vào chi phí sản xuất dở dang (WIP) theo một đơn giá cố định (Standard Scrap Value).

---

## 4. Checklist dành cho Developer khi viết báo cáo Sản xuất - Nhập kho

- [ ] **Kiểm tra trạng thái Lệnh sản xuất (Job/WO Status):** Chỉ cho phép nhập kho từ các lệnh sản xuất đang hoạt động (`Released`/`Active`), tuyệt đối không cho phép nhập từ lệnh đã đóng (`Closed`) hoặc chưa duyệt (`Unapproved`).
- [ ] **Xử lý số lượng vượt định mức (Over-production):** Cấu hình cảnh báo hoặc chặn nếu số lượng thủ kho nhập kho vượt quá số lượng đặt hàng của lệnh sản xuất (ví dụ Lệnh sản xuất 100 cái nhưng nhập kho tới 120 cái).
- [ ] **Kiểm soát hạch toán WIP tài khoản lẻ:** Đối với các bài viết báo cáo chi tiết chi phí lệnh sản xuất, bắt buộc phải chia nhỏ chi phí thành 5 thành phần gốc (Material, Labor, Burden/Overhead, Subcontract, Material Burden) để kế toán đối chiếu chênh lệch cuối tháng.
- [ ] **Ràng buộc kiểm tra tồn kho trước khi Backflush:** Luôn viết truy vấn kiểm tra (Validation Query) số lượng tồn kho của nguyên vật liệu chuẩn bị backflush để cảnh báo cho người dùng trước khi họ nhấn nút nhập kho thành phẩm.