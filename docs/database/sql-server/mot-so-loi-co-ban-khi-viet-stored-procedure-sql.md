---
id: loi-co-ban-khi-viet-stored-procedure-sql
title: Một Số Lỗi Cơ Bản Khi Viết Stored Procedure Trong SQL
sidebar_label: Lỗi Cơ Bản Khi Viết Stored Procedure
slug: /database/sql-server/mot-so-loi-co-ban-khi-viet-stored-procedure-sql
sidebar_position: 2
date: 2024-08-10
description: Tổng hợp 8 lỗi cơ bản, phổ biến khi viết Stored Procedure trong SQL Server và cách khắc phục.
tags: [sql-server, stored-procedure, dynamic-sql, debug]
---

Trong quá trình viết Stored Procedure, có một số lỗi rất phổ biến nhưng lại âm thầm gây ra kết quả sai hoặc hiệu năng kém — mà nhiều khi không hề báo lỗi cú pháp. Bài viết này tổng hợp lại 8 lỗi cơ bản thường gặp nhất.

## 1. Bỏ sót kiểm tra giá trị NULL trong điều kiện WHERE

Kiểm tra giá trị `null` bằng cách sử dụng toán tử `ISNULL()` khi thực hiện truy vấn ở điều kiện `WHERE`. Khi ta lấy giá trị cột để so sánh, nếu gặp ô mang giá trị `null` thì hệ thống sẽ không báo lỗi mà đôi khi nó dừng tại đó và vẫn trả ra kết quả, dẫn đến thiếu kết quả.

## 2. Sai sót khi kết hợp AND / OR trong biểu thức Logic

Biểu thức Logic ở `WHERE` có `AND` và `OR` kết hợp cần chú ý đầy đủ dấu ngoặc, theo nguyên tắc: `AND` thì tất cả các biểu thức đúng thì `WHERE` mới đúng; `OR` thì chỉ 1 trong vế của biểu thức đúng thì `WHERE` sẽ đúng.

```sql
(A AND B) OR C   -- khác với   A AND (B OR C)   -- khác với   A AND B OR C
```

Thiếu dấu ngoặc đúng chỗ là một trong những lỗi âm thầm nhất — truy vấn vẫn chạy, không báo lỗi cú pháp, nhưng kết quả trả về sai logic mà rất khó phát hiện nếu không test kỹ với dữ liệu biên.

## 3. Lỗi khi ghép chuỗi điều kiện WHERE động (Dynamic WHERE) mà quên khởi tạo mặc định

Khi viết các bạn thường khai báo một biến `@KeyWhere` dạng `NVARCHAR(4000)` và gán trị khởi tạo là `''` rồi sẽ ghép với các điều kiện khác thông qua toán tử `AND` hay `OR` trong suốt đoạn StoredProcedure thông qua nhiều điều kiện `IF` của từng trường hợp. Điều này sẽ xảy ra lỗi nếu ở điều kiện `IF` nào đó mà quên kiểm tra lại biến `@KeyWhere=''` để bắt đầu chuỗi điều kiện của `WHERE` thì không cần `AND` hay `OR` ở trước chuỗi điều kiện — nhưng điều này rất dễ quên nếu bạn có quá nhiều trường hợp, vì mỗi điều kiện `IF` bạn luôn phải kiểm tra lại biến `@KeyWhere` có giá trị hay chưa (rất dễ xảy ra lỗi nếu bạn lỡ quên, mà code sẽ dài).

![Ví dụ lỗi ghép chuỗi điều kiện WHERE](https://haicoiblog.files.wordpress.com/2024/03/image.png)

> Reset lại biến thì cũng gán lại `N'1=1'`

![Ví dụ reset biến KeyWhere](https://haicoiblog.files.wordpress.com/2024/03/image-1.png)

Chính vì vậy các bạn hãy nhớ 1 nguyên tắc: khi khai báo biến `@KeyWhere` dạng `NVARCHAR(4000)` thì luôn luôn gán giá trị mặc định là `N'1=1'`, và khi nào muốn reset (khởi tạo lại biến) thì cũng gán giá trị là `N'1=1'`. Ở điều kiện `WHERE` sẽ luôn luôn để biến `@KeyWhere` nằm ngay sau điều kiện `WHERE` trong khi thực hiện exec chuỗi trong StoredProcedure — `WHERE ' + @KeyWhere + ...` — sẽ tránh được lỗi trên.

```sql
DECLARE @KeyWhere NVARCHAR(4000) = N'1=1', @_StrExec NVARCHAR(max)
SET @_StrExec = N'SELECT *  
				FROM B00ReportTmp WHERE ' + @KeyWhere 
	EXECUTE sp_ExecuteSql @_StrExec;
```

## Một số lỗi cơ bản khác cũng thường gặp khi viết Stored Procedure

Ngoài các lỗi ở trên, dưới đây là vài lỗi phổ biến khác nên lưu ý:

### 4. Quên `SET NOCOUNT ON`

Mặc định SQL Server sẽ trả về thông báo số dòng bị ảnh hưởng (`(n row(s) affected)`) sau mỗi câu lệnh `INSERT`/`UPDATE`/`DELETE`. Nếu Stored Procedure có nhiều câu lệnh, các thông báo này có thể làm chậm quá trình thực thi (do phải gửi message qua network) và gây nhiễu kết quả trả về ở phía client. Nên thêm ngay đầu Stored Procedure:

```sql
SET NOCOUNT ON;
```

### 5. Dùng chuỗi động (Dynamic SQL) nhưng không tham số hóa — nguy cơ SQL Injection

Khi ghép chuỗi điều kiện `WHERE` động như ví dụ ở mục 3, nếu giá trị lấy trực tiếp từ input người dùng mà không qua tham số hóa, hệ thống có nguy cơ bị **SQL Injection**. Nên ưu tiên dùng `sp_executesql` với tham số thay vì ghép chuỗi trực tiếp giá trị:

```sql
DECLARE @Sql NVARCHAR(4000) = N'SELECT * FROM Customer WHERE CustomerID = @CustID'
EXECUTE sp_executesql @Sql, N'@CustID INT', @CustID = @InputCustID
```

### 6. Không xử lý lỗi bằng TRY/CATCH

Nhiều Stored Procedure không bọc `TRY...CATCH`, khi có lỗi xảy ra giữa chừng (đặc biệt với transaction) rất dễ để dữ liệu ở trạng thái không nhất quán. Nên có cấu trúc xử lý lỗi cơ bản:

```sql
BEGIN TRY
    BEGIN TRANSACTION;
    -- các câu lệnh xử lý dữ liệu
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
```

### 7. Parameter Sniffing gây chậm bất thường

Đôi khi Stored Procedure chạy nhanh với tham số này nhưng lại rất chậm với tham số khác, dù logic không đổi — đây là hiện tượng **Parameter Sniffing**: SQL Server cache execution plan dựa trên giá trị tham số của lần gọi đầu tiên, plan đó có thể không tối ưu cho các giá trị tham số khác. Có thể khắc phục bằng `OPTION (RECOMPILE)`, dùng biến local trung gian, hoặc `OPTION (OPTIMIZE FOR UNKNOWN)` tùy tình huống cụ thể.

### 8. Không kiểm tra tham số đầu vào trước khi xử lý

Nên có bước validate tham số đầu vào ở đầu Stored Procedure (kiểm tra `NULL`, kiểm tra tồn tại dữ liệu liên quan, kiểm tra kiểu dữ liệu hợp lệ...) thay vì để lỗi phát sinh ở giữa logic xử lý, vừa khó debug vừa dễ để dữ liệu sai lệch trước khi phát hiện lỗi.

<p align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>
