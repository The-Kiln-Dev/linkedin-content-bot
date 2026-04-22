# Brand asset manifest — exploration direction

The complete inventory of visual assets available when composing exploration-direction posts.

**Rules for me (Claude) when generating:**
- I have creative liberty over *composition* (which asset to pick, where to place it, how much whitespace, which gradient variant).
- I have zero liberty to *invent* new brand elements. If a composition seems to need a doodle that doesn't exist here, I flag the gap rather than draw one in code.
- Use exactly ONE primary doodle per card. Two max, and only if they live on separate panels.
- Match the doodle to the topic using the "Good for" tags below. Default to `curl-cluster` for generic / opinion posts when no topical fit is obvious.
- Follow `brand/specs.md` for canvas dimensions and source-asset resolution.

---

## Logos

### `logos/kiln-mark-black.png` — 1500×1500
- **What it is:** The 4-petal Kiln icon, solid black on transparent, high-res.
- **Use when:** You need the brand mark *without* the wordmark — tight spaces, very small scales, or when pairing with a specifically-styled wordmark.
- **Typical placement:** Top-left of a card, ~60–80 px wide.

### `logos/kiln-lockup-black.png` — 338×80
- **What it is:** Full logo lockup — 4-petal mark + "The Kiln" wordmark together, black on transparent.
- **Use when:** Default choice for cards. Guarantees correct wordmark typography — no need to render "The Kiln" as rendered text next to the mark.
- **Typical placement:** Top-left of a card, ~180–240 px wide.
- **Note:** Source is borderline on resolution (338×80 displayed at 220 px ≈ 1.3×). Fine for 1200 px canvases; re-export at 2× from Figma if we ever need it larger.

---

## Doodles — hand-drawn monoline accents, black on transparent PNG

### `doodles/paper-airplane.png` — 400×308
- **What it is:** Loose paper-airplane sketch, mid-flight.
- **Good for:** Outbound posts · email posts · "sending" / "reaching out" / "in the wild" metaphors · deliverability.
- **Seen in existing brand:** The canonical top-right accent on the Figma statement card.
- **Avoid for:** Inbound, content, or anything stationary/introspective.

### `doodles/curl-cluster.png` — 326×275
- **What it is:** Small cluster of curl-marks grouped like a tiny burst or crowd.
- **Good for:** Generic accent when no topical fit is obvious · opinion takes · community / collaboration / "a few thoughts" framing.
- **Seen in existing brand:** The canonical bottom-left accent on the Figma statement card.
- **Default choice** when unsure which doodle to pick.

### `doodles/burst-star.png` — 840×801
- **What it is:** Loose 5-point star, heavy-stroke, hand-drawn.
- **Good for:** Announcements · product launches · "big news" · milestone posts · celebratory shout-outs.
- **Avoid for:** Reflective or opinion-driven posts — it reads too energetic.

### `doodles/envelope.png` — 306×306
- **What it is:** Hand-drawn envelope with a small sparkle beside it.
- **Good for:** Email-specific posts · deliverability · inbox placement · "I got a message that…" · newsletter / writing posts.
- **Avoid for:** Non-email content — this doodle is too literal to use as a generic accent.

### `doodles/spiral.png` — 306×306
- **What it is:** A tight loose spiral / swirl.
- **Good for:** Compounding / iteration / loops · posts about practice, repetition, or feedback cycles · "the more I look at this…" framing.
- **Avoid for:** Straightforward tactical posts — the spiral implies nuance.

### `doodles/planet-ring.png` — 306×306
- **What it is:** Saturn / ringed planet, hand-drawn.
- **Good for:** Scale / scope / "bigger picture" posts · market-level observations · posts referencing enterprise or industry-wide trends.
- **Avoid for:** Tactical how-tos.

### `doodles/cloud-blob.png` — 102×102 ⚠ low-res
- **What it is:** Soft cloud / blob shape (original set).
- **Good for:** "Thinking out loud" posts · hypotheticals · contrarian or uncertain takes where you're exploring rather than concluding.
- **Avoid for:** Strong opinion posts with a firm conclusion.
- **Resolution caveat:** Only 102×102 — do not display larger than ~40 px. Candidate for re-export from Figma at 3×+.

### `doodles/wave-blob.png` — 306×306 *(new)*
- **What it is:** Elongated wave / flow shape — horizontal, more linear than cloud-blob.
- **Good for:** Motion / trends / flows · "the market is moving" · posts about waves of adoption, shifts in behavior, momentum.
- **Avoid for:** Static/declarative posts.
- **Distinct from cloud-blob:** cloud-blob reads as *thinking*; wave-blob reads as *motion*. Pick based on the post's verb.

### `doodles/crown.png` — 306×306 *(new)*
- **What it is:** Hand-drawn crown with three dots above.
- **Good for:** Winning / competition / best-of lists · leadership positioning · "top X" posts · Clay Cup / contests / awards · premium framing.
- **Avoid for:** Humble takes, questions, or exploratory posts — the crown is a statement.

### `doodles/light-bulb.png` — 240×296 *(new)*
- **What it is:** Hand-drawn light bulb with small sparkle marks beside it.
- **Good for:** Insights / ideas / learning · "here's what I realized" · lessons · teaching moments · moments of clarity.
- **Avoid for:** Announcements (too quiet) or celebratory posts (use burst-star instead).

---

## Texture

### `texture-topographic.png` — 1080×1080
- **Use:** Overlay on gradient borders of exploration-direction cards.
- **Specs:** 2×2 tile across a bordered card · `mix-blend-mode: multiply` · opacity 0.45–0.60.
- **Never use:** As standalone background · on interior white/cream panels · on non-gradient elements.

---

## Doodle → topic quick-match cheat sheet

| If the post is about… | First-choice doodle |
|---|---|
| Outbound / sending / "in the wild" | `paper-airplane` |
| Email / deliverability / inbox | `envelope` |
| Announcement / launch / celebration / milestone | `burst-star` |
| Scale / enterprise / market / bigger picture | `planet-ring` |
| Iteration / practice / loops / compounding | `spiral` |
| Trends / motion / flow / "the market is shifting" | `wave-blob` |
| Thinking out loud / hypothetical / exploratory | `cloud-blob` |
| Winning / best-of / competition / leadership | `crown` |
| Insights / ideas / learning / lessons | `light-bulb` |
| Opinion / observation / community / "a few thoughts" | `curl-cluster` (default) |

---

## Retired

- `squiggle-cluster.png` — retired. Its role (softer generic accent) is now covered by `curl-cluster` as the single generic default.

---

## Gaps / wishlist

- `cloud-blob` is low-res (102×102). Would benefit from a 3× re-export.
- A "gift" / "box" doodle for gifting-related posts (Patrick writes about gifting as an outbound channel — Sendoso, etc.).
- A "chart trending down" / "chart trending up" scribble for data-driven posts.
- A "caution" or "question mark" doodle for contrarian/counter-intuitive takes with a firm conclusion (cloud-blob reads too soft for strong contrarian).
