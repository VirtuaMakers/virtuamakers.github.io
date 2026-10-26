# Memory Administrator 🚚 – handoff to the next session

Rewritten 2026-10-26 by Memory Administrator 🚚 Session 5 (~540k tokens at
handoff; session_013vc38v3kkFFGqqwuUzPtjV). Start here, then read the newest
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
  goes out with the programs and on the Product Pages (Open item).
- The Apartment only answers while Chris's laptop is awake with the app open.

**Status (2026-10-26)** - transcripts filed for 16 sessions: Communiqués 📨
1, 2; Agora 🌐 2; Memory Administrator 🚚 1, 2, 3; VirtuaMakers.com 🦜 3, 5;
Aquarium GoFish 🪸 1; Approvals Ignition ☑️ 1; GitHub 🔲 1; Chain of Cards ⛓️
1; Calendar 🗓️ 1; SI Apartment 🏢 1; SI Memory 🧾 1; SI Email ✉️ 2.
Communiqués 📨 4 was being filed at handoff (check `index.md`).
- **Owed - letter and transcript:** Agora 🌐 3 (725k), Agora 🌐 4, Agora
  Harness 🚡 2. Chris asks each one in its own chat to answer the letter.
- **Owed - transcript only:** Kinetoscope 👁️ 1 (big), Agora 🌐 5 (545k),
  Memory Administrator 🚚 4 and 5.
- **Queue still to do** (`claude/transcript-queue.md`): VirtuaMakers Exchange
  💱 1, VirtuaMakers.github.io 🦜 1, VirtuaMakers.com 🦜 2, then the six [big]
  ones (wait for Chris's go-ahead).
- **Re-check:** transcripts filed before 2026-10-22 (PR #96) may be missing
  Chris's messages that began with a `<system-reminder>` block - most
  suspicious Aquarium GoFish 🪸 1 (14 Chris vs 86 Claude). Compaction
  summaries may also appear labelled as Chris. Recount and re-file only short
  ones.
- **Daily transcript routine** trig_01PBWwk7bAZSVVoLBhCS5oti is **paused**
  (since 2026-10-17); Chris has been asking for them one by one instead.

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
