/* Ridhyansh Store v2 — shared UI behaviors (P2)
   Progressive enhancement. Uses Motion (window.Motion) when present,
   otherwise plain CSS / IntersectionObserver. Never throws. */
(function () {
  "use strict";

  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var M = window.Motion || null;

  function $$(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }

  /* 1) Mobile nav toggle */
  function initNav() {
    var btn = document.getElementById("navToggle");
    var nav = document.getElementById("nav");
    var header = document.querySelector(".top");
    if (!btn || !nav) return;

    function setOpen(open) {
      if (header) header.classList.toggle("nav-open", open);
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (M && M.animate && !reduce) {
        try {
          M.animate(nav,
            { opacity: open ? [0, 1] : 1, transform: open ? ["translateY(-8px)", "translateY(0)"] : "none" },
            { duration: 0.22 });
        } catch (e) {}
      }
    }

    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  /* 2) Header scrolled state */
  function initScrollState() {
    var header = document.querySelector(".top");
    if (!header) return;
    var on = function () { header.classList.toggle("scrolled", (window.scrollY || 0) > 8); };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /* 3) Reveal on scroll */
  function reveal() {
    var els = $$(".reveal, .reveal-stagger");
    if (!els.length) return;
    if (reduce) { els.forEach(function (el) { el.classList.add("in"); }); return; }

    if (M && M.inView) {
      els.forEach(function (el) {
        if (el.classList.contains("in")) return;
        try { M.inView(el, function () { el.classList.add("in"); }, { amount: 0.2 }); }
        catch (e) { el.classList.add("in"); }
      });
    } else if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.15 });
      els.forEach(function (el) { if (!el.classList.contains("in")) io.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add("in"); });
    }
  }

  /* 4) 3D tilt for [data-tilt] (fine pointers only) */
  function tilt() {
    if (reduce) return;
    if (!(window.matchMedia && window.matchMedia("(pointer:fine)").matches)) return;
    $$("[data-tilt]").forEach(function (w) {
      if (w.dataset.tiltBound) return;
      w.dataset.tiltBound = "1";
      var inner = w.firstElementChild || w;
      var raf = 0;
      w.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = w.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
          var y = (0.5 - (e.clientY - r.top) / r.height) * 2;
          inner.style.transform = "rotateY(" + (x * 7).toFixed(2) + "deg) rotateX(" + (y * 7).toFixed(2) + "deg) translateZ(18px)";
        });
      });
      w.addEventListener("pointerleave", function () { inner.style.transform = ""; });
    });
  }

  function boot() { initNav(); initScrollState(); reveal(); tilt(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.RUI = { refresh: function () { reveal(); tilt(); }, reduce: reduce };
})();