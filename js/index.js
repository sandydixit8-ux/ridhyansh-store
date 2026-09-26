seedIfEmpty();

var s = sett();
var cat = "All";
var sub = "All";
var q = "";
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

function card(p) {
  var ims = imgsOf(p);
  var img = ims.length
    ? '<img class="ti' + (ims.length > 1 ? ' multi' : '') + '" src="' + esc(ims[0]) + '" alt="" loading="lazy">'
    : '<div class="ph">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>";
  var badge = ims.length > 1 ? '<span class="shot-count">📸 ' + ims.length + '</span>' : "";
  var strip = ims.length > 1
    ? '<div class="card-strip">' + ims.map(function (d, ix) {
        return '<img class="gthumb' + (ix === 0 ? " act" : "") + '" data-i="' + ix + '" src="' + esc(d) + '" alt="" loading="lazy">';
      }).join("") + "</div>"
    : "";
  return (
    '<div class="product reveal">' +
    '<div class="med imgbox" data-pid="' + p.id + '"' + (ims.length > 1 ? ' title="Photos dekho"' : "") + ">" + img + badge + strip + "</div>" +
    '<div class="pbody">' +
    '<span class="ptag">' + catIcon(p.cat) + " " + esc(p.cat) + (p.sub ? ' <i>·</i> ' + esc(p.sub) : "") + "</span>" +
    "<h3>" + esc(p.name) + "</h3>" +
    (p.desc ? "<p class=\"pdesc\">" + esc(p.desc) + "</p>" : "") +
    (p.rating ? '<div class="rate"><span class="stars">' + stars(p.rating) + '</span><span>' + esc(p.rating) + '</span></div>' : "") +
    '<div class="prow">' + mrpHtml(p) + stockBadge(p) + '</div>' +
    '<div class="cbtn-wrap"><a class="btn main sm" href="order.html?p=' + p.id + '">Order</a></div>' +
    "</div></div>"
  );
}

function stockBadge(p) {
  var stk = getStockOf(p);
  var low = Number(sett().lowStock) || 3;
  if (!stk) return '<span class="off sold-out">Sold out</span>';
  if (stk <= low) return '<span class="off low-stock">Only ' + stk + " left</span>";
  return "";
}

function grid() {
  var list = PRODS.filter(function (p) {
    var inCat = cat === "All" || p.cat === cat;
    var inSub = sub === "All" || !SUBS[cat] || (p.sub || "").indexOf(sub) !== -1;
    var hay = ((p.name || "") + " " + (p.cat || "") + " " + (p.sub || "") + " " + (p.desc || "")).toLowerCase();
    var inQ = !q || hay.indexOf(q) !== -1;
    return inCat && inSub && inQ;
  });
  $("grid").innerHTML = list.map(card).join("");
  $("resCount").textContent = list.length + (list.length === 1 ? " product" : " products");
  $("empty").classList.toggle("hidden", list.length > 0);
  document.body.classList.toggle("has-products", list.length > 0);
  trackGridImps(list);
}

var impTracked = {};
function trackGridImps(list) {
  if (!("IntersectionObserver" in window)) return;
  if (list.length > 30) return;
  var cards = $("grid").querySelectorAll(".product");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var box = en.target.querySelector(".imgbox[data-pid]");
      if (!box) return;
      var pid = box.getAttribute("data-pid");
      if (impTracked[pid]) return;
      impTracked[pid] = 1;
      trackImp(pid);
      io.unobserve(en.target);
    });
  }, { threshold: 0.5 });
  cards.forEach(function (c) { io.observe(c); });
}

function heroArt() {
  var imgs = PRODS.map(firstImg).filter(Boolean);
  [["hcImg1", 0], ["hcImg2", 1], ["hcImg3", 2]].forEach(function (pair) {
    var el = $(pair[0]);
    if (el && imgs[pair[1]]) el.src = imgs[pair[1]];
  });
}

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

document.addEventListener("click", function (e) {
  var oBtn = e.target.closest('a[href^="order.html"]');
  if (oBtn) {
    var pid = new URLSearchParams(oBtn.getAttribute("href").split("?")[1] || "").get("p");
    if (pid) trackClk(pid);
    return;
  }
  var im = e.target.closest(".imgbox[data-pid]");
  if (im) {
    var p0 = PRODS.filter(function (x) { return x.id == +im.dataset.pid; })[0];
    if (p0) trackClk(im.dataset.pid);
    if (p0 && imgsOf(p0).length > 1) {
      var th = e.target.closest(".gthumb");
      openGal(p0, th ? +th.dataset.i : 0);
      return;
    }
  }
  var b = e.target.closest(".chip");
  if (!b) return;
  if (b.getAttribute("data-s")) {
    sub = b.getAttribute("data-s");
  } else {
    cat = b.getAttribute("data-c");
    sub = "All";
    $("search").value = "";
  }
  tabs();
  renderSubs();
  grid();
});

$("lbClose").addEventListener("click", closeGal);
$("lbPrev").addEventListener("click", function () { if (gi > 0) { gi--; drawGal(); } });
$("lbNext").addEventListener("click", function () { if (gi < galImg.length - 1) { gi++; drawGal(); } });
$("lb").addEventListener("click", function (e) {
  var go = e.target.closest(".lb-th");
  if (go) { gi = +go.dataset.go; drawGal(); return; }
  if (e.target === $("lb")) closeGal();
});
document.addEventListener("keydown", function (e) {
  if (galImg.length) {
    if (e.key === "ArrowRight") gi = Math.min(galImg.length - 1, gi + 1);
    else if (e.key === "ArrowLeft") gi = Math.max(0, gi - 1);
    else if (e.key === "Escape") closeGal();
    else return;
    drawGal();
  }
});

var st;
$("search").addEventListener("input", function () {
  clearTimeout(st);
  st = setTimeout(function () { q = $("search").value.trim().toLowerCase(); grid(); }, 120);
});

document.title = s.shopName + " — Shop Online, Pay Prepaid";
$("brand").textContent = s.shopName;
$("heroShopName").textContent = s.shopName;
$("footName").textContent = s.shopName;
$("yr").textContent = new Date().getFullYear();
tabs();
renderSubs();
loadProds().then(function (list) {
  PRODS = list;
  heroArt();
  grid();
});
waFloat();