---
title: "Demo Biểu Thuế Luỹ Tiến Từng Phần Thuế Thu Nhập Cá Nhân Bằng C#"
date: 2026-07-20 09:00:00 +0700
categories: [Lập trình, C#]
tags: [csharp, linq, thue, winform]
author: haicoi
---

Ở đây mình chỉ viết theo cách mình nghĩ, chia sẻ để mọi người xem và giúp góp ý xem có cách cải tiến thuật toán tính lũy tiến thuế tốt hơn không.

Lý do khiến mình viết bài này: đây là đề bài của một công ty mình đi phỏng vấn, yêu cầu viết trên giấy. Lúc đó người phỏng vấn đưa ra một ví dụ mẫu, yêu cầu xây dựng hàm sao cho khi nhà nước thay đổi biểu thuế lũy tiến thì **không được sửa hàm**. Lúc đó mình chỉ viết cứng dựa theo số liệu trong ví dụ mẫu, chỉ mỗi phần lương là biến động, còn khoảng lương và % chịu thuế thì vẫn cố định. Bài làm được chấp nhận, nhưng đến khi phỏng vấn thì bị hỏi ngược lại: cải thiện hàm đó sao cho không phụ thuộc vào dữ liệu cố định của Nhà nước. Lúc đó mình chỉ làm được phần % không phụ thuộc, còn khoảng lương thì chưa làm được, đành chống chế rằng nếu Nhà nước thêm một định mức mới thì cũng phải sửa code — nhưng quy định đặt ra là không được sửa. May mắn vẫn qua được, về nhà mở máy test thử thì thấy cách này ổn.

Nhớ lại những bài vẽ hình C++ thời mới học, cũng từng làm cứng không linh động, nhưng hôm kiểm tra bị thầy nhắc nhở, ngồi nghĩ lại cũng ra được công thức, nên fix lại hết các bài cho nó động và đạt điểm tuyệt đối!

Lan man một chút kỷ niệm, và cũng cảm ơn người thầy đã chỉ dạy mình lập trình từ những ngày C++.

## Thiết kế cơ sở dữ liệu

Đầu tiên mình thiết kế CSDL SQL lưu như sau:

![cấu trúc bảng Biểu thuế luỹ tiến từng phần của Nhà nước](https://haicoiblog.files.wordpress.com/2015/05/cautrucbanghesothue.jpg)
*cấu trúc bảng Biểu thuế luỹ tiến từng phần của Nhà nước*

Dữ liệu mẫu mình tự nhập (bạn phải nhập đúng theo quy định Nhà nước; sau này Nhà nước có thay đổi thì bạn chỉ cần sửa lại trong CSDL, không cần sửa code vẫn chạy đúng — chỉ sợ Nhà nước thay đổi cấu trúc lũy tiến từng phần thì khi đó chắc chắn phải sửa lại hàm tính thuế).

![Dữ liệu mẫu](https://haicoiblog.files.wordpress.com/2015/05/dulieubang.jpg)
*Dữ liệu mẫu*

---

## Thiết kế giao diện

Mở VS thiết kế tạm một form gồm: 1 textbox để nhập lương, 1 button để tính thuế, và 1 label để xuất kết quả thuế đã tính lũy tiến từng phần.

![Form tính thuế](https://haicoiblog.files.wordpress.com/2015/05/fromtinhthue.jpg)
*Form tính thuế*

2 biến mình dùng trong chương trình:

```csharp
double d_thue = 0, d_luong = 0;
```

## Hàm tính thuế

```csharp
double tinhthue()
{
    HeSoThueLuong hsl = new HeSoThueLuong();
    var query = from p in ktluong.HeSoThueLuongs
                select p;

    foreach (var item in query)
    {
        hsl = (HeSoThueLuong)item;

        // trường hợp không tính thuế lương dưới 5 triệu
        if (hsl.LuongMin == 0 && d_luong <= (double)hsl.LuongMax)
        {
            d_thue = 0;
            break;
        }
        // trường hợp thuế thu nhập cao nhất không có lương max
        else if (hsl.LuongMax == null && d_luong >= (double)hsl.LuongMin)
        {
            d_thue += (d_luong - (double)hsl.LuongMin) * (double)hsl.PhanTramThue;
        }
        // trường hợp thuế con cộng dồn cho lương, VD lương 20tr thì phải tính trường hợp lương 5-10 và 10-18
        else if ((double)hsl.LuongMin <= d_luong && d_luong > (double)hsl.LuongMax)
        {
            d_thue += (double)(hsl.LuongMax - hsl.LuongMin) * (double)hsl.PhanTramThue;
        }
        // trường hợp lương kết thúc, VD: kết thúc lương 20tr = (20tr - 18tr) * phần trăm khoảng này,
        // cộng dồn cho khoảng 5-10 với 0-18 đã tính ở trên
        else if ((double)hsl.LuongMin <= d_luong && d_luong <= (double)hsl.LuongMax)
        {
            d_thue += (d_luong - (double)hsl.LuongMin) * (double)hsl.PhanTramThue;
            break;
        }
        // MessageBox.Show(d_thue.ToString());
    }

    return d_thue;
}
```

## Nút tính thuế

```csharp
private void btn_thue_Click(object sender, EventArgs e)
{
    d_luong = double.Parse(mastxt_tienluong.Text.ToString());
    d_thue = 0;
    lbl_thue.Text = String.Format("{0:#,0.#} VND", tinhthue()).ToString();
}
```

## Kết quả

![lương dưới hoặc bằng 5tr không mất thuế](https://haicoiblog.files.wordpress.com/2015/05/ketqua1.jpg)
*lương ≤ 5tr không mất thuế*

![5tr*0,05 + 8tr*0,1 + 7tr*0,15 + 10tr*0,2 + 4000021*0,3](https://haicoiblog.files.wordpress.com/2015/05/ketqua2.jpg)
*5tr\*0,05 + 8tr\*0,1 + 7tr\*0,15 + 10tr\*0,2 + 4000021\*0,3*

### Link tải code của mình (code VS 2015)

[Tải code VS 2015](http://www.mediafire.com/download/4ms5zz3smt207rt/sln_tinhthuethunhapcanhan.rar){:target="_blank"} — các bạn muốn chạy thì tự thiết kế lại bảng lũy tiến thuế vì chỉ có vài dòng dữ liệu mẫu.

<div align="center"><strong>Chúc các bạn thành công và vui vẻ!</strong></div>
