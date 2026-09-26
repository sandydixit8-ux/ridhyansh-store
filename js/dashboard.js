seedIfEmpty();

var s = sett();
var filter = "all";

function $(id) { return document.getElementById(id); }

if (!authOk()) { location.href = "login.html"; }

document.title = s.shopName + " — Dashboard";
$("brand").textContent = s.shopName;
$("logout").addEventListener("click", function () { authClear(); location.href = "login.html"; });

var orders = [];
var stats = {};
var fbTok = null;

function getFbTok() {
  if (fbTok) return Promise.resolve(fbTok);
  return fbLogin().then(function (au) { fbTok = au.idToken; return au.idToken; }).catch(function () { return null; });
}

getFbTok().then(function (tok) {
  return Promise.all([loadOrders(tok), loadStats(tok), loadProds()]);
}).then(function (res) {
  orders = res[0];
  stats = res[1];
  renderAll();
});

function badge(st) {
  var map = {
    pending: '<span class="badge pend">⧖ Pending</span>',
    paid: '<span class="badge paid">✔ Paid</span>',
    shipped: '<span class="badge ship">🚚 Shipped</span>',
    delivered: '<span class="badge del">📦 Delivered</span>'
  };
  return map[st] || map.pending;
}

function fmtTime(t) {
  try {
    var d = new Date(t);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ""; }
}

function kpis() {
  var paidAmt = orders.filter(function (o) { return o.status === "paid" || o.status === "shipped" || o.status === "delivered"; }).reduce(function (a, o) { return a + o.amount; }, 0);
  var totAmt = orders.reduce(function (a, o) { return a + o.amount; }, 0);
  var paidN = orders.filter(function (o) { return o.status === "paid" || o.status === "shipped" || o.status === "delivered"; }).length;
  var pendN = orders.length - paidN;
  var cards = [
    { icon: "🧾", label: "Total Orders", val: orders.length, sub: "rukhe orders: " + pendN },
    { icon: "✅", label: "Paid Orders", val: paidN, sub: "payment confirm" },
    { icon: "⧖", label: "Pending", val: pendN, sub: "payment aana baaki" },
    { icon: "💰", label: "Revenue (paid)", val: inr(paidAmt), sub: "total value: " + inr(totAmt) }
  ];
  $("kpis").innerHTML = cards.map(function (c) {
    return '<div class="kpi"><div class="kpi-icon">' + c.icon + '</div><div><div class="kpi-val">' + c.val +
      '</div><div class="kpi-label">' + c.label + '</div><div class="kpi-sub">' + c.sub + "</div></div></div>";
  }).join("");
}

function prodTable() {
  var by = {};
  orders.forEach(function (o) {
    var k = o.product || "?";
    by[k] = by[k] || { name: k, n: 0, qty: 0, amt: 0 };
    by[k].n += 1;
    by[k].qty += o.qty;
    by[k].amt += o.amount;
  });
  var rows = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.amt - a.amt; });
  $("prodRows").innerHTML = rows.map(function (r) {
    return '<tr><td><b>' + esc(r.name) + "</b></td><td>" + r.n + "</td><td>" + r.qty + '</td><td><b>' + inr(r.amt) + "</b></td></tr>";
  }).join("");
  $("prodEmpty").style.display = rows.length ? "none" : "block";
}

function catTable() {
  var by = {};
  orders.forEach(function (o) {
    var k = o.cat || "?";
    by[k] = by[k] || { name: k, qty: 0, amt: 0 };
    by[k].qty += o.qty;
    by[k].amt += o.amount;
  });
  var rows = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.amt - a.amt; });
  $("catRows").innerHTML = rows.map(function (r) {
    return '<tr><td>' + catIcon(r.name) + " " + esc(r.name) + "</td><td>" + r.qty + '</td><td><b>' + inr(r.amt) + "</b></td></tr>";
  }).join("");
  $("catEmpty").style.display = rows.length ? "none" : "block";
}

function statTotals() {
  var imp = 0, clk = 0;
  Object.keys(stats).forEach(function (id) {
    imp += stats[id].imp || 0;
    clk += stats[id].clk || 0;
  });
  $("stImp").textContent = imp;
  $("stClk").textContent = clk;
  $("stCtr").textContent = imp ? ((clk / imp) * 100).toFixed(1) + "%" : "—";
}

function statTable() {
  var prods = getProds();
  var names = {};
  prods.forEach(function (p) { names[p.id] = p.name; });
  var rows = Object.keys(stats).map(function (id) {
    var s = stats[id];
    return { id: id, name: names[id] || ("Product #" + id), imp: s.imp || 0, clk: s.clk || 0 };
  }).sort(function (a, b) { return b.imp - a.imp; });
  $("statRows").innerHTML = rows.map(function (r) {
    var ctr = r.imp ? ((r.clk / r.imp) * 100).toFixed(1) + "%" : "—";
    return "<tr><td><b>" + esc(r.name) + "</b></td><td>" + r.imp + "</td><td>" + r.clk + "</td><td>" + ctr + "</td></tr>";
  }).join("");
  $("statEmpty").style.display = rows.length ? "none" : "block";
}

function orderTable() {
  var list = orders.filter(function (o) {
    return filter === "all" || o.status === filter;
  });
  $("orderRows").innerHTML = list.map(function (o) {
    var actions = "";
    if (o.status === "pending") actions = '<button class="btn green sm" data-paid="' + o.ref + '">Mark Paid</button>';
    else if (o.status === "paid") actions = '<button class="btn blue sm" data-ship="' + o.ref + '">Mark Shipped</button>';
    else if (o.status === "shipped") actions = '<button class="btn green sm" data-deliv="' + o.ref + '">Mark Delivered</button>';
    else actions = '<button class="btn danger sm ghost" data-delorder="' + o.ref + '">Delete</button>';
    return '<tr><td><b>' + esc(o.ref) + "</b><br><small>" + fmtTime(o.time) + "</small></td>" +
      "<td>" + esc(o.product) + (o.sub ? ' <small>· ' + esc(o.sub) + "</small>" : "") + (o.size ? ' <small>· Size ' + esc(o.size) + "</small>" : "") + "</td>" +
      "<td>" + o.qty + "</td>" +
      "<td><b>" + inr(o.amount) + "</b></td>" +
      "<td><small>" + esc(o.name) + "<br>" + esc(o.phone) + "</small></td>" +
      "<td>" + badge(o.status) + "</td>" +
      "<td>" + actions + "</td></tr>";
  }).join("");
  $("orderEmpty").style.display = list.length ? "none" : "block";
}

function filters() {
  var h = "";
  ["all", "pending", "paid", "shipped", "delivered"].forEach(function (f) {
    var label = f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1);
    h += '<button class="chip' + (filter === f ? " on" : "") + '" data-f="' + f + '">' + label + "</button>";
  });
  $("filters").innerHTML = h;
  document.querySelectorAll("#filters .chip").forEach(function (b) {
    b.onclick = function () { filter = b.getAttribute("data-f"); filters(); orderTable(); };
  });
}

function setStatus(r, st, msg) {
  orders.forEach(function (x) { if (x.ref === r) x.status = st; });
  saveOrders(orders);
  var o = orders.filter(function (x) { return x.ref === r; })[0];
  if (o) getFbTok().then(function (tok) { if (tok) cput("orders/" + r, o, tok); });
  toast(msg);
  renderAll();
}

function renderAll() { kpis(); statTotals(); statTable(); prodTable(); catTable(); orderTable(); }

document.addEventListener("click", function (e) {
  var p = e.target.closest("[data-paid]");
  if (p) { setStatus(p.getAttribute("data-paid"), "paid", p.getAttribute("data-paid") + " marked as PAID ✔"); return; }
  var sh = e.target.closest("[data-ship]");
  if (sh) { setStatus(sh.getAttribute("data-ship"), "shipped", sh.getAttribute("data-ship") + " marked as SHIPPED 🚚"); return; }
  var dl = e.target.closest("[data-deliv]");
  if (dl) { setStatus(dl.getAttribute("data-deliv"), "delivered", dl.getAttribute("data-deliv") + " marked as DELIVERED 📦"); return; }
  var d = e.target.closest("[data-delorder]");
  if (d) {
    if (!confirm("Yeh order delete karna hai?")) return;
    var r2 = d.getAttribute("data-delorder");
    saveOrders(orders.filter(function (x) { return x.ref !== r2; }));
    getFbTok().then(function (tok) {
      if (tok) cput("orders/" + r2, null, tok);
      return loadOrders(tok);
    }).then(function (l) { orders = l; renderAll(); });
  }
});

filters();
renderAll();