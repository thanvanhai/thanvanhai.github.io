---
title: "SQL Server Indexing: Tại sao query chậm và cách sửa"
date: 2026-07-10 09:00:00 +0700
categories: [Database, SQL Server]
tags: [sql-server, indexing, query-tuning, performance, t-sql]
author: haicoi
---

## Vấn đề thực tế

Query đang chạy 30 giây, nhưng bảng chỉ có 500k rows. Bước đầu tiên không phải "thêm hardware" — mà là **xem Execution Plan** để hiểu SQL Server đang làm gì.

## Các loại index trong SQL Server

### Clustered Index

Dữ liệu vật lý được sắp xếp theo thứ tự của clustered index. Mỗi bảng chỉ có **tối đa 1** clustered index.

```sql
-- Thường đặt trên Primary Key
CREATE CLUSTERED INDEX IX_Jobs_JobId 
ON Jobs(JobId);

-- Hoặc trên cột hay range-scan nhất
CREATE CLUSTERED INDEX IX_Transactions_Date
ON Transactions(TransactionDate);
```

### Non-Clustered Index

Cấu trúc riêng biệt, chứa key columns + pointer tới data row.

```sql
CREATE NONCLUSTERED INDEX IX_Jobs_ItemId_Status
ON Jobs(ItemId, Status)
INCLUDE (JobNumber, ClosedDate, Quantity);
-- INCLUDE: thêm cột vào "leaf level" để tránh Key Lookup
```

## Đọc Execution Plan — 3 dấu hiệu nguy hiểm

### 1. Table Scan / Clustered Index Scan

Dấu hiệu SQL Server đọc toàn bộ bảng — không dùng index nào cả.

```sql
-- Query này sẽ scan nếu ItemId không có index
SELECT * FROM Jobs WHERE ItemId = 'ITEM-001';

-- Thêm index để chuyển sang Index Seek
CREATE INDEX IX_Jobs_ItemId ON Jobs(ItemId);
```

### 2. Key Lookup

SQL tìm được row qua index, nhưng phải quay lại clustered index để lấy thêm cột. Tốn gấp đôi I/O.

```sql
-- Query gây Key Lookup nếu index không INCLUDE đủ cột
SELECT JobNumber, ClosedDate  -- 2 cột này không có trong index
FROM Jobs
WHERE ItemId = 'ITEM-001';

-- Fix: thêm INCLUDE
CREATE INDEX IX_Jobs_ItemId 
ON Jobs(ItemId)
INCLUDE (JobNumber, ClosedDate);
```

### 3. Hash Match / Sort (với Cost cao)

Thường xuất hiện khi thiếu index hỗ trợ JOIN hoặc ORDER BY.

## Missing Index — SQL Server tự gợi ý

```sql
-- SQL Server gợi ý index còn thiếu ngay trong Execution Plan
-- Hoặc query DMV:
SELECT 
    mid.statement AS TableName,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns,
    migs.avg_user_impact AS PercentImprovement
FROM sys.dm_db_missing_index_details mid
JOIN sys.dm_db_missing_index_groups mig 
    ON mid.index_handle = mig.index_handle
JOIN sys.dm_db_missing_index_group_stats migs 
    ON mig.index_group_handle = migs.group_handle
WHERE migs.avg_user_impact > 30   -- Chỉ xem gợi ý cải thiện > 30%
ORDER BY migs.avg_user_impact DESC;
```

## Index cho truy vấn theo khoảng thời gian (Range Query)

Pattern phổ biến nhất trong báo cáo ERP:

```sql
-- Query báo cáo theo khoảng ngày
SELECT j.JobNumber, SUM(t.Amount) AS TotalCost
FROM Jobs j
JOIN Transactions t ON t.JobId = j.JobId
WHERE t.TransactionDate BETWEEN '2026-01-01' AND '2026-03-31'
  AND j.Status = 'Closed'
GROUP BY j.JobNumber;

-- Index hỗ trợ
CREATE INDEX IX_Transactions_Date_JobId
ON Transactions(TransactionDate, JobId)
INCLUDE (Amount);

CREATE INDEX IX_Jobs_Status_JobId
ON Jobs(Status)
INCLUDE (JobNumber);
```

## Index Fragmentation — vệ sinh định kỳ

```sql
-- Kiểm tra fragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.avg_fragmentation_in_percent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i ON i.object_id = ips.object_id AND i.index_id = ips.index_id
WHERE ips.avg_fragmentation_in_percent > 10
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- < 30%: REORGANIZE (online, ít lock)
ALTER INDEX IX_Transactions_Date_JobId ON Transactions REORGANIZE;

-- > 30%: REBUILD (hiệu quả hơn nhưng lock table lâu hơn)
ALTER INDEX IX_Transactions_Date_JobId ON Transactions REBUILD;
```

## Checklist trước khi thêm index

- [ ] Xem Execution Plan trước — hiểu đúng vấn đề
- [ ] Kiểm tra Missing Index gợi ý
- [ ] Xem Existing Indexes — tránh duplicate
- [ ] Cân nhắc INCLUDE columns để tránh Key Lookup
- [ ] Test trên staging trước khi apply production
- [ ] Index tốt cho SELECT nhưng làm chậm INSERT/UPDATE/DELETE — cân bằng phù hợp

## Kết luận

Index đúng chỗ có thể giảm query từ 30 giây xuống dưới 1 giây mà không cần thay đổi logic ứng dụng. Execution Plan là công cụ đầu tiên và hiệu quả nhất để chẩn đoán vấn đề hiệu năng trong SQL Server.
