#!/usr/bin/env python3
"""Fetch this week's authored GitLab MRs across known repos via glab CLI."""
import argparse
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from pathlib import Path

def load_repos():
    """GitLab project paths, one per line, from $MR_REPOS_FILE or ~/.claude/mr-repos.txt."""
    p = Path(os.environ.get("MR_REPOS_FILE", "~/.claude/mr-repos.txt")).expanduser()
    if not p.is_file():
        sys.exit(f"missing repo list: {p} (one GitLab project path per line)")
    return [l.strip() for l in p.read_text().splitlines() if l.strip() and not l.startswith("#")]


def fetch(repo, since, until):
    try:
        out = subprocess.run(
            ["glab", "mr", "list", "--author=@me", "--all", "-F", "json", "-R", repo],
            capture_output=True, text=True, timeout=30,
        )
        if out.returncode != 0:
            return []
        data = json.loads(out.stdout)
    except Exception:
        return []

    today = date.today().isoformat()
    name = repo.rsplit("/", 1)[-1]
    mrs = []
    for mr in data:
        updated = mr.get("updated_at", "")[:10]
        if since <= updated <= until:
            mrs.append({
                "repo": name,
                "iid": mr["iid"],
                "title": mr["title"],
                "state": mr["state"],
                "updated_at": updated,
                "web_url": mr["web_url"],
                "is_today": updated == today,
            })
    return mrs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", help="YYYY-MM-DD, default Monday this week")
    ap.add_argument("--until", help="YYYY-MM-DD inclusive, default today")
    a = ap.parse_args()
    today = date.today()
    since = a.since or (today - timedelta(days=today.weekday())).isoformat()
    until = a.until or today.isoformat()

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = [mr for mrs in pool.map(lambda r: fetch(r, since, until), load_repos()) for mr in mrs]

    results.sort(key=lambda m: m["updated_at"], reverse=True)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
