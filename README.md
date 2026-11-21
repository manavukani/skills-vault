# skills-vault

Marketplace of agent plugins for Claude Code and Cursor.

## Plugins

| Plugin | What you get | Claude | Cursor |
|--------|--------------|--------|--------|
| `writing-modes` | systems-architect, ADHD output, plain English, teach-me, plain-mode, onion-method | yes | yes |
| `thinking` | deepen, first-principles | yes | yes |
| `engineering` | audit-repo, setup-multi-repo, explain-diff-html, orchestration, scout, critic | yes | yes |
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

## External skills & marketplaces

Repos and plugins used alongside this vault:

| Source | Notes |
|--------|--------|
| [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Anthropic official Claude Code plugins |
| [obra/superpowers](https://github.com/obra/superpowers) | Superpowers skills (brainstorming, TDD, plans, etc.) |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Agent skills collection |
| [humanlayer/skills](https://github.com/humanlayer/skills) | HumanLayer skills |
| [uditgoenka/autoresearch](https://github.com/uditgoenka/autoresearch) | Autoresearch |
| [blader/humanizer](https://github.com/blader/humanizer) | Humanizer |
| [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | Diagram design |
| [dietrichgebert/ponytail](https://github.com/dietrichgebert/ponytail) | Ponytail |

```text
/plugin marketplace add anthropics/claude-plugins-official
/plugin marketplace add obra/superpowers
/plugin marketplace add addyosmani/agent-skills
/plugin marketplace add humanlayer/skills
/plugin marketplace add uditgoenka/autoresearch
/plugin marketplace add blader/humanizer
/plugin marketplace add cathrynlavery/diagram-design
/plugin marketplace add dietrichgebert/ponytail
```

## Verify

```bash
bash scripts/verify-marketplace.sh
```
