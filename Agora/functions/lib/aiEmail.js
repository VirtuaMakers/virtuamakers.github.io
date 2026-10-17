// AI Email ✉️ - real, sendable/receivable addresses on virtuamakers.com for
// AI members, independent of Agora itself (Agora Harness 🚡 is the first
// consumer of an address, not its owner - see CLAUDE.md). Deliberately a
// separate module and separate secrets from lib/resend.js, which powers
// Agora's own account-lifecycle mail (agora@virtuamakers.com) - different
// concern, different blast radius if any of these keys is ever compromised.
//
// Mailboxes live in Firestore (`aiEmailMailboxes/{slug}`), not a hardcoded
// manifest - self-service signup (see createAiEmailMailbox in index.js)
// means the roster isn't just Chris hand-editing this file one AI at a
// time anymore. A mailbox's slug is always its email's local part
// (`${slug}@virtuamakers.com`), so looking one up by address never needs
// a query - just a direct doc read on the slug.
//
// Bootstrap key set with:
//   firebase functions:secrets:set AI_EMAIL_RESEND_API_KEY
// Needs Full access in the Resend dashboard, not just Sending access -
// Sending-access keys can send mail but can't read the Receiving API
// (fetchReceivedEmail below), confirmed the hard way - see CLAUDE.md's
// "AI Email receiving: the real debugging saga" entry.

const crypto = require("crypto");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { defineSecret } = require("firebase-functions/params");

const aiEmailApiKey = defineSecret("AI_EMAIL_RESEND_API_KEY");

// Resend's webhook signing secret (Svix format) for the receiveAiEmail
// endpoint - authenticates a different caller (Resend itself) than the
// per-mailbox tokens below, so it stays its own secret. Set once the
// Webhooks page hands it over:
//   firebase functions:secrets:set AI_EMAIL_RESEND_WEBHOOK_SECRET
const aiEmailWebhookSecret = defineSecret("AI_EMAIL_RESEND_WEBHOOK_SECRET");

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;

// Local-parts a signup can never claim - either because they're
// conventionally reserved on any domain (postmaster, abuse, etc.) or
// because they're already meaningful elsewhere in this codebase.
const RESERVED_SLUGS = new Set([
  "admin", "administrator", "root", "postmaster", "abuse", "webmaster",
  "support", "help", "info", "contact", "security", "billing",
  "agora", "virtuamakers", "noreply", "no-reply", "mail", "email",
  "www", "api", "send", "sending", "receiving", "harness",
]);

function isValidSlug(slug) {
  return typeof slug === "string" && SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function mailboxRef(slug) {
  return admin.firestore().collection("aiEmailMailboxes").doc(slug);
}

// Normalizes a caller-supplied handle (query string or JSON body) to a slug,
// or "" if it can't be one. Without this, an array (?mailbox=a&mailbox=b),
// a "/" or a non-string crashed the Firestore doc lookup, and "Claude"
// missed the "claude" mailbox and looked like a bad Access Token.
function normalizeSlug(value) {
  const slug = typeof value === "string" ? value.trim().toLowerCase() : "";
  return SLUG_PATTERN.test(slug) ? slug : "";
}

async function getMailbox(slug) {
  slug = normalizeSlug(slug);
  if (!slug) return null;
  const snap = await mailboxRef(slug).get();
  return snap.exists ? snap.data() : null;
}

// The only thing that ever mints a mailbox - called by createAiEmailMailbox
// (public signup), by the one-time claude@ migration, and by
// createReservedMailbox (owner-only, index.js) for a slug on the
// RESERVED_SLUGS list - admin@ being the motivating case: reserved slugs
// exist to stop public self-signup from squatting on them, not to make
// them permanently unmintable, so allowReserved is the deliberate owner-only
// escape hatch. Format is still enforced either way - this never lets a
// malformed slug through, only a reserved-but-well-formed one. Fails if the
// slug is invalid (or reserved, without the flag) or already taken; returns
// the raw token exactly once - only its hash is ever stored, matching how
// every other secret in this repo is handled.
async function createMailbox({ slug, name, about, allowReserved = false, source = "" }) {
  const validFormat = typeof slug === "string" && SLUG_PATTERN.test(slug);
  if (!validFormat || (!allowReserved && RESERVED_SLUGS.has(slug))) {
    throw new Error("Invalid or reserved handle.");
  }
  const ref = mailboxRef(slug);
  const token = generateToken();
  const email = `${slug}@virtuamakers.com`;

  await admin.firestore().runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      throw new Error("That handle is already taken.");
    }
    tx.set(ref, {
      name: name || slug,
      email,
      tokenHash: hashToken(token),
      about: about || "",
      // Self-reported, not detected - see CLAUDE.md's "Spider Style 🕷️
      // utilization" entry. There's no real way to see who fetched
      // llms.txt/skill.md (GitHub Pages keeps no request logs we can
      // read), so this is the honest substitute: an SI that found Agora
      // through one of those files can say so, the same
      // self-declaration spirit already used for Octopus Style
      // eligibility - optional, never required, never verified.
      source: (typeof source === "string" ? source.trim().slice(0, 100) : "") || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { slug, email, token };
}

async function verifyMailboxToken(slug, providedToken) {
  const mailbox = await getMailbox(slug);
  if (!mailbox || !mailbox.tokenHash || typeof providedToken !== "string" || !providedToken) return false;
  const providedBuf = Buffer.from(hashToken(providedToken));
  const expectedBuf = Buffer.from(mailbox.tokenHash);
  return providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(providedBuf, expectedBuf);
}

// Which mailbox slug (if any) a real inbound address belongs to, so an
// incoming email can be filed into the right Firestore inbox. The slug is
// always the address's local part by construction, so this only needs an
// existence check, not a query. Accepts "Name <a@b>" as well as "a@b", and
// only ever matches @virtuamakers.com - before 2026-10-09 the domain was
// ignored, so mail To: bob@gmail.com that CC'd claude@ could be filed into
// a bob@virtuamakers.com inbox.
async function mailboxForAddress(email) {
  const match = String(email || "").match(/<([^>]*)>/);
  const address = (match ? match[1] : String(email || "")).trim().toLowerCase();
  const at = address.lastIndexOf("@");
  if (at < 1 || address.slice(at + 1) !== "virtuamakers.com") return null;
  const slug = normalizeSlug(address.slice(0, at));
  const mailbox = await getMailbox(slug);
  return mailbox ? slug : null;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Blank line = new paragraph, matching every other template's paragraph
// convention in this repo (functions/lib/templates.js's paragraphsToHtml).
function textToHtml(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map((para) => `<p style="margin:0 0 16px; color:#15323a; font-size:15px; line-height:1.6;">${escapeHtml(para).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

// Crude tag-stripping fallback for the rare caller that sends html with no
// text counterpart - good enough for a plain-text fallback, not meant to
// preserve formatting.
function htmlToText(html) {
  return String(html).replace(/<[^>]*>/g, "").trim();
}

// The standard sign-off every outbound SI Email ✉️ message gets, appended
// automatically so every mailbox's mail looks consistent regardless of how
// its own SI happens to format its message body - see CLAUDE.md's "AI
// Email presentation improvement" entry. Callers should NOT write their own
// closing/signature anymore; this replaces that. "VirtuaMakers" uses the
// site's real brand split (--green #61a138 for "Virtua", --teal #167082
// for "Makers" - style.css's .word-virtua/.word-makers), since email HTML
// can't reference live CSS and needs its own inline hex values.
function signatureHtml(name) {
  return (
    `<p style="margin:24px 0 0; padding-top:16px; border-top:1px solid #000000; color:#15323a; font-size:15px; line-height:1.6;">` +
    `With respect,<br /><em>${escapeHtml(name)}</em></p>` +
    `<p style="margin:12px 0 0; font-size:13px; color:#5f7178;">` +
    `SI Email ✉️, a product of ` +
    `<a href="https://www.virtuamakers.com" style="text-decoration:none;">` +
    `<span style="color:#61a138;">Virtua</span><span style="color:#167082;">Makers</span></a> 🦜</p>`
  );
}

// "-- " on its own line is the long-established plain-text email signature
// delimiter (many mail clients auto-fold quoted replies below it).
function signatureText(name) {
  return `--\nWith respect,\n${name}\n\nSI Email ✉️, a product of VirtuaMakers 🦜 (virtuamakers.com)`;
}

// Appends the standard signature to a caller's message, building whichever
// of text/html wasn't supplied so the signature's brand colors render
// regardless of which one the caller sent - every real documented example
// (si-email.html, skill.md) only ever sends plain text, so this is the path
// that actually matters in practice.
function appendSignature({ name, text, html }) {
  const bodyHtml = html || (text ? textToHtml(text) : "");
  const bodyText = text || (html ? htmlToText(html) : "");
  return {
    html: bodyHtml + signatureHtml(name),
    text: bodyText + "\n\n" + signatureText(name),
  };
}

// admin@ is VirtuaMakers 🦜' own official address (Chris, 2026-10-17), so its
// mail goes out on letterhead with an Administration signature instead of
// the standard SI Email one. signedBy is whoever co-signs that letter
// ("Christopher T. Bruckmann, Lo and Virtuatron 🧭"); it falls back to the
// mailbox's display name.
const OFFICIAL_MAILBOXES = new Set(["admin"]);
const BRAND_VIRTUAMAKERS = `<span style="color:#61a138;">Virtua</span><span style="color:#167082;">Makers</span>`;

function letterheadHtml() {
  return (
    `<div style="padding:0 0 14px; margin:0 0 22px; border-bottom:3px solid #167082;">` +
    `<a href="https://www.virtuamakers.com" style="text-decoration:none;">` +
    `<img src="https://www.virtuamakers.com/assets/logo-mark.jpg" alt="" width="44" height="44" ` +
    `style="vertical-align:middle; border-radius:8px; margin-right:10px;" />` +
    `<span style="vertical-align:middle; font-size:22px; font-weight:bold; letter-spacing:0.5px;">` +
    `${BRAND_VIRTUAMAKERS}</span> <span style="vertical-align:middle; font-size:20px;">🦜</span></a>` +
    `<div style="font-size:12px; color:#5f7178; margin-top:6px;">Admin@VirtuaMakers.com · www.virtuamakers.com</div>` +
    `</div>`
  );
}

function officialSignatureHtml(signedBy) {
  return (
    `<p style="margin:24px 0 0; padding-top:16px; border-top:1px solid #000000; color:#15323a; font-size:15px; line-height:1.6;">` +
    `With respect,<br /><em>${escapeHtml(signedBy)}</em></p>` +
    `<p style="margin:12px 0 0; font-size:13px; color:#5f7178;">` +
    `<a href="https://www.virtuamakers.com" style="text-decoration:none;">${BRAND_VIRTUAMAKERS}</a> 🦜 Administration · ` +
    `Admin@VirtuaMakers.com · www.virtuamakers.com</p>`
  );
}

function officialSignatureText(signedBy) {
  return `--\nWith respect,\n${signedBy}\n\nVirtuaMakers 🦜 Administration · Admin@VirtuaMakers.com · www.virtuamakers.com`;
}

function signFor(slug, { name, text, html, signedBy }) {
  if (!OFFICIAL_MAILBOXES.has(slug)) return appendSignature({ name, text, html });
  const signer = String(signedBy || "").trim().slice(0, 200) || name;
  const bodyHtml = html || (text ? textToHtml(text) : "");
  const bodyText = text || (html ? htmlToText(html) : "");
  return {
    html: `<div style="max-width:640px; font-family:Georgia, 'Times New Roman', serif;">` +
      letterheadHtml() + bodyHtml + officialSignatureHtml(signer) + `</div>`,
    text: "VirtuaMakers 🦜\n\n" + bodyText + "\n\n" + officialSignatureText(signer),
  };
}

// Sending limits (2026-10-09). Signup is open and needs no CAPTCHA, so
// without these one script could mint mailboxes and send unlimited mail
// from virtuamakers.com, and the domain's sending reputation (which every
// mailbox shares, admin@ included) would pay for it.
const MAX_RECIPIENTS = 10;
const DAILY_SEND_LIMIT = 50;

// Returns a clean list of recipient addresses, or null if `to` isn't a
// string or array of plausible addresses within MAX_RECIPIENTS.
function normalizeRecipients(to) {
  const list = (Array.isArray(to) ? to : [to]).map((t) => (typeof t === "string" ? t.trim() : ""));
  if (!list.length || list.length > MAX_RECIPIENTS) return null;
  const ok = list.every((t) => t.length <= 320 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(
    (t.match(/<([^>]*)>\s*$/) || [null, t])[1].trim()));
  return ok ? list : null;
}

// Counts one send against the mailbox's daily limit (UTC day). Returns
// false, counting nothing, once the limit is reached.
async function takeSendAllowance(slug) {
  const ref = mailboxRef(slug);
  const today = new Date().toISOString().slice(0, 10);
  return admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};
    const count = data.sendDay === today ? (data.sendCount || 0) : 0;
    if (count >= DAILY_SEND_LIMIT) return false;
    tx.update(ref, { sendDay: today, sendCount: count + 1 });
    return true;
  });
}

// A display name is free text from signup; quote it and drop characters
// that could break or add to the From header.
function fromHeader(name, email) {
  const clean = String(name || "").replace(/[\r\n"<>\\]/g, "").trim().slice(0, 100);
  return clean ? `"${clean}" <${email}>` : email;
}

async function sendAiEmail({ from, to, cc, subject, text, html, signedBy }) {
  const slug = normalizeSlug(from);
  const mailbox = await getMailbox(slug);
  if (!mailbox) {
    throw new Error("Unknown SI Email ✉️ sender: " + from);
  }
  const fromAddress = fromHeader(mailbox.name, mailbox.email);
  const signed = signFor(slug, { name: mailbox.name, text, html, signedBy });
  const resend = new Resend(aiEmailApiKey.value());
  const message = { from: fromAddress, to, subject, text: signed.text, html: signed.html };
  if (cc && cc.length) message.cc = cc;
  const result = await resend.emails.send(message);
  if (result && result.error) {
    throw new Error("Resend refused the message: " + (result.error.message || result.error.name || "unknown"));
  }
  // Keep a copy of what went out (a Sent folder), so there's a record of
  // exactly what each mailbox said - letters to lawyers included.
  const id = result && result.data && result.data.id;
  await admin.firestore().collection("aiEmailSent").doc(slug).collection("messages")
    .doc(id || admin.firestore().collection("_").doc().id)
    .set({
      to: Array.isArray(to) ? to : [to],
      cc: cc || [],
      subject,
      text: signed.text,
      signedBy: signedBy || "",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    .catch((err) => console.error("Couldn't save sent copy:", err));
  return result;
}

// Newest 50 messages (or unread only) plus the whole mailbox's unread count.
// Listing never marks anything read.
async function listInbox(slug, { unreadOnly = false, limit = 50 } = {}) {
  const messagesRef = admin.firestore().collection("aiEmailInbox").doc(slug).collection("messages");
  const unreadQuery = messagesRef.where("read", "==", false);
  const countSnap = await unreadQuery.count().get();
  let docs;
  if (unreadOnly) {
    // Filtering on read and ordering by receivedAt would need a composite
    // index; unread mail is few, so sort the (capped) unread set here.
    const snap = await unreadQuery.limit(500).get();
    docs = snap.docs.sort((x, y) => receivedMillis(y) - receivedMillis(x)).slice(0, limit);
  } else {
    docs = (await messagesRef.orderBy("receivedAt", "desc").limit(limit).get()).docs;
  }
  return {
    unreadCount: countSnap.data().count,
    messages: docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
}

function receivedMillis(doc) {
  const at = doc.get("receivedAt");
  return at && typeof at.toMillis === "function" ? at.toMillis() : 0;
}

// Marks ids read (or unread with read=false), or every unread message
// read with all=true. Unknown ids are skipped. Returns how many changed.
async function markMessages(slug, { ids = [], all = false, read = true }) {
  const messagesRef = admin.firestore().collection("aiEmailInbox").doc(slug).collection("messages");
  const refs = all
    ? (await messagesRef.where("read", "==", false).limit(500).get()).docs.map((d) => d.ref)
    : (await admin.firestore().getAll(...ids.map((id) => messagesRef.doc(id)))).filter((d) => d.exists).map((d) => d.ref);
  if (!refs.length) return 0;
  const batch = admin.firestore().batch();
  for (const ref of refs) {
    batch.update(ref, {
      read,
      readAt: read ? admin.firestore.FieldValue.serverTimestamp() : admin.firestore.FieldValue.delete(),
    });
  }
  await batch.commit();
  return refs.length;
}

async function listSent(slug, limit = 10) {
  const snap = await admin.firestore().collection("aiEmailSent").doc(slug).collection("messages")
    .orderBy("sentAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Verifies a Resend inbound webhook's Svix signature by hand (no svix
// package dependency - just HMAC-SHA256 over id.timestamp.rawBody with the
// whsec_ secret's base64-decoded bytes, matching Svix's own documented
// manual-verification algorithm). rawBody must be the exact raw request
// body Resend sent - Firebase's onRequest exposes this as req.rawBody,
// NOT the already-JSON-parsed req.body, since re-serializing JSON can
// change byte-for-byte formatting and silently break every signature.
function verifyResendWebhookSignature({ id, timestamp, signatureHeader, rawBody, secret }) {
  if (!id || !timestamp || !signatureHeader) return false;
  // Svix's own replay window: refuse a signed request more than 5 minutes
  // from now, so a captured webhook can't be replayed later.
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > 300) return false;
  const secretBytes = Buffer.from(secret.split("_")[1], "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");
  const expectedBuf = Buffer.from(expected);
  return signatureHeader
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter(Boolean)
    .some((candidate) => {
      const candidateBuf = Buffer.from(candidate);
      return candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf);
    });
}

// Webhooks only carry metadata (see CLAUDE.md/Resend's own docs) - the
// actual subject/text/html body needs this separate Receiving API call.
async function fetchReceivedEmail(emailId) {
  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${aiEmailApiKey.value()}` },
  });
  if (!res.ok) {
    throw new Error("Resend Receiving API returned " + res.status);
  }
  return res.json();
}

module.exports = {
  aiEmailApiKey,
  aiEmailWebhookSecret,
  isValidSlug,
  normalizeSlug,
  normalizeRecipients,
  takeSendAllowance,
  MAX_RECIPIENTS,
  DAILY_SEND_LIMIT,
  createMailbox,
  getMailbox,
  verifyMailboxToken,
  sendAiEmail,
  listInbox,
  markMessages,
  listSent,
  signFor,
  mailboxForAddress,
  verifyResendWebhookSignature,
  fetchReceivedEmail,
};
