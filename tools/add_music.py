#!/usr/bin/env python3
"""Prepare a music file for the game (for example a track made in Suno).

Usage:  python3 tools/add_music.py path/to/track.mp3 boss
        python3 tools/add_music.py path/to/track.mp3 main

- `boss` writes assets/audio/boss.mp3: it plays on the Boss screen and in boss levels.
  Until this file exists the normal music keeps playing there.
- `main` writes assets/audio/motif_hero.mp3: the music of everything else.
- The track is trimmed of trailing silence (so the loop has no gap), gets a short fade at
  the end, is leveled to the same loudness as the main music (so no track is louder than
  another) and is saved as a 128 kbps MP3.
Needs ffmpeg.
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
TARGETS = {"boss": "boss.mp3", "main": "motif_hero.mp3"}
TARGET_LOUDNESS = "-16"  # LUFS, same as the current main music


def ffmpeg(*args):
    result = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", *args], capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(result.stderr.strip()[-600:])
    return result.stderr


def main():
    if len(sys.argv) != 3 or sys.argv[2] not in TARGETS:
        sys.exit(__doc__)
    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is not installed.")

    src, kind = sys.argv[1], sys.argv[2]
    out = os.path.join(ROOT, "assets", "audio", TARGETS[kind])
    os.makedirs(os.path.dirname(out), exist_ok=True)

    # 1. trim silence at the end, 2. level the loudness, 3. fade out the last 0.6 s
    trimmed = out + ".tmp.wav"
    ffmpeg("-i", src, "-af", "areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse", trimmed)
    duration = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", trimmed],
        capture_output=True, text=True).stdout.strip())
    ffmpeg("-i", trimmed, "-af",
           f"loudnorm=I={TARGET_LOUDNESS}:TP=-1.5:LRA=11,afade=t=out:st={max(duration - 0.6, 0):.2f}:d=0.6",
           "-c:a", "libmp3lame", "-b:a", "128k", out)
    os.remove(trimmed)
    print(f"{os.path.relpath(out, ROOT)}  {os.path.getsize(out) // 1024} KB  ({duration:.0f} s)")


if __name__ == "__main__":
    main()
