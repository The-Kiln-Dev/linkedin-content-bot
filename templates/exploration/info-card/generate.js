#!/usr/bin/env node
/* Ink & Kiln info-card → single PNG via Puppeteer.

   Visual language per ../../brand/brand-exploration.md (v2 — Ink & Kiln):
     - warm paper canvas with grain, full bleed; shallow glaze dip at the top edge
     - Fraunces title with italic emphasis + hand marker underline
     - hand-circled section numbers, wobbly ink section dividers
     - stat cards as hand-drawn ink boxes on paper (no white cards)
     - tables stay typographically crisp (data wants precision); the hand
       lives in the chrome around them
     - marker doodle accent bottom-right, hand-lined footer

   Usage:
     node generate.js inputs/outreach-cheatsheet.json
     open output/outreach-cheatsheet.png
*/

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const craft = require('../../craft/craft.js');

const ROOT = __dirname;
const BRAND_DIR = path.resolve(ROOT, '..', '..', '..', 'brand');
const EXPLORATION_ASSETS = path.join(BRAND_DIR, 'assets', 'exploration');

const SCALE = 2;
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1350;

const GRADIENTS = JSON.parse(
  fs.readFileSync(path.join(BRAND_DIR, 'colors-exploration.json'), 'utf8')
).gradient_variants;

/* ---------- Layout constants (must match the CSS in buildHtml) ----------
   These are used by validateInput() to predict each section's natural height
   before rendering, so we can fail fast with a clear error when content
   would overflow the cream panel instead of letting Puppeteer render an
   overlapping mess. If you change the CSS, update these too. */
const LAYOUT = {
  frame: 50,
  headerPanel: {
    paddingY: 56 + 36,
    logoBlock: 42 + 26,
    titleLineHeight: 64 * 1.05,
    titleLinesMax: 2,
    subtitle: 18 * 1.4 + 16,
  },
  body: {
    paddingY: 30 + 24,
  },
  section: {
    paddingY: 4 + 4,
    headRow: 40 + 18,
    borderTop: 14,
    interGap: 28,
  },
  statGrid: {
    cardHeight: 142,
    gap: 12,
  },
  ctRow: 15 + 15 + 18 * 1.35 + 18 * 1.35,
  mrRow: 15 + 15 + 18 * 1.35 + 18 * 1.35,
  ctHeadRow: 13 + 6,
  footer: 12.5 * 1 + 16 + 16,
};

/* ---------- Content limits per section type ----------
   Soft limits documented in README. Validation uses predicted-height instead
   of strict item-count caps so users can mix small and dense sections. */
const SECTION_LIMITS = {
  'stat-grid': { maxItems: 6, minColumns: 2, maxColumns: 4 },
  'comparison-table': { maxRows: 6 },
  'metrics-rows': { maxRows: 6 },
};

function pathToFileUrl(abs) {
  return 'file://' + abs.split(path.sep).map(encodeURIComponent).join('/');
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAllowB(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/<(?!\/?b>)/g, '&lt;');
}

function predictSectionHeight(s) {
  const { section, statGrid, ctRow, mrRow, ctHeadRow } = LAYOUT;
  const base = section.paddingY + section.headRow + section.borderTop;
  let content = 0;

  if (s.type === 'stat-grid') {
    const cols = s.columns || 2;
    const items = (s.items || []).length;
    const rows = Math.ceil(items / cols);
    content = rows * statGrid.cardHeight + Math.max(0, rows - 1) * statGrid.gap;
  } else if (s.type === 'comparison-table') {
    const rows = (s.rows || []).length;
    content = ctHeadRow + rows * ctRow;
  } else if (s.type === 'metrics-rows') {
    const rows = (s.rows || []).length;
    content = ctHeadRow + rows * mrRow;
  } else {
    throw new Error(`Unknown section type for height prediction: ${s.type}`);
  }
  return Math.ceil(base + content);
}

function predictHeaderHeight() {
  const h = LAYOUT.headerPanel;
  return h.paddingY + h.logoBlock + h.titleLineHeight * h.titleLinesMax + h.subtitle;
}

function predictFooterHeight() {
  return LAYOUT.footer;
}

function predictBodyAvailableHeight(canvasHeight) {
  const innerHeight = canvasHeight - 2 * LAYOUT.frame;
  return innerHeight - predictHeaderHeight() - predictFooterHeight() - LAYOUT.body.paddingY;
}

function validateInput(input) {
  const canvasH = (input.canvas && input.canvas.height) || DEFAULT_HEIGHT;
  const available = predictBodyAvailableHeight(canvasH);

  // Per-section soft-limit checks (caught before height math for clearer errors)
  for (const s of input.sections || []) {
    const limits = SECTION_LIMITS[s.type];
    if (!limits) throw new Error(`Unknown section type: ${s.type}. Valid: ${Object.keys(SECTION_LIMITS).join(', ')}.`);
    if (s.type === 'stat-grid') {
      const items = (s.items || []).length;
      if (items > limits.maxItems) {
        throw new Error(`stat-grid section "${s.title_roman || s.title || '?'}" has ${items} items; max ${limits.maxItems}. Split into two sections or reduce items.`);
      }
      const cols = s.columns || 2;
      if (cols < limits.minColumns || cols > limits.maxColumns) {
        throw new Error(`stat-grid section "${s.title_roman || s.title || '?'}" has columns=${cols}; must be between ${limits.minColumns} and ${limits.maxColumns}.`);
      }
    } else {
      const rows = (s.rows || []).length;
      if (rows > limits.maxRows) {
        throw new Error(`${s.type} section "${s.title_roman || s.title || '?'}" has ${rows} rows; max ${limits.maxRows}.`);
      }
    }
  }

  const sections = input.sections || [];
  const sectionsTotal = sections.reduce((sum, s) => sum + predictSectionHeight(s), 0);
  const gapsTotal = Math.max(0, sections.length - 1) * LAYOUT.section.interGap;
  const needed = sectionsTotal + gapsTotal;
  if (needed > available) {
    const overshoot = needed - available;
    const breakdown = (input.sections || [])
      .map((s, i) => `  ${i + 1}. ${s.type} (${s.title_roman || s.title || '?'}): ${predictSectionHeight(s)}px`)
      .join('\n');
    throw new Error(
      `Info-card content won't fit on canvas:\n` +
      `  Sections predicted total: ${needed}px\n` +
      `  Cream panel available:    ${available}px\n` +
      `  Overflow by:              ${overshoot}px\n\n` +
      `Section breakdown:\n${breakdown}\n\n` +
      `Fix (prefer restructuring over dropping — keep the information, change the layout):\n` +
      `  1. Compress section copy. Shorter body text in stat-cards, shorter cell content in tables.\n` +
      `  2. Change column count. 2-column stat-grid + 4 items → 4-column stat-grid + 4 items is much shorter.\n` +
      `  3. Reformat section types. A stat-grid can become a comparison-table; metrics-rows can fold into a stat-grid.\n` +
      `  4. Merge related sections. Two thematically-overlapping sections combine into one without losing content.\n` +
      `  5. Only as a last resort: drop a section or items, or split into two info-cards.\n\n` +
      `Per-section soft limits: stat-grid ≤6 items, comparison-table ≤6 rows, metrics-rows ≤6 rows. ` +
      `Even within those limits, three full 6-item sections won't fit a single card — that's where restructuring saves you.`
    );
  }
}

function resolveGradient(key) {
  const v = GRADIENTS[key];
  if (!v) throw new Error(`Unknown gradient_variant: ${key}. Options: ${Object.keys(GRADIENTS).join(', ')}`);
  return { from: v.from.hex, to: v.to.hex };
}

function logoUrl() {
  return pathToFileUrl(path.join(EXPLORATION_ASSETS, 'logos', 'kiln-lockup-black.png'));
}

function doodleUrl(name) {
  if (!name) return null;
  const p = path.join(EXPLORATION_ASSETS, 'doodles', name);
  if (!fs.existsSync(p)) throw new Error(`Doodle missing: ${p}`);
  return pathToFileUrl(p);
}

function textureUrl() {
  return pathToFileUrl(path.join(EXPLORATION_ASSETS, 'texture-topographic.png'));
}

/* ---------- section title with italic emphasis ---------- */

function renderSectionHead(s, rng) {
  const ring = craft.svg(44, 44, craft.handCircle(rng, 22, 22, 17, 16, { width: 3.4, stroke: 'var(--accent)', filter: null, drift: 0.05 }), { class: 'section-num-ring' });
  const numHtml = `<span class="section-num">${ring}<span class="section-num-digit">${s.number}</span></span>`;
  const titleHtml = `
    <h2 class="section-title">
      <span class="roman">${esc(s.title_roman)}</span>
      ${s.title_italic ? `<em class="emph">${esc(s.title_italic)}</em>` : ''}
    </h2>
  `;
  return `<div class="section-head">${numHtml}${titleHtml}</div>`;
}

/* ---------- section types ---------- */

function renderStatGrid(s, rng) {
  const cols = s.columns || 2;
  const items = s.items.map((it) => {
    const box = `<svg class="stat-card-box" viewBox="0 0 320 140" preserveAspectRatio="none">${craft.handBox(rng, 6, 6, 308, 128, { width: 2.6, overshoot: 4, amp: 2, filter: null })}</svg>`;
    return `
    <div class="stat-card">
      ${box}
      <span class="stat-card-num">${it.n}</span>
      <div class="stat-card-title">${esc(it.title)}</div>
      <div class="stat-card-body">${escAllowB(it.body)}</div>
    </div>
  `;
  }).join('');
  return `
    <section class="section">
      ${renderSectionHead(s, rng)}
      <div class="stat-grid" style="grid-template-columns:repeat(${cols}, 1fr);">${items}</div>
    </section>
  `;
}

function renderComparisonTable(s, rng) {
  const head = s.columns.map((h) => `<div class="ct-head">${esc(h)}</div>`).join('');
  const body = s.rows.map((row) => {
    const cells = row.map((cell, j) => {
      const isImpact = j === row.length - 1;
      const isFirst = j === 0;
      const cls = isImpact ? 'ct-cell ct-impact' : isFirst ? 'ct-cell ct-first' : 'ct-cell';
      return `<div class="${cls}">${esc(cell)}</div>`;
    }).join('');
    return `<div class="ct-row">${cells}</div>`;
  }).join('');
  return `
    <section class="section">
      ${renderSectionHead(s, rng)}
      <div class="ct">
        <div class="ct-row ct-head-row">${head}</div>
        ${body}
      </div>
    </section>
  `;
}

function renderMetricsRows(s, rng) {
  const head = s.columns.map((h) => `<div class="mr-head">${esc(h)}</div>`).join('');
  const body = s.rows.map((row) => {
    const cells = row.map((cell, j) => {
      const isImpact = j === row.length - 1;
      const isFirst = j === 0;
      const cls = isImpact ? 'mr-cell mr-impact' : isFirst ? 'mr-cell mr-first' : 'mr-cell';
      return `<div class="${cls}">${esc(cell)}</div>`;
    }).join('');
    return `<div class="mr-row">${cells}</div>`;
  }).join('');
  return `
    <section class="section">
      ${renderSectionHead(s, rng)}
      <div class="mr">
        <div class="mr-row mr-head-row">${head}</div>
        ${body}
      </div>
    </section>
  `;
}

function renderSection(s, rng, i) {
  const divider = i > 0
    ? craft.svg(968, 14, craft.handLine(rng, 2, 7, 966, 7 + (rng() * 4 - 2), { amp: 1.6, width: 2, opacity: 0.4 }), { class: 'section-divider' })
    : '';
  let body;
  switch (s.type) {
    case 'stat-grid': body = renderStatGrid(s, rng); break;
    case 'comparison-table': body = renderComparisonTable(s, rng); break;
    case 'metrics-rows': body = renderMetricsRows(s, rng); break;
    default: throw new Error(`Unknown section type: ${s.type}`);
  }
  return divider + body;
}

function renderHeader(h, rng) {
  const mark = `<svg class="emph-mark" viewBox="0 0 300 24" preserveAspectRatio="none">${
    craft.handLine(rng, 4, 10, 296, 8 + (rng() * 6 - 3), { amp: 2.6, width: 7, filter: null, stroke: 'var(--accent)' }) +
    craft.handLine(rng, 10, 17, 262 + rng() * 30, 16 + (rng() * 4 - 2), { amp: 2.2, width: 5.5, filter: null, stroke: 'var(--accent)', opacity: 0.75 })
  }</svg>`;
  return `
    <header class="page-head">
      <img class="logo-lockup" src="${logoUrl()}" alt="The Kiln">
      <h1 class="page-title">
        <span class="roman">${esc(h.title_roman)}</span>
        ${h.title_italic ? ` <em class="emph">${esc(h.title_italic)}${mark}</em>` : ''}
      </h1>
      ${h.subtitle ? `<p class="page-sub">${esc(h.subtitle)}</p>` : ''}
    </header>
  `;
}

function renderFooter(f, rng) {
  if (!f) return '';
  const line = craft.svg(968, 12, craft.handLine(rng, 2, 6, 966, 6 + (rng() * 4 - 2), { amp: 1.6, width: 2.2, opacity: 0.5 }), { class: 'foot-line' });
  return `
    <footer class="page-foot">
      ${line}
      <div class="page-foot-row">
        <span>${esc(f.left || '')}</span>
        <span class="foot-right">${esc(f.right || '')}</span>
      </div>
    </footer>
  `;
}

function buildHtml(input, inputName) {
  const w = (input.canvas && input.canvas.width) || DEFAULT_WIDTH;
  const h = (input.canvas && input.canvas.height) || DEFAULT_HEIGHT;
  const grad = resolveGradient(input.gradient_variant || 'orange_indigo');
  const rng = craft.rngFromString(input.seed || inputName || 'info-card');
  const sectionsHtml = input.sections.map((sec, i) => renderSection(sec, rng, i)).join('\n');
  const doodle = input.doodle ? doodleUrl(input.doodle) : null;
  const doodleRot = (rng() * 12 - 6).toFixed(1);
  const glazeD = craft.glazeDipPath(rng, w, 34, { waves: 7, amp: 8 });

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..700,30..100;1,9..144,400..700,30..100&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --grad-from: ${grad.from};
    --grad-to: ${grad.to};
    --accent: ${grad.from};
    --ink: #231F20;
    --paper: #F5EFE2;
    --rule: rgba(35,31,32,0.16);
    --muted: #6B645A;
    --frame: 50px;
    --pad: 56px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${w}px; height: ${h}px; margin: 0; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }

  .card {
    width: ${w}px;
    height: ${h}px;
    position: relative;
    background: var(--paper);
    overflow: hidden;
  }
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: ${craft.grainCss()};
    opacity: 0.2;
    mix-blend-mode: multiply;
    pointer-events: none;
    z-index: 40;
  }
  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 130% 120% at 50% 42%, transparent 62%, rgba(120,90,40,0.05) 100%);
    pointer-events: none;
    z-index: 39;
  }
  .glaze { position: absolute; top: 0; left: 0; width: ${w}px; height: 90px; z-index: 1; }
  .glaze-fill { position: absolute; inset: 0; background: linear-gradient(115deg, var(--grad-from) 0%, var(--grad-to) 100%); }
  .glaze-tex {
    position: absolute; inset: 0;
    background-image: url('${textureUrl()}');
    background-size: 50% 50%;
    mix-blend-mode: multiply;
    opacity: 0.5;
  }
  .inner {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* ---------- Header (on paper) ---------- */
  .page-head {
    padding: 56px var(--pad) 36px;
    flex: 0 0 auto;
  }
  .logo-lockup {
    height: 38px;
    width: auto;
    display: block;
    margin-bottom: 28px;
  }
  .page-title {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 96;
    font-size: 64px;
    line-height: 1.05;
    letter-spacing: -0.012em;
    color: var(--ink);
  }
  .page-title .emph {
    position: relative;
    font-style: italic;
    font-weight: 540;
    color: var(--ink);
    white-space: nowrap;
  }
  .emph-mark { position: absolute; left: -2%; bottom: -0.12em; width: 104%; height: 0.16em; pointer-events: none; }
  .page-sub {
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    color: var(--muted);
    margin-top: 16px;
    line-height: 1.4;
  }

  /* ---------- Body (paper, natural flow) ----------
     Top-aligned natural flow. Sections take their actual content height,
     separated by a consistent gap. Pre-render validation (validateInput)
     guarantees total natural content fits. */
  .body {
    padding: 30px var(--pad) 24px;
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 28px;
    min-height: 0;
  }

  /* ---------- Section shell ---------- */
  .section {
    display: flex;
    flex-direction: column;
    padding: 4px 0 4px;
    overflow: hidden;
    flex: 0 0 auto;
  }
  .section-divider { display: block; width: 100%; height: 14px; margin-bottom: -14px; flex: 0 0 auto; }

  .section-head { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
  .section-num {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
  }
  .section-num-ring { position: absolute; inset: -2px; width: 44px; height: 44px; }
  .section-num-digit {
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: 24px;
    color: var(--ink);
  }
  .section-title {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 36;
    font-size: 30px;
    line-height: 1.18;
    letter-spacing: -0.005em;
    color: var(--ink);
  }
  .section-title .emph {
    font-style: italic;
    font-weight: 540;
    color: var(--accent);
  }

  /* ---------- Stat grid (hand-drawn ink boxes on paper) ---------- */
  .stat-grid {
    display: grid;
    gap: 14px;
    grid-auto-rows: minmax(130px, auto);
  }
  .stat-card {
    position: relative;
    padding: 18px 22px 20px;
    display: flex;
    flex-direction: column;
  }
  .stat-card-box { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .stat-card-num {
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: 22px;
    color: var(--accent);
    margin-bottom: 8px;
  }
  .stat-card-title {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 18px;
    line-height: 1.25;
    color: var(--ink);
    margin-bottom: 6px;
  }
  .stat-card-body {
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    line-height: 1.45;
    color: var(--muted);
  }
  .stat-card-body b { color: var(--ink); font-weight: 700; }

  /* ---------- Comparison table (typography stays crisp) ---------- */
  .ct { display: flex; flex-direction: column; }
  .ct-row {
    display: grid;
    grid-template-columns: 1fr 2.2fr 0.8fr;
    align-items: center;
    padding: 15px 0;
    gap: 18px;
    border-top: 1px solid var(--rule);
    font-family: 'Inter', sans-serif;
  }
  .ct-head-row { border-top: none; padding-top: 0; padding-bottom: 6px; }
  .ct-head {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .ct-cell {
    font-size: 18px;
    line-height: 1.35;
    color: var(--ink);
  }
  .ct-first { font-weight: 600; }
  .ct-impact { color: var(--accent); font-weight: 700; }

  /* ---------- Metrics rows ---------- */
  .mr { display: flex; flex-direction: column; }
  .mr-row {
    display: grid;
    grid-template-columns: 1.2fr 1.2fr 0.8fr;
    align-items: center;
    padding: 15px 0;
    gap: 18px;
    border-top: 1px solid var(--rule);
    font-family: 'Inter', sans-serif;
  }
  .mr-head-row { border-top: none; padding-top: 0; padding-bottom: 6px; }
  .mr-head {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .mr-cell {
    font-size: 18px;
    line-height: 1.35;
    color: var(--ink);
  }
  .mr-first { font-weight: 600; }
  .mr-impact { color: var(--accent); font-weight: 700; }

  /* ---------- Doodle accent ---------- */
  .doodle-accent {
    position: absolute;
    right: var(--pad);
    bottom: 58px;
    width: 110px;
    height: auto;
    opacity: 0.9;
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  /* ---------- Footer ---------- */
  .page-foot { margin-top: auto; padding-top: 16px; flex: 0 0 auto; }
  .foot-line { display: block; width: 100%; height: 12px; margin-bottom: 8px; }
  .page-foot-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--muted);
  }
  .foot-right { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; letter-spacing: 0.06em; }
</style>
</head>
<body>
  <div class="card">
    <div class="glaze">
      <div class="glaze-fill" style="clip-path: path('${glazeD}');"></div>
      <div class="glaze-tex" style="clip-path: path('${glazeD}');"></div>
    </div>
    <div class="inner">
      ${renderHeader(input.header, rng)}
      <div class="body">
        ${sectionsHtml}
        ${doodle ? `<img class="doodle-accent" style="transform: rotate(${doodleRot}deg);" src="${doodle}" alt="">` : ''}
        ${renderFooter(input.footer, rng)}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error('Usage: node generate.js inputs/<file>.json');
    process.exit(1);
  }
  const inputPath = (() => {
    if (path.isAbsolute(inputArg)) return inputArg;
    const cwd = path.resolve(process.cwd(), inputArg);
    if (fs.existsSync(cwd)) return cwd;
    return path.resolve(ROOT, inputArg);
  })();
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Fail fast if content won't fit. Better to surface a clear error here
  // than to let Puppeteer render an overlapping mess that the user has to
  // diagnose by eye.
  validateInput(input);

  const w = (input.canvas && input.canvas.width) || DEFAULT_WIDTH;
  const h = (input.canvas && input.canvas.height) || DEFAULT_HEIGHT;

  const html = buildHtml(input, path.basename(inputArg, '.json'));
  const tmpHtml = path.join(ROOT, '.tmp-render.html');
  fs.writeFileSync(tmpHtml, html);

  const outDir = path.join(ROOT, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const baseName = path.basename(inputArg, '.json');
  const outFile = path.join(outDir, `${baseName}.png`);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: SCALE });
    await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.screenshot({ path: outFile, type: 'png', clip: { x: 0, y: 0, width: w, height: h }, omitBackground: false });
    fs.unlinkSync(tmpHtml);
    console.log(`OK  ${path.relative(process.cwd(), outFile)}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
