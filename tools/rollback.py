#!/usr/bin/env python3
"""Roll the game back to an earlier version, without rewriting history.

Usage:  python3 tools/rollback.py v0.14.0

What it does:
  1. Finds the version's commit: the git tag if it exists, otherwise the commit
     hash written next to the version in CHANGELOG.md.
  2. Restores every file to how it was in that version (new files are removed).
     The tools/ folder and README.md are kept as they are now.
  3. Keeps CHANGELOG.md as it is and adds a "Rollback" entry on top.
  4. Makes one new commit. Nothing is deleted from history, so you can always
     roll forward again with:  python3 tools/rollback.py <newer version>

Then push the branch and merge it into main (a pull request) to update the live site.
"""
import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def git(*args, check=True):
    result = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)
    if check and result.returncode != 0:
        sys.exit(f"git {' '.join(args)} failed:\n{result.stderr.strip()}")
    return result.stdout.strip()


def find_commit(version, changelog):
    tag = f"v{version}"
    if git("rev-parse", "--verify", "--quiet", f"refs/tags/{tag}", check=False):
        return git("rev-parse", f"{tag}^{{commit}}")
    match = re.search(rf"## \[{re.escape(version)}\] \(`([0-9a-f]{{7,40}})`\)", changelog)
    if not match:
        sys.exit(f"Version {version} not found (no tag, and no commit hash in CHANGELOG.md).")
    return git("rev-parse", f"{match.group(1)}^{{commit}}")


def next_patch(changelog):
    top = re.search(r"## \[(\d+)\.(\d+)\.(\d+)\]", changelog)
    major, minor, patch = map(int, top.groups())
    return f"{major}.{minor}.{patch + 1}"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    if git("status", "--porcelain"):
        sys.exit("You have uncommitted changes. Commit or stash them first.")

    version = sys.argv[1].lstrip("v")
    changelog_path = os.path.join(ROOT, "CHANGELOG.md")
    changelog = open(changelog_path, encoding="utf-8").read()

    commit = find_commit(version, changelog)
    short = git("rev-parse", "--short", commit)

    # files exactly as in that version (also removes files added later)
    git("read-tree", "-u", "--reset", commit)
    # the tools and the README stay as they are now, so you can always roll forward again
    git("checkout", "HEAD", "--", "tools", "README.md")

    new_version = next_patch(changelog)
    entry = (
        f"## [{new_version}] - Rollback to {version}\n"
        f"### Changed\n"
        f"- The game files were restored to version {version} (`{short}`). "
        f"Nothing was deleted from history.\n\n"
    )
    first = changelog.index("## [")
    with open(changelog_path, "w", encoding="utf-8") as f:
        f.write(changelog[:first] + entry + changelog[first:])

    git("add", "-A")
    git("commit", "-m", f"Roll back to v{version} ({short})")
    print(f"Rolled back to v{version} ({short}). New version in CHANGELOG: {new_version}")
    print("Next: push the branch and merge it into main to update the live site.")


if __name__ == "__main__":
    main()
