/**
 * Pure mapper: v2 Firestore product (+variants) -> the exact shape the v1
 * storefront JS expects (id, name, price, images[], stock, sizes, ...).
 * This is the contract that lets M5 flip the storefront to the v2 API with
 * zero frontend changes.
 */
function catalogToV1Shape(p, variants) {
  const pv = p || {};
  const variantsArr = Array.isArray(variants) ? variants : [];
  const stock = variantsArr.reduce(function (sum, v) {
    const s = Number(v && v.stock);
    return sum + (v && v.active !== false && s > 0 ? s : 0);
  }, 0);
  const leg = pv.legacy || {};

  return {
    id: String(pv.id || ""),
    name: String(pv.name || ""),
    price: Number(pv.price) || 0,
    mrp: Number(pv.mrp) || Number(pv.price) || 0,
    cat: String(pv.category || ""),
    sub: String(pv.subcategory || ""),
    desc: String(pv.description || pv.blurb || ""),
    longdesc: String(pv.longDescription || ""),
    features: Array.isArray(leg.features) ? leg.features.map(String) : [],
    material: String(leg.material || ""),
    fit: String(leg.fit || ""),
    colors: Array.isArray(leg.colors) ? leg.colors.map(String) : [],
    sizes: Array.isArray(leg.sizes) ? leg.sizes.map(String) : [],
    stock: stock,
    images: Array.isArray(pv.images) ? pv.images.map(function (i) { return i && typeof i === "object" ? String(i.url) : String(i); }) : [],
    video: pv.video || null,
    featured: !!pv.featured,
    trending: !!pv.trending,
    slug: String((pv.seo && pv.seo.canonicalSlug) || ""),
    seoTitle: String((pv.seo && pv.seo.title) || ""),
    seoDesc: String((pv.seo && pv.seo.desc) || ""),
    sku: String(pv.sku || ""),
    gstSlab: pv.gstSlab != null ? pv.gstSlab : 0
  };
}

/**
 * Resolve a product by document id OR canonical slug.
 * Returns null when not found.
 */
function resolveProductByIdOrSlug(docs, key) {
  const k = String(key || "").toLowerCase();
  return docs.filter(function (d) {
    const p = d.data();
    return String(d.id).toLowerCase() === k ||
      String((p.seo && p.seo.canonicalSlug) || "").toLowerCase() === k;
  })[0] || null;
}

module.exports = { catalogToV1Shape, resolveProductByIdOrSlug };