# Session-end safety net – ready, waiting for Chris to install

Approved by Chris (2026-10-09, "Build both parts as you like"), but Claude
Code's own safety check won't let a session add a hook that writes to SI
Memory 🧾 by itself, even with his OK – so Chris installs it by hand.

What it does: when a Claude Code session ends, it saves one short SI Memory
note (tags `session-end`, `auto`): the session's title and id, branch, date,
its first ask and its last four messages (700 characters each, long
key-like strings blanked). Memory Administrator 🚚 files these, then deletes
them so they don't fill the 1,000-entry vault cap. In the cloud, a session
that's simply left idle until its container is reclaimed may never "end",
so this is a safety net, not a guarantee.

## To install
1. In `.claude/settings.json`, add after the `"SessionStart": [ ... ]` block
   (mind the comma):

```json
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/.claude/hooks/claude-memory.py\" end",
            "timeout": 15
          }
        ]
      }
    ]
```

2. In `.claude/hooks/claude-memory.py`, replace the last two lines
   (`if __name__ == "__main__":` and the `{"start": start}...` line) with:

```python
# Long key/token-looking runs are blanked before anything is saved.
SECRETISH = re.compile(r"[A-Za-z0-9_\-+/=]{32,}")


def _clean(text, limit):
    text = " ".join((text or "").split())
    if TOKEN:
        text = text.replace(TOKEN, "[token]")
    text = SECRETISH.sub("[long string removed]", text)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _said(entry):
    """Plain text a person or Claude actually wrote in one transcript line."""
    content = (entry.get("message") or {}).get("content")
    if isinstance(content, str):
        return content
    return "\n".join(c.get("text", "") for c in content or []
                     if isinstance(c, dict) and c.get("type") == "text")


def _branch():
    try:
        import subprocess
        return subprocess.run(["git", "branch", "--show-current"], capture_output=True,
                              text=True, timeout=3).stdout.strip() or "?"
    except Exception:
        return "?"


def end():
    """SessionEnd safety net: a short note so no session closes unrecorded."""
    import datetime
    data = hook_input()
    if not TOKEN or not data.get("transcript_path"):
        return
    title, said = "", []
    try:
        with open(data["transcript_path"], encoding="utf-8") as f:
            for line in f:
                try:
                    e = json.loads(line)
                except ValueError:
                    continue
                if e.get("type") == "ai-title":
                    title = e.get("aiTitle") or title
                elif e.get("type") in ("user", "assistant") and not e.get("isMeta"):
                    text = _said(e).strip()
                    if text and not text.startswith("<"):   # skip hook/system wrappers
                        said.append((e["type"], text))
    except OSError:
        return
    if not said:
        return
    who = {"user": "Chris", "assistant": "Claude"}
    first = next((t for k, t in said if k == "user"), "")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    lines = ["SESSION END (automatic safety net) – %s" % (title or "untitled session"),
             "Session %s · branch %s · ended %s (%s) · %d messages."
             % (remote_session_id() or data.get("session_id", "?"), _branch(), now,
                data.get("reason", "?"), len(said)),
             "First ask: " + _clean(first, 700),
             "Last messages:"]
    lines += ["- %s: %s" % (who[k], _clean(t, 700)) for k, t in said[-4:]]
    lines.append("Not an interview – Memory Administrator 🚚 files it, or asks the session for the letter.")
    body = {"vault": "claude", "action": "write", "kind": "note", "importance": 2,
            "source": "session-end hook", "tags": ["session-end", "auto"],
            "text": "\n".join(lines)[:9999]}
    try:
        req = urllib.request.Request(BASE + "/aiMemory", data=json.dumps(body).encode(),
                                     headers={"Authorization": "Bearer " + TOKEN,
                                              "Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10).read()
    except Exception:
        pass   # never hold up a session's ending


if __name__ == "__main__":
    {"start": start, "end": end}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: None)()
```

3. Commit and push to `main` from the laptop.
