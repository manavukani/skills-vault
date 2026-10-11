# Prompt: bootstrap a docs-first, multi-repo context workspace

Copy everything below the line (until [Future Scope ⚠️](#future-scope)) into a fresh Claude Code session started in the **workspace root** (the directory that holds all your team's repo checkouts side by side).

---

You are setting up a **docs-first multi-repo workspace** for my team. Goal: any engineer or AI agent can open this workspace, ask a broad or cross-repo question, and get a source-grounded answer fast, with knowing how far to trust it. The knowledge base must stay correct over time through a write-back loop.

Work in phases. **Stop and wait for my approval at each gate marked 🛑.** Do not write any file before Gate 1. Never read secret-bearing files (`.env`, `local.env`, key files, credential stores) and never paste secrets into docs.

Placeholders: `<TEAM>` team/product name, `<ROOT>` workspace root, `<REPO>` a repo directory name.

## What we are building

```
<ROOT>/
├── CLAUDE.md                  # workspace router + rules (NOT a git repo at this level)
├── <REPO-1>/ … <REPO-N>/      # independent git repos, each with its own CLAUDE.md
└── docs/                      # its OWN git repo: the source-grounded knowledge base
    ├── README.md              # entry point: system summary, "which doc answers what", reading order, conventions
    ├── <system>-architecture-and-dependencies.md   # backend/core handbook
    ├── <ui-or-client>-onboarding-and-workflows.md  # one handbook per major surface (only if it exists)
    ├── deployment-and-cicd.md # how code reaches runtime
    ├── repo-dependency-map.md # repo↔repo edges + change-impact playbook
    ├── VERIFIED.md            # drift tracker: baselines + verified scope
    └── research/
        └── research-<topic>.md   # evidence files behind the handbooks
```

Why each piece exists:
- **Root `CLAUDE.md`** loads on every session. It routes questions (docs vs. code) and states cross-repo rules. Keep it short and index-like; put depth in `docs/`.
- **`docs/` is its own git repo** so every doc edit is diffable and revertable, and so doc changes ship separately from service code.
- **Handbooks** answer "how does X work". **Research files** hold the evidence (citations, call paths) behind the handbook claims, so a claim can be re-checked without re-deriving it.
- **Dependency map** answers "if I change X in repo A, what else changes". It is the most valuable file for cross-repo work.
- **VERIFIED.md** stops the docs from lying: it says what was checked, against which commit, and what was *not* checked.

## Phase 1 — Discover (read-only)

1. List the repos under `<ROOT>`. For each: language/framework, build tool, role in one line, owning team if visible, its own `CLAUDE.md`/agent-rules files, recorded git HEAD SHA (`git -C <REPO> rev-parse --short=10 HEAD`).
2. Use read-only parallel subagents (one per repo or per group, cheap model, Read/Grep/Glob only) to extract, **with `path:line` evidence**:
   - Public contracts: REST routes, events/queues/topics (producers and consumers), shared DB/cache/keys, shared model/client libraries and their version pins.
   - Cross-repo edges: who calls whom, who embeds whose artifact, who reads whose data.
   - Build/test/run commands, CI config, deploy mechanism (Helm, Terraform, scripts, pipelines).
   - Deprecated or WIP directories (mark them; do not document them as live).
3. Skip secrets. Note anything you could not read.

## 🛑 Gate 1 — Confirm scope with me

Show me: the repo table (name → role), the discovered cross-repo edge list (summary), the proposed doc set (which handbooks/research files make sense for *this* system; drop ones that do not apply, e.g. no UI → no UI handbook), and any repos you propose to exclude (scratch, personal, archives). Ask what the 5–10 most common cross-repo questions on my team are. Wait for approval.

## Phase 2 — Write the files

### 2a. Root `CLAUDE.md`
Sections, in order:
1. **Title + one-paragraph orientation:** "This directory is not a git repo. It holds every repo `<TEAM>` works on, each independent. Run git/build/test inside the individual repo, never here. Each repo's own `CLAUDE.md` takes precedence for work inside that repo."
2. **Repos table:** `repo | role` (one line each; flag WIP/deprecated honestly).
3. **Docs-first workflow for broad questions** (verbatim logic):
   1. Read docs first (README, then the index).
   2. **Verify before trusting:** check `VERIFIED.md` baselines/scope, spot-check the key source citations your answer depends on (line numbers drift), read the owning repo's guidance before source. If docs suffice after that, answer with doc-section citations and stop.
   3. If coverage is missing, stale or contradictory: investigate the owning repo, follow cross-repo contracts as needed. **Current source resolves conflicts between documents**; no document automatically outranks another.
   4. **Write back:** after answering from code, update the matching doc (add the missing section or correct the stale text, cite `repo/path:line`, keep existing structure and evidence labels). If no doc fits, add a new file under `docs/` and list it in the index. Tell the user what changed in `docs/`.
   5. **Narrow questions** (one function, one bug, one file) skip the docs and go straight to code.
4. **Doc conventions:**
   - Evidence labels: **Implemented** / **Config-dependent (flagged)** / **Legacy** / **Uncertain**. Source shows what code does, not what is deployed. Never claim production behavior from source alone.
   - Cite as `repo/relative/path:line`, relative to `<ROOT>`.
   - Keep `VERIFIED.md` honest: record last update, update baseline (source SHAs actually used), verified scope (claims actually checked). Do not imply untouched sections or unread repos were re-verified. Docs-only maintenance does not invent a new source SHA.
   - Correct stale claims in place and update handbook + research companions together; never leave two contradictory accounts.
   - Citation links: `docs/` is its own project, so links out to sibling repo checkouts only resolve on a local disk. Prefer plain `` `repo/path:line` `` in backticks. If you add a clickable link, use the host's anchor format (GitLab: `#L10-20`; GitHub: `#L10-L20`) — pick the one this team's host uses.
   - Never read secret-bearing files; never paste secrets into docs.
   - List any known-stale files ("do not use as evidence; use current source").
5. **Docs index table:** `file | covers`, with "start here for …" hints.
6. **Cross-repo rules:**
   - A change to an event, API contract or shared model usually spans repos. Check consumers before calling a change local.
   - Services that embed each other's client/model artifacts need a version bump downstream, not just a code edit.
   - Name deprecated dirs to ignore.
   - **Safety:** no deploys, infra applies, or anything against shared environments unless explicitly asked. State which repo applies only via CI.

### 2b. `docs/README.md`
- "The system in ~10 lines": the end-to-end flow, one bullet per major service/repo role, the transport between them (queues, REST, shared cache, shared libs), how it deploys.
- "Which doc answers what" table.
- "Reading order" per persona: new engineer / making a cross-repo change / debugging a stuck workflow / shipping or infra.
- "Conventions" paragraph: evidence labels, citation style, conflict resolution, where baselines live.

### 2c. Handbooks
One per major surface. Use numbered sections so other docs can cite `§N`. Typical skeleton: overview and logical topology → domain model → core execution flow → events/integrations → data/state → security/authorization → ops and failure diagnosis (symptom → cause → where to look) → extension points → **last section: "Verification status"** (date, baseline SHAs, scope, limits). Every non-obvious claim carries a `path:line` citation and an evidence label.

### 2d. `repo-dependency-map.md`
1. The map (ASCII and/or Mermaid) of repos and edge types.
2. Edge types legend: build-time (version pins/embedded artifacts), runtime sync (HTTP), runtime async (events/queues), shared state (cache/DB), data export/analytics, deploy-time.
3. **Repo cards:** per repo: role, what it owns, what it consumes, who consumes it, version pins, where to look first.
4. Where-to-look table (concern → repo → entry file).
5. **Change-impact playbook:** recipes of the form "If I change `<X>` in `<repo A>` → check `<these consumers>` → bump `<these pins>` → deploy order `<…>`." Write at least one recipe per shared contract.

### 2e. `deployment-and-cicd.md`
How code reaches runtime: per-service CI stages, versioning/tagging, where desired state lives (charts/values/Terraform), what applies automatically vs. manually vs. only via CI, environment promotion order, rollback and its caveats. Separate **source/desired state** from **observed deployment**; say which you could not observe.

### 2f. `research/research-*.md`
One per cross-cutting topic (internal deps, external deps, core business workflows, security/authz). Header block: date, source baselines, scope. Body: claim → evidence (`path:line`) → label. Handbook sections link here instead of duplicating evidence.

### 2g. `VERIFIED.md`
- Definitions: last document update; update baseline; verified scope.
- How to detect drift: `git -C <REPO> log --stat <baseline-sha>..HEAD -- <source-paths>`. An empty range does not prove the prose is right.
- Table: `repo | update baseline (SHA) | last doc update (date) | verified scope / carry-forward`.
- "Scoped verification ledger": `documents+sections | claims checked/corrected | source repos | limits`.
- Explicit statement of what was NOT run (no builds, tests, deploys, live queries) unless it was.

## 🛑 Gate 2 — Review before finishing

Show me the file list, line counts, the root `CLAUDE.md` in full, and a sample handbook section with its citations. Wait for approval, then apply requested edits.

## Phase 3 — Wire up and verify

1. `git init` in `docs/` (if not already), commit the initial set. Do not commit anything inside the individual repos.
2. Spot-check at least 10 citations chosen at random across the docs: open the cited file and line; fix or remove any that do not match. Report the hit rate honestly.
3. Run three real test questions from the list I gave you at Gate 1 against the new setup, following the docs-first workflow exactly. Report where the docs answered, where they were missing/stale, and what you wrote back.
4. Update `VERIFIED.md` with what you actually verified (and nothing else).

## Ground rules throughout

- Evidence over fluency: no claim without a `path:line` or an explicit **Uncertain** label.
- Never claim production/deployed behavior from source alone.
- Mark WIP, deprecated, and stubbed components as such. Do not document intent as behavior.
- Prefer the minimal doc set that answers real questions over exhaustive coverage. Add files when a question lacks a home, not in advance.
- Keep the root `CLAUDE.md` an index. If it grows past ~100 lines, move content into `docs/`.
- Do not run builds, tests, deploys, or anything against shared environments unless I ask.
- Report plainly what you did, what you skipped, and what you could not verify.

## Optional (ask me first)

- A repo-local `CLAUDE.md` or `rules/` in any repo that lacks one (build/test commands, conventions, gotchas).
- A custom slash command or skill that wraps the "docs-first, verify, write back" loop.
- A scheduled/CI check that diffs each repo's HEAD against `VERIFIED.md` baselines and flags docs that may have drifted.

Start with Phase 1 now.

---

# Future Scope ⚠️

> from docs workspace to a delivered, self-refreshing knowledge layer

Not part of the bootstrap. Build only after the docs-first workspace exists and a benchmark says more is needed.

### Principle
The docs repo is the **content** (human-reviewed: how services connect, why they were designed that way, what else breaks on change). Your existing RAG/MCP stack is the **delivery**. No new repo, no graph DB, no extra embeddings, no autonomous cross-repo edits. Content quality is the bottleneck, not retrieval infrastructure.

### Delivery
- Reuse the existing indexing webhook for the docs repo: enable the webhook on the docs project, plus a one-time backfill (webhooks usually sync only files in a push's commits). Check file-size and per-push limits.
- Add narrow, read-only MCP tools next to semantic search:
  - `get_doc(file, section)`: returns one section, not a chunk, with its metadata.
  - `check_freshness(repo|section)`: compares recorded baseline SHAs to current HEADs. Also flags a stale index (index version vs docs HEAD).
  - Later, only if needed: `list_impacted(repo, change_type)`, `trace_dependencies`.
- Known limits to check first: the managed chunker may split tables, diagrams and citations; stored files may lack commit SHA / indexed-at, so answers cannot show freshness. Fix with section-level docs and per-section metadata, not more files.
- Every answer carries the evidence label and baseline. Chat bots must repeat "source shows code, not what is deployed" and flag stale sections instead of answering confidently.

### SDD / spec-tool integration (OpenSpec, Spec Kit, or an internal plugin)
- Preflight before drafting a proposal: query the docs tools for affected repos, contracts, cited evidence, and explicit unknowns.
- At plan/design: contracts and data ownership. At tasks: group per repo, add contract tests.
- Before implementing: record the docs SHA in the spec, re-run `check_freshness` on cited sections, block on drift.
- After merge: propose doc updates.
- Wiring is mostly text (OpenSpec `config.yaml` `context:` and per-artifact `rules:`; Spec Kit constitution/prompts). Verify how any existing plugin invokes tools before building on it.

### Freshness: split by fact type
- **Derived facts** (pinned versions, queue listeners/publishers, URLs in config, IAM/queues, Helm values): automate fully. Scripts run on push to the main branch and write generated blocks or a plain YAML edge catalog (`origin: observed`, repo, path, SHA). Prose links to these; it never restates them. A generic code graph (SCIP/tree-sitter) is strong inside one repo but blind across services, because cross-service links are runtime wiring.
- **Human facts** (why, invariants, failure flows, ADRs): an agent drafts, a person approves. Never auto-merge prose.
- **Doc-update pipeline:** merge to main → webhook → deterministic path→doc-section filter (no match = no LLM cost) → agent receives diff + mapped sections + baseline SHA → opens a docs MR and advances the baseline → citations validated (path/line exist at SHA, links resolve) → the source-MR author approves.
- Efficiency: batch daily into one docs MR, cheap-model triage, mark drafts `unverified` until approved. Run it in the RAG stack (queue between webhook and updater) or per-repo CI with a headless agent (simpler, but one install per repo).
- **Backstop:** weekly drift job comparing each doc's baseline SHA to current HEADs. **Ownership:** whoever changes the code owns the doc change, enforced by automation.

### Make the docs machine-checkable (prerequisites)
- Per-section stable ID + front-matter: `sources` (repo/path globs), `baseline_sha`, `reviewed_by`, `reviewed_on`, `evidence_label`. The baseline tracker becomes a generated view. Add per-section code owners.
- Citation linter in docs CI: cite path + symbol with the line as a hint; fail on unresolved citations.
- One home per fact: handbooks hold narrative, research files hold evidence, neither restates the other.
- Provenance per section: human-reviewed or agent-drafted, with date.

### Phased plan (gate each phase on measured results)
0. **Baseline (~1 wk):** 10–30 real past cross-repo tasks with ground-truth affected repos/contracts (mine MRs sharing a ticket key). Run three ways: no context, docs-first workspace, docs + RAG tools. Score affected-repo recall/precision, citation validity, unsupported claims, time. Set the bar for building a catalog now.
1. **Publish (~1 wk):** webhook + backfill, `get_doc`, `check_freshness`. Exit: bot and MCP answer from docs and beat the baseline.
2. **SDD (~1 wk):** preflight rules in the spec tool; pilot on 2–3 real features. Exit: specs list affected repos with cited evidence and unknowns.
3. **Freshness automation (~2 wk):** path→section map, weekly drift job, doc-updater agent (batched, validated, author-approved). Exit: most doc-relevant merges yield valid drafts; sampled approvals hold.
4. **As needed:** generated YAML catalog + impact tools. Only if relationships are the observed miss.
5. **Only if adoption demands:** per-repo authz, tuned chunking, more SDD frameworks.

Gates: after phase 0, if the docs-first workspace already does well, shrink phases 1–2. After phase 1, tune chunking only if tables/citations retrieve badly. Before phase 4, require evidence that relationships are missed.

### Metrics
Share of sections fresh; share of citations that resolve; acceptance rate of agent-drafted docs MRs; benchmark score over time. Flat benchmark with rising freshness means a structure problem, which is when a catalog earns its place.

### Risks
- Stale docs giving confident wrong answers.
- No owner for docs upkeep.
- Inferred edges treated as facts (label them `inferred`).
- Reviewer fatigue on agent MRs: cap volume, small diffs.
- Prompt injection: the updater reads repo content as untrusted data and gets write access only to a docs branch.
- Generation scripts must skip secret-bearing files.
- Over-building before measuring.

### Open questions to answer before starting
- Is the docs repo already indexed? Do chunks carry commit SHA metadata? What is the chunking config?
- How does any existing spec plugin call tools?
- Who owns docs upkeep and approves docs MRs? Do engineers mostly work with repos cloned locally (if not, publishing via MCP matters more)?
