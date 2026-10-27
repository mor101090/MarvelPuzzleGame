# MarvelPuzzleGame

## Adding a level

1. Convert the picture to WebP and create its thumbnail. Level N is the picture named by its number:
   `python3 tools/add_level.py path/to/picture.jpg N`
2. In `game.js` raise `LEVEL_COUNT` so it includes level N. Levels run in the order of their numbers.
   Every 10 levels form a group with more pieces: Easy is 3x3 in levels 1-10, 4x4 in 11-20, 5x5 in 21-30, and so on
   (Medium has twice the pieces of Easy, Hard twice the pieces of Medium).
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


## Adding a boss

1. Convert the picture: `python3 tools/add_level.py path/to/picture.jpg --boss N`
2. Add `{ id: "N", cols: 3 }` to the `bosses` list in `boss.js`. Boss N comes after level group N
   (the boss list matches the groups in `game.js`: Rookie, Hero, Avenger, ...). `cols` is the number
   of columns the picture is cut into; the number of rows follows from the picture shape.
3. Add an entry to `CHANGELOG.md`.
