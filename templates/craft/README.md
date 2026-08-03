# Craft kit — the shared hand

`craft.js` is the seeded hand-drawn SVG vocabulary behind every Ink & Kiln asset. The carousel and info-card generators require it directly; freeform compositions can copy the same patterns inline. One module = one consistent "hand" across every format.

## Principles

- **Seeded, never random.** All wobble comes from `rngFromString(seed)` (mulberry32). Same seed + args → identical render. Change the seed to re-roll a composition's wobble. Never `Math.random()`.
- **Two sources of hand-feel, composable:** point-jitter (subdivide + perpendicular offsets + Catmull-Rom smoothing) and SVG displacement filters (`rough-fine`, `rough-bold` from `roughDefs()`). Marks that get stretched (`preserveAspectRatio="none"` inline emphasis marks) must use `filter: null` — displacement doesn't survive non-uniform scaling.
- **Ink weight is confidence.** Structural strokes 4–7px at 1080-wide scale. Thin strokes read as clip-art; that's the failure mode this kit exists to kill.

## Vocabulary

| Function | Draws | Typical use |
|---|---|---|
| `handLine` | wobbly stroke (optional 2-pass marker) | dividers, rules, footer lines |
| `handArrow` | bowed shaft + open head | connecting ideas, pointing at CTAs |
| `handCircle` | self-crossing open loop | ringing numbers, circling words |
| `handUnderline` | 1–2 pass marker underline | emphasis under italic phrases |
| `handBox` | rectangle w/ corner overshoots | diagram nodes, stat cards, buttons |
| `handBracket` | square bracket | grouping rows |
| `handAsterisk` / `handStar` | marginalia marks | breathing accents, never confetti |
| `handCheck` | tick | list bullets |
| `markerHighlight` | fat translucent swipe | highlight behind text |
| `glazeDipPath` | wavy-edged band path | the glaze dip (clip-path for gradient + texture layers) |
| `grainCss()` | paper-grain data-URI | canvas texture (opacity ~0.2, multiply) |
| `roughDefs()` / `svg()` | filter defs / wrapper | plumbing |

## Palette contract

Consumers define CSS vars the kit strokes against: `--ink: #231F20`, `--accent` (gradient `from`), `--paper: #F5EFE2`, `--muted: #6B645A`. Ink for structure, accent for emphasis marks and arrows — one accent per asset, always.

## Restraint rules

- Max ~3 hand annotations per slide beyond structural lines (dividers/footer). More reads as scrapbook.
- Marks mean something: circle = "this number matters", arrow = "look here next", asterisk = margin breath. Never decorate for decoration's sake.
- Caveat hand-notes (`.hand-note`) are for one wry aside per deck, not captions.
