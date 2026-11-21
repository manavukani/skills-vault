# skills-vault marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize skills-vault into a dual Claude/Cursor marketplace with four fatter plugins: `writing-modes`, `thinking`, `engineering`, and Claude-only `side-chat`.

**Architecture:** Move existing skills/commands/agents into `plugins/<name>/` trees with per-plugin manifests. Root `.claude-plugin/marketplace.json` lists all four; root `.cursor-plugin/marketplace.json` lists the three dual plugins. Personal `CLAUDE.md` and WIP notes stay unscoped.

**Tech Stack:** Agent Skills (`SKILL.md`), Claude Code plugins, Cursor plugins, JSON manifests, Markdown commands/agents.

## Global Constraints

- Fewer, fatter plugins only — do not split further.
- Do not ship personal `CLAUDE.md` content into plugins.
- Do not rewrite skill/command/agent instructional bodies except adding `name:` to command frontmatter.
- Cursor marketplace omits `side-chat`.
- Marketplace name: `skills-vault`. Plugin sources: `./plugins/<name>`.

---

### Task 1: Scaffold plugin dirs + marketplace catalogs

**Files:**
- Create: `.claude-plugin/marketplace.json`
- Create: `.cursor-plugin/marketplace.json`
- Create: `plugins/writing-modes/.claude-plugin/plugin.json`
- Create: `plugins/writing-modes/.cursor-plugin/plugin.json`
- Create: `plugins/thinking/.claude-plugin/plugin.json`
- Create: `plugins/thinking/.cursor-plugin/plugin.json`
- Create: `plugins/engineering/.claude-plugin/plugin.json`
- Create: `plugins/engineering/.cursor-plugin/plugin.json`

**Interfaces:**
- Produces: empty plugin trees ready for `git mv` of components; marketplace entries pointing at `./plugins/<name>`

- [ ] **Step 1: Write Claude marketplace catalog**

```json
{
  "name": "skills-vault",
  "owner": { "name": "manavukani" },
  "metadata": {
    "description": "Writing modes, thinking tools, engineering agents, and Claude Code mods"
  },
  "plugins": [
    {
      "name": "writing-modes",
      "source": "./plugins/writing-modes",
      "description": "ADHD-friendly output, plain English, teach-me, plain-mode, and onion-method"
    },
    {
      "name": "thinking",
      "source": "./plugins/thinking",
      "description": "Deepen prompts and first-principles problem solving"
    },
    {
      "name": "engineering",
      "source": "./plugins/engineering",
      "description": "Repo audit, interactive diff explainers, scout and critic agents"
    },
    {
      "name": "side-chat",
      "source": "./plugins/side-chat",
      "description": "/btw opens a side-chat pane instead of printing into the transcript"
    }
  ]
}
```

- [ ] **Step 2: Write Cursor marketplace catalog (no side-chat)**

```json
{
  "name": "skills-vault",
  "owner": { "name": "manavukani" },
  "metadata": {
    "description": "Writing modes, thinking tools, and engineering agents for Cursor"
  },
  "plugins": [
    {
      "name": "writing-modes",
      "source": "./plugins/writing-modes",
      "description": "ADHD-friendly output, plain English, teach-me, plain-mode, and onion-method"
    },
    {
      "name": "thinking",
      "source": "./plugins/thinking",
      "description": "Deepen prompts and first-principles problem solving"
    },
    {
      "name": "engineering",
      "source": "./plugins/engineering",
      "description": "Repo audit, interactive diff explainers, scout and critic agents"
    }
  ]
}
```

- [ ] **Step 3: Write dual plugin manifests**

Each of `writing-modes`, `thinking`, `engineering` gets both:

`.claude-plugin/plugin.json` and `.cursor-plugin/plugin.json`:

```json
{
  "name": "writing-modes",
  "version": "1.0.0",
  "description": "ADHD-friendly output, plain English, teach-me, plain-mode, and onion-method"
}
```

```json
{
  "name": "thinking",
  "version": "1.0.0",
  "description": "Deepen prompts and first-principles problem solving"
}
```

```json
{
  "name": "engineering",
  "version": "1.0.0",
  "description": "Repo audit, interactive diff explainers, scout and critic agents"
}
```

- [ ] **Step 4: Commit scaffold**

```bash
git add .claude-plugin .cursor-plugin plugins
git commit -m "Scaffold skills-vault marketplace catalogs and plugin manifests"
```

---

### Task 2: Migrate components into fat plugins

**Files:**
- Move: `skills/i-have-adhd` → `plugins/writing-modes/skills/i-have-adhd`
- Move: `skills/claudish-to-english` → `plugins/writing-modes/skills/claudish-to-english`
- Move: `commands/teach-me.md` → `plugins/writing-modes/commands/teach-me.md`
- Move: `commands/plain-mode.md` → `plugins/writing-modes/commands/plain-mode.md`
- Move: `commands/onion-method.md` → `plugins/writing-modes/commands/onion-method.md`
- Move: `commands/deepen.md` → `plugins/thinking/commands/deepen.md`
- Move: `commands/first-principles.md` → `plugins/thinking/commands/first-principles.md`
- Move: `commands/audit-repo.md` → `plugins/engineering/commands/audit-repo.md`
- Move: `skills/explain-diff-html` → `plugins/engineering/skills/explain-diff-html`
- Move: `agents/scout.md` → `plugins/engineering/agents/scout.md`
- Move: `agents/critic.md` → `plugins/engineering/agents/critic.md`
- Move: `my-mods/side-chat` → `plugins/side-chat`
- Delete: `my-mods/.claude-plugin/marketplace.json` (and empty `my-mods/`)
- Modify: each moved command frontmatter — insert `name: <filename-stem>` as first frontmatter key

**Interfaces:**
- Consumes: scaffold from Task 1
- Produces: fully populated plugin trees; empty legacy dirs removed

- [ ] **Step 1: Create destination dirs and git mv**

```bash
mkdir -p plugins/writing-modes/{skills,commands} \
  plugins/thinking/commands \
  plugins/engineering/{skills,commands,agents}

git mv skills/i-have-adhd plugins/writing-modes/skills/
git mv skills/claudish-to-english plugins/writing-modes/skills/
git mv commands/teach-me.md plugins/writing-modes/commands/
git mv commands/plain-mode.md plugins/writing-modes/commands/
git mv commands/onion-method.md plugins/writing-modes/commands/
git mv commands/deepen.md plugins/thinking/commands/
git mv commands/first-principles.md plugins/thinking/commands/
git mv commands/audit-repo.md plugins/engineering/commands/
git mv skills/explain-diff-html plugins/engineering/skills/
git mv agents/scout.md plugins/engineering/agents/
git mv agents/critic.md plugins/engineering/agents/
git mv my-mods/side-chat plugins/side-chat
```

- [ ] **Step 2: Add `name:` to each command frontmatter**

For each command file, ensure YAML frontmatter starts with `name:` matching the filename stem. Example for `deepen.md`:

```yaml
---
name: deepen
description: Make a task deeper, not bigger. Rewrites your prompt around expert practice, raw sources, real methods, and external verification.
argument-hint: <the task or prompt to deepen>
---
```

Same pattern for: `first-principles`, `onion-method`, `plain-mode`, `teach-me`, `audit-repo`.

- [ ] **Step 3: Remove obsolete my-mods marketplace and empty dirs**

```bash
git rm -r my-mods/.claude-plugin 2>/dev/null || rm -rf my-mods/.claude-plugin
rmdir skills commands agents my-mods 2>/dev/null || true
# If dirs still have junk, list and remove only empty leftovers
```

- [ ] **Step 4: Verify tree**

```bash
find plugins -type f | sort
test -f .claude-plugin/marketplace.json
test -f .cursor-plugin/marketplace.json
test ! -d my-mods/side-chat
```

Expected: all components under `plugins/`; no leftover top-level `skills/`/`commands/`/`agents/` content.

- [ ] **Step 5: Commit migration**

```bash
git add -A plugins skills commands agents my-mods
git commit -m "Move skills, commands, and agents into fat marketplace plugins"
```

---

### Task 3: README + structure verification

**Files:**
- Create: `README.md`
- Create: `scripts/verify-marketplace.sh` (optional cheap check)

**Interfaces:**
- Consumes: final plugin tree from Task 2
- Produces: install docs; exit-0 structure check

- [ ] **Step 1: Write README.md**

```markdown
# skills-vault

Marketplace of agent plugins for Claude Code and Cursor.

## Plugins

| Plugin | What you get | Claude | Cursor |
|--------|--------------|--------|--------|
| `writing-modes` | ADHD output, plain English, teach-me, plain-mode, onion-method | yes | yes |
| `thinking` | deepen, first-principles | yes | yes |
| `engineering` | audit-repo, explain-diff-html, scout, critic | yes | yes |
| `side-chat` | `/btw` side-chat pane | yes | no |

## Install — Claude Code

\`\`\`text
/plugin marketplace add manavukani/skills-vault
/plugin install writing-modes@skills-vault
/plugin install thinking@skills-vault
/plugin install engineering@skills-vault
/plugin install side-chat@skills-vault
\`\`\`

## Install — Cursor

1. Customize → Plugins → From GitHub Repository
2. Paste `manavukani/skills-vault`
3. Install `writing-modes`, `thinking`, and/or `engineering`

## Local smoke (Claude)

\`\`\`bash
claude --plugin-dir ./plugins/writing-modes
# or: /plugin marketplace add /absolute/path/to/skills-vault
\`\`\`

## Layout

See `docs/superpowers/specs/2026-11-21-skills-vault-marketplace-design.md`.
```

- [ ] **Step 2: Write verify script**

```bash
#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

python - <<'PY'
import json, sys
from pathlib import Path
root = Path(".")
for rel in [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"]:
    data = json.loads((root/rel).read_text())
    assert data["name"] == "skills-vault", rel
    for p in data["plugins"]:
        src = root / p["source"]
        assert src.is_dir(), f"missing {src}"
        assert (src / ".claude-plugin" / "plugin.json").is_file() or (src / ".cursor-plugin" / "plugin.json").is_file(), src
claude = json.loads((root/".claude-plugin/marketplace.json").read_text())
cursor = json.loads((root/".cursor-plugin/marketplace.json").read_text())
assert {p["name"] for p in claude["plugins"]} == {"writing-modes","thinking","engineering","side-chat"}
assert {p["name"] for p in cursor["plugins"]} == {"writing-modes","thinking","engineering"}
# component presence
assert (root/"plugins/writing-modes/skills/i-have-adhd/SKILL.md").is_file()
assert (root/"plugins/writing-modes/skills/claudish-to-english/SKILL.md").is_file()
assert (root/"plugins/thinking/commands/deepen.md").is_file()
assert (root/"plugins/engineering/agents/scout.md").is_file()
assert (root/"plugins/side-chat/.claude-plugin/plugin.json").is_file()
print("OK")
PY
```

- [ ] **Step 3: Run verification**

```bash
bash scripts/verify-marketplace.sh
```

Expected: `OK`

- [ ] **Step 4: Commit docs + script**

```bash
git add README.md scripts/verify-marketplace.sh docs/superpowers/plans
git commit -m "Add marketplace README and structure verification script"
```
