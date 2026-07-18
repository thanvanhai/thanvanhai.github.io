---
title: "Web Serial API: Kết nối RFID/Barcode trực tiếp từ trình duyệt"
date: 2026-07-18 09:00:00 +0700
categories: [Lập trình, JavaScript]
tags: [javascript, web-serial-api, hardware, rfid, barcode, automation]
---

## Giới thiệu

**Web Serial API** là một Web API hiện đại cho phép các ứng dụng web giao tiếp trực tiếp với thiết bị phần cứng qua cổng serial (COM port) — ngay trên trình duyệt, không cần cài thêm driver hay phần mềm trung gian.

API này đặc biệt hữu ích cho các dự án IoT, thiết bị nhúng (Arduino, ESP32...), hoặc bất kỳ thiết bị nào giao tiếp qua chuẩn RS-232/USB-to-Serial.

> **Lưu ý trình duyệt hỗ trợ**: Chrome 89+, Edge 89+, Opera 75+. Firefox và Safari hiện chưa hỗ trợ.

## Mở đầu — Khi WinForm không còn đủ nữa

Nếu bạn đã từng viết ứng dụng WinForm để đọc thẻ RFID hoặc quét barcode, chắc bạn quen với đoạn code này:

```csharp
// WinForm — C#
var port = new SerialPort("COM3", 9600, Parity.None, 8, StopBits.One);
port.DataReceived += (s, e) => {
    string data = port.ReadLine();
    // xử lý dữ liệu...
};
port.Open();
```

Đơn giản, trực tiếp. Nhưng khi chuyển sang Web App, câu hỏi đầu tiên ai cũng hỏi là: **"Browser làm sao đọc được COM port?"**

Câu trả lời là **Web Serial API** — một Web API hiện đại cho phép browser giao tiếp trực tiếp với thiết bị serial (COM port) mà không cần cài thêm phần mềm trung gian hay extension.

## So sánh WinForm vs Web Serial API

Trước khi đi vào chi tiết, hãy xem hai cách tiếp cận khác nhau như thế nào — đây là điểm tham chiếu hữu ích nhất cho các bạn đến từ nền tảng desktop:

|  | WinForm (C#) | Web Serial API (JS) |
|---|---|---|
| Khai báo port | `new SerialPort("COM3", 9600)` | `navigator.serial.requestPort()` |
| Mở kết nối | `port.Open()` | `await port.open({ baudRate: 9600 })` |
| Đọc dữ liệu | Event `DataReceived` | `ReadableStream` reader |
| Parse dữ liệu (COM) | Tự ghép buffer, dùng `ReadLine()` cho tiện | Tự ghép buffer + split `\r\n` thủ công |
| Parse dữ liệu (USB HID) | Hệ thống tự ghép, nhận 1 lần = 1 bản tin | Không áp dụng — USB HID không qua Web Serial API |
| Đóng kết nối | `port.Close()` | `await reader.cancel()` + `await port.close()` |
| Deploy | Cài app trên từng máy | Chỉ cần mở browser |
| Giới hạn | Windows only | Chrome/Edge only |

**Web Serial API là gì?** Web Serial API là một API của trình duyệt cho phép JavaScript đọc/ghi dữ liệu từ cổng serial (COM port, USB-to-Serial). Nó được chuẩn hóa bởi W3C và hiện hỗ trợ trên **Chrome 89+** và **Edge 89+**.

Điểm quan trọng cần biết trước:

| Yếu tố | Chi tiết |
|---|---|
| Trình duyệt hỗ trợ | Chrome 89+, Edge 89+ (Firefox chưa hỗ trợ) |
| Giao thức | HTTPS hoặc `localhost` |
| Yêu cầu | Cần user nhấn button để mở dialog chọn port (không thể tự động) |
| Hệ điều hành | Windows, macOS, Linux |

> **Lưu ý quan trọng:** Trang web phải chạy trên `https://` hoặc `localhost`. Nếu bạn deploy lên HTTP thường, `navigator.serial` sẽ là `undefined`.

### HTTPS và môi trường dev — bẫy hay gặp

Trong môi trường development, `localhost` được coi là "secure context" nên hoạt động bình thường. Tuy nhiên nếu bạn test bằng **địa chỉ IP nội bộ** (`http://192.168.1.10:3000`) thì `navigator.serial` sẽ là `undefined` — dù bạn đang test trong mạng LAN của mình.

Cách xử lý:

| Tình huống | Giải pháp |
|---|---|
| Dev trên máy cục bộ | Dùng `http://localhost` — luôn hoạt động |
| Test trên máy khác trong LAN | Dùng `https://` với self-signed certificate, hoặc dùng `ngrok` |
| Production | Deploy lên `https://` — bắt buộc |

## RFID và Barcode — Tại sao xử lý giống nhau?

Đây là điểm thú vị mà nhiều người không để ý:

- **Đầu đọc RFID** kết nối qua COM port → gửi mã thẻ dưới dạng chuỗi ký tự → kết thúc bằng `\r\n`
- **Barcode scanner** kết nối qua COM port → gửi mã vạch dưới dạng chuỗi ký tự → kết thúc bằng `\r\n`

Cả hai đều dùng cùng baud rate (thường 9600), cùng cấu hình serial (8N1), cùng cách parse dữ liệu. **Code xử lý hoàn toàn giống nhau**, chỉ khác ở nghiệp vụ sau khi nhận được chuỗi.

So sánh nhanh:

| Thiết bị | Dữ liệu nhận | Ví dụ |
|---|---|---|
| RFID Reader | Mã thẻ | `A1B2C3D4\r\n` |
| Barcode Scanner | Mã vạch | `8935049100015\r\n` |

## Triển khai thực tế — 4 bước

### Bước 1: Kiểm tra hỗ trợ và kết nối COM port

```javascript
// Biến lưu trạng thái kết nối
let serialPort   = null;  // handle của Web Serial port
let serialReader = null;  // ReadableStream reader
let isReading    = false; // flag kiểm soát vòng lặp đọc
let rfidBuffer   = '';    // buffer tích lũy dữ liệu chưa đủ 1 dòng

async function connectCom() {
  // Kiểm tra browser có hỗ trợ không
  if (!navigator.serial) {
    alert('Trình duyệt không hỗ trợ Web Serial API. Vui lòng dùng Chrome hoặc Edge 89+.');
    return;
  }

  try {
    // Mở dialog cho user chọn COM port
    // → Đây là bước BẮT BUỘC phải có user gesture (click button)
    serialPort = await navigator.serial.requestPort();

    // Mở port với cấu hình 9600 baud, 8N1
    // Đây là cấu hình mặc định của hầu hết RFID reader và barcode scanner
    // Nếu thiết bị của bạn dùng baud rate khác (115200 phổ biến với RFID mới hơn),
    // hãy đọc manual thiết bị và thay đổi giá trị này
    await serialPort.open({
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    console.log('Đã kết nối COM port');
    updateUI(true); // cập nhật giao diện

    // Khởi động vòng đọc dữ liệu
    rfidBuffer = '';
    isReading  = true;
    startReading();

  } catch (err) {
    // NotFoundError = user đóng dialog mà không chọn → bỏ qua
    if (err.name !== 'NotFoundError') {
      console.error('Không thể mở COM port:', err.message);
      alert('Lỗi kết nối: ' + err.message);
    }
  }
}
```

**Tại sao cần user gesture?** Vì lý do bảo mật, browser không cho phép tự động kết nối thiết bị. User phải chủ động nhấn button → dialog hiện ra → chọn port. Điều này giống như việc browser hỏi quyền truy cập camera/microphone.

### Bước 2: Vòng lặp đọc dữ liệu

Cũng giống WinForm khi đọc COM port, Web Serial API nhận dữ liệu dạng stream theo từng chunk — bạn vẫn phải tự ghép buffer. Điểm khác duy nhất là .NET có sẵn `ReadLine()` lo việc này giúp bạn, còn JavaScript thì phải tự viết. Nếu thiết bị kết nối qua **USB HID** (chế độ bàn phím), thì cả WinForm lẫn Web đều không cần ghép — hệ thống xử lý tự động.

```javascript
async function startReading() {
  if (!serialPort || !serialPort.readable) return;

  const decoder = new TextDecoder(); // chuyển Uint8Array → string
  serialReader  = serialPort.readable.getReader();

  try {
    while (isReading) {
      let result;
      try {
        result = await serialReader.read(); // chờ dữ liệu đến
      } catch (err) {
        // reader.cancel() được gọi từ disconnectCom → thoát bình thường
        if (!isReading) break;
        console.warn('Lỗi đọc dữ liệu:', err.message);
        break;
      }

      if (result.done || !isReading) break;

      // Decode chunk nhận được (có thể chỉ là vài byte, chưa đủ 1 dòng)
      const chunk = decoder.decode(result.value, { stream: true });
      rfidBuffer += chunk;

      // Giới hạn buffer tránh memory leak
      // nếu thiết bị gửi liên tục mà không có CR/LF
      if (rfidBuffer.length > 512) {
        rfidBuffer = rfidBuffer.slice(-256);
      }

      // Parse: split theo CR/LF để lấy từng dòng hoàn chỉnh
      // Dùng /[\r\n]+/ thay vì split('\n') vì:
      //   - Một số thiết bị gửi \r\n (2 byte riêng biệt, có thể đến trong 2 chunk)
      //   - /[\r\n]+/ xử lý đúng cả hai trường hợp mà không tạo dòng rỗng thừa
      const lines = rfidBuffer.split(/[\r\n]+/);
      rfidBuffer  = lines.pop(); // phần chưa có terminator → giữ lại cho lần sau

      lines.forEach(line => {
        // Lọc bỏ ký tự không in được (một số thiết bị gửi thêm byte rác)
        const data = line.replace(/[^\x20-\x7E]/g, '').trim();

        // Chỉ xử lý nếu dữ liệu có ít nhất 4 ký tự
        if (data.length >= 4) {
          onDataReceived(data);
        }
      });
    }
  } finally {
    // Luôn release lock khi kết thúc, dù thành công hay lỗi
    try { serialReader.releaseLock(); } catch (_) {}
    serialReader = null;
  }

  // Nếu port bị ngắt ngoài ý muốn (rút dây) → cập nhật UI
  if (serialPort) {
    isReading = false;
    updateUI(false);
  }
}
```

**Tại sao phải dùng buffer?** Dữ liệu serial đến dạng stream — một lần `read()` có thể trả về chỉ 3 byte, lần sau 10 byte. Bạn không thể biết khi nào nhận đủ 1 dòng. Buffer giải quyết vấn đề này: tích lũy cho đến khi thấy `\r\n` thì mới xử lý.

### Bước 3: Xử lý dữ liệu nhận được

```javascript
// Biến để tránh xử lý 2 lần nếu thiết bị gửi quá nhanh
let isProcessing = false;

function onDataReceived(data) {
  console.log('Nhận được:', data);

  // Chống scan liên tiếp trong 1 giây
  if (isProcessing) return;
  isProcessing = true;
  setTimeout(() => { isProcessing = false; }, 1000);

  // Gửi lên backend — dùng bất kỳ ngôn ngữ server nào bạn muốn
  // (PHP, Node.js, Java, ASP.NET, Python... đều được)
  fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: data })
  })
  .then(res => res.json())
  .then(result => {
    // Ví dụ response JSON từ backend:
    // { success: true, name: "Nguyễn Văn A", department: "Kỹ thuật" }
    // { success: false, message: "Thẻ không hợp lệ" }
    console.log('Kết quả từ server:', result);
    handleScanResult(result);
  })
  .catch(err => {
    console.error('Lỗi gửi dữ liệu:', err);
  });
}

function handleScanResult(result) {
  if (result.success) {
    // Ví dụ: hiển thị thông tin nhân viên, điểm danh, xuất nhập kho...
    logData(`✅ ${result.name} — ${result.department}`, 'success');
  } else {
    logData(`❌ ${result.message}`, 'error');
  }
}
```

### Bước 4: Ngắt kết nối đúng cách

Quan trọng là phải ngắt kết nối **đúng thứ tự** để tránh browser báo lỗi:

```javascript
async function disconnectCom() {
  // 1. Tắt flag TRƯỚC — để vòng while trong startReading() dừng lại
  isReading  = false;
  rfidBuffer = '';

  // 2. Cancel reader — giải phóng ReadableStream
  if (serialReader) {
    try { await serialReader.cancel(); } catch (_) {}
    serialReader = null;
  }

  // 3. Đóng port — sau khi reader đã được cancel và release
  if (serialPort) {
    try { await serialPort.close(); } catch (_) {}
    serialPort = null;
  }

  updateUI(false);
  console.log('Đã ngắt kết nối COM port');
}
```

**Thứ tự quan trọng:** Phải cancel reader trước, close port sau. Nếu close port trong khi reader vẫn đang giữ lock, browser sẽ báo lỗi `InvalidStateError`.

## Tự động kết nối lại (Auto-reconnect)

Trong môi trường thực tế (kho hàng, nhà máy, quầy thu ngân), thiết bị có thể bị rút dây hoặc mất kết nối bất ngờ. Nếu user phải nhấn lại nút "Kết nối" mỗi lần như vậy, rất bất tiện.

Web Serial API cung cấp **`navigator.serial.getPorts()`** — trả về danh sách các port mà user đã từng cấp quyền trong phiên trước. Dùng API này để tự động kết nối lại mà không cần `requestPort()` (tức là không cần user click chọn lại).

### Kết nối lại port đã được cấp quyền trước đó

```javascript
// Gọi khi trang vừa load — thử kết nối lại port cũ
async function tryAutoConnect() {
  if (!navigator.serial) return;

  // Lấy danh sách port đã được user cấp quyền
  const ports = await navigator.serial.getPorts();

  if (ports.length === 0) {
    console.log('Chưa có port nào được cấp quyền trước đó');
    return;
  }

  // Thử kết nối port đầu tiên (thường chỉ có 1)
  try {
    serialPort = ports[0];
    await serialPort.open({
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    console.log('Tự động kết nối lại thành công');
    updateUI(true);
    rfidBuffer = '';
    isReading  = true;
    startReading();

  } catch (err) {
    // Thiết bị chưa được cắm lại → bỏ qua, chờ user kết nối thủ công
    console.log('Chưa thể tự động kết nối:', err.message);
    serialPort = null;
  }
}

// Gọi ngay khi trang load
window.addEventListener('DOMContentLoaded', tryAutoConnect);
```

### Tự động reconnect khi bị ngắt bất ngờ

Khi dây bị rút, `serialReader.read()` sẽ throw lỗi hoặc trả về `done: true`. Chúng ta bắt sự kiện đó và thử kết nối lại sau một khoảng delay:

```javascript
let reconnectTimer = null;

// Phiên bản nâng cấp của startReading() — có logic tự reconnect
async function startReading() {
  if (!serialPort || !serialPort.readable) return;

  const decoder = new TextDecoder();
  serialReader  = serialPort.readable.getReader();
  let lostConnection = false;

  try {
    while (isReading) {
      let result;
      try {
        result = await serialReader.read();
      } catch (err) {
        if (!isReading) break; // disconnect chủ động → thoát
        lostConnection = true;
        console.warn('Mất kết nối bất ngờ:', err.message);
        break;
      }

      if (result.done || !isReading) {
        if (result.done && isReading) lostConnection = true;
        break;
      }

      const chunk = decoder.decode(result.value, { stream: true });
      rfidBuffer += chunk;
      if (rfidBuffer.length > 512) rfidBuffer = rfidBuffer.slice(-256);

      const lines = rfidBuffer.split(/[\r\n]+/);
      rfidBuffer  = lines.pop();
      lines.forEach(line => {
        const data = line.replace(/[^\x20-\x7E]/g, '').trim();
        if (data.length >= 4) onDataReceived(data);
      });
    }
  } finally {
    try { serialReader.releaseLock(); } catch (_) {}
    serialReader = null;
  }

  if (lostConnection && isReading) {
    // Dây bị rút → cập nhật UI và lên lịch thử lại sau 3 giây
    serialPort = null;
    updateUI(false);
    logData('⚠️ Mất kết nối — đang thử kết nối lại...', 'warning');
    scheduleReconnect();
  }
}

function scheduleReconnect(delay = 3000) {
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(async () => {
    if (isReading) return; // đã kết nối lại rồi

    const ports = await navigator.serial.getPorts();
    if (ports.length === 0) {
      // Không có port nào được cấp quyền → thử lại sau
      scheduleReconnect(5000);
      return;
    }

    try {
      serialPort = ports[0];
      await serialPort.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });

      rfidBuffer = '';
      isReading  = true;
      updateUI(true);
      logData('✅ Đã kết nối lại thành công', 'success');
      startReading();

    } catch (err) {
      // Thiết bị vẫn chưa được cắm lại → thử tiếp
      serialPort = null;
      logData('⏳ Chưa tìm thấy thiết bị, thử lại sau...', '');
      scheduleReconnect(5000); // thử lại sau 5 giây
    }
  }, delay);
}
```

> **Lưu ý:** `getPorts()` chỉ trả về các port đã được user cấp quyền trong cùng origin (`https://domain.com`). Nếu user lần đầu cấp quyền ở `http://localhost:3000`, sau đó deploy lên `https://myapp.com`, browser sẽ coi đây là 2 origin khác nhau và yêu cầu cấp quyền lại.

## Ghép tất cả lại — Demo hoàn chỉnh

Đây là ví dụ HTML + JS đầy đủ, tích hợp tất cả các tính năng bao gồm auto-connect và reconnect:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>RFID / Barcode Scanner Demo</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; }
    #status { padding: 8px 12px; border-radius: 4px; margin: 12px 0; font-weight: bold; }
    .connected    { background: #d4edda; color: #155724; }
    .disconnected { background: #f8d7da; color: #721c24; }
    .reconnecting { background: #fff3cd; color: #856404; }
    #log { border: 1px solid #ddd; border-radius: 4px; padding: 12px;
           height: 200px; overflow-y: auto; font-family: monospace; font-size: 13px; }
    button { padding: 8px 16px; margin-right: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <h2>🔌 RFID / Barcode Scanner</h2>

  <div id="status" class="disconnected">Chưa kết nối</div>

  <button id="btnConnect" onclick="connectCom()">Kết nối COM port</button>
  <button id="btnDisconnect" onclick="disconnectCom()" disabled>Ngắt kết nối</button>

  <h3>Dữ liệu nhận được:</h3>
  <div id="log"></div>

  <script>
    let serialPort     = null;
    let serialReader   = null;
    let isReading      = false;
    let rfidBuffer     = '';
    let isProcessing   = false;
    let reconnectTimer = null;

    // ─── UI ──────────────────────────────────────────────────────────────────

    function updateUI(connected, reconnecting = false) {
      const status = document.getElementById('status');
      const btnC   = document.getElementById('btnConnect');
      const btnD   = document.getElementById('btnDisconnect');

      if (connected) {
        status.textContent = 'Đã kết nối — Đang lắng nghe...';
        status.className   = 'connected';
        btnC.disabled      = true;
        btnD.disabled      = false;
      } else if (reconnecting) {
        status.textContent = '⏳ Đang thử kết nối lại...';
        status.className   = 'reconnecting';
        btnC.disabled      = true;
        btnD.disabled      = false;
      } else {
        status.textContent = 'Chưa kết nối';
        status.className   = 'disconnected';
        btnC.disabled      = false;
        btnD.disabled      = true;
      }
    }

    function logData(message, type) {
      const log   = document.getElementById('log');
      const time  = new Date().toLocaleTimeString('vi-VN');
      const color = type === 'success' ? 'green'
                  : type === 'error'   ? 'red'
                  : type === 'warning' ? '#856404'
                  : '#333';
      log.innerHTML += `<div style="color:${color}">[${time}] ${message}</div>`;
      log.scrollTop  = log.scrollHeight;
    }

    // ─── Kết nối ─────────────────────────────────────────────────────────────

    async function connectCom() {
      if (!navigator.serial) {
        alert('Trình duyệt không hỗ trợ Web Serial API.\nVui lòng dùng Chrome hoặc Edge phiên bản 89+.');
        return;
      }
      try {
        serialPort = await navigator.serial.requestPort();
        await openAndRead();
      } catch (err) {
        if (err.name !== 'NotFoundError') {
          logData('Lỗi kết nối: ' + err.message, 'error');
        }
      }
    }

    async function openAndRead() {
      await serialPort.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
      clearTimeout(reconnectTimer);
      rfidBuffer = '';
      isReading  = true;
      updateUI(true);
      logData('Kết nối thành công', 'success');
      startReading();
    }

    // ─── Tự động kết nối lại ─────────────────────────────────────────────────

    async function tryAutoConnect() {
      if (!navigator.serial) return;
      const ports = await navigator.serial.getPorts();
      if (ports.length === 0) return;

      try {
        serialPort = ports[0];
        await openAndRead();
        logData('Tự động kết nối lại thành công', 'success');
      } catch (err) {
        serialPort = null;
        // Thiết bị chưa được cắm → không báo lỗi, chờ user kết nối thủ công
      }
    }

    function scheduleReconnect(delay = 3000) {
      clearTimeout(reconnectTimer);
      updateUI(false, true);
      reconnectTimer = setTimeout(async () => {
        const ports = await navigator.serial.getPorts();
        if (ports.length === 0) { scheduleReconnect(5000); return; }

        try {
          serialPort = ports[0];
          await openAndRead();
          logData('✅ Đã kết nối lại thành công', 'success');
        } catch (err) {
          serialPort = null;
          logData('⏳ Thiết bị chưa sẵn sàng, thử lại sau...', 'warning');
          scheduleReconnect(5000);
        }
      }, delay);
    }

    // ─── Đọc dữ liệu ─────────────────────────────────────────────────────────

    async function startReading() {
      if (!serialPort || !serialPort.readable) return;

      const decoder      = new TextDecoder();
      serialReader       = serialPort.readable.getReader();
      let lostConnection = false;

      try {
        while (isReading) {
          let result;
          try {
            result = await serialReader.read();
          } catch (err) {
            if (!isReading) break;
            lostConnection = true;
            logData('⚠️ Mất kết nối: ' + err.message, 'warning');
            break;
          }

          if (result.done || !isReading) {
            if (result.done && isReading) lostConnection = true;
            break;
          }

          const chunk = decoder.decode(result.value, { stream: true });
          rfidBuffer += chunk;
          if (rfidBuffer.length > 512) rfidBuffer = rfidBuffer.slice(-256);

          const lines = rfidBuffer.split(/[\r\n]+/);
          rfidBuffer  = lines.pop();

          lines.forEach(line => {
            const data = line.replace(/[^\x20-\x7E]/g, '').trim();
            if (data.length >= 4) onDataReceived(data);
          });
        }
      } finally {
        try { serialReader.releaseLock(); } catch (_) {}
        serialReader = null;
      }

      if (lostConnection && isReading) {
        isReading  = false;
        serialPort = null;
        logData('⚠️ Mất kết nối bất ngờ — đang thử kết nối lại...', 'warning');
        scheduleReconnect(3000);
      }
    }

    // ─── Xử lý dữ liệu ───────────────────────────────────────────────────────

    function onDataReceived(data) {
      if (isProcessing) return;
      isProcessing = true;
      setTimeout(() => { isProcessing = false; }, 1000);

      logData('📥 Nhận: ' + data, 'success');

      // Ví dụ response từ backend:
      // { success: true, name: "Nguyễn Văn A", department: "Kỹ thuật" }
      fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data })
      })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          logData(`✅ ${result.name} — ${result.department}`, 'success');
        } else {
          logData(`❌ ${result.message}`, 'error');
        }
      })
      .catch(err => logData('Lỗi gửi server: ' + err.message, 'error'));
    }

    // ─── Ngắt kết nối ────────────────────────────────────────────────────────

    async function disconnectCom() {
      clearTimeout(reconnectTimer); // hủy auto-reconnect nếu đang chờ
      isReading  = false;
      rfidBuffer = '';

      if (serialReader) {
        try { await serialReader.cancel(); } catch (_) {}
        serialReader = null;
      }
      if (serialPort) {
        try { await serialPort.close(); } catch (_) {}
        serialPort = null;
      }

      updateUI(false);
      logData('Đã ngắt kết nối', '');
    }

    // ─── Khởi động ───────────────────────────────────────────────────────────

    window.addEventListener('DOMContentLoaded', tryAutoConnect);
  </script>
</body>
</html>
```

## Các lỗi hay gặp và cách xử lý

### 1. `navigator.serial` là `undefined`

- **Nguyên nhân 1:** Trang chạy trên HTTP thường (không phải HTTPS hoặc localhost)
- **Nguyên nhân 2:** Đang dùng địa chỉ IP nội bộ (`http://192.168.1.x`) thay vì `localhost`
- **Nguyên nhân 3:** Dùng Firefox (chưa hỗ trợ Web Serial API)
- **Cách xử lý:** Chuyển sang HTTPS, hoặc test bằng `localhost`; khi test LAN dùng `ngrok` hoặc self-signed cert

### 2. `NotFoundError` khi gọi `requestPort()`

- **Nguyên nhân:** User đóng dialog mà không chọn port — đây là hành vi bình thường
- **Cách xử lý:** Bắt riêng `NotFoundError` và không hiển thị lỗi cho user

### 3. `InvalidStateError` khi đóng port

- **Nguyên nhân:** Đóng port trong khi reader vẫn đang lock
- **Cách xử lý:** Luôn `cancel()` reader trước, rồi mới `close()` port

### 4. Nhận dữ liệu rác hoặc thiếu ký tự

- **Nguyên nhân:** Baud rate không khớp với thiết bị
- **Cách xử lý:** Kiểm tra manual của thiết bị. Phổ biến nhất: `9600` (RFID cũ, barcode), `115200` (RFID mới hơn, một số barcode scanner công nghiệp)

### 5. Một thẻ bị xử lý 2 lần

- **Nguyên nhân:** Một số thiết bị gửi dữ liệu 2 lần (có CR và LF riêng biệt)
- **Cách xử lý:** Dùng flag `isProcessing` + timeout 1 giây như ví dụ trên

### 6. Auto-reconnect không hoạt động sau khi rút cắm lại

- **Nguyên nhân:** `getPorts()` trả về port cũ nhưng port đó chưa "sẵn sàng" ngay sau khi cắm lại
- **Cách xử lý:** Dùng `scheduleReconnect()` với retry delay tăng dần (3s → 5s) thay vì thử ngay lập tức

## Tóm tắt

Web Serial API giúp browser giao tiếp trực tiếp với thiết bị COM port mà không cần phần mềm trung gian. Quy trình gồm 4 bước chính:

1. **Kết nối:** `navigator.serial.requestPort()` → `port.open()`
2. **Đọc dữ liệu:** `ReadableStream` reader + buffer tích lũy
3. **Parse:** Split theo `\r\n`, lọc ký tự rác, kiểm tra độ dài tối thiểu
4. **Ngắt kết nối:** Cancel reader → Close port (đúng thứ tự)

Thêm vào đó, hai tính năng quan trọng cho môi trường production:

- **`navigator.serial.getPorts()`** — tự động kết nối lại port đã cấp quyền khi load trang
- **`scheduleReconnect()`** — tự động thử lại khi mất kết nối bất ngờ

RFID reader và barcode scanner dùng cùng một code xử lý — điểm khác biệt chỉ là nghiệp vụ sau khi nhận được chuỗi dữ liệu.

<p style="text-align:center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>