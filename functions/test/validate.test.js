const { test } = require("node:test");
const assert = require("node:assert/strict");
const { errorsForOrder, cleanString, PHONE_RE, PIN_RE } = require("../src/middleware/validate");

const good = {
  orderKey: "abc12345xyz",
  items: [{ productId: "1111111111", qty: 1 }],
  customer: {
    name: "Amit Kumar",
    phone: "9876543210",
    email: "a@b.com",
    addr: { line: "12, MG Road, Sector 5", city: "Delhi", state: "DL", pincode: "110001" }
  }
};

test("validate: valid payload passes", function () {
  assert.deepEqual(errorsForOrder(good), []);
});

test("validate: Indian phone regex and pincode", function () {
  assert.ok(PHONE_RE.test("9876543210"));
  assert.ok(!PHONE_RE.test("4876543210")); // 4 is not a valid mobile prefix
  assert.ok(!PHONE_RE.test("987654321")); // 9 digits
  assert.ok(PIN_RE.test("110001"));
  assert.ok(!PIN_RE.test("11000"));
  assert.ok(!PIN_RE.test("abcdef"));
});

test("validate: rejects bad phone / pincode / missing name", function () {
  const bad = Object.assign({}, good, {
    customer: Object.assign({}, good.customer, { phone: "12345", addr: { pincode: "12" } })
  });
  const fields = errorsForOrder(bad);
  assert.ok(fields.includes("customer.phone"));
  assert.ok(fields.includes("customer.addr.pincode"));
});

test("validate: orderKey too short / missing = rejected", function () {
  const f1 = errorsForOrder(Object.assign({}, good, { orderKey: "short" }));
  assert.ok(f1.includes("orderKey"));
  const f2 = errorsForOrder(Object.assign({}, good, { orderKey: undefined }));
  assert.ok(f2.includes("orderKey"));
});

test("validate: bad email shape rejects", function () {
  const fields = errorsForOrder(Object.assign({}, good, {
    customer: Object.assign({}, good.customer, { email: "nope" })
  }));
  assert.ok(fields.includes("customer.email"));
});

test("validate: coupon code length bounds", function () {
  assert.ok(!errorsForOrder(Object.assign({}, good, { couponCode: "SAVE10" })).includes("couponCode"));
  assert.ok(errorsForOrder(Object.assign({}, good, { couponCode: "AB" })).includes("couponCode"));
});

test("cleanString trims and caps length", function () {
  assert.equal(cleanString("  hello  ", 10), "hello");
  assert.equal(cleanString("x".repeat(50), 10).length, 10);
});