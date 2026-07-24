---
id: thiet-lap-diem-dat-hang-lai-reorder-point-min-max
title: Thiết lập Điểm đặt hàng lại (Reorder Point) & Hoạch định Min-Max
description: Công thức tính ROP, Hàng treo PO và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Điểm đặt hàng lại (Min-Max)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/diem-dat-hang-lai-min-max
sidebar_position: 7030
date: 2026-08-14
tags: [erp, inventory, reorder-point, min-max, safety-stock, lead-time, sql-audit, oracle-ebs, epicor]
---

# 7030 Thiết lập Điểm đặt hàng lại (Reorder Point) & Hoạch định Min-Max

> Công thức tính ROP, Hàng treo PO và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Để tránh hiện tượng đứt gãy chuỗi cung ứng vật tư (Stockout) gây dừng máy trong sản xuất hoặc mất cơ hội bán hàng, hệ thống ERP cung cấp các công cụ lập kế hoạch cung ứng tự động mức cơ bản, phổ biến nhất là **Điểm đặt hàng lại (Reorder Point - ROP)** và **Hoạch định Tối thiểu - Tối đa (Min-Max Planning)**.

Nếu thiết lập các thông số quy hoạch kho này chính xác, hệ thống ERP sẽ đóng vai trò như một trợ lý ảo thông minh: Tự động chạy quét số dư tồn kho hàng đêm và tự động đề xuất tạo các yêu cầu mua hàng (Purchase Requisition) hoặc lệnh sản xuất nháp ngay khi lượng hàng chạm ngưỡng báo động.

---

## 1. Công thức cốt lõi tính Điểm đặt hàng lại (Reorder Point - ROP)

Điểm đặt hàng lại (ROP) không phải là một con số cảm tính, nó được tính toán dựa trên ba biến số nghiệp vụ thực tế:
1. **Average Daily Demand (Nhu cầu sử dụng trung bình ngày):** Số lượng vật tư tiêu thụ trung bình trong một ngày.
2. **Lead Time (Thời gian cung ứng/giao hàng):** Số ngày tính từ lúc phát hành PO cho nhà cung cấp đến khi hàng thực tế về đến kho.
3. **Safety Stock (Tồn kho an toàn):** Lượng hàng dự phòng để bảo vệ nhà máy trước các rủi ro biến động nhu cầu hoặc nhà cung cấp giao hàng trễ.

$$\text{Điểm đặt hàng lại (ROP)} = (\text{Nhu cầu trung bình ngày} \times \text{Thời gian giao hàng}) + \text{Tồn kho an toàn}$$

### Cơ chế hoạch định Min-Max (Min-Max Planning):
* **Ngưỡng tối thiểu (Min Qty):** Đóng vai trò như điểm đặt hàng lại (ROP). Khi hệ thống kiểm tra thấy:
  $$\text{Tồn thực tế (On-Hand)} + \text{Hàng đang trên đường về (On-Order)} < \text{Ngưỡng Min}$$
  Hệ thống ERP sẽ ngay lập tức phát tín hiệu cảnh báo yêu cầu đặt hàng thêm.
* **Ngưỡng tối đa (Max Qty):** Trần giới hạn chứa hàng của kho. Số lượng đặt mua thêm gợi ý sẽ được ERP tự động tính toán để kéo lượng tồn kho lên đúng bằng ngưỡng Max:
  $$\text{Số lượng đặt mua gợi ý} = \text{Ngưỡng Max} - (\text{Tồn thực tế} + \text{Hàng đang trên đường về})$$

---

## 2. Bản đồ dữ liệu thiết lập ROP/Min-Max trên ERP

Vì các thông số lập kế hoạch kho (Lead Time, Safety Stock, Min, Max) phụ thuộc chặt chẽ vào vị trí địa lý của từng nhà máy, hệ thống ERP chuẩn luôn lưu trữ các thông số này tại **Danh mục vật tư chi tiết theo từng Chi nhánh (Site/Organization Item Master)** chứ không lưu ở danh mục tổng.

### Bản đồ cấu trúc bảng dữ liệu:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Bảng lưu thông số ROP/Min-Max** | `Erp.PartPlant` (Lưu chi tiết theo từng chi nhánh/Plant) | `MTL_SYSTEM_ITEMS_B` (Lưu theo Inventory Org) | `MARC` (Material Plant Data) |
| **Các trường thông số chính** | `MinimumQty` (Min), `MaximumQty` (Max), `LeadTime` (Lead time) | `min_minmax_quantity`, `max_minmax_quantity`, `full_lead_time` | `MINBE` (Reorder Point), `MABX` (Maximum stock level) |

---

## 3. Hai "Bẫy" thực chiến làm tê liệt luồng đặt hàng tự động

### ❌ Bẫy 1: "Thả nổi" thông số hoặc cấu hình thiếu Lead Time/Min-Max (Missing Setup Parameters)

**Tình huống:** Kế toán kho bật cờ chọn phương pháp lập kế hoạch mua hàng tự động theo Min-Max (`Min-Max Planning`) cho mã vật tư `Part-01`. Tuy nhiên, do thiếu rà soát dữ liệu, trường thông tin thời gian giao hàng (`LeadTime`) hoặc số lượng tối thiểu (`Min Qty`) vẫn bị bỏ trống hoặc cấu hình mặc định bằng **0**.

* **Hậu quả đứt gãy cung ứng:** Hệ thống ERP chạy quét hàng đêm vẫn hiểu là vật tư này cần 0 ngày để giao hàng và ngưỡng báo động bằng 0. Kết quả là khi kho thực tế ngoài đời đã hết sạch hàng, ERP vẫn "im lặng" không đưa ra bất kỳ đề xuất mua hàng tự động nào. Đến khi xưởng sản xuất yêu cầu cấp vật tư để chạy máy mới phát hiện hết hàng, dây chuyền sản xuất buộc phải dừng hoạt động chờ mua hàng khẩn cấp với chi phí đắt đỏ.

---

### ❌ Bẫy 2: "Trấn giữ" hàng đang về ảo — Đơn PO quá hạn đóng băng cơ chế gợi ý đặt hàng

Đây là lỗi phổ biến nhất khiến các kế toán kho thắc mắc: *"Tại sao hàng ngoài kho đã hết dưới mức Min rất lâu nhưng ERP tuyệt đối không gợi ý đặt hàng thêm?"*

* **Nguyên nhân từ công thức:** ERP tính toán nhu cầu đặt hàng dựa trên: `Tồn thực tế + Hàng đang về (On-Order)`.
* **Thực tế lỗi dữ liệu:** Có một đơn mua hàng PO được tạo từ **2 năm trước** đặt mua **10.000 sản phẩm** chưa từng được nhận kho và phòng mua hàng cũng quên không làm thủ tục Đóng/Hủy dòng PO này trên máy. Hệ thống ERP vẫn hiểu là đang có 10.000 sản phẩm "chuẩn bị về đến kho" (`On-Order Qty = 10.000`).
* **Hậu quả:** Trị giá `Tồn thực tế + 10.000 (On-Order)` luôn lớn hơn ngưỡng tối thiểu (Min), khiến hệ thống ERP bị "lừa" và **tê liệt hoàn toàn tính năng đề xuất mua hàng tự động**, gây ra hiện tượng đứt gãy vật tư nghiêm trọng ngoài đời thực.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát cấu hình ROP/Min-Max

---

### ❌ SQL Audit 1: Phát hiện các sản phẩm có bật kế hoạch ROP/Min-Max nhưng thiếu thông số cấu hình gốc
Tìm các sản phẩm đang hoạt động, cấu hình mua ngoài (`Buy`) và có bật phương pháp lập kế hoạch tự động nhưng thông số tối thiểu (`Min`), tối đa (`Max`) hoặc thời gian mua hàng (`Lead Time`) đang bị bỏ trống hoặc bằng 0.

#### 💻 Code SQL dành cho Epicor ERP (Bảng `PartPlant` & `Part`):
```sql
SELECT 
    pp.Plant AS [Mã chi nhánh],
    pp.PartNum AS [Mã sản phẩm],
    p.PartDescription AS [Mô tả],
    pp.MinimumQty AS [Số lượng tối thiểu (Min)],
    pp.MaximumQty AS [Số lượng tối đa (Max)],
    pp.LeadTime AS [Thời gian giao hàng (Lead Time)]
FROM Erp.PartPlant pp
INNER JOIN Erp.Part p 
    ON pp.Company = p.Company AND pp.PartNum = p.PartNum
WHERE p.InActive = 0                                -- Chỉ quét hàng đang hoạt động
  AND p.TypeCode = 'P'                              -- 'P' là Purchased (Hàng mua ngoài)
  -- Lỗi cấu hình: Tồn tối thiểu, tối đa hoặc Lead Time đang bằng 0
  AND (pp.MinimumQty = 0 OR pp.MaximumQty = 0 OR pp.LeadTime = 0);
```

#### 💻 Code SQL dành cho Oracle EBS R12 (Bảng `MTL_SYSTEM_ITEMS_B`):
```sql
SELECT 
    msi.organization_id,
    msi.segment1 AS item_code,
    msi.description AS item_desc,
    msi.inventory_planning_code AS planning_code,   -- 1: ROP, 2: Min-Max
    msi.min_minmax_quantity AS min_qty,
    msi.max_minmax_quantity AS max_qty,
    msi.full_lead_time AS lead_time
FROM mtl_system_items_b msi
WHERE msi.inventory_item_status_code = 'Active'     -- Chỉ quét hàng đang hoạt động
  AND msi.planning_make_buy_code = 2                -- 2: Buy (Hàng mua ngoài)
  AND msi.inventory_planning_code IN (1, 2)         -- Có cấu hình ROP hoặc Min-Max Planning
  -- Phát hiện lỗi cấu hình bằng 0 hoặc rỗng
  AND (NVL(msi.min_minmax_quantity, 0) = 0 
       OR NVL(msi.max_minmax_quantity, 0) = 0 
       OR NVL(msi.full_lead_time, 0) = 0);
```

---

### ❌ SQL Audit 2: Phát hiện các đơn PO quá hạn bị "treo" làm tê liệt luồng gợi ý đặt hàng tự động (Overdue POs)
Tìm các dòng đơn mua hàng PO đã quá hạn cam kết giao hàng trên 60 ngày nhưng vẫn đang ở trạng thái mở trên hệ thống, gây ảo số liệu `On-Order Qty`.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pod.PONum AS [Số đơn PO],
    pod.POLine AS [Dòng PO],
    pod.PartNum AS [Mã vật tư],
    pod.DueDate AS [Ngày cam kết giao hàng],
    (pod.OrderQty - pod.ReceivedQty) AS [Số lượng mở đang về],
    DATEDIFF(day, pod.DueDate, GETDATE()) AS [Số ngày quá hạn giao]
FROM Erp.PODetail pod
INNER JOIN Erp.POHeader poh 
    ON pod.Company = poh.Company AND pod.PONum = poh.PONum
WHERE poh.OpenApprove = 1                           -- PO đã được duyệt và đang mở
  AND pod.VoidLine = 0 AND pod.LineOpen = 1         -- Dòng PO đang hoạt động
  AND (pod.OrderQty - pod.ReceivedQty) > 0          -- Vẫn còn hàng chưa nhận hết
  -- Lọc các dòng PO đã quá hạn giao hàng thực tế trên 60 ngày
  AND DATEDIFF(day, pod.DueDate, GETDATE()) > 60
ORDER BY [Số ngày quá hạn giao] DESC;
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    poh.segment1 AS po_number,
    pol.line_num AS line_no,
    pll.need_by_date AS due_date,
    (pll.quantity - NVL(pll.quantity_received, 0)) AS open_on_order_qty,
    ROUND(SYSDATE - pll.need_by_date) AS days_overdue
FROM po_line_locations_all pll
INNER JOIN po_lines_all pol 
    ON pll.po_line_id = pol.po_line_id
INNER JOIN po_headers_all poh 
    ON pol.header_id = poh.header_id
WHERE pll.closed_code = 'OPEN'                      -- Trạng thái dòng PO đang mở
  AND pll.approved_flag = 'Y'                       -- PO đã duyệt chính thức
  AND (pll.quantity - NVL(pll.quantity_received, 0)) > 0
  -- Lọc các dòng PO đã quá hạn cam kết giao hàng trên 60 ngày
  AND ROUND(SYSDATE - pll.need_by_date) > 60
ORDER BY days_overdue DESC;
```

---

## 5. Checklist dành cho Developer khi phát triển phân hệ ROP/Min-Max

- [ ] **Ràng buộc nhập thông số kế hoạch:** Khi người dùng chọn phương pháp lập kế hoạch là `Min-Max` hoặc `Reorder Point` trên danh mục vật tư, lập trình bắt buộc các trường `Min Qty`, `Max Qty` và `Lead Time` phải ở trạng thái bắt buộc nhập (Required Field), chặn lưu nếu bằng 0 (Kịch bản 1).
- [ ] **Kiểm soát đóng dòng PO tự động (Auto-Close PO Lines):** Phát triển tính năng tự động đóng các dòng PO (Short-Close) nếu số lượng thiếu hụt nằm trong dung sai cho phép (ví dụ PO đặt mua 100 cái, đã nhận kho 98 cái, 2 cái còn lại bị hỏng hủy bỏ, hệ thống tự đóng dòng PO để tránh treo 2 cái On-order ảo).
- [ ] **Thiết lập cảnh báo PO quá hạn:** Xây dựng thông báo (Email Alert) hoặc Dashboard định kỳ hàng tuần gửi cho phòng mua hàng danh sách các dòng PO quá hạn giao hàng trên 30 ngày để họ tiến hành xác nhận đóng hoặc gia hạn lại ngày giao hàng trên hệ thống (Kịch bản 2).
- [ ] **Tính toán nhu cầu động (Dynamic Reorder Point):** Phát triển công cụ tự động đề xuất tính toán lại thông số ROP và Safety Stock định kỳ hàng quý dựa trên số liệu tiêu thụ thực tế của lịch sử xuất kho trong 6 tháng gần nhất thay vì phụ thuộc hoàn toàn vào việc người dùng nhập tay tĩnh.
