# LinkedIn Content Bot

Patrick's LinkedIn content system for The Kiln. Brand assets, voice docs, draft library, and a working carousel generator.

## Layout

```
brand/          Two parallel brand directions (legacy + exploration), specs,
                color tokens, asset libraries (3D icons, doodles, logos, photos).
                See brand/README.md for the binary-switch convention.

voice/          Patrick's writing voice. voice.md is the reference; pov.md is
                his recurring positions; examples/best/ has 8 canonical posts
                that ground the style.

drafts/         Posts in progress (Patrick-authored, voice-authentic).

templates/      Slide / card templates split by brand direction.
  legacy/carousel/
                The carousel generator. Node + Puppeteer renders 1080×1350
                PNG slides. Supports website screenshots, AI-generated 3D
                illustrations (gpt-image-1), captured logos, flowcharts, and
                artistic logo layouts. See templates/legacy/carousel/README.md
                for install, schema, voice rules, and session learnings.
  exploration/  Statement card (single slide format, atmospheric direction).
```

## Quick start — render the Claude-vs-Clay deck

```
cd templates/legacy/carousel
npm install
node generate.js inputs/claude-vs-clay.json
open output/claude-vs-clay/*.png
```

All assets needed (logos, screenshots, AI-generated scenes) are committed, so this works without network access or OpenAI credits.

## Generating new content

To generate new 3D illustrations, you need an OpenAI API key. Drop it into `templates/legacy/carousel/.env` (gitignored):

```
OPENAI_API_KEY=sk-proj-...
```

Then `node lib/gen-illustration.js --prompt "..." --ref rocket.png --out generated/foo.png`. See the carousel README for the prompt template that works.

## Conventions

- **Brand direction is binary**: every asset picks `legacy` or `exploration`. Carousel default is `legacy`. See `brand/README.md`.
- **Voice rules** (hard, override `voice.md`): no em-dashes, no AI-mush vocab (leverage / unlock / synergy), pull from drafts when possible. See `templates/legacy/carousel/README.md` → "Writing slide copy".
- **No-slop visual heuristic**: each slide picks its asset type by what's most informative — logos for brand-naming, screenshots for products, illustrations for abstract concepts, flowcharts for processes. The carousel README has a full table.
