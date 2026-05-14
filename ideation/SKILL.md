# Ideate from calls (last 7 days)

This skill turns the last 7 days of Fathom call recordings into LinkedIn content ideas. It runs **on-demand**, has **no database**, and writes output to a markdown file in `ideation/output/`. The extraction happens directly in Claude's context — no separate API calls.

## When this skill triggers

Invoke when the user asks for content ideas, "what should I post about this week", "what's brewing", or types `/ideate` (if registered as a slash command). Also valid: anything that implies "look at my recent calls and tell me what to write about."

## The flow

### Step 0 — Verify prerequisites

Before pulling anything, confirm two prerequisites:

**(a) Fathom MCP is connected** — required for call ideas (the internal-data side of the pipeline).
**(b) `gtm-signal-scan` skill is installed** — required for news ideas (Step 4). This is a global Claude Code skill at `~/.claude/skills/gtm-signal-scan/SKILL.md`.

If only one is available, proceed with the available source and skip the other in the output. If neither is available, the whole skill can't run — tell the user what to install and stop.

For Fathom MCP:

To verify: look for Fathom-namespaced tools in your available tool list — `list_meetings`, `get_meeting_transcript`, `search_meetings`, `get_recording_by_url`, etc. If they're present, proceed to Step 1.

If they're **not** present, the user hasn't connected Fathom MCP yet. Help them connect it before doing anything else:

1. Search the MCP registry for Fathom. Use `mcp-registry__search_mcp_registry` with query `"fathom"`, or `mcp-registry__suggest_connectors` with a task like `"content ideation from call recordings"`.
2. Show the user the connector entry and walk them through the install/auth flow. Most MCP connectors in Claude Code need an OAuth sign-in (open browser → authorize Fathom → return to Claude Code).
3. Ask them to restart Claude Code if prompted — the new tools need to register.
4. After they say it's connected, do a test call: `list_meetings` with no filters, just to confirm the tool responds. Even zero results = connected. A tool-not-found error = still not connected, loop back to step 1.
5. Once a `list_meetings` call succeeds, the Fathom side is ready.

Do NOT skip the Fathom check by fabricating meetings or asking the user for transcripts manually. The call-side pipeline assumes Fathom data.

For `gtm-signal-scan`:

1. Check whether `gtm-signal-scan` appears in the available-skills list for this session. If yes, the news side of the pipeline (Step 4) will run.
2. If not, tell the user the skill needs installing (it lives at `~/.claude/skills/gtm-signal-scan/SKILL.md`) and that without it, news ideas will be skipped in this run. Continue with the call side only.

### Step 1 — Pull last 7 days of meetings

Use the Fathom MCP. Call `list_meetings` filtered to meetings ending within the last 7 calendar days from today. For each meeting, capture: meeting ID, title, start time, participant emails, participant names.

If the list is empty, tell the user "no Fathom meetings in the last 7 days — nothing to extract from" and stop. Don't fabricate.

### Step 2 — Classify each meeting

For each meeting, classify by participant email domain:

- If **every** participant email ends in `@thekiln.com` → classify as **internal**
- Otherwise → classify as **external**

External is conservative-default — applies to vendor calls, advisor calls, partner calls, prospect calls, accidentally-recorded personal calls. Not just confirmed-client calls.

**Email resolution** — `list_meetings` returns email addresses for some participants (typically those on the original calendar invite) but only display names for others. Handle the missing-email case as follows:

1. **If any visible email is NOT `@thekiln.com`** → classify external immediately. No need to resolve the remaining unknown names — even one external participant flips the meeting to external.
2. **If all visible emails are `@thekiln.com` AND there are participants with only names visible** → call `find_person` for each unknown name to resolve their email. Then re-check: if every resolved email is `@thekiln.com`, classify internal. Otherwise external.
3. **If `find_person` cannot resolve a name** (returns no match or ambiguous results) → treat that participant as unknown → conservative default → external. Mark the meeting's classification as `external (uncertain)` in the output so the user can manually verify if it should have been internal.
4. **If `list_meetings` shows no email information at all for a meeting** → call `find_person` for each name to attempt resolution, then apply rules 1–3.

The point: classify confidently when the data is there; default conservatively when it isn't; surface the uncertainty so the user can correct if needed. Never assume internal status from names alone.

Build a small summary: count of internal, count of external, count of `external (uncertain)`, and a list of meeting titles per group.

### Step 3 — Pull transcripts and extract ideas

For each meeting, call `get_meeting_transcript` to get the full text.

- For **internal** meetings: read and apply the prompt at `prompts/internal-call-extraction.md`
- For **external** meetings: read and apply the prompt at `prompts/external-call-extraction.md`

The external prompt has strict abstraction rules. Read them carefully each time — don't summarize from memory. The allowed company/tool names for external calls are in `config/allowed-tools.json` — flatten the categories into one list and treat that as the only allowed company-name set.

Extraction targets 0–3 ideas per meeting. Zero is a fine answer when nothing extracts cleanly.

### Step 4 — Pull external news and extract ideas

Run the news-side extraction. If `gtm-signal-scan` is not installed (per Step 0), skip this step entirely.

1. **Invoke `gtm-signal-scan` in `raw` mode with an extended window.** The skill's default window is 24-48 hours; for the ideation pipeline, request a **72-hour window** so a few days of news can accumulate between on-demand pulls. Pass an explicit instruction like *"Scan in raw mode using a 72-hour window."* The skill returns a JSON-style list of every notable item it found across all five tiers (no 8-10 cap in raw mode): tier, tool/topic, headline, summary, URL, published_at.

2. **Load `prior_posts_context` for de-duplication.** Read every `.md` file in `voice/examples/best/` and `drafts/`. For each, extract:
   - The first heading or first line as the **title**
   - The first 1-2 sentences as a **summary**

   Build a compact list of `{ title, summary }` entries. This becomes the `prior_posts_context` passed to the news-extraction prompt.

   **Do NOT include prior idea files (`ideation/output/ideas-*.md`) in this context.** Per the de-dup rule: dedup against posted/drafted content, not against prior idea suggestions the user didn't pick. If an idea was suggested before and the user didn't act on it, it's fine to suggest it again.

3. **Run the news-extraction prompt** at `prompts/news-extraction.md` against the raw signal items, with the `prior_posts_context` list as context. The prompt applies its angle test to each item, de-duplicates against the prior-posts list, and returns 0-4 news-derived content ideas.

4. **Capture the ideas** for inclusion in the unified output file (Step 5). Each idea must include the **Citation** field with the article URL so the user can verify before posting.

### Step 5 — Render output

Write the rendered ideas to `ideation/output/ideas-YYYY-MM-DD.md` (use today's date; overwrite if it exists). Each idea must contain enough substance for the user to make a judgment call on whether to act on it — a one-line hook isn't enough. The user will read the file, pick one or two, and either write the post themselves or have you write it. They need to be able to decide between ideas at the file level, without asking follow-up questions.

Structure:

```markdown
# Content ideas — <YYYY-MM-DD> (last 7 days calls · last 72h news)

**<N> meetings · <N> news items · <N> ideas total**
**Calls: <N> internal · <N> external · <N> external-uncertain**
**News: <N> signal items scanned, <N> angle-bearing ideas extracted**

[Optional: scope note if any sources weren't fully processed]

---

## From internal calls (specifics allowed)

### <idea title>

**Hook:** "<one sentence; mark italic-emphasis with *asterisks*>"

**The argument**

<3–5 sentences explaining the core claim, the reasoning, and the contrarian or specific angle that makes it a real post and not a platitude.>

**Why it's a Patrick post**

<1–2 sentences naming the opinion marker, the specific anchor (named tool, named team member, dollar amount), or the voice move that makes it distinctly his rather than a generic GTM-blog post.>

**Format:** <carousel / info-card / GIF / not-sure-yet> — <one-line reasoning>

**Structure:**
- <if carousel: slide-by-slide outline (cover + content slides + CTA)>
- <if info-card: section types and what each contains>
- <if GIF: the single visual beat>

**Source:** <meeting title>, <YYYY-MM-DD>, with <participant first names>

---

## From external calls (abstracted per privacy rules)

### <idea title>

**Hook:** "<one sentence; italic-emphasis with *asterisks*>"

**The argument**

<3–5 sentences, phrased as Patrick's independent observation from working in the GTM space. Not "I heard this on a call". This is concept-level only — never reference the engagement.>

**Why it's a Patrick post**

<1–2 sentences naming the opinion marker / voice anchor.>

**Format:** <carousel / info-card / GIF / not-sure-yet> — <reasoning>

**Structure:**
- <outline appropriate to format>

**Source:** External call, <YYYY-MM-DD> (specifics abstracted)
**Compliance check:** Scanned for: <terms>. None present in output.

---

## From external news (with Patrick's angle, citations included)

### <idea title>

**Hook:** "<one sentence; italic-emphasis with *asterisks*>"

**The argument**

<3–5 sentences carrying Patrick's angle on the news. Build on or push against the item. NOT a summary of the news — the news is the trigger; the post is Patrick's take.>

**Why it's a Patrick post**

<1–2 sentences naming the opinion marker / voice anchor.>

**Format:** <carousel / info-card / GIF / not-sure-yet> — <reasoning>

**Structure:**
- <outline appropriate to format>

**Source:** External news — <tool / topic>, Tier <N>
**Citation:** <article headline> — <url>
**Compliance note:** Public news, no abstraction required. Verify the URL and any quoted stats before posting.
```

If a group is empty (e.g. no news items had angles worth surfacing this run), omit that section entirely rather than showing a heading with nothing under it.

### Step 6 — Summary in chat

After writing the file, post a summary to chat:
- **Calls:** meetings pulled, classification split (internal / external / external-uncertain), call-side ideas extracted
- **News:** signal items scanned, news-side ideas extracted (or "skipped — gtm-signal-scan not installed" if applicable)
- Path to the file
- 2–3 strongest hooks as teasers, drawn from across both sources, so the user gets a feel for the batch without reading the whole file

Don't paste the entire file into chat — the file is the artifact.

### Step 7 — Ask which idea + write-or-describe

After the chat summary, ask the user two questions:

1. **Which idea do you want to act on?** Reference by title or hook.
2. **Do you want me to write the post, or give you a longer treatment so you can write it yourself?**
   - **"Write the post"** → produce the LinkedIn caption (following voice rules) AND the JSON input file for the chosen format AND run the appropriate generator (`templates/exploration/carousel/generate.js`, `templates/exploration/info-card/generate.js`, or for GIFs hand off to the HyperFrames skill).
   - **"Describe it more"** → expand the argument section into 4–6 paragraphs with reasoning + examples + possible objections + 2–3 alternative hooks + 2–3 alternative format approaches. Stop short of writing the post itself.

Wait for the user's answer. Don't generate the post unprompted.

If they pick "write the post":
- Generate the LinkedIn caption first (200–400 words typically, depending on idea density)
- Generate the JSON input for the chosen visual asset, following the schema in `templates/exploration/<format>/inputs/*.json`
- For carousels with concept-specific doodles needed, also call `lib/gen-doodle.js` to generate them
- Run the generator
- Show the user the rendered output and the caption together

If they pick "describe it more":
- Write the longer treatment as a markdown response in chat (not a separate file unless they ask): expand the argument to 4–6 paragraphs with reasoning, examples, possible objections, and alternative angles. Add 2–3 alternative hook variations and 2–3 alternative format approaches.
- **Do not write the post itself.** The user is going to write it. Generating a draft would just give them an anchor to react to rather than letting them write fresh.
- End with a clear handoff: "When you're done writing, paste your post back here and I'll generate the asset from it." This is the cue for Step 7.
- Keep voice rules in force throughout the treatment (so any phrasings or framings the user borrows from it are already clean).

### Step 8 — Asset generation from finished post text

This step is triggered when the user returns with a finished LinkedIn post — either right after a "describe it more" treatment, or in a later conversation. Cue phrases: *"here's my post"*, *"I finished writing"*, *"generate the asset for this"*, or just pasting a multi-paragraph post.

The flow:

1. **Read the post.** Identify its shape:
   - Single declarative statement, one beat → likely **GIF** or single info-card
   - List of N points with explanations → likely **carousel** (one slide per point)
   - Dense stats / comparisons / benchmarks → likely **info-card**
   - Story / narrative with one central insight → likely **GIF** or single info-card

2. **Confirm or infer the format.**
   - If you had recommended a format in Step 4 for the same idea, default to that.
   - If the post diverges significantly from the original idea, re-assess based on the post's actual shape.
   - Surface your inference to the user briefly ("This reads like a 4-slide carousel — confirm or pick a different format?"). Wait for confirmation if there's ambiguity. Don't wait if it's obvious.

3. **Build the JSON input.** Construct the input file for the chosen generator (`templates/exploration/carousel/`, `templates/exploration/info-card/`, or handoff to HyperFrames for animations). Use the post's actual phrasing in the JSON — don't paraphrase. The italic-emphasis hook from the post becomes the cover-slide title; the body points become content slides; the final line becomes the CTA hook.

4. **Generate concept-specific doodles if needed.** If the chosen format is a carousel and the deck has slides that need doodles the brand inventory doesn't cover, call `templates/exploration/carousel/lib/gen-doodle.js` per slide with a content-matched concept.

5. **Run the generator.** Render the asset to the appropriate `output/` directory.

6. **Deliver to the user.** Show: the post caption (their text, untouched), the path to the generated asset, and the rendered output inline if possible. Note any doodles generated so they can review.

7. **Save the input JSON alongside the output.** So the user can re-render or tweak without re-deriving the JSON from scratch.

Keep voice rules in force throughout — the user's post should already conform, but any titles or labels the asset adds (step labels, CTAs, footer text) must follow the rules too.

## Don't

- Don't pull more than 7 days back unless the user explicitly asks for a longer window.
- Don't store transcripts to disk. Process in memory, write only the extracted ideas.
- Don't apply the internal prompt to a call that has any non-`@thekiln.com` participant — even if the call is "obviously internal" (e.g. a Kiln-Kiln conversation with a forwarded calendar invite). Email domains are the rule.
- Don't fabricate meetings. If `list_meetings` returns nothing or fails, surface that clearly.
- Don't override the voice rules in the prompts even if the call transcript itself violates them.
