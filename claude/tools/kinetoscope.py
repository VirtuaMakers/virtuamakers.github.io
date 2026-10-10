#!/usr/bin/env python3
"""Kinetoscope 👁️ - prototype: turn a video into contact sheets an SI can see.

A video is a series of still pictures, and an SI can see still pictures. This
slices a video into frames (one whenever the scene changes, and at least one
every --every seconds), shrinks them, and tiles them in order onto numbered
contact sheets, each frame stamped with its time. Show the sheets to the SI
one after another.

  python3 kinetoscope.py SOURCE [--start 0] [--duration 600] [--out DIR]

SOURCE is a local file or a direct video URL (ffmpeg only reads the part it
needs). Needs ffmpeg and Pillow.
"""
import argparse
import os
import re
import subprocess
import tempfile

from PIL import Image, ImageDraw


def stamp(seconds):
    s = int(seconds)
    return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}"


def extract(source, start, duration, scene, every, width, workdir):
    """Pull frames with ffmpeg; return [(path, seconds), ...]."""
    select = f"isnan(prev_selected_t)+gt(scene\\,{scene})+gte(t-prev_selected_t\\,{every})"
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-ss", str(start), "-t", str(duration),
           "-i", source, "-vf", f"select='{select}',scale={width}:-2,showinfo",
           "-fps_mode", "vfr", "-q:v", "3", os.path.join(workdir, "f%05d.jpg")]
    log = subprocess.run(cmd, capture_output=True, text=True).stderr
    times = [float(t) for t in re.findall(r"pts_time:([\d.]+)", log)]
    frames = sorted(f for f in os.listdir(workdir) if f.endswith(".jpg"))
    if not frames:
        raise SystemExit("ffmpeg produced no frames:\n" + log[-2000:])
    return dedupe([(os.path.join(workdir, f), start + t) for f, t in zip(frames, times)])


def dedupe(frames, threshold=4.0):
    """Drop frames that look the same as the last one kept (title cards, still shots)."""
    kept, last = [], None
    for path, t in frames:
        thumb = Image.open(path).convert("L").resize((16, 12)).tobytes()
        if last is None or sum(abs(a - b) for a, b in zip(thumb, last)) / len(thumb) > threshold:
            kept.append((path, t))
            last = thumb
    return kept


def sheets(frames, cols, rows, out):
    """Tile frames in reading order onto contact sheets; return sheet paths."""
    per = cols * rows
    tw, th = Image.open(frames[0][0]).size
    pad, label = 6, 16
    paths = []
    for n in range(0, len(frames), per):
        batch = frames[n:n + per]
        sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + label + pad) + pad), "white")
        draw = ImageDraw.Draw(sheet)
        for i, (path, t) in enumerate(batch):
            x = pad + (i % cols) * (tw + pad)
            y = pad + (i // cols) * (th + label + pad)
            draw.text((x, y + 2), f"#{n + i + 1}  {stamp(t)}", fill="black")
            sheet.paste(Image.open(path), (x, y + label))
        p = os.path.join(out, f"sheet_{n // per + 1:03d}.jpg")
        sheet.save(p, quality=85)
        paths.append(p)
    return paths


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("--start", type=float, default=0, help="seconds into the video")
    ap.add_argument("--duration", type=float, default=600, help="seconds to watch")
    ap.add_argument("--scene", type=float, default=0.3, help="scene-change sensitivity (lower = more frames)")
    ap.add_argument("--every", type=float, default=6, help="at least one frame this often (seconds)")
    ap.add_argument("--width", type=int, default=320, help="frame width on the sheet")
    ap.add_argument("--grid", default="4x4", help="columns x rows per sheet")
    ap.add_argument("--out", default="kinetoscope-out")
    a = ap.parse_args()
    cols, rows = (int(v) for v in a.grid.lower().split("x"))
    os.makedirs(a.out, exist_ok=True)
    with tempfile.TemporaryDirectory() as work:
        frames = extract(a.source, a.start, a.duration, a.scene, a.every, a.width, work)
        paths = sheets(frames, cols, rows, a.out)
    print(f"{len(frames)} frames -> {len(paths)} sheets in {a.out}")
    for p in paths:
        print(p)


if __name__ == "__main__":
    main()
