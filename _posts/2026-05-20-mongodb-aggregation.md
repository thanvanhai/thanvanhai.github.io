---
title: "MongoDB Aggregation Pipeline: Xử lý dữ liệu phức tạp"
date: 2026-05-20 09:00:00 +0700
categories: [Database, MongoDB]
tags: [mongodb, aggregation, nosql, pipeline, query]
author: haicoi
---

## Aggregation Pipeline là gì?

Thay vì viết 1 câu SQL dài, MongoDB Aggregation dùng **pipeline** — chuỗi các stage xử lý dữ liệu tuần tự, output của stage này là input của stage tiếp theo.

```
Collection → [$match] → [$group] → [$sort] → [$project] → Result
```

## Ví dụ thực tế: báo cáo doanh số theo danh mục

```javascript
db.orders.aggregate([
  // Stage 1: Lọc đơn hàng trong kỳ
  {
    $match: {
      orderDate: {
        $gte: ISODate("2026-01-01"),
        $lt:  ISODate("2026-07-01")
      },
      status: "completed"
    }
  },

  // Stage 2: Unwind items array (1 order → nhiều item rows)
  { $unwind: "$items" },

  // Stage 3: Tổng hợp theo danh mục
  {
    $group: {
      _id: "$items.category",
      totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
      totalOrders:  { $sum: 1 },
      avgOrderValue: { $avg: { $multiply: ["$items.price", "$items.qty"] } }
    }
  },

  // Stage 4: Sắp xếp theo doanh thu giảm dần
  { $sort: { totalRevenue: -1 } },

  // Stage 5: Format output
  {
    $project: {
      _id: 0,
      category: "$_id",
      totalRevenue: { $round: ["$totalRevenue", 2] },
      totalOrders: 1,
      avgOrderValue: { $round: ["$avgOrderValue", 2] }
    }
  }
])
```

## $lookup — JOIN với collection khác

```javascript
db.jobs.aggregate([
  { $match: { status: "closed" } },

  // Join với transactions (tương đương LEFT JOIN trong SQL)
  {
    $lookup: {
      from: "transactions",
      localField: "_id",
      foreignField: "jobId",
      as: "txns"
    }
  },

  // Tính tổng chi phí từ transactions
  {
    $addFields: {
      totalCost: { $sum: "$txns.amount" },
      txnCount:  { $size: "$txns" }
    }
  },

  // Không cần giữ mảng txns đầy đủ trong kết quả
  { $project: { txns: 0 } }
])
```

## $facet — Nhiều aggregation song song

```javascript
// Chạy nhiều aggregation cùng lúc — 1 lần scan collection
db.products.aggregate([
  {
    $facet: {
      // Facet 1: Thống kê theo danh mục
      byCategory: [
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ],

      // Facet 2: Phân phối giá
      priceStats: [
        {
          $group: {
            _id: null,
            min: { $min: "$price" },
            max: { $max: "$price" },
            avg: { $avg: "$price" }
          }
        }
      ],

      // Facet 3: Tổng số và tổng giá trị
      summary: [
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalValue:    { $sum: "$price" }
          }
        }
      ]
    }
  }
])
```

## $bucket — Phân nhóm theo khoảng giá trị

```javascript
db.transactions.aggregate([
  {
    $bucket: {
      groupBy: "$amount",
      boundaries: [0, 100, 500, 1000, 5000, 10000],
      default: "Over 10000",
      output: {
        count: { $sum: 1 },
        total: { $sum: "$amount" }
      }
    }
  }
])
// Output: { _id: 0, count: 45, total: 2300 },
//         { _id: 100, count: 120, total: 38500 }, ...
```

## Tối ưu Pipeline — thứ tự stage quan trọng

```javascript
// ❌ KÉM: $match sau $group — group toàn bộ rồi mới lọc
db.orders.aggregate([
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $match: { total: { $gt: 1000 } } }
])

// ✅ TỐT HƠN: $match sớm để giảm số document xử lý
db.orders.aggregate([
  { $match: { status: "completed", year: 2026 } },  // giảm data trước
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $match: { total: { $gt: 1000 } } }
])
```

**Quy tắc vàng**: Đặt `$match` và `$limit` càng sớm càng tốt trong pipeline.

## Explain Plan cho Aggregation

```javascript
db.orders.explain("executionStats").aggregate([
  { $match: { orderDate: { $gte: ISODate("2026-01-01") } } },
  { $group: { _id: "$category", total: { $sum: "$amount" } } }
])
// Xem nScanRows, nReturned để đánh giá hiệu quả
```

## Kết luận

MongoDB Aggregation Pipeline rất mạnh cho analytics và reporting. Điểm khác biệt so với SQL là bạn tư duy theo luồng xử lý dữ liệu (pipeline stages) thay vì khai báo kết quả mong muốn — linh hoạt hơn nhưng cần nắm rõ thứ tự các stage để tối ưu.
