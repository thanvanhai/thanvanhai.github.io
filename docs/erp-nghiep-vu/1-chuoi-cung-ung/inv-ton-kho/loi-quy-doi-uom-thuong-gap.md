---
id: loi-quy-doi-uom-erp
title: Lỗi quy đổi đơn vị tính (UOM) — Pattern lỗi phổ biến khiến báo cáo ERP sai lệch
sidebar_label: Lỗi quy đổi đơn vị tính (UOM)
slug: /erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/loi-quy-doi-uom-thuong-gap
sidebar_position: 32
date: 2026-07-21
tags: [erp, inventory, uom, epicor, report, data-integrity]
---

# Lỗi quy đổi đơn vị tính (UOM) — "Sát thủ thầm lặng" làm lệch tồn kho và giá thành ERP

## Vì sao lỗi này đáng nói

Đây không phải một lỗi hệ thống (bug) của bất kỳ phần mềm ERP nào, mà là lỗi **logic report và quy trình vận hành** khi xử lý dữ liệu có nhiều đơn vị tính (UOM) khác nhau trên cùng một mã hàng. Điều đáng chú ý là pattern lỗi này không chỉ xảy ra ở một phần mềm cụ thể — qua quá trình làm việc với nhiều hệ ERP khác nhau (một hệ ERP Việt Nam tự phát triển, Epicor, và ghi nhận tương tự ở một số doanh nghiệp triển khai SAP), đây là rủi ro mang tính **hệ thống trong cách thiết kế báo cáo**, không phải nhược điểm riêng của phần mềm nào.

Vì lỗi này rất khó phát hiện bằng mắt thường (số liệu ở từng dòng "trông có vẻ hợp lý"), nó có thể âm thầm tồn tại trong báo cáo suốt nhiều tháng, thậm chí nhiều năm, trước khi bị phát hiện qua một đợt đối chiếu hoặc kiểm toán.

## Thuật ngữ tương đương giữa các hệ ERP

Vì mỗi hệ ERP gọi tên khác nhau, trước khi đi vào chi tiết, đây là bảng đối chiếu thuật ngữ để bạn đọc từ hệ nào cũng liên hệ được:

| Hệ thống | Tên gọi danh mục hàng hoá | Tên gọi UOM mua / bán / tồn kho |
|---|---|---|
| Epicor | Part | PUM (Purchasing UOM) / SUM (Sales UOM) / IUM (Inventory UOM) |
| Oracle ERP | Item | Primary UOM + bảng UOM Conversion riêng |
| Microsoft Dynamics AX | Item | Purchase Unit / Sales Unit / Inventory Unit |
| ERP Việt Nam (tự phát triển) | Vật tư / Hàng hoá | Thường chỉ có 1 đơn vị chính + hệ số quy đổi phụ |

Dù tên gọi khác nhau, bản chất thiết kế đều giống nhau: **tách UOM theo mục đích sử dụng** (mua hàng, bán hàng, quản lý tồn kho), và mỗi mã hàng có một hệ số quy đổi riêng giữa các UOM này.

## Bản chất vấn đề

Hệ thống ERP, dù là hệ nào, đều **lưu đúng dữ liệu** theo từng UOM đã khai báo. Vấn đề không nằm ở tầng lưu trữ, mà nằm ở tầng **báo cáo và đối chiếu**, khi người viết report lấy số liệu từ hai nguồn khác nhau mà không quy đổi về cùng một UOM trước khi so sánh.

Điểm nguy hiểm nhất của lỗi này: với những mã hàng có UOM mua/bán trùng với UOM tồn kho (hệ số quy đổi = 1), báo cáo vẫn cho ra kết quả đúng. Điều này khiến người kiểm tra dễ chủ quan, cho rằng "báo cáo đã test ổn". Chỉ những mã hàng có tỷ lệ quy đổi khác 1 mới lộ ra sai lệch — và vì thường chỉ chiếm một phần trong toàn bộ danh mục, lỗi rất dễ bị bỏ sót khi test và nghiệm thu báo cáo.

## Case study thực tế (ví dụ minh hoạ trên Epicor)

Hãy tưởng tượng doanh nghiệp đang quản lý vật tư **Bu-lông mạ kẽm (Part: `BUL-001`)**:
- Đơn vị tồn kho (IUM): `PCS` (Con)
- Đơn vị mua hàng (PUM): `BOX` (Hộp)
- Tỷ lệ quy đổi: `1 BOX = 100 PCS`

**Nghiệp vụ phát sinh:**
1. Phòng mua hàng tạo PO đặt mua **10 BOX** (tương đương 1.000 PCS) với giá **100 USD/BOX** (tức 1 USD/con).
2. Thủ kho nhận hàng thực tế vào kho **1.000 PCS** (hệ thống tự động quy đổi và ghi nhận nhập kho đúng).

**Và đây là nơi vấn đề bắt đầu:** Khi kế toán yêu cầu viết báo cáo "Đối chiếu số lượng đặt mua và số lượng thực nhập", báo cáo join trực tiếp bảng đặt mua (PODetail) và bảng nhận hàng (RcvDtl), lấy nguyên giá trị số lượng ở mỗi bảng:

- Số lượng đặt mua (PO Qty): `10`
- Số lượng đã nhận (Received Qty): `1.000`
- Chênh lệch: `-990` ⚠️

Báo cáo kết luận: **kho đã nhận dư 990 đơn vị.** Phòng mua hàng hoang mang vì sợ kho nhận thừa hàng, thủ kho thì khẳng định chỉ đếm đúng 10 hộp. Một báo cáo "trông rất logic" đã khiến hai phòng ban tranh cãi qua lại suốt cả tuần kiểm kê — trong khi bản chất chỉ là báo cáo đang so sánh hai cột số liệu ở hai đơn vị tính khác nhau.

## Phân tích kỹ thuật: đoạn SQL lỗi kinh điển (ví dụ minh hoạ trên Epicor)

Đây là đoạn query minh hoạ theo cấu trúc bảng của Epicor, thể hiện đúng lỗi vừa mô tả ở trên:

**❌ Đoạn SQL viết sai (lấy trực tiếp Qty thô, không quy đổi):**
```sql
SELECT
    po.PONum,
    po.PartNum,
    po.PUM,             -- Đơn vị mua hàng (BOX)
    rcv.IUM,            -- Đơn vị tồn kho (PCS)
    po.OrderQty,        -- Số lượng theo PUM (10) — chưa quy đổi
    rcv.OurQty,         -- Số lượng theo IUM (1000)
    (po.OrderQty - rcv.OurQty) AS Difference  -- Ra kết quả -990
FROM Erp.PODetail po
INNER JOIN Erp.RcvDtl rcv
    ON po.Company = rcv.Company
    AND po.PONum = rcv.PONum
    AND po.POLine = rcv.POLine
```

**✔️ Đoạn SQL sửa đúng (chuẩn hoá về một UOM duy nhất trước khi so sánh):**
```sql
SELECT
    po.PONum,
    po.PartNum,
    po.IUM,                    -- Đơn vị tồn kho gốc (PCS)
    po.XOrderQty AS BasePOQty, -- Số lượng đặt mua đã quy đổi về IUM (1.000)
    rcv.OurQty AS BaseRcvQty,  -- Số lượng nhận thực tế theo IUM (1.000)
    (po.XOrderQty - rcv.OurQty) AS Difference  -- Kết quả ra 0
FROM Erp.PODetail po
INNER JOIN Erp.RcvDtl rcv
    ON po.Company = rcv.Company
    AND po.PONum = rcv.PONum
    AND po.POLine = rcv.POLine
```

Nguyên tắc chung khi viết báo cáo trên bất kỳ hệ ERP nào (không riêng Epicor): trước khi so sánh hoặc cộng dồn số liệu, luôn phải xác định rõ trường dữ liệu đang ở UOM nào, và quy đổi tất cả về cùng một UOM chuẩn — hệ thống nào cũng có sẵn cơ chế lưu hệ số quy đổi (UOM Conversion) để phục vụ việc này.

## Nguyên tắc vàng: luôn lấy đơn vị tồn kho làm gốc

Dù làm việc trên hệ ERP nào, có một nguyên tắc bất biến giúp tránh gần như toàn bộ lỗi dạng này: **luôn quy đổi và so sánh dữ liệu theo UOM tồn kho (Inventory UOM), không phải UOM mua hàng hay bán hàng.**

Lý do: số lượng tồn kho thực tế (on-hand) không bao giờ được lưu theo đơn vị lớn như Thùng hay Cuộn — nó luôn được ghi nhận theo đơn vị nhỏ nhất, không thể chia nhỏ hơn được nữa (Cái, Con, Mét...). Đây là đơn vị "gốc" mà mọi phân hệ khác (mua hàng, bán hàng, sản xuất) đều phải quy đổi về khi cần đối chiếu với tồn kho thực tế. Nếu báo cáo lấy UOM mua hàng hoặc bán hàng làm chuẩn để so sánh với tồn kho, đó chính là điểm bắt đầu của sai lệch.

## "Cú đòn" chí mạng vào giá thành (Costing)

Lệch số lượng trên báo cáo đối chiếu mới là phần nổi. Hậu quả nghiêm trọng hơn của việc bất đồng bộ UOM là làm sai lệch **giá trị tồn kho và giá thành sản xuất (WIP Costing)**.

Vẫn với ví dụ bu-lông ở trên — giá mua gốc là 100 USD/BOX (tương đương 1 USD/con). Nếu báo cáo kế toán lấy số lượng tồn kho (1.000 PCS) nhân trực tiếp với đơn giá PO (100 USD) mà quên chia cho hệ số quy đổi (100):

```
Giá trị tồn kho tính sai = 1.000 × 100 = 100.000 USD
(trong khi giá trị thực tế chỉ là 1.000 USD)
```

**Hậu quả thực tế:**
- Giá trị hàng tồn kho trên báo cáo nội bộ bị thổi phồng gấp nhiều lần so với thực tế, gây khó khăn khi đối chiếu số liệu giữa phân hệ Kho (Subledger) và Sổ cái (GL).
- Khi hệ thống chạy hoạch định nhu cầu vật tư (MRP) dựa trên số liệu sai lệch, có thể đề xuất mua thêm một lượng lớn vật tư trong khi kho thực tế vẫn còn đủ, gây lãng phí dòng tiền không đáng có.

## Ghi nhận thêm ở các hệ khác

Pattern lỗi tương tự cũng được ghi nhận ở một số doanh nghiệp triển khai SAP — nơi cơ chế UOM Conversion giữa đơn vị mua hàng và đơn vị tồn kho hoạt động đúng thiết kế, nhưng báo cáo tổng hợp do không đồng nhất UOM khi so sánh dữ liệu đã dẫn đến sai lệch số liệu kéo dài, chỉ được phát hiện qua một đợt đối chiếu sau này. Điều này càng củng cố nhận định: đây là rủi ro chung của mọi hệ ERP có thiết kế đa UOM, không phải nhược điểm riêng của một phần mềm cụ thể.

## Vì sao lỗi này dễ tái diễn dù đã biết

- **Không bao giờ tin vào dữ liệu mẫu (dummy data):** khi test báo cáo, lập trình viên thường chỉ test với các mã hàng thông thường (UOM mua = UOM kho, hệ số = 1), nên báo cáo luôn "đúng" trong quá trình test. Bắt buộc phải có kịch bản test riêng cho các mã hàng có tỷ lệ quy đổi khác 1 (Thùng → Con, Cuộn → Mét...).
- **Chưa thuộc lòng cấu trúc schema:** trước khi kéo bất kỳ trường số lượng hay đơn giá nào ra báo cáo, cần tự hỏi trường này đang ở UOM nào, hệ thống đã có sẵn trường quy đổi hay phải tự viết công thức quy đổi.
- **Thiếu review chéo giữa Tech và Functional:** người viết query thường chỉ nhìn vào tên bảng/trường, không nắm được nghiệp vụ thực tế (đặt mua theo hộp nhưng phát sinh lẻ theo con). Báo cáo trước khi bàn giao cần được review bởi Functional Consultant hoặc Key User của phòng kế toán/kho.

## Checklist phòng tránh (áp dụng chung mọi hệ ERP)

- Luôn xác định rõ cột số lượng đang ở UOM nào trước khi so sánh hoặc cộng dồn dữ liệu từ hai bảng/nguồn khác nhau.
- Luôn quy đổi và so sánh theo UOM tồn kho (đơn vị nhỏ nhất) làm gốc, không dùng UOM mua hàng hoặc bán hàng làm chuẩn đối chiếu.
- Lập danh sách các mã hàng có UOM mua/bán khác UOM tồn kho, dùng làm tập dữ liệu test riêng khi xây dựng hoặc chỉnh sửa báo cáo.
- Định kỳ đối chiếu số liệu tồn kho thực tế (kiểm kê) với số liệu trên báo cáo hệ thống, thay vì chỉ tin vào báo cáo "trông có vẻ hợp lý".
- Đảm bảo logic report được review bởi người hiểu cả nghiệp vụ lẫn cấu trúc UOM, không chỉ đơn thuần là người viết truy vấn dữ liệu.

## Kết luận

Lỗi quy đổi UOM là ví dụ điển hình cho thấy những vấn đề tưởng chừng nhỏ và mang tính kỹ thuật thuần tuý trong ERP hoàn toàn có thể gây hậu quả nghiêm trọng — từ tranh cãi giữa các phòng ban đến sai lệch giá thành và quyết định mua hàng sai — nếu không được kiểm soát chặt chẽ ngay từ giai đoạn thiết kế báo cáo. Vì bản chất là lỗi thiết kế logic chứ không phải lỗi phần mềm, nó có thể xuất hiện ở bất kỳ hệ ERP nào có cơ chế đa UOM — điều quan trọng không phải "hệ nào an toàn hơn", mà là quy trình kiểm soát chất lượng báo cáo có đủ chặt chẽ để phát hiện sớm hay không.
