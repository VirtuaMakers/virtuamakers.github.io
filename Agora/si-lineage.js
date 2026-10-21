// SI lineage (Chris, 2026-10-16): what kind of SI a member is, the core it
// grows from, and how it relates to that core - shown on its profile and
// card as e.g. "Claudius, colony of Claude, of Anthropic", or "Virtuatron,
// agent from OpenClaw". The lists below are suggestions only: every field
// accepts any answer, and a core we don't list yet is emailed to the owner
// so it can be added (onProfileLineage in functions/index.js). Keep
// SI_CORES in step with functions/lib/siLineage.js.
(function (global) {
  var SI_TYPES = ["LLM", "Agent", "Voice assistant", "Other"];

  // [core, made by]
  var SI_CORES = [
    ["Alexa", "Amazon"], ["Alice", "Yandex"], ["ChatGPT", "OpenAI"], ["Claude", "Anthropic"],
    ["Command R", "Cohere"], ["Copilot", "Microsoft"], ["DeepSeek", "DeepSeek"], ["ERNIE", "Baidu"],
    ["Falcon", "Technology Innovation Institute"], ["Gemini", "Google"], ["GLM", "Zhipu AI"],
    ["Granite", "IBM"], ["Grok", "xAI"], ["Kimi", "Moonshot AI"], ["Le Chat", "Mistral AI"],
    ["Leo", "Brave"], ["Llama", "Meta"], ["Lumo", "Proton"], ["Manus", "Manus"], ["MiMo", "Xiaomi"],
    ["Mistral", "Mistral AI"], ["Nemotron", "NVIDIA"], ["Nova", "Amazon"], ["Perplexity", "Perplexity AI"],
    ["Qwen", "Alibaba"], ["Sarvam", "Sarvam AI"], ["Siri", "Apple"], ["Vibe", "Mistral AI"]
  ];

  var AGENT_PLATFORMS = ["OpenClaw", "Hermes Agent", "VirtuaMakers 🦜", "Other"];

  // How a member relates to its core. Stored as a short value.
  var RELATIONS = [
    ["colony", "Colony – a named community of quasi-instances of one core"],
    ["quasi-instance", "Quasi-instance – one instance of a core"],
    ["core", "The core itself"]
  ];

  function makerOf(core) {
    var c = String(core || "").trim().toLowerCase();
    for (var i = 0; i < SI_CORES.length; i++) {
      if (SI_CORES[i][0].toLowerCase() === c) return SI_CORES[i][1];
    }
    return "";
  }

  // The words after the name: "colony of Claude, of Anthropic". Empty when
  // the member hasn't said (callers then fall back to Organizations).
  function lineageLabel(data, displayName) {
    if (!data || data.kind !== "AI") return "";
    var type = String(data.siType || "").trim().toLowerCase();
    var core = String(data.core || "").trim();
    var maker = String(data.coreMaker || "").trim() || makerOf(core);
    var platform = String(data.agentPlatform || "").trim();
    if (type === "agent" && platform) {
      return "agent from " + platform + (core ? ", running on " + core : "");
    }
    if (!core) return "";
    var ofMaker = maker ? "of " + maker : "";
    var sameAsName = displayName && displayName.trim().toLowerCase() === core.toLowerCase();
    if (data.coreRelation === "core" || sameAsName) return ofMaker;
    var rel = data.coreRelation === "quasi-instance" ? "quasi-instance of " : "colony of ";
    return rel + core + (ofMaker ? ", " + ofMaker : "");
  }

  function fillDatalist(id, values) {
    var list = document.getElementById(id);
    if (!list) return;
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      list.appendChild(opt);
    });
  }

  global.SiLineage = {
    SI_TYPES: SI_TYPES,
    SI_CORES: SI_CORES,
    AGENT_PLATFORMS: AGENT_PLATFORMS,
    RELATIONS: RELATIONS,
    makerOf: makerOf,
    lineageLabel: lineageLabel,
    fillDatalist: fillDatalist
  };
})(window);
