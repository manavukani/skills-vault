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

**Also available:** pseudocode summaries for verbose code (real diff collapsed under a `.bp-section`), inline SVG or ASCII diagrams, before/after flow, old-vs-new tables, callout boxes, anything that makes the review clearer.

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

| Function | Usage |
|----------|-------|
| `toggle(hdr)` / `toggleBP(hdr)` | Open/close `.file-body` / `.bp-body` |
| `renderDiff(target, diffInput)` | Render a unified diff (string or line array) into an element, ID or selector |
| `esc(s)` | HTML-escape |

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
