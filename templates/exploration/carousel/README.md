# Ink & Kiln carousel generator

JSON-driven multi-slide PNG generator for LinkedIn carousels — the **default carousel direction** for the repo. Renders slides at 1080×1350 in the Ink & Kiln visual language (see `docs/asset-redesign-2026-08.md` for the rationale):

- **Warm paper canvas** with visible grain, full bleed — no white panel, no gradient fence
- **Glaze dip** — one wavy-edged gradient band per slide (topographic texture overlaid); deep on cover/CTA, slim and alternating edges on interior slides
- **Hand-drawn ink structure** from `templates/craft/craft.js`: seeded wobbly underlines, circles, arrows, boxes, checks — every render wobbles differently, deterministically per slide
- **Fraunces with real scale drama** — up to ~156px covers, ~300px stat numerals; italic emphasis gets a hand mark (underline / circle / highlight)
- **Marker spot illustrations** — thick-stroke brand doodles or Recraft-generated spots. Thin-line icons are banned.
- **Slide archetypes, not one skeleton** — each slide type carries its own composition

From repo root (deps installed once at root via `npm install`):

```
npm run render:carousel -- templates/exploration/carousel/inputs/craft-proof.json
open templates/exploration/carousel/output/craft-proof/*.png
```

## The archetype roster

| Type | Composition | Use for |
|---|---|---|
| `cover` | Deep glaze dip top, poster-scale title with hand-marked emphasis, spot bottom-right, optional Caveat hand-note with swipe arrow | Slide 1 |
| `point` | Hand-circled Fraunces numeral, title with marked emphasis, body, spot (side alternates via `flip`) | One idea per slide |
| `big-number` | Mono kicker label, giant Fraunces stat (up to 300px), double marker underline, context line | The stat that carries the post |
| `quote` | Oversized accent quote glyph, large Fraunces italic, hand-dash attribution | Pull quotes, aphorisms |
| `list` | Marked title + hand-check bullets with wobbly dividers | 2–4 quick items on one slide |
| `diagram` | Hand-drawn boxes + curved accent arrows, vertical flow | Processes, funnels (≤4 nodes) |
| `cta` | Deep glaze dip bottom, title, hand-boxed button with curved arrow pointing into it, spot | Last slide |

**Art-direction rule: no two adjacent slides use the same archetype unless the content is a genuine series (e.g. persona 1/2/3 as `point` slides — fine, the `flip` alternation and per-slide seeds keep them from twinning).** A good 7-slide deck touches 4+ archetypes. If content doesn't fit any archetype, add a new renderer (see "System, not template" below) — don't bend the content.

## Input schema (v2)

```jsonc
{
  "deck_name": "craft-proof",
  "gradient_variant": "orange_indigo",   // one per deck, from brand/colors-exploration.json
  "author": "Patrick Spychalski",
  "seed": "optional-string",             // change to re-roll all hand wobble
  "slides": [
    { "type": "cover", "kicker": "HIRING",
      "title": "Three personas for hiring a *GTM engineer*",   // *asterisks* = emphasis span
      "subtitle": "...", "spot": "magnifying-glass.png",
      "note": "the third one surprised me",                    // optional Caveat hand-note
      "mark": "highlight" },                                   // underline | circle | highlight | none

    { "type": "point", "num": 1, "kicker": "PERSONA 1",
      "title": "The ex-SDR who *taught themselves Clay*",
      "body": "...", "spot": "lightning-bolt.png", "flip": false },

    { "type": "big-number", "kicker": "THE MATH", "label": "Manual hours replaced",
      "stat": "640+", "context": "...", "note": "real client number" },

    { "type": "quote", "quote": "...", "attribution": "..." },

    { "type": "list", "title": "What to *screen for*",
      "items": [ { "label": "...", "sub": "..." } ] },

    { "type": "diagram", "title": "Our *actual* hiring loop",
      "nodes": [ { "label": "Portfolio screen", "sub": "show us a real workflow" } ] },

    { "type": "cta", "title": "Stealing this *playbook?*",
      "subtitle": "...", "button_text": "Follow Patrick", "spot": "paper-airplane.png" }
  ]
}
```

Emphasis: wrap the key phrase in `*asterisks*` inside `title` / `context` / `quote`. It renders as Fraunces italic with a hand mark. Keep it to one phrase per title. v1 inputs (`title_roman` / `title_italic`, types `content`) still render via a compat mapping.

The generator warns on overflow (`WARN slide N: possible overflow`) — treat any warning as a failure and shorten copy or split the slide.

## Spot illustrations

`spot` resolves from, in order: `brand/assets/exploration/doodles/`, `generated/`, `generated/<any-deck>/`.

Generate new concepts with the **Recraft brand style** (default — thick marker strokes matching the brand doodles):

```
node lib/gen-spot.js --concept "magnifying glass" --out generated/<deck>/magnifying-glass.png
```

- Style id lives in `brand/recraft-style.json` (custom style trained on the brand doodles). ~$0.04/generation.
- Describe the subject as a THING ("magnifying glass", "wrench"). Never put numbers or percentages in the concept — Recraft renders them literally.
- Fallback if Recraft is unavailable: `lib/gen-doodle.js` (OpenAI, needs `OPENAI_API_KEY`). Ask it for "thick marker strokes" explicitly — its defaults come out thinner than brand weight.
- **Ban: thin-line icon-set glyphs.** If a generated spot comes back thin or fussy, regenerate. The spot should look like it was drawn in three seconds with a fat marker by someone confident.

## Gradient variants

One per deck via `gradient_variant`; rotate across posts. `orange_indigo` (default), `teal_amber`, `fuchsia_blue`, `indigo_slate`, `rose_violet` — hexes in `brand/colors-exploration.json`. The gradient's `from` value is the accent everywhere (marks, arrows, checks, ring numbers). Never a second hue.

## System, not template

The archetype roster is a starting set, not a closed list. When a deck needs a layout the roster doesn't cover (tool comparison, screenshot + caption, logo grid…):

1. Write `renderMyType(slide, ctx)` in `generate.js` returning the slide's inner HTML — use `ctx.rng` + `craft.*` for every structural line so it stays in the hand language.
2. Add its CSS block to `buildHtml()`.
3. Register it in `RENDERERS`.

Keep the chassis: paper, grain, glaze dip, chrome top/foot, Fraunces + Inter + JetBrains Mono + Caveat, single accent. Everything inside is open.

## When to use vs other formats

| Format | Tool | When |
|---|---|---|
| **Carousel (this)** | this folder | Multi-slide narrative posts |
| Single info-card | `../info-card/` | Dense data / patterns in one image |
| Freeform thematic | `../../freeform/` | The visual metaphor IS the argument |
| Animation | `../../../animations/` | One beat that benefits from motion |
| Legacy carousel | `../../legacy/carousel/` | Explicit opt-in only |
