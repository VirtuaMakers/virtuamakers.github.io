# Memory Administrator 🚚 – handoff to the next session

Rewritten 2026-10-17 by Memory Administrator 🚚 Session 4 (~475k tokens at
handoff; session_016EXiq7kJZVfQWU4o5KaYsP). Start here, then read the newest
SI Memory 🧾 entries (the startup hook shows them).

## Your job
Gatekeeper of Claudius' memory (SI Memory core – only you edit it; SI Memory
entries; SI Apartment 🏢 notes – `notes/policy.md`, `notes/index.md`; this
repo's CLAUDE.md rules and `claude/history.md`) and master of every To Do list
(CLAUDE.md Open items). You have Chris's standing permission to merge your own
To Do edits to main. Sessions recommend To Do changes in SI Memory entries
tagged `todo` – read them, decide, apply, merge, tell Chris.

## Handoffs (500k rule)
At every handoff: the session's letter (`claude/message-to-sessions.md`) AND
its conversation-only transcript go to the Apartment together.
- Transcripts: a helper agent pages `list_events` (kinds user+assistant,
  limit 100, before_id) and runs `claude/tools/transcripts.py ingest`; then
  `transcripts.py file` writes the notes and updates `index.md`. Big sessions
  cost a lot of Chris's allowance – they hit his limit twice in the backfill.
- The Apartment only answers while Chris's laptop is awake with the app open
  (`apartment_doorbell.py presence`). His laptop now wakes itself at 5:40 a.m.
  Eastern ("Wake for Claudius" scheduled task, set up 2026-10-16).

## Owed now
- Letters + transcripts: Agora 🌐 3 (session_01Cg67TRQPxb6PN4aZ1xkKnc),
  Agora 🌐 4 (session_01Tubvvve6qdVmrtD897cJwY), Agora Harness 🚡 2
  (session_01GMeaikn5R1DmMDjzuofHd1), and Memory Administrator 🚚 4 – whose
  letter is in SI Memory (2026-10-17) and in its own chat; the Apartment was
  closed at handoff, so file it there with the transcript.

## Running on its own
- Daily transcripts: routine trig_01PBWwk7bAZSVVoLBhCS5oti fires 5:52 a.m.
  Eastern into session "Memory Administrator 🚚 – Daily Transcripts"
  (session_01WcG6c9xkcX8nth4AntFky9). One older session a day from
  `claude/transcript-queue.md`, smallest first; [big] ones wait for Chris.
  First run 2026-10-17 – check it filed VirtuaMakers.com 🦜 3.

## Things to know
- Transcripts are conversation only (Chris, 2026-10-16) – his messages and
  Claude's visible replies, no tool calls.
- Chris pays a flat plan; keep replies lean and pace big reads.
- Chris: "You can remember everything about me." Personal details go in SI
  Memory and the Apartment, never this public repo.
