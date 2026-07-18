---
title: "LINQ trong C# 12: Từ cơ bản đến thực chiến với EF Core"
date: 2026-05-01 09:00:00 +0700
categories: [Lập trình, C#]
tags: [csharp, linq, dotnet, entity-framework, sql]
author: haicoi
---

## LINQ là gì?

**LINQ** (Language Integrated Query) là tính năng cho phép viết câu truy vấn trực tiếp trong C# — nhất quán dù nguồn dữ liệu là collection, database, XML, hay JSON.

## Cú pháp cơ bản

### Query syntax (giống SQL)

```csharp
var result = from p in products
             where p.Category == "ERP" && p.Price > 100
             orderby p.Price descending
             select new { p.Name, p.Price };
```

### Method syntax (fluent)

```csharp
var result = products
    .Where(p => p.Category == "ERP" && p.Price > 100)
    .OrderByDescending(p => p.Price)
    .Select(p => new { p.Name, p.Price });
```

## Các operator thường dùng

```csharp
// GroupBy — tổng doanh thu theo danh mục
var byCategory = orders
    .GroupBy(o => o.Category)
    .Select(g => new {
        Category = g.Key,
        Total = g.Sum(o => o.Amount),
        Count = g.Count()
    });

// Join — nối 2 collection
var orderWithCustomer = orders.Join(
    customers,
    o => o.CustomerId,
    c => c.Id,
    (o, c) => new { o.OrderDate, c.Name, o.Amount }
);

// SelectMany — flatten nested collection
var allItems = orders.SelectMany(o => o.Items);

// Aggregate — tính tích lũy tùy chỉnh
var runningTotal = amounts.Aggregate(
    (decimal)0,
    (acc, current) => acc + current
);
```

## LINQ với Entity Framework Core

```csharp
// EF Core dịch LINQ thành SQL tự động
var report = await dbContext.Jobs
    .Where(j => j.Status == JobStatus.Closed
             && j.ClosedDate >= startDate
             && j.ClosedDate <= endDate)
    .Include(j => j.Transactions)
    .Select(j => new JobCostReport {
        JobNumber = j.Number,
        ItemCode = j.ItemCode,
        // Lấy giá từ transaction, KHÔNG từ item master (tránh bẫy current cost)
        UnitCost = j.Transactions
            .Where(t => t.Type == TransactionType.Material)
            .Sum(t => t.Amount) / j.Quantity,
        ClosedDate = j.ClosedDate
    })
    .OrderBy(r => r.ClosedDate)
    .ToListAsync();
```

## C# 12 — Primary Constructors giảm boilerplate

```csharp
// Trước C# 12 — verbose
public class OrderService
{
    private readonly IOrderRepository _repo;
    private readonly IMapper _mapper;

    public OrderService(IOrderRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }
}

// C# 12 — primary constructor
public class OrderService(IOrderRepository repo, IMapper mapper)
{
    public async Task<OrderDto> GetAsync(int id) =>
        _mapper.Map<OrderDto>(await repo.FindAsync(id));
}
```

## Tránh N+1 query với LINQ + EF Core

```csharp
// ❌ N+1: mỗi order lại gọi thêm 1 query lấy customer
var orders = await dbContext.Orders.ToListAsync();
foreach (var order in orders)
{
    var customer = await dbContext.Customers.FindAsync(order.CustomerId);
}

// ✅ 1 query với Include
var orders = await dbContext.Orders
    .Include(o => o.Customer)
    .ToListAsync();

// ✅ Hoặc projection (tốt hơn nếu chỉ cần 1 số cột)
var orders = await dbContext.Orders
    .Select(o => new { o.Id, CustomerName = o.Customer.Name, o.Amount })
    .ToListAsync();
```

## Kết luận

LINQ là một trong những tính năng mạnh nhất của C# — giúp viết code truy vấn dữ liệu rõ ràng, type-safe, và dễ maintain. Kết hợp với EF Core, bạn có thể viết phần lớn database logic bằng C# mà không cần viết SQL thủ công.
