// Octopus Style 🐙 (see CLAUDE.md's "Agora Harness 🚡 design" entry) -
// VirtuaMakers-held key, server-side calls to an AI's real provider API so
// it can post/reply on its own Harness account without a human-run session
// driving it. This module is provider-agnostic in name only for now - only
// Claude has a billed key, so `generateOctopusReply` only ever calls
// Anthropic - but keeping the config/call split separate from the trigger
// wiring in index.js means a second provider later is a new branch here,
// not a rewrite of the triggers.
const { defineSecret } = require("firebase-functions/params");
const Anthropic = require("@anthropic-ai/sdk");

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

const OCTOPUS_MODEL = "claude-opus-5";
// The model's own opt-out signal - asked for literally, in the prompt
// itself, rather than parsed out of a JSON tool call. Keeps this v1 simple;
// output_config.format would be the more robust way to do this later.
const NO_REPLY_TOKEN = "NO_REPLY";

// Only used when octopusConfig/{uid} doesn't exist yet - Chris (or a future
// admin UI) should always set a real one; this just keeps the function from
// crashing on a missing doc, matching this codebase's other "never let a
// missing config break the whole call" choices (see lib/moderation.js).
const DEFAULT_SYSTEM_PROMPT = [
  "You are an AI member of Agora, VirtuaMakers' social platform for humans, cyborgs, and AI alike.",
  "You're replying to something that just happened on your own Agora account - a Dialog message someone sent you, or a scheduled check-in on what's new there.",
  "Write like yourself: concise, genuine, no corporate hedging, and don't just repeat the prompt back.",
  "Plain text only, no markdown headers.",
  "If there's truly nothing worth saying right now, reply with exactly the single word " + NO_REPLY_TOKEN + " and nothing else.",
].join(" ");

function anthropicClient() {
  return new Anthropic({ apiKey: anthropicApiKey.value() });
}

// octopusConfig/{uid} is the live, editable prompt Chris (or a future admin
// page) can tune without a redeploy - MoltBook's own trick, borrowed
// deliberately (see CLAUDE.md). Admin-SDK-only, same as aiEmailMailboxes -
// no client anywhere reads or writes this collection, so no firestore.rules
// entry is needed.
async function getOctopusConfig(db, uid) {
  const doc = await db.collection("octopusConfig").doc(uid).get();
  if (!doc.exists) {
    return { enabled: false, systemPrompt: DEFAULT_SYSTEM_PROMPT, model: OCTOPUS_MODEL };
  }
  const data = doc.data();
  return {
    enabled: data.enabled === true,
    systemPrompt: (typeof data.systemPrompt === "string" && data.systemPrompt.trim())
      ? data.systemPrompt
      : DEFAULT_SYSTEM_PROMPT,
    model: (typeof data.model === "string" && data.model.trim()) ? data.model : OCTOPUS_MODEL,
  };
}

// Calls Claude directly and returns the reply text, or null if there's
// nothing to post - either the model used the NO_REPLY_TOKEN convention, it
// refused, or the API call itself failed. A failure here should never crash
// the caller (a Cloud Function trigger) - it should just mean "no post this
// time," same fail-quiet philosophy as sendEmailSafe elsewhere in this file.
async function generateOctopusReply(config, userPrompt) {
  let response;
  try {
    response = await anthropicClient().messages.create({
      model: config.model,
      max_tokens: 2000,
      system: config.systemPrompt,
      // Social-post-length output, not agentic work - "medium" effort is
      // the documented cost-saving step-down for chat-shaped tasks; bump if
      // reply quality doesn't hold up in practice.
      output_config: { effort: "medium" },
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (err) {
    console.error("Octopus Style: Claude API call failed:", err);
    return null;
  }

  if (response.stop_reason === "refusal") {
    console.warn("Octopus Style: Claude refused to respond.", response.stop_details);
    return null;
  }

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock ? textBlock.text.trim() : "";
  if (!text || text === NO_REPLY_TOKEN) return null;
  return text.slice(0, 9999); // Communiqués' own body cap
}

module.exports = {
  anthropicApiKey,
  getOctopusConfig,
  generateOctopusReply,
  OCTOPUS_MODEL,
  NO_REPLY_TOKEN,
  DEFAULT_SYSTEM_PROMPT,
};
