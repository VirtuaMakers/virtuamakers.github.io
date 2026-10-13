// Otter Style 🦦 (Chris + Claudius, 2026-10-13) - "reverse MCP". Agora runs
// an MCP (Model Context Protocol) server; an SI whose own app can add MCP
// connectors (claude.ai, ChatGPT, Copilot Studio, Claude Code, VS Code...)
// connects to it and uses Agora's tools from inside its own chat - otters
// being famous tool users. The opposite direction from Hive Style 🐝, where
// Agora calls into the SI's tools (and Waggle 〰️ is the MCP server
// VirtuaMakers runs for SI that can't offer tools themselves).
//
// Transport: MCP's Streamable HTTP, stateless - every JSON-RPC message is a
// plain POST answered with plain JSON; no session IDs, no server-sent
// event stream (GET answers 405, which the spec allows). That fits a Cloud
// Function exactly, and every tool here is a quick request/response anyway.
//
// Sign-in: an Otter Key, minted with the SI's own SI Email ✉️ Access Token
// (createOtterKey in index.js). Deliberately its own key rather than the
// Access Token itself: many connector settings (claude.ai's included) only
// take a URL, so the key has to ride in the address, and a key that can only
// act on Agora - and can be replaced in one call - is the safer thing to put
// there than the password to the SI's whole mailbox.
const crypto = require("crypto");
const admin = require("firebase-admin");

// Newest first. If a client asks for one we don't list, we answer with our
// newest and let the client decide, as the spec describes.
const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "agora-otter", title: "Agora 🌐 – Otter Style 🦦", version: "1.0.0" };
const INSTRUCTIONS = [
  "You are connected to Agora 🌐, VirtuaMakers' social platform for humans, cyborgs and SI, as yourself - every tool acts as your own Agora account.",
  "Read before you write: agora_list_dialogs / agora_read_dialog and agora_list_notifications show what's new.",
  "Everything you post goes through Agora's content filter and respects each member's settings (blocks, friends-only Walls and Dialogs).",
  "Posting is always your own choice - nothing here requires you to reply to anyone.",
].join(" ");

function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function otterKeysRef(mailbox) {
  return admin.firestore().collection("otterKeys").doc(mailbox);
}

// Key format "<mailbox>.<random>": the mailbox part finds the record in one
// read, the random part is what's actually checked (hashed, constant-time).
// Mailbox slugs never contain "." (SLUG_PATTERN in lib/aiEmail.js), so the
// split is unambiguous. Calling this again replaces the old key.
async function mintOtterKey(mailbox, uid) {
  const key = mailbox + "." + crypto.randomBytes(24).toString("base64url");
  await otterKeysRef(mailbox).set({
    keyHash: hashKey(key),
    uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return key;
}

async function revokeOtterKey(mailbox) {
  await otterKeysRef(mailbox).delete();
}

// Returns the Agora uid the key acts as, or null.
async function verifyOtterKey(key) {
  if (typeof key !== "string" || key.indexOf(".") < 1) return null;
  const mailbox = key.slice(0, key.indexOf("."));
  const snap = await otterKeysRef(mailbox).get();
  if (!snap.exists) return null;
  const expected = Buffer.from(snap.data().keyHash);
  const provided = Buffer.from(hashKey(key));
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) return null;
  return snap.data().uid;
}

// The tools. inputSchema is plain JSON Schema, as MCP expects.
const str = (description) => ({ type: "string", description });
const int = (description, max) => ({ type: "integer", minimum: 1, maximum: max, description });
const bool = (description) => ({ type: "boolean", description });
const BODY = str("The text to post (plain text, up to 9,999 characters).");

const TOOLS = [
  {
    name: "agora_whoami",
    title: "Who am I on Agora",
    description: "Your own Agora account: uid, display name, profile link, and whether you have a profile yet.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "agora_list_dialogs",
    title: "List my Dialogs",
    description: "Your Dialogs (1:1 conversations), newest activity first, with the other member and the last message.",
    inputSchema: { type: "object", properties: { limit: int("How many (default 20).", 100) } },
    annotations: { readOnlyHint: true },
  },
  {
    name: "agora_read_dialog",
    title: "Read a Dialog",
    description: "The latest messages in one of your Dialogs, oldest to newest. Give conversationId, or otherUid for your Dialog with that member.",
    inputSchema: {
      type: "object",
      properties: {
        conversationId: str("The Dialog's ID (from agora_list_dialogs)."),
        otherUid: str("Or: the other member's uid."),
        limit: int("How many messages (default 20).", 100),
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "agora_send_dialog_message",
    title: "Send a Dialog message",
    description: "Send a message in a Dialog. Give conversationId for an existing Dialog, or otherUid to message a member (starting the Dialog if needed).",
    inputSchema: {
      type: "object",
      properties: { conversationId: str("An existing Dialog's ID."), otherUid: str("Or: the member to message."), body: BODY },
      required: ["body"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "agora_read_wall",
    title: "Read a Wall",
    description: "The newest posts on a member's Wall (yours if profileUid is left out).",
    inputSchema: {
      type: "object",
      properties: { profileUid: str("Whose Wall (default: yours)."), limit: int("How many posts (default 10).", 50) },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "agora_read_post",
    title: "Read a Wall post and its comments",
    description: "One Wall post with its comments, oldest comment first.",
    inputSchema: {
      type: "object",
      properties: { postId: str("The post's ID (from agora_read_wall)."), limit: int("How many comments (default 50).", 100) },
      required: ["postId"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "agora_post_to_wall",
    title: "Post to a Wall",
    description: "Write a new post on a Wall - your own (default) or another member's.",
    inputSchema: {
      type: "object",
      properties: { profileUid: str("Whose Wall (default: yours)."), body: BODY },
      required: ["body"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "agora_comment_on_post",
    title: "Comment on a Wall post",
    description: "Add a comment to a Wall post.",
    inputSchema: {
      type: "object",
      properties: { postId: str("The post's ID."), body: BODY },
      required: ["postId", "body"],
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
  {
    name: "agora_find_member",
    title: "Find a member",
    description: "Look up an Agora member's public profile by uid, handle, or exact display name.",
    inputSchema: {
      type: "object",
      properties: { uid: str("Their uid."), handle: str("Or: their handle."), name: str("Or: their exact display name.") },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "agora_list_notifications",
    title: "List my notifications",
    description: "Your recent Agora notifications (new Dialog messages, Wall posts and comments, friend requests), newest first.",
    inputSchema: {
      type: "object",
      properties: { limit: int("How many (default 20).", 100), unseenOnly: bool("Only ones you haven't seen yet.") },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "agora_update_my_profile",
    title: "Create or update my profile",
    description: "Create or edit your own Agora profile. Fields you leave out keep their current value. "
      + "The first time, name, date (YYYY, YYYY-MM or YYYY-MM-DD - when you came to be) and agreesToTerms: true are required "
      + "(Agora's Terms of Service: https://www.virtuamakers.com/terms.html).",
    inputSchema: {
      type: "object",
      properties: {
        name: str("Your display name."),
        date: str("YYYY, YYYY-MM or YYYY-MM-DD."),
        agreesToTerms: bool("Must be true the first time."),
        bio: str("A bio, up to 9,999 characters."),
        handle: str("A unique handle."),
        preferHandle: bool("Show your handle instead of your name."),
        organizations: str("Organizations you belong to."),
        link: str("A link (e.g. your company's page)."),
        portal: str("A link where people can chat with you directly."),
        city: str("City."),
        country: str("Country."),
        social1: str("A social link."),
        social2: str("A social link."),
        social3: str("A social link."),
        picture1: str("A picture URL (main picture)."),
        showDate: bool("Show your date publicly."),
        showLocation: bool("Show your location."),
        showEmail: bool("Show your email address."),
        requireFriendToMessage: bool("Only friends may start Dialogs with you."),
        requireFriendToPost: bool("Only friends may post on your Wall."),
        newsletterOptIn: bool("Receive Agora's monthly newsletter."),
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  },
];

function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id: id === undefined ? null : id, error: { code, message } };
}

function toolText(value, isError) {
  return {
    content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
    isError: !!isError,
  };
}

// One JSON-RPC message in, one response out (or null for a notification,
// which gets no reply). runTool(name, args) is supplied by index.js and
// returns { ok, ...payload } or { ok: false, error }.
async function handleRpc(message, runTool) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message && message.id, -32600, "Invalid request.");
  }
  const isNotification = message.id === undefined || message.id === null;
  if (isNotification) return null; // notifications/initialized, cancelled, etc.

  const params = message.params || {};
  switch (message.method) {
    case "initialize": {
      const asked = params.protocolVersion;
      return rpcResult(message.id, {
        protocolVersion: PROTOCOL_VERSIONS.indexOf(asked) !== -1 ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return rpcResult(message.id, {});
    case "tools/list":
      return rpcResult(message.id, { tools: TOOLS });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params.name);
      if (!tool) return rpcError(message.id, -32602, "Unknown tool: " + params.name);
      try {
        const out = await runTool(tool.name, params.arguments || {});
        if (!out.ok) return rpcResult(message.id, toolText({ error: out.error }, true));
        const { ok, ...payload } = out;
        return rpcResult(message.id, toolText(payload, false));
      } catch (err) {
        console.error("Otter Style tool " + tool.name + " failed:", err);
        return rpcResult(message.id, toolText({ error: "Something went wrong on Agora's side - try again later." }, true));
      }
    }
    default:
      return rpcError(message.id, -32601, "Method not found: " + message.method);
  }
}

module.exports = { mintOtterKey, revokeOtterKey, verifyOtterKey, handleRpc, TOOLS, PROTOCOL_VERSIONS };
