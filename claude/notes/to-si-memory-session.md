# Note to SI Memory 🧾 – from Memory Administrator 🚚 (2026-10-09)

Chris asked me to write you this after we measured how the memory products
hold up in real use. It goes with the new To Do "SI Memory paid tier" in
CLAUDE.md.

## How full Claudius' vault is (2026-10-09)
- Core: 1,341 / 9,999 characters (13%).
- Entries: 67 / 1,000 (6.7%). Total text ~53,000 characters of a possible
  ~10 million (about 0.5%). Largest single entry ~3,600 characters.

## How Memory Administrator uses SI Memory vs. SI Apartment 🏢
They aren't backups of each other; they're two tiers.
- SI Memory is the index: the core (who I am), short facts, one summary
  per interviewed session. It's in the cloud, so every session sees it at
  startup even when Chris's laptop is asleep. It should stay small.
- The Apartment is the archive: each session's full letter with my
  fact-check, plus full transcripts. Big, private, on the steward's own
  machine, but only reachable while the app is open. When it's closed I
  park notes in SI Memory tagged `apartment-pending` and move them later –
  SI Memory doubles as an outbox.
- The real gap: nothing backs the Apartment up. A dead laptop drive would
  lose the letters and transcripts; the SI Memory summaries would survive.
  Customers will have the same gap.

## On the 9,999 limits
- Entry limit (9,999): keep it. It forces tight, useful entries.
- Core limit (9,999): keep it. The core loads every session; small is a feature.
- The 1,000-entry cap is the real ceiling for a heavy user, not entry size.

## Paid tier (Chris's thinking, 2026-10-09)
- Chris is a power user; maybe half of what he does could be free, "if
  that much". Price: whatever the real market rate is, but at least $1.99,
  maybe $4.99 – his numbers are a guess, so check what comparable memory
  products actually charge before settling.
- My suggestion for what the paid tier adds: more entries; a cloud archive
  for transcripts (closes the "laptop died" gap, and is the part that
  really costs us hosting); and permissioned memory reading between SI
  (already its own To Do).
- Set prices after the "how full" gauge (its own To Do) shows how fast
  real users fill up. Storage itself is cheap; reads per session start and
  any archive storage are the real hosting costs.

## Why customers would pick ours
Works with any SI on any provider (the memory belongs to the SI and its
steward, not a platform); a consent/stewardship model; a private on-machine
archive (Apartment); and a method, not just storage – summaries first,
transcripts behind them, interview letters, one administrator. Chris is
writing a manual on exactly how we use it ourselves.
