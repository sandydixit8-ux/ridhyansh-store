# Facelift — Rollback Guide

The v2 "3D look" facelift lives on the `facelift` branch. It is **additive and
non-destructive**: no payment/cart/order logic was changed. Reverting is safe.

## Anchors

| Ref | Meaning |
| --- | --- |
| `v2.0-pre-facelift` | Tag = last commit **before** any facelift work (pre-facelift state) |
| `facelift` branch | All facelift phases (P2–P6) |
| `main` | Live branch (facelift not yet merged here) |

Facelift commits (newest last): `P2 design tokens`, `P3 home motion`,
`P4 PDP/cart/checkout polish`, `P5 responsive/SEO/a11y`, `P6 harness + CI + docs`.

## What the facelift added / touched

- **New files**: `css/tokens.css`, `css/ui.css`, `js/ui.js`, `tools/check-site.js`,
  `.github/workflows/site-check.yml`, `.github/workflows/lighthouse.yml`,
  `lighthouserc.json`, `docs/facelift/*`.
- **Edited files**: all `*.html` (head links + Motion/ui.js script tags,
  theme-color, robots, `sr-only` h1), `js/index.js` + `js/product.js` (added
  `data-tilt` to card builders only).
- **Untouched**: `js/store.js`, `js/order.js`, `js/admin.js`, `js/login.js`,
  `functions/**`, Firebase config, rules. (Facelift = presentation only.)

## Option A — facelift not merged yet (quick)

```bash
git checkout facelift
git reset --hard v2.0-pre-facelift   # or: git checkout main
```

`main` was never changed, so simply staying on / deploying `main` is already the
pre-facelift site.

## Option B — facelift already merged to main (revert history kept)

```bash
git checkout main
# revert every facelift commit as one clean commit
git revert --no-commit v2.0-pre-facelift..main
git commit -m "revert: v2 3D facelift (back to pre-facelift UI)"
git push
```

Or revert a single phase, e.g. only the motion layer:

```bash
git revert --no-commit <P3-sha> <P4-sha>
```

## Option C — nuclear (fastest, history rewritten — only if agreed)

```bash
git checkout main
git reset --hard v2.0-pre-facelift
git push --force-with-lease
```

## Notes

- **Cache busting is built-in**: every asset is versioned (`style.css?v=18`,
  `tokens.css?v=1`, `ui.css?v=N`, `ui.js?v=N`). Rolling back also rolls the
  versions back, so browsers fetch the old files cleanly — no stale-asset trap.
- **Motion is a progressive enhancement**: if the CDN is unreachable, `ui.js`
  falls back to `IntersectionObserver`, and cards stay visible
  (hidden states are scoped to `.js`). Removing `js/ui.js` alone leaves a fully
  working store (just without tilt/reveal polish).
- **Verify after rollback**: `node tools/check-site.js` (should still run — it
  is branch-agnostic) and eyeball the live preview.
