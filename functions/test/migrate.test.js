/**
 * Depends only on the pure mappers - no Firebase imports, so these run
 * with a bare `npm test` (no emulator, no credentials).
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mapProduct, mapOrder, mapConfig, makeDefaultVariant, CONFIG_DEFAULTS } = require("../src/legacy/mapRtdb");
const { catalogToV1Shape, resolveProductByIdOrSlug } = require("../src/legacy/toV1Shape");

const rtdbProduct = {
  id: "1789369290550",
  sku: "WSCS-01",
  name: "Men's White Striped Smart Casual Shirt",
  price: 599,
  mrp: 1299,
  stock: "14",
  cat: "Clothing",
  sub: "Shirts",
  desc: "Structured collared shirt",
  longdesc: "Long description here",
  images: ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"],
  video: "https://cdn.example/reel.mp4",
  sizes: ["M", "L"],
  colors: ["White"],
  fit: "Regular",
  material: "Cotton",
  features: ["Wrinkle-free"],
  seoTitle: "Buy White Shirt",
  seoDesc: "Smart casual shirt",
  slug: "mens-white-striped-smart-casual-shirt",
  featured: true,
  trending: false
};

test("mapProduct converts money to integer paise and keeps SEO fields", function () {
  const p = mapProduct(rtdbProduct.id, rtdbProduct);
  assert.equal(p.id, undefined);
  assert.equal(p.price, 599);
  assert.equal(p.mrp, 1299);
  assert.equal(p.images[0].url, "https://cdn.example/a.jpg");
  assert.equal(p.images[0].alt, rtdbProduct.name);
  assert.equal(p.status, "active");
  assert.equal(p.seo.canonicalSlug, rtdbProduct.slug);
  assert.equal(p.gstSlab, 5);
  assert.ok(p.searchTokens.includes("shirt"));
  assert.ok(Array.isArray(p.legacy.sizes) && p.legacy.sizes.includes("L"));
});

test("mapProduct handles missing price/mrp/stock safely", function () {
  const p = mapProduct("x1", { name: "test", desc: "d" });
  assert.equal(p.price, 0);
  assert.equal(p.mrp, 0);
  assert.equal(p.stock, undefined); // stock lives on variants, not product doc
  const v = makeDefaultVariant("x1", { stock: "" });
  assert.equal(v.stock, 10); // default stock
});

test("mapProduct defaults gstSlab and never crashes on null images", function () {
  const p = mapProduct("x2", { name: "N", images: null });
  assert.deepEqual(p.images, []);
});

test("catalogToV1Shape round-trips the RTDB shape", function () {
  const v2 = mapProduct(rtdbProduct.id, rtdbProduct);
  v2.id = rtdbProduct.id;
  const v1 = catalogToV1Shape(v2, [makeDefaultVariant(rtdbProduct.id, rtdbProduct)]);
  assert.equal(v1.id, "1789369290550");
  assert.equal(v1.price, 599);
  assert.equal(v1.stock, 14);
  assert.equal(v1.images[0], "https://cdn.example/a.jpg");
  assert.equal(v1.sizes[0], "M");
  assert.equal(v1.slug, "mens-white-striped-smart-casual-shirt");
  assert.equal(v1.featured, true);
});

test("catalogToV1Shape stock only counts active variants", function () {
  const v2 = mapProduct("x3", { name: "N", price: 100 });
  v2.id = "x3";
  const initials = catalogToV1Shape(v2, [
    makeDefaultVariant("x3", {}),
    Object.assign(makeDefaultVariant("x3", { stock: 20 }), { active: false })
  ]);
  assert.equal(initials.stock, 10); // inactive variant ignored
});

test("resolveProductByIdOrSlug matches by id or slug (case-insensitive)", function () {
  const docs = [
    { id: "A1", data: () => ({ seo: { canonicalSlug: "blue-jeans" } }) },
    { id: "B2", data: () => ({ seo: { canonicalSlug: "red-shirt" } }) }
  ];
  assert.equal(resolveProductByIdOrSlug(docs, "a1").id, "A1");
  assert.equal(resolveProductByIdOrSlug(docs, "BLUE-JEANS").id, "A1");
  assert.equal(resolveProductByIdOrSlug(docs, "nope"), null);
});

test("mapOrder maps status and keeps legacy payload", function () {
  const o = mapOrder("RID123", { ref: "RID123", name: "Amit", phone: "9876543210", amount: 599, status: "confirmed", addr: "Delhi" });
  assert.equal(o.status, "CONFIRMED");
  assert.equal(o.totals.grandTotalPaise, 59900);
  assert.equal(o.customer.name, "Amit");
  assert.equal(o.legacy.status, "confirmed");
});

test("config defaults are seedable", function () {
  assert.equal(CONFIG_DEFAULTS.tfaEnabled, false);
  assert.equal(typeof CONFIG_DEFAULTS.shippingFee.flat, "number");
});

test("mapConfig wraps key/value", function () {
  const c = mapConfig("upiId", "abc@upi");
  assert.equal(c.key, "upiId");
  assert.equal(c.value, "abc@upi");
});