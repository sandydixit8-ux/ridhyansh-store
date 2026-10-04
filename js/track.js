seedIfEmpty();

var s = sett();

function $(id) { return document.getElementById(id); }

var ORDER_FLOW = [
  { key: "placed", label: "Order placed", icon: "🧾", note: "Your order has reached us." },
  { key: "payment", label: "Payment confirmed", icon: "💳", note: "Your UPI payment has been received." },
  { key: "dispatch", label: "Dispatched", icon: "📦", note: "Order has been dispatched — tracking will be shared on WhatsApp." },
  { key: "delivered", label: "Delivered", icon: "✅", note: "Order delivered. Enjoy!" }
];

function statusIndex(st) {
  var map = { pending: 0, paid: 1, shipped: 2, delivered: 3 };
  return map[st] != null ? map[st] : 0;
}

function fmtTime(ts) {
  try {
    var d = new Date(ts);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ts || ""; }
}

function doTrack() {
  $("tErr").classList.add("hidden");
  var ref = $("tRef").value.trim().toUpperCase();
  var phone = $("tPhone").value.trim().replace(/\D/g, "");
  var msg = [];
  if (ref.indexOf("RID") !== 0 || ref.length < 9) msg.push("Order ref must start with RID — e.g. RID26091341");
  if (phone.length !== 10) msg.push("Please enter a 10-digit phone number.");
  if (msg.length) {
    $("tErr").textContent = msg.join(" — ");
    $("tErr").classList.remove("hidden");
    return;
  }
  if (phone.length === 10) phone = "91" + phone;

  var orders = getOrders();
  var hit = null;
  orders.forEach(function (o) {
    if (!hit && String(o.ref).toUpperCase() === ref && String(o.phone).replace(/\D/g, "") === phone) hit = o;
  });

  if (!hit) {
    $("tErr").textContent = "This order was not found on this device. If you placed it from this phone/browser, it should be here. Once payment is confirmed, you will get an update on WhatsApp — otherwise please contact the seller.";
    $("tErr").classList.remove("hidden");
    return;
  }

  render(hit);
}

function render(o) {
  $("tResult").classList.remove("hidden");
  $("rRef").textContent = o.ref;
  $("rTime").textContent = fmtTime(o.time);
  var b = $("rBadge");
  var label = { pending: "Pending payment", paid: "Paid", shipped: "Dispatched", delivered: "Delivered" };
  var cls = { pending: "pend", paid: "paid", shipped: "ship", delivered: "del" };
  b.textContent = label[o.status] || o.status;
  b.className = "badge " + (cls[o.status] || "pend");

  var si = statusIndex(o.status);
  $("rTimeline").innerHTML = ORDER_FLOW.map(function (st, i) {
    var done = i < si || (i === si && (o.status === "paid" || o.status === "shipped" || o.status === "delivered"));
    var cur = i === si && o.status !== "placed";
    return '<div class="tl-step' + (done ? " done" : "") + (cur && o.status === "paid" ? " cur" : "") + '">' +
      '<div class="tl-ico">' + st.icon + "</div>" +
      '<div><b>' + st.label + "</b>" + (st.note ? "<small>" + st.note + "</small>" : "") + "</div></div>";
  }).join("");

  var items = o.items && o.items.length ? o.items : [{ name: o.product, size: o.size, qty: o.qty, price: o.amount, subtotal: o.amount }];
  $("rItems").innerHTML = '<div class="sum-list">' + items.map(function (it) {
    return '<div class="sum-line"><div><b>' + esc(it.name) + "</b>" +
      (it.size ? "<small>Size: " + esc(it.size) + "</small>" : "") +
      "<small>Qty: " + esc(String(Number(it.qty) || 0)) + "</small></div><b>" + inr(it.subtotal != null ? it.subtotal : it.price) + "</b></div>";
  }).join("") + "</div>";
  $("rAmt").textContent = inr(o.amount || 0);

  if (o.status === "pending" || !o.status) {
    $("rNote").textContent = "Payment is still pending — please make the UPI payment and send the screenshot on WhatsApp.";
  } else if (o.status === "paid") {
    $("rNote").textContent = "Payment confirmed. We will share the dispatch update on WhatsApp.";
  } else if (o.status === "shipped") {
    $("rNote").textContent = "Order is on its way. Delivery details will be shared on WhatsApp.";
  } else {
    $("rNote").textContent = "Order delivered. Thank you for shopping!";
  }

  $("tResult").scrollIntoView({ behavior: "smooth", block: "start" });
}

$("tFind").addEventListener("click", doTrack);
$("tRef").addEventListener("keydown", function (e) { if (e.key === "Enter") doTrack(); });
$("tPhone").addEventListener("keydown", function (e) { if (e.key === "Enter") doTrack(); });

document.title = s.shopName + " — Track Order";
$("brand").textContent = s.shopName;
$("footName").textContent = s.shopName;
$("yr").textContent = new Date().getFullYear();
$("navToggle").addEventListener("click", function () { $("nav").classList.toggle("open"); });
$("tWa").href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent("Hi! I would like to track my order. Order ref: ");

initCartUI();