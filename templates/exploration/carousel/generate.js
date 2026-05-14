#!/usr/bin/env node
/* Exploration-direction LinkedIn carousel → multi-PNG via Puppeteer.

   Visual language per ../../../brand/brand-exploration.md:
     - gradient frame (~50px) with topographic texture overlay on every slide
     - Fraunces italic-emphasis on every headline (signature voice move)
     - white interior (cover, CTA) or white-top + cream-body split (content slides)
     - Kiln lockup top-left on every slide
     - small monoline doodle accent bottom-right
     - footer with author + page indicator (01 / 03)
     - black pill button on CTA only

   Usage:
     node generate.js inputs/sample-outbound.json
     open output/sample-outbound/*.png
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
  const candidates = [
    path.join(EXPLORATION_ASSETS, 'doodles', name),
    path.resolve(ROOT, name),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return pathToFileUrl(p);
  }
  throw new Error(`Doodle missing in brand assets or carousel root: ${name}`);
}

function textureUrl() {
  return pathToFileUrl(path.join(EXPLORATION_ASSETS, 'texture-topographic.png'));
}

function emphTitle(roman, italic) {
  return `
    <span class="roman">${esc(roman)}</span>
    ${italic ? `<em class="emph">${esc(italic)}</em>` : ''}
  `;
}

function pageIndicator(i, total) {
  const n = String(i + 1).padStart(2, '0');
  const t = String(total).padStart(2, '0');
  return `${n} / ${t}`;
}

/* ---------- Slide renderers ---------- */

function renderCover(slide, ctx) {
  const doodle = slide.doodle ? doodleUrl(slide.doodle) : null;
  return `
    <div class="slide slide-cover">
      <header class="slide-head">
        <img class="logo-lockup" src="${logoUrl()}" alt="The Kiln">
        ${slide.category ? `<span class="category-label">${esc(slide.category)}</span>` : ''}
      </header>

      <div class="slide-body slide-body-cover">
        <h1 class="cover-title">${emphTitle(slide.title_roman, slide.title_italic)}</h1>
        ${slide.subtitle ? `<p class="cover-sub">${esc(slide.subtitle)}</p>` : ''}
      </div>

      ${doodle ? `<img class="doodle-accent doodle-cover" src="${doodle}" alt="">` : ''}

      <footer class="slide-foot">
        <span>${esc(ctx.author || '')}</span>
        <span>${pageIndicator(ctx.index, ctx.total)}</span>
      </footer>
    </div>
  `;
}

function renderContent(slide, ctx) {
  const doodle = slide.doodle ? doodleUrl(slide.doodle) : null;
  const stepNum = (typeof slide.step_number === 'number')
    ? slide.step_number
    : (() => {
        const m = (slide.step_label || '').match(/(\d+)/);
        return m ? parseInt(m[1], 10) : (ctx.index);
      })();

  return `
    <div class="slide slide-content">
      <header class="slide-head">
        <img class="logo-lockup" src="${logoUrl()}" alt="The Kiln">
        ${slide.step_label ? `<span class="category-label">${esc(slide.step_label)}</span>` : ''}
      </header>

      <div class="slide-body slide-body-content">
        <span class="content-num">${stepNum}</span>
        <h2 class="content-title">${emphTitle(slide.title_roman, slide.title_italic)}</h2>
        ${slide.body ? `<p class="content-body">${esc(slide.body)}</p>` : ''}
        ${doodle ? `<div class="content-visual"><img class="content-doodle" src="${doodle}" alt=""></div>` : ''}
      </div>

      <footer class="slide-foot slide-foot-cream">
        <span>${esc(ctx.author || '')}</span>
        <span>${pageIndicator(ctx.index, ctx.total)}</span>
      </footer>
    </div>
  `;
}

function renderCta(slide, ctx) {
  const doodle = slide.doodle ? doodleUrl(slide.doodle) : null;
  return `
    <div class="slide slide-cta">
      <header class="slide-head">
        <img class="logo-lockup" src="${logoUrl()}" alt="The Kiln">
        <span class="category-label">NEXT STEP</span>
      </header>

      <div class="slide-body slide-body-cta">
        <h1 class="cta-title">${emphTitle(slide.title_roman, slide.title_italic)}</h1>
        ${slide.subtitle ? `<p class="cta-sub">${esc(slide.subtitle)}</p>` : ''}
        ${slide.button_text ? `<a class="cta-button">${esc(slide.button_text)}</a>` : ''}
      </div>

      ${doodle ? `<img class="doodle-accent doodle-cta" src="${doodle}" alt="">` : ''}

      <footer class="slide-foot">
        <span>${esc(ctx.author || '')}</span>
        <span>${pageIndicator(ctx.index, ctx.total)}</span>
      </footer>
    </div>
  `;
}

function renderSlide(slide, ctx) {
  switch (slide.type) {
    case 'cover': return renderCover(slide, ctx);
    case 'content': return renderContent(slide, ctx);
    case 'cta': return renderCta(slide, ctx);
    default: throw new Error(`Unknown slide type: ${slide.type}`);
  }
}

/* ---------- HTML wrapper ---------- */

function buildHtml(slideHtml, deck) {
  const w = (deck.canvas && deck.canvas.width) || DEFAULT_WIDTH;
  const h = (deck.canvas && deck.canvas.height) || DEFAULT_HEIGHT;
  const grad = resolveGradient(deck.gradient_variant || 'orange_indigo');

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
    --pad: 64px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${w}px; height: ${h}px; background: #111; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }

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
  .slide {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    background: var(--white);
    display: flex;
    flex-direction: column;
  }

  /* ---------- Shared head ---------- */
  .slide-head {
    padding: 32px var(--pad);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 auto;
  }
  .logo-lockup { height: 40px; width: auto; display: block; }
  .category-label {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: var(--muted);
    text-transform: uppercase;
  }

  /* ---------- Shared foot ---------- */
  .slide-foot {
    padding: 24px var(--pad) 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    letter-spacing: 0.05em;
    color: var(--muted);
    flex: 0 0 auto;
    border-top: 1px solid var(--rule);
  }
  .slide-foot-cream { background: var(--cream); border-top: none; }

  /* ---------- Italic emphasis ---------- */
  .emph {
    font-style: italic;
    font-weight: 500;
    color: var(--grad-from);
  }

  /* ---------- Cover slide ---------- */
  .slide-body-cover {
    padding: 0 var(--pad);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: var(--white);
  }
  .cover-title {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 144;
    font-size: 92px;
    line-height: 1.02;
    letter-spacing: -0.02em;
    color: var(--ink);
  }
  .cover-title .roman, .cover-title .emph { display: block; }
  .cover-sub {
    font-family: 'Inter', sans-serif;
    font-size: 22px;
    line-height: 1.4;
    color: var(--muted);
    margin-top: 28px;
    max-width: 720px;
  }
  .doodle-cover {
    position: absolute;
    right: calc(var(--frame) + 56px);
    bottom: calc(var(--frame) + 110px);
    width: 120px;
    height: auto;
    opacity: 0.9;
  }

  /* ---------- Content slide (single beat per slide, stacked) ---------- */
  .slide-body-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--cream);
    padding: 44px var(--pad) 32px;
    min-height: 0;
  }
  .content-num {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--grad-from);
    color: var(--white);
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    margin-bottom: 28px;
  }
  .content-title {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 144;
    font-size: 76px;
    line-height: 1.02;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin-bottom: 28px;
  }
  .content-title .roman, .content-title .emph { display: block; }
  .content-body {
    font-family: 'Inter', sans-serif;
    font-size: 30px;
    line-height: 1.4;
    color: var(--muted);
    max-width: 880px;
  }
  .content-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: 0;
  }
  .content-doodle {
    width: 280px;
    height: auto;
    max-width: 300px;
    max-height: 280px;
    object-fit: contain;
    mix-blend-mode: multiply;
    opacity: 0.92;
  }

  /* ---------- CTA slide ---------- */
  .slide-body-cta {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 var(--pad);
    background: var(--white);
  }
  .cta-title {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 144;
    font-size: 88px;
    line-height: 1.02;
    letter-spacing: -0.02em;
    color: var(--ink);
  }
  .cta-title .roman, .cta-title .emph { display: block; }
  .cta-sub {
    font-family: 'Inter', sans-serif;
    font-size: 22px;
    line-height: 1.4;
    color: var(--muted);
    margin-top: 28px;
    max-width: 720px;
  }
  .cta-button {
    display: inline-block;
    background: var(--ink);
    color: var(--white);
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 20px;
    padding: 18px 32px;
    border-radius: 999px;
    margin-top: 40px;
    align-self: flex-start;
    letter-spacing: 0.01em;
  }
  .doodle-cta {
    position: absolute;
    right: calc(var(--frame) + 56px);
    bottom: calc(var(--frame) + 130px);
    width: 100px;
    height: auto;
    opacity: 0.9;
  }
</style>
</head>
<body>
  <div class="card">
    ${slideHtml}
  </div>
</body>
</html>`;
}

/* ---------- Main ---------- */

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error('Usage: node generate.js inputs/<file>.json');
    process.exit(1);
  }
  const inputPath = path.resolve(ROOT, inputArg);
  const deck = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const w = (deck.canvas && deck.canvas.width) || DEFAULT_WIDTH;
  const h = (deck.canvas && deck.canvas.height) || DEFAULT_HEIGHT;

  const outDir = path.join(ROOT, 'output', deck.deck_name || path.basename(inputArg, '.json'));
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  try {
    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i];
      const ctx = { index: i, total: deck.slides.length, author: deck.author };
      const slideHtml = renderSlide(slide, ctx);
      const html = buildHtml(slideHtml, deck);
      const tmpHtml = path.join(ROOT, `.tmp-render-${i}.html`);
      fs.writeFileSync(tmpHtml, html);

      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: SCALE });
      await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts && document.fonts.ready);

      const num = String(i + 1).padStart(2, '0');
      const outFile = path.join(outDir, `${num}-${slide.type}.png`);
      await page.screenshot({ path: outFile, type: 'png', clip: { x: 0, y: 0, width: w, height: h }, omitBackground: false });

      await page.close();
      fs.unlinkSync(tmpHtml);
      console.log(`OK  ${path.relative(process.cwd(), outFile)}`);
    }
  } finally {
    await browser.close();
  }
  console.log(`\nRendered ${deck.slides.length} slides → ${path.relative(process.cwd(), outDir)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
