seedIfEmpty();

var s = sett();

function $(id) { return document.getElementById(id); }

var ORDER_FLOW = [
  { key: "placed", label: "Order placed", icon: "🧾", note: "Order hamare paas aa gaya." },
  { key: "payment", label: "Payment confirmed", icon: "💳", note: "UPI payment mil gayi." },
  { key: "dispatch", label: "Dispatched", icon: "📦", note: "Order dispatch ho gaya — tracking WhatsApp par milega." },
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
  if (ref.indexOf("RID") !== 0 || ref.length < 9) msg.push("Order ref RID se shuru hota hai — e.g. RID26091341");
  if (phone.length !== 10) msg.push("10-digit phone number daaliye.");
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
    $("tErr").textContent = "Yeh order is device nahi mila. Agar aapne order isi phone/browser se kiya tha to yahan aana chahiye tha. Payment confirm hone par WhatsApp par update milega — otherwise seller se poochhiye.";
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
      "<small>Qty: " + it.qty + "</small></div><b>" + inr(it.subtotal != null ? it.subtotal : it.price) + "</b></div>";
  }).join("") + "</div>";
  $("rAmt").textContent = inr(o.amount || 0);

  if (o.status === "pending" || !o.status) {
    $("rNote").textContent = "Payment abhi pending hai — UPI payment karke WhatsApp par screenshot bhejein.";
  } else if (o.status === "paid") {
    $("rNote").textContent = "Payment confirm ho gayi. Dispatch WhatsApp par update karenge.";
  } else if (o.status === "shipped") {
    $("rNote").textContent = "Order dispatch par hai. Delivery details WhatsApp par milengi.";
  } else {
    $("rNote").textContent = "Order deliver ho chuka hai. Thank you for shopping!";
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
$("tWa").href = "https://wa.me/" + waDigits(s.whatsapp) + "?text=" + encodeURIComponent("Hi! Mujhe apna order track karna hai. Order ref: ");

initCartUI();