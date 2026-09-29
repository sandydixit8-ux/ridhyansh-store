seedIfEmpty();

var s = sett();
var p = null;
var PRODS = [];
var selSize = "";
var videoSrc = "";

function $(id) { return document.getElementById(id); }

function goHome() {
  $("pdpWrap").classList.add("hidden");
  $("notFound").classList.remove("hidden");
  $("relSec").classList.add("hidden");
}

function render() {
  var ims = imgsOf(p);
  var d = discInfo(p);
  var stk = getStockOf(p);
  var low = Number(sett().lowStock) + 1;

  document.title = (p.name || "Product") + " — " + s.shopName;

  setMeta("og:title", p.name + " — " + s.shopName);
  setMeta("og:description", (p.desc || "Shop at " + s.shopName + ". UPI prepaid, home delivery."));
  setMeta("twitter:title", p.name + " — " + s.shopName);
  setMeta("twitter:description", (p.desc || "Shop at " + s.shopName + ". UPI prepaid, home delivery."));
  setMeta("og:url", location.href.split("#")[0]);
  var ogImg = firstImg(p);
  if (ogImg) { setMeta("og:image", ogImg); setMeta("twitter:image", ogImg); }

  injectJsonLd();

  // Breadcrumb
  $("crumb").classList.remove("hidden");
  $("crumb").innerHTML = '<a href="index.html">Home</a><span class="sep">›</span>' +
    (p.cat ? '<a href="index.html" data-catlink="' + esc(p.cat) + '">' + esc(p.cat) + "</a><span class=\"sep\">›</span>" : "") +
    "<span>" + esc(p.name) + "</span>";

  // Tags + title + rating
  $("pTags").innerHTML =
    '<span class="ptag">' + catIcon(p.cat) + " " + esc(p.cat) + "</span>" +
    (p.sub ? '<span class="ptag">' + esc(p.sub) + "</span>" : "") +
    (p.sku ? '<span class="ptag">SKU: ' + esc(p.sku) + "</span>" : "");
  $("pTitle").textContent = p.name || "";
  $("pRate").innerHTML = p.rating
    ? '<span class="stars">' + stars(p.rating) + '</span><span><b>' + esc(p.rating) + '</b></span><span>·</span><span>' + esc(p.ratingCount || "Rated by customers") + '</span>'
    : "";

  // Price + discount
  var priceHtml = "";
  if (d.off) {
    priceHtml = '<s class="mrp">' + inr(d.mrp) + '</s> <b class="price">' + inr(d.price) + "</b> <span class=\"off\">" + d.off + "% OFF</span>";
    $("pSave").textContent = "You save " + inr(d.mrp - d.price) + " (" + d.off + "% OFF) ✔";
  } else {
    priceHtml = '<b class="price">' + inr(d.price) + "</b>";
    $("pSave").textContent = "";
  }
  $("pPrice").innerHTML = priceHtml;

  // Stock
  var stEl = $("pStock");
  if (!stk) { stEl.className = "p-stock out"; stEl.textContent = "⛔ Sold out — stock aane par update kiya jayega"; }
  else if (stk <= low) { stEl.className = "p-stock low"; stEl.textContent = "⚡ Sirf " + stk + " " + (stk === 1 ? "piece" : "pieces") + " baaki hain"; }
  else { stEl.className = "p-stock in"; stEl.textContent = "✔ In stock — 24h dispatch"; }

  // Sizes
  var sw = $("sizeWrap");
  if (p.sizes && p.sizes.length) {
    sw.classList.remove("hidden");
    $("sizeBtns2").innerHTML = p.sizes.map(function (sz) {
      return '<button type="button" class="size-btn" data-sz="' + esc(sz) + '">' + esc(sz) + "</button>";
    }).join("");
  } else {
    sw.classList.add("hidden");
  }

  // Gallery
  buildGallery(ims, d.off);

  // Value strip
  var fs = Number(sett().freeShipAbove) || 0;
  $("valueStrip").innerHTML =
    '<div class="value"><span>🚚</span>Free shipping<br>₹' + (fs || "0") + " par</div>" +
    '<div class="value"><span>⚡</span>24h dispatch</div>' +
    '<div class="value"><span>🔒</span>UPI prepaid</div>' +
    '<div class="value"><span>🔄</span>7-day returns</div>';

  // Info rows + body
  var rows = [];
  if (p.cat) rows.push({ k: "Category", v: p.cat });
  if (p.sub) rows.push({ k: "Type", v: p.sub });
  if (p.sizes && p.sizes.length) rows.push({ k: "Sizes", v: p.sizes.join(", ") });
  if (p.material) rows.push({ k: "Material", v: p.material });
  if (p.fit) rows.push({ k: "Fit", v: p.fit });
  if (p.sku) rows.push({ k: "SKU", v: p.sku });
  if (p.colors && p.colors.length) rows.push({ k: "Colors", v: p.colors.join(", ") });
  $("pInfoRows").innerHTML = rows.length
    ? rows.map(function (r) { return '<div class="irow"><b>' + esc(r.k) + '</b><span>' + esc(r.v) + "</span></div>"; }).join("")
    : "";

  var body = "";
  if (p.longdesc) body += '<h2>Description</h2><div class="long-desc">' + esc(p.longdesc) + "</div>";
  if (p.features && p.features.length) {
    body += "<h2>Key features</h2><ul class=\"feat-list\">" + p.features.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>";
  }
  if (p.specs && typeof p.specs === "object" && Object.keys(p.specs).length) {
    body += "<h2>Specifications</h2><table class=\"specs\">" +
      Object.keys(p.specs).map(function (k) { return "<tr><th>" + esc(k) + "</th><td>" + esc(p.specs[k]) + "</td></tr>"; }).join("") +
      "</table>";
  }
  if (p.specText) body += "<h2>Details</h2><div class=\"long-desc\">" + esc(p.specText) + "</div>";
  if (!body) body = p.desc ? '<h2>Description</h2><div class="long-desc">' + esc(p.desc) + "</div>" : "";
  $("pBody").innerHTML = body;

  // Buy / share
  var link = location.href.split("#")[0];
  $("pShare").onclick = function () {
    if (navigator.share) {
      navigator.share({ title: p.name, text: s.shopName + " — " + p.name, url: link }).catch(function () {});
    } else {
      copyText(link, this);
    }
  };
  var waMsg = "*" + s.shopName + "* — " + p.name + "\nPrice: " + inr(d.price) + (d.off ? " (MRP " + inr(d.mrp) + ")" : "") + "\nLink: " + link;
  $("pWa").href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent(waMsg);

  // Related
  renderRelated();
}

function setMeta(prop, content) {
  var el = document.querySelector('meta[property="' + prop + '"],meta[name="' + prop + '"]');
  if (!el) { el = document.createElement("meta"); el.setAttribute(prop.indexOf(":") !== -1 ? "property" : "name", prop); document.head.appendChild(el); }
  if (prop.indexOf(":") !== -1) el.setAttribute("property", prop);
  else el.setAttribute("name", prop);
  el.setAttribute("content", content);
}

function injectJsonLd() {
  var d = discInfo(p);
  var ims = hasImg(p) ? imgsOf(p) : [];
  var ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "description": p.desc || (s.shopName + " product — UPI prepaid, home delivery."),
    "sku": p.sku || String(p.id),
    "image": ims.length ? (ims.length === 1 ? ims[0] : ims) : undefined,
    "brand": { "@type": "Brand", "name": s.shopName },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": d.price,
      "availability": getStockOf(p) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": location.href.split("#")[0],
      "seller": { "@type": "Organization", "name": s.shopName }
    },
    "aggregateRating": p.rating ? { "@type": "AggregateRating", "ratingValue": p.rating, "reviewCount": p.ratingCount || 1 } : undefined
  };
  ["image", "aggregateRating", "sku"].forEach(function (k) { if (ld[k] === undefined) delete ld[k]; });
  var el = document.createElement("script");
  el.type = "application/ld+json";
  el.textContent = JSON.stringify(ld);
  document.head.appendChild(el);
}

function buildGallery(ims, off) {
  var vPlay = document.createElement("span");
  var badges = "";
  if (videoSrc) badges += '<span class="p-badge video">▶ Video</span>';
  if (off > 0) badges += '<span class="p-badge deal">' + off + "% OFF</span>";
  var stk = getStockOf(p);
  if (!stk) badges += '<span class="p-badge sold">Sold out</span>';
  $("gBadges").innerHTML = badges;

  var thumbs = [];
  ims.forEach(function (src, i) {
    thumbs.push({ type: "img", src: src, i: i });
  });
  if (videoSrc) thumbs.push({ type: "vid", src: videoSrc });
  medList = thumbs;

  $("gThumbs").innerHTML = thumbs.map(function (t, ix) {
    if (t.type === "vid") {
      return '<button class="gth vth" data-med="' + ix + '"><video muted playsinline preload="metadata" src="' + esc(t.src) + '"></video><span class="vply">▶</span></button>';
    }
    return '<button class="gth' + (ix === 0 ? " on" : "") + '" data-med="' + ix + '"><img src="' + esc(t.src) + '" alt=""></button>';
  }).join("");

  var first = thumbs[0];
  if (first.type === "vid") showVideo();
  else showImg(first.src, first.i);

  // Lightbox only for images
  var gmain = $("gMain");
  gmain.onclick = null;
  gmain.onclick = function (e) {
    var el = e.target;
    if (el.tagName === "VIDEO") return;
    if (galIms().length > 1) openGal(galIms(), currentImgIndex());
  };
}

var galImgs = [], galIdx = 0, medList = [];
function galIms() { return galImgs; }
function currentImgIndex() { return galIdx; }
function showImg(src, i) {
  closeVideo();
  $("gMainImg").classList.remove("hidden");
  $("gMainImg").src = src;
  galImgs = imgsOf(p);
  galIdx = i;
  markThumb(src);
}
function showVideo() {
  var vid = $("gMainVid");
  $("gMainImg").classList.add("hidden");
  vid.classList.remove("hidden");
  if (vid.poster !== firstImg(p)) vid.poster = firstImg(p) || "";
  if (vid.src !== videoSrc) vid.src = videoSrc;
  vid.load();
  vid.play().catch(function () {});
  markThumb(videoSrc);
}
function closeVideo() {
  var vid = $("gMainVid");
  vid.pause();
  vid.classList.add("hidden");
}
function markThumb(src) {
  var btns = $("gThumbs").querySelectorAll(".gth");
  btns.forEach(function (b) {
    var medEl = b.querySelector("img, video");
    b.classList.toggle("on", medEl && (medEl.getAttribute("src") === src || medEl.src === src));
  });
}

$("gThumbs").addEventListener("click", function (e) {
  var b = e.target.closest(".gth");
  if (!b) return;
  var med = +b.getAttribute("data-med");
  var m = medList[med];
  if (m && m.type === "vid") { showVideo(); return; }
  if (m) showImg(m.src, m.i);
});

// Lightbox helpers (img-only)
var lbImgArr = [], gi = 0;
function openGal(list, ix) {
  lbImgArr = list || [];
  gi = Math.max(0, Math.min(ix || 0, lbImgArr.length - 1));
  drawGalLb();
  $("lb").classList.remove("hidden");
  document.body.classList.add("lb-open");
}
function drawGalLb() {
  $("lbImg").src = lbImgArr[gi];
  $("lbCount").textContent = (gi + 1) + " / " + lbImgArr.length;
  $("lbPrev").classList.toggle("hidden", gi === 0);
  $("lbNext").classList.toggle("hidden", gi >= lbImgArr.length - 1);
  $("lbThumbs").innerHTML = lbImgArr.map(function (d, i) {
    return '<img class="lb-th' + (i === gi ? " act" : "") + '" data-go="' + i + '" src="' + d + '" alt="">';
  }).join("");
}
function closeGalLb() {
  $("lb").classList.add("hidden");
  document.body.classList.remove("lb-open");
  lbImgArr = [];
}
$("lbClose").addEventListener("click", closeGalLb);
$("lbPrev").addEventListener("click", function () { if (gi > 0) { gi--; drawGalLb(); } });
$("lbNext").addEventListener("click", function () { if (gi < lbImgArr.length - 1) { gi++; drawGalLb(); } });
$("lb").addEventListener("click", function (e) {
  var go = e.target.closest(".lb-th");
  if (go) { gi = +go.dataset.go; drawGalLb(); return; }
  if (e.target === $("lb")) closeGalLb();
});

// Sizes
$("sizeBtns2").addEventListener("click", function (e) {
  var b = e.target.closest(".size-btn");
  if (!b) return;
  document.querySelectorAll("#sizeBtns2 .size-btn").forEach(function (x) { x.classList.remove("on"); });
  b.classList.add("on");
  selSize = b.getAttribute("data-sz");
});
$("sizeChartBtn2").addEventListener("click", function () { $("sizeChart2").classList.toggle("hidden"); });

// Qty
function pq() { return Math.max(1, parseInt($("pqty").value || "1", 10)); }
document.addEventListener("click", function (e) {
  var b = e.target.closest("#pqty + button, .qty-group .qtybtn");
  if (!b || !$("pqty").contains(b.parentNode)) return;
  var n = pq() + parseInt(b.getAttribute("data-q"), 10);
  $("pqty").value = Math.max(1, n);
  validateBuy();
});

// Stock-aware buy
function validateBuy() {
  var stk = getStockOf(p);
  var q = pq();
  var inCart = cartQtyOf(p.id, selSize);
  if (inCart + q > stk) { toast("Cart + is quantity se stock nikal raha hai (baaki: " + (stk - Math.max(0, inCart)) + ").", "bad"); return false; }
  return true;
}
function needSize() {
  return p.sizes && p.sizes.length && !selSize;
}

$("pAddCart").addEventListener("click", function () {
  if (needSize()) { toast("Pehle size select kijiye.", "bad"); return; }
  if (!validateBuy()) return;
  addCartUI(p.id, selSize, pq());
});
$("pBuy").addEventListener("click", function () {
  if (needSize()) { toast("Pehle size select kijiye.", "bad"); return; }
  if (!validateBuy()) return;
  addToCart(p.id, selSize, pq());
  location.href = "order.html";
});

// Related
function renderRelated() {
  var list = PRODS.filter(function (x) { return String(x.id) !== String(p.id) && (x.cat === p.cat || x.sub === p.sub); });
  var fallback = PRODS.filter(function (x) { return String(x.id) !== String(p.id); });
  var rel = (list.length ? list : fallback).slice(0, 4);
  if (!rel.length) { $("relSec").classList.add("hidden"); return; }
  $("relSec").classList.remove("hidden");
  $("relGrid").innerHTML = rel.map(relCard).join("");
}
function relCard(x) {
  var ims = imgsOf(x);
  var img = ims.length ? '<img class="ti' + (ims.length > 1 ? " multi" : "") + '" src="' + esc(ims[0]) + '" alt="' + esc(x.name) + '" loading="lazy" onerror="imgErr(this)">' : "";
  var d = discInfo(x);
  return '<div class="product reveal">' +
    '<a class="med imgbox" href="' + pUrl(x) + '">' + img +
    (d.off ? '<span class="p-badge deal">' + d.off + "% OFF</span>" : "") +
    "</a>" +
    '<div class="pbody"><h3><a href="' + pUrl(x) + '">' + esc(x.name) + "</a></h3>" +
    '<div class="prow">' + mrpHtml(x) + "</div></div></div>";
}

// Breadcrumb category link
document.addEventListener("click", function (e) {
  var c = e.target.closest("[data-catlink]");
  if (c) {
    try { sessionStorage.setItem("rh_cat", c.getAttribute("data-catlink")); } catch (err) {}
    return;
  }
});

// Video probe: explicit p.video OR auto-detect reels/<id>_reel.mp4
function probeVideo() {
  var explicit = videoFor(p);
  if (explicit) { videoSrc = explicit; render(); return; }
  var guess = reelFile(p);
  fetch(guess, { method: "HEAD" })
    .then(function (r) { if (r.ok) { videoSrc = guess; } })
    .catch(function () {})
    .then(function () { render(); });
}

initCartUI();
document.title = s.shopName;
$("brand").textContent = s.shopName;
$("footName").textContent = s.shopName;
$("yr").textContent = new Date().getFullYear();

$("navToggle").addEventListener("click", function () { $("nav").classList.toggle("open"); });

var qp = new URLSearchParams(location.search).get("p");
if (!qp && location.hash) qp = location.hash.replace(/[^0-9]/g, ""); // #<id> fallback
loadProds().then(function (list) {
  PRODS = list;
  p = qp ? prodById(qp) : null;
  if (!p) { goHome(); return; }
  trackPV(p.id);
  probeVideo();
});