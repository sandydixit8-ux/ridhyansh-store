# Facelift — Changes & Verification

Premium "3D look" pass on top of the working v1 store. **Presentation only** —
no payment, cart or order logic was modified (see ROLLBACK.md for the guarantee).

## Phase summary

| Phase | Scope | Key changes |
| --- | --- | --- |
| P2 | Design tokens + shared UI | `css/tokens.css` (one-place palette remap: warm ivory + charcoal, electric-violet/cobalt), `css/ui.css` (focus-visible, reveal + tilt utilities, reduced-motion guards), `js/ui.js` (nav, scrolled header, reveals, tilt, `window.RUI`). Wired Motion 14.1.0 (vanilla, global) + ui.js into all pages; Poppins→Manrope. |
| P3 | Home + category motion | 3D card tilt (`data-tilt` in `index.js`/`product.js`), staggered reveals on static grids, hero parallax. Reveal system made self-healing via `MutationObserver` for async-injected cards; legacy per-card `fadeUp` disabled (it pinned `transform`). |
| P4 | PDP + cart + checkout | CSS-only polish: gallery backdrop/zoom/tilt, rounded thumbs, drawer glass + rounded edge, checkout accent-color, step/summary/QR polish, button micro-states. |
| P5 | Responsive/SEO/perf/a11y | theme-color + preconnects; 404 description; landing noindex; explicit robots on indexable pages; `sr-only` h1 on admin/login/reset/dashboard; `will-change` only on hover; verified `noopener` + no `eval`. |
| P6 | Harness + CI + docs | `tools/check-site.js` (242 dependency-free checks), `site-check` workflow, `lighthouserc.json` + Lighthouse workflow, this doc + ROLLBACK.md. |

## Files

- **New**: `css/tokens.css`, `css/ui.css`, `js/ui.js`, `tools/check-site.js`,
  `.github/workflows/site-check.yml`, `.github/workflows/lighthouse.yml`,
  `lighthouserc.json`, `docs/facelift/*`.
- **Edited**: all `*.html` (head/scripts/metas), `js/index.js`, `js/product.js`
  (`data-tilt` on card markup only).
- **Untouched**: `js/store.js`, `js/order.js`, `js/admin.js`, `js/login.js`,
  `functions/**`, Firebase rules/config.

## Verification done (this environment)

- `node tools/check-site.js` → **242 checks pass** (assets present exactly once,
  head integrity, single `h1`, robots/description/canonical policy, reduced-motion
  + tilt + observer guarantees, `noopener`, no `eval`).
- Brace balance in `tokens.css` / `ui.css`; `node --check` on `ui.js`,
  `index.js`, `product.js`.
- Confirmed class hooks the store JS depends on are unchanged.

## NOT executed here (needs a browser / live run)

- Lighthouse / Core Web Vitals (config added; first real score appears after the
  `Lighthouse` workflow runs against the live site).
- Real visual QA of tilt/hover/parallax and the Motion CDN loading live.
- Cross-device responsive spot-check.

## Before / after (qualitative)

| | Before | After |
| --- | --- | --- |
| Palette | cool blue-violet, Inter/Poppins | warm ivory + charcoal, electric-violet/cobalt, Manrope headings |
| Motion | per-card `fadeUp` only | in-view reveals, staggered grids, pointer 3D tilt, hero parallax, reduced-motion aware |
| PDP | flat image box | soft backdrop, hover zoom, 3D hero tilt, rounded thumbs |
| Cart drawer | flat panel | rounded edge, ivory body, glass head/foot |
| Governance | none | static checker + CI + Lighthouse config + rollback doc |
