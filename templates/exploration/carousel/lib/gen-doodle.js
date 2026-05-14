#!/usr/bin/env node
/* Generate a monoline doodle via OpenAI gpt-image-2, using the existing
   exploration-direction brand doodles as style references. Writes a PNG
   to the target path.

   Style: single thick black ink stroke on white/transparent background,
   loose and wobbly, casual and iconic. Matches the look of
   brand/assets/exploration/doodles/*.png.

   Usage:
     node lib/gen-doodle.js \
       --concept "two clasped hands (handshake)" \
       --out generated/sample-outbound/handshake.png \
       [--ref envelope.png --ref paper-airplane.png]   // default: all 10 brand doodles
       [--size 1024x1024]
       [--quality high]
       [--background transparent]
       [--model gpt-image-2]
*/

const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { toFile } = require('openai');

const ROOT = path.resolve(__dirname, '..');
const BRAND_DOODLES = path.resolve(ROOT, '..', '..', '..', 'brand', 'assets', 'exploration', 'doodles');

const STYLE_PROMPT = [
  'A hand-drawn monoline doodle in the exact style of the reference images.',
  'A single thick black ink stroke on a plain white background.',
  'Loose, wobbly, casual, childlike linework — like a quick napkin sketch with a marker.',
  'No shading. No color. No fill. No fine detail. Pure outline only.',
  'The subject is centered, occupying roughly 65–75% of the canvas, with generous white margin on all sides.',
  'The subject is:',
].join(' ');

function loadEnv() {
  const candidates = [
    path.join(ROOT, '.env'),
    path.resolve(ROOT, '..', '..', 'legacy', 'carousel', '.env'),
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
  const o = {
    concept: null,
    out: null,
    refs: [],
    size: '1024x1024',
    quality: 'high',
    background: 'transparent',
    model: 'gpt-image-2',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--concept')          o.concept = argv[++i];
    else if (a === '--out')         o.out = argv[++i];
    else if (a === '--ref')         o.refs.push(argv[++i]);
    else if (a === '--size')        o.size = argv[++i];
    else if (a === '--quality')     o.quality = argv[++i];
    else if (a === '--background')  o.background = argv[++i];
    else if (a === '--model')       o.model = argv[++i];
  }
  return o;
}

function defaultRefs() {
  return fs.readdirSync(BRAND_DOODLES)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();
}

async function main() {
  loadEnv();
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.concept || !opts.out) {
    console.error('Usage: node lib/gen-doodle.js --concept "..." --out <path> [--ref name.png ...] [--size WxH] [--quality low|medium|high]');
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY. Add it to templates/exploration/carousel/.env or export it in your shell.');
    process.exit(1);
  }

  const refs = opts.refs.length > 0 ? opts.refs : defaultRefs();
  const fullPrompt = `${STYLE_PROMPT} ${opts.concept}.`;

  const outAbs = path.resolve(process.cwd(), opts.out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });

  const client = new OpenAI();

  const images = await Promise.all(refs.map(async (name) => {
    const abs = path.isAbsolute(name) ? name : path.join(BRAND_DOODLES, name);
    if (!fs.existsSync(abs)) throw new Error(`Reference doodle not found: ${abs}`);
    return toFile(fs.createReadStream(abs), path.basename(abs), { type: 'image/png' });
  }));

  const resp = await client.images.edit({
    model: opts.model,
    prompt: fullPrompt,
    image: images,
    size: opts.size,
    quality: opts.quality,
    background: opts.background,
    n: 1,
  });
  const b64 = resp.data[0].b64_json;

  fs.writeFileSync(outAbs, Buffer.from(b64, 'base64'));
  console.log(`OK  ${path.relative(process.cwd(), outAbs)}  (refs=${refs.length}, ${opts.quality})`);
}

main().catch((e) => {
  console.error(e?.response?.data || e);
  process.exit(1);
});
