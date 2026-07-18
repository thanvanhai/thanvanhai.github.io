---
title: "Kiểm Tra 2 Mảng Khuyết N Phần Tử Liên Tiếp Trở Lên"
date: 2026-07-18 10:00:00 +0700
categories: [Lập trình, C#]
tags: [c#, algorithm, array, thuật toán]
author: haicoi
---

Áp dụng để tính một số bài toán như tìm mặt hàng có N tháng liên tiếp không nhập xuất kho, hay hàng hóa có N tháng liên tiếp không được bán trong khoảng thời gian nhất định, ....

## Ý tưởng thuật toán

Có 2 mảng A và B không trùng phần tử, và mảng B luôn luôn là con của mảng A và có thứ tự sắp xếp giống nhau.

Duyệt tìm mảng A trong mảng B, kiểm tra vị trí các phần tử thông qua 2 biến **Begin** và **Stop**.

Khởi đầu **Begin** và **Stop = -1**

- Nếu tìm thấy phần tử ở vị trí `i` của mảng A trong mảng B thì gán **Stop = i**
- Sau đó lấy **Stop - Begin = 1**: mảng B đang liên tục trong mảng A
- Còn **Stop - Begin = 0**: là mảng không liên tục
- **Stop - Begin = N**: là mảng đang khuyết N phần tử liên tiếp

## Có 2 trường hợp đặc biệt

**Trường hợp 1:** Là khi mảng B không khuyết phần tử đầu tiên (vị trí 0) thì sẽ cập nhật lại biến `Begin = 0` — nếu ngay khi vòng lặp mảng A có `i` bắt đầu 0 thì ta cập nhật lại `Begin = 0`.

**Trường hợp 2:** Là từ vị trí cuối cùng của mảng B xuất hiện trong mảng A, đến hết mảng A không tìm thấy phần tử nào nữa, thì khi đến cuối mảng A phải lấy `i` (vị trí cuối cùng mảng A) trừ `Begin` (vị trí cuối cùng của phần tử A tìm thấy trong mảng B).

## Bảng test case

📎 [Tải file test case: test-khuyet-n-phan-tu-lien-tiep.xlsx](https://haicoiblog.files.wordpress.com/2023/07/test-khuyet-n-phan-tu-lien-tiep.xlsx)

![Bảng test case](https://haicoiblog.files.wordpress.com/2023/07/image-14.png)

## Code C#

```csharp
using System;
static bool CheckArrrayErrorSequence(List<string> A, List<string> B, int errorSequence)
{
	int begin = -1, stop = -1;
	bool check = false;   
    if ((A.Count / errorSequence) > B.Count)//nếu phần tử mảng con quá nhỏ so với màng B thì cũng ko cần lặp
        check = true;
    if (!check)
	{
		for (int i = 0; i < A.Count; i++)
		{
			for (int j = 0; j < B.Count; j++)
			{
				if (A[i] == B[j])
				{
					if (i == 0)//nếu không khuyết phần tử đầu thì begin=0
						begin = i;
					stop = i;
					break;
				}
			}
			if (i == (A.Count - 1) && ((i - begin) > (errorSequence - 1) && stop != i))//trường hợp khuyết phần tử cuối cùng từ vị trí phần tử cuối cùng của mảng con cuối cùng xuất hiện
			{				
				check = true;
			}
			else if ((stop - begin) > errorSequence)//muốn kiểm tra mảng con khuyết bao nhiêu phàn từ liên tiếp thì sẽ lớn hơn số đó ở đây là khoảng cách vị trí liên tiếp, nhớ sửa điều kiện cho trường hợp khuyết phần tử sau cùng
			{
				check = true;
				break;
			}
			else
			{				
				begin = stop;
			}
		}
	}
	return check;
}
var start = new DateTime(2022, 10, 1);
var end = new DateTime(2023, 6, 22);

var diff = Enumerable.Range(0, Int32.MaxValue)
                     .Select(e => start.AddMonths(e))
                     .TakeWhile(e => e <= end)
                     .Select(e => e.ToString("yyyyMM"));
List<string> A = diff.ToList();
Console.Write("Array A: ");
A.ForEach(i => Console.Write(i.ToString() + ", "));
List<string> B = new List<string> { "202211",  "202302", "202303"};
Console.WriteLine();
Console.Write("Array B: ");
B.ForEach(i => Console.Write(i.ToString() + ", "));
List<string> C = new List<string> { "202211", "202212", "202301", "202302", "202303","202305"};
Console.WriteLine();
Console.Write("Array C: ");
C.ForEach(i => Console.Write(i.ToString() + ", "));
List<string> D = new List<string> { "202211", "202212"};
Console.WriteLine();
Console.Write("Array D: ");
D.ForEach(i => Console.Write(i.ToString() + ", "));
Console.WriteLine();
Console.WriteLine("Check error sequence (2) A vs B " + CheckArrrayErrorSequence(A, B, 2).ToString());
Console.WriteLine("Check error sequence (2) A vs C " + CheckArrrayErrorSequence(A, C, 2).ToString());
Console.WriteLine("Check error sequence (4) A vs D " + CheckArrrayErrorSequence(A, D, 4).ToString());
// Function to Check if array
// elements are consecutiv
// See https://aka.ms/new-console-template for more information
Console.WriteLine("Hello, World!");
Console.Read();
```

![Kết quả chạy chương trình](https://haicoiblog.files.wordpress.com/2023/07/image-13.png)

> Có thể cải tiến bài toán thành so sánh 2 mảng có đối xứng nhau hay không? Tìm các khoảng không liên tiếp giữa 2 mảng, ...

<p align="center" style="color:#008000"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>
