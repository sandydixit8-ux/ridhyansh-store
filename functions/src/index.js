/**
 * Ridhyansh Store v2 - Cloud Functions entrypoint.
 *
 * Exported functions:
 *   api  -> single HTTP surface: /api/health, /api/catalog/* (M0/M1)
 *           /api/orders*, /api/razorpay/webhook, /api/admin/* in M2-M4.
 *
 * Region is set in firebase.json (asia-south1) AND here as belt-and-braces.
 */
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { REGION, RUNTIME_OPTS } = require("./config");
const health = require("./routes/health");
const catalog = require("./routes/catalog");
const orders = require("./routes/orders");

const app = express();

// Public API for now. CORS is locked down on admin routes in M4 (origin allow-list).
app.use(cors({ origin: true }));
app.use(express.json({ limit: "100kb", type: "application/json" }));

app.use("/health", health);
app.use("/catalog", catalog);
app.use("/orders", orders);

app.use(function (req, res) {
  res.status(404).json({ error: "not_found" });
});

// Central error handler - never leak stack traces to clients.
app.use(function (err, req, res, next) {
  console.error("[api:error]", err && err.message, err && err.stack);
  res.status(err && err.httpStatus ? err.httpStatus : 500).json({ error: "internal" });
});

exports.api = functions.region(REGION).runWith(RUNTIME_OPTS).https.onRequest(app);