/**
 * Lazy Firebase Admin singleton. Imported by every route/service.
 * The Admin SDK bypasses Firestore rules, so all *writes* must flow through
 * these functions - never trust client-side Firestore SDK calls.
 */
const admin = require("firebase-admin");
const { isEmulated } = require("../config");

if (!admin.apps.length) {
  admin.initializeApp();
}

if (isEmulated()) {
  admin.firestore().settings({ host: "localhost:8080", ssl: false });
}

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

module.exports = { admin, db: admin.firestore(), FieldValue, Timestamp };