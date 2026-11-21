# Multi-repo future scope

> Reference only. Not part of `/setup-multi-repo` bootstrap.

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
