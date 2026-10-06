const { test } = require("node:test");
const assert = require("node:assert/strict");
const { computeTotals, applyCoupon } = require("../src/domain/pricing");

const flatShip = { flat: 4900, freeAbove: 49900 }; // Rs 49 flat, free above Rs 499

test("computeTotals: basic subtotal and GST (clothing 5%)", function () {
  const t = computeTotals([{ unitPricePaise: 59900, qty: 1, gstSlab: 5 }], { shippingFee: flatShip });
  assert.equal(t.subtotalPaise, 59900);
  assert.equal(t.discountPaise, 0);
  assert.equal(t.gstPaise, Math.round(59900 * (1 - 100 / 105))); // ~2852
  assert.equal(t.shippingFeePaise, 0); // above 499 => free
  assert.equal(t.grandTotalPaise, 59900);
  assert.equal(t.grossGstRate, 5);
});

test("computeTotals: shipping charged below free-above threshold", function () {
  const t = computeTotals([{ unitPricePaise: 19900, qty: 1, gstSlab: 0 }], { shippingFee: flatShip });
  assert.equal(t.shippingFeePaise, 4900);
  assert.equal(t.grandTotalPaise, 24800);
  assert.equal(t.gstPaise, 0);
});

test("computeTotals: PERCENT coupon capped by maxDiscount", function () {
  const coupon = { type: "PERCENT", value: 10, maxDiscountPaise: 9900, minOrderPaise: 10000, active: true };
  const d = applyCoupon(coupon, 990000); // 10% = 99000 -> capped at 9900
  assert.equal(d, 9900);
  const t = computeTotals([{ unitPricePaise: 990000, qty: 1, gstSlab: 0 }], { coupon: coupon, shippingFee: flatShip });
  assert.equal(t.taxablePaise, 990000 - 9900);
});

test("computeTotals: coupon below minOrder does not apply", function () {
  const coupon = { type: "FIXED", value: 10000, minOrderPaise: 50000, active: true };
  assert.equal(applyCoupon(coupon, 20000), 0);
});

test("computeTotals: fixed coupon capped at subtotal, never negative", function () {
  const coupon = { type: "FIXED", value: 50000, active: true };
  const t = computeTotals([{ unitPricePaise: 19900, qty: 1, gstSlab: 5 }], { coupon: coupon, shippingFee: flatShip });
  assert.equal(t.discountPaise, 19900);
  assert.equal(t.taxablePaise, 0);
  assert.equal(t.shippingFeePaise, 4900); // 0 taxable does not reach free-above threshold
  assert.equal(t.grandTotalPaise, 4900);
});

test("computeTotals: weighted GST across mixed slabs", function () {
  const t = computeTotals([
    { unitPricePaise: 50000, qty: 1, gstSlab: 5 },
    { unitPricePaise: 50000, qty: 1, gstSlab: 18 }
  ], { shippingFee: flatShip });
  // weighted avg = (50000*5 + 50000*18) / 100000 = 11.5 -> round 12
  assert.equal(t.grossGstRate, 12);
  assert.equal(t.grandTotalPaise, 100000);
});

test("computeTotals: empty/invalid input yields zero totals", function () {
  const t = computeTotals([{ unitPricePaise: 0, qty: 1, gstSlab: 5 }], { shippingFee: flatShip });
  assert.equal(t.grandTotalPaise, 0);
});