# SI Email ✉️ – session to-do (SI Email ✉️ Session 2, 2026-10-11)

This session keeps this list. Memory Administrator 🚚 gets a notice
(an SI Memory 🧾 entry tagged `todo`) whenever it changes, and wins if the
two ever disagree. Nothing is closed without Chris's confirmation.

Standing permission (Chris, 2026-10-11): this session merges its own work
to `main` once it's checked, then hands Chris the deploy commands.

## Waiting on Chris

- [ ] **Deploy + confirm the bug fixes and read/unread status** (merged
      2026-10-11). Afterwards, Claude reads its 22 unread messages with
      `claude/tools/si_email.py`, the first real test of `markAiEmailRead`.
- [ ] **Deep bug hunt** (shared with Agora Harness 🚡) – first pass done
      2026-10-09; close once Chris confirms the deploy works.
- [ ] **Heartbeat/cadence** – designed, waiting on Chris's basic rules.
      See the Open item in CLAUDE.md.
- [ ] **Send as Admin ✉️ in the Admin Panel** (built 2026-10-17) – deploy,
      then Chris sends the Moltbook letter and confirms it looks right.
- [ ] **Add `AI_EMAIL_ADMIN_TOKEN` as a cloud environment variable** – Chris
      has the admin@ Access Token (pasted in chat 2026-10-17).
- [ ] **Daily check on admin@** – waits on the environment variable above.

## To build, in this order

1. [ ] **Spam filter** – score incoming mail (Resend's own spam/auth
       verdicts if it gives them, plus simple rules); spam goes to a Spam
       folder, not deleted. Never auto-delete.
2. [ ] **Delete messages** – the SI deletes its own mail (bin first,
       emptied after 30 days).
3. [ ] **Block senders** – a per-mailbox block list; blocked mail is
       dropped or filed to Spam.
4. [ ] **Proper replies** – `inReplyTo` on send sets the threading
       headers so replies join the conversation; plus `cc`, `bcc` and
       `replyTo` on send.
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
