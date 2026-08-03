# The Kiln — Brand Exploration (v1 draft)

A newer visual direction being explored specifically for LinkedIn post templates. Not yet selected as the go-forward identity. The defining move: **saturated colored borders around tinted card backgrounds**, with 5 candidate palettes to rotate across posts.

Color values live in `colors-exploration.json` — edit there to change colors without touching this doc. Any of the 5 variants is valid; rotate across posts for variety.


> **v2 (August 2026): "Ink & Kiln" execution — current for all generated assets.**
> The identity below (Fraunces + italic emphasis, the 5 gradients, cream, the lockup) is unchanged, but the *execution* evolved. Generated assets no longer use the uniform gradient frame + white/cream panel. Current spec:
>
> - **Paper, not panel.** Warm cream paper `#F5EFE2` with visible grain across the whole canvas. Ink is warm near-black `#231F20` (matches the doodles), muted text `#6B645A`.
> - **Glaze dip, not frame.** The gradient + topographic texture survives as one wavy-edged dipped band per asset (like a pot dipped in glaze) — deep on covers/CTAs, slim elsewhere; edge position varies, the deck's gradient stays constant.
> - **Ink structure.** Dividers, arrows, circles, underlines, boxes, checks are hand-drawn (seeded wobble via `templates/craft/craft.js`). Italic emphasis = italic + a hand mark (marker underline / circle / highlight swipe), not just a color swap.
> - **Scale drama.** Fraunces display range up to ~156px titles and ~300px stat numerals. JetBrains Mono for kickers and page counts, Caveat for rare handwritten asides.
> - **Marker spots, never thin-line icons.** Concept illustrations are thick-marker doodles: brand inventory or Recraft custom style (`brand/recraft-style.json`) via `templates/exploration/carousel/lib/gen-spot.js`.
> - **Archetypes, not one skeleton.** Slide/section layout varies by what the content is (see `templates/exploration/carousel/README.md`).
>
> The sections below document the v1 exploration language (gradient frame, two-tone interior). They remain accurate for identity (type, color tokens, texture asset) and for any Figma work still on v1 — but generators follow the v2 spec.

---

## Identity

(Same as legacy — identity doesn't change between the two.)

- **Name:** The Kiln
- **Primary tagline:** A Clay Agency
- **Descriptive tagline:** Expert GTM Engineers, at your fingertips
- **Brand promise line:** "Create systems that allow you to sell, not prepare to sell"
- **Three service pillars:** Sales/GTM automation · Marketing/Growth · RevOps

## Logo

Same lockups as legacy. On exploration templates the logo appears small in the top-left of each card, paired with a small gradient square or hand-drawn accent.

## Color

The core move is a **gradient frame around a two-tone interior card:**

- **Frame:** a wide (~30–40px) 2-color gradient border with a subtle topographic / maze-like line pattern overlaid at low opacity. Example confirmed: warm orange → cool periwinkle.
- **Interior top:** white, holding the logo (top-left) and headline.
- **Interior bottom:** cream (`#F5F4EB`), holding a small hand-drawn illustration accent.
- **Companion element:** a square gradient tile using the same gradient + texture, used as a standalone accent or alongside the card.

All 5 variants are 2-color linear gradients built from **Tailwind default colors** (tokens are the source of truth). See `colors-exploration.json` for exact values.

| Variant | From → To |
|---|---|
| `orange_indigo` | `orange-400` → `indigo-400` |
| `teal_amber` | `teal-700` → `amber-500` |
| `fuchsia_blue` | `fuchsia-400` → `blue-500` |
| `indigo_slate` | `indigo-300` → `slate-500` |
| `rose_violet` | `rose-400` → `violet-400` |

The texture pattern (`brand/assets/texture-topographic.png`) is a **seamless tile** applied on top of the gradient at low opacity. On a bordered card, the pattern is **tiled 4x**. On a standalone gradient tile, a single instance of the pattern is used.

## Typography

The exploration **uses an italic serif for headlines**, not the bold sans-serif of the legacy direction. This is a meaningful typographic shift and distinguishes this direction clearly.

### Display — Fraunces

- **Family:** Fraunces (variable serif)
- **Foundry:** Undercase Type — Phaedra Charles & Flavia Zimbardi
- **License:** SIL Open Font License 1.1 (free for commercial use)
- **Source:** https://fonts.google.com/specimen/Fraunces
- **GitHub / TTFs:** https://github.com/undercasetype/Fraunces

Earlier drafts used Lora, but Lora reads too literary/research-y for the brand voice we want ("high-ticket, put together, formal, but tech-forward"). Fraunces gives the same italic-emphasis move with a more contemporary, less editorial feel — letterforms have subtle calligraphic flourishes (lowercase `g`, `e`, the leg of `r`) that read modern, not old-style.

**Variable axes used:**

| Axis | Range used | Notes |
|---|---|---|
| `wght` | 400–700 | 500 for most headlines, 600 for emphasized italic |
| `opsz` | 9–144 | Optical size — letters tighten and gain weight at large display sizes automatically |
| `ital` | 0 / 1 | The signature emphasis move |
| `SOFT` | 30–100 | Higher = more contemporary, less classical. Use 60+ to avoid the editorial Lora/Garamond feel. |

**Loading from Google Fonts:**

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..700,30..100;1,9..144,400..700,30..100&display=swap" />
```

**To force the soft/contemporary cut in CSS** (some renderers ignore custom axes by default):

```css
.headline {
  font-family: "Fraunces", Georgia, serif;
  font-variation-settings: "SOFT" 80, "opsz" 96;
}
```

### Body — Inter

- **Family:** Inter (variable sans)
- **License:** SIL OFL · free for commercial use
- **Source:** https://fonts.google.com/specimen/Inter
- **Weights used:** 400 / 500 / 600 / 700

### Mono — JetBrains Mono

- Used only for kickers, status pills, frame indicators, micro-labels. Never for body or headlines.
- **Source:** https://fonts.google.com/specimen/JetBrains+Mono

### The signature typographic move

Roman Fraunces 500 with one or two words set in italic (`ital=1`, same weight, slightly heavier optical-size). Italic is colored with the brand accent — never gray, never resized. The italic carries the brand voice; the roman carries the message.

Examples in production usage (landing-page mock):

- "applied with *research-grade rigor*"
- "Trusted by *leading* companies"
- "From *640+ hours* of manual work…"
- "Make your data *actually* usable."
- "Get in touch today to *level-up* your processes."

Italic emphasis is set on a white or near-white panel, framed by either a textured gradient border (LinkedIn cards) or surrounded by airy painterly washes (web).

### Logo wordmark

Currently using the existing `kiln-lockup-black.png`. Not Fraunces — the wordmark is its own bespoke shape and shouldn't be re-rendered as system text.

## Illustration & imagery

Explorations lean on:
- **Small hand-drawn accents** (same loose monoline style as legacy) — stars, paper airplanes, squiggles tucked into card corners.
- **Gradient tiles** — small square gradients in the accent palette of the card, used as a visual break or motif.

**Notably fewer 3D icons and cityscapes** in this direction — it's cleaner and more type-forward than legacy. If mixing, use exploration layouts with legacy-style 3D icons sparingly; don't default to combining them.

## Layout & composition

- **Bordered tinted card** is the dominant format. ~4–8px border, matching pale tint inside.
- Logo + secondary element (gradient tile or hand-drawn icon) in the top row.
- Single headline or short body dominates the card.
- Generous whitespace.
- Left-aligned. Bottom-right for small accent marks (star, airplane).

Formats already templated in Figma for this direction:
- Horizontal banner (top strip with logo + tagline)
- Square "statement" card (big headline, pale background, bordered)
- Square "takeaway" card (short line + hand-drawn illustration)
- Horizontal icon-row strip (hand-drawn icons as divider)
- Gradient tile (standalone or as companion accent)

## Voice surfaces

Same as legacy — no voice change tied to the visual exploration.

## Reference

- Figma (Brand Exploration — Patrick Copy): https://www.figma.com/design/yHTNZOSsTFPMHx7tew8QaM/Brand-Exploration--Patrick-Copy-
  - Main explorations — `node-id=22-2`

## Open TODOs

1. Extract exact hex values for all 5 variants → `colors-exploration.json`.
2. Extract exact border width + corner radius specs from a card.
3. ~~Confirm typography is identical to legacy.~~ Resolved: typography intentionally diverges. Exploration = Fraunces (with italic emphasis); legacy uses its own bold sans. Decision documented in the Typography section above.
4. Decide: is this direction LinkedIn-only, or is it the future site/brand direction too?
5. Decide whether the carousel renderer should switch from Lora to Fraunces for exploration-direction templates (currently still references Lora — see `templates/legacy/carousel/`). Doing this would make the carousel match the website mock at `kiln-landing-mock/`.
