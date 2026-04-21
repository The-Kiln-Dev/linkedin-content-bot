# The Kiln — Brand Exploration (v1 draft)

A newer visual direction being explored specifically for LinkedIn post templates. Not yet selected as the go-forward identity. The defining move: **saturated colored borders around tinted card backgrounds**, with 5 candidate palettes to rotate across posts.

Color values live in `colors-exploration.json` — edit there to change colors without touching this doc. Any of the 5 variants is valid; rotate across posts for variety.

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

Important revision from the earlier draft: the exploration **uses an italic serif for headlines**, not the bold sans-serif of the legacy direction. This is a meaningful typographic shift and distinguishes this direction clearly.

- **Display (headlines):** **Lora** (Google Font, serif). Used in both regular and italic — the italic is the signature move in headlines (e.g., "Email deliverability, *optimization*" sets "optimization" in italic for emphasis).
- **Logo wordmark:** clean sans (TBD — likely Inter or the same sans used in legacy).
- **Body:** clean sans, same as legacy.
- **Signature typographic move:** serif headline with a word or phrase in italic, set on a white panel, framed by a textured gradient border.

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
3. Confirm typography is identical to legacy (extract from a text layer to double-check).
4. Decide: is this direction LinkedIn-only, or is it the future site/brand direction too?
