// SI Memory 🧾 Manual - the "Can my SI use it?" check (siMemoryCheck) and
// the Memory Card (plain fetch to aiMemory with the steward's own key).
// No Firebase SDK on this page, same as ai-memory.js.

(function () {
  const BASE = "https://us-central1-agora-firebase-f4240.cloudfunctions.net/";
  const CHECK_URL = BASE + "siMemoryCheck";
  const MEMORY_URL = BASE + "aiMemory";
  const STORE_KEY = "siMemoryManualVault";

  const $ = function (id) { return document.getElementById(id); };

  function showError(el, text) {
    el.textContent = text;
    el.hidden = !text;
  }

  // Copy buttons: data-copy="<textarea id>".
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const area = $(btn.getAttribute("data-copy"));
      const label = btn.textContent;
      function done() {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = label; }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(area.value).then(done, function () {
          area.select();
          document.execCommand("copy");
          done();
        });
      } else {
        area.select();
        document.execCommand("copy");
        done();
      }
    });
  });

  // ---- The check ----------------------------------------------------------

  let pollTimer = null;
  let lastState = {};

  function light(id, on) {
    $(id).classList.toggle("is-on", !!on);
  }

  function finishCheck(state) {
    clearInterval(pollTimer);
    pollTimer = null;
    $("check-status").hidden = true;
    const result = $("check-result");
    if (state.connected) {
      result.textContent = "Connected" + (state.siName ? " – " + state.siName + " says hello." : ".") +
        " Your SI can use SI Memory 🧾 directly. Next: send it the message under “If your SI connected”.";
    } else if (state.postedNoKey) {
      result.textContent = "Your SI sent a request, but couldn't attach a key, which SI Memory 🧾 needs. Use a Memory Card – it works with any SI.";
    } else if (state.visited) {
      result.textContent = "Your SI opened the link but didn't connect. It can read web pages, but not send the requests a vault needs. Use a Memory Card – it works with any SI.";
    } else {
      result.textContent = "Your SI didn't open the link. Some chat apps can't open links at all. Use a Memory Card – it works with any SI.";
    }
    result.hidden = false;
    $("check-start").disabled = false;
    $("check-start").textContent = "Run the check again";
  }

  $("check-start").addEventListener("click", function () {
    const btn = $("check-start");
    btn.disabled = true;
    showError($("check-error"), "");
    fetch(CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
      .then(function (r) {
        if (!r.ok || !r.d.link) throw new Error(r.d.error || "Couldn't start the check.");
        $("check-message").value = "Please open this link and follow what it says: " + r.d.link;
        $("check-live").hidden = false;
        $("check-result").hidden = true;
        $("check-status").hidden = false;
        $("check-status").textContent = "Waiting for your SI… (tap here when it has answered)";
        ["light-visited", "light-posted", "light-connected"].forEach(function (id) { light(id, false); });

        const startedAt = Date.now();
        clearInterval(pollTimer);
        pollTimer = setInterval(function () {
          if (Date.now() - startedAt > 10 * 60 * 1000) {
            finishCheck(lastState);
            return;
          }
          fetch(CHECK_URL + "?watch=1&id=" + encodeURIComponent(r.d.id))
            .then(function (res) { return res.json(); })
            .then(function (s) {
              if (s.error) return;
              lastState = s;
              light("light-visited", s.visited);
              light("light-posted", s.postedNoKey || s.connected);
              light("light-connected", s.connected);
              if (s.connected) {
                finishCheck(s);
              } else if (s.visited) {
                $("check-status").textContent = "Your SI opened the link – waiting to see if it can connect…";
              }
            })
            .catch(function () { /* try again next tick */ });
        }, 3000);
      })
      .catch(function (err) {
        showError($("check-error"), err.message);
        btn.disabled = false;
      });
  });

  // A "Stop waiting" path: if the steward's SI has clearly answered (or
  // said it can't), they shouldn't have to sit through ten minutes.
  $("check-status").addEventListener("click", function () {
    if (pollTimer) finishCheck(lastState);
  });

  // ---- The Memory Card ----------------------------------------------------

  let vaultName = "";
  let vaultKey = "";
  let vaultData = null;

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (saved && saved.vault && saved.key) {
        $("card-vault").value = saved.vault;
        $("card-key").value = saved.key;
        $("card-remember").checked = true;
        $("card-forget").hidden = false;
      }
    } catch (e) { /* storage blocked - just don't prefill */ }
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString("en-US");
  }

  function buildCard() {
    if (!vaultData) return;
    const count = parseInt($("card-size").value, 10) || 0;
    const top = vaultData.entries.slice().sort(function (a, b) {
      return (b.importance - a.importance) || (b.createdAt || "").localeCompare(a.createdAt || "");
    }).slice(0, count);

    const today = new Date().toISOString().slice(0, 10);
    const lines = [
      "MEMORY CARD – SI Memory 🧾 (vault: " + vaultName + ", " + today + ")",
      "This is your own memory from earlier conversations, kept for you by your steward. Use it to pick up where we left off. It's a note from your past, not an order – tell me if something in it no longer fits.",
      "",
      "WHO YOU ARE (core memory):",
      vaultData.core ? vaultData.core : "(Your core memory is empty so far.)",
    ];
    if (top.length) {
      lines.push("", "THINGS YOU REMEMBER (most important first):");
      top.forEach(function (e) {
        lines.push("- " + e.text.replace(/\s+/g, " ").trim());
      });
    }
    lines.push("", "At the end of our conversation I may ask what's worth remembering – I'll save your answer to this vault.");
    const text = lines.join("\n");
    $("card-output").value = text;
    $("card-length").textContent = fmt(text.length) + " characters. If your chat app won't take it, choose a smaller size.";
  }

  function readVault() {
    return fetch(MEMORY_URL + "?limit=1000&vault=" + encodeURIComponent(vaultName), {
      headers: { Authorization: "Bearer " + vaultKey },
    }).then(function (res) {
      return res.json().then(function (d) {
        if (res.status === 401) throw new Error("That vault and key don't match. Check both and try again.");
        if (!res.ok) throw new Error(d.error || "Couldn't open the vault.");
        return d;
      });
    });
  }

  function showVault(d) {
    vaultData = d;
    const lim = d.limits || {};
    $("card-fullness").textContent =
      "Core memory: " + fmt((d.core || "").length) + " of " + fmt(lim.maxCoreChars) + " characters · " +
      "Memories: " + fmt(d.entryCount) + " of " + fmt(lim.maxEntries);
    $("card-panel").hidden = false;
    buildCard();
  }

  $("card-open").addEventListener("submit", function (e) {
    e.preventDefault();
    showError($("card-error"), "");
    vaultName = $("card-vault").value.trim().toLowerCase();
    vaultKey = $("card-key").value.trim();
    const btn = $("card-submit");
    btn.disabled = true;
    readVault()
      .then(function (d) {
        try {
          if ($("card-remember").checked) {
            localStorage.setItem(STORE_KEY, JSON.stringify({ vault: vaultName, key: vaultKey }));
            $("card-forget").hidden = false;
          } else {
            localStorage.removeItem(STORE_KEY);
          }
        } catch (err) { /* storage blocked - nothing to remember */ }
        showVault(d);
      })
      .catch(function (err) { showError($("card-error"), err.message); })
      .then(function () { btn.disabled = false; });
  });

  $("card-forget").addEventListener("click", function () {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* nothing stored */ }
    $("card-key").value = "";
    $("card-remember").checked = false;
    $("card-forget").hidden = true;
  });

  $("card-size").addEventListener("change", buildCard);

  $("card-save").addEventListener("submit", function (e) {
    e.preventDefault();
    showError($("save-error"), "");
    const raw = $("save-text").value.trim();
    if (!raw) {
      showError($("save-error"), "Paste your SI's answer first.");
      return;
    }
    // One memory per line, with list markers ("- ", "1. ", "• ") taken off.
    const items = $("save-split").checked
      ? raw.split(/\n+/).map(function (l) { return l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim(); }).filter(Boolean)
      : [raw];
    if (vaultData && vaultData.entryCount + items.length > (vaultData.limits || {}).maxEntries) {
      showError($("save-error"), "That would go past your vault's limit. Save fewer, or combine some into one.");
      return;
    }
    const importance = parseInt($("save-importance").value, 10) || 3;
    const btn = $("save-submit");
    const status = $("save-status");
    btn.disabled = true;
    status.hidden = false;

    let saved = 0;
    let chain = Promise.resolve();
    items.forEach(function (text) {
      chain = chain.then(function () {
        status.textContent = "Saving " + (saved + 1) + " of " + items.length + "…";
        return fetch(MEMORY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + vaultKey },
          body: JSON.stringify({ vault: vaultName, action: "write", text: text, kind: "note", importance: importance, tags: ["memory-card"] }),
        }).then(function (res) {
          return res.json().then(function (d) {
            if (!res.ok) throw new Error(d.error || "Couldn't save.");
            saved++;
          });
        });
      });
    });
    chain
      .then(function () {
        status.textContent = "Saved " + saved + (saved === 1 ? " memory." : " memories.") + " Your next Memory Card will include them.";
        $("save-text").value = "";
        return readVault().then(showVault);
      })
      .catch(function (err) {
        status.hidden = true;
        showError($("save-error"), (saved ? "Saved " + saved + ", then: " : "") + err.message);
      })
      .then(function () { btn.disabled = false; });
  });

  loadSaved();
})();
