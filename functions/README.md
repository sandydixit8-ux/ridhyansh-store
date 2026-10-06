# Ridhyansh Store v2 — Cloud Functions backend

Backend for goals 1–3: automatic UPI confirmation (Razorpay Payment Links),
server-rendered SEO product pages, secure admin API. M0/M1 scope delivered.

## Stack

- Firebase **Cloud Functions** (Node 20, region `asia-south1` Mumbai)
- **Firestore** = source of truth (all writes server-side)
- Legacy **Realtime DB** stays read-only as a temporary mirror during M1–M5
- Firebase Hosting serves the SAME static repo (see `firebase.json`)

## Env vars / secrets

| Variable | Where | Required | Notes |
|---|---|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | migrate script only | for migration | path to serviceAccount.json (gitignored) |
| `RTDB_URL` | migrate script only | for migration | e.g. `https://ridhyansh-18715-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `razorpay_key_id` | Secret Manager | M3 | `firebase functions:secrets:set razorpay_key_id` |
| `razorpay_key_secret` | Secret Manager | M3 | `firebase functions:secrets:set razorpay_key_secret` |
| `razorpay_webhook_secret` | Secret Manager | M3 | `firebase functions:secrets:set razorpay_webhook_secret` |
| `FIREBASE_TOKEN` | GitHub secret | CI | generate once via `firebase login:ci` |
| `FIREBASE_PROJECT_ID` | GitHub secret | CI | `ridhyansh-18715` |

**No secrets in frontend code.** The web API key may stay public (Firebase
design); Razorpay keys/webhooks/notify tokens live in Secret Manager only.

## Setup (first time)

```bash
npm i -g firebase-tools
firebase login
firebase use ridhyansh-18715        # from repo root (uses .firebaserc)
cd functions
npm install
npm test                            # unit tests, no emulator needed
firebase deploy --only functions,firestore:rules,firestore:indexes,hosting
```

## Migration (RTDB -> Firestore), M1

1. Firebase Console → Project settings → Service accounts → *Generate new
   private key* → save as `functions/serviceAccount.json` (**gitignored**).
2. From `functions/`:

```bash
$env:RTDB_URL="https://ridhyansh-18715-default-rtdb.asia-southeast1.firebasedatabase.app"
$env:GOOGLE_APPLICATION_CREDENTIALS="$PWD\serviceAccount.json"
npm run migrate:dry      # preview counts, no writes
npm run migrate          # execute (idempotent, safe to re-run)
```

Idempotency: products upsert only when newer; orders/config never overwrite.
Re-run after admin edits until M4 moves admin onto Firestore.

## API surface (M0/M1)

| Route | Description |
|---|---|
| `GET /api/health` | liveness |
| `GET /api/catalog/products` | all active products (v1 storefront shape) |
| `GET /api/catalog/featured` | featured, newest first |
| `GET /api/catalog/category/:cat` | by category |
| `GET /api/catalog/product/:idOrSlug` | single product by id or slug |

Catalog responses are CDN-cached (`s-maxage=300`) and shaped exactly like the
legacy RTDB product objects, so M5 storefront cutover = swap source + test.

## Testing

```bash
cd functions
npm test
```

Wat tested by Emulator (run `npm run serve` + curl when set up):
`/api/health`, `/api/catalog*` with seeded Firestore.

## Local emulator

```bash
firebase emulators:start --only firestore,functions
```
Seed by running the migration against a local RTDB `--project demo-ridhyansh`
(optional; unit tests already cover mappers without an emulator).