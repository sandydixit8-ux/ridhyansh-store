/**
 * Order placement service (the only place that touches Firestore for orders).
 *
 * Security sequence:
 *  1. client bundles {orderKey, items, customer, couponCode}
 *  2. orderService re-resolves every product/variant and price from the DB
 *     (client totals are discarded) - computeTotals() is the only arithmetic.
 *  3. stock is reserved in an atomic Firestore transaction.
 *  4. order doc created with server-derived totals; orderKey dedupes retries.
 */
const { db, FieldValue, Timestamp } = require("../db");
const { computeTotals } = require("../domain/pricing");
const { makeRef, itemsToLines, buildOrderDoc } = require("../domain/orders");
const razorpay = require("./payments/razorpay");

function orderRef(id) { return db.collection("orders").doc(id); }

async function findExistingByOrderKeyAndPhone(orderKey, phone) {
  const snap = await db.collection("orders")
    .where("orderKey", "==", orderKey)
    .limit(2)
    .get();
  for (const d of snap.docs) {
    if (String(d.data().customer.phone) === String(phone)) return d;
  }
  return null;
}

async function loadProduct(pid) {
  const doc = await db.collection("products").doc(pid).get();
  if (!doc.exists) return null;
  const p = doc.data();
  p._id = doc.id;
  if (p.status !== "active") return null;
  return p;
}

async function loadVariant(pid, vid) {
  const doc = await db.collection("products").doc(pid).collection("variants").doc(vid).get();
  if (!doc.exists) return null;
  const v = doc.data();
  if (v.active === false) return null;
  v._id = doc.id;
  return v;
}

async function loadShippingConfig() {
  try {
    const doc = await db.collection("config").doc("shippingFee").get();
    const v = doc.exists ? doc.data().value : null;
    return v || { flat: 0, freeAbove: 0 };
  } catch (e) {
    return { flat: 0, freeAbove: 0 };
  }
}

async function loadCoupon(code) {
  if (!code) return null;
  const snap = await db.collection("coupons").where("code", "==", String(code).toUpperCase()).limit(1).get();
  if (snap.empty) return null;
  const c = snap.docs[0].data();
  if (!c.active) return null;
  return c;
}

/**
 * Place an order. Throws errors with `code`:
 *  invalid_items | invalid_qty | invalid_product | out_of_stock |
 *  invalid_coupon | already_exists
 */
async function placeOrder(input) {
  const { orderKey, customer } = input;

  // 1. Idempotency - same orderKey + same phone never double-charges.
  const existing = await findExistingByOrderKeyAndPhone(orderKey, customer.phone);
  if (existing) {
    const d = existing.data();
    const e = new Error("order already exists");
    e.code = "already_exists";
    e.existing = { ref: d.ref, status: d.status };
    throw e;
  }

  // 2. Resolve products/variants from DB (client prices ignored).
  const cartItems = input.items;
  const resolved = [];
  for (const it of cartItems) {
    const pid = String(it.productId || "");
    const vid = String(it.variantId || "default");
    const product = await loadProduct(pid);
    if (!product) { const e = new Error("unknown product"); e.code = "invalid_product"; e.productId = pid; throw e; }
    const variant = await loadVariant(pid, vid);
    if (!variant) { const e = new Error("unknown variant"); e.code = "invalid_product"; e.productId = pid; e.variantId = vid; throw e; }
    resolved.push({ product: product, variant: variant });
  }

  const lines = itemsToLines(cartItems, resolved);

  // 3. Coupon (server-side; percent/fixed, caps, expiry).
  const coupon = await loadCoupon(input.couponCode);
  if (input.couponCode && !coupon) { const e = new Error("coupon invalid"); e.code = "invalid_coupon"; throw e; }

  const shippingFee = await loadShippingConfig();
  const totals = computeTotals(lines, { coupon: coupon, shippingFee: shippingFee });

  // 4. Reserve stock atomically (out-of-stock race safe).
  const ref = makeRef();
  await db.runTransaction(async function (txn) {
    for (const line of lines) {
      const vref = db.collection("products").doc(line.productId).collection("variants").doc(line.variantId);
      const vdoc = await txn.get(vref);
      if (!vdoc.exists) {
        const e = new Error("variant gone"); e.code = "out_of_stock"; e.productId = line.productId;
        throw e;
      }
      const v = vdoc.data();
      const available = Number(v.stock) - (Number(v.reserved) || 0);
      if (available < line.qty) {
        const e = new Error("out of stock"); e.code = "out_of_stock"; e.productId = line.productId; e.stock = available;
        throw e;
      }
      txn.update(vref, { reserved: (Number(v.reserved) || 0) + line.qty, updatedAt: Timestamp.now() });
    }

    txn.set(orderRef(ref), buildOrderDoc(input, lines, totals, ref, new Date()));

    // upsert customer ledger
    const cref = db.collection("customers").doc(String(customer.phone));
    const cdoc = await txn.get(cref);
    if (cdoc.exists) {
      txn.update(cref, {
        name: customer.name,
        lastOrderAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ordersCount: FieldValue.increment(1)
      });
    } else {
      txn.set(cref, {
        phone: String(customer.phone), name: customer.name, email: customer.email || "",
        addr: customer.addr, ordersCount: 1, totalSpentPaise: totals.grandTotalPaise,
        lastOrderAt: Timestamp.now(), createdAt: Timestamp.now(), updatedAt: Timestamp.now()
      });
    }
  });

  // 5. Payment link (M3). M2 returns null - order sits PENDING_PAYMENT.
  let link = null;
  try {
    const linkResult = await razorpay.createPaymentLink({
      ref: ref, grandTotalPaise: totals.grandTotalPaise,
      name: customer.name, phone: customer.phone, email: customer.email || ""
    });
    if (linkResult) {
      link = { linkId: linkResult.linkId, linkUrl: linkResult.linkUrl, expiresAt: linkResult.expiresAt };
      await orderRef(ref).update({ "payment.linkId": link.linkId, "payment.linkUrl": link.linkUrl, updatedAt: Timestamp.now() });
    }
  } catch (e) {
    // Gateway not configured yet (M2) - order remains pending without a link.
    // In M3 a non-configuration failure will page before returning pending.
  }

  return { ref: ref, status: "PENDING_PAYMENT", totals: totals, link: link };
}

module.exports = { placeOrder };