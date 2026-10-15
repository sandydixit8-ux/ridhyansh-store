/* Ridhyansh Store v2 — shared UI behaviors (P3)
   Progressive enhancement. Uses Motion (window.Motion) when present,
   otherwise plain CSS / IntersectionObserver. Never throws.
   Cards are injected asynchronously (index.js / product.js), so a
   MutationObserver keeps late-arriving .reveal / [data-tilt] nodes wired. */
(function () {
  "use strict";

  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var M = window.Motion || null;
  var fine = false;
  try { fine = !!(window.matchMedia && window.matchMedia("(pointer:fine)").matches); } catch (e) {}

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

  /* 3) Reveal on scroll (shared IntersectionObserver) */
  var io = null;
  if (!M && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
  }

  function revealOne(el) {
    if (el.classList.contains("in") || el.dataset.rvBound) return;
    el.dataset.rvBound = "1";
    if (reduce) { el.classList.add("in"); return; }
    if (M && M.inView) {
      try { M.inView(el, function () { el.classList.add("in"); }, { amount: 0.1 }); return; } catch (e) {}
    }
    if (io) { io.observe(el); return; }
    el.classList.add("in");
  }

  function nodes(sel, root) {
    var scope = root || document;
    var out = [];
    if (scope.nodeType === 1 && scope.matches && scope.matches(sel)) out.push(scope);
    Array.prototype.push.apply(out, $$(sel, scope));
    return out;
  }

  function reveal(root) {
    nodes(".reveal, .reveal-stagger", root).forEach(revealOne);
  }

  /* Fail-safe: never leave above-the-fold content hidden if an observer
     misses a late-injected node (e.g. async product grids). */
  function revealAboveFold() {
    var h = (window.innerHeight || 0) + 140;
    nodes(".reveal:not(.in), .reveal-stagger:not(.in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h) el.classList.add("in");
    });
  }

  /* 4) 3D tilt for [data-tilt] (fine pointers only) — element tilts itself,
   *    its grid container supplies perspective (see ui.css .grid). */
  function tiltOne(w) {
    if (w.dataset.tiltBound) return;
    if (reduce || !fine) return;
    w.dataset.tiltBound = "1";
    var isCard = w.classList.contains("product");
    var raf = 0;
    w.addEventListener("pointermove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = w.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        var y = (0.5 - (e.clientY - r.top) / r.height) * 2;
        w.style.transform = "rotateY(" + (x * 7).toFixed(2) + "deg) rotateX(" + (y * 7).toFixed(2) + "deg) translateZ(10px)";
        if (isCard) {
          var img = w.querySelector(".ti");
          if (img) img.style.transform = "translate3d(" + (x * -7).toFixed(2) + "px," + (y * -7).toFixed(2) + "px,0) scale(1.06)";
        }
      });
    });
    w.addEventListener("pointerleave", function () {
      w.style.transform = "";
      if (isCard) {
        var img = w.querySelector(".ti");
        if (img) img.style.transform = "";
      }
    });
  }

  function tilt(root) {
    nodes("[data-tilt]", root).forEach(tiltOne);
  }

  /* 5) Hero parallax (guarded, scroll-linked) */
  function heroParallax() {
    if (reduce || !(M && M.scroll && M.animate)) return;
    var art = document.querySelector(".hero-art");
    if (!art) return;
    try {
      var b1 = art.querySelector(".b1"), b2 = art.querySelector(".b2");
      if (b1) M.scroll(M.animate(b1, { y: [-10, 22] }, { ease: "linear" }));
      if (b2) M.scroll(M.animate(b2, { y: [10, -26] }, { ease: "linear" }));
    } catch (e) {}
  }

  /* 6) Keystroke-free hero pointer parallax (fine pointers only) */
  function heroPointer() {
    if (reduce || !fine) return;
    var hero = document.querySelector(".hero");
    var art = document.querySelector(".hero-art");
    if (!hero || !art) return;
    var raf = 0, nx = 0, ny = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      if (!r.width || !r.height) return;
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        art.style.setProperty("--px", nx.toFixed(3));
        art.style.setProperty("--py", ny.toFixed(3));
      });
    });
    hero.addEventListener("pointerleave", function () {
      art.style.setProperty("--px", "0");
      art.style.setProperty("--py", "0");
    });
  }

  /* 7) Cart add feedback — bump the cart button when the count changes. */
  function cartFeedback() {
    var count = document.getElementById("cartCount");
    var btn = document.getElementById("cartBtn");
    if (!count || !btn || !("MutationObserver" in window)) return;
    var t = 0;
    function bump() {
      btn.classList.remove("bump"); count.classList.remove("bump");
      void btn.offsetWidth;
      btn.classList.add("bump"); count.classList.add("bump");
      clearTimeout(t);
      t = setTimeout(function () { btn.classList.remove("bump"); count.classList.remove("bump"); }, 520);
    }
    new MutationObserver(bump).observe(count, { childList: true, characterData: true, subtree: true });
  }

  /* 8) Keep late-injected nodes wired (full re-scan, self-matching). */
  function observeDOM() {
    if (!("MutationObserver" in window)) return;
    var mo = new MutationObserver(function (muts) {
      var hit = false;
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (n.nodeType !== 1) return;
          if ((n.matches && n.matches(".reveal, [data-tilt]")) ||
              (n.querySelector && n.querySelector(".reveal, [data-tilt]"))) hit = true;
        });
      });
      if (hit) { reveal(); tilt(); revealAboveFold(); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    initNav(); initScrollState(); reveal(); tilt(); heroParallax(); heroPointer(); cartFeedback(); observeDOM();
    setTimeout(revealAboveFold, 1000);
    window.addEventListener("load", revealAboveFold, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.RUI = {
    refresh: function () { reveal(); tilt(); heroParallax(); },
    reduce: reduce
  };
})();