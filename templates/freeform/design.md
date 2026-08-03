# The Kiln — freeform composition system

A HyperFrames project used as a **static card renderer** for LinkedIn posts where the visual itself carries the argument. The graphic IS the canvas: the structure is dictated by a metaphor or diagram, and every other element anchors to that structure.

This complements `templates/exploration/info-card/`, which is the right tool when content is genuinely tabular (3 principles, cheat sheet, comparison rows).

---

## When to use freeform vs the info-card generator

The ideation skill (`ideation/SKILL.md`) classifies each idea as **`tabular`** or **`thematic`**. Route accordingly.

| Use the info-card generator (tabular) when… | Use freeform (thematic) when… |
|---|---|
| Content is genuinely a list of N principles, rows of comparisons, or a cheat sheet | Content has a visual metaphor that conveys the argument (plumbing → pipes, iceberg → depth, wall → barrier, hub → control center, chart → growth-over-time) |
| Speed matters and you don't want to source assets per post | The composition's layout IS the argument — moving labels around defeats the point |
| Voice is "here's a clean list" | Voice is "here's a thing you have to see" |

**Default heuristic:** if the post's title/hook contains a concrete physical thing (wall, iceberg, ladder, map, river, factory, foundation, ceiling, bridge, gate), it's probably thematic. If the post is "N tips for X" or "M things I learned", it's tabular.

---

## Non-negotiables (the rules this thread settled)

These apply to every freeform composition. Skipping any of them re-introduces the failure modes we worked through.

### 1. The Kiln brand stays in place

Do **not** copy other creators' aesthetics wholesale (dark space backgrounds, bold sans-serif titles, etc.). Adapt structural patterns from elsewhere, but always render in the Kiln's exploration brand:

- **Warm paper canvas** `#F5EFE2` with grain (v2 "Ink & Kiln" — see the v2 note atop `brand/brand-exploration.md`; the earlier cream `#F5F4EB` + full gradient frame is superseded)
- **Glaze dip instead of frame**: one wavy-edged gradient band (`linear-gradient(115deg, var(--grad-from), var(--grad-to))` + topographic texture at `mix-blend-mode: multiply, opacity 0.5`), clipped by a `glazeDipPath`-style wavy path — top edge by default, slim (~34px) so it never crowds the diagram
- **Fraunces serif** for headlines, with `font-style: italic` emphasis on the key phrase, colored in `--grad-from` (brand orange `#FB923C`)
- **Inter** for body, labels, and chart text (400/500/600/700/800 as needed)
- **Single accent color discipline** — the gradient's `from` value is the accent everywhere (numbered badges, italic emphasis, key axis ticks, callout fills). Don't introduce a second hue for emphasis.
- The 5 gradient variants live in `brand/colors-exploration.json`. Default for thematic cards: `orange_indigo`.

### 2. No chrome

These elements add no value and create noise. Do not include them:

- ❌ **Eyebrow** (e.g., "Patrick's take · CRM strategy") — title carries the framing
- ❌ **Meta-badge** in the top-right (e.g., "Field Notes · 2026") — the Kiln lockup is enough
- ❌ **"My Rule" / verdict bar** at the bottom — the visual should carry the conclusion; if it can't, the visual isn't doing its job
- ❌ **"Illustration · Recraft" credit** — readers don't care, and it cheapens the design
- ❌ **Patronizing captions** ("Small things grow on this side. Big things live on the other.") — the visual should speak for itself

Keep only what's necessary: Kiln lockup, title, subtitle, the diagram itself, footer with author + URL.

### 3. The graphic IS the canvas

The post isn't "title + image + caption + logos in a box." The whole composition is a single visual where every element is part of the same diagram. There's no separation between the "illustration" and the "data" — they're one thing.

Failed pattern (what we tried first):
- Generate a Recraft landscape painting
- Put it inside a card with a logo box below it
- Result: the painting was decorative, the logos were disconnected, the metaphor was literal not structural

Successful pattern (what landed):
- Build a diagram in SVG where the geometry itself is the metaphor
- Place every text label, logo, axis annotation as a child element of that SVG, anchored to its coordinate system
- Result: title, axes, lines, logos, wall, and callouts are all part of the same object

### 4. Structured placement — every element anchored to SVG coordinates

This is the core technique. **Never** position with HTML percentages (`bottom: 22%; left: 50%`) — those have no relationship to the underlying diagram and drift as soon as content changes. Instead:

1. Build the diagram in SVG with explicit coordinates
2. Use SVG `<text>`, `<image>`, and `<g transform="translate(x,y)">` to place every label, logo, and annotation
3. Every coordinate is computed from the same origin

For shapes with a **constant width** (rectangles, single circles where you only care about vertical centering), hardcoding coordinates is fine.

For shapes with **width that varies with Y** — circles (text inside, not just on top), lens/Venn regions, trapezoids, sectors, polygons — **use `lib/layout.js`**. Hand-placing text inside these shapes always fails because the shape's width varies by row. The library models each shape (`Circle`, `Pocket`, `Intersection`, `Trapezoid`, `Rect`, `Sector`), computes `boundsAtY(y) → {left, right, center, width}` for each row, places text at the row's true centroid via `placeText()`, and validates that the rendered bounding box fits via `validate()`. See "The layout library" section below for the API.

When you change the plot area's left edge from `x=130` to `x=230`, you have to update every downstream coordinate (X ticks, line endpoints, wall position, logo cluster positions, legend x). That's correct — the cascade reflects the structural relationship. Geometry constants are best defined at the top of the inline script as JS variables (`const X_TICKS = [230, 408, 585, 763, 940]`) so a single edit moves the whole chart.

### 5. Aspect ratio match (no letterboxing)

The SVG `viewBox` aspect ratio should match the `.chart-wrap` container's aspect ratio. If the container is ~892×880 (after title/footer eat the height), the viewBox should be roughly `0 0 980 880` — not `0 0 980 540`. Otherwise `preserveAspectRatio="xMidYMid meet"` letterboxes the diagram into a small horizontal strip with wasted vertical space.

Roughly: container height = card interior height − (top bar + title block + footer). For a Kiln 1080×1350 card, that's typically 1186 − ~340 = ~840px of chart height with ~890px of width.

### 6. Verify all text fits inside the viewBox AND inside its containing shape

Two distinct failure modes:

**(a) Text clipped by the viewBox.** Y-axis labels right-aligned to a small X coordinate extend leftward outside the viewBox and get clipped. Before snapshotting, compute the leftmost render position of the longest label:

```
leftmost_x = label_x_position − (label_width_at_font_size)
```

For 14px Inter, "Hierarchy + custom objects" is ~195px wide. If labels end at `x=120`, longest extends to `x=−75` — clipped. Either shift the plot area right (usually correct), increase the viewBox width, wrap labels across multiple lines via `<tspan>`, or shorten labels (last resort).

**(b) Text inside a non-rectangular shape overflows the shape's edge.** Even if the text fits in the viewBox, it can still overflow a circle, lens, or trapezoid because those shapes have width that varies by Y. A text element anchored at `x=180` with `text-anchor="middle"` and width 130 spans `x=115 → x=245`. If the containing circle only spans `x=134 → x=566` at that Y, the text leaks past the left edge by 19px.

**Use `lib/layout.js` for all text inside non-rectangular shapes.** It computes the correct centroid per row and runs a validation pass that prints any overflows to the browser console. See "The layout library" section below.

### 7. The craft layer — hand-drawn ink over precise geometry

The diagram's DATA stays precise (chart lines, axis positions, plotted points — accuracy is the argument). The CHROME around it goes hand-drawn, using the same vocabulary as the other generators (`templates/craft/craft.js` — port the patterns inline, it's plain SVG):

- Annotation arrows and callout pointers → wobbly `handArrow`-style paths in the accent color, not straight lines with `marker-end`
- Circles around the key data point → `handCircle` open loops, not perfect `<circle>` outlines
- The italic emphasis phrase in the title → marker underline or highlight swipe
- Dividers and the footer rule → jittered `handLine`, not `<line>`
- Grain overlay on the paper, ink `#231F20`, muted `#6B645A`

Rule of thumb: if a stroke *carries data*, keep it clean. If a stroke *points at, frames, or emphasizes* data, draw it by hand. Cap hand annotations at ~3 per composition.

### 8. Think about the concept before placing text

The text in the diagram has to actually mean something. Made-up labels like "Apex" or "Edge cases" at the top of a capability pyramid don't describe a real capability — they're filler that breaks the reader's trust in the diagram.

Before writing layer/axis labels, ask: **does this label name an actual thing the reader would recognize?** For CRM capability tiers, "Hierarchy + custom objects" is real. "Apex" is not. For company stages, "Series B" is real. "Cracks" or "Stretch" as eyebrows ABOVE a real label are okay if they describe the meta-state, but the primary label has to be concrete.

---

## The geometry-first principle (works for ANY metaphor)

Charts work because their geometry is universal — X and Y axes give every text element a natural anchor. The same discipline applies to any visual metaphor, but you have to **construct** the geometry first.

| Metaphor | Geometry to define first | What anchors to it |
|---|---|---|
| **Chart / line graph** (series-b-wall) | X-axis ticks, Y-axis tiers, plot bounds | Lines, gridlines, labels, logos, annotations, legend |
| **Pyramid** | Each layer's trapezoid polygon (4 vertices + centroid) | Layer titles at centroids, side logos at trapezoid edges, axis labels at apex/base |
| **Iceberg** | Iceberg silhouette path + waterline Y + depth scale | Items placed at specific depths, width constrained by iceberg's width at that depth |
| **Wall (literal)** | Wall position (X), wall height, ground on each side | Items on left/right at specific X distances, height of items relative to wall |
| **Staircase** | Each step's (X, Y, width, height) | Step labels at step centroids, items at specific steps, axis arrows |
| **Org chart / tree** | Node positions + edges between nodes | Person/role at each node, hierarchy labels at branch points |
| **Map** | Geographic outline + pin positions (lat/lon → x/y) | Logos at pin positions, region labels at country centroids |
| **Cross-section / blueprint** | Floor lines (Y) + structural columns (X) | Each floor labeled, items at each floor's centerline |
| **River / flow** | Path of the river + tributaries + waypoints | Logos at confluence points, stage labels at bends |

The workflow is the same regardless of metaphor:

1. Sketch the geometry on paper (or mentally): what are the structural elements, where are the anchor points?
2. Build the geometry in SVG with explicit coordinates (polygons, paths, circles, lines)
3. **For shapes with width that varies by Y (circle, lens, trapezoid, sector, polygon): use `lib/layout.js`** to place text inside them. Don't hand-compute centroids per row — the library does it correctly.
4. For shapes with constant width (rectangle), place text directly with SVG coordinates.
5. Always call `Layout.validate()` at the end to catch any overflows before the snapshot.

---

## The layout library (`lib/layout.js`)

**The problem it solves:** hand-placing text inside non-rectangular shapes always fails because the shape's width varies by Y. A text element anchored at `x=180` with `text-anchor="middle"` and width 130 spans `x=115 → x=245`. If the containing circle's chord at that Y only spans `x=134 → x=566`, the text leaks past the left edge by 19px. This is a category error, not a typo — it happens every time hand-placement is used inside a curved boundary.

**The solution:** model each shape, compute its bounds at each row of text, place text at the row's true centroid, validate after placement.

### API

Include the library: `<script src="lib/layout.js"></script>` in `<head>`. Use it from an IIFE'd `<script>` at the end of `<body>`:

```html
<script>
(function () {
  'use strict';
  var SVG = document.getElementById('stage');

  // Define geometry — single source of truth for the diagram
  var leftCircle  = new Layout.Circle(350, 470, 235);
  var rightCircle = new Layout.Circle(630, 470, 235);
  var leftPocket  = new Layout.Pocket(leftCircle, [rightCircle]);
  var rightPocket = new Layout.Pocket(rightCircle, [leftCircle]);
  var lens        = new Layout.Intersection(leftCircle, rightCircle);

  // Place text in each region. Each line lands at its row's true center.
  Layout.placeText(SVG, leftPocket, [
    'Tech-stack lookups', 'Bulk enrichment', 'CRM write-back', 'High-volume scoring',
  ], { centerY: 440, lineHeight: 32, fontSize: 14, fontWeight: 700, label: 'leftPocket-workflows' });

  // Run validation — logs any overflows to browser console
  Layout.validate();

  // HF contract
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = gsap.timeline({ paused: true });
})();
</script>
```

### Shapes supported

- **`Circle(cx, cy, r)`** — single circle
- **`Pocket(inside, outsideArr)`** — inside one shape, outside zero or more others (e.g., left lobe of a Venn = `Pocket(leftCircle, [rightCircle])`)
- **`Intersection(...shapes)`** — inside ALL shapes (e.g., the Venn lens = `Intersection(leftCircle, rightCircle)`)
- **`Trapezoid({ topY, botY, topLeftX, topRightX, botLeftX, botRightX })`** — pyramid layers
- **`Rect(x, y, w, h)`** — for completeness
- **`Sector(cx, cy, r, a1, a2)`** — pie slice / radial wedge

### Functions

- **`placeText(svgRoot, shape, lines, opts)`** — creates SVG `<text>` elements for each line, anchored at the shape's centroid for that row. Returns array of created elements. Options: `centerY`, `lineHeight`, `padding`, `fontFamily`, `fontSize`, `fontWeight`, `textAnchor`, `fill`, `letterSpacing`, `group`, `label`.
- **`placeLine(svgRoot, shape, line, opts)`** — single-line convenience.
- **`validate()`** — iterates every text placed by the library, calls `getBBox()` on each, compares to the shape's bounds at that Y, logs any overflows. Returns `{ placed, overflows }`.

### Lint gotcha

HF's StaticGuard scans the HTML source with a script-tag regex. If your SVG contains a comment with the literal text `<script>` (e.g., as a TODO note), the regex treats everything after that comment as a script and tries to parse the rest of the HTML as JS — the error reads "Unexpected identifier 'body'" because it hits `<body>`. Avoid writing `<script>` inside SVG comments.

---

If you can't articulate the geometry up front, the metaphor isn't ready to render yet — go back to step 1.

---

## The 5-step workflow

### Step 1: Concept brief

For a thematic post, write a one-paragraph brief naming:

- **The visual metaphor** that conveys the post's argument (literal: pipes, wall, iceberg, ladder; or structural: chart, pyramid, hub-and-spoke)
- **The geometry sketch**: what's the X/Y reference, what are the structural elements, what are the anchor points
- **Brand assets needed**: which tool logos, whether Recraft illustrations are appropriate (often not)
- **The "no chrome" check**: confirm you don't need an eyebrow, meta-badge, or verdict bar

Skip this step only if the post is tabular — use the info-card generator instead.

### Step 2: Source brand logos

Cache real brand icons at `assets/logos/<name>-icon.png` (or `.svg`). Order of attempts:

1. **Google favicon API** at `sz=256`:
   `https://www.google.com/s2/favicons?domain=<dom>&sz=256`
   Works for most B2B brands. Returns 180-256px PNG.
2. **Alt subdomains** under the same brand:
   For Salesforce specifically, `help.salesforce.com` returns a clean 128px cloud icon when `salesforce.com` only returns 32×32.
3. **Wikipedia commons SVGs** for major brands:
   `https://en.wikipedia.org/w/api.php?action=query&titles=File:<Brand>_logo.svg&prop=imageinfo&iiprop=url&format=json`
4. **gilbarbara/logos GitHub** for community SVGs:
   `https://raw.githubusercontent.com/gilbarbara/logos/main/logos/<slug>.svg`
5. **Brand-color text chip fallback** — only if all above fail. Use brand color + 2-letter abbreviation. Disambiguate when two tools share initials (Salesforce/Snowflake/Salesloft all start with S).

**Treatment in the composition:**
- Logos with **transparent backgrounds** (Salesforce cloud, Snowflake, Clay, Outreach, Folk) sit in a white 38×38 chip with subtle border
- Logos with **brand-color backgrounds built in** (HubSpot orange, Apollo yellow) get the `.flush` class — fill the chip edge-to-edge, no border

### Step 3: Generate hero illustration via Recraft (if and only if you need one)

**Use Recraft sparingly.** A Recraft illustration is the right call only when:
- The metaphor genuinely benefits from atmospheric/painterly treatment AND
- The illustration can be the entire canvas (not a side element)

Most of the time, a custom SVG diagram is better than a Recraft illustration. The Recraft attempt early in this thread failed because the painting and the logos were structurally disconnected.

If you do need a Recraft generation:

```bash
curl -s -X POST "https://external.api.recraft.ai/v1/images/generations" \
  -H "Authorization: Bearer $RECRAFT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "...",
    "style": "digital_illustration",
    "size": "1365x1024",
    "model": "recraftv3"
  }'
```

Sizes: `1024x1024` square, `1365x1024` landscape, `1024x1365` portrait. Each generation costs ~40 credits (~$0.04).

**Prompting principles:**
- Anchor in the brand palette: "warm cream and dusty peach with deep indigo shadows"
- Anchor in the style: "painterly editorial illustration" or "hand-drawn flat illustration with hand-mapped texture"
- Specify what's IN the scene concretely
- **Never ask Recraft to render text** — text gets mangled. Add text via SVG overlay.
- Specify aspect ratio in the prompt too in addition to the API `size` param

The API key lives in `.env` as `RECRAFT_API_KEY`. Never commit it. See `.env.example` at repo root.

### Step 4: Optionally source screenshots or supporting images

If the post cites a specific webpage, news article, or product screen, capture it and cache at `assets/screenshots/<slug>.png`. Skip if the post doesn't reference something visual.

### Step 5: Compose the HTML/SVG and snapshot

Build the composition in `index.html`. Pattern:

- Outer gradient frame (Kiln brand)
- Cream interior
- Top bar: Kiln lockup only (no meta-badge)
- Title: Fraunces with italic emphasis on the key phrase
- Subtitle: Inter, brief
- Stage: the SVG diagram, fills most of the card
- Footer: orange dot + Patrick's name | thekiln.com

Render commands:

```bash
npx hyperframes lint                                          # check for HF errors
npx hyperframes snapshot --at 0                               # generate PNG
cp snapshots/frame-00-at-0.0s.png output/<post-slug>.png      # save deliverable
cp snapshots/frame-00-at-0.0s.png iterations/<slug>-r<N>.png  # archive iteration
```

Iterate until the composition is tight. Archive every iteration to `iterations/` for reference.

---

## Anti-patterns (avoid these — they're failures from this thread)

1. **Generating a Recraft illustration and placing logos in a separate box below it.** Disconnected. The painting becomes decoration and the logos float free. Fix: build a custom SVG diagram where the metaphor's geometry holds the logos in place.

2. **Adding chrome (eyebrow, meta-badge, verdict bar) to fill space.** None of these add value. Removing them gives the actual diagram room to breathe.

3. **Free-handing text positions with HTML percentages.** `bottom: 22%; left: 50%; width: 55%` has no relationship to the underlying diagram. The labels drift as soon as the diagram changes. Fix: position every text element with SVG coordinates inside the same SVG that draws the diagram.

4. **Copying another creator's full aesthetic** (dark space backgrounds, bold sans-serif, etc.). Adapt structural patterns from inspiration, but always render in the Kiln's brand (Fraunces, peach/indigo, cream interior).

5. **Making up labels that don't describe real things.** "Apex" at the top of a capability pyramid isn't a capability — it's filler. Every label has to name something the reader would recognize as a real concept in their work.

6. **Making the metaphor too literal.** A landscape painting of "a wall in a garden" with logos floating beside it isn't the visual the post needs — it's a children's-book illustration of the title. The metaphor should be EMBEDDED in the structure, not LITERALIZED as a scene.

7. **Letterboxing the SVG** because viewBox aspect doesn't match container. Match the viewBox to the actual available aspect; don't accept the wasted vertical space.

8. **Letting Y-axis labels extend past the viewBox left edge.** Compute the leftmost render position of your longest label and shift the plot area right to fit.

---

## Worked example: series-b-wall

The post: "AI-first CRMs hit a Series B wall."
Asset: `output/series-b-wall.png`

**Concept:** A two-line growth chart. X = company stage (Seed → IPO), Y = CRM capability complexity. The indigo line (Established CRMs) climbs smoothly through every stage. The orange line (AI-first CRMs) climbs through Seed and Series A, then crashes into a vertical hatched WALL at Series B and goes flat-dashed showing it stopped scaling.

**Geometry defined first:**
- Plot area: `x=230 to 940` (710 wide), `y=130 to 760` (630 tall)
- X-axis ticks at 5 stages: `x = [230, 408, 585, 763, 940]` (spacing 177.5)
- Y-axis tiers at 5 capability levels: `y = [760, 602.5, 445, 287.5, 130]` (spacing 157.5)
- Wall band at the Series B tick: `x=575-595`
- AI-first crash point: `(575, 475)` — just shy of Series B
- Established apex: `(940, 145)` — IPO at top tier

**Every text/logo anchors to those coordinates:**
- Y-axis labels: right-aligned to `x=220`, vertical positions match gridline Y's
- X-axis labels: centered on tick X positions
- Wall callout: `translate(600, 175)` — just right of the wall
- AI-first logo cluster: `translate(440, 510)` — just below the crash point
- Established logo cluster: `translate(800, 70)` — above the apex
- Legend: `translate(370, 868)` — centered below the plot

**Kiln brand throughout:**
- Fraunces title with italic emphasis on "Series B wall" in `--grad-from`
- Inter body
- Cream interior, gradient frame, topographic texture
- Brand orange `#FB923C` as single accent (wall, tick at Series B, italic emphasis, footer dot)

**No chrome:**
- No eyebrow
- No meta-badge  
- No verdict bar at the bottom

This is the template. Apply the same principle (define geometry → anchor everything to it) for icebergs, pyramids, staircases, etc.

---

## HyperFrames contract for static cards

```html
<div data-composition-id="main" data-start="0" data-duration="1" data-width="1080" data-height="1350">
  <!-- composition -->
</div>

<script>
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = gsap.timeline({ paused: true }); // empty + paused
</script>
```

A static card is a 1-second composition with an empty paused timeline. `hyperframes snapshot --at 0` captures the still PNG.

---

## File structure

```
templates/freeform/
├── index.html              # current composition (one post at a time — overwrite per post)
├── design.md               # this file
├── hyperframes.json        # HF project config
├── package.json
├── meta.json
├── AGENTS.md               # HF-generated, useful
├── CLAUDE.md               # HF-generated, useful
├── assets/
│   ├── kiln-lockup-black.png
│   ├── texture-topographic.png
│   ├── logos/              # cached brand icons (PNG/SVG) — grows over time as new brands come up
│   ├── illustrations/      # optional Recraft-generated hero images (rarely used)
│   └── screenshots/        # optional captured webpages
├── iterations/             # archived snapshots + HTML per post per round (helps debug)
├── output/                 # final renders, one per post
└── snapshots/              # HF working directory (gitignored — transient)
```

---

## Canvas

- **1080 × 1350** (LinkedIn 4:5 portrait)
- **40-50px gradient frame** around the dark/cream interior
- Cream interior `#F5F4EB` fills the inside

---

## Posts shipped

- `output/series-b-wall.png` — two-line growth chart with structured SVG placement. The reference example for the geometry-first principle.
- `output/automation-is-plumbing.png` — architecture-diagram pattern with 4 category cards + real brand logos. Earlier template-style attempt; kept for comparison.

Earlier iterations of both posts in `iterations/` document the rounds it took to land each one — useful as a record of what works and what doesn't.
