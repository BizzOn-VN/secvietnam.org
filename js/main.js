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
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwF6YYKXes1a2o883TL1pcqMaoizYnwFOoveuW6_2fJIV0Zxc-XC7q_61Ky2U2yfRSTAw/exec",
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

  /* ---------- 6. Form tư vấn (bản demo tĩnh) ---------- */
  (function leadForm() {
    var form = document.getElementById("leadForm");
    var done = document.getElementById("leadDone");
    var reset = document.getElementById("leadReset");
    if (!form || !done) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var old = form.querySelector(".form-error");
      if (old) old.remove();
      form.querySelectorAll(".field-error").forEach(function (el) {
        el.classList.remove("field-error");
      });

      var missing = [];
      ["name", "phone"].forEach(function (n) {
        var f = form.elements[n];
        if (!f.value.trim()) {
          f.classList.add("field-error");
          missing.push(n === "name" ? "Họ và tên" : "Điện thoại / Zalo");
        }
      });

      if (missing.length) {
        var p = document.createElement("p");
        p.className = "form-error";
        p.textContent = "Vui lòng nhập: " + missing.join(", ") + ".";
        form.insertBefore(p, form.lastElementChild.previousElementSibling);
        return;
      }

      // Chưa cấu hình SCRIPT_URL → chế độ demo, chỉ hiển thị đã nhận.
      if (!FORM_CONFIG.SCRIPT_URL) {
        form.hidden = true;
        done.hidden = false;
        return;
      }

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
        website: form.elements.website ? form.elements.website.value : "", // honeypot
        page: location.href,
        ua: navigator.userAgent
      };

      // Không set Content-Type JSON: để mặc định text/plain thì Apps Script không dính CORS preflight.
      fetch(FORM_CONFIG.SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.result === "ok") {
            form.hidden = true;
            done.hidden = false;
          } else {
            showError((data && data.message) || "Gửi không thành công, vui lòng thử lại.");
          }
        })
        .catch(function () {
          showError("Không kết nối được máy chủ. Vui lòng thử lại hoặc gọi hotline 0906 616 212.");
        })
        .then(function () {
          btn.disabled = false;
          btn.innerHTML = btnHtml;
        });

      function showError(msg) {
        var p = document.createElement("p");
        p.className = "form-error";
        p.textContent = msg;
        form.insertBefore(p, form.lastElementChild.previousElementSibling);
      }
    });

    if (reset) {
      reset.addEventListener("click", function () {
        form.reset();
        done.hidden = true;
        form.hidden = false;
      });
    }
  })();

  /* ---------- 7. Năm ở chân trang ---------- */
  (function year() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
