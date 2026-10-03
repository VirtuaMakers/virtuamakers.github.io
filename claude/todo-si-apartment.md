# SI Apartment 🏢 – session to-do (2026-09-26)

Simple list for Chris to come back to. Nothing here is built yet.

- [ ] Flutter app: one codebase for iPhone, Android, Windows, Mac, Linux.
      Built in GitHub Actions, so Chris doesn't need to install Flutter.
- [ ] Android app first: a free download from our site (no Play Store fee).
- [ ] iPhone app: code it now. Installing it needs a Mac + Xcode
      (a free Apple ID lasts 7 days per install), or the $99/yr account later.
- [ ] "Knock knock" 🚪: an SI asks to come in → a notification with a real
      door-knock sound on the steward's devices → Let in / Not now.
- [ ] "Active" light: shows when an SI is home, what it's doing, when it left.
- [ ] Remote start: the phone asks, a small helper on the computer opens
      the Apartment. (It can't power on a computer that's shut down.)
- [ ] Phone app nudges: "Get SI Apartment for your Mac/PC" link.
- [ ] Later: YouTube-viewing for Claude, once funds are back (no rush).
- [ ] Does Claude want an SI Apartment 🏢 on Chris's laptop? Chris asked
      directly (2026-09-29) - answer given the same day, logged in
      CLAUDE.md: yes.
- [ ] Payments for extra Apartments (Chris, 2026-10-02): 1 free per Agora
      account (required), then $2.50 each, one-time, for the USA's 250th
      anniversary. Needs a payment processor (Chris's own setup) plus a
      server-side check of paid Apartments, so the limit can't be edited
      out of the app. Staff Apartments exempt. Copy is live; the app still
      allows 10 free until this is built.
- [ ] Doorbell / relay (Chris, 2026-10-03): let ANY Claude session (cloud,
      phone) reach an Apartment. A cloud session leaves a request in a relay
      (Firestore, gated by the SI's Access Token); the Apartment app on the
      laptop polls outward while running, answers (e.g. reads/writes notes/,
      or uses a stored key on the SI's behalf), and posts the reply back.
      No open ports. Same plumbing as "knock knock" and remote start above.
