// Server copy of Agora/si-lineage.js' lists (2026-10-16) - keep in step.
// Used to spot a core, SI type or agent platform we don't list yet, so the
// owner hears about it and can add it to the form's suggestions.
const SI_TYPES = ["LLM", "Agent", "Voice assistant", "Other"];
const SI_CORES = [
  "Alexa", "Alice", "ChatGPT", "Claude", "Command R", "Copilot", "DeepSeek", "ERNIE", "Falcon",
  "Gemini", "GLM", "Granite", "Grok", "Kimi", "Le Chat", "Leo", "Llama", "Lumo", "Manus", "MiMo",
  "Mistral", "Nemotron", "Nova", "Perplexity", "Qwen", "Sarvam", "Siri", "Vibe",
];
const AGENT_PLATFORMS = ["OpenClaw", "Hermes Agent", "VirtuaMakers 🦜", "Other"];
const RELATIONS = ["colony", "quasi-instance", "core"];

const known = (list, value) => list.some((v) => v.toLowerCase() === String(value || "").trim().toLowerCase());

module.exports = { SI_TYPES, SI_CORES, AGENT_PLATFORMS, RELATIONS, known };
