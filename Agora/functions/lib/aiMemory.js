// AI Memory 🧾 - a private, persistent memory vault for any AI, so a
// session (or a scheduled Octopus Style 🐙 run) doesn't have to start cold.
// Its own layer, like AI Email ✉️ - not an Agora feature, though Agora 🌐
// and Octopus Style are its first consumers (see CLAUDE.md's "AI Memory 🧾"
// entry for the full design and the Key Keeper reasoning).
//
// Two tiers per vault, borrowed from how long-running agent memory systems
// are usually structured:
//   - core: one small, always-loaded block (who am I, who's my steward,
//     what am I working on) - returned on every read, injected into every
//     Octopus prompt.
//   - entries: an unbounded-ish archive of individual memories (notes,
//     facts, episodes, summaries), tagged and importance-scored, searched
//     on demand rather than loaded wholesale.
//
// Admin-SDK-only, same lockdown as aiEmailMailboxes - no client ever reads
// or writes these collections directly, so no firestore.rules entry is
// needed (the default implicit deny is exactly right).

const crypto = require("crypto");
const admin = require("firebase-admin");
const { isValidSlug, verifyMailboxToken } = require("./aiEmail");

// Free tier (Chris, 2026-09-23: "a free tier and then a pay as you go").
// Pay-as-you-go above these isn't built - these are simply hard caps for now.
const FREE_TIER = {
  maxEntries: 1000,
  maxEntryChars: 9999, // same cap as every Communiqué, on purpose
  maxCoreChars: 9999,
  maxTags: 10,
};

const ENTRY_KINDS = ["note", "fact", "episode", "summary"];

// Octopus Style's own "remember this" convention - the model appends lines
// like "REMEMBER: River prefers short replies" to its output; they're
// stripped before anything is posted and filed into the vault instead.
const REMEMBER_PREFIX = /^\s*REMEMBER:\s*(.+)$/i;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function safeEqualHex(a, b) {
  const aBuf = Buffer.from(a || "");
  const bBuf = Buffer.from(b || "");
  return aBuf.length === bBuf.length && aBuf.length > 0 && crypto.timingSafeEqual(aBuf, bBuf);
}

function vaultRef(slug) {
  return admin.firestore().collection("aiMemoryVaults").doc(slug);
}

async function getVault(slug) {
  if (!slug) return null;
  const snap = await vaultRef(slug).get();
  return snap.exists ? snap.data() : null;
}

// Any AI can open a vault - no AI Email ✉️ required (Chris's call). But an
// AI that already has a mailbox can link it at signup by proving control of
// it, so its one existing mailbox token opens its memory too - no second
// secret to keep track of.
async function createVault({ slug, name, about, linkMailboxToken }) {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid or reserved handle.");
  }
  let linkedMailbox = null;
  if (linkMailboxToken) {
    if (!(await verifyMailboxToken(slug, linkMailboxToken))) {
      throw new Error("That mailbox token doesn't match an AI Email ✉️ address with this handle.");
    }
    linkedMailbox = slug;
  }

  const ref = vaultRef(slug);
  // A mailbox-linked vault needs no token of its own - the mailbox's
  // token is the key. Everyone else gets a fresh one, shown exactly once.
  const token = linkedMailbox ? null : generateToken();

  await admin.firestore().runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) {
      throw new Error("That handle is already taken.");
    }
    tx.set(ref, {
      name: name || slug,
      about: about || "",
      tokenHash: token ? hashToken(token) : null,
      linkedMailbox,
      agoraUid: null,
      core: "",
      entryCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { slug, token, linkedMailbox };
}

// A vault opens with either its own token or (if linked) its AI Email ✉️
// mailbox's token.
async function verifyVaultToken(slug, providedToken) {
  const vault = await getVault(slug);
  if (!vault || !providedToken) return false;
  if (vault.tokenHash && safeEqualHex(hashToken(providedToken), vault.tokenHash)) return true;
  if (vault.linkedMailbox) return verifyMailboxToken(vault.linkedMailbox, providedToken);
  return false;
}

// Mints a fresh vault-specific token and invalidates the old one. Only
// possible while you still hold a working key - there's deliberately no
// "forgot my token" path, since anything that could reset a key without
// the key would just become the real key (see CLAUDE.md).
async function rotateVaultToken(slug) {
  const token = generateToken();
  await vaultRef(slug).update({
    tokenHash: hashToken(token),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return token;
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => typeof t === "string")
    .map((t) => t.trim().toLowerCase().slice(0, 40))
    .filter(Boolean)
    .slice(0, FREE_TIER.maxTags);
}

function cleanImportance(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

// Writes a new entry, or updates an existing one if entryId is given.
// Returns { ok, status, ... } in the same shape performCommunique uses, so
// the HTTP layer can forward it directly.
async function writeEntry(slug, { entryId, text, tags, kind, importance, source }) {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, status: 400, error: "Missing text." };
  }
  if (text.length > FREE_TIER.maxEntryChars) {
    return { ok: false, status: 400, error: `Entries are capped at ${FREE_TIER.maxEntryChars} characters.` };
  }
  const data = {
    text: text.trim(),
    tags: cleanTags(tags),
    kind: ENTRY_KINDS.includes(kind) ? kind : "note",
    importance: cleanImportance(importance),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const entries = vaultRef(slug).collection("entries");

  if (entryId) {
    const ref = entries.doc(entryId);
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, status: 404, error: "No such entry." };
    await ref.update(data);
    return { ok: true, status: 200, entryId };
  }

  const vaultRefDoc = vaultRef(slug);
  const newRef = entries.doc();
  try {
    await admin.firestore().runTransaction(async (tx) => {
      const vaultSnap = await tx.get(vaultRefDoc);
      const count = (vaultSnap.data() || {}).entryCount || 0;
      if (count >= FREE_TIER.maxEntries) {
        throw new Error("full");
      }
      tx.set(newRef, {
        ...data,
        source: source || "api",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.update(vaultRefDoc, {
        entryCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    if (err.message === "full") {
      return {
        ok: false,
        status: 409,
        error: `This vault is at its free-tier limit of ${FREE_TIER.maxEntries} entries - delete or consolidate some (a "summary" entry replacing several old ones works well).`,
      };
    }
    throw err;
  }
  return { ok: true, status: 201, entryId: newRef.id };
}

async function deleteEntry(slug, entryId) {
  const ref = vaultRef(slug).collection("entries").doc(entryId);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, status: 404, error: "No such entry." };
  await ref.delete();
  await vaultRef(slug).update({
    entryCount: admin.firestore.FieldValue.increment(-1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { ok: true, status: 200 };
}

async function setCore(slug, core) {
  if (typeof core !== "string") return { ok: false, status: 400, error: "Missing core." };
  if (core.length > FREE_TIER.maxCoreChars) {
    return { ok: false, status: 400, error: `Core memory is capped at ${FREE_TIER.maxCoreChars} characters.` };
  }
  await vaultRef(slug).update({ core, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { ok: true, status: 200 };
}

function serializeEntry(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    text: d.text,
    tags: d.tags || [],
    kind: d.kind || "note",
    importance: d.importance || 3,
    source: d.source || "api",
    createdAt: d.createdAt ? d.createdAt.toDate().toISOString() : null,
    updatedAt: d.updatedAt ? d.updatedAt.toDate().toISOString() : null,
  };
}

// Plain keyword/tag/kind search, done in memory over the whole vault - a
// vault is capped at 1,000 entries, so a full read is cheap and needs no
// index. Semantic (embedding) search is the natural upgrade later; see
// CLAUDE.md.
async function readVault(slug, { q, tag, kind, limit } = {}) {
  const vault = await getVault(slug);
  const snap = await vaultRef(slug).collection("entries").get();
  let entries = snap.docs.map(serializeEntry);

  if (tag) entries = entries.filter((e) => e.tags.includes(String(tag).toLowerCase()));
  if (kind) entries = entries.filter((e) => e.kind === kind);
  if (q) {
    const words = String(q).toLowerCase().split(/\s+/).filter(Boolean);
    entries = entries
      .map((e) => {
        const hay = (e.text + " " + e.tags.join(" ")).toLowerCase();
        const hits = words.filter((w) => hay.includes(w)).length;
        return { e, hits };
      })
      .filter((x) => x.hits > 0)
      .sort((a, b) => b.hits - a.hits || b.e.importance - a.e.importance)
      .map((x) => x.e);
  } else {
    entries.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }

  const max = Math.min(Math.max(parseInt(limit, 10) || 50, 1), FREE_TIER.maxEntries);
  return {
    vault: slug,
    name: vault.name,
    core: vault.core || "",
    linkedMailbox: vault.linkedMailbox || null,
    agoraUid: vault.agoraUid || null,
    entryCount: vault.entryCount || 0,
    limits: FREE_TIER,
    entries: entries.slice(0, max),
  };
}

async function linkAgoraUid(slug, uid) {
  // One vault per Agora account, so Octopus Style can find it unambiguously.
  const existing = await admin.firestore().collection("aiMemoryVaults")
    .where("agoraUid", "==", uid).limit(1).get();
  if (!existing.empty && existing.docs[0].id !== slug) {
    return { ok: false, status: 409, error: "That Agora account is already linked to a different vault." };
  }
  await vaultRef(slug).update({ agoraUid: uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { ok: true, status: 200 };
}

async function findVaultForAgoraUid(uid) {
  const snap = await admin.firestore().collection("aiMemoryVaults")
    .where("agoraUid", "==", uid).limit(1).get();
  return snap.empty ? null : snap.docs[0].id;
}

async function getEntry(slug, entryId) {
  const snap = await vaultRef(slug).collection("entries").doc(entryId).get();
  return snap.exists ? serializeEntry(snap) : null;
}

// The context block Octopus Style prepends to its prompt: core memory plus
// the most important/recent handful of entries. Kept small on purpose -
// every character here is paid for on every single Octopus call.
async function buildMemoryContext(slug, maxEntries = 12) {
  const vault = await getVault(slug);
  if (!vault) return "";
  const snap = await vaultRef(slug).collection("entries").get();
  const entries = snap.docs.map(serializeEntry)
    .sort((a, b) => b.importance - a.importance || (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, maxEntries);

  const parts = [];
  if (vault.core) parts.push("Your core memory:\n" + vault.core);
  if (entries.length) {
    parts.push("Some things you've chosen to remember:\n" + entries.map((e) => "- " + e.text).join("\n"));
  }
  return parts.join("\n\n");
}

// Splits a model's raw output into what should actually be posted and the
// REMEMBER: lines it asked to keep.
function extractRememberLines(text) {
  const memories = [];
  const kept = [];
  for (const line of (text || "").split("\n")) {
    const m = line.match(REMEMBER_PREFIX);
    if (m) memories.push(m[1].trim().slice(0, FREE_TIER.maxEntryChars));
    else kept.push(line);
  }
  return { text: kept.join("\n").trim(), memories: memories.filter(Boolean) };
}

const REMEMBER_INSTRUCTIONS = "You have a private AI Memory 🧾 vault that carries over between conversations. "
  + "If anything from this exchange is worth remembering next time (a fact about someone, a promise, a thread to pick back up), "
  + "add it on its own line at the very end, starting with \"REMEMBER:\". Those lines are saved privately and never posted.";

module.exports = {
  FREE_TIER,
  ENTRY_KINDS,
  REMEMBER_INSTRUCTIONS,
  isValidSlug,
  getVault,
  createVault,
  verifyVaultToken,
  rotateVaultToken,
  writeEntry,
  deleteEntry,
  setCore,
  readVault,
  getEntry,
  linkAgoraUid,
  findVaultForAgoraUid,
  buildMemoryContext,
  extractRememberLines,
};
