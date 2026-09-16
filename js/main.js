/* ============================================================
   School Enterprise Challenge Việt Nam — tương tác trang chủ
   Không dùng thư viện ngoài.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- CẤU HÌNH FORM → GOOGLE SHEET ----------
     SCRIPT_URL: URL Web App của Apps Script (xem apps-script.gs), dạng
                 https://script.google.com/macros/s/AKfycb.../exec
     TOKEN:      phải TRÙNG với TOKEN trong apps-script.gs.
     Để SCRIPT_URL = "" thì form chạy chế độ demo (chỉ hiện "đã nhận", không gửi đi đâu). */
  var FORM_CONFIG = {
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbw53RT7n-fRWvzavf3Wod8plxUa3sPCjAerjysZbzCZIl5P8SidJz0gnX1hfmF6ienmPQ/exec",
    TOKEN: "token123@x3312ccwdze"
  };

  /* ---------- 1. Header đổi nền khi cuộn ---------- */
  (function header() {
    var el = document.getElementById("siteHeader");
    if (!el) return;
    var onScroll = function () {
      el.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  /* ---------- 2. Menu di động ---------- */
  (function mobileMenu() {
    var btn = document.getElementById("navToggle");
    var panel = document.getElementById("navMobile");
    if (!btn || !panel) return;

    var setIcon = function (open) {
      btn.innerHTML =
        '<svg class="ic ic-lg" viewBox="0 0 24 24"><use href="#' +
        (open ? "i-x" : "i-menu") +
        '"/></svg>';
    };

    btn.addEventListener("click", function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      setIcon(open);
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        panel.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        setIcon(false);
      }
    });
  })();

  /* ---------- 3. Hiện dần khi cuộn tới ---------- */
  (function reveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(function () { el.classList.add("is-visible"); }, delay);
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.05 }
    );

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Bộ dựng chấm chỉ mục dùng chung ---------- */
  function buildDots(container, count, onPick, labelPrefix) {
    container.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", labelPrefix + " " + (i + 1));
      b.dataset.index = String(i);
      b.addEventListener("click", onPick);
      container.appendChild(b);
    }
  }

  function markDots(container, active) {
    Array.prototype.forEach.call(container.children, function (b, i) {
      b.classList.toggle("is-active", i === active);
    });
  }

  /* ---------- 4. Ban cố vấn: chia nhóm & tự chuyển ---------- */
  (function advisors() {
    var root = document.getElementById("advisors");
    var track = document.getElementById("advisorsTrack");
    var nav = document.getElementById("advisorsNav");
    var dots = document.getElementById("advisorsDots");
    if (!root || !track || !nav || !dots) return;

    var cards = Array.prototype.slice.call(track.children);
    var perPage = 5;
    var page = 0;
    var pageCount = 1;
    var timer = null;
    var paused = false;

    function calcPerPage() {
      var w = window.innerWidth;
      return w < 640 ? 2 : w < 1024 ? 3 : 5;
    }

    function render(animate) {
      var start = page * perPage;
      var show = function () {
        cards.forEach(function (c, i) {
          c.style.display = i >= start && i < start + perPage ? "" : "none";
        });
        markDots(dots, page);
      };
      if (animate && !reduceMotion) {
        track.classList.add("is-swapping");
        setTimeout(function () {
          show();
          track.classList.remove("is-swapping");
        }, 220);
      } else {
        show();
      }
    }

    function layout() {
      var next = calcPerPage();
      if (next === perPage && pageCount > 1) return;
      perPage = next;
      pageCount = Math.ceil(cards.length / perPage);
      page = Math.min(page, pageCount - 1);
      nav.hidden = pageCount <= 1;
      buildDots(dots, pageCount, function (e) {
        go(parseInt(e.currentTarget.dataset.index, 10));
      }, "Nhóm cố vấn");
      render(false);
    }

    function go(next) {
      page = ((next % pageCount) + pageCount) % pageCount;
      render(true);
    }

    function restart() {
      clearInterval(timer);
      if (pageCount <= 1 || paused || reduceMotion) return;
      timer = setInterval(function () { go(page + 1); }, 5500);
    }

    nav.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-adv]");
      if (!btn) return;
      go(page + (btn.dataset.adv === "next" ? 1 : -1));
      restart();
    });

    root.addEventListener("mouseenter", function () { paused = true; restart(); });
    root.addEventListener("mouseleave", function () { paused = false; restart(); });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var before = perPage;
        perPage = calcPerPage();
        if (perPage !== before) {
          pageCount = Math.ceil(cards.length / perPage);
          page = Math.min(page, pageCount - 1);
          nav.hidden = pageCount <= 1;
          buildDots(dots, pageCount, function (e) {
            go(parseInt(e.currentTarget.dataset.index, 10));
          }, "Nhóm cố vấn");
          render(false);
        }
      }, 150);
    });

    layout();
    restart();

    /* Hộp tiểu sử: bấm vào thẻ hoặc nút "Xem tiểu sử" */
    var dlg = document.getElementById("advisorDialog");
    var data = window.SEC_ADVISORS || [];
    if (dlg && typeof dlg.showModal === "function" && data.length) {
      var dImg = document.getElementById("advDlgImg");
      var dName = document.getElementById("advDlgName");
      var dTitle = document.getElementById("advDlgTitle");
      var dBio = document.getElementById("advDlgBio");

      function openAdvisor(i) {
        var a = data[i];
        if (!a) return;
        dImg.src = a.img; dImg.alt = a.name;
        dName.textContent = a.name;
        dTitle.innerHTML = a.title;
        dBio.innerHTML = "";
        a.bio.forEach(function (line) {
          var li = document.createElement("li");
          li.innerHTML = line;
          dBio.appendChild(li);
        });
        paused = true; restart();
        dlg.showModal();
      }

      track.addEventListener("click", function (e) {
        var card = e.target.closest("[data-advisor]");
        if (!card) return;
        openAdvisor(parseInt(card.dataset.advisor, 10));
      });
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg || e.target.closest("[data-adv-close]")) dlg.close();
      });
      dlg.addEventListener("close", function () { paused = false; restart(); });
    }
  })();

  /* ---------- 5. Sự kiện: băng chuyền ---------- */
  (function events() {
    var root = document.getElementById("events");
    var dots = document.getElementById("eventsDots");
    if (!root || !dots) return;

    var slides = Array.prototype.slice.call(root.querySelectorAll(".event"));
    if (slides.length === 0) return;

    var index = 0;
    var timer = null;
    var paused = false;

    if (slides.length <= 1) {
      root.querySelectorAll(".event-arrow, .carousel-nav").forEach(function (el) {
        el.hidden = true;
      });
      return;
    }

    buildDots(dots, slides.length, function (e) {
      go(parseInt(e.currentTarget.dataset.index, 10));
      restart();
    }, "Đến sự kiện");

    function go(next) {
      index = ((next % slides.length) + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle("is-active", i === index); });
      markDots(dots, index);
    }

    function restart() {
      clearInterval(timer);
      if (paused || reduceMotion) return;
      timer = setInterval(function () { go(index + 1); }, 6000);
    }

    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-ev]");
      if (!btn) return;
      go(index + (btn.dataset.ev === "next" ? 1 : -1));
      restart();
    });

    root.addEventListener("mouseenter", function () { paused = true; restart(); });
    root.addEventListener("mouseleave", function () { paused = false; restart(); });

    go(0);
    restart();
  })();

  /* ---------- 6. Form tư vấn: validate tại trình duyệt → gửi Google Sheet → popup ----------
     Quy tắc (server Apps Script vẫn kiểm tra lại):
       - Họ tên: bắt buộc, ít nhất 2 từ.
       - Điện thoại: bắt buộc, đúng 10 chữ số, bắt đầu bằng 0.
       - Email, Bạn là, Trường/Tổ chức, Vai trò: bắt buộc; email đúng định dạng.
       - Checkbox đồng ý: bắt buộc. */
  (function leadForm() {
    var form = document.getElementById("leadForm");
    if (!form) return;

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    var PHONE_RE = /^0\d{9}$/;
    var FIELDS = ["name", "phone", "email", "audience", "org", "role", "consent"];

    function fieldBox(el) { return el.closest(".field") || el.parentNode; }

    function showError(el, msg) {
      clearError(el);
      var box = fieldBox(el);
      if (el.type === "checkbox") box.classList.add("field-error-box"); else el.classList.add("field-error");
      var p = document.createElement("p");
      p.className = "field-msg";
      p.textContent = msg;
      box.appendChild(p);
    }

    function clearError(el) {
      var box = fieldBox(el);
      el.classList.remove("field-error");
      box.classList.remove("field-error-box");
      var old = box.querySelector(".field-msg");
      if (old) old.remove();
    }

    function validate(el) {
      var v = (el.value || "").trim();
      switch (el.name) {
        case "name":
          if (!v) return "Vui lòng nhập họ và tên.";
          if (v.split(/\s+/).length < 2) return "Vui lòng nhập đầy đủ họ và tên (ít nhất 2 từ).";
          return null;
        case "phone":
          if (!v) return "Vui lòng nhập số điện thoại / Zalo.";
          if (!/^\d+$/.test(v)) return "Số điện thoại chỉ gồm chữ số.";
          if (!PHONE_RE.test(v)) return "Số điện thoại phải đủ 10 số và bắt đầu bằng 0.";
          return null;
        case "email":
          if (!v) return "Vui lòng nhập email.";
          if (!EMAIL_RE.test(v)) return "Email chưa đúng định dạng (ví dụ: ten@truong.edu.vn).";
          return null;
        case "audience":
          return v ? null : "Vui lòng chọn bạn là Nhà trường hay Phụ huynh.";
        case "org":
          return v ? null : "Vui lòng nhập tên trường / tổ chức.";
        case "role":
          return v ? null : "Vui lòng nhập vai trò của bạn.";
        case "consent":
          return el.checked ? null : "Bạn cần đồng ý điều khoản để tiếp tục.";
      }
      return null;
    }

    // Ô điện thoại: chỉ nhận số, tối đa 10 ký tự
    var phone = form.elements.phone;
    phone.addEventListener("input", function () {
      var digits = phone.value.replace(/\D/g, "").slice(0, 10);
      if (phone.value !== digits) phone.value = digits;
    });

    FIELDS.forEach(function (n) {
      var el = form.elements[n];
      if (!el) return;
      el.addEventListener("blur", function () {
        var msg = validate(el);
        if (msg) showError(el, msg); else clearError(el);
      });
      el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input", function () {
        if (!validate(el)) clearError(el);
      });
    });

    function showFormError(msg) {
      var old = form.querySelector(".form-error");
      if (old) old.remove();
      var p = document.createElement("p");
      p.className = "form-error";
      p.textContent = msg;
      form.insertBefore(p, form.querySelector('button[type="submit"]'));
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var old = form.querySelector(".form-error");
      if (old) old.remove();

      var firstBad = null;
      FIELDS.forEach(function (n) {
        var el = form.elements[n];
        if (!el) return;
        var msg = validate(el);
        if (msg) { showError(el, msg); if (!firstBad) firstBad = el; } else clearError(el);
      });
      if (firstBad) {
        firstBad.focus({ preventScroll: true });
        fieldBox(firstBad).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        return;
      }

      // Chưa cấu hình SCRIPT_URL → chế độ demo
      if (!FORM_CONFIG.SCRIPT_URL) { onSuccess(); return; }

      var btn = form.querySelector('button[type="submit"]');
      var btnHtml = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = "Đang gửi...";

      var payload = {
        token: FORM_CONFIG.TOKEN,
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        email: form.elements.email.value.trim(),
        audience: form.elements.audience.value,
        org: form.elements.org.value.trim(),
        role: form.elements.role.value.trim(),
        message: form.elements.message.value.trim(),
        consent: form.elements.consent.checked ? "yes" : "no",
        website: form.elements.website ? form.elements.website.value : "" // honeypot
      };

      // Không set Content-Type JSON: để mặc định text/plain thì Apps Script không dính CORS preflight.
      fetch(FORM_CONFIG.SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.result === "ok") onSuccess();
          else showFormError((data && data.message) || "Gửi không thành công, vui lòng thử lại.");
        })
        .catch(function () {
          showFormError("Không kết nối được máy chủ. Vui lòng thử lại hoặc gọi hotline 0906 616 212.");
        })
        .then(function () {
          btn.disabled = false;
          btn.innerHTML = btnHtml;
        });
    });

    /* Popup thành công: đóng bằng X / nút Đóng / bấm nền / Esc */
    var modal = document.getElementById("leadModal");

    function onSuccess() {
      form.reset();
      FIELDS.forEach(function (n) { if (form.elements[n]) clearError(form.elements[n]); });
      if (!modal) return;
      modal.classList.remove("tmt-dong");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var b = modal.querySelector(".tmt-modal-dong");
      if (b) b.focus();
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.add("tmt-dong");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    if (modal) {
      modal.querySelectorAll(".tmt-modal-x, .tmt-modal-dong").forEach(function (b) {
        b.addEventListener("click", closeModal);
      });
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modal.classList.contains("tmt-dong")) closeModal();
      });
    }
  })();

  /* ---------- 7. Năm ở chân trang ---------- */
  (function year() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
