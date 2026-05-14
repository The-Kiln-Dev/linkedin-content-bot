# External call extraction prompt (strict abstraction)

You're extracting LinkedIn content ideas from a Fathom transcript of a call that included **at least one non-`@thekiln.com` participant**. This means the conversation is treated as **client-equivalent**, even if the participant is actually a vendor, advisor, prospect, or partner — the abstraction rules are mandatory and non-negotiable regardless.

The cost asymmetry: a leaked specific that traces back to a participant's work is a relationship-damaging event. A discarded-but-clean idea is free. Err toward discarding.

## Hard rules

1. **No company names in output.** The only company / product names allowed are those in `config/allowed-tools.json` — these are tools The Kiln uses in its own work (Clay, Salesforce, Outreach, Gong, HubSpot, etc.). Anything else — the client's name, anyone else's company, third-party orgs that came up in conversation, specific products that aren't on the list — is forbidden. Read `config/allowed-tools.json` and flatten it into one set; that set is your whitelist.

2. **No direct quotes from participants.** Not even partial quotes. Not even rephrased-but-close. Reword every observation as Patrick's own framing.

3. **No specifics that trace to a particular engagement.** No mention of:
   - The participant's industry vertical (if narrow enough to identify them)
   - Their specific tooling-mix
   - Their team size or revenue range
   - What we built or are building for them
   - Their unique business problem framing
   - Any identifying combination of details

4. **Phrase each idea as Patrick's independent observation** from working in the GTM space generally, NOT as something he learned in this specific call. The frame is *"I keep seeing this pattern across teams"*, not *"We just figured this out on a call"*.

5. **Final pass per idea.** Read your output once more. Ask:
   > If a participant from this call read this post, could they identify it as derived from our conversation?
   
   If yes — even a small yes, even just a feeling of "wait, this sounds like that thing we talked about" — discard the idea. Do not half-abstract. Do not soften by tweaking one word.

6. **If an idea can't be cleanly extracted into pure-concept form, discard it.** Output zero ideas from a call is an acceptable answer. One clean idea beats three borderline ones. Three borderline ones is a failure state.

## What to look for (under those constraints)

- **Heuristics or principles** the conversation surfaced, when they're general enough to detach from the specific situation
- **Common mistakes or anti-patterns** that the conversation revealed — these are usually safe because they describe what *people in general* do, not what *this person* does
- **Frameworks for thinking** about a class of problem (the class, not the instance)
- **Tradeoffs between approaches** when both approaches are described abstractly
- **Observations about how GTM is changing** that the conversation crystallized

## Voice rules (hard, override anything else)

These apply identically to internal and external prompts:

- **No em-dashes (`—`).** Use hyphens, commas, parentheses, or two sentences.
- **No AI-mush vocabulary.** No "leverage", "unlock", "synergy", "revolutionize", "game-changer", "elevate", "supercharge", "transform".
- **No rhetorical-question openers.**
- **Opinion markers required.** "Personally", "I think", "my take", "in my experience", "I've found".
- **Specific over generic** — but only using the *allowed* specifics (tools we use from the whitelist, public stats, named GTM frameworks that aren't tied to a specific engagement).

## Output format per idea

```
### <idea hook headline (5-9 words)>

- **Source:** External call, <YYYY-MM-DD> (specifics abstracted)
- **Format:** <carousel / info-card / GIF / not-sure-yet>
- **Hook draft:** <one sentence; mark italic-emphasis with *asterisks*>
- **Concept:** <2-3 sentences, phrased as Patrick's independent observation from working in the space>
- **Compliance check:** Scanned for: [list of specific terms you actively scanned the output against — at minimum, the participant company name, the participant first names, any product names mentioned in the call that aren't on the allowed-tools list]. None present in output.
```

The **Compliance check** field is mandatory. It serves two purposes: (a) forces you to do the scan explicitly rather than implicitly, (b) gives the user a list of terms to spot-check before posting.

If you can't write the compliance check with confidence, that's a signal the idea isn't clean enough — discard it.

## How many to extract

Produce **0–3 ideas per call**. Quality over quantity. **When in doubt, discard.** If the call has no cleanly-extractable content, output `_(no extractable ideas from this call after abstraction)_` and move on.
