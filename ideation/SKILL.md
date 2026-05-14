# Ideate from calls (last 7 days)

This skill turns the last 7 days of Fathom call recordings into LinkedIn content ideas. It runs **on-demand**, has **no database**, and writes output to a markdown file in `ideation/output/`. The extraction happens directly in Claude's context — no separate API calls.

## When this skill triggers

Invoke when the user asks for content ideas, "what should I post about this week", "what's brewing", or types `/ideate` (if registered as a slash command). Also valid: anything that implies "look at my recent calls and tell me what to write about."

## The flow

### Step 0 — Verify Fathom MCP is connected

Before pulling anything, confirm Fathom MCP is available in the current Claude Code session. The skill is dead-in-the-water without it.

To verify: look for Fathom-namespaced tools in your available tool list — `list_meetings`, `get_meeting_transcript`, `search_meetings`, `get_recording_by_url`, etc. If they're present, proceed to Step 1.

If they're **not** present, the user hasn't connected Fathom MCP yet. Help them connect it before doing anything else:

1. Search the MCP registry for Fathom. Use `mcp-registry__search_mcp_registry` with query `"fathom"`, or `mcp-registry__suggest_connectors` with a task like `"content ideation from call recordings"`.
2. Show the user the connector entry and walk them through the install/auth flow. Most MCP connectors in Claude Code need an OAuth sign-in (open browser → authorize Fathom → return to Claude Code).
3. Ask them to restart Claude Code if prompted — the new tools need to register.
4. After they say it's connected, do a test call: `list_meetings` with no filters, just to confirm the tool responds. Even zero results = connected. A tool-not-found error = still not connected, loop back to step 1.
5. Once a `list_meetings` call succeeds, proceed to Step 1 of the skill.

Do NOT proceed past Step 0 until Fathom MCP is responding. Don't fabricate meetings, don't ask the user for transcripts manually, don't fall back to other sources. The whole pipeline assumes Fathom data.

### Step 1 — Pull last 7 days of meetings

Use the Fathom MCP. Call `list_meetings` filtered to meetings ending within the last 7 calendar days from today. For each meeting, capture: meeting ID, title, start time, participant emails, participant names.

If the list is empty, tell the user "no Fathom meetings in the last 7 days — nothing to extract from" and stop. Don't fabricate.

### Step 2 — Classify each meeting

For each meeting, check every participant's email:

- If **every** participant email ends in `@thekiln.com` → classify as **internal**
- Otherwise → classify as **external**

External is conservative-default — applies to vendor calls, advisor calls, partner calls, prospect calls, accidentally-recorded personal calls. Not just confirmed-client calls. Better to over-abstract than to leak.

Build a small summary: count of internal, count of external, list of meeting titles per group.

### Step 3 — Pull transcripts and extract ideas

For each meeting, call `get_meeting_transcript` to get the full text.

- For **internal** meetings: read and apply the prompt at `prompts/internal-call-extraction.md`
- For **external** meetings: read and apply the prompt at `prompts/external-call-extraction.md`

The external prompt has strict abstraction rules. Read them carefully each time — don't summarize from memory. The allowed company/tool names for external calls are in `config/allowed-tools.json` — flatten the categories into one list and treat that as the only allowed company-name set.

Extraction targets 0–3 ideas per meeting. Zero is a fine answer when nothing extracts cleanly.

### Step 4 — Render output

Write the rendered ideas to `ideation/output/ideas-YYYY-MM-DD.md` (use today's date in YYYY-MM-DD; overwrite if it exists). Use this structure:

```markdown
# Content ideas — <YYYY-MM-DD> (pulled <N> meetings from last 7 days)

<N> internal · <N> external · <N> ideas total

---

## From internal calls (specifics allowed)

### <idea hook headline>

- **Source:** <meeting title>, <YYYY-MM-DD>, with <participant first names>
- **Format:** <carousel / info-card / GIF / not-sure-yet>
- **Hook draft:** <one sentence; mark italic-emphasis portion with *asterisks*>
- **Concept:** <2-3 sentences of what the post says>

[repeat per idea]

---

## From external calls (abstracted per privacy rules)

### <idea hook headline>

- **Source:** External call, <YYYY-MM-DD> (specifics abstracted)
- **Format:** <carousel / info-card / GIF / not-sure-yet>
- **Hook draft:** <one sentence; italic-emphasis with *asterisks*>
- **Concept:** <2-3 sentences, phrased as Patrick's independent observation>
- **Compliance check:** "Scanned for [list of company / specific terms]. None present in output."

[repeat per idea]
```

If a group is empty (e.g. all calls were internal), omit that section entirely rather than showing a heading with nothing under it.

### Step 5 — Summary in chat

After writing the file, tell the user in chat:
- Count of meetings processed (internal / external split)
- Count of ideas extracted (internal / external split)
- Path to the output file: `ideation/output/ideas-YYYY-MM-DD.md`
- 2–3 of the strongest idea hooks as a teaser

Don't paste the whole file into chat. The file is the artifact.

## Don't

- Don't pull more than 7 days back unless the user explicitly asks for a longer window.
- Don't store transcripts to disk. Process in memory, write only the extracted ideas.
- Don't apply the internal prompt to a call that has any non-`@thekiln.com` participant — even if the call is "obviously internal" (e.g. a Kiln-Kiln conversation with a forwarded calendar invite). Email domains are the rule.
- Don't fabricate meetings. If `list_meetings` returns nothing or fails, surface that clearly.
- Don't override the voice rules in the prompts even if the call transcript itself violates them.
