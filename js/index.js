seedIfEmpty();

var s = sett();
var cat = "All";
var sub = "All";
var q = "";
var sortBy = "popular";
var PRODS = [];

function $(id) { return document.getElementById(id); }

function tabs() {
  var h = '<button class="chip' + (cat === "All" ? " on" : "") + '" data-c="All">🛍️ All</button>';
  CATS.forEach(function (c) {
    h += '<button class="chip' + (cat === c ? " on" : "") + '" data-c="' + esc(c) + '">' + catIcon(c) + " " + esc(c) + "</button>";
  });
  $("cats").innerHTML = h;
}

function renderSubs() {
  var items = SUBS[cat];
  var el = $("subs");
  if (!items) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  var h = '<button class="chip sub' + (sub === "All" ? " on" : "") + '" data-s="All">All ' + esc(cat) + "</button>";
  items.forEach(function (s2) {
    h += '<button class="chip sub' + (sub === s2 ? " on" : "") + '" data-s="' + esc(s2) + '">' + esc(s2) + "</button>";
  });
  el.innerHTML = h;
}

function renderActiveFilters() {
  var chips = [];
  if (q) chips.push('<button class="af-chip" data-clear="q">🔍 "' + esc(q) + '" ✕</button>');
  if (cat !== "All") chips.push('<button class="af-chip" data-clear="cat">' + catIcon(cat) + " " + esc(cat) + " ✕</button>");
  if (sub !== "All") chips.push('<button class="af-chip" data-clear="sub">' + esc(sub) + " ✕</button>");
  $("activeFilters").innerHTML = chips.join("");
}

function discountOf(p) {
  var d = discInfo(p);
  return d.off;
}

function tab(b, pid) { trackClk(pid); }

function card(p) {
  var ims = imgsOf(p);
  var img = ims.length
    ? '<img class="ti' + (ims.length > 1 ? " multi" : "") + '" src="' + esc(ims[0]) + '" alt="' + esc(p.name) + '" loading="lazy">'
    : '<div class="ph">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>";
  var badges = "";
  if (videoFor(p)) badges += '<span class="p-badge video">▶ Video</span>';
  var shot = ims.length > 1 ? '<span class="shot-count">📸 ' + ims.length + '</span>' : "";
  var dsc = discountOf(p);
  if (dsc > 0) badges += '<span class="p-badge deal">' + dsc + '% OFF</span>';
  var stk = getStockOf(p);
  if (!stk) badges += '<span class="p-badge sold">Sold out</span>';
  else if (stk <= Number(sett().lowStock) + 1) badges += '<span class="p-badge low">Only ' + stk + " left</span>";
  return (
    '<div class="product reveal">' +
    '<a class="med imgbox" href="' + pUrl(p) + '" data-plink="' + p.id + '">' + img + badges + shot + "</a>" +
    '<div class="pbody">' +
    '<a class="ptag" href="javascript:void(0)" data-cg="' + esc(p.cat) + '" title="' + esc(p.cat) + '">' + catIcon(p.cat) + " " + esc(p.cat) + "</a>" +
    '<h3><a href="' + pUrl(p) + '" data-plink="' + p.id + '">' + esc(p.name) + "</a></h3>" +
    (p.desc ? '<p class="pdesc">' + esc(p.desc) + "</p>" : "") +
    (p.rating ? '<div class="rate"><span class="stars">' + stars(p.rating) + '</span><span>' + esc(p.rating) + "</span></div>" : "") +
    '<div class="prow">' + mrpHtml(p) + '</div>' +
    '<div class="cbtn-row">' +
    '<button class="btn main sm addcart" data-ac="' + p.id + '">🛒 Add</button>' +
    '<a class="btn sec sm" href="order.html?p=' + p.id + '" data-buy="' + p.id + '">Buy Now</a>' +
    "</div>" +
    "</div></div>"
  );
}

function stockBadgeLabel(p) {
  var stk = getStockOf(p);
  var low = Number(sett().lowStock) + 1;
  if (!stk) return '<span class="off sold-out">Sold out</span>';
  if (stk <= low) return '<span class="off low-stock">Only ' + stk + " left</span>";
  return "";
}

function matching(list) {
  var tokens = q ? q.split(/\s+/) : [];
  return list.filter(function (p) {
    var inCat = cat === "All" || p.cat === cat;
    var inSub = sub === "All" || !SUBS[cat] || (p.sub || "").indexOf(sub) !== -1;
    var hay = ((p.name || "") + " " + (p.cat || "") + " " + (p.sub || "") + " " + (p.desc || "")).toLowerCase();
    var inQ = true;
    for (var i = 0; i < tokens.length; i++) if (hay.indexOf(tokens[i]) === -1) { inQ = false; break; }
    return inCat && inSub && inQ;
  });
}

function sortList(list) {
  var out = list.slice();
  out.sort(function (a, b) {
    if (sortBy === "price-asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
    if (sortBy === "discount") return discountOf(b) - discountOf(a);
    if (sortBy === "new") return (b.id || 0) - (a.id || 0);
    var fa = (a.featured ? 4 : 0) + (a.trending ? 2 : 0);
    var fb = (b.featured ? 4 : 0) + (b.trending ? 2 : 0);
    if (fa !== fb) return fb - fa;
    return (b.rating || 0) - (a.rating || 0);
  });
  return out;
}

function renderTrend() {
  var list = sortList(PRODS.slice()).slice(0, 4);
  if (!list.length) { $("trendSec").classList.add("hidden"); return; }
  $("trendSec").classList.remove("hidden");
  $("trendGrid").innerHTML = list.map(card).join("");
}

function grid() {
  var list = sortList(matching(PRODS));
  $("grid").innerHTML = list.map(card).join("");
  $("resCount").textContent = list.length + (list.length === 1 ? " product" : " products");
  $("empty").classList.toggle("hidden", list.length > 0);
  renderActiveFilters();
  trackGridImps(list);
}

function renderCatCards() {
  var h = "";
  CATS.forEach(function (c) {
    var n = PRODS.filter(function (p) { return p.cat === c; }).length;
    var deals = PRODS.filter(function (p) { return p.cat === c && discountOf(p) > 0; }).length;
    var sub = n ? (deals ? deals + " deals" : n + " items") : "coming soon";
    h += '<a class="cat-card" href="javascript:void(0)" data-cat="' + esc(c) + '">' +
      '<span class="cc-icon">' + catIcon(c) + '</span>' +
      "<b>" + esc(c) + "</b>" +
      "<small>" + sub + "</small>" +
      '<span class="cc-arrow">→</span>' +
      "</a>";
  });
  $("catCards").innerHTML = h;
  if (!PRODS.length) $("catCards").innerHTML = '<div class="empty-box">📦 Products add hone ke baad categories yahan dikhengi.</div>';
}

var impTracked = {};
function trackGridImps(list) {
  if (!("IntersectionObserver" in window)) return;
  if (list.length > 30) return;
  var cards = $("grid").querySelectorAll(".product");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var box = en.target.querySelector("[data-plink]");
      if (!box) return;
      var pid = box.getAttribute("data-plink");
      if (impTracked[pid]) return;
      impTracked[pid] = 1;
      trackImp(pid);
      io.unobserve(en.target);
    });
  }, { threshold: 0.4 });
  cards.forEach(function (c) { io.observe(c); });
}

function heroArt() {
  var imgs = PRODS.map(firstImg).filter(Boolean);
  [["hcImg1", 0], ["hcImg2", 1], ["hcImg3", 2]].forEach(function (pair) {
    var el = $(pair[0]);
    if (el && imgs[pair[1]]) el.src = imgs[pair[1]];
  });
}

// ---------------- Cart (in store.js: openCart/closeCart/renderCart/addCartUI) ----------------

function waFloat() {
  var a = document.createElement("a");
  a.className = "wa-float";
  a.href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent("Hi! Mujhe Ridhyansh Store par order karna hai.");
  a.target = "_blank";
  a.rel = "noopener";
  a.innerHTML = "💬";
  a.title = "WhatsApp se poochho";
  document.body.appendChild(a);
}

// ---------------- Lightbox ----------------

var galImg = [], gi = 0;
function openGal(p, ix) {
  galImg = imgsOf(p);
  gi = Math.min(Math.max(ix || 0, 0), galImg.length - 1);
  drawGal();
  $("lb").classList.remove("hidden");
  document.body.classList.add("lb-open");
}
function drawGal() {
  $("lbImg").src = galImg[gi];
  $("lbCount").textContent = (gi + 1) + " / " + galImg.length;
  $("lbPrev").classList.toggle("hidden", gi === 0);
  $("lbNext").classList.toggle("hidden", gi >= galImg.length - 1);
  $("lbThumbs").innerHTML = galImg.map(function (d, i) {
    return '<img class="lb-th' + (i === gi ? " act" : "") + '" data-go="' + i + '" src="' + d + '" alt="">';
  }).join("");
  var act = $("lbThumbs").querySelector(".lb-th.act");
  if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
}
function closeGal() {
  $("lb").classList.add("hidden");
  document.body.classList.remove("lb-open");
  galImg = [];
}

// ---------------- Events ----------------

document.addEventListener("click", function (e) {
  var ct = e.target.closest("[data-cat]");
  if (ct) {
    cat = ct.getAttribute("data-cat");
    sub = "All";
    $("search").value = "";
    q = "";
    tabs(); renderSubs(); grid();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  var cg = e.target.closest("[data-cg]");
  if (cg) {
    cat = cg.getAttribute("data-cg");
    sub = "All";
    $("search").value = "";
    q = "";
    tabs(); renderSubs(); grid();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  var clr = e.target.closest("[data-clear]");
  if (clr) {
    var k = clr.getAttribute("data-clear");
    if (k === "q") { q = ""; $("search").value = ""; }
    if (k === "cat") { cat = "All"; sub = "All"; }
    if (k === "sub") { sub = "All"; }
    tabs(); renderSubs(); grid();
    return;
  }
  var pl = e.target.closest("[data-plink]");
  if (pl) { trackClk(pl.getAttribute("data-plink")); return; }
  var buy = e.target.closest("[data-buy]");
  if (buy) { trackClk(buy.getAttribute("data-buy")); return; }
  var ac = e.target.closest("[data-ac]");
  if (ac) { addCartUI(ac.getAttribute("data-ac"), "", 1); return; }
  var b = e.target.closest(".chip");
  if (b) {
    if (b.getAttribute("data-s")) {
      sub = b.getAttribute("data-s");
    } else {
      cat = b.getAttribute("data-c");
      sub = "All";
    }
    tabs(); renderSubs(); grid();
    return;
  }
});

initCartUI();
document.addEventListener("keydown", function (e) {
  if (galImg.length) {
    if (e.key === "ArrowRight") gi = Math.min(galImg.length - 1, gi + 1);
    else if (e.key === "ArrowLeft") gi = Math.max(0, gi - 1);
    else if (e.key === "Escape") closeGal();
    else return;
    drawGal();
  }
  if (e.key === "Escape" && $("cartDrawer").classList.contains("open")) closeCart();
});

$("lbClose").addEventListener("click", closeGal);
$("lbPrev").addEventListener("click", function () { if (gi > 0) { gi--; drawGal(); } });
$("lbNext").addEventListener("click", function () { if (gi < galImg.length - 1) { gi++; drawGal(); } });
$("lb").addEventListener("click", function (e) {
  var go = e.target.closest(".lb-th");
  if (go) { gi = +go.dataset.go; drawGal(); return; }
  if (e.target === $("lb")) closeGal();
});

var st;
$("search").addEventListener("input", function () {
  clearTimeout(st);
  st = setTimeout(function () { q = $("search").value.trim().toLowerCase(); grid(); }, 120);
});
$("search").addEventListener("keydown", function (e) {
  if (e.key === "Enter") { q = $("search").value.trim().toLowerCase(); grid(); }
});

$("sortSel").addEventListener("change", function () {
  sortBy = $("sortSel").value;
  grid();
});

$("emptyReset").addEventListener("click", function () {
  cat = "All"; sub = "All"; q = ""; sortBy = "popular";
  $("search").value = ""; $("sortSel").value = "popular";
  tabs(); renderSubs(); grid();
});

$("navToggle").addEventListener("click", function () {
  $("nav").classList.toggle("open");
});

document.title = s.shopName + " — Shop Smart. Look Better. Spend Better.";
$("brand").textContent = s.shopName;
$("heroShopName").textContent = "Look better.";
$("footName").textContent = s.shopName;
$("yr").textContent = new Date().getFullYear();
$("footWa").textContent = "WhatsApp: +91 " + s.whatsapp;
updateCartCount();
tabs();
renderSubs();
loadProds().then(function (list) {
  PRODS = list;
  heroArt();
  renderCatCards();
  renderTrend();
  grid();
  updateCartCount();
});
waFloat();