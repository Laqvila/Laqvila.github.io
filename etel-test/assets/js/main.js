(function () {
  var toggle = document.querySelector(".nav-toggle");
  var navBar = document.querySelector(".nav-bar");
  if (!toggle || !navBar) return;

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
})();
