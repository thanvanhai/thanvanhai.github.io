---
id: dieu-chinh-ton-kho-adjustment
title: Nghiệp vụ Điều chỉnh Tồn kho (Inventory Adjustment) — Cơ chế định giá, Quản lý Reason Code và 3 "Kẽ hở" gian lận tài sản
sidebar_label: Điều chỉnh Tồn kho (Adjustment)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/dieu-chinh-ton-kho
sidebar_position: 4000
date: 2026-07-25
tags: [erp, inventory, adjustment, reason-code, costing, accounting, fraud-control]
---

# Nghiệp vụ Điều chỉnh Tồn kho (Inventory Adjustment) — Cơ chế định giá, Quản lý Reason Code và 3 "Kẽ hở" gian lận tài sản

Trong vận hành kho thực tế, việc chênh lệch số liệu giữa hệ thống ERP và thực tế là điều khó tránh khỏi (do cân đo sai lệch, hao hụt tự nhiên, hoặc lỗi nhập liệu trước đó). Để đồng bộ lại số liệu, thủ kho và kế toán sẽ sử dụng nghiệp vụ **Điều chỉnh tồn kho (Inventory Adjustment)**.

Tuy nhiên, đối với kiểm toán và kế toán trưởng, đây là phân hệ **nhạy cảm nhất** trong quản lý kho. Nếu không được kiểm soát chặt chẽ bằng hệ thống phân quyền và lý do điều chỉnh, phân hệ này rất dễ bị lạm dụng để hợp thức hóa việc mất mát tài sản hoặc gian lận báo cáo tài chính.

---

## 1. Bản chất Giao dịch và Bản đồ dữ liệu (Under the Hood)

Khác với Nhập kho từ PO hay Xuất kho bán hàng có chứng từ đối ứng (SO/PO), giao dịch Inventory Adjustment là một giao dịch **đơn phương (Miscellaneous Transaction)** — tức là hệ thống tự tăng hoặc tự giảm số lượng tồn kho mà không cần tham chiếu đến bất kỳ phòng ban bên ngoài nào.

### Bản đồ dữ liệu giữa các hệ thống ERP:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Giao dịch điều chỉnh số lượng (Qty)** | `Erp.PartTran` (TranType: `ADJ-QTY`) | `MTL_MATERIAL_TRANSACTIONS` (Misc Receipt/Issue) | `MSEG` (Movement Type: `711`/`712` - Diff, hoặc `561`/`562` - Initial) |
| **Giao dịch điều chỉnh giá trị (Cost)** | `Erp.PartTran` (TranType: `ADJ-CST`) | `MTL_MATERIAL_TRANSACTIONS` (Cost Update) | `MR21` (Price Change Document) |
| **Mã lý do điều chỉnh** | `Erp.Reason` | `MTL_TRANSACTION_REASONS` | Reason for Movement |

---

## 2. Hạch toán kế toán và Ma trận mã lý do (Reason Code Mapping)

Vì giao dịch điều chỉnh là đơn phương, kế toán bắt buộc phải sử dụng một **Tài khoản đối ứng (Offset Account)** để cân bằng phương trình kế toán. Tài khoản đối ứng này không cố định, nó thay đổi tùy thuộc vào **Lý do điều chỉnh (Reason Code)**.

### Ví dụ về Ma trận tài khoản đối ứng theo Lý do (Reason Code):

| Mã lý do (Reason Code) | Bản chất nghiệp vụ | Tài khoản đối ứng (Offset Account) | Hạch toán khi điều chỉnh TĂNG |
| :--- | :--- | :--- | :--- |
| **AUDIT** | Chênh lệch sau kiểm kê định kỳ | `632` (Giá vốn hàng bán) hoặc `1381` (Tài sản thiếu chờ xử lý) | Nợ 156 / Có 632 (Giảm giá vốn) |
| **SCRAP** | Hủy hàng hỏng, hết hạn | `811` (Chi phí khác) hoặc `642` (Chi phí QLDN) | Nợ 156 / Có 811 (Giảm chi phí) |
| **INITIAL** | Khai báo tồn kho đầu kỳ khi Go-live | `421` (Lợi nhuận chưa phân phối) hoặc `3381` | Nợ 156 / Có 3381 |

> **Quy tắc hệ thống:** Nghiêm cấm việc cho phép người dùng tự tay gõ tài khoản định khoản khi làm phiếu Adjustment. Hệ thống bắt buộc người dùng chọn **Reason Code**, từ đó ERP tự động tìm tài khoản tương ứng trong cấu hình để hạch toán ngầm.

---

## 3. Ba "Bẫy" thực chiến và Kẽ hở kiểm soát tài sản

### ❌ Bẫy 1: Thảm họa "Định giá sai" khi điều chỉnh TĂNG (Costing of Adjust-Up) dưới Average Costing

Khi phát hiện thực tế thừa 5 con bu-lông so với hệ thống, thủ kho làm phiếu Adjust-Up (+5). 

* **Bẫy định giá:** Hệ thống sẽ lấy đơn giá nào để nạp 5 con này vào kho?
  * *Trường hợp sai lầm:* Nếu hệ thống cho phép người dùng nhập đơn giá bằng 0 USD (hoặc mặc định bằng 0 nếu bỏ trống đơn giá). 
  * *Hậu quả:* Dưới phương pháp **Bình quân gia quyền (Average Costing)**, việc nạp 5 con hàng với giá 0 USD sẽ làm **kéo tụt Đơn giá bình quân** của toàn bộ hàng tồn kho hiện tại xuống. Khi xuất kho bán hàng sau đó, giá vốn hàng bán (COGS) bị tính sai.
* **Giải pháp thực chiến:** Khi làm giao dịch Adjust-Up, ERP bắt buộc phải lấy **Đơn giá hiện tại của kho (Current Unit Cost)** làm giá trị nạp vào, tuyệt đối không được để mặc định bằng 0, trừ khi có sự phê duyệt đặc biệt từ Kế toán trưởng.

---

### ❌ Bẫy 2: "Kẽ hở" tẩu tán tài sản và gian lận kế toán (Internal Fraud Loophole)

Do tính chất đơn phương của giao dịch Adjustment, đây là công cụ dễ bị lợi dụng nhất để gian lận.

* **Kịch bản gian lận:** Thủ kho thông đồng với bên ngoài mang 100 sản phẩm giá trị cao ra khỏi nhà máy. Để xóa dấu vết trên ERP, thủ kho làm lệnh Adjust-Down (-100) với lý do "Hao hụt tự nhiên" hoặc "Hàng hỏng hủy bỏ" (`SCRAP`). Nếu ERP không cấu hình hạn mức duyệt, giao dịch này trôi qua êm đẹp và doanh nghiệp mất trắng tài sản.
* **Giải pháp kiểm soát trên ERP:**
  1. **Phân quyền nghiêm ngặt (Separation of Duties - SoD):** Thủ kho chỉ có quyền tạo yêu cầu điều chỉnh (Draft Adjustment), quyền phê duyệt và post sổ phải thuộc về Kế toán kho hoặc Kế toán trưởng.
  2. **Hạn mức duyệt theo giá trị (Approval Limits):**
     * Giá trị lệch < 50 USD: Kế toán kho duyệt.
     * Giá trị lệch từ 50 - 500 USD: Kế toán trưởng duyệt.
     * Giá trị lệch > 500 USD: Giám đốc tài chính (CFO) duyệt.

---

### ❌ Bẫy 3: Nhầm lẫn giữa Điều chỉnh số lượng (Qty) và Điều chỉnh giá trị (Cost)

Trong thực tế, có những lúc số lượng hàng trong kho hoàn toàn đúng, nhưng **giá trị (đơn giá) bị sai** (ví dụ nhập kho nhầm đơn giá mua từ PO cũ).

* **Sai lầm thường gặp:** Thủ kho cố tình làm lệnh Adjust-Down số lượng về 0, sau đó làm lệnh Adjust-Up lại đúng số lượng đó với đơn giá mới để sửa giá trị kho.
* **Hậu quả:** Việc này tạo ra các giao dịch ảo khổng lồ trong lịch sử tồn kho (`PartTran`/`MSEG`), làm sai lệch báo cáo Nhập - Xuất - Tồn và làm tăng rủi ro khi kiểm toán quét dữ liệu.
* **Giải pháp đúng:** Bắt buộc phải sử dụng giao dịch **Điều chỉnh giá trị kho (Cost/Value Adjustment)**. Giao dịch này chỉ tác động vào số tiền trên Sổ cái (GL) và giá trị kho, số lượng tồn kho vật lý (On-hand Qty) hoàn toàn giữ nguyên.

---

## 4. Checklist dành cho Developer khi lập trình phân hệ Inventory Adjustment

- [ ] **Bắt buộc chọn Reason Code:** Khóa trường tài khoản đối ứng, chỉ cho phép chọn `Reason Code` và tự động lấy tài khoản GL đã cấu hình ngầm.
- [ ] **Khóa nhập đơn giá âm/bằng không:** Khi thực hiện điều chỉnh tăng (`Adjust-Up`), bắt buộc phải có cơ chế kiểm tra giá trị nhập vào, cảnh báo hoặc chặn nếu đơn giá bằng 0.
- [ ] **Thiết lập Workflow phê duyệt:** Xây dựng bảng cấu hình hạn mức phê duyệt (Approval Matrix) dựa trên tổng trị giá của phiếu điều chỉnh trước khi cho phép post vào sổ cái (GL).
- [ ] **Ràng buộc kiểm tra tồn kho khả dụng:** Khi điều chỉnh giảm (`Adjust-Down`), bắt buộc phải kiểm tra số lượng tồn kho khả dụng hiện tại, không cho phép điều chỉnh giảm vượt quá số lượng đang có trong kho (tránh gây âm kho hàng loạt).