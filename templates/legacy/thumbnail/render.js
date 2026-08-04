/* The Kiln — brand thumbnail (legacy direction)
   Replicates the scattered-objects cover scene: centered "The Kiln" lockup
   flanked by 3D icons + hand-drawn doodles. No "A Clay Agency" tagline.
   Canvas 1280×800, exported @2x → 2560×1600 PNG. */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CANVAS_W = 1280;
const CANVAS_H = 800;
const SCALE = 2;

const ASSETS = path.resolve(__dirname, '../../../brand/assets/legacy');
const OUT = path.resolve(__dirname, 'output/thumbnail.png');

const b64 = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;

const icon = (name) => b64(path.join(ASSETS, 'icons-3d', `${name}.png`));
const doodle = (name) => b64(path.join(ASSETS, 'doodles', `${name}.png`));
const logo = b64(path.join(ASSETS, 'logos', 'kiln-lockup-black.png'));

// Scattered elements: {src, css}. Tuned to echo the reference composition.
const els = [
  // ---- doodles (behind, lighter) ----
  { src: doodle('cursive-swoop'), css: 'top:70px; left:120px; width:240px; transform:rotate(-4deg);' },
  { src: doodle('swoop-flourish'), css: 'top:90px; right:90px; width:230px; transform:rotate(6deg);' },
  { src: doodle('wavy-arrow'),     css: 'bottom:120px; left:50px; width:170px; transform:rotate(-8deg);' },
  { src: doodle('cloud'),          css: 'bottom:90px; left:50%; margin-left:-70px; width:150px;' },
  { src: doodle('zigzag-line'),    css: 'bottom:230px; right:150px; width:150px; transform:rotate(4deg);' },
  // ---- 3D icons (foreground) ----
  { src: icon('envelope'),  css: 'top:200px; left:40px; width:200px; transform:rotate(-6deg);' },
  { src: icon('hourglass'), css: 'top:60px; left:46%; width:140px; transform:rotate(3deg);' },
  { src: icon('lightbulb'), css: 'top:150px; right:120px; width:150px; transform:rotate(8deg);' },
  { src: icon('trophy'),    css: 'bottom:60px; left:180px; width:190px; transform:rotate(-4deg);' },
  { src: icon('rocket'),    css: 'bottom:50px; right:90px; width:230px; transform:rotate(6deg);' },
];

const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { width:${CANVAS_W}px; height:${CANVAS_H}px; }
  .scene {
    position:relative; width:${CANVAS_W}px; height:${CANVAS_H}px;
    background:#FFFFFF; overflow:hidden;
  }
  .el { position:absolute; height:auto; display:block; }
  .lockup {
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%);
    width:460px; height:auto; z-index:5;
  }
</style></head>
<body>
  <div class="scene">
    ${els.map(e => `<img class="el" style="${e.css}" src="${e.src}">`).join('\n    ')}
    <img class="lockup" src="${logo}">
  </div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CANVAS_W, height: CANVAS_H, deviceScaleFactor: SCALE });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: OUT, omitBackground: false, type: 'png' });
    console.log('Wrote', OUT);
  } finally {
    await browser.close();
  }
})();
