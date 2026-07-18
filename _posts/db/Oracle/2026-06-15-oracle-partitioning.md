---
title: "Oracle Partitioning: Chia nhỏ bảng lớn để tăng tốc query"
date: 2026-06-15 09:00:00 +0700
categories: [Database, Oracle]
tags: [oracle, partitioning, performance, sql, dba]
author: haicoi
---

## Tại sao cần Partitioning?

Khi bảng transaction lên đến hàng chục triệu hoặc hàng tỷ rows, query sẽ chậm dù đã có index. Partitioning cho phép Oracle chia bảng thành nhiều phân đoạn vật lý — query chỉ cần đọc phân đoạn liên quan (**Partition Pruning**), bỏ qua phần còn lại.

## Range Partitioning theo ngày — phổ biến nhất

```sql
-- Tạo bảng transaction chia theo quý
CREATE TABLE wip_transactions (
    transaction_id   NUMBER NOT NULL,
    job_id           NUMBER NOT NULL,
    item_id          NUMBER NOT NULL,
    transaction_date DATE   NOT NULL,
    unit_cost        NUMBER,
    quantity         NUMBER,
    amount           NUMBER
)
PARTITION BY RANGE (transaction_date) (
    PARTITION p_2025_q1 VALUES LESS THAN (DATE '2025-04-01'),
    PARTITION p_2025_q2 VALUES LESS THAN (DATE '2025-07-01'),
    PARTITION p_2025_q3 VALUES LESS THAN (DATE '2025-10-01'),
    PARTITION p_2025_q4 VALUES LESS THAN (DATE '2026-01-01'),
    PARTITION p_2026_q1 VALUES LESS THAN (DATE '2026-04-01'),
    PARTITION p_2026_q2 VALUES LESS THAN (DATE '2026-07-01'),
    PARTITION p_future  VALUES LESS THAN (MAXVALUE)
);
```

### Tự động thêm partition (Interval Partitioning — Oracle 11g+)

```sql
-- Tự động tạo partition mới theo từng tháng
CREATE TABLE wip_transactions (
    transaction_id   NUMBER NOT NULL,
    transaction_date DATE   NOT NULL,
    amount           NUMBER
)
PARTITION BY RANGE (transaction_date)
INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'))
(
    PARTITION p_init VALUES LESS THAN (DATE '2025-01-01')
);
-- Oracle tự tạo partition SYS_P... khi có data insert vào tháng mới
```

## List Partitioning theo tổ chức (Org)

```sql
CREATE TABLE inventory_transactions (
    transaction_id  NUMBER,
    organization_id NUMBER,
    item_id         NUMBER,
    quantity        NUMBER
)
PARTITION BY LIST (organization_id) (
    PARTITION p_org_101 VALUES (101),
    PARTITION p_org_102 VALUES (102),
    PARTITION p_org_103 VALUES (103),
    PARTITION p_others  VALUES (DEFAULT)
);
```

## Composite Partitioning — kết hợp 2 tiêu chí

```sql
-- Range by date, subpartition by organization
CREATE TABLE cost_transactions (
    txn_id          NUMBER,
    org_id          NUMBER,
    txn_date        DATE,
    amount          NUMBER
)
PARTITION BY RANGE (txn_date)
SUBPARTITION BY LIST (org_id)
SUBPARTITION TEMPLATE (
    SUBPARTITION sp_org_101 VALUES (101),
    SUBPARTITION sp_org_102 VALUES (102),
    SUBPARTITION sp_others  VALUES (DEFAULT)
)
(
    PARTITION p_2026_q1 VALUES LESS THAN (DATE '2026-04-01'),
    PARTITION p_2026_q2 VALUES LESS THAN (DATE '2026-07-01')
);
```

## Xác minh Partition Pruning có hoạt động không

```sql
-- EXPLAIN PLAN để kiểm tra
EXPLAIN PLAN FOR
SELECT SUM(amount)
FROM wip_transactions
WHERE transaction_date BETWEEN DATE '2026-04-01' AND DATE '2026-06-30';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

Trong execution plan, tìm dòng:
```
Pstart | Pstop
  5    |   5     ← Chỉ đọc 1 partition (p_2026_q2)
```

Nếu thấy `KEY` hoặc `1..N` → query đang scan nhiều partition hơn cần thiết.

## Quản lý Partition: thêm, xóa, split

```sql
-- Thêm partition mới cho Q3 2026
ALTER TABLE wip_transactions
ADD PARTITION p_2026_q3 VALUES LESS THAN (DATE '2026-10-01');

-- Xóa partition cũ (drop data luôn — nhanh hơn DELETE rất nhiều)
ALTER TABLE wip_transactions DROP PARTITION p_2025_q1;

-- Split partition thành 2 (khi partition quá lớn)
ALTER TABLE wip_transactions
SPLIT PARTITION p_future AT (DATE '2026-10-01')
INTO (PARTITION p_2026_q3, PARTITION p_future);
```

## Local Index — index trên từng partition

```sql
-- Local index: mỗi partition có index riêng
-- Partition pruning áp dụng được cho cả index scan
CREATE INDEX IX_wip_txn_job_date
ON wip_transactions(job_id, transaction_date)
LOCAL;  -- <-- keyword LOCAL
```

## Kết luận

Partitioning là vũ khí mạnh nhất khi làm việc với bảng ERP lớn. Với Oracle EBS, các bảng như `WIP_TRANSACTION_ACCOUNTING_LINES`, `MTL_MATERIAL_TRANSACTIONS` thường được partition theo `ORGANIZATION_ID` hoặc `TRANSACTION_DATE` để đảm bảo hiệu năng báo cáo.
