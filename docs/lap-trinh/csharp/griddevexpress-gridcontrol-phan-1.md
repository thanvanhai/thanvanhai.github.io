---
id: griddevexpress-gridcontrol-phan-1
title: "[GridDevExpress] Demo GridControl Của DevExpress 14.2 (Phần 1)"
sidebar_label: "GridControl DevExpress - Phần 1"
sidebar_position: 4
tags: [csharp, devexpress, gridcontrol, winform]
---

Hôm nay mình viết bài này để lưu lại kiến thức của mình, đồng thời chia sẻ cho các bạn biết cách sử dụng **GridControl** của DevExpress vì theo mình đây là một control quan trọng để làm việc với CSDL, hỗ trợ tìm kiếm nhanh rất tiện. Bài viết này có thể dài nên mình sẽ chia làm 2 phần — ở phần này mình chỉ các bạn lấy dữ liệu trong SQL đổ vào Grid và xuất ra theo dạng **Bảng** và **Layout**. Ở phần 2 mình sẽ chỉ các bạn tùy biến Grid để xuất CSDL theo ý mình.

Ở đây mình dùng VS 2013 và bản DevExpress 14.2.7.

---

## Tạo Project

Đầu tiên các bạn mở VS và **New Project**.

![New project](https://haicoiblog.files.wordpress.com/2015/05/new-project.jpg)
*New project*

Ở bước kế tiếp, các bạn chọn một trong các dạng **Template** của DevExpress (có thời gian thì cứ thử chọn tất cả xem nó như thế nào; các bạn cũng có thể xóa bỏ, chỉnh sửa lại Template rồi lưu lại để dùng cho các project sau). Ở đây mình chọn dạng **Ribbon Based Application**.

![chọn project](https://haicoiblog.files.wordpress.com/2015/05/select-project.jpg)
*chọn project*

Các bạn nhấn **Create Project**.

![tạo form](https://haicoiblog.files.wordpress.com/2015/05/create-from.jpg)
*tạo form*

## Thêm GridControl

Bây giờ các bạn mở thanh Toolbox của VS và kéo thả **GridControl** vào form của mình.

![toolbox Grid](https://haicoiblog.files.wordpress.com/2015/05/toolbox-grid.jpg)
*toolbox Grid*

![create Grid](https://haicoiblog.files.wordpress.com/2015/05/create-grid.jpg)
*create Grid*

Vậy thôi, không có gì đặc biệt. Ở đây mình dùng thêm control **officeNavigationBar** để chỉnh dạng hiển thị Grid theo 2 dạng: *Bảng* (**gridView**) hay dạng *Card* (**layoutView**).

![tạo Control officeNavigationBar](https://haicoiblog.files.wordpress.com/2015/05/officenavigationbar.jpg)
*tạo Control officeNavigationBar*

GridControl có tất cả 7 kiểu hiển thị: **CardView, GridView, BandedGridView, AdvBandedGridView, LayoutView, WinExplorerView và TitleView**. Ở đây mình giới thiệu 2 kiểu view chính là **GridView** và **LayoutView**.

Các bạn chọn → *Click here to change view* → sau đó chọn **Create new view** để tạo 2 view chính là **GridView** và **LayoutView**.

OK, giao diện chỉ như vậy là xong.

## Đổ dữ liệu vào Grid

Bây giờ các bạn tạo một class LINQ để liên kết CSDL, sau đó chỉ việc xuất dữ liệu trong `Form_Load` là được:

```csharp
DataClassesQuanLyDoanhNghiepDataContext csdl = new DataClassesQuanLyDoanhNghiepDataContext();

private void Form1_Load(object sender, EventArgs e)
{
    gridControlNhanvien.DataSource = csdl.NhanViens.ToList();
}
```

Nhấn F5 chạy sẽ thấy kết quả:

![kết quả dạng Bảng](https://haicoiblog.files.wordpress.com/2015/05/ket-qua-dang-bang.jpg)
*kết quả dạng Bảng*

## Chuyển đổi kiểu hiển thị

Để thay đổi kiểu hiển thị của Grid, các bạn gán lại kiểu hiển thị **MainView** ở sự kiện `SelectedItemChanged` của `officeNavigationBar`. Ở đây mình dùng control `officeNavigationBar`, nhưng các bạn có thể dùng `button`, `combobox` hay control khác mà mình cảm thấy phù hợp để thay đổi.

```csharp
private void officeNavigationBarHienThi_SelectedItemChanged(object sender, DevExpress.XtraBars.Navigation.NavigationBarItemEventArgs e)
{
    if (officeNavigationBarHienThi.SelectedItem == navigationBarItemBang)
    {
        gridControlNhanvien.MainView = gridView;
    }
    else if (officeNavigationBarHienThi.SelectedItem == navigationBarItemLayout)
    {
        gridControlNhanvien.MainView = layoutView;
    }
}
```

Nhấn F5 và xem kết quả khi hiển thị ở dạng **LayoutView**:

![kết quả ở dạng Layout one card](https://haicoiblog.files.wordpress.com/2015/05/ket-qua-dang-layuot-one-card.jpg)
*kết quả ở dạng Layout one card*

Ở dạng Layout sẽ xuất hiện thêm thanh công cụ cho phép xem 6 dạng Layout khác nhau: **OneCard, OneRow, OneColumn, Multiple Rows, Multiple Columns, Carousel Model** (thích dạng này nà).

![Kết quả ở dạng Carousel Model](https://haicoiblog.files.wordpress.com/2015/05/ketqua-dang-carousel-model.jpg)
*Kết quả ở dạng Carousel Model*

OK, kết thúc phần 1. Sang phần 2 mình sẽ chỉ các bạn tùy biến một chút về Grid mà mình biết được.

### Link tải Demo

[http://www.mediafire.com/download/mmsf166vrg3y3ni/DemoGirdControlDev.rar](http://www.mediafire.com/download/mmsf166vrg3y3ni/DemoGirdControlDev.rar)
