/**
 * Server-side payload validation (dependency-free).
 * Everything here is defence-in-depth - the authoritative math is still
 * recomputed in orderService from the DB.
 */

const PHONE_RE = /^[6-9][0-9]{9}$/;
const PIN_RE = /^[0-9]{6}$/;

function cleanString(v, max) {
  if (v == null) return "";
  const s = String(v).replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function errorsForOrder(body) {
  const errs = [];
  const b = body || {};

  if (!b.orderKey || typeof b.orderKey !== "string" || b.orderKey.length < 8 || b.orderKey.length > 48) {
    errs.push("orderKey");
  }
  if (!Array.isArray(b.items) || b.items.length === 0 || b.items.length > 50) {
    errs.push("items");
  }
  const c = b.customer || {};
  if (!c.name || String(c.name).trim().length < 2) errs.push("customer.name");
  if (!PHONE_RE.test(String(c.phone || ""))) errs.push("customer.phone");
  const addr = c.addr || {};
  if (!PIN_RE.test(String(addr.pincode || ""))) errs.push("customer.addr.pincode");
  if (!(String(addr.line || "").length >= 3 && String(addr.line || "").length <= 120)) errs.push("customer.addr.line");
  if (c.email && !/.+@.+\..+/.test(String(c.email))) errs.push("customer.email");
  if (b.couponCode != null && (typeof b.couponCode !== "string" || b.couponCode.length < 3 || b.couponCode.length > 20)) {
    errs.push("couponCode");
  }
  return errs;
}

module.exports = { cleanString, errorsForOrder, PHONE_RE, PIN_RE };