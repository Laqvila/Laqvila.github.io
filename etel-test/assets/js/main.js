(function () {
  "use strict";

  /* Prima istruzione in assoluto: segnala al CSS che il JS e' vivo. Le animazioni di
     comparsa (.rv) nascondono il contenuto solo sotto questa classe, cosi' con il JS
     disattivato la pagina resta interamente leggibile. */
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isEnglish = (document.documentElement.lang || "it").toLowerCase().indexOf("en") === 0;

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
    function setMenu(open, refocus) {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (!open && refocus) toggle.focus();
    }
    toggle.addEventListener("click", function () {
      setMenu(!links.classList.contains("open"), false);
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false, false); });
    });
    /* Esc chiude il menu e riporta il focus sul pulsante che l'ha aperto. */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("open")) setMenu(false, true);
    });
    /* Un clic fuori dal menu lo chiude: senza questo resta aperto e copre la pagina. */
    document.addEventListener("click", function (e) {
      if (!links.classList.contains("open")) return;
      if (links.contains(e.target) || toggle.contains(e.target)) return;
      setMenu(false, false);
    });
    /* Il focus non deve poter uscire dal menu aperto senza chiuderlo. */
    links.addEventListener("focusout", function (e) {
      if (!links.classList.contains("open")) return;
      if (e.relatedTarget && (links.contains(e.relatedTarget) || toggle.contains(e.relatedTarget))) return;
      setMenu(false, false);
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

  /* ---------- Contatori ----------
     Il valore reale e' gia' scritto nel markup dal generatore: il JS non lo produce,
     lo anima soltanto. Il conteggio da zero parte SOLO per i contatori visibili al
     caricamento, cosi' un valore parziale non compare mai come se fosse il dato. */
  function fmt(v, dec, suf) {
    var decSep = isEnglish ? "." : ",";
    var thoSep = isEnglish ? "," : ".";
    var s = v.toFixed(dec).replace(".", decSep);
    if (dec === 0 && Math.abs(v) >= 1000) {
      s = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, thoSep);
    }
    return s + suf;
  }
  function setCounter(el) {
    el.textContent = fmt(parseFloat(el.getAttribute("data-count")),
                         parseInt(el.getAttribute("data-decimals") || "0", 10),
                         el.getAttribute("data-suffix") || "");
    el.classList.add("counted");
  }
  /* Nessun conteggio animato da zero: un contatore che sale mostrerebbe per un attimo
     valori falsi (12,8% invece di 97,8% sulla presenza ai voti), e sono dati pubblici
     di un parlamentare in carica. Il movimento resta, ma e' la comparsa del blocco
     (.rv), non il numero. Il valore a schermo e' sempre quello vero. */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    el.classList.add("counted");
  });

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
          if (String(d[key]) === el.getAttribute("data-count")) return;   /* gia' aggiornato */
          el.setAttribute("data-count", String(d[key]));
          setCounter(el);   /* sostituzione secca: mai un passaggio da zero sotto gli occhi */
        });
        if (d.aggiornato && d.aggiornato.length === 10) {
          var p = d.aggiornato.split("-");            /* [anno, mese, giorno] */
          var shown = isEnglish ? p[1] + "/" + p[2] + "/" + p[0]
                                : p[2] + "/" + p[1] + "/" + p[0];
          document.querySelectorAll("[data-num-updated]").forEach(function (note) {
            note.textContent = shown;
          });
        }
      })
      .catch(function () { /* offline o file assente: restano i valori nel markup */ });
  }

  /* ---------- Flash news ticker ----------
     Le notizie sono gia' nel markup (scritte dal generatore): niente iniezione da JS,
     quindi niente salto di layout. Qui resta solo il comando di pausa, richiesto dal
     criterio WCAG 2.2.2 per qualunque movimento che duri piu' di cinque secondi. */
  var ticker = document.querySelector(".ticker");
  var tickerToggle = ticker && ticker.querySelector(".ticker-toggle");
  if (ticker && tickerToggle) {
    var track = ticker.querySelector(".ticker-track");
    if (reduceMotion && track) {
      track.style.animation = "none";
      ticker.classList.add("paused");
      tickerToggle.setAttribute("aria-pressed", "true");
      tickerToggle.setAttribute("aria-label", tickerToggle.getAttribute("data-label-play") || "");
    }
    tickerToggle.addEventListener("click", function () {
      var paused = ticker.classList.toggle("paused");
      tickerToggle.setAttribute("aria-pressed", paused ? "true" : "false");
      var lbl = tickerToggle.getAttribute(paused ? "data-label-play" : "data-label-pause");
      if (lbl) tickerToggle.setAttribute("aria-label", lbl);
    });
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

  /* ---------- Filtro rassegna completa (nazionale / locale) ---------- */
  var prFilters = document.querySelectorAll(".pr-filter");
  if (prFilters.length) {
    var prRows = document.querySelectorAll(".pr-row");
    var prYears = document.querySelectorAll(".pr-year");
    prFilters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var scope = btn.getAttribute("data-scope");
        prFilters.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        prRows.forEach(function (row) {
          var show = scope === "all" || row.getAttribute("data-scope") === scope;
          if (show) row.removeAttribute("hidden"); else row.setAttribute("hidden", "");
        });
        /* un anno senza piu' righe visibili non deve restare come intestazione vuota */
        prYears.forEach(function (y) {
          var any = y.querySelector(".pr-row:not([hidden])");
          if (any) y.removeAttribute("hidden"); else y.setAttribute("hidden", "");
        });
      });
    });
  }

  /* ---------- Filtro news ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn[data-filter]");
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
    /* WCAG 3.3.1: l'errore deve essere collegato al campo, non solo colorato.
       aria-invalid lo segnala, aria-describedby fa leggere il messaggio allo
       screen reader, e il focus va sul primo campo da correggere. */
    function clearField(input, field) {
      field.classList.remove("invalid");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var firstBad = null;
      ["cf-name", "cf-subject", "cf-msg"].forEach(function (id) {
        var input = document.getElementById(id);
        if (!input) return;
        var field = input.closest(".form-field");
        if (!input.value.trim()) {
          field.classList.add("invalid");
          input.setAttribute("aria-invalid", "true");
          input.setAttribute("aria-describedby", id + "-err");
          if (!firstBad) firstBad = input;
        } else {
          clearField(input, field);
        }
        input.addEventListener("input", function () { clearField(input, field); }, { once: true });
      });
      if (firstBad) { firstBad.focus(); return; }
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
