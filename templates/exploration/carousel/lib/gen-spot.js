#!/usr/bin/env node
/* Generate a marker-style spot illustration via Recraft, using The Kiln's
   custom brand style (trained on brand/assets/exploration/doodles/*).

   This is the DEFAULT spot generator for Ink & Kiln assets. It produces
   thick, loose marker doodles that match the brand's hand language.
   (lib/gen-doodle.js is the OpenAI fallback if Recraft is unavailable.)

   Usage:
     node lib/gen-spot.js --concept "a wrench" --out generated/<deck>/wrench.png
       [--size 1024x1024]

   Key resolution order:
     1. RECRAFT_API_KEY env var / repo .env
     2. ~/.claude/credentials/recraft_api_key

   The custom style id lives in brand/recraft-style.json (checked in — the
   style itself is private to the API account that created it).
*/

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..', '..', '..');
const STYLE_FILE = path.join(REPO, 'brand', 'recraft-style.json');

function loadKey() {
  // .env at repo root
  const envPath = path.join(REPO, '.env');
  if (!process.env.RECRAFT_API_KEY && fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^RECRAFT_API_KEY\s*=\s*(.+)$/);
      if (m && m[1].trim()) process.env.RECRAFT_API_KEY = m[1].trim();
    }
  }
  if (!process.env.RECRAFT_API_KEY) {
    const credPath = path.join(os.homedir(), '.claude', 'credentials', 'recraft_api_key');
    if (fs.existsSync(credPath)) process.env.RECRAFT_API_KEY = fs.readFileSync(credPath, 'utf8').trim();
  }
  if (!process.env.RECRAFT_API_KEY) {
    console.error('Missing RECRAFT_API_KEY (env, .env, or ~/.claude/credentials/recraft_api_key). Fallback: node lib/gen-doodle.js (OpenAI).');
    process.exit(1);
  }
  return process.env.RECRAFT_API_KEY;
}

function parseArgs(argv) {
  const o = { concept: null, out: null, size: '1024x1024' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--concept') o.concept = argv[++i];
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--size') o.size = argv[++i];
  }
  return o;
}

function post(url, key, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error(`Bad response: ${buf.slice(0, 400)}`)); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Download failed: ${res.statusCode}`));
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  const key = loadKey();
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.concept || !opts.out) {
    console.error('Usage: node lib/gen-spot.js --concept "a wrench" --out generated/<deck>/wrench.png [--size WxH]');
    process.exit(1);
  }
  if (!fs.existsSync(STYLE_FILE)) {
    console.error(`Missing ${path.relative(process.cwd(), STYLE_FILE)} — create a custom style first (see brand/recraft-style.json docs).`);
    process.exit(1);
  }
  const styleId = JSON.parse(fs.readFileSync(STYLE_FILE, 'utf8')).style_id;

  const prompt = [
    `A hand-drawn doodle of exactly one ${opts.concept}, alone on a plain white background, nothing else in the image.`,
    'The single subject is centered and fills most of the canvas with generous white margin on all sides.',
    'Thick loose black marker strokes with visible width variation, like a confident napkin sketch.',
    'Pure line drawing: no shading, no color, no fill, no background scene, no writing of any kind.',
  ].join(' ');

  const resp = await post('https://external.api.recraft.ai/v1/images/generations', key, {
    prompt,
    negative_prompt: 'text, letters, numbers, words, symbols, captions, labels, multiple objects, extra doodles',
    style_id: styleId,
    size: opts.size,
    model: 'recraftv3',
    n: 1,
  });
  if (!resp.data || !resp.data[0] || !resp.data[0].url) {
    throw new Error(`Unexpected Recraft response: ${JSON.stringify(resp).slice(0, 400)}`);
  }

  const outAbs = path.resolve(process.cwd(), opts.out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  await download(resp.data[0].url, outAbs);
  console.log(`OK  ${path.relative(process.cwd(), outAbs)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
