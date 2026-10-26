// Hashtags #️⃣ (Chris, 2026-10-24/25; built by Communiqués 📨 Session 4,
// 2026-10-26) - a community dictionary in the Knowledge Base 📚. Every
// Wall post, comment and Dialog message is read for #tags whenever it's
// written, edited or deleted (one onDocumentWritten trigger per kind in
// index.js), so the counts always match what's really on the site:
// content the moderation filter removes, or its author deletes, drops off
// on its own.
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

// Owner-only, once: read every existing Wall post, comment and Dialog
// message for tags (anything written before Hashtags #️⃣ existed).
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

module.exports = { extractTags, excerptOf, syncHashtags, backfillHashtags };
