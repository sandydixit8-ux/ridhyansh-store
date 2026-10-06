/**
 * Razorpay Payment Links adapter - the ONLY file that knows the gateway API.
 * Swapping gateways (PhonePe/Cashfree) = replace this file, nothing else.
 *
 * M2: stubbed. M3 implements createPaymentLink() + verifyWebhook() + the
 * Signature-verified webhook route. Secrets come from Secret Manager via
 * firebase-functions params, never from frontend.
 */
const { defineSecret } = require("firebase-functions/params");

// Declared now so `firebase functions:secrets:set` targets them; they are
// only read (".value()") inside functions in M3.
const RZP_KEY_ID = defineSecret("razorpay_key_id");
const RZP_KEY_SECRET = defineSecret("razorpay_key_secret");
const RZP_WEBHOOK_SECRET = defineSecret("razorpay_webhook_secret");

function configured() {
  return !!(RZP_KEY_ID.value() && RZP_KEY_SECRET.value());
}

/**
 * Return a gateway payment link for an order, or null when not configured.
 * input: { ref, grandTotalPaise, name, phone, email, customerAddr }
 */
async function createPaymentLink(input) {
  if (!configured()) return null;
  // M3 implementation:
  // 1. POST /v1/payment_links {
  //      amount: input.grandTotalPaise, currency:"INR", accept_partial:false,
  //      description:`Order ${input.ref}`, customer, notes:{ orderRef: input.ref },
  //      callback_url, callback_method, expire_by }
  // 2. return { linkId, linkUrl, expiresAt }
  // 3. Store linkId on order.payment.linkId for the webhook reverse-lookup.
  throw new Error("razorpay adapter not configured");
}

function verifyWebhookSignature(rawBody, signature) {
  // M3: HMAC-SHA256(rawBody, RZP_WEBHOOK_SECRET.value()) constant-time compare.
  return false;
}

module.exports = { createPaymentLink, verifyWebhookSignature, configured, RZP_KEY_ID, RZP_KEY_SECRET, RZP_WEBHOOK_SECRET };