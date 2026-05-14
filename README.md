# LinkedIn Content Bot

Patrick's LinkedIn content system for The Kiln. Brand assets, voice docs, draft library, a static carousel generator, and an animated-media (GIF / MP4) pipeline. The repo is designed to be operated entirely from Claude Code — open the project, ask for a deck or a GIF, and the conventions in this file plus the per-folder READMEs let Claude render it correctly without further hand-holding.

## What's in here

```
brand/
  README.md                    Binary-switch convention (legacy vs exploration directions)
  brand-legacy.md              Editorial direction — white bg, bold sans, 3D icons, doodles
  brand-exploration.md         Atmospheric direction — gradients, Lora italic, monoline accents
  specs.md                     Canvas dimensions + asset-resolution rules (applies to both)
  colors-legacy.json
  colors-exploration.json
  assets/
    legacy/                    3D icons, doodles, logos, Patrick photo
    exploration/               gradients, monoline doodles, topographic texture

voice/
  voice.md                     Patrick's writing voice (style + structural moves)
  pov.md                       Recurring positions on topics
  writers.md                   Style exemplars + anti-exemplar
  examples/best/               8 canonical Patrick-authored posts (primary source of truth)

drafts/                        Posts in progress (Patrick-authored)

templates/
  legacy/
    carousel/                  Static carousel generator (Node + Puppeteer → PNG)
                               Renders 1080×1350 slides with cover/content/CTA layouts
                               Supports screenshots, 3D illustrations, logos, flowcharts,
                               artistic logo layouts. Full docs in its README.
  exploration/
    card-statement.html        Single statement card (atmospheric direction)

animations/                    Animated media (GIF + MP4) via HyperFrames
  cover-animation/             Title-card animation example
  flowchart-animation/         Standalone flowchart GIF example
  Each project has its own design.md with the formal-motion rules.

landing-mock/                  Standalone landing page prototype (separate concern)
```

## The two output formats

| Format | Tool | Output | When to use |
|---|---|---|---|
| **Static carousel** (multi-slide deck) | `templates/legacy/carousel/` | PNGs (1080×1350 per slide) | Long-form thought posts. The Claude-vs-Clay deck is the worked example. |
| **Animated media** (single GIF or MP4) | `animations/` (HyperFrames) | `.gif` and `.mp4` | One-off media to sit alongside a Patrick-authored LinkedIn caption. NOT a slide in a deck. |

These are deliberately separate. GIFs are never embedded in carousels and carousels are never animated. Each format has its own register and structural rules. See the per-format docs.

## Required setup (one-time, per machine)

1. **Node.js ≥ 22** — both the carousel generator and HyperFrames need this.
   ```
   node --version  # should be v22 or higher
   ```
2. **FFmpeg + FFprobe** — required for HyperFrames rendering. The brew formula pulls a lot of codec deps; a static binary is simpler:
   ```
   curl -sL "https://evermeet.cx/ffmpeg/getrelease/zip"          -o /tmp/ff.zip && unzip /tmp/ff.zip -d /tmp && mv /tmp/ffmpeg  /opt/homebrew/bin/
   curl -sL "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip"  -o /tmp/fp.zip && unzip /tmp/fp.zip -d /tmp && mv /tmp/ffprobe /opt/homebrew/bin/
   chmod +x /opt/homebrew/bin/ffmpeg /opt/homebrew/bin/ffprobe
   ```
3. **HyperFrames skill bundle for Claude Code** — gives Claude the SKILL.md and patterns it needs to author motion compositions:
   ```
   GIT_LFS_SKIP_SMUDGE=1 npx skills add heygen-com/hyperframes --yes --global
   ```
   (The `GIT_LFS_SKIP_SMUDGE=1` skips the LFS test fixtures so you don't need `git-lfs` installed.)
4. **OpenAI API key** (optional — only needed to generate *new* 3D illustrations). Drop into `templates/legacy/carousel/.env` (gitignored):
   ```
   OPENAI_API_KEY=sk-proj-...
   ```
   The existing illustrations are committed, so you can render the existing deck without this.

That's it. Carousel and animation projects each `npm install` their own deps on first run.

## Quick start

### Re-render the existing Claude-vs-Clay carousel deck

```
cd templates/legacy/carousel
npm install
node generate.js inputs/claude-vs-clay.json
open output/claude-vs-clay/*.png
```

7 PNGs (cover, 5 content, CTA) at 2160×2700 each. No network, no OpenAI credits — all assets are committed.

### Re-render an existing animation

```
cd animations/flowchart-animation
npx hyperframes render --quality draft --output renders/flowchart.mp4
ffmpeg -i renders/flowchart.mp4 -vf "fps=15,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 renders/flowchart.gif
open renders/flowchart.gif
```

### Create a new piece of content

In Claude Code, open this repo and say what you want, e.g.:
- *"Create a 6-slide carousel from drafts/<filename>.md"*
- *"Animate a standalone GIF showing X → Y → Z"*
- *"Use the scattered logo layout for the enterprise tools slide"*

Claude will pick up the conventions from this README + the per-folder READMEs + voice/voice.md and produce on-brand output.

## The conventions Claude needs (don't violate)

These are the constraints that make the output feel like Patrick / The Kiln rather than generic AI content:

### Brand direction is binary
Every asset picks `legacy` or `exploration`. The default for both carousels and animations is `legacy`. Never mix them in the same piece. `brand/README.md` is the source of truth.

### Voice rules (hard, override `voice.md`)
- **No em-dashes (`—`).** Hyphens, commas, parentheses, two sentences — anything but em-dashes. Em-dashes read as AI-generated and Patrick doesn't want them.
- **No AI-mush vocabulary.** No "leverage", "unlock", "synergy", "revolutionize", "game-changer". Anything that could be in a generic SaaS landing page.
- **No rhetorical-question openers.** Hooks state a claim, then a colon.
- **Pull from drafts when possible.** When Patrick has already written the post, the carousel/GIF copy is a faithful compression of his prose — not a rewrite. Re-wording for "clarity" is the fastest path to AI-isms.
- **Opinion markers required.** "Personally", "I think", "My X" — at least one per piece.
- **Specific over generic.** Tool names, dollar amounts, named people > vague references.

See `templates/legacy/carousel/README.md` → "Writing slide copy" for the full voice section.

### No-slop visual heuristic
Every visual has to earn its space. If a 3D illustration is the default just because the slide needs "something", it's slop. Pick the asset type by what's most informative:

| Slide topic | First-choice visual |
|---|---|
| Naming specific brands | Logo cards or artistic logo layouts (scattered / notes) |
| Describing a product or UI | Website screenshot (`lib/screenshot-site.js`) |
| A list of systems or integrations | Tool-card row or scattered-logo layout |
| A process or sequence of steps | Flowchart |
| Abstract concepts (power, trust, speed) | Generated 3D illustration |
| A verdict, tradeoff, decision moment | Generated 3D illustration |
| Cover / CTA | 3D icon + doodle flanking (carousel) OR clean editorial (animation) |

### Motion register for animations is editorial, not playful
- No `back.out` overshoot eases
- No scale animations on text or CTAs
- No rotation on entrances
- No Fluent-3D claymation icons in motion (the 3D vocabulary belongs to static carousels)
- No hand-drawn doodles in motion (same reason)
- Use `power2.out` / `power3.out`; entries via opacity + small (12–24px) vertical translates; subtle wipes via `scaleX from 0` only

See `animations/cover-animation/design.md` and `animations/flowchart-animation/design.md`.

### Standalone media vs carousel slide
Animations are standalone LinkedIn media — they post as a single piece alongside Patrick's text caption. They are NOT slides in a carousel. So:
- No `STEP N` labels on animations
- No cream `Next step →` footer on animations
- The Kiln lockup is a small watermark on animations (not a full footer band)
- The whole story has to read in one frame

## Workflows in detail

### Carousel deck workflow

1. Patrick writes a draft post in `drafts/<slug>.md` (his voice, his structure)
2. In Claude Code: *"Make a carousel from drafts/<slug>.md"*
3. Claude picks asset types per slide using the no-slop heuristic (logos / screenshot / illustration / flowchart / artistic logo layout)
4. Claude pulls copy directly from the draft, removing em-dashes, keeping opinion markers
5. New logos auto-fetched via `lib/fetch-logo.js` if not in `captures/logos/`
6. New illustrations generated via `lib/gen-illustration.js` if needed (gpt-image-1, ~$0.17 each)
7. `node generate.js inputs/<slug>.json` produces PNGs
8. Patrick reviews; iterate

Full schema + helpers documented in `templates/legacy/carousel/README.md`.

### Animation workflow

1. Pick a topic that benefits from motion (a process, a build-up, a reveal)
2. In Claude Code: *"Make a standalone GIF showing X"*
3. Claude scaffolds a new project under `animations/<slug>/` via `npx hyperframes init`
4. Claude reads `animations/cover-animation/design.md` or `animations/flowchart-animation/design.md` to inherit motion rules
5. Authors `index.html` (1080×1350, GSAP timeline, no overshoots, no 3D icons in motion)
6. `npx hyperframes lint && npx hyperframes render --quality draft --output renders/<slug>.mp4`
7. Convert to GIF via the FFmpeg one-liner above
8. Patrick reviews; iterate

## For team members joining this repo

If you're a Kiln teammate picking this up in Claude Code:

1. **Clone the repo and open it in Claude Code.** Run the one-time setup above (Node, FFmpeg, HyperFrames skill).
2. **Don't ask Claude to generate ideas from scratch.** This system is a *production* tool, not an ideation tool. The hook and opinions come from Patrick's drafts under `drafts/` or his voice doc under `voice/voice.md`. Claude's job is to render those into polished artifacts.
3. **When in doubt, read the per-folder READMEs first.** `templates/legacy/carousel/README.md` is the deepest one — it has the full carousel schema, voice rules, prompt templates, and a "session learnings" log with brand-specific quirks (which logos don't capture cleanly, which AI illustrations need invert, etc.).
4. **Ask Claude to read it back at you.** Before authoring, *"summarize the carousel schema and voice rules so I can verify you're aligned"* — saves you a re-render cycle.
5. **Use existing artifacts as references.** `inputs/claude-vs-clay.json` shows every component type in use. `animations/flowchart-animation/index.html` shows the motion-register pattern. Point Claude at them.
6. **Never reach for em-dashes, "leverage", or claymation icons in motion.** These are the three most common ways the output stops feeling like Patrick.

## What's still rough / known to-dos

- The `exploration/` direction has only a single-card template — no equivalent carousel or animation generator.
- HubSpot, Salesforce, and a few other major-brand logo captures fail (see `templates/legacy/carousel/captures/logos/registry.json` and the "Session learnings" section of the carousel README for why and what to try next).
- `gpt-image-2` exists but requires OpenAI org verification; we use `gpt-image-1` today.
- No automated brand-consistency linter yet — voice and visual rules are enforced by convention + human review, not by tooling.
