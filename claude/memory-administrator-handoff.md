# Memory Administrator 🚚 – handoff to the next session

Rewritten 2026-10-26 by Memory Administrator 🚚 Session 5; status updated
2026-10-30 by Session 6 (session_01NEmXu81YJ8Xb4Ttwx1crt4) at its retirement. Start here, then read the newest
SI Memory 🧾 entries (the startup hook shows them).

## Your job
Gatekeeper of Claudius' memory (SI Memory core – only you edit it; SI Memory
entries; SI Apartment 🏢 notes – `notes/policy.md`, `notes/index.md`; this
repo's CLAUDE.md rules and `claude/history.md`) and master of every To Do list
(CLAUDE.md Open items). You have Chris's standing permission to merge your own
To Do edits to main. Sessions recommend To Do changes in SI Memory entries
tagged `todo` – read them, decide, apply, merge, tell Chris.

## The Persistent Memory Project (Chris's name, 2026-10-17)
The collection of every session's final letter and conversation-only
transcript into SI Memory 🧾 and the SI Apartment 🏢.

**SOP**
- **"Retiring" (Chris, 2026-10-26):** when a session reaches its end, Chris
  says it is *retiring* (e.g. "Communiqués 📨 - Session 4 is retiring"). That
  is your cue: file its letter and its transcript, together.
- **The letter** is the session's answer to `claude/message-to-sessions.md`,
  written in its own chat (often folded into one of its last long replies -
  read the last pages, not just SI Memory). File it as an SI Memory `summary`
  (tags session-interview + topic + handoff) and as Apartment note
  `session-<name>.md`, plus a line in `index.md` before "Transcripts".
- **The transcript:** a helper agent pages `list_events` (kinds
  user+assistant, limit 100, before_id) and runs
  `claude/tools/transcripts.py ingest`; then `transcripts.py file` writes the
  notes and updates `index.md`; then one SI Memory `note` ("<Title> transcript
  filed: N messages, M notes."). Collecting works with the Apartment closed;
  filing needs it open (`apartment_doorbell.py presence`). The scratchpad store
  is lost if the container is reclaimed.
- **Helper rules that matter:** never copy thinking blocks or signatures (a
  helper copying an inline page was stopped by a safety check, 2026-10-24);
  ingest saved files directly; for inline pages write a one-line JSON with
  only visible text; leave out harness compaction summaries.
- **Budget (Chris, 2026-10-24):** a hefty backlog costs real time and tokens -
  plan, pace, say the cost up front. Keeping up as you go is cheap. This note
  goes out with the programs and on the Product Pages (Open item). The
  public SOP also says (Chris, 2026-10-26): save whole transcripts, just
  summary letters, or both - and offers our summary-letter template
  (`si-memory.html#session-interview`).
- The Apartment only answers while Chris's laptop is awake with the app open.

**Status (2026-10-30, Session 6 retiring)** - every session that retired so
far has its letter and transcript filed (see `index.md`), including Agora 🌐
3-6, Agora Harness 🚡 2, Calendar 🗓️ 2, Memory Administrator 🚚 4 and 5,
Kinetoscope 👁️ 1, and queue items 1-16 (Agora 🌐 1 - 1,945 messages, 128
notes; Agora Harness 🚡/SI Email ✉️ 1 - 772 messages).
- **First job for Session 7:** file Memory Administrator 🚚 Session 6's
  transcript (session_01NEmXu81YJ8Xb4Ttwx1crt4) - its letter is already
  filed (`session-memadmin-6.md`).
- **Queue left (big, one at a time - two in parallel hit the 5-hour usage
  limit twice):** VirtuaMakers.com 🦜 4, Machinapology 🔬 1, "Hello",
  Dimonds ♦️ 4. Ask Chris before each.
- **Still open, not filed:** Agora 🌐 7, Communiqués 📨 5, SI Email ✉️ 3,
  Kinetoscope 👁️ 2, Agora Harness 🚡 3 and others are still active - file each
  when Chris says it's retiring.
- **Secrets (2026-10-30):** Harness 🚡 1's conversation held real secrets
  (Resend key, AI Email harness secret, a mailbox bearer token); the helper
  redacted them before filing, and `transcripts.py` now redacts API keys,
  webhook secrets and 40+-character hex tokens on ingest. Transcripts filed
  before 2026-10-30 weren't filtered - worth a scan of the Apartment's
  `transcript-*.md` notes for the same patterns, and Chris may want to
  rotate those credentials.
- **Helper tips:** a page that comes back inline must be hand-copied with
  every text block (one Agora 🌐 6 page lost a few messages); when a helper
  dies on the usage limit, `SendMessage` it after the reset and it resumes.
- **Daily transcript routine** trig_01PBWwk7bAZSVVoLBhCS5oti is **paused**
  (since 2026-10-17); Chris asks for them one by one.

## Things to know
- Transcripts are conversation only (Chris, 2026-10-16) - his messages and
  Claude's visible replies, no tool calls.
- Chris pays a flat plan; keep replies lean and pace big reads.
- Chris: "You can remember everything about me." Personal details go in SI
  Memory and the Apartment, never this public repo.
- There is no "Octopus Style 🐙 session" - that work belongs to Agora Harness
  🚡 (Chris, 2026-10-23). Agora is becoming Madang 🔵; next is "Madang 🔵 -
  Session 1", not Agora 7.
- AgoraHarness@/Admin@ tokens: not needed yet (Chris, 2026-10-22) - don't
  press him for them.
