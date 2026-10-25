# Changelog

All notable changes to Marvel Puzzle Game are listed here, newest first.
Versions follow [Semantic Versioning](https://semver.org/): new features bump the
minor number (0.X.0), bug fixes only bump the patch number (0.0.X).

## [0.21.1] (`7a97604`) - Existing levels keep their place
### Fixed
- **Progress looked erased after 0.21.0.** That version reordered the 10 existing
  levels by file name, so the levels you had solved moved to places like 10, 11,
  14, 19 and 26 and the first levels looked locked. The 10 existing levels are
  back in their original places (1 to 10) with your stars.
### Changed
- The 20 new pictures come **after** them, as levels 11-30, in the order of their
  file names (`level6`, `level7`, `level8`, `level9`, `level12`, `level13`, ...).
- Saves made while 0.21.0 was live (version 4) are converted to the new numbering.

## [0.21.0] (`8bb8d80`) - 30 levels
### Added
- **20 new levels**, from the full set of 30 pictures (`level1` to `level30`).
  Levels 11-20 are the **Hero** group (Easy 4x4 = 16 pieces, Medium 32, Hard 64)
  and levels 21-30 are the **Avenger** group (Easy 5x5 = 25, Medium 50, Hard 100).
  Legend and Cosmic are still locked as Coming soon.
### Changed
- (Replaced in 0.21.1.) **Level order now follows the file names**, `level1` to `level30`. The 10
  existing levels moved to the place their file name says (for example the
  Civil War picture was level 2 and is now level 10). Pictures that were already
  in the game were not added twice.
- Saved stars follow their pictures: saves are converted to the new numbering
  automatically (checked against all older save formats).
- The pictures are now named by number, `assets/levels/1.webp` to `30.webp`,
  all converted to WebP with thumbnails (total 4 MB).
- `tools/add_level.py` takes the level number, and adding a level means raising
  `LEVEL_COUNT` in `game.js`.

## [0.20.0] (`64e49e7`) - Level order and all groups
### Changed
- Levels are now numbered by file name, in order from 1 to 10. The last two
  levels, which were `level3` and `level4`, are now `9` and `10`
  (`assets/levels/9.webp`, `10.webp` and their thumbnails). Saved stars are
  kept: old saves are converted to the new names automatically.
### Added
- Choose Level shows **all** groups: Rookie, Hero, Avenger, Legend and Cosmic.
  Groups that have no levels yet show a locked **Coming soon** bar.
- Each group shows how many pieces its levels have (Easy, Medium, Hard), for
  example `9 · 18 · 36 pieces`.

## [0.19.1] (`8d4adcb`) - Sound balance
### Fixed
- **Music drowned out the sound effects on iPhone.** Safari ignores the volume
  of an audio element and always played the music at full volume. The music now
  goes through Web Audio, where its volume is respected on every device.
- **The Easy / Medium / Hard buttons had no click sound.** The click listener now
  catches every button before anything else handles it.
### Changed
- Sound effects are louder (1.8x, the click itself a bit more) and the music is
  softer (0.22), so clicks and moves are clearly heard over the music.

## [0.19.0] (`4e5ff1b`) - Music
### Added
- **Background music:** "Motif Hero" plays in a loop at a soft volume
  (`assets/audio/motif_hero.mp3`, 93 s, re-encoded to 128 kbps, trailing silence
  trimmed so the loop has no gap).
- The **Music** switch in Settings now works and is saved on the device.
- Music starts on the first tap (browsers block sound before that) and pauses
  when the game is in the background or the screen is off.
### Changed
- Removed the "coming soon" label from the Music switch.

## [0.18.0] (`4199e9f`) - More pieces every 10 levels
### Changed
- The number of pieces now grows every 10 levels instead of being set per level:
  - Levels 1-10 (**Rookie**): Easy 3x3 = 9, Medium 18, Hard 36 pieces.
  - Levels 11-20 (**Hero**): Easy 4x4 = 16, Medium 32, Hard 64.
  - Levels 21-30 (**Avenger**): Easy 5x5 = 25, Medium 50, Hard 100. And so on.
- Choose Level shows one section per group of 10. A new section appears by
  itself when level 11 is added.
- All 10 current levels are in the first group, so levels that were 4x4 on Easy
  are now 3x3. Saved stars are kept.
- Adding a level only needs its id (`tools/add_level.py` prints the line).
### Removed
- The per-level `grid` and `category` settings, and the old "Easy" section name
  (it was easy to confuse with the Easy difficulty).

## [0.17.0] (`0db7fae`) - Five new levels
### Added
- Five new levels, `4` to `8`: Marvel heroes, Avengers, Captain America vs Iron
  Man, Deadpool, and Iron Man with a hooded hero. There are now 10 levels,
  ordered by file name (`1` to `8`, then `level3`, `level4`).
- All pictures converted to WebP with thumbnails using `tools/add_level.py`.
- Easy grid: 4x4 for the new levels, 3x3 for level 7 (a small, narrow picture).

## [0.16.0] (`9cd3fc9`) - Landscape and zoom
### Added
- **Landscape:** the game adapts when the phone is turned sideways. The board
  now fills the free space on the screen in both directions, so wide pictures
  get much bigger pieces when the phone is horizontal.
- Landscape layouts for every screen: home (logo left, buttons right), Choose
  Level (4 cards per row), the picture view (picture left, difficulties right)
  and a lower win screen.
- **Zoom on the board:** pinch with two fingers to zoom and move around, or use
  the `−` / `+` buttons above the board (tap the `1×` label to reset). On a
  computer: Ctrl + mouse wheel or trackpad pinch. Up to 3×.
- While zoomed in, dragging a piece to the edge of the board scrolls the board.
### Changed
- The board is no longer limited to 360px. In portrait it uses the full width,
  so pieces are bigger on phones too.
- Zoom resets to 1× on a new level and when the puzzle is solved, so you see the
  whole picture.
- One finger drags a piece, two fingers zoom. A second finger cancels a drag in
  progress instead of moving a piece.

## [0.15.1] (`62db700`) - Rollback tool
### Added
- `tools/rollback.py`: restores the game to any earlier version in one new commit,
  without rewriting history. It can also roll forward again.
- README section on how versions, `main` and rollback work.

## [0.15.0] (`c119549`) - Difficulty levels instead of move stars
### Added
- Every level has **Easy**, **Medium** and **Hard**. Medium has twice the pieces
  of Easy and Hard has twice the pieces of Medium (for example 9, 18, 36 pieces,
  or 16, 32, 64). The grid is chosen per picture so the pieces stay close to square.
- **Stars = difficulty cleared**: 1 star for Easy, 2 for Medium, 3 for Hard.
- Medium opens after Easy is solved, and Hard after Medium.
- Tap a solved level in Choose Level to see its picture and pick a difficulty.
- The win screen has a button for the next difficulty (Medium or Hard).
- The game screen shows the difficulty under `LEVEL N`.
### Changed
- Stars no longer depend on the number of moves. The move counter stays as
  information only.
- The next level still opens after its Easy is solved.
- Progress is saved as the highest difficulty solved per level. Older saves are
  converted: a solved level counts as Easy solved.
### Removed
- Best move count and the NEW BEST message.

## [0.14.0] (`c88b08e`) - No spoilers
### Removed
- **Preview** button. The player now has to work out the picture.
- The blurred picture on the next level in Choose Level.
### Changed
- The next level to play is a dark card with a play sign and a gold outline. A
  picture only appears in Choose Level after the level is solved.
### Added
- `tools/add_level.py`: converts any picture to WebP (max 1200px) and creates its
  thumbnail. Steps for adding a level are in the README.

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
