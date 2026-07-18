---
title: "Spring Boot 3 với Virtual Threads: Viết async code như sync"
date: 2026-06-01 09:00:00 +0700
categories: [Lập trình, Java]
tags: [java, spring-boot, virtual-threads, async, microservice]
author: haicoi
---

## Giới thiệu

Java 21 LTS giới thiệu **Virtual Threads** (Project Loom) như một tính năng chính thức. Khi kết hợp với Spring Boot 3.2+, chúng ta có thể viết code xử lý concurrent requests trông giống như code đồng bộ thông thường — mà hiệu năng vẫn ngang ngửa reactive.

## Virtual Threads là gì?

Virtual threads là các lightweight thread được JVM quản lý, không map 1-1 với OS thread. Bạn có thể tạo hàng triệu virtual threads mà không lo hết tài nguyên hệ thống.

```java
// Tạo virtual thread thủ công
Thread vt = Thread.ofVirtual().start(() -> {
    System.out.println("Virtual thread: " + Thread.currentThread());
});
```

## Bật Virtual Threads trong Spring Boot 3.2+

Chỉ cần thêm 1 dòng vào `application.properties`:

```properties
spring.threads.virtual.enabled=true
```

Hoặc cấu hình tường minh trong Java config:

```java
@Configuration
public class ThreadConfig {
    @Bean
    public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
        return protocolHandler -> {
            protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        };
    }
}
```

## Ví dụ: REST controller với blocking I/O

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final InventoryClient inventoryClient;

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetail> getOrder(@PathVariable Long id) {
        // Các lời gọi blocking này an toàn khi chạy trên virtual thread
        // JVM sẽ unmount virtual thread khi gặp blocking I/O
        Order order = orderService.findById(id);              // DB query
        Inventory inv = inventoryClient.getStock(order.getItemId()); // HTTP call

        return ResponseEntity.ok(OrderDetail.from(order, inv));
    }
}
```

Với Platform Threads truyền thống, mỗi blocking call giữ chặt 1 OS thread. Với Virtual Threads, JVM tự unmount thread khi gặp blocking I/O và mount lại khi có dữ liệu — giải phóng OS thread cho request khác.

## Benchmark nhanh: Platform Thread vs Virtual Thread

| Scenario | Platform Thread (200 threads) | Virtual Thread |
|---|---|---|
| 1000 concurrent requests (100ms latency mỗi request) | ~5s total | ~1.1s total |
| Memory per thread | ~1MB stack | ~few KB |
| Throughput (req/s) | ~200 | ~900 |

*Kết quả thực tế phụ thuộc vào workload cụ thể.*

## Lưu ý quan trọng

```java
// ⚠️ TRÁNH synchronized block với virtual threads
// Synchronized có thể "pin" virtual thread vào OS thread, làm mất lợi thế

// KHÔNG nên:
synchronized (lock) {
    // blocking I/O ở đây sẽ pin OS thread
    Thread.sleep(100);
}

// NÊN dùng ReentrantLock thay thế:
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    Thread.sleep(100); // virtual thread unmount được khi sleep
} finally {
    lock.unlock();
}
```

## Kết luận

Virtual Threads + Spring Boot 3 là sự kết hợp lý tưởng cho ứng dụng I/O-bound (phần lớn các web service). Bạn giữ được lối viết code imperative quen thuộc, tận dụng toàn bộ ecosystem Java/Spring, mà không cần học reactive programming.
