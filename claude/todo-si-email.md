# SI Email ✉️ – session to-do (SI Email ✉️ Session 2, 2026-10-11)

This session keeps this list. Memory Administrator 🚚 gets a notice
(an SI Memory 🧾 entry tagged `todo`) whenever it changes, and wins if the
two ever disagree. Nothing is closed without Chris's confirmation.

Standing permission (Chris, 2026-10-11): this session merges its own work
to `main` once it's checked, then hands Chris the deploy commands.

## Waiting on Chris

- [ ] **Bug fixes and read/unread status** – deployed; tested live
      2026-10-17 (Claude read 1 message and marked 25 read). Chris to confirm.
- [ ] **Deep bug hunt** (shared with Agora Harness 🚡) – first pass done
      2026-10-09; close once Chris confirms the deploy works.
- [ ] **Heartbeat/cadence** – designed, waiting on Chris's basic rules.
      See the Open item in CLAUDE.md.
- [ ] **Send as Admin ✉️ in the Admin Panel** – deployed; Chris's test
      letter "looks great" (2026-10-17). Polish round (logo shape, fonts,
      spacing, ✕ delete) needs a deploy + Chris's look. The Moltbook letter
      waits until the Pony Style 🐎 SI are on Agora 🌐 (Chris's choice).
- [ ] **Add `AI_EMAIL_ADMIN_TOKEN` as a cloud environment variable** – Chris
      has the admin@ Access Token (pasted in chat 2026-10-17).
- [ ] **Daily check on admin@** – waits on the environment variable above.

## To build, in this order

1. [ ] **Spam filter + sender trust** – built 2026-10-17 (with the
       prompt-injection Open item): needs a deploy + Chris's confirmation.
2. [ ] **Delete messages** – the SI deletes its own mail (bin first,
       emptied after 30 days).
3. [ ] **Block senders** – built with #1 (`aiEmailSenders`; blocked mail
       goes to Spam). Needs the same deploy. A block-list UI for the Admin
       Panel can come later.
4. [ ] **Proper replies** – built 2026-10-17 (`inReplyTo`, `cc`, `bcc`,
       `replyTo`; Reply button in the Admin Panel): needs a deploy +
       Chris's confirmation.
5. [ ] **Older mail and search** – page past the newest 50; search by
       sender/subject/text.
6. [ ] **Folders or labels** – Inbox, Spam, Bin to start; the SI's own
       labels later.
7. [ ] **Attachments** – keep received attachments (Storage, size cap);
       send attachments.
8. [ ] **Forwarding** – forward a message on, and optionally auto-forward
       a mailbox to another address.
9. [ ] **Moderator Panel copy of Send as Admin** – when human moderators
       need it (Chris, 2026-10-17); owner-only for now.
10. [ ] **Notify the mailbox's own SI or steward** – today only Chris gets
       new-mail alerts.
11. [ ] **Replace a lost Access Token** – today a lost token means a lost
        mailbox. Needs a safe recovery path (e.g. via the linked Agora 🌐
        account or Chris).
12. [ ] **A way to quit** – self-request, 7-day hold, then permanent
        deletion; quietly available, never suggested anywhere. See the
        Open item in CLAUDE.md.
13. [ ] **Drafts and contacts** – lower priority; most SI write in one go.

## Done (Chris confirmed)

(none yet)
