seedIfEmpty();

var s = sett();

function $(id) { return document.getElementById(id); }

if (!authOk()) {
  location.href = "login.html";
} else {
  init();
}

function init() {
  document.title = s.shopName + " — Admin";
  $("brand").textContent = s.shopName;

  $("shopName").value = s.shopName || "";
  $("user").value = s.rh_user || "";
  $("upiId").value = s.upiId || "";
  $("whatsapp").value = s.whatsapp || "";
  $("addr").value = s.address || "";

  var opts = "";
  CATS.forEach(function (c) { opts += '<option value="' + esc(c) + '">' + catIcon(c) + " " + esc(c) + "</option>"; });
  $("pcat").innerHTML = opts;

  $("pcat").addEventListener("change", syncSub);
  syncSub();

  $("saveSett").addEventListener("click", saveSettings);
  $("addProd").addEventListener("click", addProduct);
  $("genLink").addEventListener("click", genLink);
  $("logout").addEventListener("click", function () { authClear(); location.href = "login.html"; });

  renderList();
}

function comboSubs() {
  var out = [];
  ["Men", "Women"].forEach(function (g) {
    ["Top Wear", "Bottom Wear"].forEach(function (w) {
      out.push(g + " " + w);
    });
  });
  return out;
}

function syncSub() {
  var has = !!SUBS[$("pcat").value];
  var w = $("psubWrap");
  if (!has) { w.classList.add("hidden"); return; }
  w.classList.remove("hidden");
  var h = "";
  comboSubs().forEach(function (s2) { h += '<option value="' + esc(s2) + '">' + esc(s2) + "</option>"; });
  $("psub").innerHTML = h;
}

function saveSettings() {
  s.shopName = $("shopName").value.trim() || "Ridhyansh";
  s.rh_user = $("user").value.trim() || "admin";
  s.upiId = $("upiId").value.trim();
  s.whatsapp = $("whatsapp").value.trim();
  s.address = $("addr").value.trim();
  if ($("pass").value.trim()) {
    if ($("pass").value.trim().length < 4) { toast("Password kam se kam 4 characters ka rakho.", "bad"); return; }
    s.rh_pass = $("pass").value.trim();
  }
  saveSett(s);
  lsSet("rh_cred_v", 3);
  $("brand").textContent = s.shopName;
  $("pass").value = "";
  toast("Settings save ho gayi ✔");
  setTimeout(function () { $("settMsg").textContent = ""; }, 500);
}

function addProduct() {
  var n = $("pname").value.trim();
  var price = parseInt($("pprice").value, 10);
  if (!n || !price || price < 1) { toast("Naam aur sahi price dono chahiye.", "bad"); return; }
  var p = getProds();
  var prod = {
    id: Date.now(),
    name: n,
    cat: $("pcat").value,
    price: price,
    img: $("pimg").value.trim(),
    desc: $("pdesc").value.trim()
  };
  if (SUBS[prod.cat]) prod.sub = $("psub").value;
  p.push(prod);
  saveProds(p);
  $("pname").value = ""; $("pprice").value = ""; $("pimg").value = ""; $("pdesc").value = "";
  renderList();
  toast("Product add ho gaya ✔");
}

function thumb(p) {
  return p && p.img
    ? '<div class="th" style="background-image:url(' + esc(p.img) + ')"></div>'
    : '<div class="th em">' + catIcon(p.cat) + "</div>";
}

function renderList() {
  var p = getProds();
  $("pc").textContent = p.length;
  var h = "";
  p.forEach(function (pr) {
    h += '<div class="plist-row">' + thumb(pr) +
      '<div class="plist-info"><b>' + esc(pr.name) + "</b>" +
      '<span>' + catIcon(pr.cat) + " " + esc(pr.cat) + (pr.sub ? " · " + esc(pr.sub) : "") + " · " + inr(pr.price) + "</span></div>" +
      '<button class="btn danger sm" data-del="' + pr.id + '">Delete</button></div>';
  });
  $("plist").innerHTML = h || '<div class="plist-empty">📮 Abhi koi product nahi — upar "Add Product" se daalo.</div>';
}

document.addEventListener("click", function (e) {
  var d = e.target.closest("[data-del]");
  if (!d) return;
  if (!confirm("Yeh product delete karna hai?")) return;
  var p = getProds().filter(function (pr) { return String(pr.id) !== d.getAttribute("data-del"); });
  saveProds(p);
  renderList();
  toast("Product delete ho gaya.");
});

function genLink() {
  var amount = Math.round(parseFloat($("gamt").value || "0"));
  if (!amount || amount < 1) { toast("Pehle amount likhiye.", "bad"); return; }
  var note = $("gnote").value.trim() || ("Order " + refCode());
  var link = upiLink(s, amount, note);
  $("gline").textContent = link;
  $("gline").title = link;
  $("gqr").src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" + encodeURIComponent(link);
  $("gcopy").onclick = function () { copyText(link, this); };
  var msg = "*" + s.shopName + "* — Payment due\nAmount: " + inr(amount) + "\nNote: " + note +
    "\nPayment link (UPI, prepaid): " + link +
    "\nCOD available nahi hai — pehle payment, phir dispatch.";
  $("gsend").href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent(msg);
  $("genOut").classList.remove("hidden");
  $("genOut").scrollIntoView({ behavior: "smooth", block: "center" });
}