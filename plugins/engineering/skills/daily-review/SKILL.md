---
name: daily-review
description: Summarize what I got done yesterday (or a given day) from authored GitLab MRs, Jira tickets, and Claude chat logs into a concise standup update
model: haiku
---

# Daily review

## Trigger

Need a short, high-signal summary of work done yesterday (or another named day/range) for standup or a status update.

## Workflow

1. Resolve the window to concrete dates. Default: previous working day (Monday → Friday through Sunday). Call it `SINCE`..`UNTIL`.
2. MRs: run `python3 "${CLAUDE_PLUGIN_ROOT}/scripts/mrs.py" --since SINCE --until UNTIL`. It runs `glab mr list --author=@me` per repo and prints JSON (`repo`, `iid`, `title`, `state`, `updated_at`, `web_url`). Repos come from `~/.claude/mr-repos.txt` (one GitLab project path per line, or `$MR_REPOS_FILE`).
3. Jira: load the Atlassian MCP via ToolSearch and gather tickets from two sources, then dedupe by key: (a) keys (e.g. `RSTBL-1234`) pulled from MR titles; (b) tickets assigned to the logged-in user (resolve them via the MCP's current-user lookup) that were updated or transitioned in the window (JQL like `assignee = currentUser() AND updated >= "SINCE" AND updated < "UNTIL+1"`). Fetch each issue's summary and status. Use the ticket summary to describe the work when the MR title is vague, and surface assigned tickets that moved (status change, comment) even with no MR. Skip silently if the MCP is unavailable.
4. Chat logs: Claude session logs are `~/.claude/projects/*/*.jsonl`. Select files with activity in the window (`find ~/.claude/projects -name '*.jsonl' -newermt SINCE ! -newermt UNTIL+1`). Per file, read user messages (`jq -r 'select(.type=="user" and (.message.content|type=="string")) | [.timestamp,.cwd,.message.content[0:200]] | @tsv'`) filtered to the window. Use them to catch work with no MR yet: investigations, reviews, spikes, debugging. Ignore tool results and skill/system boilerplate.
5. Merge: collapse MRs and chat work per repo/ticket. Drop duplicates (chat work already covered by an MR).
6. Synthesize the most important shipped or progressed work. Include the actual date used.
7. Format: default output below. If invoked with `--standup`, render the standup template instead (see Output).

## Guardrails

- Extremely concise and information-dense.
- Prioritize behavior, architecture, and ticket-level outcomes; omit cosmetic-only work (formatting, imports, renames).
- Describe changes functionally. Do not infer intent or motivation.
- Chat logs are private: summarize the work, never quote prompts or paste log content.
- Non-merged MRs get their state inline (draft, in review).

## Output

- One-line summary
- Date used
- Optional 2-5 bullets: `{repo}!{iid} / TICKET: terse description`; chat-only work marked `(no MR)`

### `--standup` (optional)

Replace the default output with exactly 3 short lines, no headers or per-MR bullets:

```
1. Yesterday: <entry>; <entry>; ...
2. Today: <entry>; <entry>; ...
3. Blockers: none surfaced from MR state — flag anything specific.
```

- `<entry>` is `{repo}!{iid} {terse description}`; collapse multiple MRs in the same repo into one (`caspian!169/171/172 RSTBL-5418 delta snapshots`). Compress titles, don't quote them.
- Yesterday = work in the resolved window. Today = MRs updated today (run the script with `--since` today) plus assigned in-progress tickets.
- Note non-merged state inline (`draft`, `in review`). Omit an empty bucket's line.
