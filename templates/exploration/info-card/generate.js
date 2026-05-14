#!/usr/bin/env node
/* Exploration-direction info-card → single PNG via Puppeteer.

   Visual language per ../../brand/brand-exploration.md:
     - gradient frame (~60px) with topographic texture overlay (multiply ~55%)
     - white top panel (logo + Fraunces title with italic-emphasis + subtitle)
     - cream body panel containing numbered sections separated by hairlines
     - sections rendered in pure typography on cream (no flat color section beds)
     - small monoline doodle accent bottom-right
     - footer strip at the base of the cream panel

   Usage:
     node generate.js inputs/outreach-cheatsheet.json
     open output/outreach-cheatsheet.png
*/

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = __dirname;
const BRAND_DIR = path.resolve(ROOT, '..', '..', '..', 'brand');
const EXPLORATION_ASSETS = path.join(BRAND_DIR, 'assets', 'exploration');

const SCALE = 2;
const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1350;

const GRADIENTS = JSON.parse(
  fs.readFileSync(path.join(BRAND_DIR, 'colors-exploration.json'), 'utf8')
).gradient_variants;

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

function renderSectionHead(s) {
  const numHtml = `<span class="section-num">${s.number}</span>`;
  const titleHtml = `
    <h2 class="section-title">
      <span class="roman">${esc(s.title_roman)}</span>
      ${s.title_italic ? `<em class="emph">${esc(s.title_italic)}</em>` : ''}
    </h2>
  `;
  return `<div class="section-head">${numHtml}${titleHtml}</div>`;
}

/* ---------- section types ---------- */

function renderStatGrid(s) {
  const cols = s.columns || 2;
  const items = s.items.map((it) => `
    <div class="stat-card">
      <span class="stat-card-num">${it.n}</span>
      <div class="stat-card-title">${esc(it.title)}</div>
      <div class="stat-card-body">${escAllowB(it.body)}</div>
    </div>
  `).join('');
  return `
    <section class="section">
      ${renderSectionHead(s)}
      <div class="stat-grid" style="grid-template-columns:repeat(${cols}, 1fr);">${items}</div>
    </section>
  `;
}

function renderComparisonTable(s) {
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
      ${renderSectionHead(s)}
      <div class="ct">
        <div class="ct-row ct-head-row">${head}</div>
        ${body}
      </div>
    </section>
  `;
}

function renderMetricsRows(s) {
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
      ${renderSectionHead(s)}
      <div class="mr">
        <div class="mr-row mr-head-row">${head}</div>
        ${body}
      </div>
    </section>
  `;
}

function renderSection(s) {
  switch (s.type) {
    case 'stat-grid': return renderStatGrid(s);
    case 'comparison-table': return renderComparisonTable(s);
    case 'metrics-rows': return renderMetricsRows(s);
    default: throw new Error(`Unknown section type: ${s.type}`);
  }
}

function renderHeader(h) {
  return `
    <header class="page-head">
      <img class="logo-lockup" src="${logoUrl()}" alt="The Kiln">
      <h1 class="page-title">
        <span class="roman">${esc(h.title_roman)}</span>
        ${h.title_italic ? ` <em class="emph">${esc(h.title_italic)}</em>` : ''}
      </h1>
      ${h.subtitle ? `<p class="page-sub">${esc(h.subtitle)}</p>` : ''}
    </header>
  `;
}

function renderFooter(f) {
  if (!f) return '';
  return `
    <footer class="page-foot">
      <span>${esc(f.left || '')}</span>
      <span>${esc(f.right || '')}</span>
    </footer>
  `;
}

function buildHtml(input) {
  const w = (input.canvas && input.canvas.width) || DEFAULT_WIDTH;
  const h = (input.canvas && input.canvas.height) || DEFAULT_HEIGHT;
  const grad = resolveGradient(input.gradient_variant || 'orange_indigo');
  const sectionsHtml = input.sections.map(renderSection).join('\n');
  const doodle = input.doodle ? doodleUrl(input.doodle) : null;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..700,30..100;1,9..144,400..700,30..100&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --grad-from: ${grad.from};
    --grad-to: ${grad.to};
    --ink: #000000;
    --cream: #F5F4EB;
    --white: #FFFFFF;
    --rule: rgba(0,0,0,0.12);
    --muted: #5a544a;
    --frame: 50px;
    --pad: 56px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${w}px; height: ${h}px; margin: 0; background: #111; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }

  .card {
    width: ${w}px;
    height: ${h}px;
    position: relative;
    background: linear-gradient(90deg, var(--grad-from) 0%, var(--grad-to) 100%);
    padding: var(--frame);
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url('${textureUrl()}');
    background-size: 50% 50%;
    background-repeat: repeat;
    mix-blend-mode: multiply;
    opacity: 0.55;
    pointer-events: none;
    z-index: 1;
  }
  .inner {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* ---------- Top panel (white) ---------- */
  .page-head {
    background: var(--white);
    padding: 44px var(--pad) 36px;
    flex: 0 0 auto;
  }
  .logo-lockup {
    height: 42px;
    width: auto;
    display: block;
    margin-bottom: 26px;
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
    font-style: italic;
    font-weight: 500;
    color: var(--grad-from);
  }
  .page-sub {
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    color: var(--muted);
    margin-top: 16px;
    line-height: 1.4;
  }

  /* ---------- Body panel (cream) ---------- */
  .body {
    background: var(--cream);
    padding: 30px var(--pad) 24px;
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  /* ---------- Section shell ---------- */
  .section {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 22px 0 20px;
    border-top: 1px solid var(--rule);
    min-height: 0;
  }
  .section:first-child { border-top: none; padding-top: 10px; }
  .section > :last-child { flex: 1; }

  .section-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .section-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--grad-from);
    color: var(--white);
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 16px;
    flex: 0 0 auto;
  }
  .section-title {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 36;
    font-size: 28px;
    line-height: 1.18;
    letter-spacing: -0.005em;
    color: var(--ink);
  }
  .section-title .emph {
    font-style: italic;
    font-weight: 500;
    color: var(--grad-from);
  }

  /* ---------- Stat grid (white sub-cards on cream) ---------- */
  .stat-grid {
    display: grid;
    gap: 12px;
    grid-auto-rows: 1fr;
  }
  .stat-card {
    background: var(--white);
    border: 1px solid var(--rule);
    border-radius: 12px;
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
  }
  .stat-card-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1.5px solid var(--grad-from);
    color: var(--grad-from);
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 8px;
  }
  .stat-card-title {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 1.25;
    color: var(--ink);
    margin-bottom: 6px;
  }
  .stat-card-body {
    font-family: 'Inter', sans-serif;
    font-size: 14.5px;
    line-height: 1.45;
    color: var(--muted);
  }
  .stat-card-body b { color: var(--ink); font-weight: 700; }

  /* ---------- Comparison table (typography on cream) ---------- */
  .ct { display: flex; flex-direction: column; justify-content: space-between; }
  .ct-row {
    display: grid;
    grid-template-columns: 1fr 2.2fr 0.7fr;
    align-items: center;
    padding: 13px 0;
    gap: 18px;
    border-top: 1px solid var(--rule);
    font-family: 'Inter', sans-serif;
  }
  .ct-head-row { border-top: none; padding-top: 0; padding-bottom: 6px; }
  .ct-head {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .ct-cell {
    font-size: 15px;
    line-height: 1.35;
    color: var(--ink);
  }
  .ct-first { font-weight: 600; }
  .ct-impact { color: var(--grad-from); font-weight: 700; }

  /* ---------- Metrics rows (typography on cream) ---------- */
  .mr { display: flex; flex-direction: column; justify-content: space-between; }
  .mr-row {
    display: grid;
    grid-template-columns: 1.2fr 1.2fr 0.7fr;
    align-items: center;
    padding: 13px 0;
    gap: 18px;
    border-top: 1px solid var(--rule);
    font-family: 'Inter', sans-serif;
  }
  .mr-head-row { border-top: none; padding-top: 0; padding-bottom: 6px; }
  .mr-head {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .mr-cell {
    font-size: 15.5px;
    line-height: 1.35;
    color: var(--ink);
  }
  .mr-first { font-weight: 600; }
  .mr-impact { color: var(--grad-from); font-weight: 700; }

  /* ---------- Doodle accent ---------- */
  .doodle-accent {
    position: absolute;
    right: var(--pad);
    bottom: 52px;
    width: 88px;
    height: auto;
    opacity: 0.85;
    pointer-events: none;
  }

  /* ---------- Footer ---------- */
  .page-foot {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--rule);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
    letter-spacing: 0.05em;
    color: var(--muted);
    flex: 0 0 auto;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="inner">
      ${renderHeader(input.header)}
      <div class="body">
        ${sectionsHtml}
        ${doodle ? `<img class="doodle-accent" src="${doodle}" alt="">` : ''}
        ${renderFooter(input.footer)}
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
  const w = (input.canvas && input.canvas.width) || DEFAULT_WIDTH;
  const h = (input.canvas && input.canvas.height) || DEFAULT_HEIGHT;

  const html = buildHtml(input);
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
