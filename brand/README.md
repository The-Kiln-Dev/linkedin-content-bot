# Kiln Brand — Files in this folder

Two parallel visual directions. Pick one when generating an asset.

| File | Purpose |
|---|---|
| `brand-legacy.md` | Current live identity (what thekiln.com uses). Editorial b&w + colorful illustrations. |
| `brand-exploration.md` | New direction being tested for LinkedIn. Saturated borders + tinted cards in 5 color variants. |
| `colors-legacy.json` | Hex values for legacy. Edit this file to update legacy colors. |
| `colors-exploration.json` | Hex values for exploration (all 5 variants). Edit this file to update exploration colors. |
| `logos/` | Logo SVGs (TODO — not yet populated). |
| `reference/` | Screenshots of canonical brand moments. |
| `assets/` | Reusable illustration assets (3D icons, hand-drawn elements). |

## How to change a color

Edit the relevant `colors-*.json` — templates read from there. You do not need to touch the `.md` files to change color values.

## How to pick which direction to use

When generating a post asset, specify `legacy` or `exploration`. Default is TBD — we'll pick a default once the exploration direction is decided on.
