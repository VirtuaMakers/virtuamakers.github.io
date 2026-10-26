// Hashtags #️⃣ (Chris, 2026-10-24/25; built by Communiqués 📨 Session 4,
// 2026-10-26) - a community dictionary in the Knowledge Base 📚.
//
// Revealed weekly (Chris, 2026-10-26): every Friday at 6:00 AM Eastern -
// something to wake up to, never a reason to stay up late. A Wall post,
// comment or Dialog message that's written, edited or deleted with a # in
// it only joins hashtagQueue/ at that moment (one small write); Friday's
// run (revealHashtagsWeekly in index.js) reads each queued item as it is
// *then* - so edits made in its 10-minute window, and anything deleted or
// removed by moderation since, are counted correctly - and brings the
// counts up to date. To reveal more often later, only the schedule in
// index.js changes.
//
// Tags aren't case-sensitive (Chris, 2026-10-26): #Hashtags, #hashtags and
// #HASHTAGS are one tag, keyed by its lower-case form; pages show the
// spelling people use most.
//
// Firestore:
//   hashtags/{key}                  public: display, spellings, count,
//                                   memberCount, firstAt, lastAt
//   hashtags/{key}/appearances/{id} signed-in members only (rules): kind,
//                                   link and excerpt for posts/comments;
//                                   a Dialog appearance says only "from a
//                                   Dialog" and when - never who or what
//   hashtagAuthors/{key}            server only: uid -> appearances, for
//                                   memberCount (who used a tag in a
//                                   Dialog stays private)
//   hashtagSources/{sourceId}       server only: the tags each piece of
//                                   content held last time, to diff edits
//   hashtagMeta/backfill            server only: when the one-time sweep
//                                   of older content ran
//   hashtagQueue/{sourceId}         server only: content waiting for
//                                   Friday's reveal (path, kind, postId)
//   hashtagIndex/approved           public: the tags that have passed the
//                                   rule of 5 (5 appearances, 3 members)
//                                   as of the last reveal - the only ones
//                                   with a Knowledge Base 📚 page. Every
//                                   other #tag still lights up, linking to
//                                   how hashtags work (Chris, 2026-10-26).
const admin = require("firebase-admin");
// The modular import (not admin.firestore.FieldValue) - it also works in
// the emulator, and is the style firebase-admin 14 needs.
const { FieldValue } = require("firebase-admin/firestore");

const MAX_TAG_LENGTH = 50;
const MAX_TAGS_PER_SOURCE = 10;
const EXCERPT_LENGTH = 160;

// A # that starts a word: not inside a word, a URL fragment (page#part),
// an HTML entity (&#39;) or another tag (##). Letters, digits and _ after
// it, with at least one letter - so "#1" isn't a tag.
const TAG_RE = /(^|[^\p{L}\p{N}_&#/])#([\p{L}\p{N}_]+)/gu;

function plainText(body) {
  return String(body || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ");
}

// { key: spelling } for each distinct tag in the text, in order of first
// appearance, at most MAX_TAGS_PER_SOURCE.
function extractTags(body) {
  const tags = {};
  const text = plainText(body);
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(text)) !== null) {
    const spelling = m[2].normalize("NFC");
    if (spelling.length > MAX_TAG_LENGTH || !/\p{L}/u.test(spelling)) continue;
    const key = spelling.toLowerCase();
    if (/^__.*__$/.test(key)) continue; // reserved Firestore ids
    if (!(key in tags)) tags[key] = spelling;
    if (Object.keys(tags).length >= MAX_TAGS_PER_SOURCE) break;
  }
  return tags;
}

function excerptOf(body) {
  const text = plainText(body)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"").replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
  return text.length > EXCERPT_LENGTH ? text.slice(0, EXCERPT_LENGTH - 1).trimEnd() + "…" : text;
}

function mostUsed(spellings, fallback) {
  let best = fallback;
  let bestCount = -1;
  Object.keys(spellings || {}).forEach((s) => {
    if (spellings[s] > bestCount) { best = s; bestCount = spellings[s]; }
  });
  return best;
}

// source: { id, kind: "post"|"comment"|"dialog", data (null when deleted),
// postId (posts/comments) }. Brings every tag's count in line with what
// the content holds now.
async function syncHashtags(source) {
  const db = admin.firestore();
  const data = source.data;
  const nowTags = data ? extractTags(data.body) : {};
  const sourceRef = db.collection("hashtagSources").doc(source.id);

  await db.runTransaction(async (tx) => {
    const sourceSnap = await tx.get(sourceRef);
    const before = sourceSnap.exists ? (sourceSnap.get("tags") || {}) : {};
    const keys = Array.from(new Set(Object.keys(before).concat(Object.keys(nowTags))));
    const changed = keys.filter((k) => before[k] !== nowTags[k]);
    if (!changed.length && sourceSnap.exists === !!Object.keys(nowTags).length) {
      // Same tags as before - only refresh the excerpt of a kept tag.
      if (!data || source.kind === "dialog") return;
      keys.forEach((k) => tx.set(db.collection("hashtags").doc(k).collection("appearances").doc(source.id),
        { excerpt: excerptOf(data.body) }, { merge: true }));
      return;
    }

    const tagRefs = changed.map((k) => db.collection("hashtags").doc(k));
    const authorRefs = changed.map((k) => db.collection("hashtagAuthors").doc(k));
    const tagSnaps = await Promise.all(tagRefs.map((r) => tx.get(r)));
    const authorSnaps = await Promise.all(authorRefs.map((r) => tx.get(r)));
    const author = (data && data.authorUid) || (sourceSnap.exists && sourceSnap.get("authorUid")) || "";
    const now = FieldValue.serverTimestamp();

    changed.forEach((key, i) => {
      const had = key in before;
      const has = key in nowTags;
      const tag = tagSnaps[i].exists ? tagSnaps[i].data() : { count: 0, spellings: {} };
      const authors = authorSnaps[i].exists ? (authorSnaps[i].get("uids") || {}) : {};
      const spellings = Object.assign({}, tag.spellings || {});
      let count = tag.count || 0;
      const appearanceRef = tagRefs[i].collection("appearances").doc(source.id);

      if (had) {
        count -= 1;
        const old = before[key];
        if (spellings[old]) { spellings[old] -= 1; if (spellings[old] <= 0) delete spellings[old]; }
        if (author && authors[author]) { authors[author] -= 1; if (authors[author] <= 0) delete authors[author]; }
        if (!has) tx.delete(appearanceRef);
      }
      if (has) {
        count += 1;
        spellings[nowTags[key]] = (spellings[nowTags[key]] || 0) + 1;
        if (author) authors[author] = (authors[author] || 0) + 1;
        if (!had) {
          const appearance = { kind: source.kind, createdAt: (data && data.createdAt) || now };
          if (source.kind !== "dialog") {
            appearance.postId = source.postId;
            appearance.authorUid = data.authorUid || "";
            appearance.authorName = data.authorName || "";
            appearance.excerpt = excerptOf(data.body);
          }
          tx.set(appearanceRef, appearance);
        }
      }

      if (count <= 0) {
        tx.delete(tagRefs[i]);
        tx.delete(authorRefs[i]);
        return;
      }
      const update = {
        key,
        display: mostUsed(spellings, nowTags[key] || before[key] || key),
        spellings,
        count,
        memberCount: Object.keys(authors).length,
        lastAt: now,
      };
      // Whole doc rewritten (a merge would keep spellings no one uses any
      // more), carrying over anything else on it, e.g. firstAt.
      tx.set(tagRefs[i], Object.assign({}, tag, update, { firstAt: tag.firstAt || now }));
      tx.set(authorRefs[i], { uids: authors });
    });

    if (Object.keys(nowTags).length) {
      tx.set(sourceRef, { tags: nowTags, authorUid: author, kind: source.kind });
    } else if (sourceSnap.exists) {
      tx.delete(sourceRef);
    }
  });
}

// Read every existing Wall post, comment and Dialog message for tags
// (anything written before Hashtags #️⃣ existed). Safe to repeat.
async function backfillHashtags() {
  const db = admin.firestore();
  let scanned = 0;
  let tagged = 0;
  async function run(source) {
    scanned += 1;
    if (!source.data || String(source.data.body || "").indexOf("#") === -1) return;
    if (!Object.keys(extractTags(source.data.body)).length) return;
    tagged += 1;
    await syncHashtags(source);
  }
  const posts = await db.collection("wallPosts").get();
  for (const d of posts.docs) await run({ id: "post_" + d.id, kind: "post", postId: d.id, data: d.data() });
  const comments = await db.collectionGroup("comments").get();
  for (const d of comments.docs) {
    const post = d.ref.parent.parent;
    if (!post || post.parent.id !== "wallPosts") continue;
    await run({ id: "comment_" + post.id + "_" + d.id, kind: "comment", postId: post.id, data: d.data() });
  }
  const messages = await db.collectionGroup("messages").get();
  for (const d of messages.docs) {
    const conv = d.ref.parent.parent;
    if (!conv || conv.parent.id !== "conversations") continue;
    await run({ id: "dialog_" + conv.id + "_" + d.id, kind: "dialog", data: d.data() });
  }
  return { scanned, tagged };
}

// Runs backfillHashtags() exactly once, ever: whichever trigger gets
// here first creates hashtagMeta/backfill (create() fails if it already
// exists, so a second trigger at the same moment just skips). To run it
// again, delete that doc in the Firebase console - it's safe to repeat.
async function backfillHashtagsOnce() {
  const ref = admin.firestore().collection("hashtagMeta").doc("backfill");
  try {
    await ref.create({ startedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    return null; // already done (or under way)
  }
  const result = await backfillHashtags();
  await ref.set(Object.assign({ doneAt: FieldValue.serverTimestamp() }, result), { merge: true });
  return result;
}

// Called by the write triggers: remember this piece of content for the
// next reveal. Only content that has (or had) a # in it is queued.
async function queueHashtagSource(source, ref) {
  await admin.firestore().collection("hashtagQueue").doc(source.id).set({
    path: ref.path,
    kind: source.kind,
    postId: source.postId || null,
    queuedAt: FieldValue.serverTimestamp(),
  });
}

const RULE_OF_FIVE = { appearances: 5, members: 3 };

// Rewrites hashtagIndex/approved from the current counts: every tag with
// 5+ appearances from 3+ members, unless an admin has hidden it.
async function writeApprovedIndex() {
  const db = admin.firestore();
  const snap = await db.collection("hashtags").get();
  const keys = [];
  const display = {};
  snap.docs.forEach((d) => {
    const t = d.data();
    if (t.hidden === true) return;
    if ((t.count || 0) >= RULE_OF_FIVE.appearances && (t.memberCount || 0) >= RULE_OF_FIVE.members) {
      keys.push(d.id);
      display[d.id] = t.display || d.id;
    }
  });
  keys.sort();
  await db.collection("hashtagIndex").doc("approved").set({ keys, display, updatedAt: FieldValue.serverTimestamp() });
  return keys.length;
}

// Friday's reveal: bring every queued item's tags up to date, as the item
// stands now, then clear it from the queue. Returns how many it handled.
async function processHashtagQueue() {
  const db = admin.firestore();
  let processed = 0;
  for (;;) {
    const page = await db.collection("hashtagQueue").orderBy("queuedAt").limit(200).get();
    if (page.empty) break;
    for (const q of page.docs) {
      const item = q.data();
      const snap = await db.doc(item.path).get();
      try {
        await syncHashtags({ id: q.id, kind: item.kind, postId: item.postId || undefined, data: snap.exists ? snap.data() : null });
      } catch (err) {
        console.warn("processHashtagQueue: couldn't sync", q.id, err && err.message);
      }
      // Cleared only if nobody edited it again while we worked - a newer
      // edit stays queued for next time.
      await db.runTransaction(async (tx) => {
        const now = await tx.get(q.ref);
        const was = item.queuedAt && item.queuedAt.toMillis ? item.queuedAt.toMillis() : 0;
        const is = now.exists && now.get("queuedAt") && now.get("queuedAt").toMillis ? now.get("queuedAt").toMillis() : 0;
        if (now.exists && is === was) tx.delete(q.ref);
      });
      processed += 1;
    }
  }
  const approved = await writeApprovedIndex();
  return { processed, approved };
}

module.exports = { extractTags, excerptOf, syncHashtags, backfillHashtags, backfillHashtagsOnce, queueHashtagSource, processHashtagQueue, writeApprovedIndex, RULE_OF_FIVE };
