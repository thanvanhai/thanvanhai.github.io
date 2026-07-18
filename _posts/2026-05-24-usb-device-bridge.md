---
title: "USB Device Bridge: Kết nối USB an toàn từ trình duyệt"
date: 2026-05-24 09:00:00 +0700
categories: [Lập trình, JavaScript]
tags: [javascript, usb, hardware, webusb, browser]
author: haicoi
---

## Giới thiệu

**WebUSB API** cho phép trang web giao tiếp trực tiếp với thiết bị USB mà không cần driver riêng, tương tự như Web Serial API nhưng ở tầng USB thấp hơn.

## Kết nối thiết bị USB

```javascript
// Yêu cầu quyền truy cập thiết bị USB
const device = await navigator.usb.requestDevice({
  filters: [{ vendorId: 0x2341 }]  // 0x2341 = Arduino
});

await device.open();
await device.selectConfiguration(1);
await device.claimInterface(0);
```

## Gửi và nhận dữ liệu

```javascript
// Gửi dữ liệu tới endpoint OUT
const data = new Uint8Array([0x01, 0x02, 0x03]);
await device.transferOut(1, data);

// Nhận dữ liệu từ endpoint IN
const result = await device.transferIn(1, 64);  // 64 byte
console.log('Dữ liệu nhận:', result.data);
```

## So sánh WebUSB và Web Serial

| Tiêu chí | WebUSB | Web Serial |
|---|---|---|
| Tầng giao tiếp | USB raw | Serial (COM port) |
| Yêu cầu firmware | Cần hỗ trợ WebUSB | Giao tiếp qua USB-to-Serial |
| Độ phức tạp | Cao hơn | Đơn giản hơn |
| Tốc độ | Nhanh hơn | Đủ dùng cho IoT |
| Thiết bị phổ biến | Custom USB device | Arduino, ESP32, module 4G... |

## Ứng dụng thực tế

USB Device Bridge phù hợp khi bạn muốn xây dựng ứng dụng web quản lý thiết bị USB tùy chỉnh — ví dụ: đầu đọc thẻ từ, máy chấm công, thiết bị đo lường công nghiệp.
