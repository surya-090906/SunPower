/* SunThread: small progressive enhancements. Every page works without this file except the bell polling. */
(function () {
  "use strict";

  // Flash messages: click to dismiss, auto-dismiss after a while.
  document.querySelectorAll(".flash").forEach(function (el) {
    el.addEventListener("click", function () { el.remove(); });
    setTimeout(function () { el.remove(); }, el.classList.contains("error") ? 14000 : 7000);
  });

  // data-confirm on forms and links.
  document.addEventListener("submit", function (e) {
    var msg = e.target.getAttribute("data-confirm");
    if (msg && !window.confirm(msg)) e.preventDefault();
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-confirm], button[data-confirm]");
    if (a && !window.confirm(a.getAttribute("data-confirm"))) e.preventDefault();
    var dis = e.target.closest(".is-disabled");
    if (dis) e.preventDefault();
  });

  // Notification bell: poll the unread count.
  var dot = document.querySelector("[data-bell]");
  if (dot) {
    var tick = function () {
      fetch("/api/notifications/count/", { credentials: "same-origin" })
        .then(function (r) { return r.json(); })
        .then(function (j) { dot.textContent = j.count > 99 ? "99+" : j.count; dot.classList.toggle("on", j.count > 0); })
        .catch(function () {});
    };
    tick();
    setInterval(tick, 5000);
  }

  // Selects that submit their form on change (demo user switcher, filters).
  document.querySelectorAll("[data-autosubmit]").forEach(function (el) {
    el.addEventListener("change", function () { el.form.submit(); });
  });

  var af = document.querySelector("[data-autofocus]");
  if (af) { af.focus(); if (af.select) af.select(); }

  // Receive-stock form: show the serial box only for serial-tracked products and prefill the unit cost.
  var prod = document.querySelector("[data-product-select]");
  if (prod) {
    var sync = function () {
      var opt = prod.options[prod.selectedIndex];
      var tracked = opt && opt.getAttribute("data-tracked") === "1";
      document.querySelectorAll("[data-serials]").forEach(function (b) { b.style.display = tracked ? "" : "none"; });
      var cost = document.querySelector("[data-cost]");
      if (cost && opt && opt.getAttribute("data-cost")) cost.value = opt.getAttribute("data-cost");
    };
    prod.addEventListener("change", sync);
    sync();
  }
})();
