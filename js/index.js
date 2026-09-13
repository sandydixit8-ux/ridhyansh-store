seedIfEmpty();

var s = sett();
var cat = "All";
var sub = "All";
var q = "";

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
  var img = p.img
    ? '<img class="ti" src="' + esc(p.img) + '" alt="" loading="lazy">'
    : '<div class="ph">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>";
  return (
    '<div class="product reveal">' +
    '<div class="med imgbox">' + img + "</div>" +
    '<div class="pbody">' +
    '<span class="ptag">' + catIcon(p.cat) + " " + esc(p.cat) + (p.sub ? ' <i>·</i> ' + esc(p.sub) : "") + "</span>" +
    "<h3>" + esc(p.name) + "</h3>" +
    (p.desc ? "<p class=\"pdesc\">" + esc(p.desc) + "</p>" : "") +
    (p.rating ? '<div class="rate"><span class="stars">' + stars(p.rating) + '</span><span>' + esc(p.rating) + '</span></div>' : "") +
    '<div class="prow"><b class="price">' + inr(p.price) + '</b><a class="btn main sm" href="order.html?p=' + p.id + '">Order</a></div>' +
    "</div></div>"
  );
}

function grid() {
  var list = getProds().filter(function (p) {
    var inCat = cat === "All" || p.cat === cat;
    var inSub = sub === "All" || !SUBS[cat] || (p.sub || "").indexOf(sub) !== -1;
    var hay = ((p.name || "") + " " + (p.cat || "") + " " + (p.sub || "") + " " + (p.desc || "")).toLowerCase();
    var inQ = !q || hay.indexOf(q) !== -1;
    return inCat && inSub && inQ;
  });
  $("grid").innerHTML = list.map(card).join("");
  $("empty").classList.toggle("hidden", list.length > 0);
  document.body.classList.toggle("has-products", list.length > 0);
}

document.addEventListener("click", function (e) {
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
grid();