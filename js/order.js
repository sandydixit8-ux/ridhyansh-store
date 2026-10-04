seedIfEmpty();

var s = sett();
var sel = document.getElementById("product");
var prods = [];
var picked = null;      // single mode
var selSize = "";
var multi = false;      // cart checkout mode
var ccItems = [];       // multi mode items (derived from cart → catalog)

function $(id) { return document.getElementById(id); }

function initMode() {
  var qp = new URLSearchParams(location.search).get("p");
  var d = cartData();
  if (!qp && d.items.length) {
    multi = true;
    ccItems = d.items;
    $("multiWrap").classList.remove("hidden");
    $("singleWrap").classList.add("hidden");
    renderCCList();
  } else {
    multi = false;
    $("multiWrap").classList.add("hidden");
    $("singleWrap").classList.remove("hidden");
  }
}

function renderCCList() {
  var totalUnits = ccItems.reduce(function (n, it) { return n + it.qty; }, 0);
  var totalAmt = ccItems.reduce(function (n, it) { return n + it.subtotal; }, 0);
  $("ccList").innerHTML = ccItems.map(function (it) {
    return '<div class="cc-item">' +
      (it.img ? '<div class="cc-img" style="background-image:url(' + esc(it.img) + ')"></div>' : '<div class="cc-img em">' + catIcon(it.cat) + "</div>") +
      '<div class="cc-info"><b>' + esc(it.name) + "</b>" +
      (it.size ? "<small>Size: " + esc(it.size) + "</small>" : "") +
      '<small>Qty: ' + it.qty + "</small></div>" +
      '<div class="cc-amt">' + inr(it.subtotal) + "</div></div>";
  }).join("");
  $("ccList").insertAdjacentHTML("beforeend",
    '<div class="cc-tot"><span>' + totalUnits + ' ' + (totalUnits === 1 ? "item" : "items") + "</span><b>" + inr(totalAmt) + "</b></div>");
}

function buildItems() {
  if (multi) {
    return ccItems.map(function (it) {
      return { id: it.id, name: it.name, cat: it.cat, sub: it.sub, size: it.size, qty: it.qty, price: it.price, subtotal: it.subtotal, img: it.img };
    });
  }
  if (!picked) return [];
  var sub = (picked.price || 0) * qt();
  return [{ id: picked.id, name: picked.name, cat: picked.cat, sub: picked.sub || "", size: selSize, qty: qt(), price: picked.price || 0, subtotal: sub }];
}

function orderTotal() {
  var items = buildItems();
  var sub = items.reduce(function (n, it) { return n + it.subtotal; }, 0);
  return { sub: sub, ship: shipFeeFor(sub), items: items };
}

// ------- Single mode (existing flow) -------

function fillSelect() {
  var h = "";
  prods.forEach(function (p) {
    h += '<option value="' + p.id + '">' + esc(p.name) + " — " + inr(p.price) + "</option>";
  });
  sel.innerHTML = h || '<option value="">No products yet</option>';
  var qp = new URLSearchParams(location.search).get("p");
  if (qp) sel.value = qp;
}

function pick() {
  picked = null;
  prods.forEach(function (p) { if (String(p.id) === String(sel.value)) picked = p; });
}

function qt() { return Math.max(1, parseInt($("qty").value || "1", 10)); }

function refreshSingle() {
  pick();
  selSize = "";
  renderSummary();
  renderGallery();
  renderSizes();
}

function renderSummary() {
  var o = orderTotal();
  var box = $("sumItems");
  if (o.items.length) {
    box.innerHTML = '<div class="sum-list">' + o.items.map(function (it) {
      return '<div class="sum-line"><div><b>' + esc(it.name) + "</b>" +
        (it.size ? "<small>Size: " + esc(it.size) + "</small>" : "") +
        '<small>' + inr(it.price) + " × " + it.qty + "</small></div>" +
        "<b>" + inr(it.subtotal) + "</b></div>";
    }).join("") + "</div>";
  } else {
    box.innerHTML = '<div class="sum-empty">🛒 Select a product</div>';
  }
  var sh = o.ship;
  var shipRow = $("shipRow"), freeRow = $("freeRow");
  if (o.items.length) {
    if (sh > 0) {
      shipRow.classList.remove("hidden");
      $("sShip").textContent = inr(sh);
      freeRow.classList.add("hidden");
    } else {
      shipRow.classList.add("hidden");
      freeRow.classList.toggle("hidden", !(Number(sett().shipFee) > 0));
    }
  } else {
    shipRow.classList.add("hidden");
    freeRow.classList.add("hidden");
  }
  $("grand").textContent = inr(o.sub + sh);
}

function renderGallery() {
  var gal = $("orderGal");
  var strip = $("orderGalStrip");
  var ims = picked ? imgsOf(picked) : [];
  if (!ims.length) { gal.classList.add("hidden"); strip.innerHTML = ""; return; }
  gal.classList.remove("hidden");
  strip.innerHTML = ims.map(function (d, i) {
    return '<img class="og-th' + (i === 0 ? " act" : "") + '" data-g="' + i + '" src="' + esc(d) + '" alt="" loading="lazy">';
  }).join("");
}

function renderSizes() {
  var sw = $("sizeWrap");
  if (!picked || !picked.sizes || !picked.sizes.length) { sw.classList.add("hidden"); return; }
  sw.classList.remove("hidden");
  $("sizeBtns").innerHTML = picked.sizes.map(function (sz) {
    return '<button type="button" class="size-btn" data-sz="' + esc(sz) + '">' + esc(sz) + '</button>';
  }).join("");
}

$("sizeBtns").addEventListener("click", function (e) {
  var b = e.target.closest(".size-btn");
  if (!b) return;
  document.querySelectorAll("#sizeBtns .size-btn").forEach(function (x) { x.classList.remove("on"); });
  b.classList.add("on");
  selSize = b.getAttribute("data-sz");
});

$("sizeChartBtn").addEventListener("click", function () { $("sizeChart").classList.toggle("hidden"); });

// ------- Galley lightbox (single) -------

var galImg = [], gi = 0;
function openGal(ix) {
  galImg = picked ? imgsOf(picked) : [];
  if (!galImg.length) return;
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
    return '<img class="lb-th' + (i === gi ? " act" : "") + '" data-go="' + i + '" src="' + esc(d) + '" alt="">';
  }).join("");
}
function closeGal() {
  $("lb").classList.add("hidden");
  document.body.classList.remove("lb-open");
  galImg = [];
}
$("lbClose").addEventListener("click", closeGal);
$("lbPrev").addEventListener("click", function () { if (gi > 0) { gi--; drawGal(); } });
$("lbNext").addEventListener("click", function () { if (gi < galImg.length - 1) { gi++; drawGal(); } });
$("lb").addEventListener("click", function (e) {
  var go = e.target.closest(".lb-th");
  if (go) { gi = +go.dataset.go; drawGal(); return; }
  if (e.target === $("lb")) closeGal();
});

document.addEventListener("click", function (e) {
  var g = e.target.closest("[data-g]");
  if (g) { openGal(+g.getAttribute("data-g")); return; }
  var b = e.target.closest(".qtybtn");
  if (b) {
    var n = qt() + parseInt(b.getAttribute("data-q"), 10);
    $("qty").value = Math.max(1, n);
    refreshSingle();
  }
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

// ------- Pay -------

function stkAvailable() {
  if (multi) return ccItems.every(function (it) { return it.qty <= it.stock; });
  return !picked || qt() <= getStockOf(picked);
}

$("pay").addEventListener("click", function () {
  var btn = this;
  if (btn.disabled) return;
  $("err").classList.add("hidden");
  var name = $("name").value.trim();
  var phone = $("phone").value.trim();
  var addr = $("addr").value.trim();
  var pin = ($("pin") && $("pin").value.trim()) || "";

  if (!$("prepaidOK").checked) { showErr("Please confirm that this is a 100% prepaid order."); return; }

  if (!multi) {
    if (!picked) { showErr("Please choose a product first."); return; }
    var stk = getStockOf(picked);
    if (!stk) { showErr("This product is currently sold out."); return; }
    if (qt() > stk) { showErr("Only " + stk + " " + (stk === 1 ? "piece" : "pieces") + " left — please lower the quantity."); return; }
    if (picked.sizes && picked.sizes.length && !selSize) { showErr("Please select a size first."); return; }
  } else {
    if (!ccItems.length) { showErr("Your cart is empty."); return; }
    var sold = ccItems.filter(function (it) { return !it.stock; });
    if (sold.length) { showErr(esc(sold[0].name) + " is sold out — remove it from the cart."); return; }
    if (!stkAvailable()) { showErr("One item has been ordered beyond stock — reduce the quantity."); return; }
  }

  var phDigits = phone.replace(/[^0-9]/g, "");
  if (name.length < 2 || name.length > 80) { showErr("Please enter a valid name."); return; }
  if (!/^[6-9]\d{9}$/.test(phDigits)) { showErr("Please enter a valid 10-digit mobile number (starting with 6-9)."); return; }
  if (addr.length < 10 || addr.length > 500) { showErr("Please enter a complete delivery address."); return; }
  if (pin && !/^[1-9]\d{5}$/.test(pin)) { showErr("Please enter a valid 6-digit PIN code."); return; }

  btn.disabled = true;
  var o = orderTotal();
  var amount = o.sub + o.ship;
  var code = refCode();
  var note = "Order " + code;
  var link = upiLink(s, amount, note);

  var order = {
    ref: code,
    time: new Date().toISOString(),
    product: o.items[0] ? o.items[0].name : "",
    cat: o.items[0] ? o.items[0].cat : "",
    sub: o.items[0] ? o.items[0].sub : "",
    size: o.items[0] ? o.items[0].size : "",
    qty: o.items.reduce(function (n, it) { return n + it.qty; }, 0),
    amount: amount,
    ship: o.ship,
    items: o.items,
    name: name,
    phone: phDigits,
    pin: pin,
    addr: addr,
    status: "pending"
  };

  addOrder(order);
  saveOrderCloud(order).then(function (ok) {
    if (!ok) toast("Order saved on this device. If payment is completed, please confirm on WhatsApp.", "bad");
  });

  $("ref").textContent = code;
  $("amnt").textContent = inr(amount);
  $("uplink").href = link;
  $("qr").src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(link);
  $("copy").onclick = function () { copyText(link, this); };

  var msg = "*" + s.shopName + "* — New Order\n" +
    "Order: *" + code + "*\n" +
    "-- Items --\n" +
    o.items.map(function (it) { return "• " + it.name + (it.size ? " (" + it.size + ")" : "") + " × " + it.qty + " = " + inr(it.subtotal); }).join("\n") + "\n" +
    "Amount: " + inr(amount) + (o.ship ? " (incl. shipping " + inr(o.ship) + ")" : "") + "\n" +
    "Name: " + name + "\n" +
    "Phone: " + phDigits + "\n" +
    "Address: " + addr + (pin ? "\nPIN: " + pin : "") + "\n" +
    "Payment link (UPI, prepaid): " + link;
  $("wa").href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent(msg);

  if (multi) clearCart();

  $("st3").classList.add("active");
  $("st2").classList.remove("active");
  $("result").classList.remove("hidden");
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  toast("Payment link ready ✔", "ok");
  trackEvent("begin_checkout", { currency: "INR", value: amount, items: o.items.map(function (it) { return { item_id: String(it.id), item_name: it.name, item_category: it.cat || "", quantity: it.qty, price: it.price }; }) });
});

function showErr(t) {
  $("err").textContent = t;
  $("err").classList.remove("hidden");
  $("err").scrollIntoView({ behavior: "smooth", block: "center" });
}

// ------- Boot -------

document.title = (s.shopName || "Ridhyansh Store") + " — Checkout";
$("brand").textContent = s.shopName;
$("navToggle").addEventListener("click", function () { $("nav").classList.toggle("open"); });

initMode();
initCartUI();

loadProds().then(function (list) {
  prods = list;
  if (!multi) { fillSelect(); refreshSingle(); }
  else renderSummary();
});
sel.addEventListener("change", refreshSingle);
$("qty").addEventListener("input", refreshSingle);
$("qty").addEventListener("change", renderSummary);