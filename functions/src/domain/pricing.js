/**
 * Pure pricing engine (dependency-free for tests).
 * ALL money is integer paise. Prices come ONLY from the DB via orderService -
 * this module never sees client-supplied amounts.
 *
 * GST: product price is assumed GST-inclusive (Indian MRP convention).
 * gstPaise is derived for invoice display: gst = total * r/(100+r).
 */

function applyCoupon(coupon, subtotalPaise) {
  if (!coupon || !coupon.active) return 0;
  if (coupon.minOrderPaise != null && subtotalPaise < coupon.minOrderPaise) return 0;
  let d;
  if (coupon.type === "PERCENT") {
    d = Math.round((subtotalPaise * (Number(coupon.value) || 0)) / 100);
    if (coupon.maxDiscountPaise != null) d = Math.min(d, Number(coupon.maxDiscountPaise));
  } else {
    d = Number(coupon.value) || 0; // FIXED
  }
  return Math.max(0, Math.min(d, subtotalPaise));
}

/**
 * lines: [{ unitPricePaise, qty, gstSlab }]   gstSlab = 0/5/12/18
 * opts : { coupon, shippingFee:{flat, freeAbove} }
 * Returns { subtotalPaise, discountPaise, taxablePaise, gstPaise,
 *           shippingFeePaise, grandTotalPaise, grossGstRate }
 */
function computeTotals(lines, opts) {
  const coupon = (opts && opts.coupon) || null;
  const ship = (opts && opts.shippingFee) || { flat: 0, freeAbove: 0 };

  let subtotal = 0;
  let weightedRate = 0;
  for (const l of lines) {
    const line = Math.round((Number(l.unitPricePaise) || 0) * (Number(l.qty) || 0));
    subtotal += line;
    const r = Number(l.gstSlab) || 0;
    weightedRate += line * r;
  }
  if (subtotal <= 0) {
    return {
      subtotalPaise: 0, discountPaise: 0, taxablePaise: 0, gstPaise: 0,
      shippingFeePaise: 0, grandTotalPaise: 0, grossGstRate: 0
    };
  }
  const grossGstRate = Math.round(weightedRate / subtotal); // weighted average slab %
  const discount = applyCoupon(coupon, subtotal);
  const taxable = subtotal - discount;
  const gst = grossGstRate > 0 ? Math.round(taxable * (1 - 100 / (100 + grossGstRate))) : 0;
  const shipping = (ship.freeAbove != null && taxable >= Number(ship.freeAbove)) ? 0 : Number(ship.flat) || 0;
  const grand = taxable + shipping;

  return {
    subtotalPaise: subtotal,
    discountPaise: discount,
    taxablePaise: taxable,
    gstPaise: gst,
    shippingFeePaise: shipping,
    grandTotalPaise: grand,
    grossGstRate: grossGstRate
  };
}

module.exports = { computeTotals, applyCoupon };