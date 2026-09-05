(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: stato scrolled + menu mobile ---------- */
  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  var backTop = document.querySelector(".back-top");

  var heroImg = document.querySelector(".hero-photo img");
  var progress = document.querySelector(".scroll-progress");
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 24);
    if (backTop) backTop.classList.toggle("show", y > 700);
    if (heroImg && !reduceMotion && window.innerWidth > 720) {
      heroImg.style.transform = "translateY(" + Math.min(y * 0.12, 90) + "px) scale(1.06)";
    }
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
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
      else el.classList.add("counted");
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

  /* ---------- Numeri dashboard da fonte aggiornata ---------- */
  var dataBase = document.body.getAttribute("data-assets") || "assets/";
  var counterEls = document.querySelectorAll("[data-num-key]");
  if (counterEls.length) {
    fetch(dataBase + "data/numeri.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        counterEls.forEach(function (el) {
          var key = el.getAttribute("data-num-key");
          if (d[key] === undefined || d[key] === null) return;
          el.setAttribute("data-count", String(d[key]));
          if (el.classList.contains("counted")) {
            el.classList.remove("counted");
            animateCounter(el);
          }
        });
        var note = document.querySelector("[data-num-updated]");
        if (note && d.aggiornato) {
          var p = d.aggiornato.split("-");
          note.textContent = p[2] + "/" + p[1] + "/" + p[0];
        }
      })
      .catch(function () { /* offline o file assente: restano i valori nel markup */ });
  }

  /* ---------- Flash news ticker ---------- */
  var ticker = document.querySelector(".ticker");
  if (ticker) {
    fetch(dataBase + "data/flash.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.items || !d.items.length) return;
        var track = ticker.querySelector(".ticker-track");
        if (!track) return;
        function build() {
          return d.items.map(function (it) {
            var a = document.createElement("a");
            a.className = "ticker-item";
            a.href = it.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            var date = document.createElement("span");
            date.className = "tk-date";
            date.textContent = it.data;
            var src = document.createElement("b");
            src.textContent = it.testata;
            var t = document.createElement("span");
            t.textContent = it.titolo;
            a.appendChild(date); a.appendChild(src); a.appendChild(t);
            return a;
          });
        }
        build().forEach(function (n) { track.appendChild(n); });
        build().forEach(function (n) { n.setAttribute("aria-hidden", "true"); track.appendChild(n); });
        ticker.removeAttribute("hidden");
        if (reduceMotion) track.style.animation = "none";
      })
      .catch(function () { /* niente ticker se i dati non ci sono */ });
  }

  /* ---------- Card dinamiche allo scroll (fallback senza scroll-driven CSS) ---------- */
  var supportsViewTimeline = CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  if (!supportsViewTimeline && !reduceMotion && window.innerWidth > 900) {
    var focusCards = document.querySelectorAll(".news-list .news-card, .grid-3 > .card, .press-list-col > .press-item");
    if (focusCards.length && "IntersectionObserver" in window) {
      var focusObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var el = e.target;
          if (!e.isIntersecting) { el.style.transform = ""; return; }
          var r = e.boundingClientRect;
          var mid = r.top + r.height / 2;
          var dist = Math.abs(mid - window.innerHeight / 2) / (window.innerHeight / 2);
          var scale = 1 + (1 - Math.min(dist, 1)) * 0.025;
          el.style.transform = "scale(" + scale.toFixed(3) + ")";
        });
      }, { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] });
      focusCards.forEach(function (c) { focusObs.observe(c); });
    }
  }

  /* ---------- Spotlight sulle card (segue il puntatore) ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".card").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (e.clientX - r.left) + "px");
        c.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
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
