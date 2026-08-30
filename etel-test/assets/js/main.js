(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: stato scrolled + menu mobile ---------- */
  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  var backTop = document.querySelector(".back-top");

  var heroImg = document.querySelector(".hero-photo img");
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 24);
    if (backTop) backTop.classList.toggle("show", y > 700);
    if (heroImg && !reduceMotion && window.innerWidth > 720) {
      heroImg.style.transform = "translateY(" + Math.min(y * 0.12, 90) + "px) scale(1.06)";
    }
    drawTimeline();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal allo scroll ---------- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var rvObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); rvObs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    rvEls.forEach(function (el) { rvObs.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Reveal parola per parola (hero) ---------- */
  var wr = document.querySelector("[data-words]");
  if (wr) {
    var words = wr.textContent.trim().split(/\s+/);
    wr.textContent = "";
    words.forEach(function (w, i) {
      var s = document.createElement("span");
      s.className = "w";
      s.style.transitionDelay = (0.15 + i * 0.09) + "s";
      s.textContent = w;
      wr.appendChild(s);
      if (i < words.length - 1) wr.appendChild(document.createTextNode(" "));
    });
    if (reduceMotion) wr.classList.add("in");
    else requestAnimationFrame(function () { requestAnimationFrame(function () { wr.classList.add("in"); }); });
  }

  /* ---------- Timeline che si disegna ---------- */
  var tl = document.querySelector(".tl");
  var tlFill = document.querySelector(".tl-rail i");
  function drawTimeline() {
    if (!tl || !tlFill || reduceMotion) return;
    var r = tl.getBoundingClientRect();
    var vh = window.innerHeight;
    var progress = (vh * 0.75 - r.top) / r.height;
    progress = Math.max(0, Math.min(1, progress));
    tlFill.style.transform = "scaleY(" + progress + ")";
    tl.querySelectorAll(".tl-item").forEach(function (it) {
      var ir = it.getBoundingClientRect();
      if (ir.top < vh * 0.78) it.classList.add("in");
    });
  }
  if (tlFill && reduceMotion) tlFill.style.transform = "scaleY(1)";
  if (tl && reduceMotion) tl.querySelectorAll(".tl-item").forEach(function (it) { it.classList.add("in"); });

  /* ---------- Contatori ---------- */
  function fmt(v, dec, suf) {
    var s = v.toFixed(dec).replace(".", ",");
    if (dec === 0 && v >= 1000) s = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return s + suf;
  }
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suf = el.getAttribute("data-suffix") || "";
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 1600, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)), dec, suf);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var cObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { animateCounter(e.target); cObs.unobserve(e.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cObs.observe(el); });
    } else {
      counters.forEach(function (el) {
        el.textContent = fmt(parseFloat(el.getAttribute("data-count")), parseInt(el.getAttribute("data-decimals") || "0", 10), el.getAttribute("data-suffix") || "");
      });
    }
  }

  /* ---------- Filtro news ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var newsCards = document.querySelectorAll(".news-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var cat = btn.getAttribute("data-filter");
      newsCards.forEach(function (c) {
        var show = cat === "all" || c.getAttribute("data-cat") === cat;
        if (show) c.removeAttribute("hidden"); else c.setAttribute("hidden", "");
      });
    });
  });

  /* ---------- Form contatti (mailto, nessun dato raccolto) ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      ["cf-name", "cf-subject", "cf-msg"].forEach(function (id) {
        var input = document.getElementById(id);
        var field = input.closest(".form-field");
        if (!input.value.trim()) { field.classList.add("invalid"); ok = false; }
        else field.classList.remove("invalid");
        input.addEventListener("input", function () { field.classList.remove("invalid"); }, { once: true });
      });
      if (!ok) return;
      var name = document.getElementById("cf-name").value.trim();
      var subject = document.getElementById("cf-subject").value.trim();
      var msg = document.getElementById("cf-msg").value.trim();
      var body = msg + "\n\n— " + name;
      window.location.href = "mailto:etelwardo.sigismondi@senato.it" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  onScroll();
})();
