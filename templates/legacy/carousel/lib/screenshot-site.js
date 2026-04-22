#!/usr/bin/env node
/* Capture a screenshot of a live URL (optionally a specific element) and save as PNG.
   Usage:
     node lib/screenshot-site.js <url> <out.png> [--selector "css selector"] [--viewport 1440x900]
   Examples:
     node lib/screenshot-site.js https://clay.com out/clay-hero.png --viewport 1440x900
     node lib/screenshot-site.js https://clay.com out/clay-table.png --selector "[data-testid='hero-table']" */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function parseArgs(argv) {
  const [url, out, ...rest] = argv;
  const opts = { selector: null, viewport: { width: 1440, height: 900 }, hide: [] };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--selector') opts.selector = rest[++i];
    else if (rest[i] === '--viewport') {
      const [w, h] = rest[++i].split('x').map(Number);
      opts.viewport = { width: w, height: h };
    } else if (rest[i] === '--hide') {
      opts.hide.push(rest[++i]);
    } else if (rest[i] === '--clip') {
      const [x, y, w, h] = rest[++i].split(',').map(Number);
      opts.clip = { x, y, width: w, height: h };
    }
  }
  return { url, out, opts };
}

async function main() {
  const { url, out, opts } = parseArgs(process.argv.slice(2));
  if (!url || !out) {
    console.error('Usage: node lib/screenshot-site.js <url> <out.png> [--selector SEL] [--viewport WxH]');
    process.exit(1);
  }

  const outAbs = path.resolve(process.cwd(), out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ ...opts.viewport, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1500));

    // Best-effort dismiss of cookie banners + sticky promos. Matches common CTA text.
    await page.evaluate(() => {
      const needles = ['accept all', 'accept cookies', 'i agree', 'got it', 'allow all'];
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      for (const b of btns) {
        const txt = (b.textContent || '').trim().toLowerCase();
        if (needles.some(n => txt === n || txt.startsWith(n))) { b.click(); break; }
      }
      for (const el of document.querySelectorAll('[class*="cookie" i], [id*="cookie" i], [class*="announcement" i], [class*="promo-bar" i], [class*="banner" i][class*="top" i]')) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    if (opts.hide.length) {
      await page.addStyleTag({ content: opts.hide.map(s => `${s}{display:none !important;}`).join('\n') });
    }
    await new Promise(r => setTimeout(r, 500));

    if (opts.selector) {
      const el = await page.$(opts.selector);
      if (!el) throw new Error(`Selector not found: ${opts.selector}`);
      await el.screenshot({ path: outAbs, type: 'png' });
    } else if (opts.clip) {
      await page.screenshot({ path: outAbs, type: 'png', clip: opts.clip });
    } else {
      await page.screenshot({ path: outAbs, type: 'png', fullPage: false });
    }
    console.log(`✓ ${path.relative(process.cwd(), outAbs)}`);
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
