# Exploration carousel generator

JSON-driven multi-slide PNG generator for LinkedIn carousels — the **default carousel direction** for the repo. Renders cover/content/CTA slides at 1080×1350 using the exploration visual language: gradient frame, topographic texture, Fraunces italic-emphasis headlines, two-tone white/cream interior, single-accent discipline, small monoline doodles.

From repo root (deps installed once at root via `npm install`):

```
npm run render:carousel -- templates/exploration/carousel/inputs/sample-outbound.json
open templates/exploration/carousel/output/sample-outbound/*.png
```

Or directly:

```
node templates/exploration/carousel/generate.js templates/exploration/carousel/inputs/sample-outbound.json
```

Either form works — the generator resolves input paths from your current working directory.

## System, not template

**This generator ships three slide types — cover, content, CTA — as a starting set, not a closed list.** Different decks have different content shapes, and the right move is often to add a new slide-type renderer rather than forcing content into one of the existing three.

Cases where you'd add a new slide type:
- **Tool comparison** → `comparison-2up` (logos + stat rows side-by-side)
- **Workflow / process** → `flowchart` (steps connected by arrows, on cream)
- **Pull quote** → `quote` (full-bleed Fraunces italic statement)
- **Screenshot + caption** → `screenshot` (real product capture with subtitle below)
- **Tools used** → `logo-grid` (named tool cards in a grid)
- **Big stat** → `stat-hero` (one giant accent-colored number with a one-line story)

The shared chassis (gradient frame, Fraunces, cream/white panels, italic-emphasis, single-accent color) holds the deck together visually. The layout-per-slide is open.

**How to add a slide type:**

1. Write a `renderMyType(slide, ctx)` function in `generate.js` that returns the slide's inner HTML.
2. Add a CSS block for the new type to the inline `<style>` in `buildHtml()`.
3. Add a `case 'my-type':` branch in `renderSlide()`.
4. Use it in an input JSON: `{ "type": "my-type", ... }`.

That's it. The renderer is intentionally small per type so new types are cheap to add.

## When to use vs other formats

| Format | Tool | Output | When |
|---|---|---|---|
| **Carousel (default)** | **this folder** | **5–7 PNGs (1080×1350)** | **Multi-slide narrative posts** |
| Carousel (legacy direction) | `../../legacy/carousel/` | Same | Editorial b&w + 3D icons treatment. Use when the deck wants the cleaner editorial register. |
| Single info-card | `../info-card/` | 1 tall PNG | Dense data / patterns / principles in one feed-readable image. |
| Standalone motion | `../../../animations/` | GIF / MP4 | One beat that benefits from motion. |

## Visual language (don't break)

Per `../../../brand/brand-exploration.md`:

- **Gradient frame** (~50px) with topographic texture overlaid via `mix-blend-mode: multiply` at ~55%. Texture asset: `brand/assets/exploration/texture-topographic.png`.
- **Two-tone interior:** white top-panel (logo + step label) over a cream body panel. Some slide types (cover, CTA) use white throughout.
- **Fraunces serif** for all headlines and titles, with **italic-emphasis on one key phrase** colored in the gradient `from` value. This is the signature voice move.
- **Inter sans** for body, step labels, footer, button text.
- **Single accent color** throughout the interior — only the gradient `from` value is reused (numbered circles, italic emphasis, button hover states). No second hue for emphasis.
- **Kiln lockup top-left** of every slide. The "Patrick + photo" badge is **legacy-only** and never appears here.
- **Small monoline doodles** as supporting visuals — from `brand/assets/exploration/doodles/` (curated inventory) or `generated/<deck-name>/` (AI-generated, per-deck). Both use `mix-blend-mode: multiply` to blend cleanly onto cream.
- **Doodle placement on content slides.** The doodle is **vertically centered in the cream space between the bottom of the body paragraph and the bottom of the cream panel** — not pinned just below the body. Implemented via `flex: 1` + `align-items: center` on `.content-visual`. Don't switch to a fixed `margin-top` — it pulls the doodle toward the upper-middle of the slide and reads as a mid-slide orphan.
- **Page indicator** (`02 / 05`) in the footer of every slide so the swipe sequence is obvious.

## Gradient variants

Pick one variant per deck from `brand/colors-exploration.json` via `gradient_variant`. Default `orange_indigo`.

| Variant | From → To |
|---|---|
| `orange_indigo` | `#FB923C` → `#818CF8` |
| `teal_amber` | `#0F766E` → `#F59E0B` |
| `fuchsia_blue` | `#E879F9` → `#3B82F6` |
| `indigo_slate` | `#A5B4FC` → `#64748B` |
| `rose_violet` | `#FB7185` → `#A78BFA` |

Rotate across posts for variety. Never mix variants within one deck.

## Input schema

```jsonc
{
  "deck_name": "sample-outbound",
  "canvas": { "width": 1080, "height": 1350 },
  "gradient_variant": "orange_indigo",
  "author": "Patrick Spychalski",
  "slides": [
    { "type": "cover",   "category": "GUIDE",   "title_roman": "...", "title_italic": "...", "subtitle": "...", "doodle": "..." },
    { "type": "content", "step_label": "SHIFT 1", "title_roman": "...", "title_italic": "...", "body": "...", "doodle": "..." },
    { "type": "cta",     "title_roman": "...", "title_italic": "...", "subtitle": "...", "button_text": "Book a chat →", "doodle": "..." }
  ]
}
```

### Doodle paths

`doodle` resolves in two locations, in order:

1. **Brand inventory:** `brand/assets/exploration/doodles/<name>` — e.g. `"envelope.png"`. Use for generic concepts the brand library already covers.
2. **Per-deck generated:** `generated/<deck-name>/<name>.png` — e.g. `"generated/sample-outbound/handshake.png"`. Use for concept-specific doodles generated via `lib/gen-doodle.js`.

## Generating per-deck doodles

For decks where the brand inventory doesn't have a doodle that matches a slide's content (e.g. "warm intros" needs a handshake, not an envelope), generate one via gpt-image-1 using the existing brand doodles as style references:

```
# requires OPENAI_API_KEY in .env at repo root
node lib/gen-doodle.js \
  --concept "two clasped hands forming a handshake icon" \
  --out generated/sample-outbound/handshake.png
```

The prompt automatically prefixes a style preamble that enforces monoline / single-stroke / wobbly / black-on-white / no-fill / pure-line constraints. All 10 brand doodles are passed as reference images by default.

Cost: ~$0.17 per high-quality 1024×1024 generation. Generated outputs land in `generated/<deck-name>/` and are committed alongside the deck so re-renders are stable.

**Style drift caveat:** AI-generated doodles tend to come out slightly cleaner / more icon-set-y than the existing brand inventory (which is wobblier / more napkin-sketch). If you're mixing generated and brand-inventory doodles within one deck, expect a small style discontinuity. To minimize: regenerate with a wobblier-style prompt ("uneven stroke width, hand-drawn imperfections, drawn quickly with a felt-tip marker"), or pick all doodles from one source.

## Worked example

`inputs/sample-outbound.json` → 5-slide deck on outbound-in-2026 patterns. Uses all three slide types and three AI-generated doodles (handshake / lightning-bolt / sequence-dots). Re-render:

```
node generate.js inputs/sample-outbound.json
```

Output in `output/sample-outbound/`.
