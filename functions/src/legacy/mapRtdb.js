/**
 * Pure mapping functions: legacy RTDB document -> v2 Firestore document.
 * Kept dependency-free so unit tests run without a Firebase project.
 *
 * All money values are stored as INTEGER PAISE to avoid float drift and the
 * classic "Rs 0.1 off" exploit class. Nothing monetary is ever trusted from
 * the client - these functions only reshape *stored* data.
 */

function nowTs() {
  return new Date();
}

/**
 * tokens for cheap "contains" search on dashboard/catalog.
 */
function makeTokens(p) {
  const hay = [p.name, p.cat, p.sub, p.id, p.sku].filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  return Array.from(new Set(hay.split(" "))).filter(Boolean);
}

function normTags(p) {
  if (Array.isArray(p.tags)) return p.tags.map(String).slice(0, 12);
  return makeTokens(p).slice(0, 12);
}

/**
 * Map one v1 RTDB product to a v2 Firestore product document.
 */
function mapProduct(id, raw) {
  const p = raw || {};
  const price = Number(p.price) || 0;
  const mrp = p.mrp != null && p.mrp !== "" ? Number(p.mrp) : price;
  const images = Array.isArray(p.images)
    ? p.images.map(function (u, i) { return { url: String(u), alt: p.name ? p.name : "Image " + (i + 1) }; })
    : [];

  return {
    sku: String(p.sku || id || ""),
    name: String(p.name || ""),
    blurb: String(p.desc || ""),
    description: String(p.desc || ""),
    longDescription: String(p.longdesc || ""),
    category: String(p.cat || "Clothing"),
    subcategory: String(p.sub || p.cat || ""),
    price: price,
    mrp: mrp,
    gstSlab: 5, // clothing default; individual slabs editable in admin later
    images: images,
    video: p.video ? String(p.video) : null,
    status: p.status === "draft" ? "draft" : "active",
    featured: !!p.featured,
    trending: !!p.trending,
    ratingAvg: 0,
    reviewCount: 0,
    seo: {
      title: String(p.seoTitle || p.name || ""),
      desc: String(p.seoDesc || p.desc || ""),
      canonicalSlug: String(p.slug || id || "")
    },
    tags: normTags(p),
    searchTokens: makeTokens(p),
    // v1-only fields kept for round-trip fidelity until M4 admin splits variants.
    legacy: {
      sizes: Array.isArray(p.sizes) ? p.sizes.map(String) : [],
      colors: Array.isArray(p.colors) ? p.colors.map(String) : [],
      fit: String(p.fit || ""),
      material: String(p.material || ""),
      features: Array.isArray(p.features) ? p.features.map(String) : []
    },
    createdAt: nowTs(),
    updatedAt: nowTs()
  };
}

/**
 * One default variant per migrated product holds the aggregate stock.
 * SKU-level inventory (size/color splits) is an M4 admin capability.
 */
function makeDefaultVariant(id, raw) {
  const p = raw || {};
  const price = Number(p.price) || 0;
  const stock = p.stock != null && p.stock !== "" ? Number(p.stock) : 10;
  return {
    productId: String(id),
    sku: String(p.sku || id || ""),
    attributes: {},
    price: price,
    mrp: p.mrp != null && p.mrp !== "" ? Number(p.mrp) : price,
    stock: stock >= 0 ? stock : 0,
    reserved: 0,
    lowStockThreshold: 3,
    active: true,
    updatedAt: nowTs()
  };
}

const ORDER_STATUS_MAP = {
  pending: "PENDING_PAYMENT",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
  shipped: "SHIPPED",
  delivered: "DELIVERED"
};

/**
 * Map one v1 RTDB order to a v2 Firestore order document.
 * Orders are NEVER overwritten during migration - see migrateFromRtdb.js.
 */
function mapOrder(ref, raw) {
  const o = raw || {};
  const amount = Number(o.amount);
  const st = String(o.status || "pending").toLowerCase();
  const status = ORDER_STATUS_MAP[st] || "PENDING_PAYMENT";
  const addrLine = typeof o.addr === "string" ? o.addr : "";

  return {
    ref: String(ref),
    status: status,
    customer: {
      name: String(o.name || ""),
      phone: String(o.phone || ""),
      addr: { line: addrLine }
    },
    totals: {
      subtotalPaise: 0,
      discountPaise: 0,
      shippingFeePaise: 0,
      gstPaise: 0,
      grandTotalPaise: amount >= 0 ? Math.round(amount * 100) : 0
    },
    payment: { mode: "UPI", status: st === "confirmed" ? "captured" : "pending" },
    source: "v1_migration",
    createdAt: o.time ? new Date(o.time) : nowTs(),
    updatedAt: nowTs(),
    legacy: o // full original preserved for audit; dropped after M4
  };
}

/**
 * Map one v1 config key to a v2 config document.
 */
function mapConfig(k, v) {
  return {
    key: String(k),
    value: v == null ? null : v,
    updatedAt: nowTs()
  };
}

// Defaults seeded only if the key is absent (config is private, locked by rules).
const CONFIG_DEFAULTS = {
  ownerUid: "",           // set during M4 admin 2FA enrollment
  shopName: "Ridhyansh Store",
  upiId: "",
  gstin: "",
  tfaEnabled: false,
  dispatchHoursTarget: 24,
  shippingFee: { flat: 0, freeAbove: 0 }
};

module.exports = { mapProduct, makeDefaultVariant, mapOrder, mapConfig, CONFIG_DEFAULTS, makeTokens };