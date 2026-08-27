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

Hero · Giới thiệu chương trình · Đơn vị đại diện & Ban cố vấn · Dải logo trường ·
Hành trình 7 cột mốc + lịch tham gia · Hai lối tham gia (nhà trường / phụ huynh) +
form tư vấn · Dự án tiêu biểu · Hệ thống giải thưởng · Sự kiện sắp diễn ra · Chân trang.

## Tương tác

| Thành phần | Hành vi |
|---|---|
| Thanh điều hướng | Trong suốt ở đầu trang, hiện nền mờ khi cuộn; có menu thu gọn cho màn hình nhỏ |
| Hiệu ứng xuất hiện | Các khối hiện dần khi cuộn tới (`IntersectionObserver`) |
| Ban cố vấn | Băng chuyền 5 / 3 / 2 chân dung theo bề rộng màn hình, tự chuyển 5,5 giây, dừng khi rê chuột |
| Dải logo trường | Chạy ngang liên tục, dừng khi rê chuột |
| Sự kiện | Băng chuyền tự chuyển 6 giây, có nút trước/sau và chấm chỉ mục |

Trang tôn trọng `prefers-reduced-motion`: máy nào tắt hiệu ứng chuyển động thì mọi
animation đều ngưng. Tắt JavaScript thì nội dung vẫn đọc được đầy đủ.

## Lưu ý

- **Form tư vấn chỉ là demo**: bản tĩnh không có server, bấm gửi chỉ hiện thông báo
  đã nhận — dữ liệu không được lưu và không gửi đi đâu cả.
- Số điện thoại, website/fanpage ở chân trang còn là chỗ trống (`[Số điện thoại / Zalo]`,
  `[website / fanpage]`) — cần điền thông tin thật trước khi công bố.
- Danh sách **Ban cố vấn** và **logo trường** là dữ liệu minh họa, thay bằng thông tin
  thật khi có.
- Sự kiện và dự án đang để cứng trong `index.html`; muốn nội dung tự cập nhật thì
  dùng bản Next.js kèm trang quản trị.
