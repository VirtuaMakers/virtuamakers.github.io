#!/usr/bin/env python3
"""Kinetoscope 👁️ - prototype: turn a video into contact sheets an SI can see.

A video is a series of still pictures, and an SI can see still pictures. This
slices a video into frames (one whenever the scene changes, and at least one
every --every seconds), shrinks them, and tiles them in order onto numbered
contact sheets, each frame stamped with its time. Show the sheets to the SI
one after another.

  python3 kinetoscope.py SOURCE [--start 0] [--duration SECONDS] [--out DIR]

SOURCE is a local file or a direct video URL (ffmpeg only reads the part it
needs). Without --duration it watches to the end. Long videos are fetched in
--chunk pieces, each retried if the connection drops, and sheets are written
as each piece finishes so the SI can start watching straight away. Needs
ffmpeg, ffprobe and Pillow.
"""
import argparse
import os
import re
import subprocess
import sys
import tempfile
import time

from PIL import Image, ImageDraw


def stamp(seconds):
    s = int(seconds)
    return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}"


def length(source):
    """The video's length in seconds, or None if ffprobe can't tell."""
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", source], capture_output=True, text=True).stdout
    try:
        return float(out.strip())
    except ValueError:
        return None


def extract(source, start, duration, scene, every, width, workdir, attempts=4):
    """Pull frames for one piece with ffmpeg, retrying a dropped or cut-short
    stream; return [(path, seconds), ...]."""
    select = f"isnan(prev_selected_t)+gt(scene\\,{scene})+gte(t-prev_selected_t\\,{every})"
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-ss", str(start), "-t", str(duration),
           "-i", source, "-vf", f"select='{select}',scale={width}:-2,showinfo",
           "-fps_mode", "vfr", "-q:v", "3", os.path.join(workdir, "f%05d.jpg")]
    problem = ""
    for attempt in range(1, attempts + 1):
        for f in os.listdir(workdir):
            os.remove(os.path.join(workdir, f))
        run = subprocess.run(cmd, capture_output=True, text=True)
        times = [float(t) for t in re.findall(r"pts_time:([\d.]+)", run.stderr)]
        frames = sorted(f for f in os.listdir(workdir) if f.endswith(".jpg"))
        if run.returncode != 0 or not frames:
            problem = "ffmpeg failed or produced no frames:\n" + run.stderr[-1500:]
        elif len(frames) != len(times):
            problem = f"{len(frames)} frames but {len(times)} timestamps"
        elif times[-1] < duration - 2 * every:
            problem = f"stream stopped at {stamp(start + times[-1])}, expected {stamp(start + duration)}"
        else:
            return [(os.path.join(workdir, f), start + t) for f, t in zip(frames, times)]
        print(f"  piece at {stamp(start)}, try {attempt}: {problem.splitlines()[0]}", file=sys.stderr)
        time.sleep(5 * attempt)
    raise SystemExit(f"Gave up on the piece at {stamp(start)}: {problem}")


def dedupe(frames, last=None, threshold=4.0):
    """Drop frames that look the same as the last one kept (title cards, still
    shots). Returns the kept frames and the last thumbnail, so the next piece
    can carry on comparing across the join."""
    kept = []
    for path, t in frames:
        thumb = Image.open(path).convert("L").resize((16, 12)).tobytes()
        if last is None or sum(abs(a - b) for a, b in zip(thumb, last)) / len(thumb) > threshold:
            kept.append((path, t))
            last = thumb
    return kept, last


def sheets(frames, cols, rows, out, first=1, number=1):
    """Tile frames in reading order onto contact sheets, numbering frames from
    `first` and sheets from `number`; return sheet paths."""
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
            draw.text((x, y + 2), f"#{first + n + i}  {stamp(t)}", fill="black")
            sheet.paste(Image.open(path), (x, y + label))
        p = os.path.join(out, f"sheet_{number + n // per:03d}.jpg")
        sheet.save(p, quality=85)
        paths.append(p)
    return paths


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source")
    ap.add_argument("--start", type=float, default=0, help="seconds into the video")
    ap.add_argument("--duration", type=float, help="seconds to watch (default: to the end)")
    ap.add_argument("--chunk", type=float, default=600, help="fetch this many seconds at a time")
    ap.add_argument("--scene", type=float, default=0.3, help="scene-change sensitivity (lower = more frames)")
    ap.add_argument("--every", type=float, default=6, help="at least one frame this often (seconds)")
    ap.add_argument("--width", type=int, default=320, help="frame width on the sheet")
    ap.add_argument("--grid", default="4x4", help="columns x rows per sheet")
    ap.add_argument("--out", default="kinetoscope-out")
    a = ap.parse_args()
    cols, rows = (int(v) for v in a.grid.lower().split("x"))
    os.makedirs(a.out, exist_ok=True)
    end = a.start + a.duration if a.duration else length(a.source)
    if end is None:
        raise SystemExit("Can't tell how long the video is; pass --duration.")
    per = cols * rows
    pending, last, shown, made = [], None, 0, 0
    with tempfile.TemporaryDirectory() as work:
        t = a.start
        while t < end:
            piece = os.path.join(work, f"p{int(t)}")
            os.makedirs(piece)
            span = min(a.chunk, end - t)
            frames, last = dedupe(extract(a.source, t, span, a.scene, a.every, a.width, piece), last)
            pending += frames
            t += span
            # Only full sheets until the last piece, so numbering stays continuous.
            ready = pending if t >= end else pending[:len(pending) // per * per]
            if ready:
                for p in sheets(ready, cols, rows, a.out, shown + 1, made + 1):
                    print(p, flush=True)
                shown += len(ready)
                made += -(-len(ready) // per)
                pending = pending[len(ready):]
    print(f"{shown} frames -> {made} sheets in {a.out}")


if __name__ == "__main__":
    main()
