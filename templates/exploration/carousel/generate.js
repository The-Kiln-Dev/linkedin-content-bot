#!/usr/bin/env node
/* Ink & Kiln carousel → multi-PNG via Puppeteer.

   Visual language per ../../../brand/brand-exploration.md (v2 — Ink & Kiln):
     - warm paper canvas with visible grain, full bleed (no white panel, no fence)
     - "glaze dip" — one wavy-edged gradient band per slide (topographic texture
       overlaid), depth + edge varies by slide role; the deck's gradient constant
     - hand-drawn ink structure: seeded wobbly underlines, circles, arrows,
       boxes, checks, asterisks (templates/craft/craft.js — one shared hand)
     - Fraunces with real scale drama; italic emphasis gets a hand mark
     - marker spot illustrations (brand doodles / gen-spot), never thin-line icons
     - slide ARCHETYPES, not one skeleton: cover, point, big-number, quote,
       list, diagram, cta — each with its own composition

   Usage:
     node generate.js inputs/sample-outbound.json
     open output/sample-outbound/*.png

   Input schema (v2) — see README.md. Old v1 inputs (cover/content/cta with
   title_roman/title_italic) still render via a compat mapping.
*/

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const craft = require('../../craft/craft.js');

const ROOT = __dirname;
const BRAND_DIR = path.resolve(ROOT, '..', '..', '..', 'brand');
const EXPLORATION_ASSETS = path.join(BRAND_DIR, 'assets', 'exploration');

const SCALE = 2;
const W = 1080;
const H = 1350;

const GRADIENTS = JSON.parse(
  fs.readFileSync(path.join(BRAND_DIR, 'colors-exploration.json'), 'utf8')
).gradient_variants;

/* ---------- Utilities ---------- */

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

function assetUrl(...segs) {
  return pathToFileUrl(path.join(EXPLORATION_ASSETS, ...segs));
}

function spotUrl(name) {
  if (!name) return null;
  const candidates = [
    path.join(EXPLORATION_ASSETS, 'doodles', name),
    path.join(ROOT, 'generated', name),
    path.resolve(ROOT, name),
    path.resolve(process.cwd(), name),
  ];
  // also search one level of generated/<deck>/ subdirectories
  const genDir = path.join(ROOT, 'generated');
  if (fs.existsSync(genDir)) {
    for (const sub of fs.readdirSync(genDir)) {
      const p = path.join(genDir, sub, name);
      if (fs.existsSync(p) && fs.statSync(path.join(genDir, sub)).isDirectory()) candidates.push(p);
    }
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) return pathToFileUrl(p);
  }
  throw new Error(`Spot illustration not found: ${name} (looked in brand doodles, generated/**, carousel root)`);
}

/* ---------- Emphasis parsing ----------
   v2 titles are single strings with *emphasis* spans:
     "Build a *factory*, not an army"
   Emphasis renders as Fraunces italic in the accent color with a hand mark. */

function parseEmphasis(str) {
  const parts = [];
  let rest = String(str);
  const re = /\*([^*]+)\*/;
  while (rest.length) {
    const m = rest.match(re);
    if (!m) { parts.push({ t: rest, em: false }); break; }
    if (m.index > 0) parts.push({ t: rest.slice(0, m.index), em: false });
    parts.push({ t: m[1], em: true });
    rest = rest.slice(m.index + m[0].length);
  }
  return parts;
}

/* Render a title string. mark: underline | circle | highlight | none */
function emphHtml(str, rng, mark, opts) {
  const o = opts || {};
  const parts = parseEmphasis(str);
  return parts.map((p) => {
    if (!p.em) return `<span class="rm">${esc(p.t)}</span>`;
    const markSvg = emphMark(rng, mark || 'underline', o);
    return `<span class="em">${esc(p.t)}${markSvg}</span>`;
  }).join('');
}

/* Inline hand mark, stretched to the emphasis span via preserveAspectRatio=none.
   Jitter-only (no displacement filter) so non-uniform scaling stays clean. */
function emphMark(rng, mark, opts) {
  const o = opts || {};
  if (mark === 'none') return '';
  if (mark === 'underline') {
    const inner =
      craft.handLine(rng, 4, 10, 296, 8 + (rng() * 6 - 3), { amp: 2.6, width: 7, filter: null, stroke: 'var(--accent)' }) +
      craft.handLine(rng, 10, 17, 262 + rng() * 30, 16 + (rng() * 4 - 2), { amp: 2.2, width: 5.5, filter: null, stroke: 'var(--accent)', opacity: 0.75 });
    return `<svg class="mark mark-underline" viewBox="0 0 300 24" preserveAspectRatio="none">${inner}</svg>`;
  }
  if (mark === 'circle') {
    const inner = craft.handCircle(rng, 150, 50, 138, 40, { width: o.thin ? 4 : 5.5, filter: null, stroke: 'var(--accent)', drift: 0.05 });
    return `<svg class="mark mark-circle" viewBox="0 0 300 100" preserveAspectRatio="none">${inner}</svg>`;
  }
  if (mark === 'highlight') {
    const pts = [[6, 50 + (rng() * 10 - 5)], [294, 50 + (rng() * 12 - 6)]];
    const d = `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]}`;
    return `<svg class="mark mark-highlight" viewBox="0 0 300 100" preserveAspectRatio="none"><path d="${d}" stroke="var(--accent)" stroke-width="86" stroke-linecap="round" fill="none" opacity="0.32"/></svg>`;
  }
  return '';
}

/* ---------- Glaze dip band ---------- */

function glazeHtml(rng, edge, depth, ctx) {
  const d = depth + Math.round(rng() * depth * 0.15);
  const pathD = craft.glazeDipPath(rng, W, d, { waves: 6 + Math.floor(rng() * 3) });
  const flip = edge === 'bottom' ? ' style="transform: scaleY(-1); bottom: 0; top: auto;"' : '';
  return `
    <div class="glaze"${flip}>
      <div class="glaze-fill" style="clip-path: path('${pathD}');"></div>
      <div class="glaze-tex" style="clip-path: path('${pathD}');"></div>
    </div>`;
}

/* ---------- Shared chrome ---------- */

function chromeTop(slide, ctx) {
  const label = slide.kicker || slide.category || slide.step_label || '';
  return `
    <header class="chrome-top">
      <img class="lockup" src="${assetUrl('logos', 'kiln-lockup-black.png')}" alt="The Kiln">
      ${label ? `<span class="kicker">${esc(label)}</span>` : ''}
    </header>`;
}

function chromeFoot(rng, ctx) {
  const line = craft.svg(952, 14, craft.handLine(rng, 2, 7, 950, 7 + (rng() * 4 - 2), { amp: 1.6, width: 2.4, opacity: 0.5 }), { class: 'foot-line' });
  const n = String(ctx.index + 1).padStart(2, '0');
  const t = String(ctx.total).padStart(2, '0');
  return `
    <footer class="chrome-foot">
      ${line}
      <div class="foot-row">
        <span>${esc(ctx.author || '')}</span>
        <span class="foot-count">${n} — ${t}</span>
      </div>
    </footer>`;
}

/* ---------- Title sizing heuristic ---------- */

function coverTitleSize(str) {
  const clean = String(str).replace(/\*/g, '');
  const n = clean.length;
  if (n <= 20) return 156;
  if (n <= 30) return 136;
  if (n <= 42) return 118;
  if (n <= 58) return 100;
  return 86;
}

function pointTitleSize(str) {
  const n = String(str).replace(/\*/g, '').length;
  if (n <= 26) return 84;
  if (n <= 40) return 72;
  if (n <= 60) return 62;
  return 54;
}

/* ---------- Archetype renderers ---------- */

function renderCover(slide, ctx) {
  const rng = ctx.rng;
  const size = slide.title_size || coverTitleSize(slide.title);
  const spot = slide.spot ? spotUrl(slide.spot) : null;
  const spotRot = (rng() * 14 - 7).toFixed(1);
  const aster = craft.svg(60, 60, craft.handAsterisk(rng, 30, 30, 22, { width: 4.5, opacity: 0.85 }));
  return `
    <div class="slide slide-cover">
      ${glazeHtml(rng, 'top', 130, ctx)}
      ${chromeTop(slide, ctx)}
      <div class="cover-body">
        <h1 class="title" style="font-size: ${size}px;">${emphHtml(slide.title, rng, slide.mark || 'highlight')}</h1>
        ${slide.subtitle ? `<p class="cover-sub">${esc(slide.subtitle)}</p>` : ''}
        ${slide.note ? `<div class="hand-note cover-note">${esc(slide.note)}${craft.svg(130, 54, craft.handArrow(rng, 10, 10, 116, 44, { width: 3.4, curve: -22, head: 14 }), { class: 'note-arrow' })}</div>` : ''}
      </div>
      ${spot ? `<img class="cover-spot" style="transform: rotate(${spotRot}deg);" src="${spot}" alt="">` : `<div class="cover-aster">${aster}</div>`}
      ${chromeFoot(rng, ctx)}
    </div>`;
}

function renderPoint(slide, ctx) {
  const rng = ctx.rng;
  const num = slide.num != null ? slide.num : ctx.contentIndex;
  const flip = slide.flip != null ? slide.flip : (ctx.contentIndex % 2 === 0);
  const size = slide.title_size || pointTitleSize(slide.title);
  const circle = craft.svg(190, 190, craft.handCircle(rng, 95, 95, 74, 70, { width: 5.5, stroke: 'var(--accent)' }), { class: 'num-circle' });
  const spot = slide.spot ? spotUrl(slide.spot) : null;
  const spotRot = (rng() * 12 - 6).toFixed(1);
  return `
    <div class="slide slide-point ${flip ? 'flip' : ''}">
      ${glazeHtml(rng, ctx.contentIndex % 2 === 0 ? 'bottom' : 'top', 44, ctx)}
      ${chromeTop(slide, ctx)}
      <div class="point-body">
        <div class="point-numwrap">${circle}<span class="point-num">${esc(String(num))}</span></div>
        <h2 class="title point-title" style="font-size: ${size}px;">${emphHtml(slide.title, rng, slide.mark || 'underline')}</h2>
        ${slide.body ? `<p class="point-text">${esc(slide.body)}</p>` : ''}
        ${slide.note ? `<div class="hand-note point-note">${esc(slide.note)}</div>` : ''}
      </div>
      ${spot ? `<img class="point-spot" style="transform: rotate(${spotRot}deg);" src="${spot}" alt="">` : ''}
      ${chromeFoot(rng, ctx)}
    </div>`;
}

function renderBigNumber(slide, ctx) {
  const rng = ctx.rng;
  const stat = String(slide.stat != null ? slide.stat : slide.title || '');
  const statSize = stat.replace(/\*/g, '').length <= 4 ? 300 : stat.length <= 7 ? 230 : 170;
  const under = craft.svg(620, 30, craft.handUnderline(rng, 6, 12, 600, { width: 8, stroke: 'var(--accent)' }), { class: 'stat-under' });
  return `
    <div class="slide slide-bignum">
      ${glazeHtml(rng, ctx.contentIndex % 2 === 0 ? 'bottom' : 'top', 44, ctx)}
      ${chromeTop(slide, ctx)}
      <div class="bignum-body">
        ${slide.label ? `<div class="bignum-label">${esc(slide.label)}</div>` : ''}
        <div class="bignum-stat" style="font-size: ${statSize}px;">${esc(stat)}</div>
        ${under}
        ${slide.context ? `<p class="bignum-context">${emphHtml(slide.context, rng, 'none')}</p>` : ''}
        ${slide.note ? `<div class="hand-note bignum-note">${esc(slide.note)}</div>` : ''}
      </div>
      ${chromeFoot(rng, ctx)}
    </div>`;
}

function renderQuote(slide, ctx) {
  const rng = ctx.rng;
  return `
    <div class="slide slide-quote">
      ${glazeHtml(rng, ctx.contentIndex % 2 === 0 ? 'bottom' : 'top', 44, ctx)}
      ${chromeTop(slide, ctx)}
      <div class="quote-body">
        <div class="quote-glyph">&ldquo;</div>
        <blockquote class="quote-text">${emphHtml(slide.quote || slide.title, rng, slide.mark || 'none')}</blockquote>
        ${slide.attribution ? `<div class="quote-attr">${craft.svg(84, 14, craft.handLine(rng, 2, 7, 80, 7, { width: 4, stroke: 'var(--accent)' }), { class: 'attr-dash' })}${esc(slide.attribution)}</div>` : ''}
      </div>
      ${chromeFoot(rng, ctx)}
    </div>`;
}

function renderList(slide, ctx) {
  const rng = ctx.rng;
  const size = slide.title_size || pointTitleSize(slide.title || '');
  const items = (slide.items || []).map((it, i) => {
    const bullet = craft.svg(40, 40, craft.handCheck(rng, 6, 8, 26, { width: 4.6, stroke: 'var(--accent)' }), { class: 'li-check' });
    const label = typeof it === 'string' ? it : it.label;
    const sub = typeof it === 'object' && it.sub ? `<div class="li-sub">${esc(it.sub)}</div>` : '';
    const divider = i > 0 ? craft.svg(880, 10, craft.handLine(rng, 2, 5, 878, 5 + (rng() * 3 - 1.5), { amp: 1.5, width: 1.8, opacity: 0.35 }), { class: 'li-divider' }) : '';
    return `${divider}<div class="li-row">${bullet}<div class="li-copy"><div class="li-label">${esc(label)}</div>${sub}</div></div>`;
  }).join('');
  return `
    <div class="slide slide-list">
      ${glazeHtml(rng, ctx.contentIndex % 2 === 0 ? 'bottom' : 'top', 44, ctx)}
      ${chromeTop(slide, ctx)}
      <div class="list-body">
        ${slide.title ? `<h2 class="title list-title" style="font-size: ${size}px;">${emphHtml(slide.title, rng, slide.mark || 'underline')}</h2>` : ''}
        <div class="list-items">${items}</div>
      </div>
      ${chromeFoot(rng, ctx)}
    </div>`;
}

function renderDiagram(slide, ctx) {
  const rng = ctx.rng;
  const size = slide.title_size || pointTitleSize(slide.title || '');
  const nodes = slide.nodes || [];
  const nodeH = 116;
  const gap = 84;
  const boxW = 560;
  const x0 = (952 - boxW) / 2;
  const totalH = nodes.length * nodeH + (nodes.length - 1) * gap;
  let inner = '';
  nodes.forEach((n, i) => {
    const y = i * (nodeH + gap);
    inner += craft.handBox(rng, x0, y, boxW, nodeH, { width: 5.2, overshoot: 6, amp: 3.4 });
    const label = typeof n === 'string' ? n : n.label;
    const sub = typeof n === 'object' && n.sub ? n.sub : null;
    inner += `<text x="${x0 + boxW / 2}" y="${y + (sub ? nodeH / 2 - 8 : nodeH / 2 + 2)}" text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-weight="600" font-size="29" fill="var(--ink)">${esc(label)}</text>`;
    if (sub) inner += `<text x="${x0 + boxW / 2}" y="${y + nodeH / 2 + 24}" text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-weight="500" font-size="21" fill="var(--muted)">${esc(sub)}</text>`;
    if (i < nodes.length - 1) {
      inner += craft.handArrow(rng, x0 + boxW / 2 + (rng() * 60 - 30), y + nodeH + 6, x0 + boxW / 2 + (rng() * 40 - 20), y + nodeH + gap - 8, { width: 5, stroke: 'var(--accent)', head: 19, curve: (rng() * 2 - 1) * 22 });
    }
  });
  return `
    <div class="slide slide-diagram">
      ${glazeHtml(rng, ctx.contentIndex % 2 === 0 ? 'bottom' : 'top', 44, ctx)}
      ${chromeTop(slide, ctx)}
      <div class="diagram-body">
        ${slide.title ? `<h2 class="title diagram-title" style="font-size: ${size}px;">${emphHtml(slide.title, rng, slide.mark || 'none')}</h2>` : ''}
        ${craft.svg(952, totalH + 16, `<g transform="translate(0,8)">${inner}</g>`, { class: 'diagram-stage' })}
      </div>
      ${chromeFoot(rng, ctx)}
    </div>`;
}

function renderCta(slide, ctx) {
  const rng = ctx.rng;
  const size = slide.title_size || coverTitleSize(slide.title);
  const spot = slide.spot ? spotUrl(slide.spot) : null;
  const spotRot = (rng() * 14 - 7).toFixed(1);
  const btnBox = craft.svg(460, 110, craft.handBox(rng, 14, 14, 432, 82, { width: 5.5, overshoot: 9 }), { class: 'cta-btn-box' });
  const arrow = craft.svg(220, 150, craft.handArrow(rng, 24, 12, 196, 122, { width: 5, stroke: 'var(--accent)', head: 22, curve: -52 }), { class: 'cta-arrow' });
  return `
    <div class="slide slide-cta">
      ${glazeHtml(rng, 'bottom', 130, ctx)}
      ${chromeTop({ ...slide, kicker: slide.kicker || 'NEXT STEP' }, ctx)}
      <div class="cta-body">
        <h1 class="title" style="font-size: ${Math.min(size, 120)}px;">${emphHtml(slide.title, rng, slide.mark || 'underline')}</h1>
        ${slide.subtitle ? `<p class="cover-sub">${esc(slide.subtitle)}</p>` : ''}
        ${slide.button_text ? `<div class="cta-btn-wrap">${arrow}<span class="cta-btn">${btnBox}<span class="cta-btn-text">${esc(slide.button_text)}</span></span></div>` : ''}
      </div>
      ${spot ? `<img class="cta-spot" style="transform: rotate(${spotRot}deg);" src="${spot}" alt="">` : ''}
      ${chromeFoot(rng, ctx)}
    </div>`;
}

/* ---------- v1 compat mapping ---------- */

function normalizeSlide(slide) {
  if (slide.title_roman !== undefined || slide.title_italic !== undefined) {
    const title = `${slide.title_roman || ''}${slide.title_italic ? ` *${slide.title_italic}*` : ''}`.trim();
    const mapped = { ...slide, title };
    delete mapped.title_roman;
    delete mapped.title_italic;
    if (slide.type === 'content') { mapped.type = 'point'; mapped.spot = mapped.spot || slide.doodle; }
    if (slide.type === 'cover' || slide.type === 'cta') mapped.spot = mapped.spot || slide.doodle;
    delete mapped.doodle;
    return mapped;
  }
  return slide;
}

const RENDERERS = {
  cover: renderCover,
  point: renderPoint,
  'big-number': renderBigNumber,
  quote: renderQuote,
  list: renderList,
  diagram: renderDiagram,
  cta: renderCta,
};

/* ---------- Page shell ---------- */

function buildHtml(slideHtml, deck, grad) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..700,30..100;1,9..144,400..700,30..100&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Caveat:wght@500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --grad-from: ${grad.from};
    --grad-to: ${grad.to};
    --accent: ${grad.from};
    --ink: #231F20;
    --muted: #6B645A;
    --paper: #F5EFE2;
    --pad: 64px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }

  .slide {
    position: relative;
    width: ${W}px;
    height: ${H}px;
    background: var(--paper);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  /* paper grain + soft edge vignette over everything */
  .slide::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: ${craft.grainCss()};
    opacity: 0.2;
    mix-blend-mode: multiply;
    pointer-events: none;
    z-index: 40;
  }
  .slide::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 130% 120% at 50% 42%, transparent 62%, rgba(120,90,40,0.05) 100%);
    pointer-events: none;
    z-index: 39;
  }

  /* ---------- Glaze dip ---------- */
  .glaze { position: absolute; top: 0; left: 0; width: ${W}px; height: 240px; z-index: 1; }
  .glaze-fill { position: absolute; inset: 0; background: linear-gradient(115deg, var(--grad-from) 0%, var(--grad-to) 100%); }
  .glaze-tex {
    position: absolute; inset: 0;
    background-image: url('${assetUrl('texture-topographic.png')}');
    background-size: 50% 50%;
    mix-blend-mode: multiply;
    opacity: 0.5;
  }

  /* ---------- Chrome ---------- */
  .chrome-top {
    position: relative;
    z-index: 10;
    padding: 44px var(--pad) 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 auto;
  }
  .lockup { height: 36px; width: auto; display: block; }
  .kicker {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: var(--ink);
    text-transform: uppercase;
  }
  .chrome-foot {
    position: relative;
    z-index: 10;
    margin-top: auto;
    padding: 0 var(--pad) 34px;
    flex: 0 0 auto;
  }
  .foot-line { display: block; width: 100%; height: 14px; margin-bottom: 10px; }
  .foot-row {
    display: flex;
    justify-content: space-between;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: var(--muted);
  }
  .foot-count { font-family: 'JetBrains Mono', monospace; font-size: 14px; letter-spacing: 0.08em; }

  /* ---------- Type ---------- */
  .title {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 144;
    line-height: 1.04;
    letter-spacing: -0.02em;
    color: var(--ink);
    text-wrap: balance;
  }
  .title .em {
    position: relative;
    font-style: italic;
    font-weight: 540;
    color: var(--ink);
    white-space: nowrap;
  }
  .mark { position: absolute; pointer-events: none; }
  .mark-underline { left: -2%; bottom: -0.13em; width: 104%; height: 0.16em; }
  .mark-circle { left: -7%; top: -12%; width: 114%; height: 124%; }
  .mark-highlight { left: -3%; top: 6%; width: 106%; height: 92%; z-index: -1; }

  .hand-note {
    font-family: 'Caveat', cursive;
    font-size: 34px;
    font-weight: 600;
    color: var(--ink);
    opacity: 0.85;
    transform: rotate(-2.5deg);
  }

  /* ---------- Cover ---------- */
  .slide-cover .chrome-top { margin-top: 130px; padding-top: 54px; }
  .cover-body {
    position: relative;
    z-index: 10;
    padding: 0 var(--pad);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 34px;
  }
  .cover-sub {
    font-family: 'Inter', sans-serif;
    font-size: 24px;
    line-height: 1.45;
    color: var(--muted);
    max-width: 660px;
  }
  .cover-note { display: flex; align-items: flex-start; gap: 10px; }
  .note-arrow { flex: 0 0 auto; margin-top: 4px; }
  .cover-spot {
    position: absolute;
    right: 56px;
    bottom: 120px;
    width: 340px;
    height: auto;
    max-height: 320px;
    object-fit: contain;
    mix-blend-mode: multiply;
    opacity: 0.94;
    z-index: 5;
  }
  .cover-aster { position: absolute; right: 96px; bottom: 150px; z-index: 5; }

  /* ---------- Point ---------- */
  .point-body {
    position: relative;
    z-index: 10;
    padding: 20px var(--pad) 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 0;
  }
  .point-numwrap { position: relative; width: 190px; height: 190px; flex: 0 0 auto; margin-bottom: 8px; margin-left: -18px; }
  .slide-point.flip .point-numwrap { align-self: flex-end; margin-right: -6px; }
  .num-circle { position: absolute; inset: 0; }
  .point-num {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-variation-settings: "SOFT" 80, "opsz" 144;
    font-size: 92px;
    color: var(--ink);
  }
  .point-title { margin-bottom: 30px; max-width: 900px; }
  .point-text {
    font-family: 'Inter', sans-serif;
    font-size: 29px;
    line-height: 1.48;
    color: var(--muted);
    max-width: 820px;
  }
  .point-note { margin-top: 26px; }
  .point-spot {
    position: absolute;
    right: 62px;
    bottom: 128px;
    width: 300px;
    height: auto;
    max-height: 300px;
    object-fit: contain;
    mix-blend-mode: multiply;
    opacity: 0.92;
    z-index: 5;
  }
  .slide-point.flip .point-spot { right: auto; left: 70px; }

  /* ---------- Big number ---------- */
  .bignum-body {
    position: relative;
    z-index: 10;
    padding: 0 var(--pad);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .bignum-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 18px;
  }
  .bignum-stat {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 560;
    font-variation-settings: "SOFT" 80, "opsz" 144;
    letter-spacing: -0.03em;
    line-height: 0.95;
    color: var(--ink);
  }
  .stat-under { display: block; margin: 6px 0 30px; }
  .bignum-context {
    font-family: 'Inter', sans-serif;
    font-size: 28px;
    line-height: 1.5;
    color: var(--muted);
    max-width: 780px;
  }
  .bignum-note { margin-top: 24px; }

  /* ---------- Quote ---------- */
  .quote-body {
    position: relative;
    z-index: 10;
    padding: 0 var(--pad);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .quote-glyph {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    font-size: 264px;
    line-height: 0.6;
    color: var(--accent);
    margin-bottom: 14px;
    margin-left: -10px;
  }
  .quote-text {
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-variation-settings: "SOFT" 80, "opsz" 100;
    font-size: 62px;
    line-height: 1.18;
    letter-spacing: -0.01em;
    color: var(--ink);
    max-width: 900px;
  }
  .quote-attr {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 40px;
    font-family: 'Inter', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: var(--muted);
  }

  /* ---------- List ---------- */
  .list-body {
    position: relative;
    z-index: 10;
    padding: 20px var(--pad) 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .list-title { margin-bottom: 40px; }
  .list-items { display: flex; flex-direction: column; }
  .li-divider { display: block; margin: 22px 0; }
  .li-row { display: flex; gap: 22px; align-items: flex-start; }
  .li-check { flex: 0 0 auto; margin-top: 4px; }
  .li-label {
    font-family: 'Inter', sans-serif;
    font-size: 30px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.3;
  }
  .li-sub {
    font-family: 'Inter', sans-serif;
    font-size: 22px;
    line-height: 1.45;
    color: var(--muted);
    margin-top: 6px;
  }

  /* ---------- Diagram ---------- */
  .diagram-body {
    position: relative;
    z-index: 10;
    padding: 20px var(--pad) 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .diagram-title { margin-bottom: 36px; }
  .diagram-stage { display: block; }

  /* ---------- CTA ---------- */
  .slide-cta .chrome-top { padding-top: 54px; }
  .cta-body {
    position: relative;
    z-index: 10;
    padding: 0 var(--pad);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 34px;
  }
  .cta-btn-wrap { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .cta-arrow { margin-top: -70px; }
  .cta-btn { position: relative; display: inline-block; }
  .cta-btn-box { display: block; }
  .cta-btn-text {
    position: absolute;
    inset: 14px 14px 14px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 26px;
    color: var(--ink);
    letter-spacing: 0.01em;
  }
  .cta-spot {
    position: absolute;
    right: 64px;
    top: 190px;
    width: 230px;
    height: auto;
    max-height: 240px;
    object-fit: contain;
    mix-blend-mode: multiply;
    opacity: 0.92;
    z-index: 5;
  }
</style>
</head>
<body>
  ${slideHtml}
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
  const inputPath = (() => {
    if (path.isAbsolute(inputArg)) return inputArg;
    const cwd = path.resolve(process.cwd(), inputArg);
    if (fs.existsSync(cwd)) return cwd;
    return path.resolve(ROOT, inputArg);
  })();
  const deck = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const grad = resolveGradient(deck.gradient_variant || 'orange_indigo');
  const deckSeed = deck.seed || deck.deck_name || path.basename(inputArg, '.json');

  const outDir = path.join(ROOT, 'output', deck.deck_name || path.basename(inputArg, '.json'));
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  try {
    let contentIndex = 0;
    for (let i = 0; i < deck.slides.length; i++) {
      const slide = normalizeSlide(deck.slides[i]);
      const renderer = RENDERERS[slide.type];
      if (!renderer) throw new Error(`Unknown slide type: ${slide.type}. Options: ${Object.keys(RENDERERS).join(', ')}`);
      if (!['cover', 'cta'].includes(slide.type)) contentIndex++;
      const ctx = {
        index: i,
        contentIndex,
        total: deck.slides.length,
        author: deck.author,
        rng: craft.rngFromString(`${deckSeed}/${i}/${slide.type}`),
      };
      const slideHtml = renderer(slide, ctx);
      const html = buildHtml(slideHtml, deck, grad);
      const tmpHtml = path.join(ROOT, `.tmp-render-${i}.html`);
      fs.writeFileSync(tmpHtml, html);

      const page = await browser.newPage();
      await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
      await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts && document.fonts.ready);

      // overflow check — content must not spill past the canvas
      const overflow = await page.evaluate(() => {
        const s = document.querySelector('.slide');
        const bodyEl = s.querySelector('[class$="-body"]');
        const out = [];
        if (s.scrollHeight > s.clientHeight + 2) out.push(`slide scrollHeight ${s.scrollHeight} > ${s.clientHeight}`);
        if (bodyEl && bodyEl.scrollHeight > bodyEl.clientHeight + 2) out.push(`body scrollHeight ${bodyEl.scrollHeight} > ${bodyEl.clientHeight}`);
        return out;
      });
      if (overflow.length) {
        console.warn(`WARN slide ${i + 1} (${slide.type}): possible overflow — ${overflow.join('; ')}`);
      }

      const num = String(i + 1).padStart(2, '0');
      const outFile = path.join(outDir, `${num}-${slide.type}.png`);
      await page.screenshot({ path: outFile, type: 'png', clip: { x: 0, y: 0, width: W, height: H }, omitBackground: false });

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
