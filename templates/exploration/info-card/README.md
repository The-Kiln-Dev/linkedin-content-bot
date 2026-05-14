# Info-card generator (exploration direction)

JSON-driven generator for a **single dense info-card** — one tall PNG built from numbered sections (stat grids, comparison tables, metrics rows). Sits alongside the carousel and animation pipelines as the third standard output format.

From repo root (deps installed once at root via `npm install`):

```
npm run render:info-card -- templates/exploration/info-card/inputs/outreach-cheatsheet.json
open templates/exploration/info-card/output/outreach-cheatsheet.png
```

## When to use this vs other formats

| Format | Tool | Output | When |
|---|---|---|---|
| Multi-slide deck | `../../legacy/carousel/` | 5–8 PNGs | Long-form narrative across slides |
| **Single info-card** | **this folder** | **1 tall PNG** | **Dense data / principles / patterns in one image** |
| Standalone motion | `../../../animations/` | GIF / MP4 | A single beat that benefits from motion |
| Single statement card | `../card-statement.html` | 1 square PNG (static prototype) | One headline, generous whitespace |

Info-cards are the right format when the post has **multiple short data points** that benefit from being readable at-once on feed scroll. If the content is one headline, use the statement card. If the content is a multi-slide narrative, use the carousel.

## Visual language

This generator implements the **exploration** direction per `../../../brand/brand-exploration.md`. It is not register-agnostic and the visual rules are not negotiable on a per-piece basis:

- **Gradient frame** (~50px) around the card, with the topographic texture tile from `brand/assets/exploration/texture-topographic.png` overlaid via `mix-blend-mode: multiply` at ~55% opacity.
- **Two-tone interior:** white top panel (logo + headline + subtitle) over a cream (`#F5F4EB`) body panel.
- **Fraunces serif** for headlines and section titles, with the **italic-emphasis move** on one key phrase, colored in the gradient's `from` value.
- **Inter sans** for body copy, column headers, and footer text.
- **Single accent color** throughout the interior — the gradient `from` value is reused for numbered-circle backgrounds, stat-card number outlines, the italic emphasis, and the impact column. No flat brand-accent fills on section backgrounds. Color discipline is enforced.
- **Small monoline doodle** in the bottom-right of the cream panel from `brand/assets/exploration/doodles/`.
- **Kiln lockup** top-left of the white panel. Author attribution badge (Patrick + photo) is **legacy-only** and never appears here.

## Gradient variants

Pick one of the 5 variants from `brand/colors-exploration.json` via the `gradient_variant` field. Default is `orange_indigo`.

| `gradient_variant` | From → To |
|---|---|
| `orange_indigo` | `#FB923C` → `#818CF8` |
| `teal_amber` | `#0F766E` → `#F59E0B` |
| `fuchsia_blue` | `#E879F9` → `#3B82F6` |
| `indigo_slate` | `#A5B4FC` → `#64748B` |
| `rose_violet` | `#FB7185` → `#A78BFA` |

Rotate across posts for variety. Never mix variants within one piece.

## Input schema

```jsonc
{
  "canvas": { "width": 1080, "height": 1350 },
  "gradient_variant": "orange_indigo",

  "header": {
    "title_roman": "LinkedIn outreach,",
    "title_italic": "2026 edition",            // colored with gradient.from
    "subtitle": "Patterns I keep seeing in the top 1% of campaigns."
  },

  "sections": [
    // ... 1 to 3 sections recommended (4 starts to crowd at 1080×1350)
  ],

  "doodle": "paper-airplane.png",              // any file from brand/assets/exploration/doodles/
  "footer": { "left": "Patrick Spychalski", "right": "thekiln.com" }
}
```

### Section types (v0)

Each section has a `number`, a roman+italic split title, and a type-specific body.

**`stat-grid`** — 2- or 4-column grid of white sub-cards on cream. Each card has a small outlined number, a bold title, and a body line with optional `<b>` emphasis (typically used to wrap a percentage or a number).

```jsonc
{
  "type": "stat-grid",
  "number": 1,
  "title_roman": "Principles that",
  "title_italic": "actually move the needle",
  "columns": 2,
  "items": [
    { "n": 1, "title": "Personalization > volume", "body": "ICP-specific copy lifted replies by <b>54.7%</b>." }
  ]
}
```

**`comparison-table`** — three-column table sized for `Label · Long example · Short impact`. Rows separated by hairline rules. The impact column is colored with the gradient accent and bolded.

```jsonc
{
  "type": "comparison-table",
  "number": 2,
  "title_roman": "Copy that",
  "title_italic": "actually gets replies",
  "columns": ["Format", "Example", "Lift"],
  "rows": [
    ["Trigger hook", "\"Noticed you're hiring SDRs — what's worked best?\"", "+18.2%"]
  ]
}
```

**`metrics-rows`** — three-column table sized for `Metric · Benchmark · Priority`. Rows separated by hairlines. Priority column is accented and bolded.

```jsonc
{
  "type": "metrics-rows",
  "number": 3,
  "title_roman": "Benchmarks",
  "title_italic": "to hold yourself to",
  "columns": ["Metric", "Top benchmark", "Priority"],
  "rows": [
    ["Acceptance rate", "40-55%", "High"]
  ]
}
```

## Layout rules (don't break)

- **Sections take their natural content height** with a fixed 28px gap between them, top-aligned in the cream panel. Leftover space sits at the bottom before the footer. Don't switch to `flex: 1` per section — that caused silent overflow + visible overlap between adjacent sections when content density varied.
- **`grid-auto-rows: minmax(118px, auto)`** on the stat grid sets a deterministic card height that the validator predicts against. Cards can grow taller if content forces it. Don't replace with `1fr`.
- **`overflow: hidden`** on each section is a safety net. If content somehow exceeds its predicted height, it clips inside the section rather than bleeding into the next one. The validator should catch this case first, but the safety net stays.
- **Single accent color rule.** Don't introduce a second hue for emphasis. If a row needs more weight, change its weight or size — don't reach for a green/red/etc.

## Content limits (validated at JSON load)

The generator runs `validateInput(input)` before rendering. It computes the predicted natural height of each section (deterministic, based on row/item counts) and fails fast with a clear error if the total exceeds the cream panel's available height. The error message includes:

- Total predicted content height (px)
- Total available height (px)
- Overshoot amount
- Per-section breakdown showing which section is heaviest
- A "fix" suggestion (reduce items, drop a section, split into two info-cards)

**Per-section soft limits** (these are caught explicitly with their own error, before the height math):

| Section type | Max items / rows | Reasonable column counts |
|---|---|---|
| `stat-grid` | 6 items | 2 (default) – 4 columns |
| `comparison-table` | 6 rows | fixed 3 columns |
| `metrics-rows` | 6 rows | fixed 3 columns |

**Even within the soft limits, the height math may still fail** — three full 6-item sections can't all fit. A typical fitting deck has 2 dense sections, or 3 with moderate density. If you hit the validator, the error message tells you exactly what to cut.

**Why fail-fast instead of render-and-clip:**

Earlier versions used `flex: 1` per section to force equal-share distribution. Content that exceeded its allotted third would visually overlap into the next section — silent, hard to diagnose, and breaks LinkedIn posts that ship with the artifact. The new approach: predict, validate, fail with actionable feedback before Puppeteer renders. The image you get out of a successful render is guaranteed to have no overlap.

## Known gaps (v0 → v1)

- Only 3 section types. The Expandi-style reference uses 7. Missing: `flow-pills` (vertical step chain), `icon-list` (small-icon rows), `people-grid` (headshot grid). Each new type needs corresponding entries in `LAYOUT` and `SECTION_LIMITS` so validation extends cleanly.
- Two worked examples: `outreach-cheatsheet.json` (3 sections, dense) and `not-everything-agentic.json` (2 sections, comfortable).
- All 5 gradient variants are wired but only `orange_indigo` and `teal_amber` are visually validated. Validate `fuchsia_blue`, `indigo_slate`, `rose_violet` before trusting them.
- Doodle slot is fixed bottom-right. If the last section's content lands very low in the cream panel, the doodle can crowd it — consider a `doodle_position` input later.
- Validator predictions are conservative (over-estimate by ~10-15%). Some borderline-valid decks may be rejected. If the math gets tighter over time, calibrate `LAYOUT.statGrid.cardHeight` and `LAYOUT.ctRow`/`mrRow` constants against actual rendered measurements.
