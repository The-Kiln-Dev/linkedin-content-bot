# Ideation pipeline

On-demand content idea generation from two signal sources: your recent Fathom calls (internal data) and recent GTM news (external data). Pulls the last 7 days of meetings + the last 72 hours of GTM signal, classifies and abstracts where needed, de-dupes news ideas against your prior posts, and outputs a unified markdown file of ideas you can act on.

## Setup

You need:

1. **Fathom MCP** connected to Claude Code — required for call ideas
2. **`gtm-signal-scan` skill** installed globally — required for news ideas (lives at `~/.claude/skills/gtm-signal-scan/SKILL.md`)
3. A **`@thekiln.com` email** — used for the internal-vs-external call classification

No database, no extra API keys, no script-running. Claude inside Claude Code does the extraction directly. If one of the two sources isn't set up, the skill runs with whichever it has and skips the other in the output.

### Connecting Fathom MCP

If you've already used Fathom in Claude Code (you've asked it about meetings, etc.), you're done — skip to "Run it" below.

If not, the first time you invoke this skill, Claude will detect Fathom isn't connected and walk you through setup:

1. **Make sure Fathom is recording your calls.** Install the Fathom desktop app, give it permission to join your meetings, and let it record. The skill only pulls from already-recorded calls.
2. **Connect the Fathom MCP to Claude Code.** Ask Claude *"Connect Fathom MCP"* or *"find the Fathom connector"* — it'll search the MCP registry, show you the install entry, and walk you through OAuth sign-in.
3. **Restart Claude Code** if prompted. The new tools need to register.
4. **Verify by asking** Claude *"list my recent Fathom meetings"* — if it returns meetings (even an empty list), you're set.

You only need to do this once per machine. After that, the skill runs without setup friction.

### Re-using the same flow for Slack and Gmail (later)

This MVP is Fathom + `gtm-signal-scan`. When we add Slack and Gmail ingestion in a later iteration, the same MCP-registry pattern applies — Claude will detect missing connectors and walk you through them.

## Run it

In Claude Code, ask naturally:

> *"What content ideas do I have this week?"*

Or if you've registered this as a slash command (optional): `/ideate`.

Claude will:

1. Pull the last 7 days of meetings via Fathom MCP
2. Classify each meeting — internal (all-`@thekiln.com`) or external (anyone else on the call), with `find_person` fallback when emails aren't visible
3. Apply the right call-extraction prompt per classification — internal allows specifics, external strict-abstracts
4. Invoke `gtm-signal-scan` in `raw` mode with a 72-hour window, then run news ideas through the news-extraction prompt with de-duplication against your prior posts in `voice/examples/best/` and `drafts/`
5. Write all extracted ideas (calls + news) to `ideation/output/ideas-YYYY-MM-DD.md` in three sections
6. Show you a chat summary with the top hooks across sources
7. Ask which idea you want to act on, and whether you want it written for you or just described more deeply

The full ideas file is the artifact — review it, pick the ones you want to act on, then either have Claude write the post and generate the asset, or write the post yourself and come back to generate the asset from your finished text.

## What you get

A markdown file grouped by source:

- **From internal calls (specifics allowed).** Named team members, named projects, frameworks, decisions, attributions. Full content.
- **From external calls (abstracted per privacy rules).** Concept-level ideas only. No company names except tools we use in our own work. Each idea has a `Compliance check` field listing what was scanned for — read that before posting.
- **From external news (with Patrick's angle, citations included).** News items with a Patrick-angle worth taking — contrarian read, missed-by-most extension, tradeoff worth surfacing, Kiln-client perspective. No abstraction needed (news is public). Each idea has a `Citation` field with the article URL; verify before posting.

Each idea includes a hook, the full argument (3–5 sentences), a "why it's a Patrick post" voice anchor, a format recommendation (carousel / info-card / GIF / not-sure-yet) with reasoning, and a slide-by-slide or section-by-section structure outline. Enough substance to pick one without asking follow-up questions.

**De-dup rule for news:** news ideas are checked against your prior posts in `voice/examples/best/` and `drafts/` to avoid suggesting topics you've already covered. They are NOT checked against prior `ideation/output/ideas-*.md` files — if an idea was suggested last week and you didn't pick it, the system will suggest it again. That's intentional.

## Privacy rules — summary

The most important thing to understand about this system:

**Any meeting with at least one non-`@thekiln.com` participant is treated as client-equivalent**, even if the other participant is actually a vendor, advisor, partner, or prospect. The system errs heavily toward over-abstraction. Better to discard a marginal idea than to leak one specific.

In external-call output:

- ❌ No company names (except tools on the allowed list — see `config/allowed-tools.json`)
- ❌ No direct quotes
- ❌ No identifying specifics about an engagement
- ✅ Ideas phrased as Patrick's independent observation from the GTM space generally
- ✅ Tools we use, public stats, named GTM frameworks
- ✅ Compliance check field listing terms scanned for

**Manual flagging is the safety net.** If you read an external-derived idea and it feels like it traces back to the conversation, kill it. The system tries hard but the final check is yours.

To broaden what tools / companies are allowed in extracted content, edit `config/allowed-tools.json`. Add only names of tools we publicly use ourselves, not names of clients.

## What's NOT in this MVP

- **Slack ingestion.** Skipped for MVP. Calls are the main signal source — Slack is noisier and lower-priority.
- **Background / scheduled runs.** On-demand only for now. Once we've validated that the output quality is good on manual runs, we add a daily / weekly cron mode that writes to a per-user database.
- **Auto-asset-generation.** You manually pick which idea to act on and invoke a generator. The skill produces ideas, not assets.

These come back in later iterations.

## Files in this folder

- `SKILL.md` — the instructions Claude follows when running the ideation flow
- `prompts/internal-call-extraction.md` — extraction prompt for internal calls
- `prompts/external-call-extraction.md` — strict-abstraction prompt for external calls
- `prompts/news-extraction.md` — angle-test prompt for converting gtm-signal-scan output into news-derived ideas
- `config/allowed-tools.json` — whitelist of company / tool names allowed in external-call output (news section doesn't need this — news is public)
- `output/ideas-YYYY-MM-DD.md` — generated idea files, one per run (overwrites same-day runs; gitignored as per-user artifact)

## Voice rules apply

All extracted ideas follow `voice/voice.md` and the voice rules in the top-level README — no em-dashes, no AI-mush vocab, opinion markers required, specific over generic. If you see an idea that violates these, that's a prompt bug — open it up in `prompts/` and tighten the rule.
