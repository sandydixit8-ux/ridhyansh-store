const { Router } = require("express");
const { REGION } = require("../config");

const router = Router();

// GET /api/health  -> liveness probe used by deploy checks and monitoring.
router.get("/", function (req, res) {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, service: "ridhyansh-v2-api", region: REGION, ts: new Date().toISOString() });
});

module.exports = router;