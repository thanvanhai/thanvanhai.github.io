# Hướng dẫn Setup Môi Trường & Chạy Site Local (thanvanhai.github.io)

Site này được xây dựng bằng **Jekyll**, dùng theme **Chirpy**, host trên **GitHub Pages**. Tài liệu này hướng dẫn cách cài môi trường và chạy thử site trên máy local trước khi commit/push.

---

## 1. Yêu cầu cần cài đặt

| Công cụ | Mục đích |
|---|---|
| **Git** | Clone / commit / push code |
| **Ruby + DevKit (MSYS2)** | Chạy Jekyll, build site |
| **Bundler** | Quản lý gem/dependency theo `Gemfile` |

Khuyến nghị dùng Ruby bản **3.2.x hoặc 3.3.x** để tương thích tốt với theme Chirpy và các gem liên quan.

---

## 2. Cài Git

```powershell
winget install --id Git.Git -e --source winget
```

Kiểm tra sau khi cài:
```powershell
git --version
```

> 🔁 **Lưu ý:** Sau khi cài xong, phải **đóng hẳn VS Code (toàn bộ ứng dụng)** rồi mở lại để Terminal nhận biến môi trường PATH mới. Mở terminal mới trong VS Code là **chưa đủ**.

---

## 3. Cài Ruby + DevKit

Tải và cài từ trang chính thức: `https://rubyinstaller.org/downloads/` (chọn bản có kèm **DevKit**), hoặc qua Microsoft Store (tìm "Ruby", chọn bản có ghi **"with MSYS2 runtime"**).

### Trong lúc cài đặt
- Ở bước **Destination Folder**, có thể đổi ổ đĩa cài đặt tùy ý (ví dụ `E:\Ruby32-x64`).
- Tick chọn **"Add Ruby executables to your PATH"**.
- Cuối quá trình cài, tick **"Run 'ridk install' to set up MSYS2 and development toolchain"** → Finish.

### Cửa sổ `ridk install` hiện ra
```
1 - MSYS2 base installation
2 - MSYS2 system update (optional)
3 - MSYS2 and MINGW development toolchain

Which components shall be installed? If unsure press ENTER [1,3]
```
→ Nhấn **Enter** để cài mặc định (1 và 3). Sau khi thấy dòng `Install MSYS2 and MINGW development toolchain succeeded`, nếu nó hỏi lại lần 2 với `[]` (không có mặc định) → nhấn **Enter** để bỏ qua.

### Kiểm tra sau khi cài
> Nhớ đóng hẳn VS Code và mở lại trước khi kiểm tra!
```powershell
ruby -v
gem -v
```

---

## 4. Clone Repo Về Máy

```powershell
cd "E:\Source Code"
git clone https://github.com/thanvanhai/thanvanhai.github.io.git
cd thanvanhai.github.io
code .
```

> 💡 Nếu đường dẫn có khoảng trắng (vd `E:\Source Code`), luôn bọc trong dấu ngoặc kép `"..."` khi dùng với `cd`.

---

## 5. Cấu hình Gemfile (bắt buộc trên Windows)

Theme Chirpy chạy trên Windows thường gặp lỗi thiếu dữ liệu timezone hệ thống (`tzinfo`). Sửa file `Gemfile` trong thư mục project thành:

```ruby
source "https://rubygems.org"

gem "jekyll-theme-chirpy", "~> 7.3"

gem "tzinfo", ">= 1.2"
gem "tzinfo-data"

install_if -> { Gem.win_platform? } do
  gem "wdm", ">= 0.1.0"
end
```

**Giải thích:**
- `tzinfo` / `tzinfo-data`: bắt buộc trên Windows vì hệ điều hành không có sẵn dữ liệu timezone như Linux/macOS — thiếu 2 gem này sẽ gây lỗi khi chạy `jekyll serve`.
- `wdm`: giúp Jekyll theo dõi thay đổi file (auto-reload) mượt hơn trên Windows, không bắt buộc nhưng nên có.
- Khối `install_if -> { Gem.win_platform? }` đảm bảo gem `wdm` **chỉ cài trên Windows**, không ảnh hưởng khi deploy lên GitHub Pages (chạy trên Linux).

---

## 6. Cài Dependency & Chạy Site Local

Trong Terminal của VS Code, tại thư mục project:

```powershell
gem install bundler
bundle install
bundle exec jekyll serve
```

Mở trình duyệt vào:

```
http://localhost:4000
```

- Sửa file `.md` trong `_posts`, `_tabs`... → Jekyll tự động rebuild, chỉ cần refresh trình duyệt.
- Nếu sửa `_config.yml` → cần dừng server (`Ctrl + C`) rồi chạy lại `bundle exec jekyll serve`.

---

## 7. Commit & Push Code Lên GitHub

```powershell
git status              # xem file đã thay đổi
git add .                # thêm thay đổi
git commit -m "Mô tả thay đổi"
git push                 # đẩy lên GitHub
```

> Lần push đầu tiên, Git có thể yêu cầu đăng nhập GitHub qua popup trình duyệt, hoặc cần nhập **Personal Access Token (PAT)** thay cho mật khẩu nếu dùng HTTPS thuần dòng lệnh (tạo tại: GitHub → Settings → Developer settings → Personal access tokens).

---

## 8. Xử lý sự cố thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|---|---|---|
| `git`/`ruby` is not recognized | PATH chưa được nạp lại | Đóng hẳn VS Code (hoặc khởi động lại máy) rồi mở lại |
| Lỗi `cd` với đường dẫn có khoảng trắng | PowerShell hiểu nhầm tham số | Bọc đường dẫn trong dấu ngoặc kép: `cd "E:\Source Code"` |
| Lỗi liên quan `tzinfo` khi chạy `jekyll serve` trên Windows | Thiếu gem `tzinfo-data` | Thêm `gem "tzinfo-data"` vào `Gemfile` như hướng dẫn ở mục 5 |
| `bundle install` báo lỗi thiếu gem/native extension | Chưa cài đủ MSYS2/MINGW toolchain | Chạy lại `ridk install`, chọn option 1,3 |

---

*Cập nhật lần cuối: 18/07/2026*
