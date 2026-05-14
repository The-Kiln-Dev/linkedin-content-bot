# The Kiln — Legacy direction (cover animation)

Visual identity for animated LinkedIn content in the legacy brand direction. Source of truth for this composition; matches the static carousel cover at `templates/legacy/carousel/`.

## Palette

- Ink: `#000000` (text, CTA pill background)
- White: `#FFFFFF` (canvas)
- Cream: `#F5F4EB` (soft surfaces — not used on cover, but legacy default)
- Muted: `#6b6b6b` (secondary text, dividers)

No flat accent colors. Color enters only through illustration (3D icons).

## Typography

- Display / headlines: **Inter ExtraBold (800)**, tight tracking (-0.03em), 88px on a 1080-wide canvas.
- Category labels: Inter Bold (700), small caps, 0.18em letter-spacing, 20px.
- Body / metadata: Inter Regular (400) and Semibold (600).

## Composition

- Canvas: **1080×1350** (LinkedIn portrait carousel slide).
- Outer padding: 72px.
- Top bar: Kiln lockup left (52px tall), Patrick + photo badge right.
- Center stack: HOT TAKE category, hero headline (2–3 lines), pill CTA.
- Bottom flanks: doodle bottom-left (partially off-canvas), 3D icon bottom-right (partially off-canvas).

## Motion

**Editorial register, not playful.** Cover animations are for finance/agency posts — clean, formal, restrained. Do not use:
- `back.out` eases (overshoot reads as cartoonish)
- Scale animations on text or CTAs (reads as bouncy/3D)
- Rotation on entrances (reads as kinetic/youthful)
- Hand-drawn doodles as decoratives in animation (the squiggle vocabulary belongs to static carousels; in motion it reads as flashy)
- Off-canvas Fluent-3D icons (claymation feel is wrong register for serious posts)

Do use:
- Opacity fades as the primary entrance verb
- Small vertical translates (12–24px) only — never large slides
- `power2.out` / `power3.out` smooth eases
- Quiet ink-only decoratives (a horizontal rule, a thin divider) where the static slide had a flanking doodle/icon
- Generous hold time at the end (full layout visible for at least 50% of the duration)

Single scene, 5s total, 30fps. First animation offset 0.2s. All elements settled by ~2.4s. Remaining ~2.6s holds the layout.

## What NOT to do

- No em-dashes (`—`) anywhere in copy. User hard-rule.
- No gradient backgrounds on cover (that's exploration direction, not legacy).
- No exit animations — single scene.
- No new colors. If you need accent, use a 3D icon's intrinsic color, not a flat fill.
- No "leverage / unlock / synergy / revolutionize" vocab.
