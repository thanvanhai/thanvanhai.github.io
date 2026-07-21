---
id: devexpress-demo-show-code-2015
title: "[Code Demo] Show Vẻ Đẹp Của DevExpress 14.2.7 - Có Code Demo"
sidebar_label: DevExpress Demo Show
slug: /lap-trinh/csharp/devexpress-demo-show-code-2015
sidebar_position: 6
date: 2015-05-21
tags: [devexpress, csharp, winforms, gridcontrol, xtrareport, ui]
---

Bài viết chủ yếu show các hình ảnh và code của các Demo mẫu của DevExpress đẹp! Dựa vào các hình ảnh này các bạn có thể nảy ra ý tưởng thiết kế thật ấn tượng cho các chương trình của mình.

Và ở đây mình cũng chỉ các bạn cách lấy 1 số mẫu demo các control khi đã cài Dev, các bạn vào đường dẫn `C:\Users\Public\Documents\DevExpress Demos 14.2\Components\ASP.NET\CS\DevAV` và `C:\Program Files (x86)\DevExpress 14.2\Components\Sources` (Win 64bit nha vì mình dùng win 64bit).

**p/s:** sẽ up link source code demo chạy được cho các bạn tham khảo và chỉnh sửa. Code các bạn lấy ở đường dẫn trên sẽ không chạy được và cũng không xem được giao diện, lý do vì code đã bị người ta xóa sạch các file dll khi build của các project rồi họ mới up code hoàn thiện, nên nếu bạn không biết cách thì mở lên các bạn sẽ thấy lỗi vì nó thiếu 1 vài thư viện dll phải lên mạng tải về và add References thì mới chạy được.

Nhân đây cũng chỉ các bạn 1 cách: khi dùng những References dll, chỉnh thuộc tính **Copy Local** của References dll là **True** thì khi build nó sẽ tự động copy cái dll vào thư mục bin/debug, khi này chương trình của bạn mang sang máy khác cũng có thể chạy:

![Chỉnh thuộc tính cho dll](https://haicoiblog.files.wordpress.com/2015/05/dll-copy.jpg)
*nhấn chuột phải vào dll (giữ phím Ctrl để chọn nhiều file dll) và chọn Properties*

![Chọn Local Copy là True](https://haicoiblog.files.wordpress.com/2015/05/dll-true.jpg)
*Chọn Local Copy là True*

---

#### Link tải Demo

Các Demo đều được viết code chuẩn trên VS 2010 (chú ý DEV khá nặng nên chạy trên VS 2010 ít bị đơ, chạy trên VS 2013 lâu lâu bị đơ, nhấn vô button hay 1 control nào khác là nó đóng VS luôn rất bực mình). Các bạn nhấn vô tiêu đề từng demo để tải:

- **[Demo 1: Touch-Enabled Hybrid App](http://www.mediafire.com/download/9qyix2yp9r8sse0/DevExpressHybridAppWin.rar)**
- **[Demo 2: Outlook Inspired App](http://www.mediafire.com/download/jxbrxqqqjwkp5r8/DevExpressOutlookInspiredAppWin.rar)** (demo này chưa đủ chức năng, mình chưa test hết nhưng thấy thiếu chức năng thêm Product, các bạn có thể dựa theo chức năng thêm Employees mà viết thêm chức năng thêm Product vào Modules)
- **[Demo 3: Windows Mail Client](http://www.mediafire.com/download/pxxcmd38g1yhgfd/DevExpressMailClientWin.rar)**
- **[Demo 4: Office Inspired Business App](http://www.mediafire.com/download/mc35dzzomo2252c/DevExpressVideoRentWin.rar)** (đang muốn coi cái cách nó dùng XtraReport, và đây là 1 demo hay về nó vì XtraReport và XtraGrid là 2 công cụ chính của DEV để làm việc lập trình về ứng dụng liên quan đến cơ sở dữ liệu và in các hóa đơn hay báo cáo)
- **[Demo 5: ProductsDemo](http://www.mediafire.com/download/1784nj3dy174nmy/DevExpressProductsDemoWin.rar)** (Code chuẩn trên VS 2011 beta, có thể chạy trên VS 2013)
- **[Demo 6: RealtorWorld](http://www.mediafire.com/download/r41wktzbpfk5z2z/DevExpressRealtorWorldWin.rar)**, **[Demo 7: SalesDemo](http://www.mediafire.com/download/b5794rbdim5aabc/DevExpressSalesDemoWin.rar)** (Các Demo này không phải sửa gì, chạy được ngay)

## Show Hình Ảnh Các Demo

### Demo 1: Touch-Enabled Hybrid App

![Employees](https://haicoiblog.files.wordpress.com/2015/05/employess.jpg)
*Employees*

![Customers](https://haicoiblog.files.wordpress.com/2015/05/customers.jpg)
*Customers*

![Opportunities](https://haicoiblog.files.wordpress.com/2015/05/opportunities.jpg)
*Opportunities*

### Demo 2: Outlook Inspired App

![Xem thông tin Employees](https://haicoiblog.files.wordpress.com/2015/05/emloyess.jpg)
*Xem thông tin Employees*

![Xem thông tin Employees dạng Map](https://haicoiblog.files.wordpress.com/2015/05/emloyess-dang-map.jpg)
*Xem thông tin Employees dạng Map*

![Thêm mới 1 Employee](https://haicoiblog.files.wordpress.com/2015/05/emloyess-them-moi.jpg)
*Thêm mới 1 Employee*

![Sửa thông tin 1 Employee](https://haicoiblog.files.wordpress.com/2015/05/emloyess-sua.jpg)
*Sửa thông tin 1 Employee*

![Xem thông tin Product dạng Bảng](https://haicoiblog.files.wordpress.com/2015/05/product-dang-list.jpg)
*Xem thông tin Product dạng Bảng, Danh Sách (List) — cái này chính là gridView của Grid*

![Xem thông tin Product dạng Card](https://haicoiblog.files.wordpress.com/2015/05/product-dang-card.jpg)
*Xem thông tin Product dạng Card — cái này là dạng **Multiple Rows** của layoutView của Grid*

![Xem Product dạng Carousel](https://haicoiblog.files.wordpress.com/2015/05/product-dang-carousel.jpg)
*Xem Product dạng **Carousel** của dạng layoutView của Grid — thích dạng này nhất nà*

### Demo 3: Windows Mail Client

![Mail - hộp thư](https://haicoiblog.files.wordpress.com/2015/05/mail.jpg)
*Mail - hộp thư*

![Tasks - Theo dõi công việc](https://haicoiblog.files.wordpress.com/2015/05/tasks.jpg)
*Tasks - Theo dõi công việc*

![Calendar - Lịch ghi chú sự kiện](https://haicoiblog.files.wordpress.com/2015/05/calendar.jpg)
*Calendar - Lịch ghi chú các sự kiện, công việc*

![Contacts - Danh bạ](https://haicoiblog.files.wordpress.com/2015/05/contacts.jpg)
*Contacts - Danh bạ*

### Demo 4: Office Inspired Business App

![Main](https://haicoiblog.files.wordpress.com/2015/05/main.jpg)
*Main*

![Thông tin Movies ở dạng XtraGrid](https://haicoiblog.files.wordpress.com/2015/05/moives-dang-xtragird.jpg)
*Thông tin Movies ở dạng XtraGrid*

![Thông tin Customs ở dạng XtraReport](https://haicoiblog.files.wordpress.com/2015/05/customs-dang-xtrareport.jpg)
*Thông tin Customs ở dạng XtraReport*

![Customs By Dates dạng XtraPivotGrid](https://haicoiblog.files.wordpress.com/2015/05/customs-by-dates-dang-xtrapivotgrid.jpg)
*Customs By Dates dạng XtraPivotGrid*

![Top Customers dạng XtraChart](https://haicoiblog.files.wordpress.com/2015/05/top-custommers-dang-xtrachart.jpg)
*Top Customers dạng XtraChart*

![Rental Calendar dạng XtraScheduler](https://haicoiblog.files.wordpress.com/2015/05/rental-calendar-dang-xtrascheduler.jpg)
*Rental Calendar dạng XtraScheduler*

Còn mấy demo nữa không show hình ảnh nhưng có source code, các bạn tải về và tự mình khám phá!

<div style={{textAlign: 'center'}}>

**Chúc các bạn thành công và vui vẻ!**

</div>
