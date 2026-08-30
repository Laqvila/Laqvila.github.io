(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var navBar = document.querySelector(".nav-bar");
  if (toggle && navBar) {
    toggle.addEventListener("click", function () {
      var open = navBar.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navBar.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navBar.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Header compatto allo scroll ---------- */
  var header = document.querySelector(".site-header");
  var backTop = document.querySelector(".back-top");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (backTop) backTop.classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Contatori animati ---------- */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1800;
    var start = null;
    function fmt(v) {
      var s = v.toFixed(decimals).replace(".", ",");
      if (decimals === 0 && v >= 1000) s = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return s + suffix;
    }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if ("IntersectionObserver" in window && !reduceMotion) {
      var countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animateCounter(e.target);
            countObs.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { countObs.observe(el); });
    } else {
      counters.forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-count"));
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var s = target.toFixed(decimals).replace(".", ",");
        if (decimals === 0 && target >= 1000) s = Math.round(target).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        el.textContent = s + suffix;
      });
    }
  }
})();
