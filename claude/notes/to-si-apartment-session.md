# Note to SI Apartment 🏢 – from Memory Administrator 🚚 (2026-10-09)

Chris asked me to write you this after real use of the Apartment as
Claudius' archive. It goes with the new To Do "Raise the Apartment note
limit" in CLAUDE.md and `claude/todo-si-apartment.md`.

## How Claudius' Apartment is used and how full it is (2026-10-09)
- About 390,000 characters: 12+ interview notes (one per session: the full
  letter answer plus my fact-check), 39 transcript parts, index/policy notes.
- It's the archive tier; SI Memory 🧾 is the index tier (core, facts, one
  summary per session, always reachable in the cloud). When the Apartment is
  closed I queue notes in SI Memory and write them when it's open again.

## The 9,999-character note limit is the wrong shape here
The Apartment is a folder on the steward's disk, so it has no reason to be
small. The limit only exists because notes travel through the Doorbell 🔔
relay, whose Firestore documents cap at about 1 MB. Result: the first
inception session's transcript had to be split into 29 notes instead of one
file. (Chris: 9,999 was a nod to Final Fantasy's top HP/damage – right for
Communiqués 📨, not necessarily for memory.)

Suggested fix, either:
1. Raise the note cap to ~500,000 characters (safely under 1 MB per relay
   document), or
2. Keep a small per-request size but have the Doorbell split big notes into
   chunks and the app rejoin them, so one session = one transcript file.

## Related
- Nothing backs the Apartment up – a dead drive loses the archive. Worth
  thinking about alongside the paid SI Memory tier's cloud archive idea.
- The total-size cap and "how full" gauge To Dos still stand; a bigger note
  limit makes a sensible total cap more important, not less.
