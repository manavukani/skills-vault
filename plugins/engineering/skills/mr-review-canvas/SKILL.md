---
name: mr-review-canvas
disable-model-invocation: true
description: Generate an interactive MR review walkthrough as an HTML page from a GitLab merge request. Fetches MR data via glab, splits core from mechanical changes, adds reviewer annotations, and renders diffs with moved-code detection. Use when the user pastes a GitLab MR URL (or an MR number in the current repo) and asks for a review, walkthrough, or summary, or says "review this MR".
---

# MR Review Canvas

Generate an interactive HTML review of a GitLab merge request that reads like a peer walking you through what matters. Uses `glab` subcommands only; never `gh`, never raw `glab api` (the glab-guard hook allowlists endpoints).

## Workflow

### 1. Fetch MR data

Input is a URL like `https://gitlab.example.com/group/sub/project/-/merge_requests/123`, or a bare number in the current repo. From a URL take the project path (between host and `/-/`) for `-R` and the trailing number as `N`. For a bare number, drop `-R`.

```bash
W="${TMPDIR:-/tmp}/mr-review-N" && mkdir -p "$W"
glab mr view N -R group/sub/project -F json > "$W/mr.json"      # title, description, author, source_branch, target_branch, changes_count, head_pipeline, web_url
glab mr diff N -R group/sub/project --raw --color=never > "$W/mr.diff"   # one unified diff, `diff --git` per file
glab mr note list N -R group/sub/project -F json > "$W/notes.json"       # review threads (experimental; skip if it errors)
```

Derive per-file stats by counting `+`/`-` lines (the MR JSON has no totals). Pull the Jira key (`[A-Z]+-\d+`, e.g. `RSTBL-123`) from title or source branch and show it in the header. Include `head_pipeline.status` as a pill.

### 2. Analyze the MR and write the body HTML

Read the diffs, understand the MR, and write the `<body>` content directly as HTML. Goal: explain the MR clearly to a reviewer. Use whatever structure fits.

**Sourcing (non-negotiable).** Every claim, card, row, node, arrow and checklist item on the page comes from one of three places. Nothing is invented, inferred from the filename, or filled in from general knowledge.

1. **The diff** (`mr.diff`): the source of truth for what changed. If code and description disagree, the code wins and the page says so.
2. **The source branch**: when the repo is checked out locally, read touched files at the branch tip for context beyond the hunks (`git show origin/<source_branch>:<path>`). If it is not checked out, the diff is the only code evidence; say "diff only" where context is missing rather than guessing.
3. **The MR description** (`mr.json`): intent and background only. It can be stale after later pushes. Anything that rests on it carries `<span class="tag src">from MR description</span>` and must never be shown as verified fact. If the diff contradicts it, flag the mismatch with a `.callout.warn`.

If you cannot ground something in these, leave it out or write "not determinable from the diff". Consumers, tests and deploy steps that live outside the diff are named only when the diff or description says so, and the description-sourced ones get the tag.

**Typical structure** (adapt as needed):
- Header: title, `!N`, author, Jira key, `source -> target`, pipeline pill, stats
- Summary box: what the MR does in plain English
- Core file sections with annotations and diffs
- Mechanical/boilerplate files collapsed by default
- Review checklist at the bottom

**Stack weighting** (Ripple stablecoin services: Java/Spring Boot, Python/FastAPI, TypeScript/React, Phoenix OAM and ClaimSet YAML):
- Anything touching money, balances, amounts, rounding, decimals, currency or ledger state is core. Annotate it first.
- Call out silent fallbacks, invented defaults, swallowed exceptions, and `catch`/`except` blocks that continue instead of failing.
- Flag changes to OpenAPI contracts, DB migrations, queue/event payloads and per-environment config: consumers live in other repos.
- Flag OAM/ClaimSet changes: IRSA policy wildcards, new env vars, route coverage.
- Say which file holds the test for new behavior, or that none does.
- Mechanical by default: lockfiles (`pnpm-lock.yaml`, `poetry.lock`, `package-lock.json`), generated clients, snapshots, import-only churn, pure renames, formatting.

**Existing threads:** show unresolved threads from `notes.json` (skip system notes) next to the file they target.

**Visual toolkit:** a wall of prose plus diffs is the failure mode. Before writing a section, ask what shape the change has, then pick the form that shows that shape. **Do not use the whole toolkit.** Use only the components the diff actually calls for: a docs-only MR needs none, a small bugfix needs maybe a callout, a schema or contract MR may justify two or three. A visual earns its place only when it explains something the text would make the reader reconstruct; a plain annotation beats a forced widget. Never add a component to a section just because it exists (no contract diff without a contract change, no state machine without states, no blast-radius map without a diff-visible consumer). Mix freely; do not map a change type to a component mechanically.

Shapes worth noticing, with forms that tend to fit (examples, not rules):

| What you see in the MR | Forms that can show it |
|---|---|
| Data moved, split, renamed or dropped (schema, config keys, DTO fields, API payloads) | Before/after cards with `.field` rows: `.moved`, `.add`, `.del`, `.mod`; a `.seg` toggle to flip between states |
| Behaviour changes along a path (request flow, retry, saga, migration order) | `.steps` (click to expand), inline SVG sequence or flow, old-vs-new flow side by side |
| One concept in several variants (types, kinds, per-env config, feature flags) | `.grid` of `.card`s, or `.tabs` with one `.vpanel` each |
| Rules, limits, validation, state machine | `table.cmp` old/new, SVG state diagram, a small input-to-outcome table |
| Time or ordering (deploy order, effective dates, scheduler, cron) | SVG timeline or calendar strip, numbered `.steps` |
| Blast radius, who consumes what | Boxes-and-arrows SVG across repos, `.stats` row, `.callout.warn` |
| Risk, review focus | `.callout` (info/warn/danger/ok), checklist in `.verdict`, `.tag`s on file headers |
| Verbose code | Pseudocode in `.file-note` with the real diff collapsed under `.bp-section` |
| OpenAPI, JSON schema, event or queue payload changed | `.cdiff` contract diff: old vs new keys, add/del/mod rows, a breaking-or-additive call |
| Many files, hard to see where the weight is | `.ftree` file tree with +/- bars, or `.heat` churn heatmap; both link to the file cards |
| An enum or status gains, loses or reroutes transitions | `svg.sm` state machine: new edges green, removed edges dashed red |
| Branching rules, limits or eligibility logic changed | `table.dt` decision table with `td.chg` showing `<s>old</s> <b>new</b>` |
| Diff touches an API, event, table or config that other repos or services use | `.blast` map: `.hub` for this repo, `.spoke.in/.out` for each consumer or dependency the diff names |
| Merge, release, deploy or migration order matters, or something can't be rolled back | `.rail` order rail, `.rstep.door` on the one-way steps |
| Silent fallbacks, invented defaults, swallowed exceptions found | `.fb` finding list: severity dot, `file:line`, one sentence each |
| Reviewer needs to track what they verified | `.chk` checklist with progress bar; ticks persist in the browser |

Rules of thumb:
- Cards, toggles and SVG carry **facts taken from the diff**, never invented. If you cannot fill a card from the diff, use prose.
- Colors keep their meaning: green `.add`, pink `.del`, blue `.moved`, purple `.mod`, orange `.warn` for risk. Do not use them for decoration.
- Interaction must reveal something (a second state, a detail). No animation for its own sake.
- Keep the real diff reachable. A visual summarizes; the diff below it is the evidence.
- Add a `.legend` when a visual uses more than two colors.

Examples (copy and adapt; all wiring comes from `renderer.js`, no extra script needed):

Before/after moved fields, with a toggle. `data-in` shows an element only in that state; `data-ghost-in` fades it in that state.

```html
<div class="vg" data-state="before">
  <div class="seg"><button data-v="before" class="on">Before</button><button data-v="after">After</button></div>
  <div class="grid g2">
    <div class="card"><h4>orders</h4>
      <div class="field moved" data-ghost-in="after"><span>currency</span><span class="why">moves to order_amount</span></div>
      <div class="field"><span>id</span></div>
    </div>
    <div class="card moved"><h4>order_amount <span class="tag add">new</span></h4>
      <div class="field moved" data-in="after"><span>currency</span><span class="why">was orders.currency</span></div>
    </div>
  </div>
</div>
```

Variants as tabs:

```html
<div class="vg"><div class="tabs"><button data-v="a" class="on">Sandbox</button><button data-v="b">Prod</button></div>
  <div class="vpanel" data-v="a">…</div><div class="vpanel" data-v="b">…</div></div>
```

Expandable flow, risk callout, summary stats:

```html
<div class="steps"><div class="step"><div><b>Client calls /pay</b><div class="detail">new idempotency header is read here (<span class="ic">PayController.java</span>)</div></div></div></div>
<div class="callout warn"><b>One-way door.</b> The migration drops <span class="ic">amount_raw</span>; rollback needs a backfill.</div>
<div class="stats"><div class="stat"><b>3</b><span>repos affected</span></div></div>
```

Contract diff, file tree, heatmap (static HTML; `--d` indent, `--a`/`--r` bar %, `--w` size, `--i` intensity 0-100 are computed from the diff's counts):

```html
<div class="cdiff">
  <div class="crow head"><span>field</span><span>before</span><span>after</span></div>
  <div class="crow mod"><span class="k">amount</span><span>number</span><span>string</span></div>
  <div class="crow add"><span class="k" style="--d:1">idempotencyKey</span><span></span><span>string</span></div>
</div>
<div class="ftree"><details open><summary>src/main/java/pay</summary>
  <a class="ffile" href="#f-PayController"><span>PayController.java</span><span class="bar" style="--a:70%;--r:30%"><i></i><i></i></span><span class="n">+42 −18</span></a>
  <a class="ffile mech" href="#f-lock"><span>pnpm-lock.yaml</span><span class="bar" style="--a:100%;--r:0%"><i></i><i></i></span><span class="n">+210</span></a>
</details></div>
<div class="heat"><a href="#f-PayController" style="--w:60;--i:90">PayController.java</a><a class="mech" href="#f-lock" style="--w:210">pnpm-lock.yaml</a></div>
```

State machine, decision table:

```html
<svg class="sm" viewBox="0 0 360 80"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#939a9f"/></marker></defs>
  <g class="node"><rect x="10" y="20" width="90" height="36" rx="6"/><text x="22" y="43">PENDING</text></g>
  <g class="node new"><rect x="240" y="20" width="100" height="36" rx="6"/><text x="252" y="43">EXPIRED</text></g>
  <path class="edge new" d="M100 38H240" marker-end="url(#ah)"/><text class="lbl" x="150" y="32">timeout</text></svg>
<table class="dt"><tr><th>currency</th><th>amount</th><th>outcome</th></tr>
  <tr><td>RLUSD</td><td class="chg"><s>≤ 1000</s><b>≤ 5000</b></td><td>auto-approve</td></tr></table>
```

Blast radius, order rail, findings, checklist, source tag:

```html
<div class="blast"><div class="spoke in"><b>issuer-ui</b><br>reads <span class="ic">amount</span> (OpenAPI hunk, openapi.yaml:88)</div>
  <div class="hub"><b>this repo</b><br>pay-service</div>
  <div class="spoke out"><b>signing-service</b><br>new call in <span class="ic">SignClient.java</span></div></div>
<div class="rail"><div class="rstep"><b>1 Merge</b>contract first</div><div class="rstep door"><b>2 Migrate</b>drops amount_raw (V42__drop.sql)</div></div>
<div class="fb"><div class="row"><span class="sev high"></span><div><a class="loc">PayService.java:117</a>catch swallows <span class="ic">TimeoutException</span> and returns 0</div></div></div>
<div class="chk"><div class="prog"><i></i></div><label><input type="checkbox"><span>Rounding path has a test</span></label></div>
<span class="tag src">from MR description</span> Customer-facing rollout is Monday.
```

For anything these do not cover (a calendar, a slider that evaluates a rule, a custom SVG), write a small inline `<script>` in the body. Keep it self-contained, in the page's dark palette, and driven only by values taken from the diff.

Pseudocode pattern:

```html
<div class="file-card">
  <div class="file-hdr" onclick="toggle(this)">
    <span class="fname">retryClient.ts</span>
    <div class="fstats"><span class="pill add">+173</span><span class="pill del">&minus;11</span><span class="chev open">&#9654;</span></div>
  </div>
  <div class="file-body open">
    <div class="file-note">
      <strong>What this does in plain English:</strong>
      <pre style="margin-top:8px;color:var(--text);font-size:12px;line-height:1.6;">
fetch(url):
  if circuit breaker is open -> fail fast
  retry up to N times with exponential backoff + jitter
  circuit breaker records failure</pre>
    </div>
    <div class="bp-section" style="margin:0;border:0;border-radius:0;">
      <div class="bp-hdr" onclick="toggleBP(this)">
        <span>Show full implementation (+173 lines)</span><span class="chev">&#9654;</span>
      </div>
      <div class="bp-body"><div data-diff="retryClient_ts"></div></div>
    </div>
  </div>
</div>
```

### 3. CSS classes and JS utilities

Inject [styles.css](styles.css) and [renderer.js](renderer.js) into [template.html](template.html) verbatim (step 4).

| Class | Purpose |
|-------|---------|
| `.header`, `.header h1`, `.header-meta` | Page header |
| `.pill.add`, `.pill.del`, `.pill.files` | Stat badges |
| `.content` | Centered wrapper (max 900px) |
| `.summary` | TL;DR box |
| `.section-title` | Section heading |
| `.ic` | Inline code reference |
| `.file-card`, `.file-hdr`, `.file-body` | Collapsible file card (`onclick="toggle(this)"` on `.file-hdr`) |
| `.file-note` | Sticky reviewer annotation inside a file card |
| `.bp-section`, `.bp-hdr`, `.bp-body`, `.bp-note` | Collapsed boilerplate card (`onclick="toggleBP(this)"`) |
| `.verdict` | Review checklist box |
| `.grid.g2/.g3`, `.card(.add/.del/.moved/.mod/.warn)`, `.field`, `.tag`, `.callout`, `.stat`, `.legend`, `.seg`, `.tabs`, `.vg/.vpanel`, `.steps/.step`, `table.cmp`, `.cdiff`, `.ftree`, `.heat`, `svg.sm`, `table.dt`, `.blast`, `.rail`, `.fb`, `.chk`, `.tag.src` | Visual toolkit (see above; use only what the diff calls for) |

| Function | Usage |
|----------|-------|
| `toggle(hdr)` / `toggleBP(hdr)` | Open/close `.file-body` / `.bp-body` |
| `renderDiff(target, diffInput)` | Render a unified diff (string or line array) into an element, ID or selector |
| `esc(s)` | HTML-escape |
| `setView(vg, state)` | Switch a `.vg` view group (called by `.seg`/`.tabs` clicks automatically) |

**Diffs:** put `<div data-diff="KEY"></div>` wherever a diff belongs. The renderer fills them from the `<script id="mr-diffs-json">` element in `template.html`. **Never hand-embed patches** (they contain `</script>`, quotes, backslashes). Step 4 builds and injects the JSON safely. Keys are the file path with non-alphanumerics replaced by `_`, e.g. `src/main/Foo.java` -> `src_main_Foo_java`.

### 4. Assemble and open

Write the body HTML to `$W/body.html`, then run from this skill directory (so `styles.css`, `renderer.js`, `template.html` resolve):

```bash
export W; python3 -I - <<'PY'
import json, os, re
from pathlib import Path
w = Path(os.environ['W'])
patches = {}
for chunk in re.split(r'(?m)^(?=diff --git )', (w/'mr.diff').read_text()):
    m = re.match(r'diff --git a/(.*?) b/(.*)', chunk)
    if not m: continue
    patches[re.sub(r'[^a-zA-Z0-9]', '_', m.group(2))] = chunk
safe = json.dumps(patches).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
out = (Path('template.html').read_text()
  .replace('/* INJECT_CSS */', Path('styles.css').read_text())
  .replace('/* INJECT_JS */', Path('renderer.js').read_text())
  .replace('<!-- INJECT_BODY -->', (w/'body.html').read_text())
  .replace('{"__MR_DIFFS_PLACEHOLDER__":true}', safe))
(w/'review.html').write_text(out)
PY
open "$W/review.html"
```

The page is self-contained (diffs embedded, no fetches), so no local server is needed. Keep the `w`/`$W` files out of the repo.

### Diff features (automatic in renderer.js)

- Filters import-only lines (JS/TS, Java, Python)
- Collapses whitespace-only changes into context lines
- Detects moved code (3+ consecutive lines deleted in one place and added identically elsewhere): blue/purple instead of red/green; moved-plus-small-edit gets a different purple

### Style notes

- Dark theme on the brand palette: `--bg` #21272c (surface #141a1f, border #2e3439), `--accent` #008cff (info), `--success` #52c322, `--warning` #f5853d, `--danger` #f04275. Semantic colors carry meaning; don't use them decoratively.
- Inter body font, IBM Plex Mono for code.
- Sticky file headers (`top: 0`) and notes (`top: 35px`); core files `.file-body.open`, mechanical files collapsed.
