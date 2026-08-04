/* The Kiln — brand thumbnail (EXPLORATION / modern direction)
   Gradient frame (orange_indigo) + topographic texture overlay + cream interior,
   centered "The Kiln" lockup, sparse monoline-doodle accents. No tagline.
   Matches templates/freeform/index.html frame construction.
   Canvas 1280×800, exported @2x → 2560×1600 PNG. */

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const CANVAS_W = 1280;
const CANVAS_H = 800;
const SCALE = 2;

const EXP = path.resolve(__dirname, '../../../brand/assets/exploration');
const OUT = path.resolve(__dirname, 'output/thumbnail.png');

const b64 = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
const logo = b64(path.join(EXP, 'logos', 'kiln-lockup-black.png'));
const texture = b64(path.join(EXP, 'texture-topographic.png'));

// Several exploration doodles ship on an opaque white background. Recolor every
// doodle to crisp black-on-transparent: alpha = darkness, clamped to any existing
// alpha so already-transparent PNGs keep their anti-aliased edges.
async function doodle(name) {
  const src = path.join(EXP, 'doodles', `${name}.png`);
  const { data, info } = await sharp(src).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  for (let i = 0; i < data.length; i += ch) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const darkAlpha = 255 - lum;            // black lines -> opaque, white -> clear
    data[i + 3] = Math.min(data[i + 3], darkAlpha);
    data[i] = data[i + 1] = data[i + 2] = 0; // force pure black ink
  }
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: ch } })
    .png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

// Sparse monoline accents tucked toward the corners so the centered lockup breathes.
const layout = [
  { name: 'spiral',         css: 'top:46px;  left:70px;   width:108px; transform:rotate(-6deg);' },
  { name: 'paper-airplane', css: 'top:54px;  right:66px;  width:150px; transform:rotate(4deg);' },
  { name: 'envelope',       css: 'top:50%;   left:60px;   width:104px; transform:translateY(-50%) rotate(-5deg);' },
  { name: 'planet-ring',    css: 'top:50%;   right:64px;  width:118px; transform:translateY(-50%) rotate(8deg);' },
  { name: 'curl-cluster',   css: 'bottom:48px; left:84px;  width:120px; transform:rotate(3deg);' },
  { name: 'light-bulb',     css: 'bottom:44px; right:96px; width:96px;  transform:rotate(-4deg);' },
];

async function buildHtml() {
const els = await Promise.all(layout.map(async (e) => ({ src: await doodle(e.name), css: e.css })));
return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  html,body { width:${CANVAS_W}px; height:${CANVAS_H}px; }
  :root { --grad-from:#FB923C; --grad-to:#818CF8; --cream:#F5F4EB; --frame:40px; }
  .frame {
    width:${CANVAS_W}px; height:${CANVAS_H}px; position:relative; overflow:hidden;
    background:linear-gradient(135deg, var(--grad-from) 0%, var(--grad-to) 100%);
    padding:var(--frame);
  }
  .frame::before {
    content:''; position:absolute; inset:0;
    background-image:url('${texture}');
    background-size:50% 50%; background-repeat:repeat;
    mix-blend-mode:multiply; opacity:0.5; pointer-events:none; z-index:1;
  }
  .interior {
    position:relative; z-index:2; width:100%; height:100%;
    background:var(--cream); overflow:hidden;
  }
  .el { position:absolute; height:auto; display:block; opacity:0.92; z-index:2; }
  .lockup {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    width:420px; height:auto; z-index:5;
  }
</style></head>
<body>
  <div class="frame">
    <div class="interior">
      ${els.map(e => `<img class="el" style="${e.css}" src="${e.src}">`).join('\n      ')}
      <img class="lockup" src="${logo}">
    </div>
  </div>
</body></html>`;
}

(async () => {
  const html = await buildHtml();
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
