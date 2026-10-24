# Changelog

All notable changes to Marvel Puzzle Game are listed here, newest first.
Versions follow [Semantic Versioning](https://semver.org/): new features bump the
minor number (0.X.0), bug fixes only bump the patch number (0.0.X).

## [0.5.0] (`f295bb4`) - Level select and progress
### Added
- **Choose Level** screen with big level cards, in the style of the home screen.
- Levels are grouped by category. First category: **Easy**.
- Locked levels show a padlock and unlock when the previous level is solved.
  Tapping a locked level plays an error sound, vibrates and shakes the card.
- Solved levels get a check mark and can be replayed.
- Progress is saved on the device (`localStorage`).
- **Play** continues from the first unsolved level.
- The current level is shown in the game screen (`LEVEL 1`, `LEVEL 2`, ...).
### Changed
- The game screen uses the same grey comic background as the home screen.
- Win message is bigger and outlined to stay readable on the new background.

## [0.4.0] (`ff9cc14`) - Vibration everywhere
### Added
- Vibration on every button press.
- A short "tick" vibration each time a dragged piece passes over a new cell.
- iPhone fallback for vibration (iOS 18+), since Safari has no `navigator.vibrate`.
### Changed
- Stronger vibration when picking up a piece.

## [0.3.0] (`5d23799`) - Group dragging, settings and sound
### Added
- **Group dragging:** pieces that sit correctly next to each other join into a
  group. The red line between them disappears and dragging one moves them all.
  Pieces in the destination slide into the cells the group left.
- **Settings** window (home and in-game gear): sound effects, music
  (placeholder, no music yet) and vibration switches, saved on the device.
- **Sound effects** generated in code: button click, pick up, drop, snap,
  invalid move and win.
- **Vibration** on pick up, drop, snap, invalid move and win.
- Pieces now drop by where the dragged piece lands, not where the finger is.

## [0.2.0] (`0ca254c`) - Bug fixes
### Fixed
- Board border squeezed the pieces, so the image was misaligned and the last
  row overflowed the board.
- Borders on pieces moved the image by 1px, leaving seams in the solved puzzle.
- A dragged piece could get stuck on screen and freeze the game (cancelled touch,
  incoming call, window losing focus).
- Board was too wide on narrow phones. It now scales and follows window resize.
- Shuffle could start with an already solved board.
- A slow image load from a previous level could overwrite the new level.
- After the last level the game hit a dead end. It now shows **PLAY AGAIN**.
- Right click and a second finger could start a drag.
### Changed
- Dragging uses Pointer Events (mouse, touch and pen in one place).
- The dragged piece is centered under the pointer, the original is dimmed.
- Game board is aligned to the top, under the Back button.

## [0.1.0] (`a648ea5`) - Home screen
### Added
- Basic picture puzzle: drag and swap pieces, win message, next level button.
- Two levels: 3x3 and 4x4.
- Home screen with logo, **Play** button and settings icon (not yet working).
