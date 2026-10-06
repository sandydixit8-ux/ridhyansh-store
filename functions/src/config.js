/**
 * Shared config for Cloud Functions.
 * Region: asia-south1 (Mumbai) - lowest latency for Indian users and
 * co-located with Razorpay webhooks best practices.
 */
const REGION = "asia-south1";

// Memory budget for request-scoped API work (catalog + orders later).
const RUNTIME_OPTS = { memory: "256MB", minInstances: 0, maxInstances: 10 };

function isEmulated() {
  return process.env.FUNCTIONS_EMULATOR === "true";
}

module.exports = { REGION, RUNTIME_OPTS, isEmulated };