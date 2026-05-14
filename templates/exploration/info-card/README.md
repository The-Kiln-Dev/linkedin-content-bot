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

- **`flex: 1` per section** — all sections share the cream panel's vertical space equally, so the card always fills the canvas regardless of content density. Don't switch to natural heights without checking how the slide looks at the LinkedIn display size.
- **`grid-auto-rows: 1fr`** on the stat grid keeps cards equal-height inside a section. Don't remove.
- **`justify-content: space-between`** on the comparison/metrics tables distributes rows across the section's allocated height. Don't remove.
- **Single accent color rule.** Don't introduce a second hue for emphasis. If a row needs more weight, change its weight or size — don't reach for a green/red/etc.

## Known gaps (v0 → v1)

- Only 3 section types. The Expandi-style reference uses 7. Missing: `flow-pills` (vertical step chain), `icon-list` (small-icon rows), `people-grid` (headshot grid).
- One worked example only (`outreach-cheatsheet.json`).
- All 5 gradient variants are wired but only `orange_indigo` is verified visually. Validate `teal_amber`, `fuchsia_blue`, etc., before trusting them.
- Doodle slot is fixed bottom-right. If the bottom section is dense, the doodle can crowd content — consider a `doodle_position` input later.
- No CI / lint. If a section's content overflows its `flex: 1` slot, it'll clip silently.
