---
id: 1010-thiet-lap-va-phan-loai-chung-tu-mua-hang
title: Thiết lập và phân loại chứng từ mua hàng (Purchase Document Type Configuration)
sidebar_label: Phân loại chứng từ mua hàng
description: "Hướng dẫn chi tiết cách phân loại, thiết lập và cấu hình các loại chứng từ mua sắm (PR, RFQ, PO, Contract) trên các hệ thống ERP; kiểm soát phê duyệt, quản lý phiên bản thay đổi và ánh xạ dòng dữ liệu sang phân hệ kho và công nợ."
slug: /erp-nghiep-vu/1-chuoi-cung-ung/po-mua-hang/1010-thiet-lap-va-phan-loai-chung-tu-mua-hang
sidebar_position: 1010
date: 2026-11-30
last_update:
  date: 2026-11-30
tags: [erp, procurement, document-types, oracle-ebs, epicor, pr, po, blanket-agreement, sql]
---

# 1010 Cấu hình Chứng từ Mua sắm

Mỗi giao dịch mua sắm trong doanh nghiệp đều có tính chất nghiệp vụ riêng biệt. Việc thiết lập đúng loại chứng từ mua hàng (Document Types / Styles) giúp hệ thống tự động hóa luồng phê duyệt, kiểm soát vòng đời chứng từ và áp dụng đúng các chính sách đối soát hóa đơn kế toán.

---

## 1. Phân loại các nhóm chứng từ mua hàng chính

Trong các hệ thống ERP tiêu chuẩn, chứng từ mua sắm được chia thành 4 nhóm chính với mục đích sử dụng khác nhau:

| Loại chứng từ | Tên kỹ thuật | Mục đích sử dụng |
|---|---|---|
| **Yêu cầu mua hàng** | Purchase Requisition (PR) | Chứng từ nội bộ do các phòng ban tạo ra để đề xuất nhu cầu mua sắm vật tư/dịch vụ. |
| **Yêu cầu báo giá** | Request for Quotation (RFQ) | Chứng từ gửi cho các nhà cung cấp để thu thập thông tin đơn giá, điều khoản thương mại. |
| **Đơn mua hàng tiêu chuẩn** | Standard Purchase Order (Standard PO) | Đơn đặt hàng cụ thể có xác định rõ mặt hàng, số lượng, đơn giá, thời gian và địa điểm giao hàng cụ thể. |
| **Thỏa thuận mua hàng dài hạn** | Blanket / Contract Agreement | Hợp đồng nguyên tắc ký kết với nhà cung cấp trong một thời hạn (ví dụ: 1 năm) nhằm giữ giá cố định, chưa xác định ngày giao hàng cụ thể. |

---

## 2. Điểm giao thoa & Tham chiếu chéo (Cross-linking) sang các phân hệ khác

Chứng từ mua sắm là khởi nguồn cho các giao dịch kho và kế toán công nợ phía sau. Khi thiết lập chứng từ mua hàng, cần chú ý các điểm gán tham chiếu:

### A. Liên kết với phân hệ Tồn kho (INV)
*   **Danh mục Vật tư & UOM:** Dòng chứng từ mua hàng (PO Lines) bắt buộc phải đối chiếu trực tiếp với mã hàng hóa tại [7000 Item Master (thiết lập mã hàng hoá, đơn vị tính)]() và đơn vị tính tại [7010 Đơn vị tính và quy đổi (UOM Conversion)]().
*   **Địa điểm nhận hàng (Ship-to Location):** Vị trí nhận hàng trên PO phải ánh xạ chính xác với danh mục kho bãi đã được cấu hình tại [3030 Quản lý nhiều kho, nhiều địa điểm (Multi-warehouse)]() để sẵn sàng cho luồng [1000 Nhập kho từ mua hàng (Receipt from PO)]().

### B. Liên kết với phân hệ Công nợ phải trả (AP)
*   **Quy tắc đối soát hóa đơn (Invoice Match Option):** Được cấu hình ngay tại cấp độ loại chứng từ PO hoặc dòng PO. Có 2 hình thức đối soát chính được định nghĩa trước khi chuyển sang phân hệ FIN:
    *   *Match to PO (2-Way Match):* Đối chiếu trực tiếp Hóa đơn kế toán với Đơn mua hàng (thường dùng cho dịch vụ, tài sản phi lưu kho).
    *   *Match to Receipt (3-Way Match):* Đối chiếu Hóa đơn kế toán với Phiếu nhập kho thực tế (bắt buộc dùng cho nguyên vật liệu sản xuất, hàng tồn kho).
    *   *Tham khảo luồng nghiệp vụ đối soát:* [3000 Ghi nhận hóa đơn nhà cung cấp từ đơn mua hàng (AP Invoice Match)]().

---

## 3. Hướng dẫn thiết lập thực tế trên các hệ thống ERP

### A. Trên Oracle EBS R12.2.10

Oracle Purchasing quản lý các loại chứng từ rất chặt chẽ thông qua tính năng **Document Types** và **Document Styles** nhằm phân biệt quy trình xử lý.

1.  **Cấu hình Document Types:**
    *   *Đường dẫn:* `Purchasing Super User > Setup > Document > Document Types`
    *   *Nghiệp vụ:* Chọn Operating Unit (OU), chọn loại chứng từ cần thiết lập (ví dụ: `Purchase Order Standard` hoặc `Blanket Purchase Agreement`).
    *   *Các tham số kiểm soát cốt lõi:*
        *   *Owner Can Approve:* Cho phép người tạo chứng từ tự phê duyệt nếu số tiền nằm trong hạn mức của họ.
        *   *Approvals Workflow:* Liên kết với luồng phê duyệt (mặc định sử dụng workflow `PO Approval` hoặc tùy biến qua Oracle AME).
        *   *Archive On:* Xác định thời điểm lưu trữ phiên bản lịch sử của chứng từ (lưu khi duyệt - `Approve` hay khi in - `Print`).
2.  **Cấu hình Document Styles (PO Styles):**
    *   *Đường dẫn:* `Purchasing Super User > Setup > Document > Document Styles`
    *   *Nghiệp vụ:* Tạo ra các biến thể hiển thị của Standard PO. Ví dụ: Tạo Style "Services PO" chỉ cho phép nhập dòng dạng Dịch vụ (Service Lines) và ẩn các trường liên quan đến Số lượng/Kho hàng của Vật tư sản xuất.

### B. Trên Epicor ERP

Epicor quản lý loại chứng từ mua sắm tinh gọn hơn, chủ yếu dựa trên thuộc tính **PO Type** tại màn hình nhập liệu và kiểm soát quyền hạn.

1.  **Cấu hình Loại PO (PO Type):**
    *   *Đường dẫn:* `Material Management > Purchase Management > General Operations > Purchase Order Entry`
    *   *Nghiệp vụ:* Khi khởi tạo PO, người dùng chọn thuộc tính `Type` gồm:
        *   `Standard PO`: Đơn mua hàng thông thường.
        *   `Blanket PO`: Hợp đồng nguyên tắc. Khi chọn loại này, hệ thống mở thêm tab cấu hình hạn mức tổng (Total Amount/Qty Contract) và cho phép giải phóng đơn hàng con (Release Lines).
2.  **Thiết lập Hạn mức phê duyệt theo loại chứng từ (User Purchase Authorizations):**
    *   *Đường dẫn:* `System Setup > Security Maintenance > User Purchase Authorization`
    *   *Nghiệp vụ:* Gán hạn mức phê duyệt tiền tệ tối đa cho từng User đối với từng loại giao dịch (PO thông thường so với Requisition).

---

## 4. Truy vấn SQL đối soát cấu hình chứng từ (SQL Database Audit Queries)

### A. Cho Oracle EBS R12.2.10

Query dưới đây giúp kiểm tra toàn bộ cấu hình điều khiển phê duyệt và workflow của từng loại chứng từ mua sắm theo từng Operating Unit (OU):

> **Lưu ý:** tên cột trong query dưới đây chưa được xác nhận chạy thực tế — bạn nên test trước khi publish, tương tự cách đã kiểm tra Query ở bài 1000.

```sql
SELECT 
    hou.name                        AS operating_unit,
    pdt.document_type_code          AS doc_type,
    pdt.document_subtype            AS doc_subtype,
    pdt.security_level_code         AS security_level,
    pdt.owner_can_approve_flag      AS owner_can_approve,
    pdt.approval_workflow           AS workflow_name,
    pdt.workflow_approval_item_type AS item_type,
    pdt.archive_external_approval_fg AS archive_on_approval
FROM 
    po_document_types_all_b pdt
INNER JOIN 
    hr_operating_units hou ON pdt.org_id = hou.organization_id
WHERE 
    pdt.document_type_code IN ('PO', 'REQUISITION', 'PA')
ORDER BY 
    hou.name, pdt.document_type_code, pdt.document_subtype;
```

### B. Cho Epicor ERP

Do Epicor lưu trữ loại PO trực tiếp trong bảng giao dịch đầu mục (`POHeader`), truy vấn dưới đây giúp kiểm kê nhanh số lượng đơn hàng phát sinh theo từng loại chứng từ (Standard vs Blanket) để đối soát dữ liệu:

```sql
SELECT 
    po.Company,
    CASE po.POType
        WHEN 'S' THEN 'Standard PO'
        WHEN 'B' THEN 'Blanket PO'
        ELSE 'Other'
    END                             AS Purchase_Doc_Type,
    COUNT(po.PONum)                 AS Total_Orders,
    SUM(po.DocOrderAmt)             AS Total_Amount
FROM 
    Erp.POHeader po
WHERE 
    po.Company = 'YOUR_COMPANY_CODE' -- Thay thế bằng mã công ty thực tế
GROUP BY 
    po.Company, po.POType;
```

---

## 5. Kinh nghiệm thực tế khi thiết lập (Best Practices & Pitfalls)

1.  **Kiểm soát chặt chẽ cơ chế Archive (Lịch sử phiên bản):**
    *   *Sự cố:* Trên Oracle EBS, nếu không cấu hình `Archive on Approve`, khi người mua hàng sửa đổi thông tin PO sau khi đã gửi cho nhà cung cấp, hệ thống sẽ ghi đè trực tiếp lên dữ liệu cũ mà không lưu lại phiên bản lịch sử (Revision History). Điều này gây khó khăn cực kỳ lớn cho kế toán công nợ khi đối chiếu chênh lệch hóa đơn sau này.
    *   *Giải pháp:* Luôn đặt trạng thái `Archive on Approve` cho Standard PO để hệ thống tự động tăng số Revision (0, 1, 2...) mỗi khi có thay đổi được phê duyệt lại.
2.  **Sử dụng Blanket Purchase Agreement (BPA) đúng mục đích:**
    *   Tránh lạm dụng tạo Standard PO cho các mặt hàng mua lặp đi lặp lại nhiều lần trong năm. Hãy thiết lập một BPA dài hạn trước để chốt đơn giá với nhà cung cấp. 
    *   Khi có nhu cầu phát sinh thực tế, người mua chỉ cần tạo đơn rút hàng (Release Order / Blanket Release) tham chiếu tới BPA đó. Việc này vừa giúp rút ngắn quy trình phê duyệt vừa đảm bảo giá mua luôn đúng định mức đã đàm phán.