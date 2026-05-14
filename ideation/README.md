# Ideation pipeline

On-demand content idea generation from your recent Fathom calls. Pulls the last 7 days of meetings, classifies internal vs external, applies privacy-safe abstraction to external calls, and outputs a markdown file of ideas you can act on.

## Setup

You need two things — Fathom MCP connected to Claude Code, and a `@thekiln.com` email used for the internal-vs-external classification. No database, no extra API keys, no script-running. Claude inside Claude Code does the extraction directly.

### Connecting Fathom MCP

If you've already used Fathom in Claude Code (you've asked it about meetings, etc.), you're done — skip to "Run it" below.

If not, the first time you invoke this skill, Claude will detect Fathom isn't connected and walk you through setup:

1. **Make sure Fathom is recording your calls.** Install the Fathom desktop app, give it permission to join your meetings, and let it record. The skill only pulls from already-recorded calls.
2. **Connect the Fathom MCP to Claude Code.** Ask Claude *"Connect Fathom MCP"* or *"find the Fathom connector"* — it'll search the MCP registry, show you the install entry, and walk you through OAuth sign-in.
3. **Restart Claude Code** if prompted. The new tools need to register.
4. **Verify by asking** Claude *"list my recent Fathom meetings"* — if it returns meetings (even an empty list), you're set.

You only need to do this once per machine. After that, the skill runs without setup friction.

### Re-using the same flow for Slack and Gmail (later)

This MVP is Fathom-only. When we add Slack and Gmail ingestion in a later iteration, the same MCP-registry pattern applies — Claude will detect missing connectors and walk you through them.

## Run it

In Claude Code, ask naturally:

> *"What content ideas do I have from this week's calls?"*

Or if you've registered this as a slash command (optional): `/ideate`.

Claude will:

1. Pull the last 7 days of meetings via Fathom MCP
2. Classify each one — internal (all-`@thekiln.com`) or external (anyone else on the call)
3. Apply the right extraction prompt per classification — internal allows specifics, external strict-abstracts
4. Write all extracted ideas to `ideation/output/ideas-YYYY-MM-DD.md`
5. Show you a chat summary with the top hooks

The full ideas file is the artifact — review it, pick the ones you want to act on, then trigger an asset generation (carousel / info-card / GIF) using the existing generators.

## What you get

A markdown file grouped by source:

- **From internal calls (specifics allowed).** Named team members, named projects, frameworks, decisions, attributions. Full content.
- **From external calls (abstracted per privacy rules).** Concept-level ideas only. No company names except tools we use in our own work. Each idea has a `Compliance check` field listing what was scanned for — read that before posting.

Each idea includes a suggested format (carousel / info-card / GIF / not-sure-yet) based on the content's natural shape.

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
- `config/allowed-tools.json` — whitelist of company / tool names allowed in output
- `output/ideas-YYYY-MM-DD.md` — generated idea files, one per run (overwrites same-day runs)

## Voice rules apply

All extracted ideas follow `voice/voice.md` and the voice rules in the top-level README — no em-dashes, no AI-mush vocab, opinion markers required, specific over generic. If you see an idea that violates these, that's a prompt bug — open it up in `prompts/` and tighten the rule.
