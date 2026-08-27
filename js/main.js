/* ============================================================
   School Enterprise Challenge Việt Nam — tương tác trang chủ
   Không dùng thư viện ngoài.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

      // Bản tĩnh không có server — chỉ hiển thị trạng thái đã gửi.
      form.hidden = true;
      done.hidden = false;
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
