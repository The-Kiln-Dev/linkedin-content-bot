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

- **"Write the post"** → you generate the LinkedIn caption + the JSON input + run the appropriate generator (`templates/exploration/carousel/`, `templates/exploration/info-card/`, or hand off to HyperFrames). You deliver the rendered asset and the caption together.
- **"Describe it more"** → you give a longer treatment (argument expanded, alternative hooks, alternative format approaches), the user writes the post offline, and they return with finished text. At that point, Step 8 takes their text and generates the asset.

If the asset generator's validator fails (info-card content overflow, etc.), **restructure content to preserve information before dropping anything**. Try in order: compress copy → change column count → reformat section types → merge related sections. Only as a last resort drop content, and only with explicit user consent. The information is the point; the layout bends to fit it.

## Voice rules (apply to every generated piece)

Per `voice/voice.md` and the top-level README. Non-negotiable across all output:

- **No em-dashes (`—`)** — use hyphens, commas, parentheses, or two sentences
- **No AI-mush vocabulary** — no "leverage", "unlock", "synergy", "revolutionize", "game-changer", "elevate", "supercharge", "transform"
- **No rhetorical-question openers** — hooks state a claim, then a colon or comma
- **Opinion markers required** — at least one "personally", "I think", "my take", "in my experience", "I've found" per piece
- **Specific over generic** — name tools, dollar amounts, named people, concrete examples

## Brand direction

Carousels and info-cards default to the **exploration** direction (gradient frame + topographic texture, Fraunces italic-emphasis, cream/white panels, single-accent discipline). Per-format defaults live in `brand/README.md` — that file is the source of truth.

The visual language across both generators is locked: same gradient frame, same Fraunces serif, same italic-emphasis-on-key-phrase pattern, same single-accent-color rule. Don't deviate from these in generated assets.

## Repo orientation

```
ideation/                      ← Content idea generation (the entry point)
  SKILL.md                     ← The flow Claude follows
  prompts/                     ← Internal-call / external-call / news extraction prompts
  config/allowed-tools.json    ← Whitelist of company/tool names allowed in abstracted output

templates/
  exploration/carousel/        ← Multi-slide PNG generator (default for carousels)
  exploration/info-card/       ← Single dense PNG generator (with validateInput pre-flight)
  legacy/carousel/             ← Alternate b&w direction (not default; explicit opt-in)

animations/                    ← HyperFrames GIF/MP4 (separate workflow)

brand/                         ← Visual language rules
voice/                         ← Style + tone references (NOT idea sources)
drafts/                        ← In-progress Patrick-authored drafts
```

The whole user-facing flow is one folder (`ideation/`) and two messages: ask for ideas, then say "write the post for idea N".
