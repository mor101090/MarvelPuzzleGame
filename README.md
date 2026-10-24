# MarvelPuzzleGame

## Adding a level

1. Convert the picture to WebP and create its thumbnail:
   `python3 tools/add_level.py path/to/picture.jpg`
2. Add the printed line to the `levels` list in `game.js`. The order of the list is the order of the levels.
3. Add an entry to `CHANGELOG.md`.


## Versions and rollback

- **`main` is always the latest working version.** The live site (GitHub Pages) is built from `main`.
- Work happens on a branch. When a version is ready it is merged into `main` with a pull request
  (a normal merge, never a squash, so the commit hashes in the changelog stay valid).
- Every version is listed in `CHANGELOG.md` with what changed and its commit hash.

**Roll back to an earlier version**

1. `python3 tools/rollback.py v0.14.0` restores all game files to that version and makes one new commit.
   History is never rewritten, so you can roll forward again the same way (`python3 tools/rollback.py v0.15.0`).
2. Push the branch and merge it into `main`. The live site updates after a minute or two.

Quick alternative for a single bad change: on GitHub open the merged pull request and press **Revert**.
