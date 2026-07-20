---
title: "Xây Dựng Hệ Thống Smart Camera Với ROS 2 - Phần 3: Xây Dựng Frontend"
date: 2026-07-20 10:00:00 +0700
categories: [Lập trình, AI-Robotics]
tags: [ros2, php, laravel, filament, livewire, smart-camera, frontend]
author: haicoi
---

`Camera` ➡️ `CameraManagerNode` ➡️ `Topic ROS 2` ➡️ `VideoStreamBridge` ➡️ `RabbitMQ` ➡️ `Trình xem`

Để xem live trực tiếp thì thường sẽ đi thẳng từ Camera tới trình xem, ở đây phải qua trung gian vì mình muốn xử lý nội dung video rồi mới cho người khác xem. Ví dụ: đếm người hay nhận dạng các vật thể, đối tượng cụ thể hoặc gửi cảnh báo khi phát hiện sự cố, ...

Bây giờ sẽ xây nhanh trang **SmartCamera_Manager** sử dụng **Infolist** của Filament để định nghĩa layout một cách khai báo. Các component như `Section` và `ViewEntry` giúp xây dựng các bố cục phức tạp một cách nhanh chóng và nhất quán.

<!--more-->

## `SmartCamera_Manager.php`

`edu_demo\app\Filament\Clusters\SmartCamera\Pages\SmartCamera_Manager.php`

```php
<?php

namespace App\Filament\Clusters\SmartCamera\Pages;

use App\Filament\Clusters\SmartCamera;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Http;
use Filament\Pages\SubNavigationPosition;
use Filament\Infolists\Infolist;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\Livewire;
use Filament\Infolists\Components\ViewEntry;
use Filament\Infolists\Contracts\HasInfolists;
use Filament\Infolists\Concerns\InteractsWithInfolists;
use Filament\Support\Enums\MaxWidth;
use App\Livewire\SmartCamera\CameraToolbar;

class SmartCamera_Manager extends Page implements HasInfolists
{
    use InteractsWithInfolists;

    protected static ?string $navigationIcon = 'heroicon-o-video-camera';
    protected static string $view = 'filament.clusters.smart-camera.pages.smart-camera-manager';
    protected static ?string $cluster = SmartCamera::class;
    protected static ?string $title = 'Hệ thống Camera Thông minh';
    protected static ?string $navigationLabel = 'Hệ thống Camera thông minh';
    protected static ?string $slug = 'smart-camera-manager';
    protected static ?int $navigationSort = 0;
    protected static bool $shouldRegisterNavigation = true;
    protected static SubNavigationPosition $subNavigationPosition = SubNavigationPosition::Top;

    public array $cameras = [];
    public ?array $selectedCamera = null;
    public ?string $streamUrl = null;

    protected $listeners = [
        'refreshCameraList' => 'refreshData',
        'cameraUpdated' => 'refreshData'
    ];

    public function getMaxContentWidth(): MaxWidth
    {
        return MaxWidth::Full;
    }

    public function mount(): void
    {
        $this->loadCameras();
        $this->dispatch('$refresh');
    }

    public function loadCameras(): void
    {
        $response = Http::withoutVerifying()->get(env('SMART_CAMERA_API_URL') . '/cameras/');
        if ($response->ok()) {
            $this->cameras = $response->json();
        }
    }

    public function refreshData(): void
    {
        $this->loadCameras();
        $this->dispatch('$refresh');
    }

    public function selectCamera($cameraId): void
    {
        $camera = collect($this->cameras)->firstWhere('camera_id', $cameraId);
        if ($camera) {
            $cameraId = trim($camera['camera_id']);
            $this->selectedCamera = $camera;
            $this->streamUrl = rtrim(env('SMART_CAMERA_API_URL'), '/')
                . '/cameras/' . $cameraId . '/stream';
        }
    }

    public function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Section::make()
                    ->schema([
                        Livewire::make(CameraToolbar::class, [
                            'cameras' => $this->cameras,
                            'selectedCamera' => $this->selectedCamera,
                        ])->key('camera-toolbar-' . count($this->cameras)),
                    ])
                    ->columns(1)
                    ->extraAttributes(['class' => 'mb-4']),

                Section::make()
                    ->schema([
                        ViewEntry::make('camera_list')
                            ->view('livewire.smart-camera.camera-sidebar')
                            ->state(fn() => [
                                'cameras' => $this->cameras,
                                'selectedCamera' => $this->selectedCamera,
                            ])
                            ->columnSpan(3),

                        ViewEntry::make('video_player')
                            ->view('livewire.smart-camera.camera-player')
                            ->state(fn() => [
                                'selectedCamera' => $this->selectedCamera,
                                'streamUrl' => $this->streamUrl,
                            ])
                            ->columnSpan(9),
                    ])
                    ->columns(12)
                    ->extraAttributes(['class' => 'min-h-[80vh]']),
            ]);
    }
}
```

## `CameraToolbar.php`

`edu_demo\app\Livewire\SmartCamera\CameraToolbar.php`

```php
<?php

namespace App\Livewire\SmartCamera;

use Livewire\Component;
use Illuminate\Support\Facades\Http;
use Filament\Notifications\Notification;

class CameraToolbar extends Component
{
    public array $cameras = [];
    public ?array $selectedCamera = null;
    public bool $showCreateModal = false;
    public array $formData = [
        'name' => '',
        'camera_type' => 'ip_camera',
        'stream_url' => '',
        'location' => '',
        'description' => '',
    ];

    protected $listeners = ['refreshCameraList'];

    public function mount($cameras = [], $selectedCamera = null): void
    {
        $this->cameras = $cameras;
        $this->selectedCamera = $selectedCamera;
    }

    public function refreshCameraList(): void
    {
        // Toolbar không load dữ liệu trực tiếp, page sẽ làm việc này
    }

    public function openCreateCamera(): void
    {
        $this->reset('formData');
        $this->formData['camera_type'] = 'ip_camera';
        $this->showCreateModal = true;
    }

    public function saveCamera(): void
    {
        $this->validate([
            'formData.name' => 'required|min:3|max:50',
            'formData.stream_url' => 'required|url',
            'formData.location' => 'required|min:3|max:100',
        ]);

        try {
            $response = Http::timeout(10)->post(env('SMART_CAMERA_API_URL') . '/cameras/', $this->formData);

            if ($response->ok()) {
                $cameraName = $this->formData['name']; // Lưu tạm
                $this->showCreateModal = false;
                $this->reset('formData');

                // Dispatch event để page xử lý reload
                $this->dispatch('cameraCreated');
                $this->dispatch('refreshCameraList');

                Notification::make()
                    ->title('Thêm camera thành công')
                    ->body('Camera "' . $cameraName . '" đã được thêm.')
                    ->success()
                    ->send();

            } else {
                $errorMessage = $response->json()['message'] ?? 'Lỗi không xác định';
                throw new \Exception($errorMessage);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e; // Livewire sẽ hiển thị validation errors tự động
        } catch (\Exception $e) {
            Notification::make()
                ->title('Không thể thêm camera')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    public function closeModal(): void
    {
        $this->showCreateModal = false;
        $this->reset('formData');
    }

    public function render()
    {
        return view('livewire.smart-camera.camera-toolbar');
    }
}
```

## Kịch Bản Kiểm Thử Luồng Video

**ROS2 → Backend API → Trình duyệt (Laravel)**

Chạy các **Node ROS 2** ở phần 1:

![Chạy Node ROS 2](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-25%20144359.png?raw=true)

Chạy **Backend API** ở phần 2:

![Chạy Backend API](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-24%20134344.png?raw=true)

Chạy **Frontend**:

![Chạy Frontend](https://github.com/thanvanhai/smart_camera_ws/blob/main/image/Screenshot%202025-08-27%20134946.png?raw=true)

{% include embed/youtube.html id='yhPZpoR5lyU' %}

> Nếu theme Jekyll của bạn không hỗ trợ include `embed/youtube.html`, có thể xem video demo trực tiếp tại: [https://youtu.be/yhPZpoR5lyU](https://youtu.be/yhPZpoR5lyU)

## Link Source

Github module Camera: [https://github.com/thanvanhai/edu_demo](https://github.com/thanvanhai/edu_demo)

Trong hệ thống này có sự trợ giúp rất lớn của 3 AI: **ChatGPT, Claude, Google Gemini** — cho 3 con AI nói chuyện với nhau bằng cách mô tả chi tiết yêu cầu, mang code của con này qua con kia review rồi phân tích tìm điểm tối ưu, mà chính bạn mới là người review cuối cùng để lựa chọn được giải pháp tốt nhất cho hệ thống.

---

<p align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></p>
