#!/usr/bin/env node
/* Ridhyansh Store — static site regression checker.
 * Pure Node (no deps). Run: node tools/check-site.js
 * Exits non-zero on any failure. Used by CI (.github/workflows/site-check.yml).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const fails = [];
const warns = [];
const info = [];

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const count = (s, sub) => s.split(sub).length - 1;
const page = (f, ok, msg) => (ok ? info : fails).push(`${f}: ${msg}`);
const warn = (f, ok, msg) => (!ok ? warns.push(`${f}: ${msg}`) : null);

// Indexable public pages (need description + canonical + index)
const INDEXABLE = new Set([
  "index.html", "product.html", "track-order.html", "faqs.html", "about.html",
  "contact.html", "privacy.html", "terms.html", "returns.html", "shipping-policy.html",
]);
const NOINDEX = new Set([
  "login.html", "reset.html", "admin.html", "dashboard.html", "order.html", "404.html", "landing.html",
]);
const REDIRECT = new Set(["landing.html"]);

const html = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));

if (html.length < 15) fails.push(`only ${html.length} html files found - wrong root?`);

for (const f of html) {
  const s = read(f);
  const head = s.slice(0, s.indexOf("</head>") + 7);

  if (!REDIRECT.has(f)) {
    page(f, count(s, "css/tokens.css") === 1, "tokens.css must appear exactly once");
    page(f, count(s, "css/ui.css") === 1, "ui.css must appear exactly once");
    page(f, count(s, "js/ui.js") === 1, "ui.js must appear exactly once");
    page(f, count(s, "motion@14.1.0") === 1, "pinned Motion CDN must appear exactly once");
    page(f, count(s, "classList.add('js')") === 1, "js-flag inline script must appear exactly once");
    page(f, /<html lang="en"/.test(s), 'html lang="en"');
    page(f, /name="viewport"/.test(head), "viewport meta");
    page(f, /name="theme-color"/.test(head), "theme-color meta");
    const cs = s.indexOf("charset=");
    page(f, cs >= 0 && cs < 1024, `charset within first 1024 bytes (at ${cs})`);
    const t = /<title>([^<]*)<\/title>/i.exec(s);
    page(f, !!(t && t[1].trim()), "non-empty <title>");
    const h1 = count(s, "<h1");
    page(f, h1 === 1, `exactly one <h1> (found ${h1})`);
    page(f, !/target="_blank"/.test(s) || !/target="_blank"(?![^>]*noopener)/.test(s), 'target="_blank" links carry rel="noopener"');
  } else {
    page(f, /http-equiv="refresh"/.test(s), "redirect stub has meta refresh");
  }

  if (INDEXABLE.has(f)) {
    page(f, /name="robots" content="index/.test(s), 'robots "index"');
    page(f, /name="description" content="[^"]+"/.test(s), "meta description");
    page(f, /<link rel="canonical"/.test(s), "canonical link");
  }
  if (NOINDEX.has(f)) {
    page(f, /name="robots" content="noindex/.test(s), 'robots "noindex"');
  }
}

// Shared layer guarantees
const ui = read("css/ui.css");
page("css/ui.css", ui.includes("prefers-reduced-motion"), "has reduced-motion guard");
page("css/ui.css", ui.includes(".js .reveal"), "reveal hidden-state scoped to .js");
page("css/ui.css", ui.includes("[data-tilt]"), "tilt selectors present");
page("css/ui.css", ui.includes("perspective"), "3D perspective present");
const braces = count(ui, "{") - count(ui, "}");

const ujs = read("js/ui.js");
page("js/ui.js", ujs.includes("MutationObserver"), "MutationObserver keeps late nodes wired");
page("js/ui.js", ujs.includes("window.RUI"), "exposes window.RUI");
page("js/ui.js", !/\beval\(/.test(ujs), "no eval()");
page("js/ui.js", ujs.includes("prefers-reduced-motion"), "respects reduced motion");

page("js/index.js", read("js/index.js").includes("data-tilt"), "home cards are tiltable");
page("js/product.js", read("js/product.js").includes("data-tilt"), "related cards are tiltable");

// Informational
info.push(`html pages: ${html.length}`);
info.push(`ui.css braces balanced: ${braces === 0}`);

// Report
const list = (arr) => arr.forEach((m) => console.log("  - " + m));
console.log(`\nRidhyansh Store - site check (${html.length} pages)\n`);
if (warns.length) { console.log("WARNINGS:"); list(warns); console.log(""); }
console.log(`PASS: ${info.length} checks`);
if (fails.length) {
  console.log(`\nFAIL: ${fails.length}`);
  list(fails);
  process.exit(1);
}
console.log("\nAll checks passed.");
