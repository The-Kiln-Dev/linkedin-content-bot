---
name: linkedin-content-bot
description: LinkedIn content system for The Kiln. Produces on-brand LinkedIn assets — multi-slide carousels (PNG), single dense info-cards (PNG), and standalone animations (GIF / MP4) — from a draft, a finished post, or a fresh idea pulled from the user's recent Fathom calls and recent GTM news. Use whenever the user asks for "a LinkedIn post", "a carousel", "an info-card", "a GIF for LinkedIn", "what should I post about", "content ideas", "make a deck for The Kiln", "render this draft", or hands over a finished post and asks for the asset. Handles the full pipeline: ideation → format selection → JSON input → render → caption pairing. Enforces the non-negotiable voice rules (no em-dashes, no AI-mush vocabulary, no rhetorical-question openers, opinion markers required, specific over generic) and brand-direction defaults (carousels + info-cards → exploration; animations → legacy). Do NOT use for non-LinkedIn content, general copywriting, or other clients — this is locked to The Kiln's brand and Patrick's voice.
---

# LinkedIn Content Bot — Team Skill

This skill is the team entry point to the LinkedIn content system for The Kiln. It produces three formats — **carousels** (multi-slide PNGs), **info-cards** (single dense PNG), and **animations** (GIF / MP4 via HyperFrames) — all on-brand for The Kiln and in Patrick's voice.

It runs the full pipeline: **ideation** (from Fathom calls + GTM news) → **format selection** → **JSON input** → **render** → **caption pairing**.

The deep how-to lives in the repo's README and the per-folder READMEs. This SKILL.md handles routing, enforces the universal rules, and tells you which in-repo doc to read for each branch.

---

## Step 0 — Locate the repo and verify setup

The skill is installed via `npx skills add patspy2364/linkedin-content-bot --yes --global`, which clones the repo into `~/.claude/skills/linkedin-content-bot/`. Everything the generators need — brand assets, voice docs, drafts, templates, animations — is in that folder.

**Resolve the repo root** in this order:

1. If the current working directory is already inside a `linkedin-content-bot` clone, use that.
2. Else use `~/.claude/skills/linkedin-content-bot/` (the skills-CLI install location).
3. Else check `~/Documents/Claude Code Projects/linkedin-content-bot/` (Patrick's local clone — only relevant for Patrick).
4. If none exist, tell the user: *"The LinkedIn content repo isn't installed. Run `npx skills add patspy2364/linkedin-content-bot --yes --global` and then come back."* Stop.

Once resolved, **`cd` into that path** and read its `CLAUDE.md` and `README.md` — they are the authoritative spec. This SKILL.md is the team-facing wrapper; the in-repo docs hold the per-format detail.

**One-time setup** (only run if any of these are missing — check first, don't reinstall blindly):

1. **Node ≥ 22** — `node --version`
2. **Deps installed** — check for `node_modules/` at repo root; if missing, run `npm install` from the repo root.
3. **FFmpeg + FFprobe** — required for animations. Test with `ffmpeg -version`. If missing, install via the static-binary one-liner in the repo README (`### Required setup` section).
4. **HyperFrames skill** — required for animations. Test by checking if `npx hyperframes --version` works, or look for `hyperframes` in the available-skills list. If missing: `GIT_LFS_SKIP_SMUDGE=1 npx skills add heygen-com/hyperframes --yes --global`.
5. **OpenAI API key** — only needed when *generating new doodles or illustrations*. Existing assets render without it. Lives in `.env` at repo root (gitignored — each teammate adds their own).

If a setup step is missing for the user's current intent (e.g. they want a GIF but ffmpeg isn't installed), surface that before doing anything else.

---

## Step 1 — Classify the user's intent

There are four entry points. Read the user's request and pick:

| User says | Intent | Go to |
|---|---|---|
| "what should I post about", "content ideas", "what's brewing", "run ideation" | **Ideation** | Step 2A |
| "make a carousel from drafts/X.md", "render this draft", "turn this draft into a deck" | **Draft → asset** | Step 2B |
| Pastes a multi-paragraph post; says "here's my post", "generate the asset", "make this into a carousel" | **Finished-post → asset** | Step 2C |
| "re-render the sample", "render inputs/X.json", a specific JSON path | **Direct render** | Step 2D |
| "make a GIF showing X", "animate a flowchart of Y" | **Animation** | Step 2E |

If ambiguous, ask one short clarifying question. Default to ideation if the user is open-ended about "I want to post something this week."

---

## Step 2A — Ideation

Hand off to the in-repo ideation skill at `ideation/SKILL.md`. Read it and follow it exactly — it covers Fathom-MCP setup verification, the 7-day call pull, internal-vs-external classification, transcript extraction, the 72-hour GTM news pull (via the `gtm-signal-scan` global skill), de-duplication against prior posts, and the unified ideas-file output at `ideation/output/ideas-YYYY-MM-DD.md`.

Key callouts from that flow:

- **Fathom MCP must be connected.** If not, walk the user through connecting it via the MCP registry. Don't fabricate meetings.
- **`gtm-signal-scan` global skill is the news source.** If not installed, proceed with calls only and tell the user news is being skipped.
- **External calls run under strict privacy rules** — no company names except those on `ideation/config/allowed-tools.json`.
- After writing the file, summarize 2–3 strongest hooks in chat and ask: *"Which idea do you want to act on? Want me to write the post, or describe it more so you write it?"*

The full step-by-step (Steps 1–8) is in `ideation/SKILL.md`. Do not duplicate that logic here — read it.

---

## Step 2B — Draft → asset

The user already has a draft at `drafts/<slug>.md` and wants it rendered.

1. Read the draft. Understand its shape (single beat, list of N points, dense stats, etc.) — see the format heuristic below.
2. **Pick the format:**
   - List of N points with explanations → **carousel** (one slide per point)
   - Content with a visual metaphor that carries the argument → **freeform thematic** (`templates/freeform/`)
   - Dense stats / comparisons / patterns → **info-card** — but see the standing preference below
   - Single beat / one central insight / process reveal → **animation**

   **Standing preference (Patrick, Aug 2026): freeform thematic over info-card for most single-image posts.** Thematic cards look significantly better and add more value. Only fall back to the info-card when the content is irreducibly tabular (a true cheat sheet or benchmark table with no workable visual metaphor). When in doubt, go freeform — read `templates/freeform/design.md` first.
3. Confirm the format with the user before generating, unless it's obvious.
4. Build the JSON input. Schema lives in:
   - Carousel: `templates/exploration/carousel/README.md` + sample `templates/exploration/carousel/inputs/sample-outbound.json`
   - Info-card: `templates/exploration/info-card/README.md` + sample `templates/exploration/info-card/inputs/outreach-cheatsheet.json`
   - Animation: `animations/<existing>/design.md` + `animations/<existing>/index.html` as references
5. **Pull copy directly from the draft.** Don't paraphrase. Re-wording for "clarity" is the fastest path to AI-isms.
6. Run the generator (see Step 3). Iterate if the validator fails (see "When the validator fails" below).
7. Deliver: rendered asset + the original draft text as the LinkedIn caption.

---

## Step 2C — Finished post → asset

The user has written a finished LinkedIn post and wants the visual asset.

This is **Step 8 of `ideation/SKILL.md`** — read that section in full and follow it. Summary:

1. Read the post. Identify its shape (visual metaphor → freeform thematic; N points → carousel; single beat → GIF; irreducibly tabular data → info-card). Standing preference: freeform thematic over info-card for most single-image posts.
2. Confirm or infer the format. Surface inference briefly; don't wait if obvious.
3. Build the JSON input using the **post's actual phrasing** — italic-emphasis hook becomes cover title; body points become content slides; final line becomes CTA hook.
4. Generate concept-specific spots if needed (`templates/exploration/carousel/lib/gen-spot.js` — Recraft brand style; `gen-doodle.js` is the OpenAI fallback).
5. Run the generator. **If the validator fails, restructure before dropping content** — see "When the validator fails" below.
6. Deliver: post caption (their text, untouched) + path to the generated asset + rendered output inline.
7. Save the input JSON alongside the output so the user can re-render.

---

## Step 2D — Direct render

The user has a specific JSON input and wants it rendered now.

From the repo root:

```bash
# Carousel (default — exploration direction)
npm run render:carousel -- <path/to/input.json>

# Info-card (exploration direction)
npm run render:info-card -- <path/to/input.json>

# Legacy carousel (alternate direction — only if explicitly asked)
npm run render:legacy-carousel -- <path/to/input.json>
```

Output lands in `templates/<direction>/<format>/output/<slug>/`. Show the user the path + open the PNGs.

---

## Step 2E — Animation

GIFs and MP4s use HyperFrames, not the Node generators. The `hyperframes` global skill is the authoritative source for motion-composition authoring — read its SKILL.md.

The The-Kiln-specific motion register lives in `animations/cover-animation/design.md` and `animations/flowchart-animation/design.md`. **Read at least one of those before authoring** — they encode the editorial-not-playful constraint.

The workflow:

1. Pick a topic that benefits from motion (a process, a build-up, a reveal — not a multi-point list).
2. Scaffold a new project: `cd animations/<slug> && npx hyperframes init`
3. Read `animations/<existing>/design.md` to inherit motion rules.
4. Author `index.html` (1080×1350, GSAP timeline, no overshoots, no 3D icons in motion, no doodles in motion — see the motion register below).
5. Lint + render:
   ```bash
   npx hyperframes lint
   npx hyperframes render --quality draft --output renders/<slug>.mp4
   ```
6. Convert to GIF (FFmpeg one-liner from repo README).
7. Deliver: GIF + caption.

---

## Step 3 — Run the generator (carousels + info-cards)

From the repo root:

```bash
# Carousel
npm run render:carousel -- templates/exploration/carousel/inputs/<slug>.json

# Info-card
npm run render:info-card -- templates/exploration/info-card/inputs/<slug>.json
```

The info-card generator has a pre-flight `validateInput` step that fails if content won't fit. See "When the validator fails" below.

---

## When the validator fails

**The information is the point; the layout bends to fit it.** Don't silently drop content. Try restructures in this order, re-running the validator after each:

1. **Compress section copy** — shorter body text, shorter cell content. Information stays; wording tightens.
2. **Change column count** — a 2-column stat-grid with 4 items can become a 4-column stat-grid (single row, much shorter vertically).
3. **Reformat section types** — same content, different container. A stat-grid with 6 items might fit better as a comparison-table with 6 rows.
4. **Merge related sections** — two thematically-overlapping sections combine into one.
5. **Last resort — drop, and only with explicit user consent.** Ask: *"I tried restructuring and the content still won't fit. The lightest cut would be X — OK to drop it, or do you want a different cut?"*

---

## Universal rules (never violate, regardless of branch)

### Voice rules (hard — override anything in `voice/voice.md` that conflicts)

- **No em-dashes (`—`).** Use hyphens, commas, parentheses, or two sentences. Em-dashes read as AI-generated.
- **No AI-mush vocabulary.** No "leverage", "unlock", "synergy", "revolutionize", "game-changer", "elevate", "supercharge", "transform". Nothing that could appear in a generic SaaS landing page.
- **No rhetorical-question openers.** Hooks state a claim, then a colon or comma.
- **Opinion markers required.** At least one "personally", "I think", "my take", "in my experience", "I've found" per piece.
- **Specific over generic.** Name tools, dollar amounts, named people, concrete examples. Vague references are slop.
- **Pull from drafts when possible.** When the user has already written the post, the carousel/GIF copy is a faithful compression of their prose — not a rewrite.

### Brand direction (binary — never mix)

- **Carousels + info-cards → `exploration`** (default), v2 "Ink & Kiln" execution: grained paper canvas, glaze-dip gradient band, hand-drawn ink structure (`templates/craft/craft.js`), Fraunces scale drama with hand-marked emphasis, thick marker spots. See the v2 note atop `brand/brand-exploration.md`.
- **Animations → `legacy`** (default). Clean editorial register, no 3D icons in motion, no doodles in motion.
- Per-format defaults live in `brand/README.md` — that file is the source of truth.
- **Only use assets from the matching direction folder.** Don't pull an `exploration/` doodle into a `legacy/` template.
- **Author attribution (Patrick + photo) is legacy-only.** Never on exploration assets.

### No-slop visual heuristic (when picking what goes on a slide)

| Slide topic | First-choice visual |
|---|---|
| Naming specific brands | Logo cards or artistic logo layouts (scattered / notes) |
| Describing a product or UI | Website screenshot (`templates/legacy/carousel/lib/screenshot-site.js`) |
| A list of systems or integrations | Tool-card row or scattered-logo layout |
| A process or sequence of steps | Flowchart |
| Abstract concepts (power, trust, speed) | Generated 3D illustration (legacy) or thick marker spot via `lib/gen-spot.js` (exploration) |
| A verdict, tradeoff, decision moment | Generated 3D illustration |
| Cover / CTA | 3D icon + doodle flanking (carousel) OR clean editorial (animation) |

If a visual is the default just because the slide needs "something", it's slop. Pick by what's most informative.

### Motion register (animations only)

- No `back.out` overshoot eases. Use `power2.out` / `power3.out`.
- No scale animations on text or CTAs.
- No rotation on entrances.
- No Fluent-3D claymation icons in motion (3D vocabulary belongs to static carousels).
- No hand-drawn doodles in motion.
- Entries via opacity + small (12–24px) vertical translates; subtle wipes via `scaleX from 0` only.

### System, not template

Different slides in one deck can use different layouts based on what each slide is trying to communicate. The shared chassis (gradient frame, typography, brand colors) is what holds the deck together — the per-slide layout is open. When new content needs a layout the shipped slide types don't cover, **add a new slide-type renderer** rather than bending content into an existing type. See `templates/exploration/carousel/README.md` → "System, not template" for the extension pattern.

---

## Repo orientation (where to read for deeper detail)

```
linkedin-content-bot/
├── SKILL.md                          ← this file (team entry point)
├── CLAUDE.md                         ← in-repo Claude instructions (auto-loaded inside the repo)
├── README.md                         ← full system overview, setup, workflows
│
├── ideation/
│   ├── SKILL.md                      ← Step 2A authority — ideation flow (8 steps)
│   ├── prompts/                      ← internal-call / external-call / news extraction prompts
│   ├── config/allowed-tools.json     ← whitelist for external-call abstraction
│   └── output/                       ← ideas-YYYY-MM-DD.md files
│
├── brand/
│   ├── README.md                     ← brand direction defaults (binary switch)
│   ├── specs.md                      ← canvas dims + resolution rules
│   ├── brand-legacy.md               ← legacy direction guide
│   ├── brand-exploration.md          ← exploration direction guide
│   └── assets/{legacy,exploration}/  ← logos, doodles, illustrations, textures
│
├── voice/
│   ├── voice.md                      ← Patrick's writing voice (style + structural moves)
│   ├── pov.md                        ← recurring positions
│   ├── writers.md                    ← style exemplars
│   └── examples/best/                ← 8 canonical Patrick-authored posts
│
├── drafts/                           ← Patrick-authored drafts (NOT idea sources)
│
├── templates/
│   ├── exploration/carousel/         ← Step 2B/2C carousel — schema in README, lib/ for helpers
│   ├── exploration/info-card/        ← Step 2B/2C info-card — schema in README, validateInput pre-flight
│   └── legacy/carousel/              ← alternate direction (only when user explicitly asks)
│
└── animations/                       ← Step 2E — HyperFrames projects, design.md per project
```

When in doubt, read the per-folder README before authoring. `templates/exploration/carousel/README.md` and `templates/exploration/info-card/README.md` are the deepest — they have the full schema, prompt templates, and quirks. Ask Claude to read the schema back before generating if the format is new to you.

---

## Don't

- Don't riff on `voice/pov.md`, `voice/voice.md`, or `voice/examples/best/` to come up with topic ideas. Those are style references, not idea sources. Run the ideation skill (Step 2A) for ideas.
- Don't pull from `drafts/` as an idea source. Those are works-in-progress; treat them as inputs to Step 2B only.
- Don't fabricate meetings, news items, or transcripts. If a source is empty, surface that.
- Don't apply the internal-call prompt to a call with any non-`@thekiln.com` participant. Email domains are the rule.
- Don't mix brand directions within one piece. Pick legacy or exploration; stick with it.
- Don't reach for em-dashes, "leverage", or claymation icons in motion. These are the three most common ways the output stops feeling like Patrick.
- Don't silently drop content when the validator fails. Restructure first; drop only with explicit consent.
- Don't use this skill for non-Kiln work or generic copywriting. It's locked to Patrick's voice and The Kiln's brand.
