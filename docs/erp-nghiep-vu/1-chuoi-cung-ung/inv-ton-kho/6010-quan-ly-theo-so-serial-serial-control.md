---
id: quan-ly-theo-so-serial-serial-control
title: Nghiệp vụ Quản lý theo số Serial (Serial Control) — Định danh thiết bị, Bảo hành RMA và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)
sidebar_label: Quản lý theo số Serial (Serial Control)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/quan-ly-theo-so-serial
sidebar_position: 6010
date: 2026-08-09
tags: [erp, inventory, serial-control, serial-status, warranty, rma, database, sql-audit, oracle-ebs, epicor]
---

# Nghiệp vụ Quản lý theo số Serial (Serial Control) — Định danh thiết bị, Bảo hành RMA và Bộ câu lệnh SQL Audit (Epicor & Oracle EBS)

Nếu quản lý theo lô (Lot Control) dùng để theo dõi một nhóm sản phẩm có chung ngày sản xuất, thì **Quản lý theo số Serial (Serial Control)** là cấp độ kiểm soát chặt chẽ nhất của kho. Ở cấp độ này, mỗi một sản phẩm duy nhất sẽ được gán một "chứng minh nhân dân" riêng biệt là một chuỗi mã số Serial duy nhất. Số lượng tồn kho hệ thống của một số Serial luôn luôn bằng **1**.

Nghiệp vụ này cực kỳ quan trọng đối với các ngành hàng sản xuất máy móc, thiết bị y tế, đồ điện tử công nghệ cao hoặc phụ tùng ô tô. Việc quản lý Serial giúp doanh nghiệp bảo vệ mình trước các khiếu nại bảo hành sai sự thật và theo dõi chi tiết lịch sử bảo dưỡng của từng sản phẩm cụ thể.

---

## 1. Trạng thái vòng đời của một số Sê-ri (Serial Status) trên ERP

Không giống như vật tư thông thường chỉ có số lượng On-hand Qty, một số Serial trên ERP được quản lý chặt chẽ thông qua hệ thống **Trạng thái Serial (Serial Status)** để biết chính xác nó đang nằm ở đâu trong chuỗi giá trị:

1. **Defined (Đã định nghĩa):** Số Serial được sinh sẵn trước trên hệ thống (ví dụ: in sẵn tem nhãn Serial để dán dần) nhưng chưa có hàng tồn kho thực tế.
2. **In Stock (Đang tồn kho):** Thiết bị đang nằm tại vị trí kệ kho cụ thể, sẵn sàng để xuất bán hoặc đưa vào sản xuất.
3. **In WIP (Đang sản xuất):** Thiết bị đang nằm trên dây chuyền lắp ráp để cấu thành nên một sản phẩm lớn hơn.
4. **Shipped (Đã xuất bán):** Thiết bị đã được giao cho khách hàng (Bắt đầu tính thời hạn bảo hành).
5. **Scrapped (Đã hủy):** Thiết bị bị hỏng hóc và đã làm thủ tục tiêu hủy.

### Bản đồ dữ liệu quản lý số Serial giữa các hệ thống ERP:

| Tác vụ dữ liệu | Epicor ERP | Oracle EBS | SAP ERP |
| :--- | :--- | :--- | :--- |
| **Bảng danh mục Serial gốc** | `Erp.SerialNo` | `MTL_SERIAL_NUMBERS` | `OBJK` (Serial Number cho Object) / `EQUZ` |
| **Giao dịch liên kết Serial** | `Erp.SerialTran` | `MTL_UNIT_TRANSACTIONS` (MUT) | `SERI` (Serial Number Link) |

---

## 2. Ứng dụng cốt lõi của Serial: Quản lý Bảo hành và Trả hàng RMA

Khi khách hàng mang một chiếc laptop bị hỏng đến trung tâm bảo hành và yêu cầu sửa chữa miễn phí:
* **Nếu không có Serial Control:** Khách hàng có thể mang một chiếc máy cũ, mua từ cửa hàng khác hoặc đã hết hạn bảo hành đến để đòi sửa. Doanh nghiệp không có cách nào chứng minh chiếc máy này có phải do mình bán ra hay không.
* **Nếu có Serial Control:** Kỹ thuật viên chỉ cần quét mã số sê-ri mặt sau máy. Hệ thống ERP lập tức truy xuất ngược: Chiếc máy này được lắp ráp ngày nào, xuất bán ngày nào, giao cho khách hàng nào, và **thời hạn bảo hành thực tế còn bao nhiêu ngày**. Nếu số sê-ri không khớp với cơ sở dữ liệu đã bán, hệ thống lập tức từ chối bảo hành hoặc RMA.

---

## 3. Hai "Bẫy" thực chiến phá hủy tính toàn vẹn của dữ liệu Serial

### ❌ Bẫy 1: Thảm họa lệch số dư hệ thống (Subledger Qty vs. Serial Master Qty)

Đây là lỗi cực kỳ phổ biến và là "cơn ác mộng" đối với các DBA và Developer viết báo cáo kiểm kê kho.

* **Tình huống:** Bảng tồn kho tổng (`PartBin` / `MTL_ONHAND_QUANTITIES_DETAIL`) báo cáo mã sản phẩm `LAP-01` tại Kho chính đang có số dư tồn kho khả dụng là **10 cái**. Tuy nhiên, khi mở bảng quản lý chi tiết sê-ri (`SerialNo` / `MTL_SERIAL_NUMBERS`), hệ thống chỉ tìm thấy **9 số Serial** có trạng thái đang tồn kho (`IN STOCK`).
* **Nguyên nhân:** Lỗi này xảy ra do lập trình viên khi viết các màn hình điều chỉnh kho tùy biến (`Inventory Adjustment`) hoặc giao dịch nhập/xuất kho tự phát triển đã **chỉ cập nhật bảng tồn kho tổng mà quên không cập nhật trạng thái của số Serial tương ứng** (hoặc ngược lại).
* **Hậu quả:** Số liệu bị lệch hụt cục bộ (Subledger Mismatch). Khi thủ kho xuất hàng đi bán, hệ thống báo có 10 cái sẵn sàng bán, nhưng khi quét mã sê-ri để đóng gói thì chỉ quét được 9 cái, đơn hàng bị treo và báo cáo kiểm toán kho bị đánh giá lỗi nghiêm trọng.

---

### ❌ Bẫy 2: Trùng lặp số Serial trong kho (Duplicate Serials Co-existing)

Theo nguyên tắc bất biến, tại một thời điểm, một số sê-ri cụ thể chỉ được phép tồn tại duy nhất ở một trạng thái (Ví dụ: Đang ở trong kho, hoặc đã bán đi, chứ không thể vừa nằm trong kho vừa đã bán đi).

* **Hậu quả dữ liệu:** Do lỗi đồng bộ dữ liệu hoặc bug trong code import, hệ thống cho phép tạo mới và ghi nhận nhập kho một thiết bị có số sê-ri `SN-12345`, trong khi số sê-ri `SN-12345` đó thực tế đã được hạch toán xuất bán cho khách hàng từ tháng trước và đang nằm ở trạng thái `Shipped`. 
* Khi khách hàng mang máy sê-ri `SN-12345` đến bảo hành, hệ thống sẽ báo lỗi logic vì "thiết bị này hiện tại vẫn đang nằm ở trong kho chính thức của công ty", gây xung đột dữ liệu bảo hành và báo cáo tài sản tồn kho bị khống khống giá trị ảo.

---

## 4. Các câu lệnh SQL Audit thực chiến rà soát dữ liệu số Serial

Hãy sử dụng các câu lệnh SQL dưới đây để chủ động quét và làm sạch dữ liệu sê-ri kho định kỳ trước mỗi kỳ khóa sổ:

---

### ❌ SQL Audit 1: Phát hiện lệch số dư tồn kho tổng so với số lượng Serial thực tế (Onhand vs. Serial Mismatch)
Quét toàn bộ hệ thống để tìm các mã hàng bắt buộc quản lý sê-ri đang có tổng On-hand Qty khác biệt (lệch thừa hoặc lệch thiếu) so với tổng số lượng sê-ri đang có trạng thái tồn kho thực tế (`IN STOCK`).

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    pb.WarehouseCode AS [Mã kho],
    pb.BinNum AS [Vị trí ô kệ],
    pb.PartNum AS [Mã sản phẩm],
    pb.OnhandQty AS [Tồn kho tổng trên ERP],
    -- Đếm số lượng Serial đang ở trạng thái IN STOCK tại đúng vị trí này
    (SELECT COUNT(*) 
     FROM Erp.SerialNo sn 
     WHERE sn.Company = pb.Company 
       AND sn.PartNum = pb.PartNum 
       AND sn.WarehouseCode = pb.WarehouseCode 
       AND sn.BinNum = pb.BinNum 
       AND sn.SerialStatus = 'IN STOCK') AS [Số lượng Serial thực tế]
FROM Erp.PartBin pb
INNER JOIN Erp.PartPlant pp 
    ON pb.Company = pp.Company AND pb.PartNum = pp.PartNum AND pb.Plant = pp.Plant
WHERE pp.SerialTracking = 1                         -- Chỉ quét các vật tư bắt buộc quản lý theo Serial
  -- Điều kiện lọc: Tồn kho tổng khác số lượng sê-ri thực tế đang nằm trong kho
  AND pb.OnhandQty <> (
      SELECT COUNT(*) 
      FROM Erp.SerialNo sn 
      WHERE sn.Company = pb.Company 
        AND sn.PartNum = pb.PartNum 
        AND sn.WarehouseCode = pb.WarehouseCode 
        AND sn.BinNum = pb.BinNum 
        AND sn.SerialStatus = 'IN STOCK'
  );
```

#### 💻 Code SQL dành cho Oracle EBS R12:
Trong Oracle, `serial_number_control_code` trong bảng `mtl_system_items_b` lưu cấu hình quản lý sê-ri của vật tư.
```sql
SELECT 
    moqd.subinventory_code AS subinventory,
    moqd.locator_id AS locator,
    msi.segment1 AS item_code,
    SUM(moqd.transaction_quantity) AS onhand_qty,   -- Tồn kho tổng trên máy
    -- Đếm số lượng serial đang ở trạng thái In Stock (status 3) tại đúng vị trí này
    (SELECT COUNT(*) 
     FROM mtl_serial_numbers msn 
     WHERE msn.inventory_item_id = moqd.inventory_item_id 
       AND msn.current_organization_id = moqd.organization_id 
       AND msn.current_subinventory_code = moqd.subinventory_code 
       AND NVL(msn.current_locator_id, -1) = NVL(moqd.locator_id, -1)
       AND msn.current_status = 3) AS serial_count
FROM mtl_onhand_quantities_detail moqd
INNER JOIN mtl_system_items_b msi 
    ON moqd.inventory_item_id = msi.inventory_item_id AND moqd.organization_id = msi.organization_id
WHERE msi.serial_number_control_code IN (2, 5, 6)   -- Các cấu hình bắt buộc quản lý sê-ri
GROUP BY moqd.organization_id, moqd.subinventory_code, moqd.locator_id, moqd.inventory_item_id, msi.segment1
-- Điều kiện lọc: Số lượng tồn kho tổng khác tổng số sê-ri đang nằm trong kho
HAVING SUM(moqd.transaction_quantity) <> (
    SELECT COUNT(*) 
    FROM mtl_serial_numbers msn 
    WHERE msn.inventory_item_id = moqd.inventory_item_id 
      AND msn.current_organization_id = moqd.organization_id 
      AND msn.current_subinventory_code = moqd.subinventory_code 
      AND NVL(msn.current_locator_id, -1) = NVL(moqd.locator_id, -1)
      AND msn.current_status = 3
);
```

---

### ❌ SQL Audit 2: Phát hiện trùng lặp số Serial đang cùng tồn tại trong kho (Duplicate Active Serials)
Tìm các trường hợp một số sê-ri duy nhất của cùng một mã hàng hóa xuất hiện từ 2 lần trở lên ở trạng thái đang tồn tại trong kho, biểu hiện của lỗi nhân đôi dữ liệu sê-ri ảo.

#### 💻 Code SQL dành cho Epicor ERP:
```sql
SELECT 
    sn.PartNum AS [Mã sản phẩm],
    sn.SerialNumber AS [Số Serial trùng lặp],
    COUNT(sn.SerialNumber) AS [Số lần xuất hiện trong kho]
FROM Erp.SerialNo sn
WHERE sn.Company = 'your_company_code'
  AND sn.SerialStatus = 'IN STOCK'                  -- Chỉ quét sê-ri đang tồn kho
GROUP BY sn.Company, sn.PartNum, sn.SerialNumber
HAVING COUNT(sn.SerialNumber) > 1;                  -- Có nhiều hơn 1 bản ghi sê-ri cùng số hiệu
```

#### 💻 Code SQL dành cho Oracle EBS R12:
```sql
SELECT 
    msi.segment1 AS item_code,
    msn.serial_number AS duplicate_serial,
    COUNT(msn.serial_number) AS duplicate_count
FROM mtl_serial_numbers msn
INNER JOIN mtl_system_items_b msi 
    ON msn.inventory_item_id = msi.inventory_item_id AND msn.current_organization_id = msi.organization_id
WHERE msn.current_status = 3                        -- 3: Resides in stores (Đang tồn kho)
GROUP BY msn.current_organization_id, msn.inventory_item_id, msi.segment1, msn.serial_number
HAVING COUNT(msn.serial_number) > 1;                -- Có nhiều hơn 1 sê-ri đang cùng tồn kho
```

---

## 5. Checklist dành cho Developer khi phát triển phân hệ Serial Control

- [ ] **Bắt buộc đồng bộ hóa số dư (Dual-Write Check):** Khi viết logic cho bất kỳ giao dịch kho nào (Nhập, Xuất, Điều chỉnh) có liên quan đến vật tư sê-ri, bắt buộc phải viết code đồng thời cập nhật cả bảng tồn kho tổng (`PartBin`/`Onhand`) lẫn bảng trạng thái sê-ri chi tiết (`SerialNo`/`MTL_SERIAL_NUMBERS`) để tránh lệch số dư (Kịch bản 1).
- [ ] **Khóa chặn trùng lặp sê-ri (Unique Serial Check):** Thiết lập chỉ mục duy nhất (Unique Index) hoặc viết logic kiểm tra chặn không cho phép lưu giao dịch nhập kho sê-ri nếu số sê-ri đó đang tồn tại trên hệ thống ở trạng thái hoạt động khác hoặc đang tồn kho (Kịch bản 2).
- [ ] **Bắt buộc nhập sê-ri khi giao dịch:** Nếu vật tư cấu hình quản lý sê-ri, lập trình giao diện kho bắt buộc người dùng phải nhập đúng số lượng sê-ri tương ứng với tổng số lượng giao dịch (ví dụ xuất bán 5 cái laptop, bắt buộc phải quét đủ 5 mã sê-ri khác nhau mới cho phép lưu phiếu xuất).
- [ ] **Tích hợp lịch sử sê-ri (Serial History Tracking):** Khi thiết kế báo cáo hoặc tính năng RMA bảo hành, xây dựng màn hình truy vấn nhanh lịch sử sê-ri (`Serial Transaction History`) để hiển thị toàn bộ vòng đời của thiết bị: Ngày sản xuất $\rightarrow$ Ngày nhập kho $\rightarrow$ Ngày xuất bán $\rightarrow$ Các đợt bảo hành sửa chữa trước đó.
