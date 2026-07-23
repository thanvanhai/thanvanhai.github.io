---
id: 1010-quan-ly-may-moc-thiet-bi-tooling
title: Quản lý Máy móc, Thiết bị & Khuôn gá (Machine & Tooling)
sidebar_label: 1010 - Quản lý Tooling & Khuôn gá
slug: /erp-nghiep-vu/2-quan-ly-san-xuat/mfg-ky-thuat/1010-quan-ly-may-moc-thiet-bi-tooling
date: 2026-09-03
tags: [erp, manufacturing, oracle-ebs, epicor, sap, odoo, tooling, prt, sql]
---

# Quản lý Máy móc, Thiết bị & Khuôn gá (Machine & Tooling)

Trong các ngành sản xuất như ép nhựa, dập kim loại, đúc áp lực hay cơ khí chính xác, năng lực sản xuất không chỉ phụ thuộc vào máy chính (Machine) mà còn bị giới hạn bởi các công cụ phụ trợ đi kèm như khuôn mẫu (Molds), đồ gá (Jigs), trục dao hay các cối dập (Dies). Đối tượng này được gọi chung là **Công cụ & Thiết bị phụ trợ (Tooling)** hay **Công cụ lực sản xuất (PRT - Production Resources & Tools)**.

Nếu không quản lý chặt chẽ Tooling, hệ thống sẽ gặp tình trạng lập lịch khả thi trên lý thuyết (đủ máy chạy) nhưng thực tế không thể sản xuất vì thiếu khuôn, hoặc khuôn đã hết tuổi thọ an toàn. Bài viết này phân tích kiến trúc thiết kế, luồng nghiệp vụ và cách quản lý Tooling trên các hệ thống **Oracle EBS, Epicor, SAP S/4HANA và Odoo**.

---

## 1. Bản đồ Kiến trúc dữ liệu dưới nền (Database Schema Comparison)

Kiến trúc quản lý Tooling của các hãng ERP lớn phản ánh rõ nét triết lý sản xuất của từng nhà thiết kế hệ thống:

| Thành phần logic | Oracle EBS | Epicor ERP | SAP S/4HANA | Odoo ERP |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất đối tượng** | Coi Tooling là một loại **Resource đặc biệt** thuộc phân hệ BOM/WIP. | Quản lý thông qua phân hệ **Maintenance Management** (Thiết bị) để theo dõi bảo trì và khấu hao vật lý của khuôn. | Coi Tooling là một loại **PRT (Production Resource/Tool)** độc lập, có thể quản lý dưới dạng Thiết bị (Equipment) hoặc Vật tư (Material). | Coi Tooling là một đối tượng **Thiết bị bảo trì (Equipment)** liên kết trực tiếp với Work Center. |
| **Bảng định nghĩa chính (Header)** | `BOM_RESOURCES` (Với loại Resource là `Machine` hoặc `Miscellaneous`). | `Erp.Equip` (Bảng quản lý danh mục thiết bị/khuôn gá). | `CRFH` (PRT Master Data). | `maintenance.equipment` (Bảng quản lý máy móc thiết bị). |
| **Bảng ghi nhận tuổi thọ (Lifecycle)** | Không có bảng chuyên dụng (Thường tích hợp phân hệ Enterprise Asset Management - EAM). | `Erp.Equip_UD` (Bảng custom lưu trữ số lần dập/ép tích lũy - Shot count). | `S061` / `S062` (Hệ thống thông tin PM lưu chỉ số đo lường - Measuring Points). | `maintenance.request` (Ghi nhận số giờ hoạt động hoặc số lần hỏng hóc). |
| **Bảng liên kết quy trình (Routing Link)** | `BOM_OPERATION_RESOURCES` (Khai báo như một tài nguyên thứ cấp trên công đoạn). | `Erp.JobOpOpr` / `Erp.JobOpDtl` (Gán trực tiếp thiết bị/khuôn gá vào các công đoạn của Job sản xuất). | `AFFH` (PRT assignment to Order Operation). | Gán thiết bị trực tiếp vào Work Center thông qua trường `workcenter_id`. |

---

## 2. So sánh luồng thiết lập giao diện (UI Flows Comparison)

### a. Hệ thống Oracle EBS (Quản lý qua mô hình Secondary Resource)
Do Oracle EBS coi khuôn gá là một loại Resource, luồng thiết lập sẽ đi qua các màn hình chuẩn của phân hệ BOM:
1. **Bước 1 (Định nghĩa khuôn):** Vào `BOM > Setup > Resources`, tạo mã khuôn (ví dụ: `MOLD_PLASTIC_01`). Tại đây, chọn `Type` là `Machine` hoặc `Miscellaneous`.
2. **Bước 2 (Gán vào Department):** Vào màn hình Department (ví dụ: Tổ ép nhựa `INJECTION`), gán mã `MOLD_PLASTIC_01` vào phòng ban này để xác định số lượng khuôn khả dụng tại xưởng.
3. **Bước 3 (Thiết lập Routing đa tài nguyên):** Trên màn hình khai báo Quy trình công nghệ (Routing), tại công đoạn Ép nhựa (Operation 10), người dùng gán cả 2 Resource chạy song song:
   - Resource chính: Máy ép nhựa `MC_INJECT_150T`.
   - Resource phụ: Khuôn ép nhựa `MOLD_PLASTIC_01`.

### b. Hệ thống Epicor ERP (Quản lý qua phân hệ Equipment Maintenance)
Epicor quản lý khuôn gá như một thiết bị cần theo dõi bảo dưỡng ngăn ngừa định kỳ:
1. **Bước 1 (Khai báo khuôn):** Truy cập `Production Management > Maintenance Management > Setup > Equipment`, tạo mã khuôn mới. 
2. **Bước 2 (Gán cấu hình kỹ thuật custom):** Trên giao diện thiết lập, người dùng khai báo các trường tùy biến (User-Defined Fields) để lưu trữ thông số khuôn như số lòng khuôn (`Cavity_c`) và tuổi thọ tối đa của khuôn (`MaxShots_c`).
3. **Bước 3 (Gán vào Job sản xuất):** Khi tạo các lệnh sản xuất (Jobs), khuôn gá sẽ được chỉ định vào các công đoạn tương ứng (`Job Operations`) để ràng buộc tài nguyên khi chạy máy.

### c. Hệ thống SAP S/4HANA (Quản lý qua phân hệ PRT - Production Resources/Tools)
SAP quản lý rất chặt chẽ nguồn lực phụ trợ bằng cách chia PRT thành các loại khác nhau:
1. **Bước 1 (Định nghĩa loại PRT):** 
   - Nếu khuôn gá có quản lý tồn kho (cần mua, lưu kho): Tạo bằng mã giao dịch `MM01` (loại vật tư PRT - FHMI).
   - Nếu khuôn gá cần theo dõi bảo trì, hiệu chuẩn chuyên sâu: Tạo bằng mã giao dịch `IE25` (Equipment PRT).
2. **Bước 2 (Gán điểm đo lường - Measuring Point):** Đối với Equipment PRT, tạo một bộ đếm (Counter) để ghi nhận số lần dập thực tế của khuôn.
3. **Bước 3 (Gán vào Routing):** Trong màn hình thiết kế Routing (`CA01`), chọn công đoạn sản xuất, bấm nút `PRT` để gán mã thiết bị phụ trợ vào công đoạn.

### d. Hệ thống Odoo ERP (Quản lý qua mô hình Thiết bị bảo trì)
Odoo tối giản hóa bằng cách liên kết trực tiếp thiết bị với Trung tâm công việc:
1. **Bước 1 (Khai báo thiết bị):** Vào phân hệ `Maintenance > Equipments`, tạo thiết bị mới (ví dụ: `Khuôn đột dập CNC`).
2. **Bước 2 (Gán vị trí):** Trên form thiết bị, tại trường `Work Center`, chọn tổ sản xuất tương ứng (ví dụ: `Tổ dập tấm`).
3. **Bước 3 (Lên lịch bảo trì ngăn ngừa):** Cấu hình trực tiếp tần suất bảo trì trên form thiết bị (ví dụ: cứ sau 100 giờ chạy máy hoặc sau mỗi 3 tháng phải bảo dưỡng khuôn).

---

## 3. Thuật toán Lập lịch Ràng buộc kép (Dual-Constraint Scheduling Logic)

Khi hệ thống tiến hành lập lịch (Scheduling), bài toán phức tạp nhất phát sinh khi có **Ràng buộc kép (Dual-Constraint)**: Máy chính rảnh nhưng khuôn bận, hoặc ngược lại.

### Nguyên lý hoạt động của Công cụ Lập lịch (Scheduler):
1. Hệ thống quét qua Lệnh sản xuất, xác định Công đoạn yêu cầu đồng thời cả Tài nguyên chính $R_{machine}$ và Tài nguyên phụ $R_{tool}$.
2. Bộ lập lịch (ví dụ: ASCP của Oracle hoặc Global Scheduling của Epicor) sẽ kiểm tra lịch hoạt động khả dụng (Calendar) của cả hai tài nguyên.
3. Khoảng thời gian thực thi lệnh sản xuất chỉ được xếp vào **vùng giao thoa (Intersection)** khi cả hai tài nguyên cùng rảnh.

```text
Trục thời gian làm việc (Thứ Hai):
Máy Ép Nhựa 01 (R_machine): ──────────────────[ RẢNH ]──────────────────► (Có thể chạy)
Khuôn Ép Nhựa A (R_tool):    ───[ BẬN ở Job 10 ]───▲───[ RẢNH ]──────────► (Job 10 đang dùng)
                                                   │
Thời điểm xếp Job 11 thực tế:                       └───[ Xếp lịch tại đây ]
```

---

## 4. Giải quyết các bài toán sản xuất thực tế liên quan đến Tooling

### Bài toán 1: Quản lý tuổi thọ và tự động tính Shot Count dựa trên sản lượng Job tại thời điểm đóng Job (Epicor Custom BPM)
*   **Thách thức:** Một bộ khuôn đúc nhựa có thiết kế nhiều lòng khuôn (ví dụ: 1 khuôn gồm 4 lòng khuôn - `Cavity = 4`). Mỗi lần dập (1 Shot) sẽ cho ra 4 sản phẩm. Hệ thống ERP tiêu chuẩn không tự quy đổi sản lượng sản phẩm hoàn thành về số lần dập thực tế của khuôn. Nếu thực hiện cộng dồn liên tục mỗi khi công nhân báo cáo sản lượng trên MES, hệ thống sẽ gặp rủi ro nghẽn ghi dữ liệu (Database Lock).
*   **Giải pháp thực tế tối ưu trên Epicor:**
    1. Trên bảng quản lý thiết bị **`Erp.Equip`**, thiết lập thêm các trường tùy biến lưu trữ trong bảng mở rộng **`Erp.Equip_UD`**:
       - `Cavity_c` (Decimal): Số lòng khuôn (ví dụ: `4.00`).
       - `MaxShots_c` (Decimal): Giới hạn tuổi thọ tối đa của khuôn (ví dụ: `50,000`).
       - `CurrentShots_c` (Decimal): Số lần dập tích lũy hiện tại của khuôn.
    2. Viết một **BPM (Business Process Method)** kích hoạt tại thời điểm **Job Close (Đóng lệnh sản xuất)** (ví dụ: bắt sự kiện phương thức `JobClosing.CloseJob`).
    3. Khi Job được đóng, BPM sẽ tự động tìm kiếm bộ khuôn (`EquipmentID`) được gán cho Job đó, đọc tổng sản lượng hoàn thành của Job (`JobHead.ProdQty`) và thực hiện phép tính quy đổi:
       $$\text{Số Shot tăng thêm (}\Delta\text{Shot)} = \frac{\text{Sản lượng hoàn thành của Job (ProdQty)}}{\text{Số lòng khuôn (Cavity\_c)}}$$
    4. Cập nhật cộng dồn giá trị này một lần duy nhất vào dữ liệu thiết bị:
       $$\text{CurrentShots\_c} = \text{CurrentShots\_c} + \Delta \text{Shot}$$

*   **Mở rộng thực tế: Tính Shot Count theo Công đoạn (Operation) thay vì chỉ theo Job**

    Cách tính ở trên gắn khuôn vào cả một Job và chỉ quy đổi shot count một lần duy nhất khi đóng Job. Cách này đơn giản, nhưng chỉ đúng trong trường hợp một Job chỉ dùng một bộ khuôn cho toàn bộ quá trình sản xuất.

    Trên thực tế, một sản phẩm thường phải trải qua nhiều công đoạn khác nhau (ví dụ: ép nhựa thô → gia công CNC → lắp ráp), và **mỗi công đoạn có thể dùng một bộ khuôn/đồ gá khác nhau**. Nếu chỉ tính shot count theo Job như trên, hệ thống sẽ gộp chung sản lượng của cả Job vào đúng một khuôn được gán ở Job Header — dẫn đến sai lệch: khuôn dùng ở công đoạn 1 (ví dụ khuôn ép thô) và khuôn dùng ở công đoạn 3 (ví dụ khuôn dập hoàn thiện) đều bị cộng dồn số shot như nhau, dù thực tế tần suất sử dụng của chúng khác nhau hoàn toàn.

    Giải pháp chính xác hơn là tính shot count **theo từng công đoạn (Operation-level)** thay vì theo cả Job:

    - Mỗi công đoạn trong quy trình sản xuất (Job Operation) đều phát sinh giao dịch báo cáo sản lượng riêng của nó (ví dụ trong Epicor là bảng `Erp.LaborDtl`, ghi nhận sản lượng hoàn thành — `LaborQty` — tại từng `OpCode` cụ thể).
    - Vì khuôn/đồ gá được gán trực tiếp vào từng công đoạn (không phải vào cả Job), ta hoàn toàn có thể lấy sản lượng báo cáo tại đúng công đoạn đó để quy đổi ra số shot của riêng bộ khuôn đang gán ở công đoạn đó:

      $$\text{Số Shot tăng thêm tại Công đoạn} = \frac{\text{Sản lượng hoàn thành tại Công đoạn (Operation Qty)}}{\text{Số lòng khuôn của bộ khuôn gán tại Công đoạn đó}}$$

    - BPM lúc này nên bắt sự kiện ngay tại thời điểm phát sinh giao dịch báo cáo sản lượng của công đoạn (ví dụ sự kiện lưu `LaborDtl` khi công nhân báo hoàn thành một công đoạn), thay vì đợi đến khi đóng cả Job. Cách làm này cho kết quả chính xác hơn theo thời gian thực, và quan trọng nhất là **tách bạch được tuổi thọ của từng bộ khuôn riêng biệt**, ngay cả khi chúng cùng nằm trong một Job sản xuất.
    - Đánh đổi là độ phức tạp cao hơn: cần đảm bảo BPM chạy đúng và không bị trùng lặp giao dịch (ví dụ trường hợp công nhân báo sản lượng nhiều lần cho cùng một công đoạn, hoặc có báo lỗi/báo hủy sau đó), nên vẫn cần cơ chế kiểm soát cộng dồn cẩn thận tương tự như đã nêu ở giải pháp theo Job.

*   **Điều kiện tiên quyết để tính được Shot Count theo Công đoạn: phải biết khuôn nào đang gán ở công đoạn nào**

    Muốn tính shot count riêng cho từng công đoạn như trên, hệ thống bắt buộc phải biết chính xác **khuôn nào đang được gán ở công đoạn nào** trên `JobOper` — nhưng đây lại là điểm hệ thống chuẩn của Epicor không tự làm tốt. Trên bảng `Erp.JobOper` có sẵn trường lưu mã khuôn (ví dụ trường tùy biến `Shortchar01` — đặt tên hiển thị `MoldingCode (Equip)`), nhưng khi người dùng thực hiện thao tác `GetDetails` từ `AssemblySeq` để hệ thống tự sinh các dòng công đoạn (`JobOper`) cho Job, trường này **không được set mặc định** — kể cả khi các dòng công đoạn đó có `OpCode = "INJ"` (Ép nhựa). Hệ thống lõi không tự động kéo `PartNum` của Assembly xuống từng `JobOper` tương ứng, khiến người lập kế hoạch phải tự tay nhập lại mã khuôn cho từng dòng, dễ sai sót và mất thời gian với các Job có nhiều công đoạn.

    **Giải pháp thực tế (BPM Data Directive + LINQ Query):**
    1. Viết một **BPM Data Directive** bắt sự kiện **Before/After Update** trên bảng `Erp.JobOper` (áp dụng khi các dòng `JobOper` được hệ thống tự sinh ra từ `GetDetails`, thay vì can thiệp vào chính method `GetDetails` — cách này tránh việc phải xử lý logic phức tạp bên trong một method core của hệ thống).
    2. Trong BPM, dùng khối **LINQ Query** để tra cứu ngược từ `JobOper` hiện tại sang bảng `Erp.JobAsmbl` (bảng lưu thông tin các Assembly của Job), lấy đúng `PartNum` của Assembly mà dòng `JobOper` đó thuộc về, dựa trên khóa liên kết `Company + JobNum + AssemblySeq`:
       ```csharp
       (from asm in Db.JobAsmbl.With(LockHint.NoLock) 
        where asm.Company == ttJobOperRow.Company 
          && asm.JobNum == ttJobOperRow.JobNum 
          && asm.AssemblySeq == ttJobOperRow.AssemblySeq
        select asm.PartNum).DefaultIfEmpty("").First()
       ```
    3. Đặt điều kiện chỉ áp dụng phép gán này khi `ttJobOperRow.OpCode == "INJ"`, rồi gán kết quả PartNum tra được vào trường `MoldingCode (Equip)` (`Shortchar01`) của chính dòng `JobOper` đó. Từ đây, BPM tính shot count theo công đoạn ở trên mới có đủ dữ liệu để biết chính xác khuôn nào đang chạy ở công đoạn nào.
    4. Ưu tiên xử lý bằng **BAQ Update trong BPM** hoặc **Update Field trực tiếp trong LINQ** thay vì dùng khối **Execute Custom Code (C#)** — vì Execute Custom Code có thể duyệt qua toàn bộ `JobOper` một cách vô điều kiện, tốn tài nguyên và khó kiểm soát hơn so với việc set giá trị đúng ngay tại dòng dữ liệu vừa được sinh ra.

    > **Ghi chú:** Đây là hạn chế thực tế đã được ghi nhận trên [Epicor User Help Forum](https://www.epiusers.help/t/how-to-default-value-in-all-joboper-with-opcode-inj-when-executing-getdetails-method-in-assemblyseq-0-for-all-erp-jobentry-getdetails/105966) — bản thân trường `PartNum` trên `JobOper` thường để trống sau khi `GetDetails` chạy, dù dữ liệu Assembly (`JobAsmbl`) đã có sẵn `PartNum` tương ứng.

    **Hình minh họa toàn bộ quá trình xử lý (từ thiết lập BPM ban đầu, phát hiện vấn đề, đến giải pháp cuối cùng):**

    *Bước 1 — Thiết lập BPM Data Directive ban đầu trên `JobOper`:*

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/6/c/6c5a86b12db4a4a7e9ea0fb3fede07aa6d59b02a.png" alt="Cấu hình BPM Data Directive trên JobOper" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/6/d/6d4fd07dddb70af61ac2e2cbd76e0e78ba2a5097.png" alt="Chi tiết điều kiện và hành động trong BPM" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    *Bước 2 — Vấn đề phát sinh: khi tạo Job và chạy `GetDetails` từ `AssemblySeq`, các dòng `JobOper` có `OpCode = "INJ"` không được set mặc định mã khuôn:*

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/c/3/c307433f12e5fe8b3f6c5e388aa4e03304ef67b4.png" alt="GetDetails không tự set mặc định MoldingCode cho các dòng JobOper OpCode INJ" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    *Bước 3 — Debug: kiểm tra việc BPM có duyệt qua bảng `JobAsmbl` để lấy các dòng Assembly hay không:*

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/6/a/6a04921d078706f93f2e5a50dee63ea8c603de49.png" alt="Kiểm tra BPM duyệt qua bảng JobAsmbl để lấy dữ liệu Assembly" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/0/8/08bf3d36386bd09be8b13b1ba476768586297773.png" alt="Chi tiết dữ liệu JobAsmbl khi debug" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    *Bước 4 — Giải pháp cuối: dùng LINQ Query lấy `PartNum` từ `JobAsmbl` theo đúng `AssemblySeq`:*

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/3/f/3fed3c2a4b6b013543a9b301cfc276a5653dd089.png" alt="Đoạn LINQ Query tra cứu PartNum từ JobAsmbl" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    *Bước 5 — Gán kết quả PartNum vừa tra được xuống trường MoldingCode (Equip) của JobOper có OpCode INJ:*

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/c/2/c24f2ce4fc7caeecf91b7cc1fb1aa67e0160530a.png" alt="LINQ Query gán MoldingCode (Equip) xuống JobOper theo OpCode INJ" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    *Bước 6 — Kết quả sau cùng: trường MoldingCode (Equip) trên JobOper đã được set đúng theo mã Assembly tương ứng:*

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/e/e/eea41dc1990bf9536f7186f237c374b3c3e3d4ae.png" alt="Kết quả cuối cùng: JobOper đã có MoldingCode được set tự động" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    <p align="center">
      <img src="https://www.epiusers.help/uploads/default/original/3X/6/a/6a95af6a946ca4bc35083db55bded8e9f9d9fc89.png" alt="Kiểm tra lại kết quả trên nhiều dòng JobOper khác nhau" style={{maxWidth: '700px', width: '100%', borderRadius: '8px', border: '1px solid var(--ifm-color-emphasis-300)'}} />
    </p>

    *(Nguồn ảnh: [Epicor User Help Forum](https://www.epiusers.help/t/how-to-default-value-in-all-joboper-with-opcode-inj-when-executing-getdetails-method-in-assemblyseq-0-for-all-erp-jobentry-getdetails/105966).)*

---

### Bài toán 2: Chuyển đổi trạng thái khuôn và chặn lập lịch khi bảo trì ngăn ngừa (Preventive Maintenance Locking)

*   **Thách thức:** Khi khuôn mẫu được đưa đi bảo dưỡng định kỳ hoặc sửa chữa đột xuất, làm thế nào để bộ phận Kế hoạch không vô tình xếp lịch sản xuất vào bộ khuôn đó, gây chồng chéo và chậm trễ tiến độ giao hàng?
*   **Giải pháp thực tế trên các hệ thống:**
    *   **Trong Epicor:** Trên bảng `Erp.Equip`, hệ thống có trường trạng thái hoạt động tiêu chuẩn (`Active`). Khi phòng Cơ điện tạo một yêu cầu bảo trì (Maintenance Request) hoặc lệnh sửa chữa (Maintenance Job) cho khuôn, một BPM sẽ tự động cập nhật trường `Active = 0`. Khi đó, công cụ lập lịch APS của Epicor sẽ tự động bỏ qua bộ khuôn này khỏi danh sách tài nguyên khả dụng và xếp các Job sử dụng khuôn này lùi lại sau ngày dự kiến hoàn thành bảo trì.
    *   **Trong Oracle EBS & SAP:**
        *   Oracle EBS sử dụng tích hợp phân hệ EAM để tự động đưa năng lực (Capacity Units) của Resource khuôn về 0 khi có lệnh sửa chữa.
        *   SAP S/4HANA sử dụng trạng thái hệ thống (System Status) của Equipment PRT. Khi trạng thái chuyển sang `INAC` (Inactive) hoặc `MSPT` (In maintenance), hệ thống sẽ chặn đứng việc gán PRT này vào bất kỳ lệnh sản xuất mới nào ở bước kiểm tra năng lực (Availability Check).

## 5. Các câu lệnh SQL truy vấn kiểm tra dữ liệu Tooling

### a. Trên hệ thống Oracle EBS (PL/SQL)
Kiểm tra danh sách các khuôn gá/thiết bị phụ trợ đang được gán vào các công đoạn trên Quy trình công nghệ (Routing) của sản phẩm:

```sql
SELECT 
    ood.organization_code AS "Org Code",
    msib.segment1 AS "Assembly Item",
    msib.description AS "Assembly Description",
    bos.operation_seq_num AS "Op Seq",
    bd.department_code AS "Dept Code",
    br.resource_code AS "Tooling Code",
    br.description AS "Tooling Description",
    DECODE(br.resource_type, 1, 'Machine', 4, 'Miscellaneous') AS "Tool Type",
    bor.assigned_units AS "Required Units"
FROM 
    apps.bom_operation_resources bor
INNER JOIN apps.bom_resources br ON bor.resource_id = br.resource_id
INNER JOIN apps.bom_operation_sequences bos ON bor.operation_sequence_id = bos.operation_sequence_id
INNER JOIN apps.bom_operational_routings bor_route ON bos.routing_sequence_id = bor_route.routing_sequence_id
INNER JOIN apps.mtl_system_items_b msib ON bor_route.assembly_item_id = msib.inventory_item_id 
                                       AND bor_route.organization_id = msib.organization_id
INNER JOIN apps.bom_departments bd ON bos.department_id = bd.department_id
INNER JOIN apps.org_organization_definitions ood ON bor_route.organization_id = ood.organization_id
WHERE 
    -- Lọc các Resource đóng vai trò là Tooling/Khuôn gá (thường đặt mã bắt đầu bằng MOLD hoặc TOOL)
    (br.resource_code LIKE 'MOLD%' OR br.resource_code LIKE 'TOOL%')
    AND ood.organization_code = 'V1'
ORDER BY 
    msib.segment1, bos.operation_seq_num;
```

### b. Trên hệ thống Epicor ERP (SQL Server - Quản lý qua Equipment & Custom UD Fields)
Kiểm tra trạng thái hao mòn và khấu hao tuổi thọ khuôn dựa trên các trường custom trong bảng mở rộng **`Erp.Equip_UD`**:

```sql
SELECT 
    eq.Company,
    eq.EquipID AS [Mold Code],
    eq.Description AS [Mold Name],
    eq.EquipTypeID AS [Equipment Type],
    -- Đọc dữ liệu từ bảng custom liên kết
    equd.Cavity_c AS [Cavity Count],
    equd.MaxShots_c AS [Max Life Cycles (Shots)],
    equd.CurrentShots_c AS [Current Actual Shots],
    (equd.MaxShots_c - equd.CurrentShots_c) AS [Remaining Shots],
    -- Tính tỷ lệ hao mòn thực tế của khuôn
    CASE 
        WHEN equd.MaxShots_c > 0 THEN ROUND((CAST(equd.CurrentShots_c AS FLOAT) / CAST(equd.MaxShots_c AS FLOAT)) * 100, 2)
        ELSE 0 
    END AS [Wear Percentage (%)],
    -- Đưa ra trạng thái cảnh báo bảo dưỡng
    CASE 
        WHEN equd.CurrentShots_c >= equd.MaxShots_c THEN 'EXPIRED - LOCK SCHEDULING'
        WHEN equd.CurrentShots_c >= (equd.MaxShots_c * 0.9) THEN 'WARNING - NEED MAINTENANCE'
        ELSE 'SAFE'
    END AS [Health Status]
FROM 
    Erp.Equip eq
LEFT JOIN 
    Erp.Equip_UD equd ON eq.SysRowID = equd.ForeignSysRowID
WHERE 
    eq.Active = 1 
    AND eq.EquipTypeID IN ('MOLD', 'TOOL', 'JIG') -- Chỉ lọc các thiết bị là khuôn mẫu, đồ gá
ORDER BY 
    [Wear Percentage (%)] DESC;
```

### c. Trên hệ thống SAP S/4HANA (HANA SQL)
Truy vấn các khuôn mẫu được quản lý dưới dạng Equipment PRT để biết chúng đang được gán vào những Lệnh sản xuất (Production Order) nào trong kỳ:

```sql
SELECT 
    f.MANDT AS "Client",
    f.AUFNR AS "Production Order",
    f.VORNR AS "Operation",
    p.FHMNR AS "PRT Equipment ID",
    p.TXT01 AS "PRT Description",
    f.OBJTY AS "Object Type",
    CASE WHEN p.STATUS = 'INAC' THEN 'Inactive/Maintenance' ELSE 'Active' END AS "Tool Status"
FROM 
    saphanadb.AFFH f
INNER JOIN 
    saphanadb.CRFH p ON f.OBJTY = p.OBJTY AND f.OBJID = p.OBJID
WHERE 
    f.MANDT = '100'
ORDER BY 
    f.AUFNR, f.VORNR;
```

### d. Trên hệ thống Odoo ERP (PostgreSQL)
Truy vấn danh mục khuôn mẫu thiết bị phụ trợ liên kết với từng Tổ sản xuất để phục vụ công tác quản trị thiết bị sàn sản xuất:

```sql
SELECT 
    eq.name AS "Tool/Mold Name",
    eq.serial_no AS "Serial/Tag Number",
    wc.name AS "Assigned Work Center",
    eq.effective_date AS "Go-Live Date",
    -- Chu kỳ bảo trì định kỳ (ngày)
    eq.maintenance_interval AS "Maintenance Interval (Days)",
    -- Ngày dự kiến bảo trì tiếp theo
    eq.next_action_date AS "Next Planned Maintenance Date"
FROM 
    maintenance_equipment eq
LEFT JOIN 
    mrp_workcenter wc ON eq.workcenter_id = wc.id
WHERE 
    eq.active = true 
    AND (eq.name ILIKE '%mold%' OR eq.name ILIKE '%khuôn%' OR eq.name ILIKE '%jig%')
ORDER BY 
    eq.next_action_date ASC;
