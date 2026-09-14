seedIfEmpty();

var s = sett();
var filter = "all";

function $(id) { return document.getElementById(id); }

if (!authOk()) { location.href = "login.html"; }

document.title = s.shopName + " — Dashboard";
$("brand").textContent = s.shopName;
$("logout").addEventListener("click", function () { authClear(); location.href = "login.html"; });

var orders = getOrders();

function badge(st) {
  return st === "paid"
    ? '<span class="badge paid">✔ Paid</span>'
    : '<span class="badge pend">⧖ Pending</span>';
}

function fmtTime(t) {
  try {
    var d = new Date(t);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " +
      d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ""; }
}

function kpis() {
  var paidAmt = orders.filter(function (o) { return o.status === "paid"; }).reduce(function (a, o) { return a + o.amount; }, 0);
  var totAmt = orders.reduce(function (a, o) { return a + o.amount; }, 0);
  var paidN = orders.filter(function (o) { return o.status === "paid"; }).length;
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

function orderTable() {
  var list = orders.filter(function (o) {
    return filter === "all" || o.status === filter;
  });
  $("orderRows").innerHTML = list.map(function (o) {
    return '<tr><td><b>' + esc(o.ref) + "</b><br><small>" + fmtTime(o.time) + "</small></td>" +
      "<td>" + esc(o.product) + (o.sub ? ' <small>· ' + esc(o.sub) + "</small>" : "") + (o.size ? ' <small>· Size ' + esc(o.size) + "</small>" : "") + "</td>" +
      "<td>" + o.qty + "</td>" +
      "<td><b>" + inr(o.amount) + "</b></td>" +
      "<td><small>" + esc(o.name) + "<br>" + esc(o.phone) + "</small></td>" +
      "<td>" + badge(o.status) + "</td>" +
      "<td>" + (o.status === "pending"
        ? '<button class="btn green sm" data-paid="' + o.ref + '">Mark Paid</button>'
        : '<button class="btn danger sm ghost" data-delorder="' + o.ref + '">Delete</button>') + "</td></tr>";
  }).join("");
  $("orderEmpty").style.display = list.length ? "none" : "block";
}

function filters() {
  var h = "";
  ["all", "pending", "paid"].forEach(function (f) {
    var label = f === "all" ? "All" : f === "pending" ? "Pending" : "Paid";
    h += '<button class="chip' + (filter === f ? " on" : "") + '" data-f="' + f + '">' + label + "</button>";
  });
  $("filters").innerHTML = h;
  document.querySelectorAll("#filters .chip").forEach(function (b) {
    b.onclick = function () { filter = b.getAttribute("data-f"); filters(); orderTable(); };
  });
}

document.addEventListener("click", function (e) {
  var p = e.target.closest("[data-paid]");
  if (p) {
    var r = p.getAttribute("data-paid");
    var o = getOrders();
    o.forEach(function (x, i) { if (x.ref === r) { o[i].status = "paid"; } });
    saveOrders(o);
    orders = getOrders();
    toast(r + " marked as PAID ✔");
    kpis(); prodTable(); catTable(); orderTable();
    return;
  }
  var d = e.target.closest("[data-delorder]");
  if (d) {
    if (!confirm("Yeh order delete karna hai?")) return;
    var r2 = d.getAttribute("data-delorder");
    saveOrders(getOrders().filter(function (x) { return x.ref !== r2; }));
    orders = getOrders();
    toast("Order delete ho gaya.");
    kpis(); prodTable(); catTable(); orderTable();
  }
});

filters();
kpis();
prodTable();
catTable();
orderTable();