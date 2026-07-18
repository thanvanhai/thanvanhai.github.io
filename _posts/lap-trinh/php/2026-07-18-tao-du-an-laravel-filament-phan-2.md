---
title: "Hướng Dẫn Tạo 1 Dự Án PHP Laravel v12.10 và Filament v3.3.31 - Phần 2"
date: 2026-07-18 10:00:00 +0700
categories: [Lập trình, PHP]
tags: [laravel, filament, php, spatie, permission, filament-shield]
author: haicoi
---

## Cài Đặt Spatie Laravel Permission

✅ **Bước 1: Cài đặt package:**

```bash
composer require spatie/laravel-permission:"6.20.0"
```

![Cài đặt spatie/laravel-permission](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-14.png)

![Kết quả cài đặt](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-15.png)

✅ **Bước 2: Publish và migrate bảng permission:**

```bash
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

![Publish permission provider](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-16.png)

```bash
php artisan migrate
```

![Chạy migrate permission](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-17.png)

![Kết quả migrate](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-18.png)

✅ **Bước 3: Thêm Trait vào model User:**

```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable {
    use HasRoles;
}
```

![Thêm HasRoles vào model User](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-19.png)

## Cài Đặt và Cấu Hình Filament Shield (Trọng Tâm)

### ✅ 1. Tóm tắt quan hệ

```
User <—(model_has_roles)—> Role <—(role_has_permissions)—> Permission
      ↘
       (model_has_permissions) → Permission (gán trực tiếp, ít dùng)
```

![Sơ đồ quan hệ User - Role - Permission](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-20.png)

### ✅ 2. Cơ chế phân quyền tổng thể của Spatie

Spatie dùng **3 bảng chính**:

**(1)** `roles` — Danh sách các vai trò.

**(2)** `permissions` — Danh sách các quyền.

**(3) Bảng trung gian (nhiều-nhiều):**

| Bảng | Dùng để làm gì? |
|---|---|
| `role_has_permissions` | Gán **quyền** cho **vai trò**. VD: Role `Editor` có các quyền `edit_post`, `delete_post` |
| `model_has_roles` | Gán **vai trò** cho **model** (User). VD: User ID=5 có Role `Editor` |
| `model_has_permissions` | Gán **trực tiếp quyền cho model** (User), **không qua Role**. VD: User ID=5 có quyền đặc biệt `publish_post` nhưng không thuộc Role nào |

### ✅ 3. Lệnh cốt lõi

```bash
# Setup Shield:
shield:setup [--fresh] [--minimal] [--tenant=]

# Install Shield for a panel
shield:install {panel} [--tenant]

# Generate permissions/policies
shield:generate [options]

# Create super admin
shield:super-admin [--user=] [--panel=] [--tenant=]

# Create seeder
shield:seeder [options]

# Publish Role Resource
shield:publish {panel}
```

FILAMENT SHIELD là package rất mạnh dùng để **tự động tạo vai trò, phân quyền, và bảo vệ tài nguyên (resource)** cho admin panel.

✅ **Bước 1: Cài đặt package:**

```bash
composer require bezhansalleh/filament-shield:"^3.0"
```

![Cài đặt filament-shield](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-21.png)

![Kết quả cài đặt filament-shield](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-22.png)

✅ **Bước 2: Cài đặt Shield cho panel admin:**

```bash
php artisan shield:install
```

![Chạy shield:install](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-23.png)

✅ **Bước 3: Kiểm tra file `config/filament-shield.php` nếu chưa có thì publish:**

```bash
php artisan vendor:publish --tag=filament-shield-config
```

![Publish filament-shield-config](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-24.png)

Bật các cấu hình quan trọng:

```php
'register_permission_resource' => true
'register_role_resource' => true
'register_custom_permissions' => true
'super_admin' => [
    'enabled' => true,
    'name' => 'super_admin',
]
```

![Cấu hình filament-shield.php](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-25.png)

✅ **Bước 4: Gán Super Admin cho user và các quyền mặc định**

Để tạo tài khoản admin đầu tiên:

**✅ Cách 1: Tạo user thủ công bằng Tinker:**

```bash
php artisan tinker
```

```php
use App\Models\User;
User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('password'), // hoặc dùng Hash::make()
]);
```

![Tạo user bằng Tinker](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-26.png)

**✅ Cách 2: Dùng seeder:**

Tạo một seeder:

```bash
php artisan make:seeder ShieldDefaultSeeder
```

Rồi thêm vào nội dung:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ShieldDefaultSeeder extends Seeder
{
    public function run(): void
    {
        // Xóa cache permission trước khi seed
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ✅ 1. Danh sách quyền mặc định
        $permissions = [
            'view_users',
            'create_users',
            'update_users',
            'delete_users',

            'view_roles',
            'create_roles',
            'update_roles',
            'delete_roles',

            'view_permissions',
            'create_permissions',
            'update_permissions',
            'delete_permissions',
        ];

        // ✅ 2. Tạo các quyền (bảng permissions)
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name'       => $permission,
                'guard_name' => 'web',
            ]);
        }

        // ✅ 3. Tạo Role Super Admin (bảng roles)
        $adminRole = Role::firstOrCreate([
            'name'       => 'super_admin',
            'guard_name' => 'web',
        ]);

        // ✅ 4. Gán tất cả quyền cho super_admin (bảng role_has_permissions)
        $adminRole->syncPermissions($permissions);

        // ✅ 5. Tạo tài khoản Super Admin (bảng users)
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => 'Super Admin',
                'password' => bcrypt('password'), // 🔥 đổi khi deploy
            ]
        );

        // ✅ 6. Gán Role Super Admin cho tài khoản admin (bảng model_has_roles)
        if (! $adminUser->hasRole('super_admin')) {
            $adminUser->assignRole('super_admin');
        }

        // ✅ 7. Tạo tài khoản thường haicoi (bảng users)
        $normalUser = User::firstOrCreate(
            ['email' => 'haicoi@example.com'],
            [
                'name'     => 'haicoi',
                'password' => bcrypt('password123'),
            ]
        );

        // ✅ 8. Gán quyền trực tiếp cho haicoi (bảng model_has_permissions)
        $directPermissions = ['view_users', 'view_roles']; 
        $normalUser->syncPermissions($directPermissions);

        $this->command->info('✅ Default permissions, Super Admin & haicoi user created successfully!');
    }
}
```

Chạy seeder:

```bash
php artisan db:seed --class=ShieldDefaultSeeder
```

![Chạy seeder](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-27.png)

Kiểm tra user và các quyền mặc định của hệ thống dưới database:

![Kiểm tra dữ liệu trong database](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-28.png)

## Kiểm Tra Và Đăng Nhập Thử

Chạy:

```bash
php artisan serve
```

Truy cập: `http://127.0.0.1:8000/admin`

Đăng nhập bằng tài khoản admin. Vào **Roles & Permissions** để kiểm tra.

Hoặc dùng Laravel Herd:

![Sử dụng Laravel Herd](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-29.png)

![Laravel Herd cấu hình](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-30.png)

Cấu hình lại trong file host: `C:\Windows\System32\drivers\etc`

![Cấu hình file hosts](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-31.png)

![Kiểm tra file hosts](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-32.png)

Các bạn vào `..\routes\web.php` chỉnh sửa lại vào thẳng trang admin.

![Chỉnh sửa routes/web.php](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-33.png)

![Kết quả redirect vào trang admin](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-34.png)

Cấu hình trang về locale theo khu vực quốc gia của bạn:

![Cấu hình locale 1](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-35.png)

![Cấu hình locale 2](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-36.png)

Tắt Widgets Filament trong `..\edu_demo\app\Providers\Filament\AdminPanelProvider.php`

![Tắt widgets mặc định của Filament](https://haicoiblog.wordpress.com/wp-content/uploads/2025/08/image-37.png)

---

**Link source GitHub:** [https://github.com/thanvanhai/edu_demo](https://github.com/thanvanhai/edu_demo)

Chú ý database mẫu để có trong `..\edu_demo\database\edu_demo.bak` (SQL Server 2022)

<p align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>
