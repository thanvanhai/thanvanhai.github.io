---
id: cai-bay-current-cost-gia-thanh
title: "Cái Bẫy \"Current Cost\": Vì Sao Báo Cáo Giá Thành Của Bạn Có Thể Đang Sai Mà Không Ai Biết"
sidebar_label: "Cái Bẫy \"Current Cost\""
slug: /erp-nghiep-vu/cost/cai-bay-current-cost-gia-thanh
sidebar_position: 1
date: 2026-07-17
tags: [erp, oracle, sql, manufacturing, costing, reporting]
---

## Mở đầu bằng một câu hỏi tưởng chừng đơn giản

Có lần tôi ngồi xem lại giá của 1 mặt hàng sản xuất qua từng quý: Quý 1 giá 3.0, Quý 2 giá 3.2, Quý 3 giá 4.0 — đúng như kỳ vọng, giá nguyên liệu đầu vào tăng dần theo thời gian.

Nhưng khi lên báo cáo, join dữ liệu Job sản xuất với bảng Item để lấy giá, kết quả lại khiến tôi khựng lại: **tất cả các quý đều hiện ra đúng 1 con số — 4.0**. Kể cả những Job đã chạy và đóng sổ từ tận Quý 1.

Câu hỏi đầu tiên bật ra: giá của Quý 1, Quý 2 đã biến mất đi đâu? Có phải hệ thống không lưu lại lịch sử?

Câu trả lời, hoá ra, đơn giản hơn nhiều — và cũng phổ biến hơn nhiều so với tôi tưởng: **không phải dữ liệu bị mất, mà là báo cáo đang join sai bảng.**

## Gốc rễ vấn đề: 2 loại bảng cost luôn tồn tại song song trong mọi ERP

Đây là điều tôi nhận ra sau khi đào sâu vào cả những hệ thống mình từng làm — Oracle EBS, Epicor, và cả tham chiếu qua SAP, Microsoft Dynamics: bất kỳ ERP nào cũng có 2 kiểu bảng liên quan đến giá, tồn tại song song:

| Loại bảng | Đặc điểm | Ví dụ thực tế |
|---|---|---|
| **Master / Snapshot table** | Chỉ giữ **giá hiện hành duy nhất** — bị ghi đè mỗi lần cập nhật | `Part.Cost` (Epicor), `CST_ITEM_COSTS` (Oracle EBS), `MBEW` (SAP) |
| **Transaction / Ledger table** | Giữ **giá tại đúng thời điểm phát sinh giao dịch** — không bao giờ bị ghi đè | `JobMtl/JobOpr` (Epicor), `WIP_TRANSACTION_ACCOUNTING_LINES` (Oracle EBS), `COEP` (SAP), `InventTrans` (Dynamics) |

Điều thú vị là: đây không phải là 1 thiếu sót trong thiết kế phần mềm. Đây là nguyên tắc **bắt buộc** của bất kỳ hệ thống kế toán nào — sổ sách của quá khứ không được phép tự đổi theo thời gian. Nếu giá của 1 Job đã đóng ở Quý 1 tự động "nhảy" theo giá hiện tại, toàn bộ báo cáo tài chính đã công bố trước đó coi như vô nghĩa.

## Cái bẫy nằm ở đâu khi viết SQL

Nhìn lại đúng câu query đã gây ra sai lệch:

```sql
-- SAI: luôn ra giá hiện hành, không phải giá lúc Job thực sự chạy
SELECT job.job_number, item_cost.current_cost
FROM job
JOIN item_cost ON item_cost.item_id = job.item_id
```

So với cách viết đúng:

```sql
-- ĐÚNG: lấy giá đã "đóng băng" ngay trên dòng giao dịch
SELECT job.job_number, txn.transaction_date, txn.unit_cost_at_that_time
FROM job
JOIN job_transaction txn ON txn.job_id = job.job_id
```

Sự khác biệt chỉ nằm ở **join vào bảng nào** — nhưng hậu quả là toàn bộ báo cáo lịch sử bị "đồng bộ hóa nhầm" về giá hiện tại.

**Một phép thử nhanh để tự kiểm tra**: nếu bạn chạy lại đúng 1 query sau 3 tháng, mà kết quả của các Job *cũ* thay đổi theo giá mới hiện tại — thì query đang join sai bảng.

## Nhìn cụ thể qua Oracle EBS

Ví dụ trên Oracle EBS — hệ thống tôi đang trực tiếp làm việc — có sẵn các bảng phân vai rõ ràng:

| Nhu cầu | Bảng nên dùng |
|---|---|
| Giá hiện hành của Item | `CST_ITEM_COSTS`, `CST_ITEM_COST_DETAILS` |
| Giá thực tế đã ghi nhận cho 1 Job tại thời điểm chạy | `WIP_TRANSACTION_ACCOUNTING_LINES` |
| Lịch sử các lần thay đổi Standard Cost | `CST_STANDARD_COST_UPDATES` + `CST_STD_COST_UPDATE_ITM` |
| Chênh lệch giữa thực tế và chuẩn (Variance) | `WIP_PERIOD_BALANCES` |

```sql
-- Lịch sử thay đổi giá chuẩn của 1 Item
SELECT csui.NEW_ITEM_COST, csu.LAST_UPDATE_DATE
FROM CST_STANDARD_COST_UPDATES csu
JOIN CST_STD_COST_UPDATE_ITM csui 
    ON csui.STANDARD_COST_UPDATE_ID = csu.STANDARD_COST_UPDATE_ID
WHERE csui.INVENTORY_ITEM_ID = :item_id
AND csu.ORGANIZATION_ID = :org_id
ORDER BY csu.LAST_UPDATE_DATE
```

Ngay cả bản thân "giá chuẩn" của Item cũng có 1 bảng lịch sử riêng — không cần phải suy ngược từ Variance để đoán lại giá quá khứ, chỉ cần biết đúng bảng để tra.

## Không riêng gì Oracle — nhìn rộng ra các ERP lớn

Sau khi đối chiếu qua nhiều hệ thống — kể cả Epicor và Microsoft Dynamics AX mà tôi từng làm trước đây, cùng SAP — điều khiến tôi bất ngờ là **tất cả đều dùng chung 1 kiến trúc gốc**, chỉ khác tên bảng:

| Khái niệm | Oracle EBS | Epicor | SAP | Microsoft Dynamics AX |
|---|---|---|---|---|
| Danh mục Item/Part | `MTL_SYSTEM_ITEMS_B` | Part | Material Master (`MARA`) | `InventTable` |
| BOM (nguyên liệu) | `BOM_COMPONENTS_B` | Method of Manufacturing → Materials | `STKO`/`STPO` | `BOM`/`BOMTable` |
| Routing (công đoạn) | `BOM_OPERATION_SEQUENCES` | Method of Manufacturing → Operations | `PLKO`/`AFVC` | `RouteTable` |
| Lệnh sản xuất (Job/Order) | `WIP_ENTITIES` | `JobHead` | `AFKO`/`AFPO` | `ProdTable` |
| Giá hiện hành (bị ghi đè) | `CST_ITEM_COSTS` | `Part.Cost` | `MBEW` | Item Price hiện hành |
| Giá theo thời điểm (không ghi đè) | `WIP_TRANSACTION_ACCOUNTING_LINES` | `JobMtl`/`JobOpr` | `COEP` | `InventTrans` |
| Lịch sử giá chuẩn | `CST_STANDARD_COST_UPDATES` | Cost History | Costing Run (`CK11N`) | Cost Version theo kỳ |

Nói cách khác: **bất kể bạn đang dùng ERP nào, nếu viết report join thẳng Job/Order vào bảng Item Master để lấy giá, đều dính đúng lỗi y hệt nhau.** Đây không phải sự trùng hợp của các nhà cung cấp phần mềm — đây là hệ quả tất yếu của nguyên tắc kế toán.

## Vì sao Job thực tế không bao giờ khớp 100% với BOM chuẩn

Một điều liên quan mà tôi cũng từng thắc mắc: khi tạo Job/Order từ BOM, hệ thống thực chất **copy (snapshot)** toàn bộ BOM + Routing tại đúng thời điểm đó thành 1 bản riêng gắn với Job. Sau đó, người vận hành hoàn toàn có thể sửa trực tiếp trên Job (đổi nguyên liệu thay thế do thiếu hàng, thêm bớt công đoạn...) mà không ảnh hưởng ngược lại BOM gốc.

Đây chính là lý do khiến Job thực tế và BOM chuẩn gần như không bao giờ khớp tuyệt đối — và điều này hoàn toàn có chủ đích trong thiết kế ERP, để linh hoạt xử lý phát sinh sản xuất thực tế.

## Không phải mọi phương pháp tính giá đều dễ dính bẫy như nhau

Đào sâu hơn, tôi nhận ra mức độ "dễ dính bẫy current cost" còn phụ thuộc vào **phương pháp tính giá (Costing Method)** mà doanh nghiệp đang áp dụng:

**Standard Costing** — giá được thiết lập trước theo kỳ, mọi chênh lệch tách riêng thành Variance. Vì có bảng lịch sử update giá đi kèm, đây là phương pháp tương đối an toàn nếu viết report đúng cách.

**Actual Costing (FIFO/LIFO/Lot-specific)** — mỗi giao dịch tự mang giá riêng theo đúng lô hàng, không có khái niệm "giá hiện hành" chung để nhầm lẫn.

**Moving Average Cost** — đây chính là phương pháp **dễ dính bẫy nhất**. Giá được tính lại bình quân mỗi lần nhập kho, và bản chất field lưu giá chỉ là **1 cột duy nhất liên tục bị cập nhật** — giống hệt tình huống "Part.Cost" ở Epicor mà tôi mô tả ban đầu. Nếu không có thêm 1 bảng lưu lại lịch sử giá tại từng thời điểm, sẽ không cách nào tra lại chính xác giá quá khứ.

**Backflush Costing** — dồn chi phí về thời điểm hoàn thành sản phẩm, dùng cho sản xuất liên tục; đây là 1 dạng xấp xỉ có chủ đích, cần hiểu rõ độ trễ khi phân tích chi tiết.

## Bài toán khó hơn: 1 kỳ báo cáo, nhiều giá — lấy giá nào?

Đây là câu hỏi thực tế nhất khi lên báo cáo theo quý/năm: nếu trong 1 năm, 1 Item đổi giá 3–4 lần, thì không tồn tại "1 giá đúng duy nhất" cho cả kỳ — chỉ có **giá đúng cho đúng mục đích sử dụng**:

| Mục đích báo cáo | Cách xử lý phù hợp |
|---|---|
| Xem biến động giá theo thời gian | Hiển thị đúng từng mốc giá, đúng ngày hiệu lực — không gộp thành 1 số |
| Xem giá vốn của 1 giao dịch cụ thể | Lấy đúng giá tại transaction đó |
| So sánh hiệu quả chi phí giữa các kỳ | Weighted Average theo sản lượng thực tế, không phải trung bình cộng đơn giản |
| Xem giá trị tồn kho tại 1 thời điểm chốt kỳ | Giá hiệu lực đúng tại ngày chốt đó |

```sql
-- Weighted Average theo sản lượng thực tế trong kỳ
SELECT 
    SUM(txn.material_amount) / SUM(txn.quantity) AS weighted_avg_cost
FROM job_transaction txn
WHERE txn.item_id = :item_id
AND txn.transaction_date BETWEEN :tu_ngay AND :den_ngay
```

Nguyên tắc xuyên suốt: **dữ liệu hiển thị phải đúng với giao dịch đã thực sự xảy ra tại đúng thời điểm — không suy diễn, không làm tròn cho đẹp, không gán 1 giá đại diện nếu bản chất có nhiều giá khác nhau.**

## Giá mua và giá bán: bài toán "current cost" lặp lại ở cả 2 phía

Một điều tôi chỉ nhận ra sau khi đi sâu hơn: giá mua (chi phí đầu vào) và giá bán (giá ra thị trường) là 2 nhánh khác nhau, nhưng liên kết chặt với nhau — giá nguyên liệu tăng thường kéo theo áp lực tăng giá bán, dù giá bán còn phụ thuộc nhiều yếu tố khác (cạnh tranh, hợp đồng, nhu cầu thị trường) chứ không chỉ riêng chi phí.

Điểm đáng chú ý nhất: khi phân tích **margin** (lợi nhuận gộp), bài toán "point-in-time" lặp lại trên **cả 2 trục cùng lúc**:

```
Margin thực tế 1 đơn hàng = Giá bán tại thời điểm bán − Giá vốn tại thời điểm sản xuất/xuất kho
```

Nếu báo cáo margin lấy nhầm giá bán theo Price List hiện tại, và giá vốn theo Standard Cost hiện tại — thay vì lấy đúng giá đã chốt tại từng transaction — sai số sẽ dồn theo cả 2 chiều, khiến con số margin cuối cùng lệch xa hơn cả việc chỉ sai 1 phía.

## Vài lưu ý khác không thể bỏ qua

- **Cost Rollup không tự lan truyền**: giá nguyên liệu đổi không tự động cập nhật giá thành phẩm cấp trên (multi-level BOM) cho đến khi chạy lại Cost Rollup.
- **Job đã đóng không bị ảnh hưởng bởi giá đổi sau này** — đúng nguyên tắc, nhưng dễ gây hiểu lầm nếu ai đó kỳ vọng ngược lại.
- **Tỷ giá ngoại tệ** với nguyên liệu nhập khẩu tạo thêm 1 chiều biến động ngoài đơn giá gốc.
- **Lệch ngày hiệu lực giữa BOM/Routing và giá** dễ gây sai lệch cost trong khoảng giao thời mà không ai để ý.
- **Actual Costing theo Lot/Serial** khiến "giá của Item" có thể tồn tại nhiều mức song song cùng lúc, không chỉ biến động theo thời gian.
- **Overhead phân bổ theo %** không cố định như nhiều người tưởng — nó tự đổi theo khi Material Cost thay đổi.

## Bài học rộng hơn cả ERP

Nguyên lý "point-in-time value" này thực ra chính là khái niệm **Slowly Changing Dimension (SCD)** quen thuộc trong Data Warehouse — áp dụng cho bất kỳ dữ liệu nào biến động theo thời gian: giá vàng, tỷ giá, giá cổ phiếu... Bất cứ khi nào cần biết "giá trị tại 1 thời điểm quá khứ", câu trả lời không bao giờ nằm ở "giá trị hiện tại", mà phải nằm ở dữ liệu có gắn timestamp.

## Checklist bỏ túi khi viết báo cáo costing

- Xác định rõ Costing Method đang dùng (Standard/Actual/Moving Average) — mỗi loại có rủi ro khác nhau
- Xác định rõ bảng nào là *current*, bảng nào là *historical* trước khi viết query
- Tự kiểm tra: chạy lại query sau vài tháng, kết quả dữ liệu cũ có đổi theo giá mới không?
- Có bảng lưu lịch sử thay đổi giá chuẩn để tra cứu độc lập
- Xác định rõ mục đích báo cáo trước khi chọn cách tổng hợp giá
- Khi tính margin, lấy đúng giá bán và giá vốn tại đúng transaction — không join ngược về bảng "giá hiện hành" ở cả 2 phía

---

*Không có công thức đúng tuyệt đối cho việc lấy giá trong báo cáo — chỉ có nguyên tắc bất biến: dữ liệu hiển thị phải phản ánh đúng giao dịch thực tế tại đúng thời điểm, và cách tổng hợp phải phù hợp với câu hỏi mà báo cáo đang trả lời. Nguyên tắc này không đổi dù bạn dùng Oracle EBS, Epicor, SAP, Microsoft Dynamics, hay bất kỳ ERP nào khác — vì nó đến từ bản chất kế toán, không phải từ cách 1 phần mềm cụ thể được thiết kế.*

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
