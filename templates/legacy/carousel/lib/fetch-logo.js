#!/usr/bin/env node
/* Hardened logo capture with cache + selector registry.

   Usage:
     node lib/fetch-logo.js <domain> [--selector "css"] [--hide "css"] [--force] [--height 256]

   Examples:
     node lib/fetch-logo.js clay.com                     // uses registry, cache hit = no-op
     node lib/fetch-logo.js ramp.com --selector "nav svg" // first-time capture, selector saved to registry
     node lib/fetch-logo.js clay.com --force              // re-capture even if cached

   Behavior:
     1. Look up domain in captures/logos/registry.json for a known selector.
     2. If cached PNG exists at captures/logos/<domain>.png and --force not set, skip.
     3. Navigate to https://<domain>, inject CSS that forces the element + ancestors
        to transparent backgrounds so omitBackground=true yields clean transparency.
     4. Screenshot the element with omitBackground.
     5. Trim transparent edges with sharp so the PNG is tight to the logo pixels.
     6. Save and update registry if selector was passed.
*/

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(ROOT, 'captures', 'logos');
const REGISTRY_PATH = path.join(LOGOS_DIR, 'registry.json');

function parseArgs(argv) {
  const o = { domain: null, selector: null, hide: [], force: false, height: 256, invert: false };
  const rest = [...argv];
  o.domain = rest.shift();
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--selector')    o.selector = rest[++i];
    else if (a === '--hide')   o.hide.push(rest[++i]);
    else if (a === '--force')  o.force = true;
    else if (a === '--height') o.height = Number(rest[++i]);
    else if (a === '--invert') o.invert = true;
  }
  return o;
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { domains: {} };
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function saveRegistry(reg) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2) + '\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.domain) {
    console.error('Usage: node lib/fetch-logo.js <domain> [--selector "css"] [--hide "css"] [--force] [--height N]');
    process.exit(1);
  }

  const registry = loadRegistry();
  const entry = registry.domains[opts.domain] || {};
  const selector = opts.selector || entry.selector;
  const hide = opts.hide.length ? opts.hide : (entry.hide || []);
  if (entry.invert) opts.invert = opts.invert || true;

  if (!selector) {
    console.error(`No selector for ${opts.domain}. Pass --selector "<css>" on first capture.`);
    process.exit(1);
  }

  fs.mkdirSync(LOGOS_DIR, { recursive: true });
  const outPath = path.join(LOGOS_DIR, `${opts.domain}.png`);

  if (fs.existsSync(outPath) && !opts.force) {
    console.log(`• cached: ${path.relative(process.cwd(), outPath)}`);
    return;
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(`https://${opts.domain}`, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));

    if (hide.length) {
      await page.addStyleTag({ content: hide.map(s => `${s}{display:none !important;}`).join('\n') });
    }

    // Harden: make page + element + ancestors transparent so omitBackground reveals only the logo.
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      document.documentElement.style.setProperty('background', 'transparent', 'important');
      document.body.style.setProperty('background', 'transparent', 'important');
      let cur = el;
      while (cur && cur !== document.documentElement) {
        cur.style.setProperty('background', 'transparent', 'important');
        cur.style.setProperty('background-image', 'none', 'important');
        cur.style.setProperty('backdrop-filter', 'none', 'important');
        cur = cur.parentElement;
      }
    }, selector);
    await new Promise(r => setTimeout(r, 300));

    const el = await page.$(selector);
    if (!el) throw new Error(`Selector not found on ${opts.domain}: ${selector}`);
    const tmpBuf = await el.screenshot({ type: 'png', omitBackground: true });

    // Trim transparent edges, cap the height, invert RGB if --invert (for white-on-dark logos), re-save.
    let pipeline = sharp(tmpBuf).trim();
    if (opts.invert) pipeline = pipeline.negate({ alpha: false });
    await pipeline
      .resize({ height: opts.height, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(outPath);

    console.log(`✓ ${path.relative(process.cwd(), outPath)}`);
  } finally {
    await browser.close();
  }

  // Persist selector + hide + invert to registry for repeat runs.
  if (opts.selector || opts.invert) {
    const prev = registry.domains[opts.domain] || {};
    registry.domains[opts.domain] = {
      selector: opts.selector || prev.selector,
      ...(opts.hide.length ? { hide: opts.hide } : (prev.hide ? { hide: prev.hide } : {})),
      ...(opts.invert ? { invert: true } : {}),
    };
    saveRegistry(registry);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
