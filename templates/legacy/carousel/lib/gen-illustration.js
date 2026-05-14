#!/usr/bin/env node
/* Generate a Fluent-3D-style illustration via OpenAI gpt-image-2, using
   existing brand icons as style references. Writes a PNG to the target path.

   Usage:
     node lib/gen-illustration.js \
       --prompt "A 3D illustrated scene: a rocket lifting off from a stack of CRM tables, playful, saturated colors." \
       --out generated/claude-strengths.png \
       [--ref envelope.png --ref rocket.png]        // style-reference icons from brand/assets/legacy/icons-3d/
       [--size 1024x1024]                           // 1024x1024, 1024x1536, 1536x1024
       [--quality high]                             // low | medium | high
       [--background transparent]                   // transparent | opaque
       [--model gpt-image-2]                        // default

   If --ref is provided, uses the edit endpoint (style-locking). If not, uses
   plain text-to-image. */

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { toFile } = require('openai');

const ROOT = path.resolve(__dirname, '..');
const BRAND_ICONS = path.resolve(ROOT, '..', '..', '..', 'brand', 'assets', 'legacy', 'icons-3d');

function loadEnv() {
  const candidates = [
    path.resolve(ROOT, '..', '..', '..', '.env'),
    path.join(ROOT, '.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  }
}

function parseArgs(argv) {
  const o = { prompt: null, out: null, refs: [], size: '1024x1024', quality: 'high', background: 'transparent', model: 'gpt-image-2' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prompt')           o.prompt = argv[++i];
    else if (a === '--out')         o.out = argv[++i];
    else if (a === '--ref')         o.refs.push(argv[++i]);
    else if (a === '--size')        o.size = argv[++i];
    else if (a === '--quality')     o.quality = argv[++i];
    else if (a === '--background')  o.background = argv[++i];
    else if (a === '--model')       o.model = argv[++i];
  }
  return o;
}

async function main() {
  loadEnv();
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.prompt || !opts.out) {
    console.error('Usage: node lib/gen-illustration.js --prompt "..." --out <path> [--ref icon.png ...] [--size WxH] [--quality low|medium|high]');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY (checked process.env and .env).');
    process.exit(1);
  }

  const outAbs = path.resolve(process.cwd(), opts.out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });

  const client = new OpenAI();

  let b64;
  if (opts.refs.length === 0) {
    const resp = await client.images.generate({
      model: opts.model,
      prompt: opts.prompt,
      size: opts.size,
      quality: opts.quality,
      background: opts.background,
      n: 1,
    });
    b64 = resp.data[0].b64_json;
  } else {
    const images = await Promise.all(opts.refs.map(async (name) => {
      const abs = path.isAbsolute(name) ? name : path.join(BRAND_ICONS, name);
      if (!fs.existsSync(abs)) throw new Error(`Reference icon not found: ${abs}`);
      return toFile(fs.createReadStream(abs), path.basename(abs), { type: 'image/png' });
    }));
    const resp = await client.images.edit({
      model: opts.model,
      prompt: opts.prompt,
      image: images,
      size: opts.size,
      quality: opts.quality,
      background: opts.background,
      n: 1,
    });
    b64 = resp.data[0].b64_json;
  }

  fs.writeFileSync(outAbs, Buffer.from(b64, 'base64'));
  console.log(`✓ ${path.relative(process.cwd(), outAbs)}  (${opts.size}, ${opts.quality}, bg=${opts.background}, refs=${opts.refs.length})`);
}

main().catch((e) => {
  console.error(e?.response?.data || e);
  process.exit(1);
});
