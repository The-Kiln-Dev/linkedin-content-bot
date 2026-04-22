# Legacy brand asset manifest

Assets available when composing **legacy-direction** posts — primarily carousels.

**Rules for me (Claude) when generating:**
- I have creative liberty over composition (which icon/doodle to pick, which slide layout, where to place supporting visuals).
- I have zero liberty to invent new brand elements. Flag gaps rather than draw them in code.
- Never pull assets from the `exploration/` folder into a legacy template without asking first.
- The "Patrick + photo" author attribution is legacy-only (cover and CTA slides).

---

## Logos

### `logos/kiln-mark-black.png` — 1500×1500
- 4-petal Kiln icon, solid black on transparent. Shared with exploration.
- **Typical use:** Top-left corner of content slides, ~64 px wide, beside "TheKiln" wordmark.

### `logos/kiln-lockup-black.png` — 338×80
- Full lockup: mark + "TheKiln" wordmark. Shared with exploration.
- **Typical use:** Top-left of cover, CTA, and content-slide footers.

---

## 3D illustrated icons *(pending upload — user to populate `icons-3d/`)*

The legacy carousel language relies heavily on saturated 3D illustrated icons as hero-scale supporting visuals. Typical placements: partially off-canvas corners of content slides, or as paired elements flanking a cover-slide headline.

Icons seen in the reference carousel (Slides 1–5, "4 ways to find more email addresses"):
- **Envelope** — email / deliverability
- **Rocket** — launch / speed / lift-off / growth
- **Trophy** — winning / best-in-class / competition / milestone

Additional icons likely to be part of the broader legacy library (visible on the Figma Brand Assets page — confirm which ship):
- Megaphone · heart · lightbulb · globe · magnifying glass · target · speech bubble · hourglass

Expected filenames once uploaded (lowercase kebab-case):
- `icons-3d/envelope.png`
- `icons-3d/rocket.png`
- `icons-3d/trophy.png`
- `icons-3d/megaphone.png`
- etc.

**Resolution target:** source PNGs at ≥ 600×600 (these often render at 200–400 px wide on slides; 3× headroom rule from `specs.md`).

### Per-icon topic mapping (to be filled in once files arrive)

| Icon | Good for | Avoid for |
|---|---|---|
| envelope | email / inbox / deliverability | non-email |
| rocket | launch / speed / growth / scaling | reflective / cautious posts |
| trophy | winning / best-of / competition | humble / exploratory |
| *(more TBD on upload)* | | |

---

## Doodles *(pending upload — user to populate `doodles/`)*

The legacy carousels use hand-drawn monoline doodles too, but sized larger (hero-scale, not corner accents) and in a slightly different vocabulary than exploration. Seen in the reference:
- **Large wavy blob** (cover slide, left side)
- **Angular square-spiral / labyrinth** (CTA slide, left side)
- **Curly squiggle** (CTA slide, right side)

These may overlap with the exploration doodle set or may be their own library — confirm on upload.

---

## People *(pending upload — user to populate `people/`)*

### `people/patrick.png` *(pending)*
- Patrick's LinkedIn profile photo, used in the top-right "Patrick + photo" author badge on cover and CTA slides.
- **Treatment:** ~64 px square with rounded corners (~12 px radius), shown beside the text "Patrick" in bold sans.
- **Source dims target:** ≥ 256×256 (for 3× headroom).

---

## Typography

- **Display / headlines:** bold, tight sans-serif (visible in the reference: very tight tracking, extrabold weight). Looks like **Inter ExtraBold** or a similar modern geometric sans. Specific face TBD.
- **Body:** clean sans, same family as display or a neutral grotesk. Likely Inter regular.
- **Distinct from exploration:** carousels do **not** use Lora / serif. If a post is in the legacy direction, the typography is all sans.

TODO: confirm exact font family by selecting a headline text layer in Figma.

---

## Layout patterns (from reference carousel)

### Cover slide
- White background
- Kiln lockup top-left
- "Patrick + photo" badge top-right
- Category label above headline (e.g., "TUTORIAL" in small caps, muted gray)
- Hero headline: 3–4 lines, very large, bold sans
- Black pill CTA button with white text and arrow ("Learn how →")
- Two hero-scale flanking visuals (doodle on one side, 3D icon on the other)

### Content slide (Step 1 / Step 2 / etc.)
- White background (top portion)
- "STEP N" label top-left (small caps, black, bold)
- Large headline, bold sans
- Short body paragraph (1–3 sentences)
- Supporting visual in the middle area: image, screenshot, tool-card row, or list
- 3D icons partially off-canvas in corners (often two, one each side)
- Cream footer strip at bottom: Kiln lockup left + "Next step →" right, thin divider line above

### CTA slide
- Same top pattern as cover (logo left, Patrick badge right)
- Category label (e.g., "NEED SUPPORT?")
- Hero headline
- Black pill CTA button ("Talk with us 👋")
- Flanking doodles left and right

---

## Open TODOs

1. User uploads 3D icon set into `icons-3d/` — envelope, rocket, trophy minimum; broader set preferred.
2. User uploads any legacy-specific doodles into `doodles/`.
3. User uploads `people/patrick.png`.
4. Confirm exact display font (likely Inter ExtraBold).
5. Once populated, update this manifest with per-file "good for / avoid for" tags — same format as the exploration manifest.
