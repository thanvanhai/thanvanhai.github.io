---
id: laravel-filament-khao-sat-nhieu-buoc
title: "Hướng Dẫn Tạo Trang Khảo Sát Nhiều Bước Kiểu Google Form Bằng Laravel + Filament"
sidebar_label: "Khảo Sát Nhiều Bước (Google Form Style)"
sidebar_position: 3
tags: [laravel, filament, php, survey, khao-sat]
---

Hướng dẫn chi tiết cách tạo hệ thống khảo sát nhiều bước giống Google Form sử dụng Laravel và Filament. Hệ thống sẽ bao gồm các bảng cơ sở dữ liệu, model, lớp cơ sở `FeedbackSurveyBase` và Artisan Command để tự động sinh nhiều trang khảo sát.

## Bước 1: Tạo database

Tạo các bảng cần thiết để lưu trữ thông tin khảo sát và câu trả lời:

- **surveys**: Lưu thông tin khảo sát (id, title, description, is_active, is_open, slug, created_at, updated_at).
  Cột **slug**: dùng để chỉ định link cho trang thực hiện khảo sát nên cần ràng buộc không trùng (unique)

```sql
CREATE UNIQUE NONCLUSTERED INDEX [UQ_surveys_slug] ON [dbo].[surveys]
(
    [slug] ASC
)
WHERE ([slug] IS NOT NULL);
```

- **survey_sections**: Lưu các phần trong khảo sát (id, survey_id, title, description, order, created_at, updated_at).
- **survey_questions**: Lưu câu hỏi trong từng phần (id, section_id, question, type, options, format, is_required, order, created_at, updated_at).
  Cột `type` (Loại câu hỏi): chỉ chấp nhận các loại câu hỏi: `text`, `textarea`, `radio`, `checkbox`, `number`, `datetime`, `rating`, `file`.

```sql
USE [edu_demo]
GO
ALTER TABLE [dbo].[survey_questions]
DROP CONSTRAINT [CK_survey_questions_type]
GO
ALTER TABLE [dbo].[survey_questions]
WITH CHECK ADD CONSTRAINT [CK_survey_questions_type]
CHECK ([type] = 'rating' OR [type] = 'checkbox' OR [type] = 'radio' OR [type] = 'select' OR [type] = 'textarea' OR [type] = 'text'
    OR [type] = 'number' OR [type] = 'datetime' OR [type] = 'file')
GO

ALTER TABLE [dbo].[survey_questions]
CHECK CONSTRAINT [CK_survey_questions_type]
```

- **survey_responses**: Lưu phản hồi của người làm khảo sát (id, survey_id, respondent_id, created_at, updated_at).
- **survey_answers**: Lưu câu trả lời của từng câu hỏi (id, response_id, question_id, answer, created_at, updated_at).

![Database khảo sát](https://github.com/thanvanhai/edu_demo/blob/main/image/databse_edudmo_khaosat.png?raw=true)

## Bước 2: Viết Model

Tạo các model tương ứng với các bảng đã tạo, ví dụ:

```bash
php artisan make:model Survey -m
php artisan make:model SurveySection -m
php artisan make:model SurveyQuestion -m
php artisan make:model SurveyResponse -m
php artisan make:model SurveyAnswer -m
```

![Model khảo sát](https://github.com/thanvanhai/edu_demo/blob/main/image/model_khaosat.png?raw=true)

## Bước 3: Tạo trang CreateSurveyForm

Bạn dùng Artisan command tạo page dạng form:

```bash
php artisan make:filament-page CreateSurveyForm
```

```php
public function form(Form $form): Form
{
    return $form
        ->schema([
            Wizard::make([
                Step::make('Thông tin khảo sát')
                    ->schema([
                        TextInput::make('title')
                            ->label('Tiêu đề khảo sát')
                            ->required(),

                        Textarea::make('description')
                            ->label('Mô tả khảo sát'),

                        Toggle::make('is_active')
                            ->label('Đang hoạt động')
                            ->default(true),
                    ]),

                Step::make('Nội dung câu hỏi')
                    ->schema([
                        Repeater::make('sections')
                            ->label('Các phần (section)')
                            ->schema([
                                TextInput::make('title')
                                    ->label('Tên phần')
                                    ->required(),

                                Repeater::make('questions')
                                    ->label('Danh sách câu hỏi')
                                    ->schema([
                                        TextInput::make('question')
                                            ->label('Nội dung câu hỏi')
                                            ->required(),

                                        Select::make('type')
                                            ->label('Loại câu hỏi')
                                            ->options([
                                                'text' => 'Văn bản một dòng',
                                                'textarea' => 'Văn bản nhiều dòng',
                                                'select' => 'Chọn từ danh sách',
                                                'radio' => 'Chọn một đáp án',
                                                'checkbox' => 'Chọn nhiều đáp án',
                                                'rating' => 'Đánh giá (ngôi sao)',
                                                'number' => 'Nhập số',
                                                'datetime' => 'Thời gian',
                                                'file' => 'Tệp đính kèm',
                                            ])
                                            ->required()
                                            ->reactive(),

                                        // Format chỉ hiển thị khi type là number hoặc datetime
                                        Select::make('format')
                                            ->label('Định dạng')
                                            ->options(function (callable $get) {
                                                return match ($get('type')) {
                                                    'number' => [
                                                        'integer' => 'Số nguyên',
                                                        'decimal' => 'Số thập phân',
                                                    ],
                                                    'datetime' => [
                                                        'date' => 'Chỉ ngày tháng năm',
                                                        'time' => 'Chỉ giờ',
                                                        'datetime' => 'Ngày và giờ',
                                                    ],
                                                    default => [],
                                                };
                                            })
                                            ->visible(fn(callable $get) => in_array($get('type'), ['number', 'datetime']))
                                            ->required(fn(callable $get) => in_array($get('type'), ['number', 'datetime'])),

                                        Repeater::make('options')
                                            ->label('Tùy chọn')
                                            ->schema([
                                                TextInput::make('label')->label('Lựa chọn'),
                                            ])
                                            ->visible(fn($get) => in_array($get('type'), ['select', 'radio', 'checkbox']))
                                            ->defaultItems(2)
                                            ->minItems(1)
                                            ->collapsible(),

                                        Toggle::make('is_required')->label('Bắt buộc')->default(true),
                                    ])
                                    ->minItems(1)
                                    ->collapsible()
                                    ->reorderable(),
                            ])
                            ->minItems(1)
                            ->collapsible()
                            ->reorderable(),
                    ]),
            ])
                ->submitAction(
                    Action::make('submit')
                        ->label('Tạo khảo sát')
                        ->action('submit')
                        ->color('primary')
                )
        ])
        ->statePath('data');
}
```

![Trang tạo khảo sát 1](https://github.com/thanvanhai/edu_demo/blob/main/image/trangtaokhaosat1.png?raw=true)

![Trang tạo khảo sát 2](https://github.com/thanvanhai/edu_demo/blob/main/image/trangtaokhaosat2.png?raw=true)

## Bước 4: Tạo lớp FeedbackSurveyBase

Lớp này sẽ là lớp cơ sở cho tất cả các trang khảo sát, kế thừa từ Filament Page. Nó sẽ xử lý logic lấy khảo sát theo slug, tự động gán title động từ database và load form khảo sát.

### Các loại câu hỏi được hỗ trợ

- **text**: Trường nhập văn bản một dòng, sử dụng `Filament\Forms\Components\TextInput`.
- **textarea**: Trường nhập văn bản nhiều dòng, sử dụng `Filament\Forms\Components\Textarea`.
- **select**: Trường chọn 1 giá trị từ danh sách, sử dụng `Filament\Forms\Components\Select`.
- **radio**: Nhóm nút chọn (radio buttons), sử dụng `Filament\Forms\Components\Radio`.
- **checkbox**: Danh sách chọn nhiều giá trị, sử dụng `Filament\Forms\Components\CheckboxList`.
- **number**: Trường nhập số, có thể cấu hình dạng (`format`) integer hoặc decimal, sử dụng `TextInput` kèm `->numeric()`.
- **datetime**: Trường chọn ngày/giờ, hỗ trợ 3 định dạng (`format`): date, time, datetime, sử dụng `DatePicker`, `TimePicker` hoặc `DateTimePicker`.
- **rating**: Thang đánh giá sao (1–5), sử dụng `IbrahimBougaoua\FilamentRatingStar\Forms\Components\RatingStar`.
- **file**: Trường tải file lên, sử dụng `Filament\Forms\Components\FileUpload`.
- **default**: Nếu type không hỗ trợ, hiển thị `Placeholder` báo lỗi.

```php
protected function renderQuestion($q)
{
    $field = "answers.{$q->id}";

    $options = collect(json_decode($q->options ?? '[]'))
        ->pluck('label')
        ->mapWithKeys(fn($v) => [$v => $v])
        ->toArray();

    return match ($q->type) {
        'text' => TextInput::make($field)->label($q->question)->required($q->is_required),
        'textarea' => Textarea::make($field)->label($q->question)->required($q->is_required),
        'select' => Select::make($field)->label($q->question)->options($options)->required($q->is_required),
        'radio' => Radio::make($field)->label($q->question)->options($options)->required($q->is_required),
        'checkbox' => CheckboxList::make($field)->label($q->question)->options($options)->required($q->is_required),
        'number' => TextInput::make($field)
            ->label($q->question)
            ->numeric()
            ->required($q->is_required)
            ->extraInputAttributes([
                'step' => $q->format === 'integer' ? '1' : ($q->format ?? 'any'),
            ]),
        'datetime' => match ($q->format) {
            'date' => DatePicker::make($field)
                ->label($q->question)
                ->required($q->is_required)
                ->displayFormat('d/m/Y')
                ->format(getDateTimeFormat('date')),
            'time' => TimePicker::make($field)
                ->label($q->question)
                ->required($q->is_required)
                ->displayFormat('H:i')
                ->format(getDateTimeFormat('time')),
            default => DateTimePicker::make($field)
                ->label($q->question)
                ->required($q->is_required)
                ->displayFormat('d/m/Y H:i')
                ->format(getDateTimeFormat('datetime')),
        },
        'rating' => RatingStar::make($field)
            ->label($q->question)->required($q->is_required)
            ->helperText("⭐: Rất không hài lòng ⭐⭐: Không hài lòng ⭐⭐⭐: Bình thường/Không ý kiến ⭐⭐⭐⭐: Khá hài lòng ⭐⭐⭐⭐⭐: Rất hài lòng")
            ->extraAttributes(['style' => 'white-space: pre-line;']),
        'file' => FileUpload::make($field)
            ->label($q->question)
            ->required($q->is_required)
            ->directory('survey_uploads') // thư mục lưu file
            ->maxSize(10240) // tối đa 10MB
            ->preserveFilenames(),
        default => Placeholder::make("unk_{$q->id}")->content('Loại câu hỏi không hỗ trợ'),
    };
}
```

## Bước 5: Tạo Artisan Command

Tạo command để sinh ra nhiều trang khảo sát dựa trên `FeedbackSurveyBase`:

```bash
php artisan make:command MakeMultiSurveyPages
```

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MakeFeedbackSurveys extends Command
{
    /**
     * php artisan make:feedback-surveys {count=5}
     */
    protected $signature = 'make:feedback-surveys {count=5}';

    protected $description = 'Tạo nhiều file FeedbackSurveyX kế thừa FeedbackSurveyBase (dùng slug để lấy khảo sát, title động từ DB)';

    public function handle()
    {
        $count = (int) $this->argument('count');
        $baseNamespace = 'App\\Filament\\Clusters\\KhaoSat\\Pages';
        $basePath = app_path('Filament/Clusters/KhaoSat/Pages');

        if (! File::exists($basePath)) {
            File::makeDirectory($basePath, 0755, true);
        }

        for ($i = 1; $i <= $count; $i++) {
            $className = "FeedbackSurvey{$i}";
            $filePath = $basePath . '/' . $className . '.php';

            if (File::exists($filePath)) {
                $this->warn("⚠ {$className} đã tồn tại, bỏ qua.");
                continue;
            }

            $stub = <<<PHP
<?php

namespace {$baseNamespace};

class {$className} extends FeedbackSurveyBase
{
    protected static ?string \$surveySlug = 'feedback-survey-{$i}';
}
PHP;

            File::put($filePath, $stub);
            $this->info("✅ Đã tạo: {$className}");
        }

        $this->info("🎯 Hoàn tất tạo {$count} file FeedbackSurveyX.");
    }
}
```

Sau khi lưu file xong: mặc định không truyền tham số số trang muốn tạo thì sẽ là 5

```bash
php artisan make:multi-survey-pages
```

hoặc muốn tạo 10 file:

```bash
php artisan make:multi-survey-pages 10
```

![Kết quả tạo nhiều trang](https://github.com/thanvanhai/edu_demo/blob/main/image/Screenshot%202025-08-09%20104245.png?raw=true)

![Menu khảo sát động](https://github.com/thanvanhai/edu_demo/blob/main/image/menukhaosatdong.png?raw=true)

## Bước 6: Hiển thị kết quả

Vì bảng **survey_answers** sẽ lưu câu trả lời dưới dạng dòng, nếu muốn trình bày lại thành dạng cột giống Google Form thì ta sẽ pivot dữ liệu trước khi hiển thị. Ở đây tùy vào đợt khảo sát mà số lượng câu hỏi sẽ khác nhau nên sẽ là pivot cột động, có thể thực hiện nhiều cách như pivot ở SQL rồi mới trình bày (tham khảo `sp_kpi_report_pivot_from_tree` làm ở module KPI trang Báo cáo tổng hợp KPI), hoặc ở đây sẽ pivot trên code sử dụng `Collection` của `Illuminate\Support\Collection`.

Bạn tạo class `SurveyResultService`, đặt trong `..\edu_demo\app\Services\KhaoSat\SurveyResultService.php`:

```php
<?php

namespace App\Services\KhaoSat;

use App\Models\Survey\{SurveyQuestion, SurveySection, SurveyAnswer};
use Illuminate\Support\Collection;

class SurveyResultService
{
    public function getAnswersAsColumns(int $surveyId): Collection
    {
        $questions = SurveyQuestion::whereHas('section', function ($q) use ($surveyId) {
            $q->where('survey_id', $surveyId);
        })->orderBy('id')->get();

        $answers = SurveyAnswer::with(['question', 'response'])
            ->whereHas('question.section', function ($q) use ($surveyId) {
                $q->where('survey_id', $surveyId);
            })
            ->get();

        $grouped = $answers->groupBy('response_id');

        $pivoted = $grouped->map(function ($group) use ($questions) {
            $firstAnswer = $group->first();
            $response = $firstAnswer->response;

            $row = [
                'response_id' => $response->id,
                'Ngày khảo sát' => optional($response->created_at)->format('d/m/Y H:i'), // 👈 thêm cột này
            ];
            foreach ($questions as $question) {
                $key = "{$question->question}";
                $answer = $group->firstWhere('question_id', $question->id)?->answer;

                // ✅ Xử lý checkbox (JSON array)
                $decoded = json_decode($answer, true);
                if (is_array($decoded)) {
                    $answer = implode(', ', $decoded);
                }

                $row[$key] = $answer ?? '';
            }
            return $row;
        });

        return $pivoted->values();
    }
}
```

![Kết quả khảo sát pivot](https://github.com/thanvanhai/edu_demo/blob/main/image/ketquakhaosatpivot.png?raw=true)

Link source github: [https://github.com/thanvanhai/edu_demo](https://github.com/thanvanhai/edu_demo)

> Chú ý database mẫu có trong `..\edu_demo\database\edu_demo.bak` (SQL Server 2022).

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
