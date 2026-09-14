seedIfEmpty();

var s = sett();
var cat = "All";

function $(id) { return document.getElementById(id); }

function waLink(msg) {
  return "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent(msg);
}

function setWas() {
  var msg = "*" + (s.shopName || "Ridhyansh") + "* — Mujhe order karna hai. Please batao kya available hai?";
  ["waNav", "waHero", "waMid", "waFinal", "stickyWa"].forEach(function (id) {
    var el = $(id);
    if (el) el.href = waLink(msg);
  });
}

function chip(c) {
  return '<button class="chip' + (cat === c ? " on" : "") + '" data-c="' + esc(c) + '">' + catIcon(c) + " " + esc(c) + "</button>";
}

function renderCats() {
  var h = chip("All");
  CATS.forEach(function (c) { h += chip(c); });
  $("catsMini").innerHTML = h;
}

function card(p) {
  var ims = imgsOf(p);
  var img = ims.length
    ? '<img class="ti" src="' + esc(ims[0]) + '" alt="" loading="lazy">'
    : '<div class="ph">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</div>";
  return (
    '<div class="product reveal">' +
    '<a class="med imgbox" href="order.html?p=' + p.id + '">' + img + (ims.length > 1 ? '<span class="shot-count">📸 ' + ims.length + "</span>" : "") + "</a>" +
    '<div class="pbody">' +
    '<span class="ptag">' + catIcon(p.cat) + " " + esc(p.cat) + (p.sub ? ' <i>·</i> ' + esc(p.sub) : "") + "</span>" +
    "<h3>" + esc(p.name) + "</h3>" +
    (p.desc ? "<p class=\"pdesc\">" + esc(p.desc) + "</p>" : "") +
    '<div class="prow"><b class="price">' + inr(p.price) + '</b><a class="btn main sm" href="order.html?p=' + p.id + '">Order</a></div>' +
    "</div></div>"
  );
}

function grid() {
  var list = getProds().filter(function (p) {
    return cat === "All" || p.cat === cat;
  });
  $("grid").innerHTML = list.map(card).join("");
}

document.addEventListener("click", function (e) {
  var b = e.target.closest(".chip");
  if (!b) return;
  cat = b.getAttribute("data-c");
  renderCats();
  grid();
});

document.title = (s.shopName || "Ridhyansh") + " — Order on WhatsApp, Pay via UPI";
var nm = s.shopName || "Ridhyansh";
$("brand").textContent = nm;
$("heroShopName").textContent = nm;
$("footName").textContent = nm;
$("yr").textContent = new Date().getFullYear();
setWas();
renderCats();
grid();