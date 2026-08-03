# Asset system redesign — August 2026

## Why (the diagnosis)

Reviewed every rendered output across carousel, info-card, freeform, and animations. The system is disciplined but reads as templated AI output. Root causes, ranked:

1. **One fixed skeleton for every asset.** Gradient frame → white/cream interior → lockup top-left → Fraunces title top-left → content center → footer. Every post, every slide, every format. The frame is a fence; the feed sees the same picture five times.
2. **Digital-perfect vector rendering.** Laser-straight lines, flat fills, pill badges, drop-shadow chips, default border radii. This is the exact visual vocabulary of mass-produced SaaS infographics, i.e. what every AI tool generates. Precision reads as machine.
3. **Dead space.** Carousel covers are ~70% blank white with a single thin-line icon floating in it.
4. **Thin-line generic icons.** The magnifying glass / node-triangle glyphs are clipart-grade and carry zero brand.
5. **Color timidity.** Color lives only in the border. Interiors are gray-on-cream.
6. **One typographic move at one scale.** Title top-left, italic accent word, done. No scale drama, no hierarchy play.
7. **The brand's best asset is demoted.** The thick-marker doodles (paper airplane, burst star) are the most human, most ownable thing in the repo, and they're used as 100px corner accents at 0.9 opacity.

## Directions considered

- **A. Ink & Kiln (hand-inked editorial studio).** Rebuild the language around evidence of a human hand: paper grain across the whole canvas, thick warm-ink hand-drawn structure (arrows, circles, underlines, wobbly rules), massive Fraunces scale drama, gradient reborn as a "glaze dip" edge instead of a uniform fence, marker spot-illustrations generated in the existing doodle style. Layout becomes an archetype roster, art-directed per slide.
- **B. Illustration-led.** Recraft custom-style hero illustrations as the canvas. Rejected as the lead: already tried in the freeform thread and it failed (decorative paintings, disconnected data); works only as a supporting element.
- **C. Motion-first.** Shift weight to GIFs. Rejected: doesn't fix the static formats where volume lives, and motion inherits whatever static language exists.
- **D. Screenshot/collage editorial.** Real UI screenshots, tape-and-paper collage. Strong for tool-specific posts but too narrow to be the system.

## Decision: A — "Ink & Kiln", with B and D folded in as supporting moves

The one thing AI-generated graphics cannot credibly fake is a human hand. The Kiln's name and the existing doodle library point the same direction. Identity continuity is kept (Fraunces + italic emphasis, cream, the 5 gradients, the lockup) — the *execution* changes.

### The five moves

1. **Paper, not panel.** Warm cream paper `#F6F3EA` with visible grain over the whole canvas. No white panel, no fence.
2. **Glaze dip, not frame.** The gradient + topographic texture survives as a *dipped edge* — one organic wavy-edged band per asset (like a pot dipped in glaze). Position and depth vary per slide; the deck's gradient stays constant. Recognizable, never identical.
3. **Ink structure.** Everything structural is hand-drawn: wobbly dividers, arrows, circles around numbers, marker underlines beneath the italic emphasis, brackets, asterisk marginalia. Implemented as seeded-random SVG paths through a rough displacement filter, so every render wobbles differently but deterministically per slide.
4. **Scale drama.** Fraunces gets a real display range (up to ~200px covers, ~300px stat numerals). Emphasis = italic + accent color + a hand-drawn mark, not just a color swap.
5. **Marker spot illustrations, never thin-line icons.** New concepts get a doodle generated in the existing brand-doodle style (Recraft custom style built from the 10 reference doodles, OpenAI gen-doodle as fallback). Thin-line glyphs are banned.

### System, not template

Slide archetypes (cover-poster, point, big-number, quote, list, diagram, cta) each carry their own composition. Every deck gets an art-direction pass: per-slide archetype + layout variant + annotation moves, declared in the input JSON. Two decks should never look like the same deck refilled.

## Scope of this change

- `templates/craft/` — shared kit: paper/ink/glaze CSS + seeded hand-drawn SVG vocabulary (JS)
- `templates/exploration/carousel/` — generator v2 on the craft kit, archetype roster
- `templates/exploration/info-card/` — restyled onto the craft kit (validator logic kept)
- `templates/freeform/design.md` — craft vocabulary folded into the non-negotiables
- `brand/brand-exploration.md`, `brand/README.md`, `CLAUDE.md`, `SKILL.md` — updated spec
- `templates/exploration/carousel/lib/gen-spot.js` — Recraft custom-style spot generator

Animations inherit the static language (paper + ink titles); motion register unchanged.
