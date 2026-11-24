---
name: review-and-ship
description: Review the current branch for bugs, intent fit, and test coverage; run or write tests; commit focused work; open or update a GitLab MR.
---

# Review and ship

## Trigger

Reviewing changes before shipping. Close key issues, verify behavior, and open or update a merge request.

## Workflow

1. Gather context: diff against base branch, uncommitted changes, recent commits, changed files, and user intent from recent relevant chats if useful.
2. Run targeted tests for changed behavior. If no focused tests exist, decide whether to add them or document the gap.
3. Review for correctness, regressions, security, and intent fit. Use parallel subagents for larger diffs.
4. Fix critical issues before finalizing and re-run affected tests.
5. Commit selective files with a concise message.
6. Push branch and open or update an MR.

## Suggested Checks

```bash
git fetch origin main
git diff origin/main...HEAD
git status
glab mr view            # MR for the current branch, if one exists
glab ci status          # pipeline status for the current branch
```

Open or update the MR:

```bash
glab mr create --fill --target-branch main   # no MR yet
git push                                      # MR already exists: pushing updates it
```

## Guardrails

- Prioritize correctness, security, and regressions over style-only comments.
- Keep commits focused and avoid unrelated file changes.
- If pre-commit checks fail, fix the issues rather than bypassing hooks.
- Use `glab` for all GitLab operations; do not use `gh`.
- Judge MR readiness from `glab ci status` and `glab mr view`, not from GitHub Actions commands.

## Output

- Findings summary (critical, warning, note)
- Tests run and outcomes
- MR URL
