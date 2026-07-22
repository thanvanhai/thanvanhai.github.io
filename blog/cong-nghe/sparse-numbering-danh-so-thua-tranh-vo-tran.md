---
slug: sparse-numbering-danh-so-thua-tranh-vo-tran
title: "Sparse Numbering: Kỹ thuật đánh số giúp hệ thống tài liệu và báo cáo không bị 'vỡ trận'"
authors: [haicoi]
tags: [productivity, technical-writing, organization, database, docusaurus]
date: 2026-07-22
---

Đã bao giờ bạn chuẩn bị một bộ báo cáo gồm 5 chương, các file được đặt tên ngăn nắp từ `1.docx` đến `5.docx`, rồi bất ngờ sếp yêu cầu bổ sung một phần đánh giá rủi ro vào giữa chương 2 và chương 3 chưa?

Lúc này, bạn lụi hụi đổi tên file `3` thành `4`, file `4` thành `5`, file `5` thành `6`... để nhường chỗ cho file mới. Vừa đổi xong thì sếp lại bảo: *"Thôi, phần này dời sang dự án khác"*.

Cơn ác mộng đổi tên file, sửa lại mục lục, chỉnh lại liên kết thủ công này thực ra xuất hiện ở khắp mọi nơi: từ các thư mục lưu trữ trên Google Drive, bảng tính Excel, cho đến hệ thống cơ sở dữ liệu (Database) và cả các trang tài liệu kỹ thuật lớn.

Bài viết này sẽ chia sẻ về **Sparse Numbering (Đánh số thưa / Đánh số cách quãng)** — một giải pháp kinh điển giúp mọi hệ thống danh mục của bạn luôn có không gian để "thở" khi cần chèn thêm dữ liệu ở giữa.

{/* truncate */}

---

## 1. Số nhà trên phố: Tại sao không ai đánh số liên tục 1, 2, 3?

Để hiểu giải pháp này, hãy tưởng tượng nếu người ta đánh số nhà liên tục `1, 2, 3, 4` trên một con phố. Một ngày nọ, có một mảnh đất trống ở giữa nhà số `2` và số `3` được xây lên một ngôi nhà mới. Chính quyền sẽ phải làm gì? Đổi số nhà của toàn bộ con phố từ nhà số 3 trở đi?

Không ai làm thế cả. Thực tế, các đô thị luôn đánh số nhà **chẵn một bên, lẻ một bên** (một dạng bước nhảy 2 đơn vị có sẵn), và khi cần thiết vẫn dùng thêm số phụ như `2A`, `2B`. Đó chính là bản năng "chừa chỗ trống" mà con người đã áp dụng từ rất lâu trước khi ngành phần mềm gọi tên nó là Sparse Numbering.

> 💡 **QUY TẮC VÀNG:**
> Nếu một danh sách (file, báo cáo, chỉ mục) có khả năng được bổ sung trong tương lai, **đừng bao giờ** đánh số sát nhau (bước nhảy là 1 đơn vị). Việc chừa ra những "khoảng trống" hôm nay sẽ cứu bạn khỏi việc phải sửa lại hàng loạt vào ngày mai.

---

## 2. Case Study: "Trận chiến" sắp xếp tài liệu ERP Quản lý kho (INV)

Hãy cùng nhìn vào một ví dụ thực tế trên hệ thống tài liệu ERP mà tôi đang xây dựng bằng Docusaurus. Ban đầu, các file Markdown nghiệp vụ kho được tôi đặt tên theo thứ tự tăng dần từ `0` đến `30`:

```text
docs/erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/
├── 0-tong-quan.md
├── 1-nhap-kho-tu-mua-hang-po.md
├── 2-nhap-kho-tu-san-xuat-wo.md
├── 3-nhap-kho-tra-hang-khach-rma.md
├── 4-xuat-kho-ban-hang-shipment.md
├── 5-xuat-kho-cho-san-xuat-bom.md
...
├── 20-chien-luoc-xuat-kho-fefo-first-expired-first-out.md
└── 30-loi-quy-doi-uom-thuong-gap.md
```

### Vấn đề xuất hiện khi hệ thống phình to

1. **Rủi ro khi chèn bài:** Nếu tôi muốn viết thêm một bài *"Nhập kho mẫu thử (Sample Receipt)"* nằm ngay sau bài số `1` (Nhập kho từ PO) để đúng luồng nghiệp vụ Inbound, tôi sẽ buộc phải sửa tên file của **29 file còn lại phía sau**.
2. **Lỗi liên kết (Broken links):** Các file này liên kết chéo với nhau qua một trang tổng quan (`tong-quan.md`). Khi đổi tên từ `2-xxx.md` thành `3-xxx.md`, tất cả các đường link tương đối trỏ tới file này đều bị gãy — build sẽ báo lỗi `Docusaurus found broken links!` và CI/CD fail ngay lập tức.

---

## 3. Chuyển đổi sang Sparse Numbering (Block = 1000, Step = 10)

Để giải quyết triệt để, tôi đã áp dụng kỹ thuật thiết lập dải số lớn cho từng nhóm (Block) và để bước nhảy giữa các bài viết là 10 (Step = 10).

Cấu trúc mới được ánh xạ lại như sau:

| Nhóm chủ đề | Dải số (Block) | Số mục tối đa | Khả năng mở rộng giữa 2 bài liền kề |
| :--- | :--- | :--- | :--- |
| **1. Nhập kho (Inbound)** | `1000 – 1990` | 100 bài | 9 khoảng trống để chèn giữa |
| **2. Xuất kho (Outbound)** | `2000 – 2990` | 100 bài | 9 khoảng trống |
| **3. Điều chuyển & tổ chức** | `3000 – 3990` | 100 bài | 9 khoảng trống |
| **...** | ... | ... | ... |
| **9. Tích hợp & lỗi thường gặp** | `9000 – 9990` | 100 bài | 9 khoảng trống |

### Thực tế cấu trúc file mới sau khi áp dụng

```text
docs/erp-nghiep-vu/1-chuoi-cung-ung/inv-ton-kho/
├── 0000-tong-quan.md
│
├── 1000-nhap-kho-tu-mua-hang-po.md
├── 1010-nhap-kho-tu-san-xuat-wo.md
├── 1020-nhap-kho-tra-hang-khach-rma.md
│
├── 2000-xuat-kho-ban-hang-shipment.md
├── 2010-xuat-kho-cho-san-xuat-bom.md
├── 2020-xuat-kho-tra-nha-cung-cap-rtv.md
│
├── 3000-chuyen-kho-noi-bo-transfer.md
...
├── 6000-quan-ly-theo-lo-lot-control.md
...
└── 9010-loi-quy-doi-uom-thuong-gap.md  <-- (Trước đây là file số 30)
```

### Kịch bản chèn bài mới bây giờ diễn ra thế nào?

Nếu tôi cần chèn bài *"Nhập kho mẫu thử"* vào giữa bài `1000` (PO) và `1010` (WO), tôi chỉ cần tạo một file duy nhất:
- Tên file: `1005-nhap-kho-mau-thu.md`
- Set thuộc tính `sidebar_position: 1005` trong Frontmatter của file.

```markdown
---
id: nhap-kho-mau-thu
title: Nhập kho mẫu thử (Sample)
sidebar_position: 1005
---
```

**Kết quả:** Docusaurus tự động xếp bài này vào đúng vị trí trên thanh menu. Không một file cũ nào phải đổi tên, không một đường link nào bị gãy, và lịch sử commit trên Git hoàn toàn sạch đẹp!

---

## 4. Khi nào Sparse Numbering vẫn "hết chỗ"?

Kỹ thuật này rất hiệu quả, nhưng không phải phép màu vô hạn. Nếu bạn liên tục chèn quá nhiều bài vào cùng một khoảng trống nhỏ (ví dụ chèn tới 10 bài xen giữa `1000` và `1010`), cuối cùng khoảng trống cũng sẽ cạn (`1001, 1002, ... 1009`).

Khi rơi vào tình huống này, có 2 hướng xử lý phổ biến:
- **Đánh số lại toàn bộ theo chu kỳ (Renumbering):** Một số hệ thống (kể cả các công cụ lớn như Jira, Trello) định kỳ "dồn lại" toàn bộ thứ tự về dạng cách đều nhau, tương tự việc dọn dẹp ổ đĩa. Việc này chỉ cần làm 1 lần, ít tốn công hơn nhiều so với việc phải sửa dần từng chút một.
- **Dùng số thực dấu phẩy động (Float/Decimal Position) thay vì số nguyên:** Ví dụ vị trí có thể là `1000.5`, `1000.25`... — cho phép chèn vô hạn lần giữa 2 số bất kỳ về mặt lý thuyết. Nhiều hệ thống kanban (như Trello, Linear) áp dụng chính xác cách này cho việc kéo-thả sắp xếp thẻ.

---

## 5. Áp dụng tư duy này cho các công việc hàng ngày

Không chỉ hữu ích với lập trình viên hay người viết tài liệu kỹ thuật, tư duy đánh số thưa này có thể áp dụng ngay cho công việc văn phòng của bạn:

- **Quản lý thư mục trên Google Drive:** Đặt tên thư mục dự án của bạn theo cấu trúc `10_Khoi_dong`, `20_Ke_hoach`, `30_Trien_khai`. Nếu có bước phát sinh, bạn dễ dàng chèn thêm thư mục `15_Nghien_cuu_thi_truong` mà không làm đảo lộn cấu trúc cũ.
- **Đánh số đề mục trong file báo cáo dài:** Sử dụng các bước nhảy lớn cho các chương mục chính để khi cần chèn một phụ lục hay tiểu mục ở giữa, bạn không phải ngồi gõ lại mục lục thủ công từ đầu.
- **Cột `sort_order` trong database:** Đây gần như là tiêu chuẩn ngầm trong thiết kế CSDL cho các bảng danh mục (category, menu, priority) — luôn để bước nhảy 10 hoặc 100 giữa các bản ghi thay vì 1, để tránh phải `UPDATE` hàng loạt dòng khi người dùng kéo-thả sắp xếp lại.
- **Đánh số phiên bản tài liệu quy trình nội bộ (SOP):** Thay vì `Bước 1, 2, 3`, một số công ty dùng `Bước 10, 20, 30` để dễ chèn bước kiểm soát chất lượng mới mà không phải phát hành lại toàn bộ tài liệu.

---

## 6. Một vài lưu ý khi áp dụng

- **Đừng chọn bước nhảy quá nhỏ:** Nếu chỉ để bước nhảy là 2 hoặc 3, bạn sẽ sớm hết chỗ trống chỉ sau vài lần chỉnh sửa. Bước nhảy 10 hoặc 100 thường là điểm cân bằng hợp lý giữa "đủ dùng lâu dài" và "không làm số quá dài dòng".
- **Tên file không nên gánh quá nhiều trách nhiệm:** Vấn đề gốc rễ trong case trên không chỉ là đánh số liên tục, mà còn là việc dùng **tên file vật lý** để đảm nhiệm luôn cả vai trò **định danh liên kết (identity)**. Giải pháp bền vững nhất luôn là tách 2 vai trò này ra: dùng số/tên chỉ để sắp xếp hiển thị, còn liên kết thì dựa vào một định danh cố định riêng (trong Docusaurus là `slug`, trong database là `id`/`UUID`).
- **Không phải lúc nào cũng cần áp dụng:** Nếu bạn chắc chắn 100% danh sách sẽ không bao giờ có phần tử chèn thêm (ví dụ: 12 tháng trong năm), thì đánh số liên tục vẫn hoàn toàn ổn, không cần over-engineering.

---

## Lời kết

Đánh số thứ tự liên tiếp (`1, 2, 3...`) là một thói quen tự nhiên nhưng lại vô tình tạo ra rủi ro cho hệ thống khi mở rộng. Bằng việc áp dụng **Sparse Numbering** ngay từ khi bắt đầu — kết hợp với việc tách định danh liên kết ra khỏi tên file — bạn không chỉ tiết kiệm được thời gian cho chính mình mà còn giúp toàn bộ tài liệu, báo cáo, hay hệ thống dữ liệu của bạn luôn sẵn sàng cho sự thay đổi.