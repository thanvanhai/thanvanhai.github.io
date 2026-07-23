---
id: tai-lieu-tham-khao
title: Tài liệu tham khảo (Vendor Reference Documents)
sidebar_label: Hướng dẫn & Tra cứu
slug: /tai-lieu-tham-khao/tong-quan
sidebar_position: 1
date: 2026-07-23
tags: [erp, reference, epicor, oracle-ebs, sap, odoo, microsoft-dynamics, schema, chm]
---

# Tài liệu tham khảo (Vendor Reference Documents)

Trang này tổng hợp các **tài liệu gốc do chính hãng ERP phát hành** mà mình sưu tầm được trong quá trình làm việc — chủ yếu là Schema Reference, tài liệu kỹ thuật, hướng dẫn cấu hình... Khác với các bài viết nghiệp vụ khác trên blog (vốn là phân tích/so sánh do mình tự viết), các tài liệu ở đây là **file gốc chưa qua chỉnh sửa**, chỉ đóng vai trò tra cứu nhanh khi cần.

Danh sách sẽ được cập nhật dần mỗi khi mình sưu tầm thêm tài liệu mới từ các hãng khác.

---

## Epicor

### Epicor 10.2.400 - Schema Reference

Tài liệu tra cứu toàn bộ cấu trúc bảng, cột, kiểu dữ liệu của cơ sở dữ liệu Epicor ERP bản **10.2.400.6**, bao gồm cả các bảng thuộc schema `Erp` (nghiệp vụ) và `Ice` (nền tảng hệ thống). Rất hữu ích khi cần viết BAQ, BPM, hoặc truy vấn SQL trực tiếp mà không nhớ chính xác tên bảng/cột.

📥 [Tải Epicor 10.2.400 Schema Reference (.chm)](/files/epicor/Epicor_10.2.400.chm)

### Kinetic 2023.1 - Schema Reference

Tương tự bản trên nhưng dành cho **Kinetic 2023.1** (tên gọi mới của Epicor ERP từ phiên bản 2021.2 trở đi). Cấu trúc bảng có một số khác biệt so với bản 10.2.400 (ví dụ bổ sung thêm các trường mới, một số bảng đổi cách đặt tên).

📥 [Tải Kinetic 2023.1 Schema Reference (.chm)](/files/epicor/Kinetic_2023.1.chm)

### Diễn đàn EpicorHelp (EpiUsers)

Ngoài tài liệu schema tĩnh, cộng đồng **EpiUsers Help Forum** (thường gọi tắt là "EpicorHelp") là nơi thảo luận, hỏi đáp rất sôi động cho người dùng Epicor 10/Kinetic, Prophet 21, Vantage, Vista... Rất hữu ích khi cần tra cứu tên bảng/field thực tế, cách viết BAQ, BPM hoặc xử lý các tình huống nghiệp vụ cụ thể mà tài liệu chính thức không có ví dụ.

🔗 [EpiUsers Help Forum](https://www.epiusers.help/)

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderLeft: '4px solid var(--ifm-color-primary)',
  borderRadius: '8px',
  padding: '1rem 1.25rem',
  margin: '1.5rem 0',
  background: 'var(--ifm-color-emphasis-100)'
}}>

#### 💡 Cách mở file .chm

File `.chm` (Compiled HTML Help) là định dạng tài liệu chuẩn của Windows, không mở trực tiếp được trên trình duyệt. Sau khi tải về:
- Trên Windows: double-click để mở bằng trình đọc CHM có sẵn (`hh.exe`).
- Nếu Windows chặn nội dung (hiển thị trang trắng): chuột phải vào file → `Properties` → tick chọn `Unblock` ở góc dưới → `Apply`.
- Trên macOS/Linux: dùng phần mềm đọc CHM của bên thứ ba (ví dụ `xCHM`, `CHM Reader`).

</div>

---

## Oracle EBS

Tài liệu chính thống của **Oracle EBS R12** được hãng phân phối công khai qua các kênh tra cứu kỹ thuật trực tuyến:

- **Tài liệu Nghiệp vụ & Cấu hình**: Thư viện Oracle E-Business Suite Documentation Web Library cung cấp đầy đủ cẩm nang hướng dẫn sử dụng, thiết lập (Setup/Implementation Guides) cho toàn bộ các phân hệ từ BOM, WIP, Logistics đến Financials.
  - 📖 [Documentation Web Library - Release 12.1](https://docs.oracle.com/cd/E18727_01/index.htm)
  - 📖 [Documentation Web Library - Release 12.2](https://docs.oracle.com/cd/E26401_01/index.htm)

- **Tài liệu Database & Schema (eTRM)**: Oracle có cung cấp khái niệm **Electronic Technical Reference Manual (eTRM)** — kho tra cứu sơ đồ quan hệ thực thể, mô tả bảng, view, package cho từng phân hệ. Tuy nhiên cần lưu ý: bản eTRM public độc lập tại `etrm.oracle.com` **đã bị Oracle khai tử từ tháng 3/2021**. Hiện tại eTRM chỉ còn 2 cách truy cập:
  - Truy cập **từ bên trong chính instance EBS** đang chạy (cần được cấp trách nhiệm `Electronic Technical Reference Manual (eTRM)` và chạy concurrent program `FND Generate eTRM HTML Report` để sinh báo cáo).
  - Tải patch chứa dữ liệu eTRM tĩnh (dạng HTML offline) thông qua **My Oracle Support** (cần tài khoản MOS có hiệu lực) — tham khảo Knowledge Document `2850246.1` trên MOS.
  - 📖 [Oracle EBS eTRM User's Guide (mô tả chức năng, không phải trang tra cứu trực tiếp)](https://docs.oracle.com/cd/E26401_01/doc.122/f53031/T684058T684061.htm)

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderLeft: '4px solid var(--ifm-color-primary)',
  borderRadius: '8px',
  padding: '1rem 1.25rem',
  margin: '1.5rem 0',
  background: 'var(--ifm-color-emphasis-100)'
}}>

#### ⚠️ Không có bản tra cứu offline miễn phí

Oracle EBS không phát hành schema reference dạng file rời để tải công khai — muốn tra cứu chi tiết bảng/cột cần có quyền truy cập vào instance EBS thật hoặc tài khoản My Oracle Support.

</div>

---

## SAP

SAP thiết kế cấu trúc bảng (ABAP Data Dictionary) để tra cứu **trực tiếp bên trong hệ thống** qua các transaction code chuyên dụng. Tuy nhiên có một số kênh chính thống và cộng đồng hữu ích:

- **Tra cứu trực tiếp trong hệ thống (cách chuẩn nhất):**
  - `SE11` (ABAP Dictionary): xem cấu trúc chi tiết của bảng/view — field, kiểu dữ liệu, khóa chính, khóa ngoại.
  - `SE16` / `SE16N`: xem dữ liệu thực tế đang lưu trong bảng (read-only).
  - `SE84` (Repository Information System): tìm bảng theo từ khóa mô tả, tên field, hoặc data element khi không nhớ chính xác tên bảng.

- **Tài liệu chính thức của SAP:**
  - 📖 [SAP Help Portal](https://help.sap.com/) — tài liệu nghiệp vụ, cấu hình chính thức cho từng module (PP, MM, SD, FI/CO...) của S/4HANA.

- **Cộng đồng hỏi đáp:**
  - 🔗 [SAP Community](https://community.sap.com/) — nơi thảo luận kỹ thuật, hỏi đáp về Data Dictionary, ABAP, cấu hình module.

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderLeft: '4px solid var(--ifm-color-primary)',
  borderRadius: '8px',
  padding: '1rem 1.25rem',
  margin: '1.5rem 0',
  background: 'var(--ifm-color-emphasis-100)'
}}>

#### ⚠️ Không có bản tra cứu offline miễn phí

SAP không phát hành schema reference dạng file rời để tải công khai — muốn tra cứu chi tiết bảng/cột cần có quyền truy cập vào instance SAP thật (qua SE11/SE16N/SE84).

</div>

---

## Odoo

Odoo là mã nguồn mở nên "schema reference" thực chất chính là **mã nguồn model** — rất dễ tra cứu công khai mà không cần tài khoản hay quyền truy cập hệ thống:

- **Tài liệu kỹ thuật chính thức (Developer Documentation):**
  - 📖 [Odoo Developer Reference - ORM API](https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html) — định nghĩa đầy đủ về Models, Fields, Recordsets, các phương thức ORM chuẩn.
  - 📖 [Odoo Developer Documentation - Trang tổng](https://www.odoo.com/documentation/19.0/developer.html)

- **Mã nguồn gốc (nơi tra cứu chính xác nhất tên field/bảng):**
  - 🔗 [github.com/odoo/odoo](https://github.com/odoo/odoo) — kho mã nguồn chính thức; có thể tìm trực tiếp định nghĩa từng model (ví dụ `mrp.workcenter`, `mrp.bom`) trong thư mục `addons/` để biết chính xác tên field, kiểu dữ liệu, quan hệ.

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderLeft: '4px solid var(--ifm-color-primary)',
  borderRadius: '8px',
  padding: '1rem 1.25rem',
  margin: '1.5rem 0',
  background: 'var(--ifm-color-emphasis-100)'
}}>

#### 💡 Lưu ý khi tra cứu

Tên bảng SQL thực tế trong PostgreSQL là tên model đã thay `.` bằng `_` (ví dụ model `mrp.workcenter` → bảng `mrp_workcenter`). Nên đối chiếu đúng version Odoo đang dùng, vì tên field có thể thay đổi giữa các phiên bản (link trên mặc định là bản 19.0 — có thể đổi số version trong URL để xem tài liệu của bản cũ hơn).

</div>

---

## Microsoft Dynamics

Hiện tại **Microsoft Dynamics 365 Finance & Operations (bản cloud đang bán hiện nay)** không phát hành schema reference dạng file rời để tải công khai — cấu trúc bảng (Data Entities/AOT) chỉ có thể tra cứu bên trong môi trường phát triển (Visual Studio + Application Explorer) hoặc dùng công cụ cộng đồng để tự sinh sơ đồ (ví dụ extension [d365fo-entity-schema trên GitHub](https://github.com/noakesey/d365fo-entity-schema)).

Tuy nhiên, với phiên bản tiền nhiệm **Dynamics AX 2012** (bản on-premise cũ, tiền thân của D365 F&O), Microsoft từng phát hành chính thức **1 file Excel liệt kê toàn bộ bảng dữ liệu** — vẫn còn tải được cho tới hiện tại:

### Dynamics AX 2012 - Reference: Tables and Table Groups

File Excel liệt kê tên bảng, nhóm bảng (Table Group), loại bảng, có phải bảng hệ thống hay không, có hiển thị trong Application Object Tree (AOT) hay không, và có phải bảng dùng chung (Shared) hay không — cho toàn bộ **AX 2012**.

📥 [Tải Dynamics AX 2012 - Tables and Table Groups (.xlsx)](/files/AX/Microsoft_Dynamics_AX_2012_Tables_and_Table_Groups.xlsx)
🔗 [Trang tải chính thức trên Microsoft Download Center](https://www.microsoft.com/en-us/download/details.aspx?id=17093)

<div style={{
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderLeft: '4px solid var(--ifm-color-primary)',
  borderRadius: '8px',
  padding: '1rem 1.25rem',
  margin: '1.5rem 0',
  background: 'var(--ifm-color-emphasis-100)'
}}>

#### ⚠️ Lưu ý về phạm vi áp dụng

File này chỉ liệt kê **tên bảng** (không có chi tiết từng field/cột), và chỉ đúng cho **Dynamics AX 2012** — kiến trúc bảng của D365 F&O (bản cloud hiện tại) đã thay đổi khá nhiều so với AX 2012 nên không thể dùng file này để tra cứu 100% chính xác cho bản mới. Cộng đồng Dynamics cũng xác nhận Microsoft hiện không cung cấp bản cập nhật tương đương cho D365 F&O — muốn tra cứu đầy đủ field cần truy cập môi trường dev thật hoặc dùng công cụ reverse-engineering như extension nêu trên.

</div>