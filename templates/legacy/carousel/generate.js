#!/usr/bin/env node
/* Legacy Kiln carousel → PNG slides via Puppeteer.
   Usage: node generate.js inputs/claude-vs-clay.json
   See README.md for input schema. */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = __dirname;
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const BRAND_DIR = path.resolve(ROOT, '..', '..', '..', 'brand'); // sales-work/linkedin/brand
const LEGACY_ASSETS = path.join(BRAND_DIR, 'assets', 'legacy');

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const SCALE = 2; // deviceScaleFactor → PNG exports 2160×2700

function pathToFileUrl(abs) {
  return 'file://' + abs.split(path.sep).map(encodeURIComponent).join('/');
}

function renderTemplate(tmpl, vars) {
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) {
      throw new Error(`Template variable not provided: ${key}`);
    }
    return vars[key];
  });
}

function logoLockupUrl() {
  return pathToFileUrl(path.join(LEGACY_ASSETS, 'logos', 'kiln-lockup-black.png'));
}

function authorPhotoUrl() {
  return pathToFileUrl(path.join(LEGACY_ASSETS, 'people', 'patrick.jpeg'));
}

function iconUrl(name) {
  if (!name) return null;
  const p = path.join(LEGACY_ASSETS, 'icons-3d', name);
  if (!fs.existsSync(p)) throw new Error(`3D icon missing: ${p}`);
  return pathToFileUrl(p);
}

function doodleUrl(name) {
  if (!name) return null;
  const p = path.join(LEGACY_ASSETS, 'doodles', name);
  if (!fs.existsSync(p)) throw new Error(`Doodle missing: ${p}`);
  return pathToFileUrl(p);
}

function imgBlock(className, url) {
  return url ? `<img class="visual ${className}" src="${url}" alt="">` : '';
}

function buildCover(slide) {
  const tmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'cover.html'), 'utf8');
  return renderTemplate(tmpl, {
    asset_logo_lockup: logoLockupUrl(),
    asset_author_photo: authorPhotoUrl(),
    category: slide.category || 'TUTORIAL',
    headline: slide.headline,
    cta_text: slide.cta_text || 'Learn how →',
    doodle_left_block: imgBlock('cover-doodle-left', doodleUrl(slide.doodle)),
    icon_right_block: imgBlock('cover-icon-right', iconUrl(slide.icon_3d)),
  });
}

/* Shared visual-component builder — shared between content and standalone slides. */
function buildVisualBlocks(slide) {
  let supportBlock = '';
  if (slide.support_image) {
    const abs = path.isAbsolute(slide.support_image)
      ? slide.support_image
      : path.resolve(ROOT, slide.support_image);
    const variant = slide.support_style
      || (abs.includes(`${path.sep}generated${path.sep}`) ? 'illustration' : 'framed');
    const cls = variant === 'illustration' ? 'content-support is-illustration' : 'content-support';
    supportBlock = `<img class="${cls}" src="${pathToFileUrl(abs)}" alt="">`;
  }
  let logosSceneBlock = '';
  if (slide.logos_layout && slide.logos && slide.logos.length > 0) {
    logosSceneBlock = renderLogosScene(slide.logos_layout, slide.logos, slide.background_doodle);
  }

  let flowchartBlock = '';
  if (slide.flowchart && slide.flowchart.nodes && slide.flowchart.nodes.length > 0) {
    const fc = slide.flowchart;
    const vertical = fc.orientation === 'vertical';
    const arrow = vertical ? '↓' : '→';
    const parts = [];
    fc.nodes.forEach((node, i) => {
      const iconTag = node.icon
        ? `<img class="node-icon" src="${iconUrl(node.icon)}" alt="">`
        : '';
      const labelTag = `<div class="node-label">${node.label}</div>`;
      const subTag = node.sub ? `<div class="node-sub">${node.sub}</div>` : '';
      parts.push(`<div class="flow-node">${iconTag}${labelTag}${subTag}</div>`);
      if (i < fc.nodes.length - 1) {
        parts.push(`<div class="flow-arrow">${arrow}</div>`);
      }
    });
    flowchartBlock = `<div class="flowchart${vertical ? ' is-vertical' : ''}">${parts.join('')}</div>`;
  }

  let toolCardsBlock = '';
  if (slide.tool_cards && slide.tool_cards.length > 0) {
    const cards = slide.tool_cards.map((tc) => {
      const logoAbs = path.isAbsolute(tc.logo) ? tc.logo : path.resolve(ROOT, tc.logo);
      const scale = typeof tc.scale === 'number' ? tc.scale : 1;
      const scaleStyle = scale !== 1
        ? ` style="max-width:${scale * 100}%;max-height:${scale * 100}%;"`
        : '';
      const logoTag = `<div class="tool-logo-frame"><img class="tool-logo" src="${pathToFileUrl(logoAbs)}" alt="${tc.name}"${scaleStyle}></div>`;
      const nameTag = tc.name ? `<div class="tool-name">${tc.name}</div>` : '';
      const noteTag = tc.note ? `<div class="tool-note">${tc.note}</div>` : '';
      return `<div class="tool-card">${logoTag}${nameTag}${noteTag}</div>`;
    }).join('');
    toolCardsBlock = `<div class="tool-cards">${cards}</div>`;
  }

  return { supportBlock, logosSceneBlock, flowchartBlock, toolCardsBlock };
}

function buildContent(slide) {
  const tmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'content.html'), 'utf8');
  const { supportBlock, logosSceneBlock, flowchartBlock, toolCardsBlock } = buildVisualBlocks(slide);

  return renderTemplate(tmpl, {
    asset_logo_lockup: logoLockupUrl(),
    step_label: slide.step_label || (slide.step ? `STEP ${slide.step}` : ''),
    headline: slide.headline,
    body: slide.body || '',
    support_block: supportBlock,
    tool_cards_block: toolCardsBlock,
    flowchart_block: flowchartBlock,
    logos_scene_block: logosSceneBlock,
    icon_tr_block: imgBlock('content-icon-tr', iconUrl(slide.icon_3d_tr || slide.icon_3d)),
    icon_bl_block: imgBlock('content-icon-bl', iconUrl(slide.icon_3d_bl)),
  });
}

function buildCta(slide) {
  const tmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'cta.html'), 'utf8');
  return renderTemplate(tmpl, {
    asset_logo_lockup: logoLockupUrl(),
    asset_author_photo: authorPhotoUrl(),
    category: slide.category || 'NEED SUPPORT?',
    headline: slide.headline,
    cta_text: slide.cta_text || 'Talk with us 👋',
    doodle_left_block: imgBlock('cta-doodle-left', doodleUrl(slide.doodle_left)),
    doodle_right_block: imgBlock('cta-doodle-right', doodleUrl(slide.doodle_right)),
  });
}

function logoPath(src) {
  const abs = path.isAbsolute(src) ? src : path.resolve(ROOT, src);
  return pathToFileUrl(abs);
}

function doodlePath(name) {
  const abs = path.join(LEGACY_ASSETS, 'doodles', name);
  if (!fs.existsSync(abs)) throw new Error(`Doodle not found: ${abs}`);
  return pathToFileUrl(abs);
}

function renderLogosScene(layout, logos, backgroundDoodle) {
  const doodleTag = backgroundDoodle
    ? `<img class="scene-doodle" src="${doodlePath(backgroundDoodle)}" alt="">`
    : '';

  if (layout === 'scattered' || layout === 'path' || layout === 'integrated') {
    const parts = [doodleTag];
    for (const l of logos) {
      const styleBits = [];
      if (l.left !== undefined)   styleBits.push(`left:${typeof l.left === 'number' ? l.left + 'px' : l.left}`);
      if (l.top !== undefined)    styleBits.push(`top:${typeof l.top === 'number' ? l.top + 'px' : l.top}`);
      if (l.right !== undefined)  styleBits.push(`right:${typeof l.right === 'number' ? l.right + 'px' : l.right}`);
      if (l.bottom !== undefined) styleBits.push(`bottom:${typeof l.bottom === 'number' ? l.bottom + 'px' : l.bottom}`);
      if (l.width !== undefined)  styleBits.push(`width:${typeof l.width === 'number' ? l.width + 'px' : l.width}`);
      if (l.rotate !== undefined) styleBits.push(`transform:rotate(${l.rotate}deg)`);
      const style = styleBits.length ? ` style="${styleBits.join(';')}"` : '';
      parts.push(`<img class="logo-float" src="${logoPath(l.src)}"${style} alt="">`);
    }
    const cls = `logos-scene is-${layout}`;
    return `<div class="${cls}">${parts.join('')}</div>`;
  }

  if (layout === 'notes') {
    const notes = logos.map((l) => {
      const rot = typeof l.rotate === 'number' ? l.rotate : 0;
      return `<div class="logo-note" style="transform:rotate(${rot}deg)"><img src="${logoPath(l.src)}" alt=""></div>`;
    }).join('');
    return `<div class="logos-scene is-notes">${notes}</div>`;
  }

  if (layout === 'hero') {
    const primary = logos.find((l) => l.emphasis === 'primary') || logos[0];
    const satellites = logos.filter((l) => l !== primary);
    const primaryTag = `<img class="logo-primary" src="${logoPath(primary.src)}" alt="">`;
    const satelliteTags = satellites.map((l) => {
      const styleBits = [];
      if (l.left !== undefined)   styleBits.push(`left:${l.left}`);
      if (l.top !== undefined)    styleBits.push(`top:${l.top}`);
      if (l.right !== undefined)  styleBits.push(`right:${l.right}`);
      if (l.bottom !== undefined) styleBits.push(`bottom:${l.bottom}`);
      if (l.width !== undefined)  styleBits.push(`max-width:${l.width}px`);
      if (l.rotate !== undefined) styleBits.push(`transform:rotate(${l.rotate}deg)`);
      const style = styleBits.length ? ` style="${styleBits.join(';')}"` : '';
      return `<img class="logo-satellite" src="${logoPath(l.src)}"${style} alt="">`;
    }).join('');
    return `<div class="logos-scene is-hero">${primaryTag}${satelliteTags}</div>`;
  }

  throw new Error(`Unknown logos_layout: ${layout}`);
}

/* Standalone single-image post. Reuses all the content slide's visual
   components (support_image, tool_cards, flowchart, logos_layout) but with
   a different shell: hero headline + optional kicker + visual centerpiece +
   small Kiln watermark. No STEP label, no cream footer, no "Next step →". */
function buildStandalone(slide) {
  const tmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'standalone.html'), 'utf8');
  const { supportBlock, logosSceneBlock, flowchartBlock, toolCardsBlock } = buildVisualBlocks(slide);

  const kickerBlock = slide.kicker
    ? `<p class="kicker">${slide.kicker}</p>`
    : '';

  return renderTemplate(tmpl, {
    asset_logo_lockup: logoLockupUrl(),
    headline: slide.headline,
    kicker_block: kickerBlock,
    support_block: supportBlock,
    tool_cards_block: toolCardsBlock,
    flowchart_block: flowchartBlock,
    logos_scene_block: logosSceneBlock,
  });
}

function buildHtml(slide) {
  switch (slide.type) {
    case 'cover':      return buildCover(slide);
    case 'content':    return buildContent(slide);
    case 'cta':        return buildCta(slide);
    case 'standalone': return buildStandalone(slide);
    default: throw new Error(`Unknown slide type: ${slide.type}`);
  }
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node generate.js <input.json>');
    process.exit(1);
  }
  const absInput = path.resolve(process.cwd(), inputPath);
  const deck = JSON.parse(fs.readFileSync(absInput, 'utf8'));

  const outDir = path.resolve(ROOT, deck.output_dir || 'output/default');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CANVAS_W, height: CANVAS_H, deviceScaleFactor: SCALE });

    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i];
      const html = buildHtml(slide);

      const tmpHtmlPath = path.join(TEMPLATES_DIR, `__render_${i}.html`);
      fs.writeFileSync(tmpHtmlPath, html);

      await page.goto(pathToFileUrl(tmpHtmlPath), { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);

      const num = String(i + 1).padStart(2, '0');
      const outFile = path.join(outDir, `${num}-${slide.type}.png`);
      await page.screenshot({ path: outFile, omitBackground: false, type: 'png' });

      fs.unlinkSync(tmpHtmlPath);
      console.log(`✓ ${path.relative(process.cwd(), outFile)}`);
    }
  } finally {
    await browser.close();
  }
  console.log(`\nRendered ${deck.slides.length} slides → ${path.relative(process.cwd(), outDir)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
