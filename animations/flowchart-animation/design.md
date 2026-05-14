# The Kiln — Legacy direction (flowchart animation, standalone media)

**Standalone LinkedIn media, not a slide in a carousel.** GIFs and MP4 animations are their own format — they post as a single piece of media alongside Patrick's LinkedIn text caption. This means:

- No `STEP N` label (that's carousel chrome)
- No cream "Next step →" footer band (also carousel chrome)
- No body-text block sized like a carousel slide
- Self-contained: headline + kicker + visual centerpiece + a small Kiln brand mark in the corner
- The whole story has to read in one frame — the GIF is the deliverable, not a step in a sequence

Same legacy brand DNA otherwise (palette, type, motion register).

## Palette

- Ink: `#000000`
- White: `#FFFFFF` (canvas)
- Cream: `#F5F4EB` (footer band)
- Muted: `#6b6b6b` (sub-labels, dividers)
- Hairline: `#e5e5e0` (card borders, divider above footer)

## Typography

- Headline: Inter ExtraBold (800), 78px, -0.03em tracking, 1–2 lines (bigger than carousel — this is the hero of the GIF, not a section header)
- Kicker (subtitle under headline): Inter Medium (500), 26px, 1.4 line-height, muted ink, max 780px
- Node number (small ordinal at top of each card): Inter Semibold (600), 16px, 0.14em letter-spacing, muted
- Node label: Inter ExtraBold (800), 28px, ink
- Node sub: Inter Regular (400), 18px, muted ink

## Composition

Canvas: 1080×1350 (LinkedIn vertical media format). Padding 80px sides / 96px top / 80px bottom.

Layout (top to bottom):
- Headline + kicker at top — the hook
- Flowchart centered vertically in the remaining space — the visual centerpiece (4 nodes + 3 arrows in a horizontal row)
- Small Kiln lockup as a brand watermark in the bottom-right corner (~30px tall, 70% opacity)

Each node is a clean white rounded card with a thin hairline border and subtle shadow. **No 3D icons inside the card** — replaced with a small editorial ordinal (`01`, `02`, `03`, `04`) at the top of each card, in muted small-caps. Card content: ordinal → label → sub.

## Motion

**Editorial register only.** Same hard-rules as the cover animation:
- No `back.out` eases (no overshoot)
- No scale on text or CTAs
- No rotation on entrances
- No Fluent-3D claymation icons in motion
- No hand-drawn doodles in motion

Sequential reveal (this is the whole point of an animated flowchart — show the flow building):
1. Header fades in (step label, headline, body — staggered)
2. Each node fades in + 12px slide-up (`power3.out`, 0.5s)
3. Each arrow extends horizontally from the prior node (`scaleX` from 0 with `transform-origin: left center`, `power2.out`, 0.45s). The very slight squash distortion during a 0.45s tween reads as "extending toward the next node" — conveys flow direction without overshooting.
4. Node → arrow → node → arrow → node → arrow → node ordering. Beat: ~0.35s per element.
5. Footer fades in last (lockup + "Next step →")
6. Hold the full layout for at least 2.5s before loop end

Total duration: 7 seconds, 30fps.

## What NOT to do

- No em-dashes in copy.
- No 3D icons in the nodes (claymation = wrong register for editorial motion).
- No hand-drawn doodles in the background.
- No simultaneous reveal of all nodes — must be sequential to convey flow.
- No exits.
