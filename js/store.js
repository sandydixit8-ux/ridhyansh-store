var CATS = ["Clothing", "Electronics", "Footwear", "Accessories", "Home & Kitchen"];
var SUBS = { "Clothing": ["Men", "Women", "Top Wear", "Bottom Wear"] };
var CATS_ICON = { "Clothing": "👕", "Electronics": "🎧", "Footwear": "👟", "Accessories": "⌚", "Home & Kitchen": "🍳" };

function catIcon(c) { return CATS_ICON[c] || "🛍️"; }

var SEED = [
  { id: 1, cat: "Clothing", sub: "Women Top Wear", name: "Chenille Cotton Kurta (Women)", price: 499, desc: "Soft cotton, breathable, all sizes.", rating: 4.6 },
  { id: 2, cat: "Clothing", sub: "Men Top Wear", name: "Casual Linen Shirt (Men)", price: 699, desc: "Premium linen, regular fit, full sleeves.", rating: 4.5 },
  { id: 3, cat: "Clothing", sub: "Men Bottom Wear", name: "Stretch Joggers (Men)", price: 599, desc: "Flexible waist, side pockets.", rating: 4.4 },
  { id: 4, cat: "Clothing", sub: "Women Bottom Wear", name: "Palazzo Pants (Women)", price: 549, desc: "Flowy fit, elastic waist, all sizes.", rating: 4.7 },
  { id: 5, cat: "Electronics", name: "20W Type-C Fast Charger", price: 349, desc: "Fast charging, 2 pin, 1 yr warranty.", rating: 4.7 },
  { id: 6, cat: "Footwear", name: "Sports Running Shoes", price: 1299, desc: "Cushioned sole, size 6-10.", rating: 4.5 },
  { id: 7, cat: "Accessories", name: "Minimalist Analog Watch", price: 799, desc: "Stainless steel, water resistant.", rating: 4.8 },
  { id: 8, cat: "Home & Kitchen", name: "Non-Stick Frying Pan 26cm", price: 599, desc: "Even heating, easy clean.", rating: 4.4 }
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
  if (!s.shopName) s.shopName = "Ridhyansh";
  if (!s.rh_user) s.rh_user = "ridhyansh007";
  if (!s.rh_pass) s.rh_pass = "admin@123";
  if (!s.upiId) s.upiId = "6262072151@ybl";
  if (!s.whatsapp) s.whatsapp = "6262072151";
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

function fbLogin() {
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
    return call("signUp").then(function (j2) {
      if (j2.idToken) return j2;
      throw new Error(j2.error ? j2.error.message : "authfail");
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
  if (dbUrl()) cput("orders/" + o.ref, o);
}

function inr(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }

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
    "pn=" + encodeURIComponent(s.shopName || "Ridhyansh"),
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

function imgsOf(p) {
  if (p && Array.isArray(p.images)) return p.images.filter(Boolean);
  if (p && p.img) return [p.img];
  return [];
}

function firstImg(p) {
  var i = imgsOf(p);
  return i.length ? i[0] : "";
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