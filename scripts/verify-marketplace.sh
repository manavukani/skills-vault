#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

python - <<'PY'
import json
from pathlib import Path

root = Path(".")
for rel in [".claude-plugin/marketplace.json", ".cursor-plugin/marketplace.json"]:
    data = json.loads((root / rel).read_text(encoding="utf-8"))
    assert data["name"] == "skills-vault", rel
    for p in data["plugins"]:
        src = root / p["source"]
        assert src.is_dir(), f"missing {src}"
        has_manifest = (
            (src / ".claude-plugin" / "plugin.json").is_file()
            or (src / ".cursor-plugin" / "plugin.json").is_file()
        )
        assert has_manifest, f"no plugin.json under {src}"

claude = json.loads((root / ".claude-plugin/marketplace.json").read_text(encoding="utf-8"))
cursor = json.loads((root / ".cursor-plugin/marketplace.json").read_text(encoding="utf-8"))
assert {p["name"] for p in claude["plugins"]} == {
    "writing-modes",
    "thinking",
    "engineering",
    "security",
    "code-improver",
    "side-chat",
}
assert {p["name"] for p in cursor["plugins"]} == {
    "writing-modes",
    "thinking",
    "engineering",
    "security",
}

assert (root / "plugins/writing-modes/skills/i-have-adhd/SKILL.md").is_file()
assert (root / "plugins/writing-modes/skills/claudish-to-english/SKILL.md").is_file()
assert (root / "plugins/writing-modes/commands/teach-me.md").is_file()
assert (root / "plugins/writing-modes/commands/systems-architect.md").is_file()
assert (root / "plugins/thinking/commands/deepen.md").is_file()
assert (root / "plugins/engineering/agents/scout.md").is_file()
assert (root / "plugins/engineering/agents/critic.md").is_file()
assert (root / "plugins/engineering/commands/setup-multi-repo.md").is_file()
assert (root / "plugins/engineering/skills/explain-diff-html/SKILL.md").is_file()
assert (root / "plugins/engineering/skills/orchestration/SKILL.md").is_file()
assert (root / "plugins/engineering/skills/verify-this/SKILL.md").is_file()
assert (root / "plugins/engineering/skills/thermo-nuclear-code-quality-review/SKILL.md").is_file()
assert (root / "plugins/engineering/skills/review-and-ship/SKILL.md").is_file()
assert (root / "plugins/engineering/skills/mr-review-canvas/SKILL.md").is_file()
assert (root / "plugins/engineering/skills/daily-review/SKILL.md").is_file()
assert (root / "plugins/engineering/skills/weekly-review/SKILL.md").is_file()
assert (root / "plugins/security/commands/audit-repo.md").is_file()
assert (root / "plugins/security/commands/audit-insecure-defaults.md").is_file()
assert (root / "plugins/security/workflows/audit.js").is_file()
assert (root / "plugins/side-chat/.claude-plugin/plugin.json").is_file()
assert (root / "plugins/code-improver/.claude-plugin/plugin.json").is_file()
assert (root / "plugins/code-improver/workflows/improve.js").is_file()
assert (root / "plugins/code-improver/skills/code-improver/SKILL.md").is_file()
print("OK")
PY
