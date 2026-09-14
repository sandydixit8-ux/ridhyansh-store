seedIfEmpty();

var s = sett();
var sel = document.getElementById("product");
var prods = getProds();
var picked = null;
var selSize = "";

function $(id) { return document.getElementById(id); }

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

function total() {
  return picked ? (picked.price || 0) * qt() : 0;
}

function refresh() {
  pick();
  selSize = "";
  var amt = total();
  $("sqty").textContent = qt();
  $("stotal").textContent = picked ? inr(picked.price) + " × " + qt() : "—";
  $("grand").textContent = inr(amt);
  if (picked) {
    $("sname").textContent = picked.name;
    $("simg").textContent = firstImg(picked) ? "" : catIcon(picked.cat);
    $("simg").style.backgroundImage = firstImg(picked) ? "url(" + esc(firstImg(picked)) + ")" : "none";
    $("simg").style.backgroundSize = "cover";
    $("simg").style.backgroundPosition = "center";
    $("sprice").textContent = inr(picked.price);
  }
  renderSizes();
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
  document.querySelectorAll(".size-btn").forEach(function (x) { x.classList.remove("on"); });
  b.classList.add("on");
  selSize = b.getAttribute("data-sz");
});

$("sizeChartBtn").addEventListener("click", function () { $("sizeChart").classList.toggle("hidden"); });

document.title = (s.shopName || "Ridhyansh") + " — Place Order";
$("brand").textContent = s.shopName;
fillSelect();
refresh();
sel.addEventListener("change", refresh);
$("qty").addEventListener("input", refresh);

document.addEventListener("click", function (e) {
  var b = e.target.closest(".qtybtn");
  if (b) {
    var n = qt() + parseInt(b.getAttribute("data-q"), 10);
    $("qty").value = Math.max(1, n);
    refresh();
  }
});

$("pay").addEventListener("click", function () {
  $("err").classList.add("hidden");
  var name = $("name").value.trim();
  var phone = $("phone").value.trim();
  var addr = $("addr").value.trim();
  var qty = qt();
  if (!picked) { showErr("Pehle product chuniye."); return; }
  if (!name || !phone || phone.replace(/\D/g, "").length < 10) { showErr("Naam aur sahi 10-digit phone number likhiye."); return; }
  if (!addr) { showErr("Delivery address likhiye."); return; }
  if (picked.sizes && picked.sizes.length && !selSize) { showErr("Pehle size select kijiye."); return; }

  var amount = Math.round(total());
  var code = refCode();
  var note = "Order " + code;
  var link = upiLink(s, amount, note);

  addOrder({
    ref: code,
    time: new Date().toISOString(),
    product: picked.name,
    cat: picked.cat,
    sub: picked.sub || "",
    size: selSize || "",
    qty: qty,
    amount: amount,
    name: name,
    phone: phone,
    addr: addr,
    status: "pending"
  });

  $("ref").textContent = code;
  $("amnt").textContent = inr(amount);
  $("uplink").href = link;
  $("qr").src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(link);
  $("copy").onclick = function () { copyText(link, this); };

  var msg = "*" + s.shopName + "* — New Order\n" +
    "Order: *" + code + "*\n" +
    "Product: " + picked.name + " × " + qty + (selSize ? " (Size: " + selSize + ")" : "") + "\n" +
    "Amount: " + inr(amount) + "\n" +
    "Name: " + name + "\n" +
    "Phone: " + phone + "\n" +
    "Address: " + addr + "\n" +
    "Payment link (UPI, prepaid): " + link;
  $("wa").href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent(msg);

  $("st3").classList.add("active");
  $("result").classList.remove("hidden");
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  toast("Payment link ready ✔", "ok");
});

function showErr(t) {
  $("err").textContent = t;
  $("err").classList.remove("hidden");
  $("err").scrollIntoView({ behavior: "smooth", block: "center" });
}