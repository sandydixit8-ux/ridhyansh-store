/**
 * One-time, idempotent, re-runnable migration: legacy RTDB -> Firestore v2.
 *
 * Instructions:
 *   1. Download a service account key from Firebase Console
 *      (Project settings -> Service accounts -> Generate new private key)
 *      and save it OUTSIDE the repo (this folder is gitignored for *.json keys).
 *   2. Set env:
 *        RTDB_URL                     required (your Realtime DB URL)
 *        GOOGLE_APPLICATION_CREDENTIALS  path to serviceAccount.json
 *   3. Run:  npm run migrate:dry      # preview only
 *            npm run migrate          # writes
 *
 * Idempotency guarantees:
 *   - products:  overwritten only when the stored updatedAt is OLDER than the
 *                mapped one -> safe to re-run after admin edits in M1-M4.
 *   - orders:    NEVER overwritten (existing doc wins).
 *   - config:    only missing keys are written; defaults seeded once.
 */
process.env.GOOGLE_APPLICATION_CREDENTIALS =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || (async function () {
    const fs = require("fs");
    const path = require("path");
    for (const f of ["serviceAccount.json", "service-account.json"]) {
      const full = path.join(__dirname, __dirname, f);
      if (fs.existsSync(full)) return full;
    }
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  })();

const admin = require("firebase-admin");
const { mapProduct, mapOrder, mapConfig, CONFIG_DEFAULTS, makeDefaultVariant } = require("./mapRtdb");

const RTDB_URL = process.env.RTDB_URL;
const DRY = process.argv.includes("--dry-run");

if (!RTDB_URL) {
  console.error("FATAL: set RTDB_URL (example: npx firebase database:get / --project X to confirm URL)");
  process.exit(2);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("FATAL: set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path");
  process.exit(2);
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: RTDB_URL
  });
}

const dbFs = admin.firestore();

async function snapshot(path) {
  const s = await admin.database().ref(path).once("value");
  return s.val() || {};
}

function write(path, data) {
  return DRY ? Promise.resolve("dry") : dbFs.doc(path).set(data, { merge: true });
}

async function main() {
  console.log(DRY ? "DRY RUN - no writes" : "MIGRATION - writing to Firestore");

  const products = await snapshot("products");
  const orders = await snapshot("orders");
  const config = await snapshot("config");

  const out = {
    productsUpdated: 0, productsSkipped: 0, variantsWritten: 0,
    ordersCreated: 0,
    configWritten: 0
  };

  for (const [id, raw] of Object.entries(products)) {
    const doc = mapProduct(id, raw);
    const existing = await dbFs.doc("products/" + id).get();
    const existingTs = existing.exists ? existing.get("updatedAt") : null;
    if (existingTs && new Date(existingTs).getTime() >= new Date(doc.updatedAt).getTime()) {
      out.productsSkipped++;
      continue;
    }
    await write("products/" + id, doc);
    await write("products/" + id + "/variants/default", makeDefaultVariant(id, raw));
    out.productsUpdated++;
    out.variantsWritten++;
  }

  for (const [ref, raw] of Object.entries(orders)) {
    const existing = await dbFs.doc("orders/" + ref).get();
    if (existing.exists) {
      out.ordersSkipped = (out.ordersSkipped || 0) + 1;
      continue;
    }
    await write("orders/" + ref, mapOrder(ref, raw));
    out.ordersCreated++;
  }
  if (!out.ordersSkipped) out.ordersSkipped = 0;

  const allKeys = Object.assign({}, config, CONFIG_DEFAULTS);
  for (const [k, v] of Object.entries(allKeys)) {
    const existing = await dbFs.doc("config/" + k).get();
    if (existing.exists) continue;
    await write("config/" + k, mapConfig(k, v));
    out.configWritten++;
  }

  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

main().catch(function (e) {
  console.error("FAILED:", e && e.stack || e);
  process.exit(1);
});