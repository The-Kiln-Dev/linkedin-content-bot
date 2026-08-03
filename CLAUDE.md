# Instructions for Claude in this repo

This file is auto-loaded into context at thread start. Read it before doing anything else.

## Default content-creation entry point

**When the user asks for content ideas, post suggestions, "what should I post about", "what's brewing", or anything that implies generating new LinkedIn content — your default flow is to invoke the ideation skill at `ideation/SKILL.md`.**

That skill pulls from two signal sources:

1. The user's recent Fathom calls (last 7 days) via the Fathom MCP — classified internal vs external by participant email domain, with strict privacy abstraction on external calls
2. Recent GTM news (last 72 hours) via the `gtm-signal-scan` global skill — filtered for angle, de-duplicated against the user's prior posts

The skill writes a unified ideas file to `ideation/output/ideas-YYYY-MM-DD.md`, summarizes top hooks in chat, then asks the user which idea to act on and whether to write the post or describe it more deeply. Steps 7 and 8 of `ideation/SKILL.md` handle the asset generation.

**Do NOT default to:**

- Riffing on `voice/pov.md` or `voice/voice.md` to generate ideas — these are style/voice references for *how* to write, not *what* to write about
- Pulling from `drafts/` as a new-idea source — these are works-in-progress
- Riffing on `voice/examples/best/` — those are reference exemplars used for tone and as a de-dup target, not idea fodder
- Inventing ideas from scratch based on the user's general role — the system has actual signal sources; use them

Style files inform the *voice* of generated content; they're not the content source. If you find yourself reading `voice/` files to come up with topic ideas, you've taken a wrong turn — go back and run the ideation skill instead.

## When the user wants to act on an idea

Follow Steps 7 and 8 of `ideation/SKILL.md`. After the user picks an idea, they'll say either:

- **"Write the post"** → you generate the LinkedIn caption + the asset. Route the asset to the right generator based on whether the idea is **tabular** or **thematic** (see below).
- **"Describe it more"** → you give a longer treatment (argument expanded, alternative hooks, alternative format approaches), the user writes the post offline, and they return with finished text. At that point, Step 8 takes their text and generates the asset.

### Tabular vs thematic routing

For each post-asset generation, classify the idea first:

- **Tabular** → content is a list of N principles, rows of comparisons, or a cheat sheet. The post is "here's a clean list."
  - **Route to:** `templates/exploration/info-card/` (or `templates/exploration/carousel/` for multi-slide narratives)
  - These are template generators: JSON in → PNG out

- **Thematic** → content has a visual metaphor that conveys the argument (plumbing → pipes, iceberg → depth, wall → barrier, hub → control center, chart → growth-over-time). The post is "here's a thing you have to see." The graphic IS the canvas — its structure dictated by the metaphor.
  - **Route to:** `templates/freeform/`
  - Read `templates/freeform/design.md` BEFORE starting — it contains non-negotiables that took a lot of iteration to settle, plus worked examples.
  - Critical principle: **build the metaphor's geometry in SVG first, then anchor every text/logo to that geometry** (never freehand HTML percentages).
  - **MANDATORY for any text inside a non-rectangular shape** (circle, lens/Venn, trapezoid, sector, polygon): use `templates/freeform/lib/layout.js`. Hand-placing text inside curved shapes always fails because the shape's width varies by Y. The library models each shape, computes per-row centroids, and runs a validation pass that catches any overflow before snapshotting. Rectangles can use direct coordinates; everything else must go through the library.

**Default heuristic:** if the post's title/hook contains a concrete physical thing (wall, iceberg, ladder, map, river, factory, foundation, ceiling, bridge, gate), it's probably thematic. If the post is "N tips for X" or "M things I learned", it's tabular. When in doubt, thematic produces a stronger LinkedIn asset.

If the info-card validator fails (content overflow, etc.), **restructure content to preserve information before dropping anything**. Try in order: compress copy → change column count → reformat section types → merge related sections. Only as a last resort drop content, and only with explicit user consent. The information is the point; the layout bends to fit it.

## Voice rules (apply to every generated piece)

Per `voice/voice.md` and the top-level README. Non-negotiable across all output:

- **No em-dashes (`—`)** — use hyphens, commas, parentheses, or two sentences
- **No AI-mush vocabulary** — no "leverage", "unlock", "synergy", "revolutionize", "game-changer", "elevate", "supercharge", "transform"
- **No rhetorical-question openers** — hooks state a claim, then a colon or comma
- **Opinion markers required** — at least one "personally", "I think", "my take", "in my experience", "I've found" per piece
- **Specific over generic** — name tools, dollar amounts, named people, concrete examples

## Brand direction

Carousels, info-cards, AND freeform thematic compositions default to the **exploration** direction, v2 execution: **"Ink & Kiln"** (see the v2 note atop `brand/brand-exploration.md` and `docs/asset-redesign-2026-08.md`). The shared chassis:

- Warm grained paper canvas (`#F5EFE2`), ink `#231F20` — no white panels, no gradient fence
- One **glaze dip** per asset (wavy gradient band + topographic texture); deck gradient constant, dip depth/edge varies
- **Hand-drawn ink structure** from `templates/craft/craft.js` — dividers, arrows, circles, marker underlines, boxes. Seeded wobble: deterministic per slide, different every deck
- Fraunces with scale drama; italic emphasis carries a hand mark (underline / circle / highlight)
- **Thick marker spot illustrations only** (brand doodles or `lib/gen-spot.js` Recraft brand style). Thin-line icons are banned everywhere
- **Slide archetypes** (cover, point, big-number, quote, list, diagram, cta) — pick per slide by content; don't repeat one archetype through a deck unless it's a genuine series

When building a freeform thematic asset, do NOT copy other creators' aesthetics wholesale (dark space backgrounds, bold sans-serif titles, etc.) — adapt structural patterns from elsewhere but always render in the Ink & Kiln language.

**Art-direction step (required for every deck):** before writing the input JSON, pick per slide: archetype, emphasis phrase + mark type, spot concept, and at most one hand-note per deck. Variety is the deliverable — two decks should never look like the same deck refilled.

**No chrome on any generated asset:** no "Patrick's take" eyebrow, no "Field Notes · 2026" meta-badge in the top-right, no "My Rule" verdict bar at the bottom, no "Illustration · Recraft" credits, no patronizing captions. Keep only: Kiln lockup, title, subtitle, the diagram itself, footer with author + URL. The visual should carry the conclusion; if it can't, the visual isn't doing its job.

## Repo orientation

```
ideation/                      ← Content idea generation (the entry point)
  SKILL.md                     ← The flow Claude follows (classifies tabular vs thematic)
  prompts/                     ← Internal-call / external-call / news extraction prompts
  config/allowed-tools.json    ← Whitelist of company/tool names allowed in abstracted output

templates/
  exploration/carousel/        ← Multi-slide PNG generator (default for tabular carousels)
  exploration/info-card/       ← Single dense PNG generator (with validateInput pre-flight)
                                 — for tabular cheat-sheet / comparison-row content
  freeform/                    ← Custom SVG composition system for THEMATIC posts
                                 — the graphic IS the canvas, structured by a metaphor
                                 — design.md inside has full workflow + non-negotiables
  legacy/carousel/             ← Alternate b&w direction (not default; explicit opt-in)

animations/                    ← HyperFrames GIF/MP4 (separate workflow, for animated assets)

brand/                         ← Visual language rules (exploration + legacy directions)
voice/                         ← Style + tone references (NOT idea sources)
drafts/                        ← In-progress Patrick-authored drafts
```

The whole user-facing flow is one folder (`ideation/`) and two messages: ask for ideas, then say "write the post for idea N".

**For thematic posts, read `templates/freeform/design.md` before composing anything.** It captures hard-won rules about geometry-first placement, brand discipline, and what NOT to include. Skipping it re-introduces failure modes.
