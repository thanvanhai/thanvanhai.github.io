---
id: so-sanh-group-by-va-over-partition-by
title: So Sánh GROUP BY và OVER (PARTITION BY … ORDER BY) Trong SQL Server
sidebar_label: GROUP BY vs OVER (PARTITION BY)
slug: /database/sql-server/so-sanh-group-by-va-over-partition-by
sidebar_position: 1
date: 2023-09-09
description: So sánh GROUP BY và Window Function OVER (PARTITION BY ... ORDER BY) trong SQL Server, kèm ví dụ ROW_NUMBER, RANK, DENSE_RANK và ứng dụng tính tồn kho lũy kế.
tags: [sql-server, window-function, partition-by, group-by, over]
---

**Group by**: số lượng dòng kết quả trả về sẽ được ít hơn số dòng detail và phụ thuộc vào select (Select cái gì thì Group by cái đó). Điều kiện của **Group by** là **Having**, điều kiện của **Select** là **Where**.

```sql
WITH VDOverPartition AS
 (SELECT 1 as ID , N'Thân Văn Hải' as Name, N'A' Team, 9 as Scores
  UNION ALL SELECT 2, N'Nguyễn Thị Ngọc Bích', N'A', 10
  UNION ALL SELECT 3, N'Trần Viết Nguyễn Minh Hiếu', N'A' , 8
  UNION ALL SELECT 4, N'Hồ Quốc Hiếu', N'B', 8
  UNION ALL SELECT 5, N'Hồ Trần Thương Thương,', N'B', 8
  UNION ALL SELECT 6, N'Trần Thị Hà', 'B', 9
  UNION ALL SELECT 7, N'Lê Bá Anh Minh', 'C', 10
  UNION ALL SELECT 8, N'Trần Thị Thủy', 'C', 10
  UNION ALL SELECT 9, N'Trần Phương Thảo', 'C', 8
  UNION ALL SELECT 10, N'Nguyễn Ngọc Ngạn', 'C', 9
)
SELECT Team, count(*) As NumberPerson, sum(Scores) as TotalScores
FROM VDOverPartition
where Scores <10
group by Team
having sum(Scores)<25
```

![Kết quả GROUP BY](https://haicoiblog.files.wordpress.com/2023/09/image-4.png)

**Over (Partition by)** linh động hơn, sẽ không phụ thuộc select và giữ nguyên các dòng detail, thực hiện tính toán trên nhóm mà mình muốn và có thể tính toán theo trình tự sắp xếp được. Được dùng để xếp hạng (`RANK()` hoặc `DENSE_RANK()`), tính tồn kho tại 1 thời điểm bất kỳ, tính lũy kế, tính lũy tiến, ...

**Row_number()**: đơn giản là đánh số thứ tự của từng dòng theo nghĩa nguyên thủy nhất.

**Rank():** là hàm dùng để xếp hạng dữ liệu từ cao tới thấp (nghe giống row_number quá), tuy nhiên có một điểm cốt lõi làm rank khác row_number đó chính là rank sẽ có giá trị bị lặp lại khi data bị trùng lặp (không như row_number) và thứ tự hạng sẽ bị nhảy nếu có trùng thứ hạng.

**DENSE_RANK():** có logic về thứ tự giống như rank, tức là cũng đánh số theo thứ tự, và có giá trị lặp khi cột có giá trị bị lặp lại. Tuy nhiên điểm khác biệt chính của dense rank là không bỏ đi thứ hạng dù cho thứ hạng gần nhất bị lặp lại nhiều lần.

## Bảng so sánh nhanh

| Đặc điểm | GROUP BY | OVER (PARTITION BY) |
|---|---|---|
| Số dòng kết quả | Gộp lại, ít hơn dòng gốc | Giữ nguyên số dòng chi tiết |
| Điều kiện lọc nhóm | `HAVING` | Không có mệnh đề riêng, phải lọc bằng CTE/subquery bọc ngoài |
| Sắp xếp trong nhóm | Không hỗ trợ | Hỗ trợ qua `ORDER BY` bên trong `OVER()` |
| Truy cập dòng khác trong nhóm | Không thể | Có thể, qua `LAG()`, `LEAD()`, `FIRST_VALUE()`... |
| Use case | Báo cáo tổng hợp (report tổng số, tổng tiền theo nhóm) | Xếp hạng, tính lũy kế, so sánh dòng hiện tại với dòng trước/sau, tồn kho tại 1 thời điểm |

```sql
WITH VDOverPartition AS
 (SELECT 1 as ID , N'Thân Văn Hải' as Name, N'A' Team, 9 as Scores
  UNION ALL SELECT 2, N'Nguyễn Thị Ngọc Bích', N'A', 10
  UNION ALL SELECT 3, N'Trần Viết Nguyễn Minh Hiếu', N'A' , 8
  UNION ALL SELECT 4, N'Hồ Quốc Hiếu', N'B', 8
  UNION ALL SELECT 5, N'Hồ Trần Thương Thương,', N'B', 8
  UNION ALL SELECT 6, N'Trần Thị Hà', 'B', 9
  UNION ALL SELECT 7, N'Lê Bá Anh Minh', 'C', 10
  UNION ALL SELECT 8, N'Trần Thị Thủy', 'C', 10
  UNION ALL SELECT 9, N'Trần Phương Thảo', 'C', 8
  UNION ALL SELECT 10, N'Nguyễn Ngọc Ngạn', 'C', 9
)
SELECT *,
  ROW_NUMBER() OVER (PARTITION BY Team order by Scores desc) AS RowNumBer,
  rank() OVER (PARTITION BY Team order by Scores desc) AS Rank,
  DENSE_RANK () OVER (PARTITION BY Team order by Scores desc) AS RankDese,
  sum(Scores) OVER (PARTITION BY Team order by Scores desc) AS SumToTalSequen
FROM VDOverPartition
```

![Kết quả OVER PARTITION BY](https://haicoiblog.files.wordpress.com/2023/09/image.png)

## Một vài hàm Window Function hữu ích khác nên biết thêm

Ngoài `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()` và `SUM() OVER()` đã nêu ở trên, còn một số hàm cùng nhóm rất hay dùng chung với `OVER (PARTITION BY ... ORDER BY)`:

- **`LAG(column, n)`**: lấy giá trị của dòng phía **trước** dòng hiện tại `n` dòng trong cùng partition — hữu ích khi so sánh giá trị kỳ này với kỳ trước (ví dụ doanh thu tháng này so với tháng trước).
- **`LEAD(column, n)`**: ngược lại với `LAG`, lấy giá trị dòng phía **sau**.
- **`FIRST_VALUE()` / `LAST_VALUE()`**: lấy giá trị đầu/cuối trong partition theo thứ tự sắp xếp — dùng để so sánh với mốc đầu kỳ hoặc cuối kỳ.
- **`NTILE(n)`**: chia đều các dòng trong partition thành `n` nhóm bằng nhau — dùng khi cần phân nhóm dữ liệu (ví dụ chia học sinh thành 4 nhóm theo điểm số).
- **`AVG()`, `MIN()`, `MAX()`, `COUNT()` kết hợp `OVER()`**: tương tự `SUM()`, đều tính toán lũy kế hoặc theo nhóm mà vẫn giữ nguyên chi tiết từng dòng.

### Về khung tính toán (Frame): ROWS vs RANGE

Khi dùng `ORDER BY` bên trong `OVER()`, SQL Server mặc định tính lũy kế theo `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Nếu muốn kiểm soát chính xác phạm vi các dòng tham gia tính toán (ví dụ chỉ tính 3 dòng gần nhất để làm trung bình trượt - *moving average*), có thể khai báo rõ:

```sql
SELECT *,
  AVG(Scores) OVER (
    PARTITION BY Team 
    ORDER BY ID 
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS MovingAvg3Rows
FROM VDOverPartition
```

`ROWS` tính theo số dòng vật lý, còn `RANGE` tính theo giá trị logic — với dữ liệu có giá trị trùng nhau, hai cách này có thể cho kết quả khác nhau, cần lưu ý khi dùng.

### Lưu ý về hiệu năng

`OVER (PARTITION BY)` thường tốn chi phí sort/partition trong execution plan, đặc biệt với bảng lớn không có index phù hợp trên cột `PARTITION BY`/`ORDER BY`. Nên cân nhắc tạo index hỗ trợ (covering index) trên các cột này nếu truy vấn chạy thường xuyên trên bảng dữ liệu lớn.

## Ứng dụng thực tế: Tính tồn kho lũy kế (Running Quantity On Hand)

Đây là ví dụ thực tế dùng `SUM() OVER (PARTITION BY ... ORDER BY ...)` để tính tồn kho tại từng thời điểm giao dịch, thay cho cách viết bằng con trỏ (`CURSOR`) truyền thống — vừa gọn hơn vừa hiệu năng tốt hơn nhiều với dữ liệu lớn:

```sql
with [OnHandCurrent] as 
(select 
	[PartBin].[Company] as [PartBin_Company],
	[PartBin].[PartNum] as [PartBin_PartNum],
	[PartBin].[DimCode] as [PartBin_DimCode],
	(--số lượng tồn kho hiện tại
   sum(PartBin.OnhandQty)) as [Calculated_TotalOnHandCurrent]
from Erp.PartBin as PartBin
where (PartBin.PartNum = @PartNum)
group by [PartBin].[Company],
	[PartBin].[PartNum],
	[PartBin].[DimCode])

select 
	[PartTran].[Company] as [PartTran_Company],
	[PartTran].[PartNum] as [PartTran_PartNum],
	[PartTran].[TranDate] as [PartTran_TranDate],
	[PartTran].[TranQty] as [PartTran_TranQty],
	(--xác định dữ liệu nhập xuất
 (case
     when PartTran.TranType IN ('STK-ASM', 'STK-CUS', 'STK-INS', 'STK-KIT', 'STK-FAM', 'STK-MTL', 'STK-PLT', 'STK-STK', 'STK-UKN', 'STK-DMR') then -1 
     when PartTran.TranType IN ('ADJ-CST', 'ADJ-QTY', 'AST-STK', 'DMR-STK', 'INS-STK', 'MFG-STK', 'PLT-STK', 'PUR-STK', 'STK-STK', 'SVG-STK')  then 1 
     else 0
 end) * PartTran.TranQty) as [Calculated_SignedTranQty],
	(SUM(SignedTranQty) OVER (PARTITION BY PartTran.PartNum ORDER BY PartTran.TranNum)) as [Calculated_RunningQOH],
	[PartTran].[UM] as [PartTran_UM],
	[OnHandCurrent].[Calculated_TotalOnHandCurrent] as [Calculated_TotalOnHandCurrent],
	[OnHandCurrent].[PartBin_DimCode] as [PartBin_DimCode],
	[PartTran].[TranType] as [PartTran_TranType],
	[PartTran].[WareHouseCode] as [PartTran_WareHouseCode],
	[PartTran].[BinNum] as [PartTran_BinNum],
	[PartTran].[WareHouse2] as [PartTran_WareHouse2],
	[PartTran].[BinNum2] as [PartTran_BinNum2],
	[PartTran].[TranReference] as [PartTran_TranReference]
from Erp.PartTran as PartTran
inner join  OnHandCurrent  as OnHandCurrent on 
	PartTran.Company = OnHandCurrent.PartBin_Company
	and PartTran.PartNum = OnHandCurrent.PartBin_PartNum
where (PartTran.PartNum = @PartNum  and PartTran.TranDate <= @TranDateTo)
```

![Kết quả tính tồn kho lũy kế 1](https://haicoiblog.files.wordpress.com/2023/09/image-1.png)

![Kết quả tính tồn kho lũy kế 2](https://haicoiblog.files.wordpress.com/2023/09/image-2.png)

![Kết quả tính tồn kho lũy kế 3](https://haicoiblog.files.wordpress.com/2023/09/image-3.png)

Cách viết này đặc biệt hữu dụng trong các hệ thống ERP (như ví dụ trên với bảng `Erp.PartTran`) khi cần truy vết tồn kho tại bất kỳ thời điểm nào trong quá khứ mà không cần snapshot dữ liệu hàng ngày — chỉ cần cộng dồn các giao dịch nhập/xuất theo đúng thứ tự thời gian.

<p align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>
