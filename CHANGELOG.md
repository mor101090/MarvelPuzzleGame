# Changelog

All notable changes to Marvel Puzzle Game are listed here, newest first.
Versions follow [Semantic Versioning](https://semver.org/): new features bump the
minor number (0.X.0), bug fixes only bump the patch number (0.0.X).

## [0.13.0] (`26e2c05`) - Three new levels and faster images
### Added
- Three new levels: Wolverine, Civil War and Iron Man. There are now 5 levels,
  ordered by file name: `1`, `2`, `3`, `level3`, `level4`.
- Small thumbnails (480px) for the Choose Level cards, so the menu loads fast.
- The next level's picture is loaded in the background while you play.
### Changed
- All pictures are now **WebP**, at most 1200px on the long side. Total size went
  from 1.4 MB to 0.7 MB for the full pictures.
- Pictures moved to `assets/levels/` (`level3.jpeg` and `level4.jpg` are gone from
  the project root).
- Progress is saved per level id instead of position, so adding or reordering
  levels never mixes up saved stars. Old saves are converted automatically.
- A solved level always stays open, even if an earlier level is not solved.

## [0.12.0] (`c4bf4ac`) - Choose Level uses the gallery design
### Changed
- Choose Level no longer uses red number cards. Every level is now a picture card
  in the gallery style, with the level name at the bottom:
  - **Solved:** the picture, `LEVEL N` and the earned stars.
  - **Open, not solved yet:** the picture blurred, with a play sign.
  - **Locked:** grey with a padlock.
### Removed
- The red number cards and the check mark.

## [0.11.0] (`8038719`) - Gallery merged into Choose Level
### Changed
- The gallery is now part of **Choose Level**. A solved level shows its picture
  with the level number and stars. Open levels stay red, locked levels grey.
- Tapping a solved level opens its picture full size, with stars, best moves and
  a **Play Again** button. Tap outside to close.
### Removed
- The separate Gallery screen and both Gallery buttons (home and Choose Level),
  including `assets/ui/Gallery.png`.

## [0.10.0] (`e1fecb3`) - Gallery on the home screen
### Added
- **Gallery** button on the home screen, in the same style as Play and Choose
  Level (`assets/ui/Gallery.png`, made from the Choose Level button).
### Changed
- Back in the gallery returns to wherever you came from: home or Choose Level.

## [0.9.0] (`fd521cf`) - Preview
### Added
- **Preview** button between the move counter and the stars. It shows the full
  picture over the board for 3 seconds. Tap the button or the picture to hide it
  sooner. Starting a drag also hides it.
- Using Preview does not cost stars.
### Changed
- On very narrow phones (320px) the move counter and stars are slightly smaller.

## [0.8.0] (`6180a9d`) - Gallery
### Added
- **Gallery** screen, opened from the **Gallery** button on the Choose Level screen.
  Every picture you solve is saved there. Unsolved pictures show a padlock.
- Tap a picture to see it full size, with its stars and best move count.
- Counter of collected pictures (`1 / 2 PICTURES`).
- New levels appear in the gallery automatically.

## [0.7.0] (`02a8926`) - Win screen
### Added
- **Win screen** appears shortly after the last piece lands, so you first see the
  finished picture. It shows the earned stars (popping in one by one with a sound
  and vibration), your moves, and your best or **NEW BEST!**.
- Buttons: **Next Level**, **Replay** (new shuffle of the same level) and **Levels**.
- Tapping outside the win screen closes it to look at the picture. A button to
  continue stays under the board.
### Changed
- After the last level the button is **Levels** instead of restarting the game.
- Leaving the level before the win screen shows never makes it pop up later.

## [0.6.0] (`27b8fc7`) - Moves and stars
### Added
- **Move counter** in the game screen. Every piece or group move counts.
- **Star rating** (1 to 3 stars) based on the number of moves. The stars at the
  top right update live while you play, so you can see what you are about to get.
  Defaults: 3 stars up to 1.5 moves per piece, 2 stars up to 2.5 moves per piece.
  A level can override this with `starMoves: [threeStars, twoStars]`.
- Best result (stars and moves) saved per level.
- Level cards show the earned stars and the best move count.
### Changed
- Saved progress now includes `best`. Existing saves keep working: solved levels
  without a result show the old check mark until replayed.

## [0.5.1] (`bd04c6b`) - Back button color
### Changed
- The Back button is now translucent red, matching the other red buttons.

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
