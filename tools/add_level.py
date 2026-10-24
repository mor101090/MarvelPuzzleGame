#!/usr/bin/env python3
"""Convert a picture to the game's image format (WebP) and create its thumbnail.

Usage:  python3 tools/add_level.py path/to/picture.jpg [level-id]

- level-id defaults to the file name without extension (e.g. 4.jpg -> "4").
- Writes assets/levels/<id>.webp          (max 1200px on the long side)
         assets/levels/thumbs/<id>.webp   (max 480px, for the level cards)
- Prints the line to add to the `levels` list in game.js.
Needs Pillow:  pip install pillow
"""
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SIZES = {"": (1200, 80), "thumbs": (480, 75)}  # folder -> (max side, quality)


def fit(im, max_side):
    w, h = im.size
    k = min(1, max_side / max(w, h))
    return im.resize((round(w * k), round(h * k)), Image.LANCZOS) if k < 1 else im


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)

    src = sys.argv[1]
    level_id = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(os.path.basename(src))[0]
    im = Image.open(src).convert("RGB")

    for folder, (max_side, quality) in SIZES.items():
        out_dir = os.path.join(ROOT, "assets", "levels", folder)
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, f"{level_id}.webp")
        fit(im, max_side).save(out, "WEBP", quality=quality, method=6)
        print(f"{os.path.relpath(out, ROOT)}  {os.path.getsize(out) // 1024} KB")

    print(f'\nAdd to `levels` in game.js, in the right order:\n  {{ id: "{level_id}", grid: 3, category: "easy" }},')


if __name__ == "__main__":
    main()
