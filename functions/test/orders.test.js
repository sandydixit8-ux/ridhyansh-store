const { test } = require("node:test");
const assert = require("node:assert/strict");
const { makeRef, itemsToLines, buildOrderDoc } = require("../src/domain/orders");

test("makeRef: RID + 12-digit yyyymmddHHMMSS + 4 random digits = 19 chars", function () {
  const r = makeRef(new Date(2026, 9, 7, 10, 30, 0)); // 2026-10-07 10:30:00
  assert.match(r, /^RID\d{18}$/);
  assert.ok(r.startsWith("RID202610071030"));
});

test("itemsToLines: prices come from DB data, qty math is integer", function () {
  const lines = itemsToLines(
    [{ productId: "1111111111", variantId: "default", qty: 2 }],
    [{ product: { name: "Shirt", price: 59900, gstSlab: 5, sku: "A" }, variant: { stock: 10 } }]
  );
  assert.equal(lines.length, 1);
  assert.equal(lines[0].unitPricePaise, 59900);
  assert.equal(lines[0].qty, 2);
  assert.equal(lines[0].gstRate, 5);
});

test("itemsToLines: rejects bad quantity and duplicate lines", function () {
  assert.throws(function () {
    itemsToLines([{ productId: "1111111111", qty: 0 }], [{}]);
  }, /Quantity/);

  assert.throws(function () {
    itemsToLines(
      [
        { productId: "1111111111", qty: 1 },
        { productId: "1111111111", qty: 1 }
      ],
      [{ product: { price: 1 } }, { product: { price: 1 } }]
    );
  }, /Duplicate/);
});

test("itemsToLines: unknown product / unpriced product rejected", function () {
  assert.throws(function () {
    itemsToLines([{ productId: "1111111111", qty: 1 }], [null]);
  }, /Unknown product/);

  assert.throws(function () {
    itemsToLines([{ productId: "1111111111", qty: 1 }], [{ product: { price: 0 } }]);
  }, /Unpriced product/);
});

test("itemsToLines: cart total cap at Rs 1,00,000", function () {
  const items = [
    { productId: "1111111111", qty: 10 },
    { productId: "2222222222", qty: 10 }
  ];
  const resolved = items.map(function () { return { product: { price: 9000000 } }; });
  assert.throws(function () { itemsToLines(items, resolved); }, /exceeds limit/);
});

test("buildOrderDoc: pending payment, no client totals trusted", function () {
  const doc = buildOrderDoc(
    {
      customer: { name: "Amit", phone: "9876543210", addr: { line: "12, MG Road", pincode: "110001" } },
      couponCode: "SAVE10",
      orderKey: "abc-1234-xyz"
    },
    [{ productId: "p", unitPricePaise: 100 }],
    { grandTotalPaise: 100, subtotalPaise: 100, discountPaise: 0, gstPaise: 0, shippingFeePaise: 0 },
    "RIDTEST",
    new Date(2026, 9, 7)
  );
  assert.equal(doc.status, "PENDING_PAYMENT");
  assert.equal(doc.orderKey, "abc-1234-xyz");
  assert.equal(doc.coupon.code, "SAVE10");
  assert.equal(doc.totals.grandTotalPaise, 100);
  assert.equal(doc.payment.mode, "UPI");
  assert.equal(doc.auditTrail[0].event, "created");
});