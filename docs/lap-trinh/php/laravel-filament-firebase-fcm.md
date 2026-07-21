---
id: laravel-filament-firebase-fcm
title: "Hướng Dẫn Tích Hợp Firebase Cloud Messaging (FCM) Vào Laravel + Filament"
sidebar_label: "Tích Hợp Firebase FCM"
slug: /lap-trinh/php/laravel-filament-firebase-fcm
sidebar_position: 4
date: 2025-09-13
tags: [laravel, filament, firebase, fcm, push-notification, php]
---

**1. FCM là gì?** [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging?hl=vi)

**Firebase Cloud Messaging (FCM)** là dịch vụ của Google cho phép gửi thông báo đẩy (push notification) tới:

1. **Mobile Apps (Native)**
   - **Android**: Java/Kotlin
   - **iOS**: Swift/Objective-C
   - **React Native, Flutter, Ionic**: Cross-platform apps
2. **Web PWA (Progressive Web App)**
   - Web app có Service Worker
   - Có thể nhận notification ngay cả khi đóng browser
   - Chạy trên Chrome, Firefox, Edge
3. **Web thông thường (Non-PWA)**
   - Web app bình thường cũng có thể nhận FCM
   - Chỉ nhận được khi đang mở trang web

FCM thường dùng để gửi thông báo hệ thống, tin nhắn, nhắc nhở hoặc thông báo trạng thái công việc.

Dưới đây là hướng dẫn chi tiết từng bước một.

## 🚀 Phần 1: Tạo và Cấu Hình Dự Án Trên Firebase Console

Đây là bước nền tảng để có được "không gian làm việc" và các khóa API cần thiết.

#### **Bước 1: Tạo Dự Án Firebase Mới**

1. Truy cập vào **[Firebase Console](https://firebase.google.com/)**.
2. Nhấn vào **"Add project"** (Thêm dự án).
3. **Nhập tên dự án** của bạn (ví dụ: `My Laravel PWA`).
4. (Tùy chọn nhưng được khuyến nghị) Bật **Google Analytics** cho dự án của bạn để có thêm các thống kê hữu ích.
5. Chấp nhận các điều khoản và nhấn **"Create project"** (Tạo dự án). Chờ một vài phút để Firebase khởi tạo dự án.

![Tạo dự án Firebase](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-04%20081102.png?raw=true)

#### **Bước 2: Thêm Ứng Dụng Web (PWA) vào Dự Án**

- Sau khi dự án được tạo, bạn sẽ được chuyển đến trang tổng quan (Project Overview). Tại đây, bạn cần đăng ký ứng dụng web của mình.
- Trên trang tổng quan, nhấn vào biểu tượng **Web** (`</>`).
- **Đặt tên cho ứng dụng** (App nickname), ví dụ: `PWA Frontend`.
- (Tùy chọn) Bạn có thể tick vào ô "Set up Firebase Hosting" nếu muốn triển khai PWA của mình lên Firebase Hosting. Nếu chỉ dùng FCM thì không bắt buộc.
- Nhấn **"Register app"** (Đăng ký ứng dụng).
- **Lưu lại thông tin cấu hình (firebaseConfig):** Firebase sẽ cung cấp cho bạn một đoạn mã JavaScript chứa các khóa API. Đây là thông tin **công khai** dùng cho phía client (PWA). Hãy sao chép và lưu lại nó, bạn sẽ cần dùng ở Phần 2.

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:XXXXXXXXXXXXXXXXXXX",
  measurementId: "G-XXXXXXXXXX"
};
```

Nhấn **"Continue to console"** (Tiếp tục tới console).

## 🔑 Phần 2: Lấy "Service Account Key" cho Backend Laravel

Để Laravel có thể gửi thông báo đẩy (push notification) đến người dùng, nó cần có quyền quản trị viên. Quyền này được cấp thông qua một tệp tin JSON gọi là "Service Account".

1. Trong Firebase Console, vào dự án của bạn.
2. Nhấn vào biểu tượng bánh răng ⚙️ ở góc trên bên trái, chọn **"Project settings"** (Cài đặt dự án).
3. Chuyển sang tab **"Service accounts"**.
4. Nhấn vào nút **"Generate new private key"** (Tạo khóa riêng mới).
5. Một cảnh báo sẽ hiện ra, nhấn **"Generate key"**.
6. Một tệp tin `.json` sẽ tự động được tải về máy của bạn (ví dụ: `my-laravel-pwa-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`).

🔒 **CẢNH BÁO QUAN TRỌNG:**

- Tệp tin JSON này chứa thông tin cực kỳ nhạy cảm. **KHÔNG BAO GIỜ** đưa nó vào Git repository công khai.
- Hãy lưu trữ nó ở một nơi an toàn trên máy chủ của bạn và chỉ cho ứng dụng Laravel đọc. Cách tốt nhất là lưu ngoài thư mục `public` và đưa đường dẫn vào tệp `.env` của Laravel.

---

## ⚙️ Phần 3: Kích Hoạt Cloud Messaging API

Thông thường API này đã được bật sẵn, nhưng bạn nên kiểm tra lại để chắc chắn.
Trong Google Cloud Console, tìm "Firebase Cloud Messaging API" và nhấn **Enable**.
Vẫn trong **Project settings**, chuyển sang tab **"Cloud Messaging"**.
Bạn sẽ thấy mục **Firebase Cloud Messaging API (V1)**. Nếu nó chưa được kích hoạt, sẽ có một liên kết dẫn bạn đến Google Cloud Console để bật nó lên.

## ⚙️ Phần 4: Tích hợp FCM vào ứng dụng web (Laravel + Filament)

### **4.1. Cấu hình Firebase**

Tạo file `firebase-messaging-sw.js` tại thư mục public (dùng cho service worker):

```javascript
// public/firebase-messaging-sw.js

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');
console.log('[SW] Service Worker file loaded');
// ⚠️ THAY ĐỔI CONFIG NÀY BẰNG CONFIG CỦA BẠN TỪ FIREBASE CONSOLE
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Nhận notification khi app đang đóng (background)
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Thông báo mới';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon.png',
    badge: '/icon.png',
    data: payload.data || {},
    tag: 'notification-' + Date.now(),
    requireInteraction: false
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Xử lý khi click vào notification
self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  event.notification.close();

  // Mở tab hoặc focus vào tab hiện tại
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Nếu có tab đang mở, focus vào đó
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu không có tab nào, mở tab mới
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
```

**4.2. Gọi FCM từ Frontend**

Thêm vào `..\app\Providers\Filament\AdminPanelProvider.php`

```php
<?php

namespace App\Providers\Filament;

use Filament\Panel;
use Filament\PanelProvider;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            // ... các cấu hình khác của panel như id(), path(), colors() ...

            // 🔥 Bắt đầu phần tích hợp Firebase Cloud Messaging
            ->renderHook(
                'panels::body.end', // Hook vào cuối thẻ <body>
                fn() => $this->getFirebaseScript()
            );
    }

    /**
     * Tạo và trả về đoạn script để khởi tạo Firebase và xử lý FCM.
     * Dữ liệu cấu hình được lấy an toàn từ file config của Laravel.
     */
    protected function getFirebaseScript(): string
    {
        // Lấy các khóa cấu hình từ config/services.php
        $apiKey            = config('services.firebase.api_key');
        $authDomain        = config('services.firebase.auth_domain');
        $projectId         = config('services.firebase.project_id');
        $storageBucket     = config('services.firebase.storage_bucket');
        $messagingSenderId = config('services.firebase.messaging_sender_id');
        $appId             = config('services.firebase.app_id');
        $vapidKey          = config('services.firebase.vapid_key'); // VAPID key cho Push API

        // Sử dụng cú pháp HEREDOC để tạo chuỗi HTML/JS
        return <<<HTML
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js"></script>
        
        <script>
            // Khai báo biến toàn cục để dễ dàng truy cập
            window.firebaseApp = null;
            window.firebaseMessaging = null;

            // Cấu hình Firebase từ backend
            const firebaseConfig = {
                apiKey: "{$apiKey}",
                authDomain: "{$authDomain}",
                projectId: "{$projectId}",
                storageBucket: "{$storageBucket}",
                messagingSenderId: "{$messagingSenderId}",
                appId: "{$appId}"
            };

            const VAPID_KEY = "{$vapidKey}";

            // Chỉ khởi tạo khi có đầy đủ cấu hình
            if (!firebaseConfig.apiKey) {
                console.error('❌ Firebase config chưa được thiết lập trong file .env hoặc config/services.php');
            } else {
                console.log('✅ Firebase config loaded.');
                initFirebase();
            }

            function initFirebase() {
                try {
                    // Khởi tạo Firebase
                    window.firebaseApp = firebase.initializeApp(firebaseConfig);
                    window.firebaseMessaging = firebase.messaging();
                    console.log('✅ Firebase initialized.');

                    // Đăng ký Service Worker để nhận thông báo nền
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.register('/firebase-messaging-sw.js')
                            .then(async (registration) => {
                                console.log("✅ Service Worker registered.");
                                // Yêu cầu quyền nhận thông báo sau khi đăng ký thành công
                                await requestNotificationPermission();
                            })
                            .catch((err) => console.error("❌ Service Worker registration error:", err));
                    }

                    // Lắng nghe thông báo khi người dùng đang mở trang web (foreground)
                    window.firebaseMessaging.onMessage((payload) => {
                        console.log("📬 Foreground message received:", payload);
                        
                        const title = payload.notification?.title || 'Thông báo mới';
                        const options = {
                            body: payload.notification?.body || '',
                            icon: "/icon.png", // Đường dẫn tới icon của bạn
                            data: payload.data || {},
                        };
                        
                        // Hiển thị thông báo bằng Notification API của trình duyệt
                        const notification = new Notification(title, options);

                        // Xử lý khi người dùng nhấp vào thông báo
                        notification.onclick = (event) => {
                            event.preventDefault();
                            window.focus();
                            notification.close();
                            if (payload.data?.url) {
                                window.location.href = payload.data.url;
                            }
                        };
                    });
                } catch (error) {
                    console.error('❌ Firebase initialization error:', error);
                }
            }

            // Hàm yêu cầu quyền và gửi token về server
            async function requestNotificationPermission() {
                try {
                    const permission = await Notification.requestPermission();
                    
                    if (permission === 'granted') {
                        console.log("✅ Notification permission granted.");
                        
                        // Lấy FCM token của thiết bị
                        const token = await window.firebaseMessaging.getToken({ vapidKey: VAPID_KEY });
                        console.log("📱 FCM Token:", token);

                        // Gửi token về server để lưu trữ
                        fetch('/save-device-token', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                            },
                            body: JSON.stringify({ device_token: token })
                        })
                        .then(response => response.json())
                        .then(result => console.log("💾 Token saved to server:", result))
                        .catch(err => console.error("❌ Error saving token:", err));

                    } else {
                        console.warn("⚠️ Notification permission denied.");
                    }
                } catch (error) {
                    console.error("❌ Error requesting permission or getting token:", error);
                }
            }
        </script>
        HTML;
    }
}
```

**4.3. Lưu token vào Laravel**:

Tạo route để lưu token thiết bị: `..\routes\web.php`

```php
// Route để lưu FCM token
Route::post('/save-device-token', function (Request $request) {
    try {
        $request->validate([
            'device_token' => 'required|string',
        ]);

        if (!Auth::check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = Auth::user();

        $token = DeviceToken::updateOrCreate(
            [
                'user_id' => $user->id,
                'token' => $request->device_token,
            ],
            [
                'device_type' => 'web',
                'device_name' => $request->userAgent(),
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Token saved successfully',
            'data' => $token,
        ]);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Validation failed',
            'errors' => $e->errors(),
        ], 422);
    } catch (\Exception $e) {
        Log::error('Device token save error: ' . $e->getMessage());

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to save device token',
            'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
        ], 500);
    }
})->middleware('auth')->name('save.device.token');
```

**4.4 Gửi thông báo từ Laravel Backend** `..\app\Services\FcmService.php`

```php
<?php

namespace App\Services;

use Exception;
use Google\Client as GoogleClient;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Collection;

class FcmService
{
    protected $projectId;
    protected $credentialsFile;
    protected $client;

    public function __construct()
    {
        $this->projectId = config('services.fcm.project_id');
        $this->credentialsFile = config('services.fcm.credentials');

        $this->client = new GoogleClient();
        $this->client->setAuthConfig($this->credentialsFile);
        $this->client->addScope('https://www.googleapis.com/auth/firebase.messaging');
    }

    /**
     * Gửi notification đến 1 device token
     */
    public function sendNotification($deviceToken, $title, $body, $data = [])
    {
        $message = [
            'token' => $deviceToken,
            'notification' => [
                'title' => $title,
                'body'  => $body,
            ],
            'data' => $this->normalizeData($data),
        ];

        return $this->sendMessage($message);
    }

    /**
     * Gửi notification đến nhiều users (qua device tokens)
     * 
     * @param array|Collection $userIds - Danh sách user IDs
     * @param string $title
     * @param string $body
     * @param array $data
     * @return array ['success_count' => int, 'failure_count' => int, 'results' => array]
     */
    public function sendToUsers($userIds, $title, $body, $data = [])
    {
        if ($userIds instanceof Collection) {
            $userIds = $userIds->toArray();
        }

        if (empty($userIds)) {
            Log::warning('FCM: sendToUsers called with empty user IDs');
            return [
                'success_count' => 0,
                'failure_count' => 0,
                'results' => []
            ];
        }

        // Lấy tất cả tokens của users
        $tokens = \App\Models\DeviceToken::whereIn('user_id', $userIds)
            ->pluck('token')
            ->filter()
            ->unique()
            ->toArray();

        if (empty($tokens)) {
            Log::warning('FCM: No device tokens found', ['user_ids' => $userIds]);
            return [
                'success_count' => 0,
                'failure_count' => 0,
                'results' => []
            ];
        }

        return $this->sendToMultipleTokens($tokens, $title, $body, $data);
    }

    /**
     * Gửi notification đến nhiều tokens
     * 
     * @param array $tokens
     * @param string $title
     * @param string $body
     * @param array $data
     * @return array
     */
    public function sendToMultipleTokens(array $tokens, $title, $body, $data = [])
    {
        $successCount = 0;
        $failureCount = 0;
        $results = [];

        $normalizedData = $this->normalizeData($data);

        Log::info('FCM: Sending to multiple tokens', [
            'token_count' => count($tokens),
            'title' => $title,
        ]);

        foreach ($tokens as $token) {
            $result = $this->sendNotification($token, $title, $body, $normalizedData);

            if ($result['success']) {
                $successCount++;
            } else {
                $failureCount++;
                Log::warning('FCM: Failed to send to token', [
                    'token' => substr($token, 0, 20) . '...', // Log partial token for security
                    'error' => $result['response'] ?? $result['error'] ?? 'Unknown error'
                ]);
            }

            $results[] = [
                'token' => $token,
                'success' => $result['success'],
                'response' => $result['response'] ?? null,
            ];
        }

        Log::info('FCM: Batch send completed', [
            'success' => $successCount,
            'failure' => $failureCount,
            'total' => count($tokens),
        ]);

        return [
            'success_count' => $successCount,
            'failure_count' => $failureCount,
            'results' => $results,
        ];
    }

    /**
     * Gửi data-only message (silent notification)
     */
    public function sendDataMessage($deviceToken, $data = [])
    {
        $message = [
            'token' => $deviceToken,
            'data'  => $this->normalizeData($data),
        ];

        return $this->sendMessage($message);
    }

    /**
     * Gửi đến topic
     */
    public function sendToTopic($topic, $title, $body, $data = [])
    {
        $message = [
            'topic' => $topic,
            'notification' => [
                'title' => $title,
                'body'  => $body,
            ],
            'data' => $this->normalizeData($data),
        ];

        return $this->sendMessage($message);
    }

    /**
     * Chuẩn hóa data payload - FCM yêu cầu tất cả giá trị phải là string
     */
    protected function normalizeData(array $data): array
    {
        $normalized = [];

        foreach ($data as $key => $value) {
            if (is_null($value)) {
                $normalized[$key] = '';
            } elseif (is_bool($value)) {
                $normalized[$key] = $value ? '1' : '0';
            } elseif (is_array($value) || is_object($value)) {
                $normalized[$key] = json_encode($value);
            } else {
                $normalized[$key] = (string) $value;
            }
        }

        return $normalized;
    }

    /**
     * Core send method
     */
    protected function sendMessage(array $message)
    {
        try {
            $accessToken = $this->client->fetchAccessTokenWithAssertion()['access_token'];

            $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

            $payload = [
                'message' => $message,
            ];

            $response = Http::withToken($accessToken)
                ->post($url, $payload);

            if (!$response->successful()) {
                Log::error('FCM v1: Failed to send notification', [
                    'status'   => $response->status(),
                    'response' => $response->json(),
                ]);
            }

            return [
                'success' => $response->successful(),
                'status_code' => $response->status(),
                'response' => $response->json(),
            ];
        } catch (Exception $e) {
            Log::error('FCM v1: Exception', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }
}
```

![Cấu hình Cloud Messaging](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-02%20102519.png?raw=true)

![Minh họa gửi thông báo](https://github.com/thanvanhai/edu_demo/blob/main/image/d3ddfaa4b92b33756a3a.jpg?raw=true)

## 🔒 1. Người dùng chọn **"Block / Chặn"**

- Khi user bấm *Block* lúc popup xin quyền, thì app web không còn quyền gọi lại `Notification.requestPermission()`.
- **Cách bật lại**: User phải tự tay mở lại trong **Cài đặt của trình duyệt**.
  - **Chrome**:
    - Vào thanh địa chỉ → bấm vào biểu tượng 🔒 (ổ khóa).
    - Chọn **Permissions / Quyền** → Notification → `Allow`.
  - **Safari (iOS/macOS)**:
    - Mở **Settings → Safari → Notifications**.
    - Bật lại quyền cho website.

![Cài đặt quyền thông báo trên trình duyệt](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-04%20102823.png?raw=true)
*Cài đặt quyền thông báo trên trình duyệt, nơi người dùng có thể quản lý quyền nhận thông báo cho trang web trên Edge.*

![Minh họa quyền thông báo](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-04%20103337.png?raw=true)

![Minh họa quyền thông báo](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-04%20103251.png?raw=true)

![Minh họa quyền thông báo](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-04%20102938.png?raw=true)

## 🔓 2. Người dùng chưa cấp quyền (chỉ đóng popup)

- Nếu họ chỉ tắt popup hoặc bỏ qua, trạng thái là `"default"`.
- Lúc này có thể gọi lại `Notification.requestPermission()` khi có user gesture (ví dụ: bấm nút **"Bật thông báo"**) để xin lại quyền.

![Minh họa bật thông báo](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-04%20103408.png?raw=true)

![Minh họa bật thông báo](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-10-04%20103436.png?raw=true)

Luôn hiển thị nút **"Bật thông báo"** trong phần cài đặt tài khoản để user chủ động bật/tắt.
Nếu user đã **chặn (blocked)** thì hiển thị message hướng dẫn cách vào **trình duyệt Settings → Site settings → Notifications**.
Không nên spam popup xin quyền khi page load → dễ bị người dùng bấm *Chặn*.

Bổ sung `..\resources\views\components\notification-status.blade.php` để kiểm tra xem quyền thông báo có bật:

```php
<div class="notification-box" style="margin:20px; padding:10px; border:1px solid #ccc;">
    <div id="notification-status"></div>
    <button id="enable-notifications" style="display:none;">Bật thông báo</button>
</div>

<script>
    function isIos() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }

    function isInStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    }

    function getBrowserName() {
        const ua = navigator.userAgent;

        if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1 && ua.indexOf("OPR") === -1) {
            return "Google Chrome";
        } else if (ua.indexOf("Edg") > -1) {
            return "Microsoft Edge";
        } else if (ua.indexOf("Firefox") > -1) {
            return "Mozilla Firefox";
        } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
            return "Safari";
        } else {
            return "Trình duyệt không xác định";
        }
    }

    function checkNotificationStatus() {
        if (!("Notification" in window)) {
            document.getElementById("notification-status").innerText =
                "❌ Trình duyệt này không hỗ trợ thông báo.";
            return;
        }

        if (isIos() && !isInStandaloneMode()) {
            document.getElementById("notification-status").innerHTML =
                "📱 Bạn đang dùng Safari iOS.<br>" +
                "👉 Hãy bấm nút <b>Share → Add to Home Screen</b> để bật thông báo.";
            return;
        }

        switch (Notification.permission) {
            case "granted":
                document.getElementById("notification-status").innerText = "✅ Thông báo đã bật.";
                break;
            case "denied":
                const appName = window.location.hostname; // document.title || 
                const browserName = getBrowserName();
                document.getElementById("notification-status").innerHTML =
                    "🚫 Bạn đã chặn thông báo.<br>" +
                    "👉 Vào <b>Cài đặt → Thông báo → " + browserName + " - " + appName + "</b> để bật lại.";
                break;
            default:
                document.getElementById("notification-status").innerText =
                    "ℹ️ Bạn chưa cho phép nhận thông báo.";
                document.getElementById("enable-notifications").style.display = "inline-block";
        }
    }

    document.getElementById("enable-notifications").addEventListener("click", () => {
        Notification.requestPermission().then(() => {
            checkNotificationStatus();
        });
    });

    checkNotificationStatus();
</script>
```

Blade component `x-notification-status` có thể gọi ở bất kỳ page nào khác:

```php
<x-notification-status />
```

Để tích hợp FCM lên các thiết bị sử dụng hệ điều hành iOS của Apple thì cần có cầu nối là **APNs**. Dưới đây là hướng dẫn chi tiết, kết hợp và làm rõ các bước cấu hình cần thiết.

### Bước 1: Lấy Khóa xác thực APNs (.p8) từ Apple

Đây là bước quan trọng nhất để tạo "chứng minh thư" cho phép server của bạn (thông qua Firebase) được quyền gửi thông báo tới các thiết bị Apple.

1. **Đăng nhập vào Apple Developer Account**:
   - Truy cập [developer.apple.com](https://developer.apple.com) và đăng nhập bằng tài khoản Apple Developer đã trả phí ($99/năm).
2. **Tạo một App ID mới (Identifier)**:
   - Trong mục **"Certificates, IDs & Profiles"**, đi đến **"Identifiers"** và nhấn dấu cộng **(+)**.
   - Chọn **"App IDs"** và nhấn **"Continue"**.
   - Chọn loại là **"App"** và nhấn **"Continue"**.
   - **Description**: Đặt tên mô tả (ví dụ: "My PWA Push Service").
   - **Bundle ID**: Chọn **"Explicit"** và nhập một Bundle ID duy nhất theo định dạng đảo ngược tên miền. **Đây chính là `Bundle ID` bạn sẽ dùng sau này**. Ví dụ: `com.mycompany.pwa`.
   - Kéo xuống dưới, trong tab **"Capabilities"**, tìm và tick vào ô **"Push Notifications"**.
   - Nhấn **"Continue"** và **"Register"** để hoàn tất.
3. **Tạo Khóa xác thực APNs (.p8 Key)**:
   - Vẫn trong mục "Certificates, IDs & Profiles", đi đến **"Keys"**.
   - Nhấn dấu cộng **(+)** để tạo key mới.
   - **Key Name**: Đặt tên cho khóa (ví dụ: "Firebase PWA APNs Key").
   - Tick vào ô **"Apple Push Notifications service (APNs)"**.
   - Nhấn **"Continue"** và **"Register"**.
4. **Tải về và Lưu thông tin**:
   - **Tải file .p8**: Đây là lần **DUY NHẤT** bạn có thể tải file này. Nhấn **"Download"** và lưu nó ở một nơi cực kỳ an toàn.
   - **Ghi lại Key ID**: Nó sẽ hiển thị trong danh sách key.
   - **Ghi lại Team ID**: ID này nằm ở góc trên bên phải màn hình, cạnh tên của bạn.

Sau bước này, bạn đã có đủ 3 thông tin quan trọng:

- File `AuthKey_ABC123.p8`
- **Key ID** (ví dụ: `DEF456GHIJ`)
- **Team ID** (ví dụ: `KLM789NOPQ`)

### Bước 2: Cấu hình "Cầu nối APNs" trong Firebase

Bây giờ, bạn cần cung cấp thông tin của Apple cho Firebase để nó biết cách gửi thông báo qua APNs.

1. **Mở Firebase Console**:
   - Truy cập dự án của bạn trên [console.firebase.google.com](https://console.firebase.google.com).
2. **Đi đến cài đặt Cloud Messaging**:
   - Nhấn vào biểu tượng bánh răng ⚙️, chọn **"Project settings"**.
   - Chuyển qua tab **"Cloud Messaging"**.
3. **Tải khóa APNs lên**:
   - Trong tab Cloud Messaging, kéo xuống phần **"Apple app configuration"**.
   - Tại mục **"APNs Authentication Key"**, nhấn nút **"Upload"**.
   - Một cửa sổ sẽ hiện ra:
     - **APNs Authentication Key**: Tải lên file `.p8` bạn đã lưu.
     - **Key ID**: Dán Key ID bạn đã ghi lại.
     - **Team ID**: Dán Team ID của bạn.
   - Nhấn **"Upload"**.

Khi upload thành công, Firebase đã sẵn sàng để chuyển tiếp tin nhắn cho các thiết bị iOS.

### Bước 3: Cập nhật mã nguồn PWA (Client-Side)

Phần cấu hình đã xong, giờ là lúc đảm bảo code phía client của bạn sẵn sàng nhận token trên iOS.

1. **Thêm `gcm_sender_id` vào `manifest.json`**: Để đảm bảo khả năng tương thích, hãy thêm dòng sau vào file `manifest.json`. Số `103953800507` là cố định cho tất cả các dự án FCM.

```json
{
  "gcm_sender_id": "103953800507"
}
```

2. **Lấy FCM Token**: Mã nguồn để lấy token trên iOS cũng tương tự như trên các trình duyệt khác, sử dụng `getToken()` từ Firebase SDK. Tuy nhiên, hãy nhớ rằng Safari chỉ cho phép yêu cầu quyền thông qua một hành động của người dùng (ví dụ: click vào nút).

```javascript
import { getMessaging, getToken } from "firebase/messaging";

// Hàm này nên được gọi khi người dùng click vào nút "Bật thông báo"
async function subscribeToNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const messaging = getMessaging();

      // Lấy token. VAPID key vẫn cần cho các trình duyệt khác.
      const currentToken = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_SETTINGS'
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Gửi token này về server của bạn
        sendTokenToServer(currentToken);
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
}
```

Sau khi hoàn thành tất cả các bước trên, PWA của bạn khi được **"Add to Home Screen"** trên iOS sẽ có thể yêu cầu quyền, nhận FCM token thành công và sẵn sàng cho việc nhận thông báo đẩy.

<p align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>
