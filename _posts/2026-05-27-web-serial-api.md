---
title: "Web Serial API: Kết nối phần cứng qua trình duyệt"
date: 2026-05-27 09:00:00 +0700
categories: [Lập trình, JavaScript]
tags: [javascript, web-api, iot, hardware, serial]
author: haicoi
---

## Giới thiệu

**Web Serial API** là một Web API hiện đại cho phép các ứng dụng web giao tiếp trực tiếp với thiết bị phần cứng qua cổng serial (COM port) — ngay trên trình duyệt, không cần cài thêm driver hay phần mềm trung gian.

API này đặc biệt hữu ích cho các dự án IoT, thiết bị nhúng (Arduino, ESP32...), hoặc bất kỳ thiết bị nào giao tiếp qua chuẩn RS-232/USB-to-Serial.

> **Lưu ý trình duyệt hỗ trợ**: Chrome 89+, Edge 89+, Opera 75+. Firefox và Safari hiện chưa hỗ trợ.

## Ví dụ kết nối cơ bản

### Bước 1 — Yêu cầu quyền truy cập cổng serial

```javascript
// Người dùng phải click để kích hoạt (user gesture requirement)
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 9600 });
```

### Bước 2 — Đọc dữ liệu từ thiết bị

```javascript
const reader = port.readable.getReader();

try {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    // value là Uint8Array
    const text = new TextDecoder().decode(value);
    console.log('Nhận được:', text);
  }
} finally {
  reader.releaseLock();
}
```

### Bước 3 — Ghi dữ liệu ra thiết bị

```javascript
const writer = port.writable.getWriter();
const data = new TextEncoder().encode('AT+RST\r\n');
await writer.write(data);
writer.releaseLock();
```

### Bước 4 — Đóng kết nối

```javascript
await port.close();
```

## Ví dụ thực tế: đọc cảm biến nhiệt độ

Giả sử Arduino gửi dữ liệu nhiệt độ mỗi giây theo định dạng `TEMP:25.3\n`:

```javascript
async function connectAndRead() {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  const decoder = new TextDecoderStream();
  port.readable.pipeTo(decoder.writable);

  const reader = decoder.readable.getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // giữ lại phần chưa hoàn chỉnh

    for (const line of lines) {
      if (line.startsWith('TEMP:')) {
        const temp = parseFloat(line.slice(5));
        document.getElementById('temperature').textContent = `${temp} °C`;
      }
    }
  }
}
```

## Xử lý lỗi và kết nối lại

```javascript
port.addEventListener('disconnect', () => {
  console.log('Thiết bị đã ngắt kết nối');
  // Tự động kết nối lại hoặc thông báo người dùng
});

// Lấy danh sách cổng đã được cấp quyền trước đó
const ports = await navigator.serial.getPorts();
if (ports.length > 0) {
  // Kết nối lại tự động với thiết bị đã biết
  await ports[0].open({ baudRate: 9600 });
}
```

## Ứng dụng thực tế

Web Serial API phù hợp cho:

- **Màn hình giám sát IoT** — hiển thị dữ liệu cảm biến realtime trên web
- **Công cụ debug firmware** — gửi lệnh AT, đọc log từ module
- **Máy POS / Barcode scanner** — nhận dữ liệu từ thiết bị COM
- **Thiết bị y tế / công nghiệp** — đọc số liệu từ thiết bị có cổng RS-232

## Kết luận

Web Serial API mở ra khả năng xây dựng ứng dụng phần cứng hoàn toàn trên trình duyệt mà không cần backend. Kết hợp với WebUSB và WebBluetooth, đây là nền tảng mạnh cho các dự án IoT hiện đại.
