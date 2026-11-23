---
name: weekly-review
description: Starting-point draft for my weekly 1:1 with my manager, built from authored GitLab MRs and Jira tickets - what I did, what's in flight, and talking points I could bring up
model: haiku
---

# Weekly review

## Trigger

Prep for a 1:1 sync with my manager. Output is a starting-point draft I edit: a recap of the week plus things I might want to bring into the conversation. Not a finished status report.

## Workflow

1. Window: Monday of this week through today by default; "last week" → previous Monday–Sunday. State the concrete dates.
2. MRs: run `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/mrs.py" --since SINCE --until UNTIL` (runs `glab mr list --author=@me` per repo; JSON with `repo`, `iid`, `title`, `state`, `updated_at`, `web_url`).
3. Jira: pull ticket keys (e.g. `RSTBL-1234`) from MR titles. Load the Atlassian MCP via ToolSearch and fetch each issue's type, summary, and status; also tickets assigned to the logged-in user that moved this week. Issue type (Bug / Task / Story / Tech debt) is the primary classification signal. Skip silently if the MCP is unavailable.
4. Group into what shipped vs. what's still open; collapse MRs per ticket/repo.
5. Classify the shipped work: bug fixes, tech debt, net-new. Jira issue type first, MR titles second. Mark inferred ones "likely".
6. Derive discussion candidates from evidence only: MRs open or draft for a long time, tickets blocked or waiting on review, work that grew beyond its ticket, risks visible in the data.

Do not read Claude chat logs. This review is MR and Jira evidence only.

## Guardrails

- Draft, not final: loose, editable, first person, as I'd say it to my manager. Offer options to keep, cut, or reword; don't present conclusions as settled.
- Claims come from MR titles, Jira data, and diffs. No guessed intent or motivation.
- "Could bring up" holds only evidence-backed candidates, labeled as such. Never invent concerns, feelings, or career topics; leave a placeholder line for me to add my own.
- Non-merged MRs get their state inline.
- If `glab` is unauthenticated, say so and stop.

## Output

Date range used, then:

- **What I got done** - 2-5 bullets of shipped work, with `{repo}!{iid} / TICKET` refs.
- **Mix** - one short line: bugfix / tech debt / net-new.
- **In flight** - open MRs and tickets with state, and what each is waiting on.
- **Could bring up** - evidence-backed talking points, each as a short topic plus a question or ask I might put to my manager (blockers, stale reviews, scope growth, risks, decisions I'd want input on), then `- (add yours)`.
- **Next week** - likely carry-over, taken from open MRs and in-progress tickets.
