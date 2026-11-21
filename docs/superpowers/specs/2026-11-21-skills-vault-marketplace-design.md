---
title: skills-vault marketplace
kind: repo
updated: 2026-11-21
---

# skills-vault marketplace design

## Context

`skills-vault` is a personal collection of Agent Skills, slash commands, subagents, and one Claude Code mod (`side-chat`). Layout already resembles Claude’s plugin folders (`skills/`, `commands/`, `agents/`) but has no marketplace catalogs, so strangers cannot install via Claude Code or Cursor. Goal: reorganize into a dual marketplace (Claude + Cursor) with fewer, fatter plugins.

## Decisions

- Packaging shape: **marketplace of multiple plugins**, not one kitchen-sink plugin.
- Granularity: **fewer, fatter plugins** (not one-plugin-per-file).
- Personal root `CLAUDE.md` (persona, Obsidian paths, orchestration policy) **does not ship** in any plugin.
- WIP notes (`plan/`, `plans for new plugins/`, `external.txt`, `multi-repo-context-setup-prompt.md`) stay out of plugin packages.
- Official Cursor/Claude store submission is **out of scope**; git-repo-as-marketplace is enough.

## Plugin map

| Plugin | Contents | Hosts |
|--------|----------|-------|
| `writing-modes` | skills: `i-have-adhd`, `claudish-to-english`; commands: `teach-me`, `plain-mode`, `onion-method` | Claude + Cursor |
| `thinking` | commands: `deepen`, `first-principles` | Claude + Cursor |
| `engineering` | command: `audit-repo`; skill: `explain-diff-html`; agents: `scout`, `critic` | Claude + Cursor |
| `side-chat` | existing Claude hooks mod (moved from `my-mods/side-chat`) | Claude only |

## Target layout

```text
skills-vault/
├── .claude-plugin/
│   └── marketplace.json
├── .cursor-plugin/
│   └── marketplace.json
├── plugins/
│   ├── writing-modes/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── .cursor-plugin/plugin.json
│   │   ├── skills/
│   │   └── commands/
│   ├── thinking/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── .cursor-plugin/plugin.json
│   │   └── commands/
│   ├── engineering/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── .cursor-plugin/plugin.json
│   │   ├── skills/
│   │   ├── commands/
│   │   └── agents/
│   └── side-chat/
│       ├── .claude-plugin/plugin.json
│       └── hooks/
├── docs/superpowers/specs/
├── README.md
└── CLAUDE.md                    # personal; not listed by marketplace
```

## Marketplace catalogs

### Claude (`.claude-plugin/marketplace.json`)

- Marketplace `name`: `skills-vault`
- Lists all four plugins with `source: "./plugins/<name>"`
- Owner: repo owner identity (`manavukani` / matching GitHub)

### Cursor (`.cursor-plugin/marketplace.json`)

- Marketplace `name`: `skills-vault`
- Lists `writing-modes`, `thinking`, `engineering` only
- Omits `side-chat` (Claude-only hooks/mod)

Per-plugin manifests use default component discovery (`skills/`, `commands/`, `agents/`). No custom path overrides unless a move forces them.

## Migration

1. Create `plugins/{writing-modes,thinking,engineering,side-chat}/` with required manifests.
2. `git mv` existing component files into the matching plugin trees. Do not rewrite skill/command/agent bodies except:
   - Add `name:` frontmatter to commands that currently only have `description` (Cursor expects `name`; filename is the source of truth).
3. Move `my-mods/side-chat` → `plugins/side-chat`; remove obsolete `my-mods/.claude-plugin/marketplace.json`.
4. Remove empty top-level `skills/`, `commands/`, `agents/`, and `my-mods/` after moves.
5. Add root `README.md` with install instructions for both hosts.

## Install story

**Claude Code**

```text
/plugin marketplace add manavukani/skills-vault
/plugin install writing-modes@skills-vault
/plugin install thinking@skills-vault
/plugin install engineering@skills-vault
/plugin install side-chat@skills-vault
```

**Cursor**

Customize → Plugins → From GitHub Repository → `manavukani/skills-vault` → install `writing-modes`, `thinking`, `engineering`.

## Compatibility notes

- Skills already use Agent Skills frontmatter (`name`, `description`) — keep as-is.
- Agents keep Claude-specific fields (`model`, `tools`); Cursor ignores unknown keys.
- `side-chat` remains Claude-only; no `.cursor-plugin/plugin.json`.

## Out of scope

- Publishing to official Cursor Marketplace or Claude Marketplace websites
- Rewriting skill/command/agent instructional content
- Extracting orchestration policy from personal `CLAUDE.md` into a fifth plugin
- Heavy CI; optional cheap structure/manifest path check is allowed

## Verification

- Both marketplace JSON files parse; every `source` path exists and contains expected component folders
- No personal absolute paths (Obsidian, home dirs) appear under `plugins/`
- Claude: local marketplace add from clone path; install each of the four plugins
- Cursor: import repo as marketplace; three plugins appear; `side-chat` absent
