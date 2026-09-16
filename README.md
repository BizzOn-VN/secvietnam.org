# School Enterprise Challenge Việt Nam — Landing Page (bản tĩnh)

Bản HTML tĩnh của trang giới thiệu chương trình **School Enterprise Challenge Việt Nam**
(đại diện chính thức: **TOMATO Education**), dùng để xem trước giao diện.

## Chạy thử

Mở thẳng `index.html` bằng trình duyệt, hoặc chạy một web server tĩnh:

```bash
python3 -m http.server 4173
# rồi mở http://localhost:4173
```

## Cấu trúc

```
index.html        # toàn bộ nội dung trang (icon nhúng sẵn dạng SVG)
css/style.css     # giao diện (CSS thuần, không framework)
js/main.js        # tương tác (không dùng thư viện ngoài)
img/              # hình ảnh, định dạng WebP
```

Toàn trang **448 KB**, không gọi ra ngoài một request nào: không CDN, không font
Google, không thư viện, không mã theo dõi. Chữ dùng phông hệ thống nên hiện ngay,
không chờ tải font.

| | |
|---|---|
| Màn hình đầu | 6 request · 103 KB |
| Toàn trang (đã cuộn hết) | 11 request · ~400 KB |
| DOMContentLoaded | ~46 ms |

Ảnh dùng **WebP** và đã hạ về đúng bề rộng cần cho màn retina. Ảnh dưới màn hình đầu
tải trễ (`loading="lazy"`); ảnh hero được nạp sớm (`preload` + `fetchpriority="high"`).
Mọi thẻ `<img>` đều khai báo `width`/`height` nên trang không giật khi ảnh về.

> WebP chạy trên mọi trình duyệt từ 2020 trở đi (Chrome, Edge, Firefox, Safari 14+).
> Nếu bắt buộc phải đỡ cả Safari 13 hoặc cũ hơn thì phải thêm ảnh JPG dự phòng.

## Nội dung trang

Hero · Giới thiệu chương trình · Đơn vị đại diện & Ban cố vấn · Trường đồng hành ·
Hành trình 7 cột mốc + lịch tham gia · Hai lối tham gia (nhà trường / phụ huynh) +
form tư vấn · Dự án tiêu biểu · Hệ thống giải thưởng · Sự kiện sắp diễn ra · Chân trang.

## Tương tác

| Thành phần | Hành vi |
|---|---|
| Thanh điều hướng | Trong suốt ở đầu trang, hiện nền mờ khi cuộn; có menu thu gọn cho màn hình nhỏ |
| Hiệu ứng xuất hiện | Các khối hiện dần khi cuộn tới (`IntersectionObserver`) |
| Ban cố vấn | Băng chuyền 5 / 3 / 2 chân dung theo bề rộng màn hình, tự chuyển 5,5 giây, dừng khi rê chuột |
| Sự kiện | Băng chuyền tự chuyển 6 giây khi có ≥2 sự kiện; 1 sự kiện thì hiển thị tĩnh |

Trang tôn trọng `prefers-reduced-motion`: máy nào tắt hiệu ứng chuyển động thì mọi
animation đều ngưng. Tắt JavaScript thì nội dung vẫn đọc được đầy đủ.

## Lưu ý

- **Form tư vấn** đã nối Google Sheet qua Apps Script (đã test 16/09/2026, xem mục dưới).
  Muốn tạm ngắt thì để `SCRIPT_URL = ""` trong `js/main.js` → form về chế độ demo.
- Chân trang đã điền liên hệ thật của TOMATO (hotline 0906 616 212, info@tomato.edu.vn, fanpage
  facebook.com/TruongTOMATO, 329/5 Nguyễn Trọng Tuyển, P. Phú Nhuận, TP.HCM).
- **Ban cố vấn** đã dùng thông tin thật (5 người, nguồn `hinh anh - noi dung/PROFILE BAN CỐ VẤN SEC.md`);
  bấm vào thẻ mở hộp tiểu sử (`<dialog>` chuẩn, dữ liệu nằm ở `window.SEC_ADVISORS` cuối `index.html`).
  Muốn thêm/sửa người: sửa cả thẻ `<figure class="advisor">` lẫn mảng `SEC_ADVISORS`.
- **Trường đồng hành**: hiện có 1 trường (Einstein School HCM, `img/logo-einstein-school.webp`). Khối `.partners-grid`
  tự xếp lưới khi thêm thẻ `.partner-card` mới.
- **Dự án tiêu biểu** dùng Top 3 giải toàn cầu (nguồn `hinh anh - noi dung/Top 3 dự án.docx.md`), ảnh poster 4:5
  `img/project-*.webp`. **Sự kiện** hiện chỉ có 1 buổi giới thiệu (17/09/2026, Zoom, nguồn file `🌍 BUỔI GIỚI THIỆU...docx.md`),
  layout `.event-single` poster dọc trên nền mờ; JS tự ẩn nút chuyển khi chỉ có 1 sự kiện, thêm `<article class="event">`
  thứ 2 là băng chuyền chạy lại.

## Form → Google Sheet (cài 5 phút)

```
index.html (form) → js/main.js fetch POST → Apps Script Web App → Google Sheet (+ email báo)
```

1. Tạo Google Sheet mới, ví dụ **"SEC Vietnam - Leads"** (tài khoản nào tạo thì email báo gửi từ tài khoản đó).
2. Trong Sheet: **Extensions → Apps Script**, xoá code mẫu, dán toàn bộ file `apps-script.gs`.
3. Sửa 2 dòng đầu mục CẤU HÌNH trong Apps Script:
   - `TOKEN`: đặt một chuỗi bí mật bất kỳ ≥ 20 ký tự.
   - `MAIL_TO`: email nhận thông báo (đang để `info@tomato.edu.vn`, để `''` nếu không cần).
4. Chọn hàm **`setup`** trên thanh công cụ → **Run** → cấp quyền khi Google hỏi. Tab `Leads` với dòng tiêu đề sẽ được tạo.
5. **Deploy → New deployment** → loại **Web app** → *Execute as:* **Me**, *Who has access:* **Anyone** → Deploy → copy URL `https://script.google.com/macros/s/…/exec`.
6. Mở `js/main.js`, mục **CẤU HÌNH FORM → GOOGLE SHEET** (ngay đầu file):
   - `SCRIPT_URL`: dán URL vừa copy.
   - `TOKEN`: dán đúng chuỗi đã đặt ở bước 3.
7. Đẩy code lên, mở web, gửi thử 1 form → kiểm tra Sheet có dòng mới và email báo.

Cột trong Sheet: Thời gian · Họ tên · Điện thoại/Zalo · Email · Bạn là · Trường/Tổ chức · Vai trò ·
Nội dung · **Trạng thái** (TOMATO tự đổi tay: Mới / Đã gọi / Đã tư vấn / Bỏ) · Trang gửi · Trình duyệt.

Đã có sẵn: token chống spam vãng lai, ô honeypot ẩn chống bot, kiểm tra SĐT/email, cắt độ dài,
chặn cùng SĐT gửi lặp trong 60 giây, LockService tránh ghi đè. Token nằm trong JS client nên
người rành vẫn đọc được — đủ chặn bot vãng lai, không phải bảo mật tuyệt đối; cần chặt hơn thì thêm reCAPTCHA.

Chỗ dễ vấp: sửa code Apps Script xong **phải Deploy lại** (Manage deployments → ✎ → Version: New version),
nếu không URL vẫn chạy code cũ. Mở URL `/exec` trên trình duyệt thấy dòng `SEC Vietnam lead endpoint OK` là deploy sống.
