/**
 * Pure order-domain helpers (dependency-free for tests).
 * The Firestore side effects live in services/orderService.js.
 */

/**
 * Order ref format matches v1 (RID...) so track-order UX stays familiar.
 * e.g. RID261007001234
 */
function makeRef(now) {
  const d = now || new Date();
  const pad = function (n, w) {
    const s = String(n);
    return s.length >= w ? s : new Array(w - s.length + 1).join("0") + s;
  };
  const ymd = d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2);
  const hm = pad(d.getHours(), 2) + pad(d.getMinutes(), 2) + pad(d.getSeconds(), 2);
  const rnd = Math.floor(Math.random() * 9000) + 1000;
  return "RID" + ymd + hm + rnd;
}

/**
 * Map client cart items -> server-priced lines using DB product/variant data.
 * Throws Error objects with a machine-readable `code` for the route to map.
 *
 * resolved: [{ product, variant }] aligned 1:1 with cart items.
 */
function itemsToLines(cartItems, resolved) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) throw err("invalid_items", "Cart is empty");
  if (cartItems.length > 50) throw err("invalid_items", "Too many items");
  const map = Object.create(null);

  const lines = cartItems.map(function (it, i) {
    const pid = String(it.productId || "");
    const vid = String(it.variantId || "default");
    const qty = Number(it.qty);
    if (!pid || pid.length < 8) throw err("invalid_items", "Bad product id");
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw err("invalid_qty", "Quantity out of range");
    const key = pid + "|" + vid;
    if (map[key]) throw err("duplicate_item", "Duplicate line");
    map[key] = true;

    const r = resolved[i];
    if (!r || !r.product) throw err("invalid_product", "Unknown product");

    const unitPaise = (r.variant && r.variant.price != null) ? Number(r.variant.price) : Number(r.product.price);
    if (!(unitPaise > 0)) throw err("invalid_product", "Unpriced product");

    return {
      productId: pid,
      variantId: vid,
      sku: (r.variant && r.variant.sku) || r.product.sku || "",
      name: r.product.name || "",
      attributes: (r.variant && r.variant.attributes) || {},
      unitPricePaise: unitPaise,
      gstRate: Number(r.product.gstSlab) || 0,
      qty: qty
    };
  });

  const subtotal = lines.reduce(function (s, l) { return s + l.unitPricePaise * l.qty; }, 0);
  if (!(subtotal > 0)) throw err("invalid_items", "Subtotal is zero");
  if (subtotal > 10000000) throw err("invalid_items", "Cart exceeds limit");

  return lines;
}

function buildOrderDoc(input, lines, totals, ref, now) {
  const t = now || new Date();
  const addr = input.customer.addr || {};
  return {
    ref: ref,
    status: "PENDING_PAYMENT",
    items: lines,
    totals: totals,
    customer: {
      name: String(input.customer.name || ""),
      phone: String(input.customer.phone || ""),
      email: input.customer.email ? String(input.customer.email) : "",
      addr: {
        line: String(addr.line || ""),
        city: String(addr.city || ""),
        state: String(addr.state || ""),
        pincode: String(addr.pincode || ""),
        landmark: addr.landmark ? String(addr.landmark) : ""
      }
    },
    payment: { mode: "UPI", status: "pending", linkId: null, linkUrl: null },
    coupon: input.couponCode ? { code: String(input.couponCode) } : null,
    orderKey: String(input.orderKey || ""),
    source: "web",
    auditTrail: [{ at: t, event: "created", by: "customer" }],
    createdAt: t,
    updatedAt: t
  };
}

function err(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

module.exports = { makeRef, itemsToLines, buildOrderDoc };