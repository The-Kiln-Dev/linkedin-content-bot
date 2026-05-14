# Legacy carousel generator

> **Note:** Carousels now default to the **exploration** direction (see `../../exploration/carousel/`). This legacy generator is the **alternate** direction — keep it for decks that explicitly want the editorial b&w + 3D-icon register over the gradient-frame + Fraunces register. New carousels should default here only when the brand-legacy treatment is the deliberate choice.

Node + Puppeteer. Renders the three legacy-direction slide templates (cover, content, CTA) to PNGs at 1080×1350 (device-scale 2× → 2160×2700 output).

## Run

Deps are installed once at repo root (`npm install` there). From anywhere:

```
npm run render:legacy-carousel -- templates/legacy/carousel/inputs/claude-vs-clay.json
```

Output goes to `output/<deck-name>/NN-<type>.png`.

## Input JSON schema

```jsonc
{
  "output_dir": "output/<deck-name>",
  "slides": [
    {
      "type": "cover",
      "category": "TUTORIAL",              // small-caps label above headline
      "headline": "3-4 line hero headline",
      "cta_text": "Learn how →",
      "icon_3d": "envelope.png",           // filename in brand/assets/legacy/icons-3d/
      "doodle": "wave-blob.png"            // filename in brand/assets/legacy/doodles/
    },
    {
      "type": "content",
      "step": 1,                           // → "STEP 1"
      "step_label": "STEP 1",              // optional override (e.g. "INTRO", "PART 2")
      "headline": "The slide headline.",
      "body": "1–3 sentences of supporting prose.",
      "support_image": "path/to/screenshot.png",  // optional, center-body
      "icon_3d_tr": "rocket.png",          // top-right corner icon (partially off-canvas)
      "icon_3d_bl": "trophy.png"           // optional bottom-left counterweight
    },
    {
      "type": "cta",
      "category": "NEED SUPPORT?",
      "headline": "Hero CTA headline",
      "cta_text": "Talk with us 👋",
      "doodle_left": "labyrinth.png",
      "doodle_right": "wavy-arrow.png"
    }
  ]
}
```

Asset references are filenames relative to the matching folder under `brand/assets/legacy/`. The generator throws if a referenced asset is missing. Keep the `legacy/` folder as the only source — don't mix in exploration-direction doodles (see `brand/README.md`).

## Layout notes

- Canvas is 1080×1350 (portrait), per `brand/specs.md`. LinkedIn accepts this as a carousel / document post.
- Cover + CTA slides carry the Patrick + photo badge top-right. Content slides do not.
- Content slides have a cream footer strip with the lockup + "Next step →".
- 3D icons default to partial-off-canvas corner placement, doodles to hero-scale flanking on cover/CTA. Override via template CSS if a specific slide needs a different composition.

## Generating new 3D illustrations

We generate slide-specific Fluent-3D illustrations via OpenAI (`lib/gen-illustration.js`). Key in `.env` (gitignored). Uses `gpt-image-1` today; swap to `gpt-image-2` once the OpenAI org is verified.

```
node lib/gen-illustration.js \
  --prompt "..." \
  --ref rocket.png --ref trophy.png --ref globe.png \
  --out generated/<slide-slug>.png \
  --size 1024x1024 --quality high --background transparent
```

Any `support_image` path under `generated/` auto-picks the unframed illustration variant (no border/shadow, 560px wide, centered).

### Prompt template (the one that works)

References lock *style*, not subject. To reliably get a novel subject in the brand's visual language:

```
Generate a single centered 3D illustrated icon in the EXACT same visual style
as the reference images — but with completely different subject matter. The
reference images are for STYLE REFERENCE ONLY: copy their glossy
clay/plasticine material finish, saturated candy-colored palette (teals,
corals, yellows, purples, soft pinks), soft studio lighting with subtle
drop shadow, chunky rounded geometry, and playful proportions. Do NOT include
any [rocket/trophy/globe/etc — name the reference subjects here to exclude them].

Subject to render: <concrete physical description of the new subject,
including color hints that sit inside the brand palette>.

Single tight cluster, centered, no text, no logos, no UI elements,
transparent background.
```

Pick 2–3 references whose *style* you want to lean on but whose *subject* doesn't bias the output toward your target. Always name them in the exclusion clause — the model leaks reference content otherwise.

## Fetching brand logos

Use `lib/fetch-logo.js` to pull logos from live sites. Caches under `captures/logos/<domain>.png`; known selectors live in `captures/logos/registry.json`.

```
# First-time capture (selector gets saved to registry):
node lib/fetch-logo.js ramp.com --selector "header a[aria-label='Home'] svg"

# Subsequent runs are cache hits (no network):
node lib/fetch-logo.js ramp.com

# Force re-capture (e.g., after the brand updated their logo):
node lib/fetch-logo.js ramp.com --force

# Skip a promo bar or announcement block that intercepts the selector:
node lib/fetch-logo.js clay.com --selector "a.nav_brand img" --hide ".promo-bar"

# Invert RGB for white-on-dark logos so they render on white slides (applies
# sharp.negate({ alpha: false }) after trimming). Saved to registry so future
# runs honor it automatically.
node lib/fetch-logo.js hubspot.com --selector "a.global-nav-logo img" --invert
```

**How hardening works:** before screenshotting, the helper injects CSS that sets the page, the logo element, and every ancestor up to `<html>` to transparent background. Then it screenshots with `omitBackground: true` and pipes through `sharp.trim()` so the PNG is tight to the logo pixels. Brands with colored header panels (e.g. Anthropic's cream nav) come out clean.

**Registry shape** (`captures/logos/registry.json`):
```jsonc
{
  "domains": {
    "clay.com":      { "selector": "a.nav_brand img", "hide": [".nav-banner"] },
    "anthropic.com": { "selector": "a.nav_logo_wrap" }
  }
}
```

## Content-slide components

Content slides can include any combination of:

- `support_image` — a full-width screenshot or centered illustration (auto-detected: paths under `generated/` render unframed, everything else gets a rounded card).
- `tool_cards: [{logo, name, note, scale?}]` — row of white rounded cards with logo + name + note. Feels structured, grid-like. Good for tool lists when the names + descriptions matter as much as the logos. Logos sit in a fixed 220×60 frame (object-fit contain, left-aligned) so brands with different aspect ratios look visually normalized. Use the optional `scale` (0–1) to shrink a single logo that's reading visually heavier than the others (e.g., `"scale": 0.82` for Salesloft).
- `logos_layout: "scattered" | "notes"` (+ `logos` array) — **preferred for most logo slides**. More editorial / artistic than tool_cards. See below.
- `flowchart: {orientation, nodes: [{label, sub, icon}]}` — a linear flow. Nodes render as rounded cards with optional 3D icon + bold label + muted sub-label. Sequential arrows between nodes. Set `orientation: "vertical"` to stack instead of row.

### Artistic logo layouts

The card-grid `tool_cards` look can feel AI-generated / over-structured on LinkedIn. For most logo slides, prefer the artistic `logos_layout` variants. Two are production-ready; the generator also supports `"path"`, `"hero"`, and `"integrated"` but those needed more tuning and aren't recommended yet.

**`"scattered"`** — logos at varied positions, sizes, and rotations. Optional hero-scale doodle behind at low opacity reads as movement. Best for 3–4 logos. Example (from `inputs/claude-vs-clay.json` step 4):

```jsonc
{
  "logos_layout": "scattered",
  "background_doodle": "cursive-swoop.png",   // filename from brand/assets/legacy/doodles/, rendered at 10% opacity
  "logos": [
    { "src": "captures/logos/snowflake.com.png", "left": 70,  "top": 40,  "width": 280, "rotate": -4 },
    { "src": "captures/logos/gong.io.png",       "left": 560, "top": 180, "width": 320, "rotate": 3  },
    { "src": "captures/logos/salesloft.com.png", "left": 200, "top": 440, "width": 260, "rotate": -6 }
  ]
}
```

Positions are px-offsets inside the 1080×710 scene area (which sits below the body copy, above the footer). Pick rotations in the -6° to +5° range. Avoid uniform sizing — varying `width` between ~220 and ~320 gives the composition hierarchy.

**`"notes"`** — logos on tilted cream cards with subtle shadow and a small "tape" strip at the top of each note. Hand-curated, zine-y feel. Best for 2–3 logos. Example (step 1 of the same deck):

```jsonc
{
  "logos_layout": "notes",
  "logos": [
    { "src": "captures/logos/clay.com.png",      "rotate": -4 },
    { "src": "captures/logos/anthropic.com.png", "rotate": 3  }
  ]
}
```

Only `rotate` is used per-note. Sizing is handled by the CSS (240×72 max inside cream card). Mix rotations: one negative, one positive, small magnitudes (< 6°). Don't rotate all the same direction.

**Ranking for most enterprise/tool slides:** `scattered` > `notes` > `tool_cards`. Only reach for `tool_cards` when the name + description of each tool is itself the message.

Example flowchart slide:

```jsonc
{
  "type": "content",
  "step": 2,
  "headline": "A typical enrichment flow.",
  "body": "What any GTM workflow needs to handle:",
  "flowchart": {
    "orientation": "horizontal",
    "nodes": [
      { "label": "Capture", "sub": "Form fill / import",  "icon": "envelope.png" },
      { "label": "Enrich",  "sub": "Waterfall providers", "icon": "magnifying-glass.png" },
      { "label": "Score",   "sub": "ICP match",           "icon": "target.png" },
      { "label": "Route",   "sub": "To the right rep",    "icon": "rocket.png" }
    ]
  }
}
```

## Writing slide copy (Patrick's voice)

Copy on these slides is Patrick's, not a generic-polished marketing voice. It has to sound like he wrote it. Source of truth for voice: `linkedin/voice/voice.md` + posts under `linkedin/voice/examples/best/`. Read at least one example post before drafting copy for a new deck.

**Hard rules (from the user, overriding voice.md):**
- **No em-dashes (`—`).** Use hyphens, commas, parentheses, or two separate sentences. Em-dashes read as AI-generated to a lot of people and Patrick doesn't want them in his posts.
- No "let me break it down", "let's dive in", "unpack", "unlock", "leverage", "synergy", "revolutionize", "game-changer". Corporate / AI-mush vocab.
- No rhetorical-question openers ("Ever wonder why…"). Hooks state a claim, then a colon.

**What Patrick does sound like:**
- Opens with a specific claim + colon, then a promise. "Claude Code enrichment has gotten scarily good. Here are a few learnings…"
- Owns opinions explicitly: "Personally, I don't think so." "My personal opinion?" "My conclusion?"
- Names specific tools, prices, and people. Not "a data provider" — "BlitzAPI at $500/mo." Not "some people" — "Eric Nowoslawski, Matthew Lucero."
- Contractions everywhere ("it's", "don't", "we've"). Sentence case. Generous paragraph breaks.
- Self-aware humor, never snark. "You might be thinking 'Patrick, this is so obvious,' and you'd be right."
- Community-first. Shouts out collaborators by name when natural.

**When drafting slide copy, pull directly from the source draft when possible** — if the user has already written the post in their voice, the carousel copy should be a faithful compression of their prose, not a rewrite of it. Re-wording for "clarity" is the fastest way to introduce AI-isms.

**Checklist before committing a deck:**
- [ ] No em-dashes.
- [ ] At least one opinion is marked ("Personally", "I think", "My X").
- [ ] At least one concrete specific (tool name, number, person).
- [ ] Could the reader swap "Patrick" for any generic marketer and still read this? If yes, rewrite.

See `inputs/claude-vs-clay.json` for a worked example of slide copy pulled from `linkedin/drafts/claude-code-vs-clay.md`.

## Picking the right visual per slide (the no-slop heuristic)

Every slide's visual has to earn its space. If the only reason for the visual is "fill the white space", it's slop. Before defaulting to a generated 3D illustration, ask what's most informative.

| Slide topic | First-choice visual | Why |
|---|---|---|
| Naming specific brands ("Clay vs Claude Code") | Logo cards (`tool_cards`) | Real brands > abstract framing |
| Describing a product or UI | Website screenshot (`support_image` with captured hero) | Actual product > metaphor |
| A list of systems or integrations | Tool-card row | Real names with notes > vague illustrations |
| A process or sequence of steps | Flowchart | Shows the shape of the thing |
| Abstract concepts (power, trust, speed) | Generated 3D illustration | Metaphor earns its keep when the subject is inherently abstract |
| A verdict, tradeoff, or decision moment | Generated 3D illustration (scale, gavel, scoreboard) | Metaphor closes a section cleanly |
| Cover / CTA | 3D icon + doodle flanking | Brand-standard framing |

A generated illustration should be **one of several visual types in the deck, not the default**. A deck where every content slide is a 3D scene feels decorative; a deck where visuals vary by what the slide is actually saying feels informative.

## Session learnings (accumulated)

Things worth remembering the next time we build a deck, so we don't relearn them.

### Generating illustrations
- `gpt-image-1` is our working model today. `gpt-image-2` exists but requires OpenAI org verification.
- References lock **style**, not subject. Always name the reference subjects in an exclusion clause or the model smuggles them into the output.
- Subject descriptions work best when physical and colored: "a purple clay vault with coral shield" beats "a secure-looking object".
- Cost per image at 1024×1024 high: ~$0.17 on gpt-image-1. A 5-illustration deck is ~$0.85.

### Fetching logos
- Known-working selectors are cached in `captures/logos/registry.json`. Prefer adding a new domain there over re-discovering selectors.
- **Salesforce blocks headless Chrome** (UA-gated or shadow DOM). Can't capture from salesforce.com directly. If we need Salesforce specifically, we'd have to source the logo from a brand/press page or hand-supply an asset.
- **HubSpot's nav logo captures as a tiny empty block** via Puppeteer — the element is there but the IMG doesn't render to anything useful in the trimmed capture. Skip HubSpot or source the logo file directly.
- **White-on-dark logos** (Outreach, HubSpot) come out invisible on white slides after the transparency hardening. `--invert` fixes the readability, but it **distorts brand color** (Outreach purple → green, etc.). For brand fidelity on LinkedIn, prefer swapping in a different tool whose logo captures in-color (e.g., Gong, Salesloft, Snowflake all capture clean) rather than shipping an inverted logo with wrong brand colors.
- **Semi-transparent halo on capture** — some brands' IMG elements render with sub-1.0 alpha across the image, so the capture looks fine on preview (blends white) but halos gray on slide backgrounds after rotation. Symptom: `sharp.stats()` on the capture shows alpha-channel `mean` well below 255. **Fix: fetch the IMG's `src` URL directly instead of screenshotting.** For Salesloft, that src resolved to `salesloft.com/images/logos/salesloft-on-light.svg` — a clean on-light SVG designed for exactly this use. Pattern:
  ```bash
  curl -s "https://site.com/path/to/logo-on-light.svg" -o captures/logos/raw.svg
  node -e "require('sharp')('captures/logos/raw.svg', { density: 300 }).resize({ height: 256 }).png().toFile('captures/logos/site.com.png').then(console.log)"
  ```
  Worth it when `.stats()` shows alpha mean below ~230, or when the capture looks clean in Preview but halos on white slides.
- Known-clean captures: `clay.com`, `anthropic.com`, `snowflake.com`, `gong.io`, `salesloft.com`.

### Logo scaling in tool cards
- The 220×60 frame + `object-fit: contain` normalizes most brand logos to look visually sibling-weight.
- Outliers (logos that still read heavier than the others because of thick strokes or full-bleed composition) get tuned with the per-card `"scale": 0.8–0.9` override. Salesloft needs ~0.82.

### Copy
- Source draft is sacred. When the user has already written the post, pull lines from the draft directly; don't paraphrase for "clarity".
- Em-dashes read as AI-generated. User hard-rule: no em-dashes in any slide copy.

## Customization seams

- Headline size per slide: if a headline runs long and wraps ugly, set an inline override on the slide's headline, or add a per-slide class — don't chase layout fit with copy edits.
- Device-scale factor is set in `generate.js` (`SCALE = 2`). Drop to 1 for faster renders while iterating; bump to 3 for print-grade output.
