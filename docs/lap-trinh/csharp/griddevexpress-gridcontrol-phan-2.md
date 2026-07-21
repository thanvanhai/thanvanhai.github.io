---
id: griddevexpress-gridcontrol-phan-2
title: "[Code Demo] Show Vẻ Đẹp Của DevExpress 14.2.7 - Demo GridControl (Phần 2)"
sidebar_label: "GridControl DevExpress - Phần 2"
slug: /lap-trinh/csharp/griddevexpress-gridcontrol-phan-2
sidebar_position: 5
date: 2015-05-20
tags: [csharp, devexpress, gridcontrol, winform]
---

Tiếp tục phần 2 sẽ chỉ các bạn sử dụng **GridControl** một cách hiệu quả hơn để **chọn các trường dữ liệu được hiển thị**, **lọc dữ liệu** hay **tìm kiếm nhanh, sắp xếp**.

Mình thiết kế lại form, kéo thả một `splitContainerControl` vào để bên phải là Grid, bên trái là một `Panel` để tí nữa mình sẽ tạo ra danh sách các CheckBox cho phép bạn check vào ô nào thì ẩn đi trường dữ liệu của cột tương ứng.

Thiết kế này tuy có thể kiểm soát được trường mình muốn lấy ra, nhưng nó phụ thuộc vào các bảng trong CSDL — nếu sau này CSDL thêm một cột thì ta cũng phải thêm một cột mới ở ngoài chương trình, hay CSDL đổi tên cột thì ta cũng phải đổi theo.

OK, bây giờ các bạn chọn Grid, vào chọn **Run Designer**.

---

![Thiết kế lại Grid](https://haicoiblog.files.wordpress.com/2015/05/rundesign.jpg)
*Thiết kế lại Grid*

## Tinh chỉnh gridView

Các bạn chú ý ở đây mình sẽ chỉnh sửa cho dạng **gridView** của Grid trước.

Ở **Main** các bạn quan tâm đến **Views**, **Columns** và **Layout**. Các thuộc tính này cũng như `GridViewData` của WinForm không khác gì mấy, có thêm 2 tính năng đặc biệt là tìm kiếm (**Find**) và lọc dữ liệu nhanh (**Filter**).

Ở **View**, các bạn kéo xuống tìm thuộc tính `OptionsFind`, 2 tính năng:

- `AlwaysVisible = True` (luôn hiển thị công cụ tìm kiếm)
- `SearchInPreview = True` (cho phép xem trong lúc tìm kiếm, trường hợp quá nhiều dữ liệu thì tìm được đến đâu show đến đó)

Ở thuộc tính `FindNullPrompt`, các bạn nhập câu thông báo tìm kiếm mà bạn cho là hợp lý, ví dụ: *"Nhập vào thông tin bạn muốn tìm kiếm..."*.

![Thiết kế View của gridView của Grid](https://haicoiblog.files.wordpress.com/2015/05/gridvew_view.jpg)
*Thiết kế View của gridView của Grid*

Xong sang **Columns**, ở đây sẽ thiết kế lại tên các cột tiêu đề của bảng NhanVien trong ví dụ này.

Bảng NhanVien mình có 9 trường dữ liệu nên sẽ tạo ra 9 cột. Các bạn chọn nút **Add Columns**.

Thiết lập thuộc tính cho từng cột làm kiểu này khá lâu — cách khác là khi viết câu `SELECT`, sửa tên tiêu đề thành tiếng Việt và sắp xếp cột nào đứng trước đứng sau luôn cũng được.

Ở đây mình lấy ví dụ cột Ngày sinh để có định dạng ngày tháng năm:

- Thuộc tính `Name`: đặt tên cho nó, nên đặt tên rõ ràng sau này dễ quản lý.
- Thuộc tính `Caption`: giống thuộc tính `Text` của các Control, đây là tiêu đề cho cột.
- Thuộc tính `FieldName` (quan trọng): để biết nó lưu trường nào của bảng NhanVien, phải ghi đúng theo tên cột trong bảng NhanVien, nếu sai sẽ không lấy được dữ liệu.
- Thuộc tính `DisplayFormat`: định dạng hiển thị kiểu dữ liệu muốn lấy ra, gồm 2 thuộc tính con:
  - `FormatString`: định dạng dữ liệu xuất ra, kiểu như email, số điện thoại, định dạng ngày tháng năm...
  - `FormatType`: kiểu dữ liệu lấy ra thuộc dạng nào, như integer, money, datetime...

![Thiết kế column cho dạng gridView của Grid](https://haicoiblog.files.wordpress.com/2015/05/thietkecolumngirdview.jpg)
*Thiết kế column cho dạng gridView của Grid*

OK vậy là xong phần gridView, các bạn nhấn F5 và chạy thử:

![kết quả dạng gridView của Grid](https://haicoiblog.files.wordpress.com/2015/05/ketquagirdview.jpg)
*kết quả dạng gridView của Grid*

## Tinh chỉnh layoutView

Bây giờ sẽ qua phần tinh chỉnh cho **layoutView**, cũng tương tự như gridView — các bạn cũng chỉnh phần **View** và **Columns** tương tự như của gridView, ở đây mình chỉnh sửa thêm phần **Layout** nữa.

Cũng chẳng có gì nhiều, các bạn kéo thả các trường dữ liệu sắp xếp theo ý mình, muốn ẩn trường nào thì nhấn chuột phải vào nó chọn **Hidden Item** để ẩn đi, hoặc **Hidden Text** để ẩn tiêu đề. Các bạn cũng có thể để 2 trường dữ liệu trên một hàng. Thiết kế xong, các bạn nhấn sang tab **View Layout** xem ưng ý chưa, rồi nhấn **Apply** là xong.

![thiết kế Layout cho kiểu layoutView của Grid](https://haicoiblog.files.wordpress.com/2015/05/thietkelayout.jpg)
*thiết kế Layout cho kiểu layoutView của Grid*

Và nhấn F5 xem kết quả:

![kết quả layoutView của Grid](https://haicoiblog.files.wordpress.com/2015/05/ketqualayout.jpg)
*kết quả layoutView của Grid*

## Ẩn/hiện cột bằng CheckBox động

Tiếp theo mình sẽ tạo ra các checkbox để cho các bạn tùy chỉnh trường dữ liệu nào muốn hiển thị ra. Ở đây mình tạo checkbox động (tạo bằng code, không design) vì code này có thể dùng cho nhiều bảng khác, không phụ thuộc vào một bảng nào cả.

```csharp
Panel pal = new Panel();
Label lbl = new Label { Text = "Check vào trường \n bạn muốn ẩn đi" };
CheckBox chkb = new CheckBox();

public void taoviewcot()
{
    lbl.AutoSize = true;
    lbl.Dock = DockStyle.Top;
    palCotHienThi.Controls.Add(lbl);
    palCotHienThi.Controls.Remove(pal);

    for (int i = 0; i < gridView.Columns.Count; i++)
    {
        chkb = new CheckBox { Name = gridView.Columns[i].FieldName, Text = gridView.Columns[i].Caption };
        chkb.CheckedChanged += chkb_CheckedChanged;
        chkb.Top = chkb.Height * i + 50;
        pal.Controls.Add(chkb);
    }

    pal.Dock = DockStyle.Fill;
    palCotHienThi.Controls.Add(pal);
}

void chkb_CheckedChanged(object sender, EventArgs e)
{
    CheckBox chk = (CheckBox)sender;

    if (chk.Checked)
    {
        gridView.Columns.ColumnByFieldName(chk.Name).Visible = false;
        layoutView.Columns.ColumnByFieldName(chk.Name).Visible = false;
    }
    else
    {
        gridView.Columns.ColumnByFieldName(chk.Name).Visible = true;
        layoutView.Columns.ColumnByFieldName(chk.Name).Visible = true;
    }
}
```

Gọi hàm `taoviewcot()` trong `FormLoad()` và nhấn F5 xem kết quả:

![ẩn các cột dạng gridView](https://haicoiblog.files.wordpress.com/2015/05/ancaccot.jpg)
*ẩn các cột dạng gridView*

![ẩn các cột dạng layout của Grid](https://haicoiblog.files.wordpress.com/2015/05/ancaccotdanglayout.jpg)
*ẩn các cột dạng layout của Grid*

## Tìm kiếm nhanh

Bây giờ mình sẽ giới thiệu chức năng tìm kiếm của Grid (ở đây nó tìm nhanh và tương đối — cái này code còn khó hơn cả tìm kiếm tuyệt đối, rất có lợi, các bạn có thể viết thêm một nút tìm kiếm nâng cao để tìm thông tin chính xác):

![kết quả tìm kiếm dạng layout](https://haicoiblog.files.wordpress.com/2015/05/ketquatimkiemlayout.jpg)
*kết quả tìm kiếm dạng layout*

![kết quả tìm kiếm dạng grid](https://haicoiblog.files.wordpress.com/2015/05/ketquatimkiemdanggird.jpg)
*kết quả tìm kiếm dạng grid*

## Lọc dữ liệu (Filter)

Chức năng Filter rất hay, các bạn làm kế toán hay văn phòng chắc hay dùng mấy cái này trong Excel và Access.

Tất cả các cột (ở dạng gridView hay layoutView) đều có thể lọc dữ liệu (bạn cũng có thể tắt chức năng lọc dữ liệu của cột đó khi thiết kế). Click vào tiêu đề để chọn biểu tượng Filter lọc dữ liệu:

![chức năng lọc dữ liệu](https://haicoiblog.files.wordpress.com/2015/05/filter.jpg)
*chức năng lọc dữ liệu*

![kết quả lọc dữ liệu các nhân viên có chức vụ là nhân viên](https://haicoiblog.files.wordpress.com/2015/05/ketqualocfilter-gridview.jpg)
*kết quả lọc dữ liệu các nhân viên có chức vụ là nhân viên*

Và ở lọc dạng **Custom**, dạng này đòi hỏi người dùng phải hiểu biết chút thì lọc mới có kết quả. Khi click chọn dạng Custom, hộp thoại lọc dạng Custom xuất hiện để bạn nhập vào công thức so sánh lọc (dấu `_` đại diện cho 1 ký tự và dấu `%` là nhiều ký tự):

![lọc dữ liệu có điều kiện do người dùng chọn](https://haicoiblog.files.wordpress.com/2015/05/filtercustom.jpg)
*lọc dữ liệu có điều kiện do người dùng chọn*

Ở đây mình sẽ ví dụ thao tác đúng: do dữ liệu ít nên mình đưa ra điều kiện để tìm ai là nhân viên luôn (dù muốn lọc nhân viên đã có thể lọc trực tiếp trên tiêu đề):

![lọc dữ liệu kiểu custom có kết quả](https://haicoiblog.files.wordpress.com/2015/05/filterlocdung.jpg)
*lọc dữ liệu kiểu custom có kết quả*

![kết quả lọc Custom ở dạng layout](https://haicoiblog.files.wordpress.com/2015/05/ketqualocfilter-layoutview.jpg)
*kết quả lọc Custom ở dạng layout*

Mình sẽ đưa ra một điều kiện sai nên lọc không ra kết quả:

![lọc custom sai không có kết quả](https://haicoiblog.files.wordpress.com/2015/05/filterlocsai.jpg)
*lọc custom sai không có kết quả*

Kết quả là:

![kết quả lọc trên gridView rỗng](https://haicoiblog.files.wordpress.com/2015/05/ketqualocfilter-gridview-rong.jpg)
*kết quả lọc trên gridView rỗng*

Để làm dữ liệu hiện trở lại, bạn click bỏ dấu check vào checkbox ở vùng lọc (hoặc bạn cũng có thể chọn lại tiêu đề cột đang lọc, chọn **All** để xuất hiện lại toàn bộ dữ liệu). Còn nút **Edit Filter** cho phép sửa lại biểu thức lọc (và lọc trên nhiều trường) — ai hay làm Excel với Access sẽ biết cách nhập công thức lọc cho đúng.

Và chức năng **sắp xếp** khi các bạn nhấn vào tiêu đề cột nha!

### Link tải Demo hoàn thành

[Đã up xong — công nhận DevExpress nặng thật, mấy cái dll mà project lên 13M](http://www.mediafire.com/download/2y6hulbp8xpea7d/DemoGirdControlDev_hoanthanh.rar)

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
