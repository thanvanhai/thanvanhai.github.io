---
title: "AutoIT: Tự động hóa Windows không cần code phức tạp"
date: 2026-04-01 09:00:00 +0700
categories: [Lập trình, AutoIT]
tags: [autoit, automation, windows, scripting, rpa]
author: haicoi
---

## AutoIT là gì?

**AutoIT** là ngôn ngữ scripting miễn phí cho Windows, chuyên dùng để tự động hóa giao diện người dùng (GUI automation). Điểm mạnh là có thể điều khiển bất kỳ ứng dụng Windows nào — kể cả các ứng dụng cũ không có API.

## Cài đặt và bắt đầu

Tải từ [autoitscript.com](https://www.autoitscript.com) → cài AutoIT v3 + SciTE editor đi kèm.

## Ví dụ cơ bản: mở Notepad và gõ text

```autoit
; Mở Notepad
Run("notepad.exe")

; Chờ cửa sổ Notepad xuất hiện
WinWaitActive("Untitled - Notepad")

; Gõ nội dung
Send("Hello from AutoIT!{ENTER}")
Send("Ngày: " & @YYYY & "/" & @MON & "/" & @MDAY)

; Lưu file
Send("^s")  ; Ctrl+S
WinWaitActive("Save As")
ControlSetText("Save As", "", "Edit1", "C:\temp\output.txt")
ControlClick("Save As", "", "Button2")  ; Click Save
```

## Tự động điền form ERP

AutoIT đặc biệt hữu ích khi cần tự động nhập liệu vào các hệ thống ERP cũ không có API:

```autoit
#include <IE.au3>

; Mở trình duyệt và navigate tới ERP
Local $oIE = _IECreate("http://erp-internal/purchase/order/new")
_IELoadWait($oIE)

; Điền số PO
Local $oInput = _IEGetObjById($oIE, "po_number")
_IEFormElementSetValue($oInput, "PO-2026-001")

; Chọn vendor từ dropdown
Local $oSelect = _IEGetObjById($oIE, "vendor_id")
_IEFormElementOptionSelect($oSelect, "Supplier ABC", 1, "byText")

; Submit form
Local $oForm = _IEFormGetObjByIndex($oIE, 0)
_IEFormSubmit($oForm)
```

## Đọc dữ liệu từ Excel và xử lý hàng loạt

```autoit
#include <Excel.au3>
#include <Array.au3>

; Mở file Excel
Local $oExcel = _Excel_Open()
Local $oBook = _Excel_BookOpen($oExcel, @ScriptDir & "\danh_sach.xlsx")
Local $oSheet = $oBook.Worksheets(1)

; Đọc dữ liệu từ hàng 2 (bỏ header)
Local $iRow = 2
Do
    Local $sItemCode = $oSheet.Cells($iRow, 1).Value
    Local $sDescription = $oSheet.Cells($iRow, 2).Value
    Local $fPrice = $oSheet.Cells($iRow, 3).Value

    If $sItemCode = "" Then ExitLoop

    ; Xử lý từng dòng — ví dụ: gọi hàm nhập liệu vào ERP
    ImportItemToERP($sItemCode, $sDescription, $fPrice)

    $iRow += 1
Until False

_Excel_Close($oExcel)
MsgBox(0, "Hoàn thành", "Đã xử lý " & ($iRow - 2) & " dòng.")
```

## Screenshot và so sánh ảnh (Image matching)

```autoit
; Chụp màn hình một vùng
_ScreenCapture_CaptureWnd("C:\temp\screen.bmp", WinGetHandle("[ACTIVE]"))

; Tìm ảnh trên màn hình (PixelSearch)
Local $aPos = PixelSearch(0, 0, @DesktopWidth, @DesktopHeight, 0xFF0000)
If Not @error Then
    MsgBox(0, "Tìm thấy", "Pixel đỏ tại: " & $aPos[0] & ", " & $aPos[1])
EndIf

; Tìm ảnh control button (ImageSearch cần plugin thêm)
; Hoặc dùng WinAPI để tìm control theo class name
Local $hWnd = WinGetHandle("Oracle Forms")
Local $hBtn = ControlGetHandle($hWnd, "", "[CLASS:Button; INSTANCE:3]")
ControlClick($hWnd, "", $hBtn)
```

## Khi nào nên dùng AutoIT?

| Tình huống | Phù hợp? |
|---|---|
| Tự động nhập liệu vào ứng dụng cũ (legacy ERP) | ✅ Rất phù hợp |
| Batch processing hàng trăm record từ Excel | ✅ Phù hợp |
| Tích hợp hệ thống có API | ❌ Dùng Python/Java sẽ tốt hơn |
| Automation web app hiện đại | ❌ Dùng Playwright/Selenium |
| Xây dựng ứng dụng lớn | ❌ Không phù hợp |

## Kết luận

AutoIT là công cụ thực dụng cho các tác vụ automation Windows, đặc biệt trong môi trường doanh nghiệp với nhiều ứng dụng cũ. Với vài chục dòng script, bạn có thể tiết kiệm hàng giờ nhập liệu thủ công mỗi ngày.
