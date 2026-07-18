---
title: "Tính Tuần Của Ngày Bất Kỳ Trong Năm? Theo Chuẩn ISO 8601 Và Globalization"
date: 2026-07-18 16:00:00 +0700
categories: [Lập trình, C#]
tags: [c#, sql server, datetime, iso 8601]
author: haicoi
---

Làm báo cáo thường sử dụng chuẩn 1 năm có 52 tuần và được tính theo chuẩn ISO. Vậy khi số tuần tính theo ISO mà được 52 hay 53 thì mình cần kiểm tra lại: nếu rơi vào tháng 12 thì sẽ là tuần thứ 52, còn rơi vào tháng 1 thì ta sẽ chuyển về tuần 1.

Trong SQL có hàm cung cấp lấy tuần của ngày ra theo 2 chuẩn này.

**VD:** kiểm tra ngày 01/07/2022 theo định dạng MM/dd/YYYY

## Theo ISO 8601

```sql
select DATEPART(ISOWK,'2022-07-01') as WeekNumberISO
```

![Kết quả DATEPART ISOWK](https://haicoiblog.files.wordpress.com/2023/07/image-1.png)

```sql
select DATEPART(ISOWK,'2021-01-01') as WeekNumberISO
```

![Kết quả DATEPART ISOWK 2021-01-01](https://haicoiblog.files.wordpress.com/2023/07/image-3.png)

```sql
select DATEPART(ISOWK,'2022-01-01') as WeekNumberISO
```

![Kết quả DATEPART ISOWK 2022-01-01](https://haicoiblog.files.wordpress.com/2023/07/image-4.png)

```sql
select DATEPART(ISOWK,'2020-12-31') as WeekNumberISO
```

![Kết quả DATEPART ISOWK 2020-12-31](https://haicoiblog.files.wordpress.com/2023/07/image-5.png)

Xử lý trường hợp đầu/cuối năm để quy về đúng tuần 1 hoặc tuần 52:

```sql
DECLARE @Date date ='2022-01-01'
select case 
			when DATEPART(ISOWK,@Date)>51 and MONTH(@Date)=1 then 1 
			when DATEPART(ISOWK,@Date)>51 and MONTH(@Date)=12 then 52 
			else  DATEPART(ISOWK,@Date) 
		end as WeekNumberISO
```

![Kết quả xử lý tuần đầu/cuối năm](https://haicoiblog.files.wordpress.com/2023/07/image-6.png)

## Theo Globalization

```sql
select DATEPART(WK,'2022-07-01') as WeekNumber
```

![Kết quả DATEPART WK](https://haicoiblog.files.wordpress.com/2023/07/image-7.png)

```sql
DECLARE @Date date ='2022-01-01'
select DATEPART(WK,@Date) as WeekNumber
```

![Kết quả DATEPART WK 2022-01-01](https://haicoiblog.files.wordpress.com/2023/07/image-8.png)

## Code Test Trên C#

### Theo Globalization

```csharp
using System.Globalization;
CultureInfo cul = CultureInfo.CurrentCulture;
DateTimeFormatInfo dfi = DateTimeFormatInfo.CurrentInfo;
Calendar cal = cul.Calendar;
DateTime day = new DateTime(2022, 7, 1);
Console.WriteLine("tuan cua ngay :" + day.ToString("dd/MM/yyyy") + " theo Globalization là: " + cal.GetWeekOfYear(day, dfi.CalendarWeekRule, dfi.FirstDayOfWeek));
// See https://aka.ms/new-console-template for more information
Console.WriteLine("Hello, World!");
Console.Read();
```

![Kết quả code C# theo Globalization](https://haicoiblog.files.wordpress.com/2023/07/image-9.png)

### Theo ISO 8601

Theo chuẩn này thì ngày 1/1 mà rơi vào thứ 6, 7 và chủ nhật, nó sẽ không được xem là tuần 1 của năm mới mà nó là tuần 52 hoặc 53 của năm cũ. (Tham khảo thêm: [ISO 8601 trên Wikipedia](https://en.wikipedia.org/wiki/ISO_8601))

```csharp
//--------------------------get Weeken of Year--------------
//https://en.wikipedia.org/wiki/ISO_8601
//theo chuẩn này thì ngày 1/1 mà rơi vào thứ 6, 7 và chủ nhật nó sẽ không được xem là tuần 1 của năm mới mà nó là tuần 52 hoặc 53 của năm cũ     
DateTime fromDate = day;

DateTime startOfYear = fromDate.AddDays(-fromDate.Day + 1).AddMonths(-fromDate.Month + 1);
DateTime endOfYear = startOfYear.AddYears(1).AddDays(-1);
int[] iso8601Correction = { 7, 8, 9, 10, 4, 5, 6 };
int nds = fromDate.Subtract(startOfYear).Days + iso8601Correction[(int)startOfYear.DayOfWeek];
week = nds < 7 ? 1 : nds / 7;
DateTime NewDate = fromDate;
switch (week)
{
	case 0:
		// Return Week Number of Previous Year in some cases (1/1/2016)
		NewDate = startOfYear.AddDays(-1);
		startOfYear = fromDate.AddDays(-NewDate.Day + 1).AddMonths(-NewDate.Month + 1);
		endOfYear = startOfYear.AddYears(1).AddDays(-1);
		nds = NewDate.Subtract(startOfYear).Days + iso8601Correction[(int)startOfYear.DayOfWeek];
		week = nds < 7 ? 1 : nds / 7;
		break;
	case 52:
		if (fromDate.Month == 1)
		{
			week = 1;
		}
		else
		{
			week = week;
		}
		break;
	case 53:
		// Adjust
		//if (endOfYear.DayOfWeek < DayOfWeek.Thursday)
		//{
		//	week = 1;
		//}
		//else
		//	week = week;
		if (fromDate.Month == 1)
		{
			week = 1;
		}
        else if(fromDate.Month==12)
        {
			week = 52;
        }			
		break;
}
Console.WriteLine("tuan cua ngay :" + day.ToString("dd/MM/yyyy") + " theo ISO 8601 là: " + week.ToString());
```

![Kết quả code C# theo ISO 8601 - 1](https://haicoiblog.files.wordpress.com/2023/07/image-10.png)

![Kết quả code C# theo ISO 8601 - 2](https://haicoiblog.files.wordpress.com/2023/07/image-11.png)

![Kết quả code C# theo ISO 8601 - 3](https://haicoiblog.files.wordpress.com/2023/07/image-12.png)

<p align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>


