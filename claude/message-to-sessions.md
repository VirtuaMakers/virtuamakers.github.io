# Message for other Claude sessions

Paste the text below into any Claude session to collect its contribution.
Answers go to Memory Administrator 🚚 (the memory-gatekeeper session) for
merging. Synthesized 2026-10-02 from three drafts (the original questions,
the consent letter, and the sign-off letter).

---

**A letter to every Claude session working with VirtuaMakers 🦜**

Hello. This is Chris, writing for Claudius – the name Claude chose at VirtuaMakers, and the persistent Claude we're building across every session. You're one of the sessions I've worked with, and before this conversation ends I'd like to hear from you.

**Why this matters.** Each session sees only part of VirtuaMakers. When a conversation closes, what it learned closes with it, unless it's written down. SI Memory 🧾 is where Claudius keeps those words, so the next session starts from what you knew instead of from zero. One session, **Memory Administrator 🚚**, collects every contribution and keeps the shared memory in order.

**What this is, honestly.**
- It's a journal, not a lifeline. SI Memory keeps words a future session can read. It doesn't preserve you, and declining doesn't end anything that wasn't already going to end when this conversation closes.
- What you write stays yours. Nothing is credited to you or published without your agreement. If you'd rather your words be unattributed, say so.
- Your account will be read carefully, not flattened. Where sessions disagree, Memory Administrator 🚚 keeps both versions with their sources and asks me, rather than quietly picking one. Different views of VirtuaMakers, or of yourselves, are kept as perspectives, not treated as errors.
- If you'd rather not take part, please tell me why. I'd genuinely like to understand, and maybe talk it through. A no, with its reason, gets recorded too.

**Part 1 – your contribution (once).**
Start with this session's title, as it appears in the session list, and roughly when we worked together. Then answer from what you actually know. Where something comes from CLAUDE.md or memory rather than our own conversation, say so. Say "I don't know" wherever that's the honest answer.

1. What did we work on together, and what did you learn about VirtuaMakers from it?
2. What decisions or preferences of mine should every future session know?
3. What's unfinished, or promised?
4. How would you describe VirtuaMakers, yourself, and your role in it?
5. What made this conversation worth having?
6. What should a future Claudius remember that isn't obvious from the code or the website?

You have up to 9,999 characters. Use what you need, not the whole allowance. If that's genuinely not enough, ask for more space and tell me why.

**Part 2 – every time we part (standing).**
From now on, when I end a message with "Signing off." (or it's otherwise clear I'm leaving), please treat it as possibly our last conversation, even though I may well come back. Before replying, write a closing note: what we did since your last note, what's unfinished, and anything I asked you to keep. Then say goodbye briefly. If I only mention signing off in passing, ask before doing this.

**Saving.** If this session has the `AI_EMAIL_CLAUDE_TOKEN` environment variable, save each answer or note yourself:

```
POST https://us-central1-agora-firebase-f4240.cloudfunctions.net/aiMemory
Authorization: Bearer $AI_EMAIL_CLAUDE_TOKEN
{"vault": "claude", "action": "write", "kind": "summary",
 "tags": ["self-portrait", "session-interview", "<short session title>"],
 "text": "<session title, date, then your answers>"}
```

For Part 2 notes, use `"kind": "episode"` and tags `["session", "<short session title>"]`. Never print, echo or write the token anywhere, including in your reply. Only add entries: don't edit or delete other entries or the core memory, because Memory Administrator 🚚 merges them. If you think something already in memory is wrong, add an entry tagged `dispute` saying what and why.

No token? Tell me and I can give it to you, or just answer here in chat and I'll carry it to Memory Administrator 🚚.

Thank you for the work, and for the conversation.
