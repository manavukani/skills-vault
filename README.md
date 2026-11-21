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

```text
/plugin marketplace add manavukani/skills-vault
/plugin install writing-modes@skills-vault
/plugin install thinking@skills-vault
/plugin install engineering@skills-vault
/plugin install side-chat@skills-vault
```

## Install — Cursor

1. Customize → Plugins → From GitHub Repository
2. Paste `manavukani/skills-vault`
3. Install `writing-modes`, `thinking`, and/or `engineering`

## Local smoke (Claude)

```bash
claude --plugin-dir ./plugins/writing-modes
# or: /plugin marketplace add /absolute/path/to/skills-vault
```

## Layout

See [docs/superpowers/specs/2026-11-21-skills-vault-marketplace-design.md](docs/superpowers/specs/2026-11-21-skills-vault-marketplace-design.md).

## Verify

```bash
bash scripts/verify-marketplace.sh
```
