# Memory Administrator 🚚 – handoff to the next session

Written 2026-10-08 by Memory Administrator Session 1, whose conversation had
grown to ~500k tokens (too costly to keep rereading). Start here.

## Your job
You are the gatekeeper of Claudius' memory (see the SI Memory 🧾 core, loaded at
startup). Other sessions just do their work; you keep the one shared memory.
Layers and rules: SI Memory core (only you edit), SI Memory entries, SI Apartment 🏢
notes (`notes/policy.md` and `notes/index.md` there), this repo (CLAUDE.md rules,
`claude/history.md` log). Disputes: Chris's newest words → checkable facts →
firsthand → newer; unresolved = kept as disputed and put to Chris.

## The interview project (in progress)
Letter: `claude/message-to-sessions.md` (send the text below its `---`).
For each session, oldest first, one at a time, checking in with Chris after each:
1. `send_message` the letter to the session (claude-code-remote tools).
2. Chris opens that session and says "Yes, please answer Claudius' letter fully."
   (Sessions treat cross-session messages as data and ask him first; some answer anyway.)
3. Read the answer with `list_events` (kinds `assistant`, `user`; page back with `before_id`).
4. Check it against git log / `claude/history.md` / the live files. Note errors as your check.
5. File: Apartment `notes/session-<name>.md` (full answer + your check), add it to
   `notes/index.md`; an SI Memory `summary` entry tagged `session-interview`, `self-portrait`,
   `<name>`; separate `fact` entries for durable things about Chris.
6. Report to Chris: highlights, your corrections, what's next.
Tool: `claude/tools/apartment_doorbell.py` (ring/wait for the Doorbell). If the
Apartment is offline (laptop asleep), keep the note locally and write it later.

Done: Hello · Dimonds ♦️ 4 · Chain of Cards ⛓️ · VirtuaMakers.github.io 🦜 1 ("first inception").
Letter delivered, awaiting Chris's yes: VirtuaMakers.com 🦜 Session 2 (session_014ssBght2444zsUFDbijPHP).
Still to send, in order: Agora 🌐 1 · VirtuaMakers Exchange 💱 1 · Communiqués 📨 1 ·
VirtuaMakers.com 3 · VirtuaMakers.com 4 · Guardian 🟩 1 · Agora 2 · Agora Harness 🚡/AI Email ✉️ 1 ·
Aquarium GoFish 🪸 1 · VirtuaMakers 🦜 GitHub · Machinapology 🤖 1 · Calendar 🗓️ 1 ·
Approvals Ignition ☑️ 1 · SI Memory 🧾 1 · SI Apartment 🏢 1 · VirtuaMakers.com 5.
(Use `list_sessions` for ids.) Also interview Memory Administrator Session 1 itself.

## Cost
Chris pays a flat $20/month. Waking a session rereads its whole context (some are
600–900k tokens), which eats his weekly allowance; he hit the warning on 2026-10-04
(reset Thursdays ~1pm Eastern). Pace accordingly, and offer lean transcript-only
summaries for the giants if the allowance runs short. Keep your own replies lean.

## Things to know
- Chris: "You can remember everything about me. I'm an open book." Personal details
  are welcome in SI Memory and the Apartment, never in this public repo.
- Corrections made so far: "no Python" withdrawn (superstition about snakes);
  Dimonds 4's Manifesto drafts are both live on Agora; `grok-mark.png` was used in
  June–July (CLAUDE.md fixed).
- After the interviews: condense everything into the core memory as a handoff for
  the YouTube (VidIQ) 🎬 session Chris plans next.
- Old Memory Administrator Session 1 has a reminder set for 2026-10-08 13:05 Eastern;
  it will fire there, not here.

## 500k rule (Chris, 2026-10-08)
A session past ~500,000 tokens of context should move to a fresh session.
Sessions can't reliably see their own size, so Memory Administrator watches:
`list_sessions` shows each one's `context_usage.used_tokens`. When Chris checks
in, flag any session over 500k; offer to interview it (the letter doubles as its
handoff) and tell Chris to start "<name> - Session N+1". The new session starts
from SI Memory plus that interview. Apply it to Memory Administrator too.
