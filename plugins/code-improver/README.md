# Code Improver Plugin

Improves a code target through an autonomous review→fix loop.
`/code-improver:improve` — a dynamic workflow that dispatches a **pluggable reviewer**
(any installed skill or agent) and the plugin's own fixer agent until a review comes
back with zero critical/major findings or the loop starts oscillating.

The plugin's final pass strips its own residue (loop narration, stale docs, version churn),
and is itself scope-checked and read for regressions before the run reports success.

Adapted for the `skills-vault` marketplace. See [NOTICE.md](NOTICE.md).

## Usage

Three entry skills wire the loop to a target kind:

```
/code-improver:skill-improver ./plugins/my-plugin/skills/my-skill   # reviewer: engineering:critic
/code-improver:pr-improver main                                     # base branch; reviewer: engineering:critic
/code-improver:code-improver ./src --reviewer engineering:critic --scope 'src/**'
```

Natural language works too ("fix my skill", "clean up this branch until review
passes"). The session resolves the target and starts the workflow in the background.
Stop it at any time by stopping the workflow task; every round persists its state
first.

## What the loop guarantees

- **Completion means a clean review.** The loop can only end on a review with zero
  blocking findings. At the round cap it runs one final review-only round and, if that
  is not clean, exits loudly with **capped, NOT converged** and the open-findings list —
  never an unreviewed fix presented as done. The finalize pass edits the tree after that
  review, so its own edits are scope-checked and read for regressions too.
- **A findings ledger is the cross-round memory.** Every finding gets a stable id and
  one verdict (`fixed` / `rejected: reason` / `deferred`). The ledger is written to disk
  every round (`.code-improver/<target>/ledger.json`).
- **Oscillation escalates instead of looping.** Non-decreasing blocking counts, the same
  finding open across rounds, or a finding "fixed" twice stop the loop with a
  structural-escalation report.
- **A mechanical scope guard** runs after every fix round and after finalize.
- **An unavailable reviewer halts, never improvises.**

## Requirements

- **Claude Code with dynamic-workflow support** — the loop is a workflow script.
- **A reviewer.** Defaults for `skill-improver` / `pr-improver` use `engineering:critic`
  from this same marketplace (`/plugin install engineering@skills-vault`). The generic
  `code-improver` entry uses whatever skill or agent you name. A missing reviewer is a
  loud halt.
- **A git repository.** The scope guard diffs against a baseline commit. If the target
  is not in a repository, the run initializes one (identity `code-improver-baseline`) and
  says so loudly.

## Artifacts

Each run writes to `.code-improver/<target-name>/` in the working directory:

| File | Contents |
|---|---|
| `ledger.json` | Findings, verdicts, rounds, and the run result |
| `ledger.md` / `status.md` | Human-readable summary |
| `fixes-round-N.diff` | Cumulative diff after each fix round |
| `pre-finalize.diff` / `post-finalize.diff` | Diffs either side of finalize |
| `metrics.json` | Machine-countable metrics from `scripts/collect_metrics.py` |

Nothing is committed; all changes stay in the working tree.

## Layout

```
workflows/improve.js      # the loop
agents/fixer.md           # fixer contract
scripts/collect_metrics.py
skills/skill-improver/    # skills; default reviewer engineering:critic
skills/pr-improver/       # current branch; default reviewer engineering:critic
skills/code-improver/     # any target; reviewer and scope named by the user
tests/
evals/
```

## Troubleshooting

- **"escalation" result** — decide the design question it names, then re-run; the ledger
  carries forward.
- **"capped, NOT converged"** — raise `--max-rounds`, or fix listed findings manually.
- **"reviewer-unavailable" halt** — install `engineering@skills-vault` (or the plugin
  that provides your named reviewer) and re-run.
