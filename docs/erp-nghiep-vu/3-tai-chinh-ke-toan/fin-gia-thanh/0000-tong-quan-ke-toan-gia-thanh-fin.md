---
id: tong-quan-ke-toan-gia-thanh-fin
title: Tổng quan Kế toán Giá thành (Product Costing)
sidebar_label: Tổng quan Giá thành (CO-PC)
slug: /erp-nghiep-vu/3-tai-chinh-ke-toan/fin-gia-thanh/tong-quan
sidebar_position: 1
date: 2026-07-21
tags: [erp, finance, controlling, costing, product-costing, standard-cost, actual-cost, variance, wip, by-product, subcontracting, landed-cost, tong-quan, roadmap]
---

# Tổng quan Kế toán Giá thành (Product Costing)

Trang này tổng hợp lộ trình các bài viết nghiên cứu chuyên sâu về nghiệp vụ **Kế toán Giá thành sản phẩm (Product Costing)** trong hệ thống ERP doanh nghiệp. Phân hệ này chịu trách nhiệm thu thập, phân bổ toàn bộ chi phí sản xuất trực tiếp và gián tiếp, tính toán chi phí dở dang (WIP), xác định giá thành thực tế cuối kỳ và phân tích các khoản chênh lệch so với định mức kỹ thuật.

Các mục dưới đây sẽ được cập nhật liên kết dần sau khi bài viết tương ứng được hoàn thành.

## 1. Thiết lập cấu trúc & Giá thành định mức (Costing Setup & Standard Cost)

- [ ] [1000 - Cấu hình thành phần chi phí sản xuất, trung tâm chi phí và tài khoản giá thành (Cost Components, Cost Centers & Posting Setup)]()
- [ ] [1010 - Quy trình tính toán, cập nhật và phát hành giá thành định mức hàng năm (Standard Cost Rollup, Marking & Releasing)]()
- [ ] [1020 - Mô phỏng tác động giá thành trước khi phát hành định mức mới (Costing Simulation & What-if Analysis)]()

## 2. Thu thập chi phí thực tế & Phân bổ chi phí chung (Cost Accumulation & Absorption)

- [ ] [2000 - Quy trình thu thập và ghi nhận chi phí nguyên vật liệu trực tiếp thực tế vào lệnh sản xuất (Direct Material Cost Ingestion)]()
- [ ] [2010 - Quy trình thu thập, định giá và phân bổ chi phí nhân công trực tiếp (Direct Labor Cost Allocation)]()
- [ ] [2020 - Phương pháp phân bổ chi phí sản xuất chung gián tiếp và chi phí khấu hao máy móc (Overhead Allocation & Cost Pools)]()
- [ ] [2030 - Phương pháp phân bổ chi phí gián tiếp theo hoạt động thay cho phân bổ truyền thống (Activity-Based Costing - ABC)]()
- [ ] [2040 - Nghiệp vụ tính giá thành cho công đoạn gia công ngoài và tích hợp chi phí thầu phụ (Outside Processing / Subcontracting Costing)]()

## 3. Tính toán sản phẩm dở dang & Giá thành thực tế (WIP & Actual Costing)

- [ ] [3000 - Quy trình tính toán giá trị sản phẩm dở dang cuối kỳ kế toán (Work in Process - WIP Calculation)]()
- [ ] [3010 - Các phương pháp tính giá thành thực tế cuối kỳ (Actual Costing Methods: Job Costing, Process Costing & Material Ledger)]()
- [ ] [3020 - Nghiệp vụ phân bổ chi phí giữa sản phẩm chính, phụ phẩm và xử lý giá trị phế phẩm thu hồi (By-product & Scrap Costing)]()

## 4. Phân tích chênh lệch & Kết chuyển giá vốn (Variance Analysis & Settlement)

- [ ] [4000 - Phân tích chi tiết các loại chênh lệch giá thành thực tế so với định mức (Material/Labor/Overhead Variance Analysis)]()
- [ ] [4010 - Nghiệp vụ kết chuyển chênh lệch giá thành vào giá vốn hàng bán và tồn kho cuối kỳ (Variance Settlement & Posting)]()

## 5. Chi phí cấu thành giá vốn khác (Landed Cost & Additional Cost Absorption)

- [ ] [5000 - Phân bổ chi phí vận chuyển, thuế nhập khẩu và bảo hiểm vào giá vốn nguyên vật liệu nhập khẩu (Landed Cost Allocation)]()

## 6. Đối soát & Phân tích biên lợi nhuận (Costing Reconciliation & Profitability)

- [ ] [6000 - Quy trình đối chiếu chi phí dở dang WIP, Giá vốn hàng bán với Sổ cái (WIP & COGS to GL Reconciliation)]()
- [ ] [6010 - Thiết lập báo cáo phân tích biên lợi nhuận gộp theo sản phẩm, đơn hàng và khách hàng (Gross Margin & Profitability Analysis)]()
- [x] [6020 - Cái Bẫy "Current Cost": Vì Sao Báo Cáo Giá Thành Của Bạn Có Thể Đang Sai Mà Không Ai Biết](./6020-cai-bay-current-cost-gia-thanh.md)

## 7. Lỗi thường gặp & Giải pháp khắc phục (Troubleshooting & Exceptions)

- [ ] [7000 - Xử lý lỗi lệch chi phí giá thành do định mức BOM/Routing kỹ thuật sai lệch thực tế (BOM/Routing Discrepancy Correction)]()
- [ ] [7010 - Khắc phục sự cố không thể đóng lệnh sản xuất và treo chi phí dở dang WIP (Unclosed WIP & Order Settlement Errors)]()

---

## Ghi chú đặc thù theo từng hệ thống ERP

Tính toán giá thành sản phẩm là một trong những nghiệp vụ phức tạp nhất trong ERP, đòi hỏi mức độ tích hợp dữ liệu hoàn hảo từ kho (INV), mua hàng (PO), kỹ thuật (MFG-TECH), thực thi (MFG-Execution) đến sổ cái (GL). Dưới đây là đặc điểm của các hệ thống:

| Hệ thống | Điểm mạnh / đặc trưng cần lưu ý |
|---|---|
| **SAP S/4HANA** | Phân hệ **CO-PC (Product Costing)** kết hợp với công cụ **Material Ledger (ML)** là giải pháp giá thành mạnh nhất thế giới. ML cho phép doanh nghiệp vừa duy trì giá thành định mức (Standard Cost) hàng ngày để định biên kiểm soát, vừa tự động thu thập chênh lệch để tính toán lại giá thành thực tế (Actual Cost / Periodic Unit Price) cuối tháng, đồng thời tự động phân bổ phần chênh lệch này ngược lại vào Giá vốn hàng bán (COGS) và Tồn kho cuối kỳ. Chi phí gia công ngoài được quản lý qua loại đơn hàng đặc biệt (Subcontracting PO) tích hợp trực tiếp với MM và CO-PC. |
| **Oracle EBS** | Phân hệ **Oracle Cost Management (CST)** hỗ trợ nhiều phương pháp tính giá thành: Standard, Average, LIFO, FIFO và Periodic Costing. EBS sử dụng 5 thành phần chi phí cốt lõi (Cost Elements): Material, Material Overhead, Resource, Outside Processing, và Overhead để cấu thành giá trị sản phẩm - Outside Processing được coi là một thành phần chi phí độc lập ngay từ thiết kế gốc. Toàn bộ chênh lệch giá mua hàng (PPV - Purchase Price Variance) và chênh lệch sản xuất được ghi nhận rất chi tiết. |
| **Epicor** | Cực kỳ mạnh về **Job Costing** (tính giá thành theo lệnh sản xuất/dự án). Do đặc thù phục vụ sản xuất theo đơn đặt hàng (MTO/ETO), Epicor tích lũy chi phí thực tế (NVL, nhân công, thầu phụ gia công ngoài) trực tiếp vào từng Job dở dang thời gian thực ngay khi có giao dịch quẹt thẻ lao động hoặc nhận hàng. Toàn bộ chênh lệch sản xuất được tự động hạch toán ghi giảm WIP khi thực hiện thao tác Đóng lệnh sản xuất (Job Closing). |
| **Odoo** | Hỗ trợ tính giá thành sản phẩm dựa trên phương pháp Standard Price, AVCO (Giá bình quân) hoặc FIFO được cấu hình tại Nhóm sản phẩm (Product Category). Odoo tập trung vào sự tinh gọn: giá trị thành phẩm nhập kho được tính dựa trên BOM định mức cộng với chi phí nhân công/máy móc tạm tính từ các Lệnh công việc (Work Orders). Odoo thiếu một công cụ phân bổ chi phí gián tiếp (Overhead Allocation/Absorption Engine) nhiều bước phức tạp, do đó doanh nghiệp quy mô sản xuất lớn thường cần viết thêm module tùy biến hoặc phân bổ thủ công bằng tay cuối kỳ. Landed cost được hỗ trợ qua tính năng riêng biệt (Landed Costs) khá trực quan. |
| **Microsoft Dynamics 365 F&O** | Sử dụng module **Cost Accounting** tách biệt với Production Control, cho phép mô hình hóa dòng chảy chi phí (Cost Accounting Ledger) độc lập với Sổ cái tài chính để chạy các kịch bản phân bổ ABC linh hoạt. Hỗ trợ tốt tính giá thành theo BOM/Route đa cấp và landed cost thông qua module Procurement & Sourcing tích hợp sẵn. |
| **NetSuite** | Hỗ trợ Standard Costing và Average Costing gắn với Manufacturing module, phù hợp doanh nghiệp sản xuất quy mô vừa. Việc phân bổ overhead phức tạp nhiều bước hoặc Material Ledger kiểu SAP thường cần bổ sung qua SuiteApp hoặc tùy biến SuiteScript, tương tự hạn chế mà Odoo gặp phải. |