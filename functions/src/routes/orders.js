const { Router } = require("express");
const { errorsForOrder } = require("../middleware/validate");
const { rateLimit } = require("../middleware/rateLimit");
const { placeOrder } = require("../services/orderService");

const router = Router();

function mapErr(e, res) {
  const statusByCode = {
    invalid_items: 400,
    invalid_qty: 400,
    invalid_product: 400,
    invalid_coupon: 400,
    already_exists: 200, // idempotent replay -> return the existing order
    out_of_stock: 409
  };
  const status = statusByCode[e.code];
  if (status == null) return res.status(500).json({ error: "internal" });
  const body = { error: e.code };
  if (e.productId) body.productId = e.productId;
  if (e.existing) body.existing = e.existing;
  if (e.code === "already_exists") body.message = "Order already placed";
  if (e.code === "out_of_stock") body.message = "Some items are no longer available";
  return res.status(status).json(body);
}

// POST /api/orders -> validate + reserve stock + create order.
// M2 returns { ref, status: PENDING_PAYMENT, totals, link:null }.
// The stock reservation happens in a Firestore transaction inside placeOrder.
router.post("/", rateLimit("orders", 10, 60000), async function (req, res) {
  try {
    const errs = errorsForOrder(req.body || {});
    if (errs.length) {
      res.status(400).json({ error: "validation", fields: errs });
      return;
    }
    const result = await placeOrder(req.body);
    res.set("Cache-Control", "no-store");
    res.status(201).json(result);
  } catch (e) {
    if (e && e.code === "already_exists") {
      res.status(200).json({ ref: e.existing.ref, status: e.existing.status, alreadyExists: true });
      return;
    }
    mapErr(e || {}, res);
  }
});

// GET /api/orders/:ref -> lightweight public status by ref (no PII beyond status).
router.get("/:ref", async function (req, res) {
  try {
    const ref = String(req.params.ref || "").toUpperCase();
    if (!/^RID[0-9]{16}$/.test(ref)) {
      res.status(400).json({ error: "validation", fields: ["ref"] });
      return;
    }
    const doc = await require("../db").db.collection("orders").doc(ref).get();
    if (!doc.exists) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    const o = doc.data();
    res.set("Cache-Control", "no-store");
    res.json({
      ref: o.ref,
      status: o.status,
      totals: o.totals,
      customer: { name: o.customer && o.customer.name },
      items: (o.items || []).map(function (i) {
        return { name: i.name, qty: i.qty, unitPricePaise: i.unitPricePaise, sku: i.sku };
      })
    });
  } catch (e) {
    res.status(500).json({ error: "internal" });
  }
});

module.exports = router;