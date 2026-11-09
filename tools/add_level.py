#!/usr/bin/env python3
"""Convert a picture to the game's image format (WebP) and create its thumbnail.

Usage:  python3 tools/add_level.py path/to/picture.jpg [level-id]
        python3 tools/add_level.py path/to/picture.jpg --boss N      (boss picture)
        add --trim to cut plain margins (a white or black frame) around the picture first

- level-id is the level number (levels are numbered 1, 2, 3, ...). It defaults to the file
  name without extension, so name the file by its number (e.g. 31.jpg -> level 31).
- With --boss N the files go to assets/bosses/ instead of assets/levels/.
- Writes assets/levels/<id>.webp          (max 1800px on the long side)
         assets/levels/thumbs/<id>.webp   (max 480px, for the level cards)
- Tells you to raise LEVEL_COUNT in game.js.
Needs Pillow:  pip install pillow
"""
import os
import sys

from PIL import Image, ImageChops

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SIZES = {"": (1800, 80), "thumbs": (480, 75)}  # folder -> (max side, quality)


def fit(im, max_side):
    w, h = im.size
    k = min(1, max_side / max(w, h))
    return im.resize((round(w * k), round(h * k)), Image.LANCZOS) if k < 1 else im


def trim_margins(im, tolerance=40):
    """Cut the plain margin around the picture: whatever is close to the corner color."""
    corner = im.getpixel((0, 0))
    diff = ImageChops.difference(im, Image.new(im.mode, im.size, corner)).convert("L")
    box = diff.point(lambda v: 255 if v > tolerance else 0).getbbox()
    return im.crop(box) if box else im


def main():
    args = sys.argv[1:]
    trim = "--trim" in args
    if trim:
        args.remove("--trim")
    if not args:
        sys.exit(__doc__)

    folder_name = "levels"
    if "--boss" in args:
        i = args.index("--boss")
        if i + 1 >= len(args):
            sys.exit("--boss needs the boss number")
        level_id = args[i + 1]
        folder_name = "bosses"
        del args[i:i + 2]
        src = args[0]
    else:
        src = args[0]
        level_id = args[1] if len(args) > 1 else os.path.splitext(os.path.basename(src))[0]
    im = Image.open(src).convert("RGB")
    if trim:
        before = im.size
        im = trim_margins(im)
        print(f"trimmed margins: {before} -> {im.size}")

    for folder, (max_side, quality) in SIZES.items():
        out_dir = os.path.join(ROOT, "assets", folder_name, folder)
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, f"{level_id}.webp")
        fit(im, max_side).save(out, "WEBP", quality=quality, method=6)
        print(f"{os.path.relpath(out, ROOT)}  {os.path.getsize(out) // 1024} KB")

    if folder_name == "levels":
        print(f'\nLevel {level_id} is ready. In game.js raise LEVEL_COUNT so it includes level {level_id}.')
    else:
        print(f'\nBoss {level_id} is ready. Add it to the `bosses` list in boss.js.')


if __name__ == "__main__":
    main()
