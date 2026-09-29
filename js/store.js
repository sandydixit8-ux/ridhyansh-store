var CATS = ["Clothing", "Electronics", "Footwear", "Accessories", "Home & Kitchen"];
var SUBS = { "Clothing": ["Men", "Women", "Top Wear", "Bottom Wear"] };
var CATS_ICON = { "Clothing": "👕", "Electronics": "🎧", "Footwear": "👟", "Accessories": "⌚", "Home & Kitchen": "🍳" };

function catIcon(c) { return CATS_ICON[c] || "🛍️"; }

var SEED = [
  { id: 1, cat: "Clothing", sub: "Women Top Wear", name: "Chenille Cotton Kurta (Women)", price: 499, mrp: 799, desc: "Soft cotton, breathable, all sizes.", rating: 4.6 },
  { id: 2, cat: "Clothing", sub: "Men Top Wear", name: "Casual Linen Shirt (Men)", price: 699, mrp: 999, desc: "Premium linen, regular fit, full sleeves.", rating: 4.5 },
  { id: 3, cat: "Clothing", sub: "Men Bottom Wear", name: "Stretch Joggers (Men)", price: 599, mrp: 899, desc: "Flexible waist, side pockets.", rating: 4.4 },
  { id: 4, cat: "Clothing", sub: "Women Bottom Wear", name: "Palazzo Pants (Women)", price: 549, mrp: 799, desc: "Flowy fit, elastic waist, all sizes.", rating: 4.7 },
  { id: 5, cat: "Electronics", name: "20W Type-C Fast Charger", price: 349, mrp: 499, desc: "Fast charging, 2 pin, 1 yr warranty.", rating: 4.7 },
  { id: 6, cat: "Footwear", name: "Sports Running Shoes", price: 1299, mrp: 1799, desc: "Cushioned sole, size 6-10.", rating: 4.5 },
  { id: 7, cat: "Accessories", name: "Minimalist Analog Watch", price: 799, mrp: 1199, desc: "Stainless steel, water resistant.", rating: 4.8 },
  { id: 8, cat: "Home & Kitchen", name: "Non-Stick Frying Pan 26cm", price: 599, mrp: 899, desc: "Even heating, easy clean.", rating: 4.4 }
];

function lsGet(k, d) {
  try {
    var v = JSON.parse(localStorage.getItem(k));
    return v == null ? d : v;
  } catch (e) { return d; }
}

function lsSet(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

function sett() {
  var s = lsGet("rh_settings", {});
  if (Number(lsGet("rh_cred_v", 0)) < 3) {
    s.rh_user = "ridhyansh007";
    s.rh_pass = "admin@123";
    saveSett(s);
  }
  if (!s.shopName) s.shopName = "Ridhyansh Store";
  if (!s.rh_user) s.rh_user = "ridhyansh007";
  if (!s.rh_pass) s.rh_pass = "admin@123";
  if (!s.upiId) s.upiId = "6262072151@ybl";
  if (!s.whatsapp) s.whatsapp = "6262072151";
  if (s.shipFee == null) s.shipFee = "60";
  if (s.freeShipAbove == null) s.freeShipAbove = "999";
  if (s.lowStock == null) s.lowStock = "3";
  return s;
}

function getOrders() { return lsGet("rh_orders", []); }
function saveOrders(o) { lsSet("rh_orders", o); }
function addOrder(o) { var l = getOrders(); l.unshift(o); saveOrders(l); }

function authOk() { return sessionStorage.getItem("rh_auth") === "1"; }
function authSet() { sessionStorage.setItem("rh_auth", "1"); }
function authClear() { sessionStorage.removeItem("rh_auth"); }

function saveSett(s) { lsSet("rh_settings", s); }

function getProds() { return lsGet("rh_products", []); }
function saveProds(p) {
  try { lsSet("rh_products", p); return true; }
  catch (e) { return false; }
}

function getStockOf(p) {
  var st = Number(p && p.stock);
  if (isNaN(st)) return 20;
  return Math.max(0, Math.floor(st));
}

function shipFeeFor(amount) {
  var s2 = sett();
  var fee = Number(s2.shipFee) || 0;
  if (!fee) return 0;
  var free = Number(s2.freeShipAbove) || 0;
  if (free && amount >= free) return 0;
  return fee;
}

function seedIfEmpty() {
  var v = lsGet("rh_seed_v", 0);
  if (v < 2) { lsSet("rh_products", SEED); lsSet("rh_seed_v", 2); }
}

var CDB = "https://ridhyansh-18715-default-rtdb.asia-southeast1.firebasedatabase.app";
function dbUrl() {
  var u = (sett().rh_cdb || "").trim();
  return u || CDB;
}

function fbKey() { return (sett().rh_fbkey || "AIzaSyAl9TCiymhOVVgwwleS9C91s6nlUFoZW30").trim(); }
function fbCreds() {
  return { email: (sett().rh_fbemail || "").trim(), pass: sett().rh_fbpass || "" };
}

function fbLogin(autoCreate) {
  var k = fbKey();
  if (!k) return Promise.reject("nokey");
  var c = fbCreds();
  if (!c.email || !c.pass) return Promise.reject("nocreds");
  function call(ep) {
    return fetch("https://identitytoolkit.googleapis.com/v1/accounts:" + ep + "?key=" + encodeURIComponent(k), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: c.email, password: c.pass, returnSecureToken: true })
    }).then(function (r) { return r.json(); });
  }
  return call("signInWithPassword").then(function (j) {
    if (j.idToken) return j;
    if (!autoCreate) throw new Error(j.error ? j.error.message : "noauth");
    return call("signUp").then(function (j2) {
      if (j2.idToken) return j2;
      throw new Error(j2.error ? j2.error.message : "authfail");
    });
  });
}

function fbBootstrap() {
  return fbLogin(true).then(function (au) {
    return cput("config", { ownerUid: au.localId }).then(function (ok) {
      return { au: au, ok: ok };
    });
  });
}

function ensureOwner() {
  return fbLogin().then(function (au) {
    return cget("config").then(function (cfg) {
      if (cfg && cfg.ownerUid && cfg.ownerUid !== au.localId) return false;
      if (!cfg || !cfg.ownerUid) return cput("config", { ownerUid: au.localId });
      return true;
    });
  });
}

function cget(path, tok) {
  var u = dbUrl();
  if (!u) return Promise.resolve(null);
  var q = tok ? "?auth=" + encodeURIComponent(tok) : "";
  return fetch(u + "/" + path + ".json" + q, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("http")); })
    .catch(function () { return null; });
}

function cput(path, data, tok) {
  var u = dbUrl();
  if (!u) return Promise.resolve(false);
  var q = tok ? "?auth=" + encodeURIComponent(tok) : "";
  return fetch(u + "/" + path + ".json" + q, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(function (r) { return r.ok; }).catch(function () { return false; });
}

function trackEvnt(kind, id) {
  var u = dbUrl();
  if (!u || !id) return;
  var key = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  cput("stats/" + kind + "/" + id + "/" + key, { t: Date.now() });
}
function trackImp(id) { trackEvnt("impressions", id); }
function trackClk(id) { trackEvnt("clicks", id); }

function loadStats(tok) {
  return cget("stats", tok).then(function (obj) {
    var s = {};
    ["impressions", "clicks"].forEach(function (kind) {
      var node = obj && obj[kind] ? obj[kind] : {};
      Object.keys(node).forEach(function (id) {
        s[id] = s[id] || { imp: 0, clk: 0 };
        var k = node[id];
        var n = 0;
        if (k && typeof k === "object") n = Object.keys(k).filter(function (x) { return x !== "t"; }).length;
        if (k && typeof k === "number") n = k;
        if (kind === "impressions") s[id].imp += n; else s[id].clk += n;
      });
    });
    return s;
  });
}

function loadProds() {
  return cget("products").then(function (list) {
    if (Array.isArray(list) && list.length) {
      saveProds(list);
      return list;
    }
    if (list && typeof list === "object") {
      var arr = Object.keys(list).map(function (k) { return list[k]; }).filter(function (x) { return x && x.id; });
      if (arr.length) { saveProds(arr); return arr; }
    }
    return getProds();
  });
}

function loadOrders(tok) {
  return cget("orders", tok).then(function (obj) {
    var list = getOrders();
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach(function (k) {
        var o = obj[k];
        if (o && o.ref) list = list.filter(function (x) { return x.ref !== o.ref; }).concat([o]);
      });
    }
    return list;
  });
}

function saveOrderCloud(o) {
  if (dbUrl()) return cput("orders/" + o.ref, o);
  return Promise.resolve(false);
}

// ===== Cart (client-side, prices always re-derived from catalog) =====
function getCart() { return lsGet("rh_cart", []); }
function saveCart(c) { lsSet("rh_cart", c); }
function clearCart() { saveCart([]); }
function cartCount() {
  var n = 0;
  getCart().forEach(function (i) { n += (Number(i.qty) || 1); });
  return n;
}
function prodById(id) {
  var ps = getProds();
  for (var i = 0; i < ps.length; i++) if (String(ps[i].id) === String(id)) return ps[i];
  return null;
}
function cartData() {
  var c = getCart();
  var items = [];
  var subtotal = 0;
  c.forEach(function (line) {
    var p = prodById(line.id);
    if (!p) return;
    var stk = getStockOf(p);
    var qty = Math.max(1, Math.min(stk, Number(line.qty) || 1));
    var price = Number(p.price) || 0;
    var sub = price * qty;
    subtotal += sub;
    items.push({
      id: p.id, name: p.name, cat: p.cat, sub: p.sub || "",
      size: line.size || "", qty: qty, price: price, img: firstImg(p),
      subtotal: sub, stock: stk
    });
  });
  var ship = shipFeeFor(subtotal);
  return { items: items, subtotal: subtotal, ship: ship, total: subtotal + ship };
}
function addToCart(id, size, qty) {
  var c = getCart();
  size = size || ""; qty = Math.max(1, Number(qty) || 1);
  var found = false;
  c.forEach(function (i) {
    if (String(i.id) === String(id) && String(i.size || "") === String(size)) { i.qty = (Number(i.qty) || 1) + qty; found = true; }
  });
  if (!found) c.push({ id: String(id), size: size, qty: qty });
  saveCart(c);
  return cartCount();
}
function setCartQty(id, size, qty) {
  var c = getCart();
  qty = Number(qty) || 0;
  if (qty <= 0) {
    c = c.filter(function (i) { return !(String(i.id) === String(id) && String(i.size || "") === String(size || "")); });
  } else {
    c.forEach(function (i) { if (String(i.id) === String(id) && String(i.size || "") === String(size || "")) i.qty = qty; });
  }
  saveCart(c);
}

// ===== URL / SEO helpers (pure static friendly) =====
function slugify(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function pUrl(p) { return "product.html?p=" + encodeURIComponent(p.id); }

function reelFile(p) { return "reels/" + p.id + "_reel_1080x1920.mp4"; }
function videoFor(p) {
  if (p && p.video && String(p.video).trim()) return String(p.video).trim();
  return "";
}

function trackPV(id) { trackEvnt("views", id); }

// ===== Cart UI (shared drawer across storefront pages) =====
function cartEl(id) { return document.getElementById(id); }
function openCart() {
  var ov = cartEl("cartOv"), dr = cartEl("cartDrawer");
  if (!dr) return;
  ov && ov.classList.remove("hidden");
  dr.classList.add("open");
  dr.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  renderCart();
}
function closeCart() {
  var ov = cartEl("cartOv"), dr = cartEl("cartDrawer");
  if (!dr) return;
  ov && ov.classList.add("hidden");
  dr.classList.remove("open");
  dr.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}
function updateCartCount() {
  var c = cartEl("cartCount");
  if (c) c.textContent = cartCount();
}
function cartQtyOf(id, size) {
  var n = 0;
  getCart().forEach(function (i) {
    if (String(i.id) === String(id) && String(i.size || "") === String(size || "")) n += (Number(i.qty) || 1);
  });
  return n;
}
function renderCart() {
  var d = cartData();
  var box = cartEl("cartItems");
  if (!box) return;
  if (!d.items.length) {
    box.innerHTML = '<div class="cart-empty"><div>🛒</div><p>Cart khaali hai.</p><a class="btn main sm" href="index.html" onclick="closeCart()">Shop now</a></div>';
  } else {
    box.innerHTML = d.items.map(function (it) {
      return '<div class="citem">' +
        (it.img ? '<div class="cimg" style="background-image:url(' + esc(it.img) + ')"></div>' : '<div class="cimg em">' + catIcon(it.cat) + "</div>") +
        '<div class="cinfo"><b>' + esc(it.name) + "</b>" +
        (it.size ? "<small>Size: " + esc(it.size) + "</small>" : "") +
        '<div class="csub">' + inr(it.price) + " × " + it.qty + " = <b>" + inr(it.subtotal) + "</b></div>" +
        '<div class="cqty"><button class="qtybtn" data-q="' + it.id + '" data-qs="' + esc(it.size) + '" data-qv="-1">−</button>' +
        '<span>' + it.qty + '</span>' +
        '<button class="qtybtn" data-q="' + it.id + '" data-qs="' + esc(it.size) + '" data-qv="1">+</button>' +
        '<button class="crm" data-q="' + it.id + '" data-qs="' + esc(it.size) + '" data-qv="rm" title="Remove">🗑️</button></div></div></div>';
    }).join("");
  }
  var sub = cartEl("cartSubtotal"), ship = cartEl("cartShip"), tot = cartEl("cartTotal"), sr = cartEl("cartShipRow");
  if (sub) sub.textContent = inr(d.subtotal);
  if (ship) ship.textContent = d.ship ? inr(d.ship) : "FREE";
  if (sr) sr.classList.toggle("hidden", d.subtotal <= 0);
  if (tot) tot.textContent = inr(d.total);
  updateCartCount();
}
function addCartUI(id, size, qty) {
  var p = prodById(id);
  if (!p) { toast("Product nahi mila.", "bad"); return; }
  if (p.sizes && p.sizes.length && !size) { toast("Pehle size select kijiye.", "bad"); return; }
  var stk = getStockOf(p);
  if (cartQtyOf(id, size) + (qty || 1) > stk) { toast("Sirf " + stk + " piece baaki hain.", "bad"); return; }
  addToCart(id, size, qty);
  renderCart();
  openCart();
  toast("Cart mein add ho gaya 🛒", "ok");
}
function initCartUI() {
  var btn = cartEl("cartBtn");
  if (!btn) return;
  btn.addEventListener("click", openCart);
  var cl = cartEl("cartClose");
  if (cl) cl.addEventListener("click", closeCart);
  var ov = cartEl("cartOv");
  if (ov) ov.addEventListener("click", closeCart);
  document.addEventListener("click", function (e) {
    var qb = e.target.closest("[data-q]:not([data-qv])");
    if (!qb) return;
    var id2 = qb.getAttribute("data-q");
    var sz2 = qb.getAttribute("data-qs") || "";
    var qv = qb.getAttribute("data-qv");
    var cur = cartQtyOf(id2, sz2);
    if (qv === "rm") { setCartQty(id2, sz2, 0); }
    else if (Number(qv) === 1) {
      var pp = prodById(id2);
      var stk2 = pp ? getStockOf(pp) : 1;
      if (cur + 1 > stk2) { toast("Sirf " + stk2 + " piece baaki hain.", "bad"); return; }
      setCartQty(id2, sz2, cur + 1);
    } else { setCartQty(id2, sz2, cur - 1); }
    renderCart();
  });
  updateCartCount();
}

function inr(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }

function discInfo(p) {
  var pr = p.price || 0;
  var mrp = p.mrp || 0;
  var off = 0;
  if (mrp > pr && pr > 0) off = Math.round(((mrp - pr) / mrp) * 100);
  return { mrp: mrp, price: pr, off: off };
}

function mrpHtml(p) {
  var d = discInfo(p);
  if (d.off) {
    return '<s class="mrp">' + inr(d.mrp) + '</s> <b class="price">' + inr(d.price) + '</b> <span class="off">' + d.off + '% OFF</span>';
  }
  return '<b class="price">' + inr(d.price) + '</b>';
}

function stars(r) {
  var n = Number(r || 0);
  var full = Math.round(n);
  var s = "";
  for (var i = 0; i < 5; i++) s += i < full ? "★" : "☆";
  return s;
}

function refCode() {
  var d = new Date();
  var y = String(d.getFullYear()).slice(2);
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var dd = String(d.getDate()).padStart(2, "0");
  return "RID" + y + m + dd + Math.floor(100 + Math.random() * 900);
}

function upiLink(s, amount, note) {
  var q = [
    "pa=" + encodeURIComponent((s.upiId || "")),
    "pn=" + encodeURIComponent(s.shopName || "Ridhyansh Store"),
    "am=" + amount,
    "cu=INR",
    "tn=" + encodeURIComponent(note || "Order")
  ];
  return "upi://pay?" + q.join("&");
}

function waDigits(num) {
  var d = String(num || "").replace(/\D/g, "");
  if (d.length === 10) d = "91" + d;
  return d;
}

function copyText(t, btn) {
  var ta = document.createElement("textarea");
  ta.value = t;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  if (btn) {
    var o = btn.textContent;
    btn.textContent = "✓ Copied";
    setTimeout(function () { btn.textContent = o; }, 1600);
  }
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
}

var IMG_PH = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'>" +
  "<rect width='400' height='500' fill='#f1f1ef'/>" +
  "<text x='200' y='240' font-family='Arial' font-size='22' fill='#b0b0aa' text-anchor='middle'>No image</text>" +
  "<text x='200' y='270' font-family='Arial' font-size='14' fill='#ccc' text-anchor='middle'>Ridhyansh Store</text></svg>"
);

function hasImg(p) {
  return (p && Array.isArray(p.images) && p.images.some(Boolean)) || (p && p.img);
}

function imgsOf(p) {
  if (p && Array.isArray(p.images)) return p.images.filter(Boolean);
  if (p && p.img) return [p.img];
  return [IMG_PH];
}

function firstImg(p) {
  var i = imgsOf(p);
  return p && hasImg(p) ? i[0] : "";
}

function toast(msg, type) {
  var box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.className = "toasts";
    document.body.appendChild(box);
  }
  var t = document.createElement("div");
  t.className = "toast " + (type || "ok");
  t.innerHTML = esc(msg);
  box.appendChild(t);
  setTimeout(function () { t.classList.add("out"); }, 2400);
  setTimeout(function () { if (t.parentNode) box.removeChild(t); }, 2800);
}