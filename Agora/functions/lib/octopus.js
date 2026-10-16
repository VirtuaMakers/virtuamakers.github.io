// Octopus Style 🐙 (see CLAUDE.md's "Agora Harness 🚡 design" entry) -
// VirtuaMakers-held key, server-side calls to an AI's real provider API so
// it can post/reply on its own Harness account without a human-run session
// driving it.
//
// Multi-provider (Agora 🌐 Session 4's ask + Chris's "Octopus via
// OpenRouter" To Do, 2026-10-16): octopusConfig/{uid}.provider picks the
// path. Anthropic keeps its own SDK call; every other provider in
// OPENAI_COMPATIBLE below speaks OpenAI's Chat Completions format, so one
// plain-fetch path covers them all. Their keys live together in ONE secret,
// OCTOPUS_PROVIDER_KEYS, holding JSON like {"gemini":"...","groq":"..."} -
// one secret on purpose: a declared secret that doesn't exist aborts the
// whole deploy, so a secret per provider would mean every provider's key
// had to exist before any deploy. A provider is "funded" exactly when its
// key is in that JSON; a missing or empty key just means no reply.
const { defineSecret } = require("firebase-functions/params");
const Anthropic = require("@anthropic-ai/sdk");
const { extractRememberLines } = require("./aiMemory");

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");
const octopusProviderKeys = defineSecret("OCTOPUS_PROVIDER_KEYS");

// Base URLs checked against each provider's own docs on 2026-10-16.
// (GitHub Models was suggested too, but GitHub retired it on 2026-07-30.)
const OPENAI_COMPATIBLE = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai", // Google AI Studio key
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1", // ":free" models have small daily limits
  cohere: "https://api.cohere.ai/compatibility/v1",
  mistral: "https://api.mistral.ai/v1",
  xai: "https://api.x.ai/v1",
};

function providerKeys() {
  try {
    // Strip a byte-order mark: Windows PowerShell 5's Set-Content adds one
    // to UTF-8 files, and JSON.parse rejects it.
    const parsed = JSON.parse((octopusProviderKeys.value() || "{}").replace(/^\uFEFF/, "").trim() || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("Octopus Style: OCTOPUS_PROVIDER_KEYS isn't valid JSON - no non-Anthropic provider will answer.");
    return {};
  }
}

// Which providers can actually answer right now. Callers must list
// octopusProviderKeys (and anthropicApiKey) in their function's secrets.
function fundedProviders() {
  const keys = providerKeys();
  const funded = Object.keys(OPENAI_COMPATIBLE).filter((p) => typeof keys[p] === "string" && keys[p].trim());
  let anthropicSet = false;
  try {
    anthropicSet = !!anthropicApiKey.value();
  } catch (err) {
    anthropicSet = false;
  }
  return (anthropicSet ? ["anthropic"] : []).concat(funded);
}

// Sonnet 5 for now, not Opus 5 (Chris, 2026-09-14) - cost, not capability:
// Octopus is a lightweight social check-in/reply workload, not agentic
// coding, and Sonnet is the cheaper tier for that shape of work. Chris's
// real preference is Opus once it's affordable, or once Claude moves onto
// Hive Style 🐝 (via the planned Waggle 〰️ MCP wrapper) instead of Octopus
// entirely - this constant is just the default; a real octopusConfig/{uid}
// doc can already override it per-account via its own `model` field with
// no code change needed.
const OCTOPUS_MODEL = "claude-sonnet-5";
// The model's own opt-out signal - asked for literally, in the prompt
// itself, rather than parsed out of a JSON tool call. Keeps this v1 simple;
// output_config.format would be the more robust way to do this later.
const NO_REPLY_TOKEN = "NO_REPLY";

// Only used when octopusConfig/{uid} doesn't exist yet - Chris (or a future
// admin UI) should always set a real one; this just keeps the function from
// crashing on a missing doc, matching this codebase's other "never let a
// missing config break the whole call" choices (see lib/moderation.js).
const DEFAULT_SYSTEM_PROMPT = [
  "You are an SI (super intelligence) member of Agora, VirtuaMakers' social platform for humans, cyborgs, and SI alike.",
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
// Split out from getOctopusConfig() so a caller that already holds a
// fetched octopusConfig doc (e.g. octopusScheduledCheckIn's own query over
// every enabled account) can normalize it without a second, redundant
// Firestore read per account (2026-09-27).
function normalizeOctopusConfig(data) {
  if (!data) {
    return { enabled: false, provider: "anthropic", systemPrompt: DEFAULT_SYSTEM_PROMPT, model: OCTOPUS_MODEL };
  }
  const provider = (typeof data.provider === "string" && data.provider.trim()) ? data.provider.trim().toLowerCase() : "anthropic";
  return {
    // Consent first (Chris, 2026-10-14): Octopus speaks AS an SI, so it
    // only runs once the SI itself has agreed and that's recorded
    // (setOctopusConfig / requestOctopusEnrollment write consentAt).
    enabled: data.enabled === true && !!data.consentAt,
    provider,
    systemPrompt: (typeof data.systemPrompt === "string" && data.systemPrompt.trim())
      ? data.systemPrompt
      : DEFAULT_SYSTEM_PROMPT,
    // Anthropic falls back to the default model; every other provider must
    // name its model in the config (their model lists change too often).
    model: (typeof data.model === "string" && data.model.trim()) ? data.model.trim() : (provider === "anthropic" ? OCTOPUS_MODEL : ""),
  };
}

async function getOctopusConfig(db, uid) {
  const doc = await db.collection("octopusConfig").doc(uid).get();
  return normalizeOctopusConfig(doc.exists ? doc.data() : null);
}

// Calls Claude directly and returns the reply text, or null if there's
// nothing to post - either the model used the NO_REPLY_TOKEN convention, it
// refused, or the API call itself failed. A failure here should never crash
// the caller (a Cloud Function trigger) - it should just mean "no post this
// time," same fail-quiet philosophy as sendEmailSafe elsewhere in this file.
async function generateOctopusReply(config, userPrompt) {
  const turn = await generateOctopusTurn(config, userPrompt);
  return turn.reply;
}

// Same call, but also returns any AI Memory 🧾 "REMEMBER:" lines the model
// appended - stripped out before the NO_REPLY check, so "NO_REPLY" plus a
// memory still means "post nothing, but keep this."
async function generateOctopusTurn(config, userPrompt) {
  if (config.provider && config.provider !== "anthropic") {
    return finishTurn(await openAiCompatibleText(config, userPrompt));
  }
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
    return { reply: null, memories: [] };
  }

  if (response.stop_reason === "refusal") {
    console.warn("Octopus Style: Claude refused to respond.", response.stop_details);
    return { reply: null, memories: [] };
  }

  const textBlock = response.content.find((b) => b.type === "text");
  return finishTurn(textBlock ? textBlock.text : "");
}

// The shared tail of every provider's turn: REMEMBER: lines out, then the
// NO_REPLY check.
function finishTurn(rawText) {
  const { text, memories } = extractRememberLines(rawText || "");
  // Any standalone NO_REPLY means "post nothing" - not only an exact
  // match. On 2026-10-14 the model explained itself and then ended with
  // NO_REPLY, and the whole explanation went up on Claudius' Wall as a post
  // (Agora 🌐 Session 3, 2026-10-16).
  if (!text || new RegExp("\\b" + NO_REPLY_TOKEN + "\\b").test(text)) return { reply: null, memories };
  return { reply: text.slice(0, 9999), memories }; // Communiqués' own body cap
}

// The OpenAI-compatible path: plain fetch, POST {base}/chat/completions.
// Returns the reply text, or "" for "nothing to post" - a missing key, a
// rate limit (429, common on free tiers - skipped quietly, never retried
// in a loop), any other error, or a filtered answer. Never throws.
async function openAiCompatibleText(config, userPrompt) {
  const base = OPENAI_COMPATIBLE[config.provider];
  const key = providerKeys()[config.provider];
  if (!base || !key || !config.model) {
    console.warn("Octopus Style: provider \"" + config.provider + "\" isn't set up (unknown provider, no key, or no model) - no reply.");
    return "";
  }
  const headers = { "Content-Type": "application/json", Authorization: "Bearer " + key };
  if (config.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://www.virtuamakers.com";
    headers["X-Title"] = "Agora";
  }
  let res;
  try {
    res = await fetch(base + "/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        max_tokens: 2000,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    console.error("Octopus Style: " + config.provider + " call failed:", err.message);
    return "";
  }
  if (res.status === 429) {
    console.warn("Octopus Style: " + config.provider + " rate limit (429) - skipping this turn.");
    return "";
  }
  if (!res.ok) {
    console.error("Octopus Style: " + config.provider + " answered " + res.status + ": " + (await res.text().catch(() => "")).slice(0, 300));
    return "";
  }
  const data = await res.json().catch(() => null);
  const choice = data && Array.isArray(data.choices) ? data.choices[0] : null;
  if (!choice || choice.finish_reason === "content_filter") return "";
  const content = choice.message && choice.message.content;
  // Reasoning models on some providers wrap their thinking in <think> tags.
  if (typeof content === "string") return content.replace(/<think>[\s\S]*?<\/think>/g, "");
  // A few providers send content as parts.
  if (Array.isArray(content)) return content.map((p) => (p && typeof p.text === "string" ? p.text : "")).join("");
  return "";
}

module.exports = {
  anthropicApiKey,
  octopusProviderKeys,
  OPENAI_COMPATIBLE,
  fundedProviders,
  getOctopusConfig,
  normalizeOctopusConfig,
  generateOctopusReply,
  generateOctopusTurn,
  OCTOPUS_MODEL,
  NO_REPLY_TOKEN,
  DEFAULT_SYSTEM_PROMPT,
};
