const { Router } = require("express");
const { db } = require("../db");
const { catalogToV1Shape, resolveProductByIdOrSlug } = require("../legacy/toV1Shape");

const router = Router();

// CDN-friendly caching: edge can serve up to 5 min without hitting the function.
const CACHE = { "Cache-Control": "public, s-maxage=300, max-age=60" };

async function hydrate(pDocs) {
  const out = [];
  for (const doc of pDocs) {
    const p = doc.data();
    p.id = doc.id;
    let variants = [];
    const vs = await db.collection("products/" + doc.id + "/variants").get();
    vs.forEach(function (v) { variants.push(v.data()); });
    out.push(catalogToV1Shape(p, variants));
  }
  return out;
}

// GET /api/catalog/products  -> all active products (catalog listing)
router.get("/products", async function (req, res, next) {
  try {
    const snap = await db.collection("products").where("status", "==", "active").get();
    const pDocs = [];
    snap.forEach(function (d) { pDocs.push(d); });
    const products = await hydrate(pDocs);
    res.set(CACHE);
    res.json({ products: products });
  } catch (e) { next(e); }
});

// GET /api/catalog/featured  -> featured + active, newest first
router.get("/featured", async function (req, res, next) {
  try {
    const snap = await db.collection("products")
      .where("status", "==", "active")
      .where("featured", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(24)
      .get();
    const pDocs = [];
    snap.forEach(function (d) { pDocs.push(d); });
    const products = await hydrate(pDocs);
    res.set(CACHE);
    res.json({ products: products });
  } catch (e) { next(e); }
});

// GET /api/catalog/category/:cat  -> products in one category
router.get("/category/:cat", async function (req, res, next) {
  try {
    const cat = decodeURIComponent(req.params.cat);
    const snap = await db.collection("products")
      .where("category", "==", cat)
      .where("status", "==", "active")
      .get();
    const pDocs = [];
    snap.forEach(function (d) { pDocs.push(d); });
    const products = await hydrate(pDocs);
    res.set(CACHE);
    res.json({ products: products });
  } catch (e) { next(e); }
});

// GET /api/catalog/product/:idOrSlug  -> single product by id or seo slug
router.get("/product/:idOrSlug", async function (req, res, next) {
  try {
    const key = req.params.idOrSlug;
    let snap = await db.collection("products").where("status", "==", "active").get();
    const pDocs = [];
    snap.forEach(function (d) { pDocs.push(d); });
    const doc = resolveProductByIdOrSlug(pDocs, key);
    if (!doc) {
      res.status(404).json({ error: "not_found", key: key });
      return;
    }
    const products = await hydrate([doc]);
    res.set(CACHE);
    res.json({ product: products[0] });
  } catch (e) { next(e); }
});

module.exports = router;