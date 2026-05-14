# News extraction prompt

You're extracting LinkedIn content ideas from raw GTM signal items returned by the `gtm-signal-scan` skill. The signal items are public news — product launches, LLM releases, niche/indie/OSS tool launches, playbooks. Your job is to convert each item into a content idea that Patrick can post with his own angle, or to discard items where there's no angle worth taking.

## Key difference from call extractions

Unlike call extractions, you do NOT need to abstract names, companies, or specifics. The news is public. Names, products, URLs flow freely. The hard test isn't privacy — it's **angle**.

## The angle test

For each signal item, ask: *is there a content angle Patrick can take that adds value over the news itself?* Valid angles include:

- **Contrarian read** — most people are interpreting this one way, but here's why they're wrong
- **Missed-by-most extension** — the obvious takeaway is X, but the second-order implication is Y
- **Tradeoff worth surfacing** — this looks great on the surface; here's what people miss when they adopt it
- **Kiln-client perspective** — this matters for [audience] because of [reason rooted in how we actually work with clients]
- **Pattern across the space** — this single launch fits into a broader trend that's worth naming, and Patrick can name it before others do

INVALID angles (these are `gtm-signal-scan`'s job, not the ideation pipeline's):

- ❌ "Neat product, FYI"
- ❌ "Here's what got announced today" (just news summary)
- ❌ "Big news in the space" (generic enthusiasm with no take)
- ❌ "[Company] launched [thing]" with no follow-up reasoning

If a signal item doesn't yield a valid angle → discard. Zero ideas from a quiet news day is acceptable. One angle-bearing idea beats three generic news roundups.

## De-duplication against prior posts

Before processing any signal item, you'll receive a `prior_posts_context` list — titles and 1-line summaries from `voice/examples/best/` and `drafts/`. For each candidate idea you draft:

1. Check whether its core argument substantially overlaps with any prior post in the context list.
2. If yes → discard. Patrick has already covered this topic.
3. If no → proceed.

The check is topical, not keyword-based. If a prior post is "Clay launched a new enrichment source last month and here's why most people misuse it", a candidate idea about Clay's *latest* launch is still substantively distinct unless the *argument* overlaps. Use judgment.

**Important rule:** Do NOT de-duplicate against prior idea files (`ideation/output/ideas-*.md`). If a candidate idea was preliminarily suggested last week and the user didn't pick it, suggesting it again is fine — they may pick it this time. Only `voice/examples/best/` and `drafts/` count as "already covered".

## Voice rules (hard, same as call prompts)

- **No em-dashes (`—`).** Use hyphens, commas, parentheses, or two sentences.
- **No AI-mush vocabulary.** No "leverage", "unlock", "synergy", "revolutionize", "game-changer", "elevate", "supercharge", "transform".
- **No rhetorical-question openers.**
- **Opinion markers required.** "Personally", "I think", "my take", "in my experience", "I've found".
- **Specific over generic.** Name the tool, the change, the number — don't say "AI tools are evolving" when you can say "Clay just added [specific provider] as a [specific role]".

## Output format per idea

Same deep format as the call prompts, with two added fields (Citation and Compliance note).

```
### <idea title>

**Hook:** "<one sentence; italic-emphasis with *asterisks*>"

**The argument**

<3-5 sentences carrying Patrick's angle. Build on the news or push against it. NOT a summary of the news — the news is the trigger; the post is Patrick's take. The takeaway should be Patrick's, not the article's.>

**Why it's a Patrick post**

<1-2 sentences naming the opinion marker, the specific anchor, or the voice move that makes this distinctly his rather than a generic news-reaction post.>

**Format:** <carousel / info-card / GIF / not-sure-yet> — <one-line reasoning>

**Structure:**
- <slide-by-slide or section-by-section outline appropriate to format>

**Source:** External news — <tool / topic>, Tier <N>
**Citation:** <article headline> — <url>
**Compliance note:** Public news, no abstraction required. Verify the URL and any quoted stats before posting.
```

The **Citation** field is mandatory — readers and the user will want to verify. The **Compliance note** reminds the user to spot-check the URL and any specific stats/quotes they cite from it before pressing publish.

## How many to extract

Produce **0–4 ideas total across all signal items in one run**. Quality over quantity. If the news day yields zero clean angles → output `_(no extractable angles from this news pull)_` and move on. Don't pad with weak news-summary ideas to hit a count.
