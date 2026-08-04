#!/usr/bin/env node
/* The Kiln — YouTube banner (legacy direction) → PNG via Puppeteer.
   Canvas: 2560×1440 (YouTube TV display).
   Critical content lives inside the centered 1546×423 safe zone — visible on
   every device. Hero-scale doodles bleed into the TV-only edges. */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = __dirname;
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const OUTPUT_DIR = path.join(ROOT, 'output');
const BRAND_DIR = path.resolve(ROOT, '..', '..', '..', 'brand');
const LEGACY_ASSETS = path.join(BRAND_DIR, 'assets', 'legacy');

const CANVAS_W = 2560;
const CANVAS_H = 1440;

function pathToFileUrl(abs) {
  return 'file://' + abs.split(path.sep).map(encodeURIComponent).join('/');
}

function assetUrl(...parts) {
  const p = path.join(LEGACY_ASSETS, ...parts);
  if (!fs.existsSync(p)) throw new Error(`Asset missing: ${p}`);
  return pathToFileUrl(p);
}

function renderTemplate(tmpl, vars) {
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Template variable not provided: ${key}`);
    return vars[key];
  });
}

async function main() {
  const tmpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'banner.html'), 'utf8');
  const html = renderTemplate(tmpl, {
    asset_logo_lockup: assetUrl('logos', 'kiln-lockup-black.png'),
    asset_author_photo: assetUrl('people', 'patrick.jpeg'),
    doodle_left: assetUrl('doodles', 'wave-blob.png'),
    doodle_right: assetUrl('doodles', 'cursive-swoop.png'),
  });

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const htmlPath = path.join(OUTPUT_DIR, '_banner.rendered.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: CANVAS_W, height: CANVAS_H, deviceScaleFactor: 1 });
  await page.goto(pathToFileUrl(htmlPath), { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  const outPath = path.join(OUTPUT_DIR, 'youtube-banner.png');
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width: CANVAS_W, height: CANVAS_H },
    omitBackground: false,
  });
  await browser.close();

  console.log(`Rendered: ${outPath} (${CANVAS_W}×${CANVAS_H})`);
}

main().catch(err => { console.error(err); process.exit(1); });
