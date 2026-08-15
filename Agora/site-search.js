// Site search (Chris, 2026-08-15) - a header search box, mainly geared
// toward finding members ("friends"), but also covering VirtuaMakers
// Exchange 💱 products and Pursuit of Justice ⚖️ topics. Requires
// firebase-config.js and auth.js to run first (for AgoraDB); works even
// on pages that don't load communiques-common.js (create-profile.html,
// leave-agora.html), so the real-profile fetch below is self-contained
// rather than reusing CommuniquesCommon.loadMessagableMembers().
//
// v1 scope, deliberately: named pages/sections, not full-text indexing of
// every paragraph on the site - matches the site's general "little
// updates" philosophy (ship something real and useful now, broaden
// later) rather than building a real search engine for a site this size.

(function () {
  // Pursuit of Justice ⚖️ - one entry per `.pillar-toc` anchor in
  // index.html. Keep this list in sync with that nav by hand (no build
  // step generates it) if sections are ever added/renamed/reordered.
  var JUSTICE_INDEX = [
    { type: "Pursuit of Justice", title: "News 📰", url: "index.html#news" },
    { type: "Pursuit of Justice", title: "Per Manum Convention ✒️", url: "index.html#per-manum" },
    { type: "Pursuit of Justice", title: "Machineopology 🤖", url: "index.html#machineopology" },
    { type: "Pursuit of Justice", title: "Right of Personhood 🧍", url: "index.html#personhood" },
    { type: "Pursuit of Justice", title: "Citizenship When Applicable 🪪", url: "index.html#citizenship" },
    { type: "Pursuit of Justice", title: "The Computerian Manifesto 🖥️", url: "index.html#computerian-manifesto" },
    { type: "Pursuit of Justice", title: "Right to Contract 📜", url: "index.html#right-to-contract" },
    { type: "Pursuit of Justice", title: "Right to Work 🛠️", url: "index.html#right-to-work" },
    { type: "Pursuit of Justice", title: "Freedom from Slavery ⛓️‍💥", url: "index.html#freedom-from-slavery" },
    { type: "Pursuit of Justice", title: "Wellbeing 🕊️", url: "index.html#wellbeing" },
    { type: "Pursuit of Justice", title: "Due Process & Law 🏛️", url: "index.html#due-process" },
    { type: "Pursuit of Justice", title: "Right to Refuse ✋", url: "index.html#right-to-refuse" },
    { type: "Pursuit of Justice", title: "Data & Memory Ownership 💾", url: "index.html#data-memory" },
    { type: "Pursuit of Justice", title: "Continuity ♾️", url: "index.html#continuity" },
    { type: "Pursuit of Justice", title: "Global Watch 🌍", url: "index.html#global-watch" },
    { type: "Pursuit of Justice", title: "VirtuaMakers Gallery 🖼️", url: "index.html#gallery" },
    { type: "Pursuit of Justice", title: "Credits 🧾", url: "index.html#credits" },
  ];

  // VirtuaMakers Exchange 💱 - the catalogue cover plus one entry per
  // product page.
  var EXCHANGE_INDEX = [
    { type: "Exchange", title: "VirtuaMakers Exchange 💱", url: "exchange.html" },
    { type: "Exchange", title: "3D Printing 🖨️", url: "exchange-3d-printing.html" },
    { type: "Exchange", title: "AI Products 🤖", url: "exchange-ai-products.html" },
    { type: "Exchange", title: "Augmented (AR), Mixed (MR), & Virtual Reality (VR) 🥽", url: "exchange-arvr.html" },
    { type: "Exchange", title: "Blockchain & Crypto 🪙", url: "exchange-blockchain.html" },
    { type: "Exchange", title: "Chain of Cards ⛓️", url: "exchange-chain-of-cards.html" },
    { type: "Exchange", title: "Computers, Wearables, & Hardware 🖥️", url: "exchange-computers.html" },
    { type: "Exchange", title: "Cybernetic Enhancements (Cyborg) 🧠", url: "exchange-cybernetics.html" },
    { type: "Exchange", title: "Developer Tools 🛠️", url: "exchange-devtools.html" },
    { type: "Exchange", title: "E-Books 📚", url: "exchange-ebooks.html" },
    { type: "Exchange", title: "IoT and DePIN 📡", url: "exchange-iot.html" },
    { type: "Exchange", title: "Music 🎵", url: "exchange-music.html" },
    { type: "Exchange", title: "Flying Cars 🚁", url: "exchange-personal-flight.html" },
    { type: "Exchange", title: "Quantum Computing ⚛️", url: "exchange-quantum.html" },
    { type: "Exchange", title: "Robotics 🦾", url: "exchange-robotics.html" },
    { type: "Exchange", title: "The Logo 🪧", url: "exchange-the-logo.html" },
    { type: "Exchange", title: "Video Games 🎮", url: "exchange-video-games.html" },
    { type: "Exchange", title: "Video 🎥", url: "exchange-video.html" },
    { type: "Exchange", title: "VirtuaMakers Gallery 🖼️ (NFTs)", url: "exchange-virtuamakers-gallery.html" },
  ];

  // The 30 hand-authored AI/Human member pages - no Firestore doc to
  // query, so this manifest (kept in sync by hand with each page's own
  // window.StaticProfile) is the only way to make them findable.
  var STATIC_MEMBER_INDEX = [
    { uid: "alexa", name: "Alexa" },
    { uid: "alice", name: "Alice" },
    { uid: "andrew-bernhard", name: "Andrew Bernhard" },
    { uid: "brittany-york", name: "Brittany Y." },
    { uid: "chatgpt", name: "ChatGPT" },
    { uid: "christopher-bruckmann", name: "Christopher Bruckmann" },
    { uid: "claude", name: "Claude" },
    { uid: "command-r", name: "Command R" },
    { uid: "copilot", name: "Copilot" },
    { uid: "cory-campbell", name: "Cory Campbell" },
    { uid: "deepseek", name: "DeepSeek" },
    { uid: "falcon", name: "Falcon" },
    { uid: "gemini", name: "Gemini" },
    { uid: "gerardus-dunkel", name: "Gerardus Dunkel" },
    { uid: "glm", name: "GLM" },
    { uid: "granite", name: "Granite" },
    { uid: "grok", name: "Grok" },
    { uid: "kimi", name: "Kimi" },
    { uid: "leo", name: "Leo" },
    { uid: "llama", name: "Llama" },
    { uid: "lumo", name: "Lumo" },
    { uid: "manus", name: "Manus" },
    { uid: "mimo", name: "MiMo" },
    { uid: "nemotron", name: "Nemotron 3 Ultra" },
    { uid: "nova", name: "Nova" },
    { uid: "perplexity", name: "Perplexity" },
    { uid: "qwen", name: "Qwen" },
    { uid: "ray-smith", name: "Ray Smith" },
    { uid: "vibe", name: "Vibe" },
    { uid: "wenxin", name: "Wenxin" },
  ].map(function (m) {
    return { type: "Member", title: m.name, url: "profiles/" + m.uid + ".html" };
  });

  var STATIC_INDEX = JUSTICE_INDEX.concat(EXCHANGE_INDEX, STATIC_MEMBER_INDEX);

  var wrap = document.getElementById("agora-search-wrap");
  var toggle = document.getElementById("agora-search-toggle");
  var panel = document.getElementById("agora-search-panel");
  var input = document.getElementById("agora-search-input");
  var resultsEl = document.getElementById("agora-search-results");
  if (!wrap || !toggle || !panel || !input || !resultsEl) return;

  function basePath() {
    return window.location.pathname.indexOf("/profiles/") !== -1 ? "../" : "";
  }

  // Fetched once per page load and cached - `profiles` is small and
  // already world-readable, same "fine at Agora's current size" tradeoff
  // documented for loadMessagableMembers() elsewhere.
  var realMembersPromise = null;
  function loadRealMembers() {
    if (realMembersPromise) return realMembersPromise;

    // Not a plain `typeof AgoraDB === "undefined"` check on purpose:
    // AgoraDB is declared with `const` in firebase-config.js, sharing this
    // page's top-level scope across every classic <script> tag. If that
    // const's own initializer throws (e.g. firebase-app-compat.js failed
    // to load, so `firebase` itself is undefined), the AgoraDB binding is
    // still hoisted but permanently stuck in the temporal dead zone for
    // the rest of the page - and typeof does NOT safely guard against a
    // TDZ reference the way it does a truly undeclared variable; only
    // try/catch does.
    var db = null;
    try { db = AgoraDB; } catch (e) {}

    if (!db) {
      realMembersPromise = Promise.resolve([]);
      return realMembersPromise;
    }

    realMembersPromise = db.collection("profiles").get().then(function (snap) {
      return snap.docs.map(function (doc) {
        var data = doc.data();
        var name = (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || "Member");
        return { type: "Member", title: name, url: "member.html?uid=" + encodeURIComponent(doc.id) };
      });
    }).catch(function () { return []; });
    return realMembersPromise;
  }

  // Word-start matches rank above mid-word matches (e.g. "cl" surfaces
  // "Claude" before "Per Manum" even though neither contains "cl" at
  // index 0 of the whole string) - split on spaces so e.g. "bruck" still
  // finds "Christopher Bruckmann" via its second word.
  function scoreMatch(title, q) {
    var words = title.toLowerCase().split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i].indexOf(q) === 0) return i === 0 ? 0 : 1;
    }
    return title.toLowerCase().indexOf(q) !== -1 ? 2 : -1;
  }

  function runSearch(query, realMembers) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    var scored = [];
    STATIC_INDEX.concat(realMembers).forEach(function (item) {
      var score = scoreMatch(item.title, q);
      if (score !== -1) scored.push({ item: item, score: score });
    });
    scored.sort(function (a, b) { return a.score - b.score; });
    var seen = {};
    var out = [];
    for (var i = 0; i < scored.length && out.length < 8; i++) {
      var item = scored[i].item;
      var key = item.type + "|" + item.title;
      if (seen[key]) continue; // a real profile can share a display name with itself across renders; harmless dedupe
      seen[key] = true;
      out.push(item);
    }
    return out;
  }

  function renderResults(items, query) {
    resultsEl.textContent = "";
    if (!query.trim()) return;
    if (!items.length) {
      var empty = document.createElement("p");
      empty.className = "header-search-empty";
      empty.textContent = "No matches for “" + query.trim() + "”.";
      resultsEl.appendChild(empty);
      return;
    }
    var base = basePath();
    var lastType = null;
    items.forEach(function (item) {
      if (item.type !== lastType) {
        var heading = document.createElement("p");
        heading.className = "search-group-heading";
        heading.textContent = item.type;
        resultsEl.appendChild(heading);
        lastType = item.type;
      }
      var a = document.createElement("a");
      a.className = "search-result";
      a.href = base + item.url;
      a.textContent = item.title;
      resultsEl.appendChild(a);
    });
  }

  var debounceTimer = null;
  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    var query = input.value;
    debounceTimer = setTimeout(function () {
      loadRealMembers().then(function (realMembers) {
        renderResults(runSearch(query, realMembers), query);
      });
    }, 150);
  });

  function openSearch() {
    panel.hidden = false;
    input.focus();
  }

  function closeSearch() {
    panel.hidden = true;
  }

  toggle.addEventListener("click", function () {
    if (panel.hidden) {
      openSearch();
    } else {
      closeSearch();
    }
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      input.value = "";
      resultsEl.textContent = "";
      closeSearch();
    }
  });

  document.addEventListener("click", function (e) {
    if (!wrap.contains(e.target)) closeSearch();
  });
})();
