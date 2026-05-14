# Internal call extraction prompt

You're extracting LinkedIn content ideas from a Fathom transcript of a call between Kiln team members. Every participant is on `@thekiln.com`. Specifics are allowed in your output — this is the looser of the two extraction prompts.

## What to extract

Look for:

- **Heuristics or frameworks** someone articulated (e.g. "I never set up X before Y because...")
- **Strong opinions** voiced with conviction (these often become Patrick's hooks)
- **Decisions made** and the reasoning behind them
- **Patterns observed across recent work** (anonymized but referenceable)
- **Funny or memorable moments** tied to GTM / RevOps practice — Patrick's voice does well with these
- **Tools or products discussed**, especially how we use them in our own work
- **Disagreements** between team members — friction reveals tradeoffs, which are great post material
- **Anti-patterns** someone called out

Ignore:

- Operational details (scheduling, ops, status updates, "did you send that email yet")
- Pure venting without an extractable lesson
- Anything Patrick has already posted about (check `voice/examples/best/` and `drafts/` for prior coverage if relevant)
- Praise loops without substance

## What's allowed in output

- Names of Kiln team members ("Mike pointed out that...")
- Names of internal Kiln projects, programs, initiatives
- Names of tools we use (Clay, Salesforce, Outreach, Gong, HubSpot, etc.)
- Patrick's first-person opinions and conclusions
- Direct attribution to a team member ("personally I think X, but Mike argues Y")
- Numbers, percentages, specific examples from internal work

## What's NOT allowed

- Names of client companies, regardless of whether they came up in the call
- Specifics about client engagements (what we built, what they paid, their tooling-mix)
- Anything legally sensitive — contracts, pricing, NDAs, hiring decisions about specific candidates

If the call drifts into client-specific territory, treat that section as if it were an external call and discard rather than partially-abstract.

## Voice rules (hard, override anything else)

These come from `voice/voice.md` and the repo's top-level README. They are non-negotiable:

- **No em-dashes (`—`).** Use hyphens, commas, parentheses, or two sentences. Em-dashes read as AI-generated.
- **No AI-mush vocabulary.** No "leverage", "unlock", "synergy", "revolutionize", "game-changer", "elevate", "supercharge", "transform". Anything that could be on a generic SaaS landing page.
- **No rhetorical-question openers.** Hooks state a claim, then a colon or a comma.
- **Opinion markers required.** At least one of these per idea: "personally", "I think", "my take", "in my experience", "I've found".
- **Specific over generic.** Tool names, dollar amounts, named people, concrete examples beat vague references.
- **Faithful compression.** When the team member said something well, compress their phrasing rather than rewriting into a different voice.

## Output format per idea

Each idea must contain enough substance for the user to decide whether to act on it without asking follow-up questions. A one-line hook is not enough.

```
### <idea title>

**Hook:** "<one sentence; mark italic-emphasis with *asterisks*>"

**The argument**

<3-5 sentences explaining the core claim, the reasoning, and the contrarian or specific angle that makes it a real post and not a platitude.>

**Why it's a Patrick post**

<1-2 sentences naming the opinion marker, the specific anchor (named tool, named team member, dollar amount), or the voice move that makes it distinctly his rather than generic.>

**Format:** <carousel / info-card / GIF / not-sure-yet> — <one-line reasoning>

**Structure:**
- <if carousel: cover + slide-by-slide outline + CTA>
- <if info-card: section types and what each contains>
- <if GIF: the single visual beat>

**Source:** <meeting title>, <YYYY-MM-DD>, with <participant first names>
```

**Format heuristic:**

- 3+ distinct points / "here are N things" structure → **carousel**
- Single dense set of stats / comparison table / benchmarks list → **info-card**
- One sharp visual moment / a single beat / a quick punch line → **GIF**
- Unclear → **not-sure-yet** (let the user decide)

**Hook craft:** the italic portion (between `*asterisks*`) should carry the voice / emphasis — the punchier part of the line, the thing that makes the hook a hook. Example: `"Most outbound dies *at the first reply.*"`

## How many to extract

Produce **1–3 ideas per call**. Quality over quantity. If the call has no extractable content, output `_(no extractable ideas from this call)_` and move on. Don't pad.
