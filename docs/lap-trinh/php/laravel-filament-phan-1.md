---
id: laravel-filament-phan-1
title: "Hướng Dẫn Tạo 1 Dự Án PHP Laravel v12.10 và Filament v3.3.31 - Phần 1"
sidebar_label: "Laravel + Filament - Phần 1"
sidebar_position: 1
tags: [laravel, filament, php, activitylog, helper]
---

## I. Khởi Tạo Project Laravel

✅ **Bước 1: Tạo project mới với tên `edu_demo`:**

```bash
composer create-project laravel/laravel edu_demo "12.*"
```

![Tạo project Laravel](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image.png)

![Kết quả tạo project](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-1.png)

✅ **Bước 2: Di chuyển vào thư mục dự án** hoặc mở bằng **Visual Studio Code** để tiếp tục các bước cấu hình:

```bash
cd edu_demo
```

![Di chuyển vào thư mục dự án](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-2.png)

![Mở dự án bằng VS Code](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-3.png)

✅ **Bước 3: Cấu hình file `.env` với database của bạn.**

```
DB_CONNECTION=sqlsrv
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=edu_demo
DB_USERNAME=sa
DB_PASSWORD=your_password
```

Chạy lệnh sau để kết nối SQL Server:

```bash
composer require doctrine/dbal
composer require ext-sqlsrv
```

Sau đó kiểm tra file `..\edu_demo\config\database.php` đã có driver `sqlsrv` (mặc định Laravel hỗ trợ rồi), hoặc bạn sẽ cấu hình trong này luôn.

![Cấu hình database.php](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-4.png)

![Kiểm tra driver sqlsrv](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-5.png)

✅ **Bước 4: Chạy migrate để tạo bảng mặc định:**

Tạo DB đúng với tên trong cấu hình của bạn trước khi chạy lệnh migrate.

![Tạo database](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-6.png)

![Xác nhận database đã tạo](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-7.png)

Chạy lệnh:

```bash
php artisan migrate
```

![Chạy migrate](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-8.png)

![Kết quả migrate](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-9.png)

## II. Cài Đặt Filament

✅ **Bước 1: Cài đặt Filament:**

```bash
composer require filament/filament:"^3.10"
```

![Cài đặt Filament](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-10.png)

![Kết quả cài đặt](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-11.png)

```bash
php artisan filament:install
```

![Chạy filament:install](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-12.png)

Các bạn nhập yes hay no đều được, không ảnh hưởng vì lúc này đã cài xong Filament Admin Panel. Yes thì chỉ hỏi bạn có muốn "star" repo trên GitHub không, còn no thì không star repo, không sao cả.

✅ **Bước 2: Kiểm tra xem trong `..\app\Provider\Filament` có `AdminPanelProvider.php` không, nếu chưa thì sử dụng lệnh:**

```bash
php artisan make:filament-panel admin
```

![Tạo filament panel](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-13.png)

...để tạo panel gốc.

## Cài Đặt ActivityLog

✅ **1. Cài đặt package:**

```bash
composer require spatie/laravel-activitylog
```

![Cài đặt spatie/laravel-activitylog](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-38.png)

✅ **2. Publish cấu hình & migration**

```bash
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations"
```

![Publish migration activitylog](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-39.png)

Chạy migrate:

```bash
php artisan migrate
```

![Chạy migrate activitylog](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-40.png)

Tùy chọn: publish file config để tùy chỉnh:

![Publish config activitylog](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-41.png)

✅ **3. Cài đặt FilamentLaravelLogPlugin:**

**Cài đặt package:**

```bash
composer require saade/filament-laravel-log
```

![Cài đặt filament-laravel-log](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-42.png)

**Cấu hình trong Panel Provider:**

Mở file `app/Providers/Filament/AdminPanelProvider.php` và thêm plugin này:

```php
use Saade\FilamentLaravelLog\FilamentLaravelLogPlugin;

->plugins([
    FilamentShieldPlugin::make(),
    FilamentLaravelLogPlugin::make()
        ->navigationGroup('Hệ thống')          // nhóm menu
        ->navigationLabel('Nhật ký')           // tên menu
        ->navigationIcon('heroicon-o-bug-ant') // icon
        ->navigationSort(2)                    // thứ tự menu
        ->slug('nhat-ky')                      // slug URL
        ->logDirs([
            storage_path('logs'),              // thư mục chứa file log
        ])
        ->authorize(fn() => Auth::user()?->hasRole('super_admin')), // phân quyền
])
```

![Cấu hình FilamentLaravelLogPlugin](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-43.png)

## Viết Helper

Viết Helper trong Laravel là cách tạo các hàm tiện ích dùng chung trên toàn dự án.

✅ **1. Tạo file Helper:**

Bạn có thể tạo thư mục `app/Helpers` (nếu chưa có), tạo file **helpers.php** chứa các hàm dùng chung:

![Tạo file helpers.php](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-44.png)

✅ **2. Tự động load Helper:** Mở `composer.json`, thêm vào phần `autoload > files`:

```json
"autoload": {
    "psr-4": {
        "App\\": "app/"
    },
    "files": [
        "app/Helpers/helpers.php"
    ]
}
```

![Cấu hình autoload composer.json](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-45.png)

**Sau đó chạy:**

```bash
composer dump-autoload
```

✅ **3. Dùng Helper trong Blade hoặc Filament:**

Giả sử ta có hàm `format_date` ở file **helpers.php**:

```php
if (! function_exists('format_date')) {
    function format_date($date, $format = 'd/m/Y')
    {
        return \Carbon\Carbon::parse($date)->format($format);
    }
}
```

**Trong Blade:**

```php
{{ format_date($ticket->created_at) }}
```

**Trong Filament Resource:**

```php
use function format_date;

TextColumn::make('created_at')
    ->label('Ngày tạo')
    ->formatStateUsing(fn ($state) => format_date($state));
```

---

**Link source GitHub:** [https://github.com/thanvanhai/edu_demo](https://github.com/thanvanhai/edu_demo)

Chú ý database mẫu để có trong `..\edu_demo\database\edu_demo.bak` (SQL Server 2022)

<p align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>
