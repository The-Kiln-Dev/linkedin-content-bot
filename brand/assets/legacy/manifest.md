# Legacy brand asset manifest

Assets available when composing **legacy-direction** posts — primarily carousels.

**Rules for me (Claude) when generating:**
- I have creative liberty over composition (which icon/doodle to pick, which slide layout, where to place supporting visuals).
- I have zero liberty to invent new brand elements. Flag gaps rather than draw them in code.
- Never pull assets from the `exploration/` folder into a legacy template without asking first.
- The "Patrick + photo" author attribution is legacy-only (cover and CTA slides).
- Follow `specs.md` for canvas dimensions and resolution rules.

---

## Logos

| File | Dims | Use |
|---|---|---|
| `logos/kiln-mark-black.png` | 1500×1500 | Mark only. Use in content-slide footers, ~64 px wide, beside "TheKiln" wordmark text. |
| `logos/kiln-lockup-black.png` | 338×80 | Full mark + wordmark lockup. Default for cover, CTA, and content-slide footer. |

---

## 3D illustrated icons — `icons-3d/` (all 640×640, saturated, Fluent 3D style)

Use as **hero-scale supporting visuals** on carousel slides — typically 200–400 px wide, often partially off-canvas in corners to feel dynamic. One or two per slide. Never redraw or stylize; only place.

### Single-subject icons

| File | Subject | Good for | Avoid for |
|---|---|---|---|
| `envelope.png` | Pink envelope | Email · deliverability · inbox · newsletters | Non-email posts |
| `rocket.png` | Blue/yellow rocket launching | Launches · growth · speed · scaling · "lift-off" moments | Reflective / cautious takes |
| `trophy.png` | Gold trophy cup | Winning · milestones · best-of · contests · Clay Cup coverage | Humble / exploratory posts |
| `lightbulb.png` | Yellow + pink lightbulb | Ideas · insights · "here's what I realized" · moments of clarity | Announcements (use rocket or trophy) |
| `megaphone.png` | Tan / pink / blue megaphone | Announcements · marketing · amplification · "getting the word out" | Private / quiet framings |
| `target.png` | Archery target with arrow | ICP · targeting · precision · accuracy · "hit the mark" | Unfocused / broad topics |
| `magnifying-glass.png` | Purple magnifier | Research · investigation · "looking closer" · diligence | Action / decision-focused posts |
| `globe.png` | Clay-textured earth globe | Scale · market-wide observations · TAM · enterprise-level posts | Tactical how-tos |
| `hourglass.png` | Pink hourglass with rainbow sand | Time · urgency · "time is running out" · aging / maturation | Instant / fast-moving topics |
| `speech-bubble.png` | Teal speech bubble (single) | Opinion · hot take · commentary · "a thought" | Multi-party / collaboration |
| `heart.png` | Red clay heart (single) | Passion · customer love · team appreciation · "things I love about X" | Critical / analytical posts |
| `beaker.png` | Flask with bubbles | Experiments · testing · R&D · "we tried this" · science / method | Conclusions / final verdicts |
| `clay-sculptors.png` | **Two figures sculpting clay** (brand-specific) | The Kiln's own origin / identity · "what we do" posts · agency positioning · "how we build" | Non-Kiln-specific content |

### Combined / compound icons

| File | Subject | Good for |
|---|---|---|
| `envelope-idea.png` | Envelope + lightbulb | Email strategy · "idea in your inbox" · newsletter announcements · email insights |
| `globe-search.png` | Globe + magnifying glass | Market research · TAM discovery · competitive intelligence · ICP mapping at scale |
| `speech-bubbles.png` | Two speech bubbles (teal + purple) | Conversations · interviews · sales calls · customer research · dialogue-driven posts |
| `hearts-cluster.png` | Cluster of 3 hearts | Deep customer love · testimonials · "our clients are incredible" · appreciation |

---

## Doodles — `doodles/` (hand-drawn monoline, hero-scale)

Used large on legacy cover and CTA slides, typically flanking the headline. Different visual weight than exploration's small-accent doodles.

| File | Dims | Description | Good for |
|---|---|---|---|
| `swoop-flourish.png` | 400×388 | Curly swooping line with cone/spiral accent | Flow · momentum · "things are moving" · energetic takes |
| `labyrinth.png` | 400×424 | Square-angular labyrinth / maze spiral | Complexity · systems · "we built this from scratch" · architecture · the CTA slide in the reference carousel |
| `wave-blob.png` | 400×392 | Amorphous wavy blob | Fluidity · adaptation · the big left-side shape on the cover slide in the reference |
| `cloud.png` | 400×136 | Puffy cloud (horizontal) | Softness · "thinking out loud" · hypothetical · airy takes |

Note: `wave-blob` exists in both `exploration/doodles/` and `legacy/doodles/` — they're different files with the same name, each tuned to their direction's scale and style. Only use the one in the direction you're composing.

---

## Author badge — `people/`

### `people/patrick.jpeg` — 800×800
- Patrick's LinkedIn profile photo.
- **Treatment:** ~64 px square with rounded corners (~12 px radius), shown beside the text "Patrick" in bold sans.
- **Placement:** top-right of **cover and CTA slides only**. Never on content slides.
- **Legacy-only:** do not use on exploration assets.

---

## Typography

- **Display / headlines:** bold sans-serif, extrabold weight, tight tracking. Working assumption: **Inter ExtraBold** or a close equivalent (Manrope, Satoshi). *Confirm by inspecting a text layer in the reference Figma if precision matters.*
- **Body:** clean sans, Inter regular or medium.
- **Category labels** (e.g., "TUTORIAL", "STEP 1", "NEED SUPPORT?"): small caps, bold, muted gray or black, ~1.5% of slide height.

---

## Layout patterns (from reference carousel)

### Cover slide
- White background
- Kiln lockup top-left
- "Patrick + photo" badge top-right
- Category label above headline (e.g., "TUTORIAL")
- Hero headline: 3–4 lines, very large, bold sans
- Black pill CTA button with white text + arrow ("Learn how →")
- Two hero-scale flanking visuals (a doodle on one side, a 3D icon on the other)

### Content slide
- White background, cream footer strip
- "STEP N" label top-left (small caps, bold)
- Large headline
- Short body (1–3 sentences)
- Supporting visual in body: image, screenshot, tool cards, or list
- 3D icons partially off-canvas in corners (often two, one each side)
- Footer: Kiln lockup left, "Next step →" right, thin divider above

### CTA slide
- Same top pattern as cover
- Category label (e.g., "NEED SUPPORT?")
- Hero headline
- Black pill CTA ("Talk with us 👋")
- Flanking doodles left and right

---

## Composition defaults

When composing a carousel slide, I pick:
- **1 primary 3D icon** per content slide (partial-off-canvas corner placement)
- **0–1 secondary 3D icon** as a counterweight on the opposite corner
- **1–2 doodles** per cover/CTA slide (flanking, hero-scale)
- **Never a doodle + 3D icon on the same corner.** They're separate design vocabularies here even though both are allowed in the same piece.

---

## Icon → topic cheat sheet

| If the post / slide is about… | First-choice 3D icon |
|---|---|
| Email · deliverability · inbox | `envelope` |
| Email strategy · newsletter insights | `envelope-idea` |
| Launch · growth · speed | `rocket` |
| Winning · competition · milestones | `trophy` |
| Ideas · insights · learning | `lightbulb` |
| Marketing · amplification · announcement | `megaphone` |
| Targeting · ICP · precision | `target` |
| Research · investigation · diligence | `magnifying-glass` |
| Market research / competitive intel | `globe-search` |
| Scale · enterprise · TAM | `globe` |
| Time · urgency · aging | `hourglass` |
| Opinion · hot take | `speech-bubble` |
| Conversations · interviews · sales calls | `speech-bubbles` |
| Experimentation · testing · R&D | `beaker` |
| Customer love · testimonials · appreciation | `heart` or `hearts-cluster` |
| The Kiln's identity / agency positioning | `clay-sculptors` |

---

## Open TODOs

1. Confirm exact headline font (likely Inter ExtraBold).
2. Possibly add more doodles — there are `Group 22.png`, `line-1 2.png`, and `line-7 2.png` files in the source folder that look like the same hand-drawn style. User said "doodles all have vector in the name" so I've held off on these. Flag for confirmation.
3. Once carousel templates are built, add a per-slide-type asset recommendation table to this manifest.
