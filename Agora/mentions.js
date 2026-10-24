// Tags with @ (Chris, 2026-10-24) - type @ in a Wall post, a comment or a
// Dialog and the site's Search 🔍 opens right under the box: Profiles 🙂
// first, then VirtuaMakers Exchange 💱, then the Knowledge Base 📚 (the
// header Search 🔍 puts the Exchange first - see site-search.js). Picking
// one writes a tag into the text as @[Name](/site/path);
// CommuniquesCommon.sanitizeBody() shows it as an "@Name" link, and the
// server notifies a tagged member (functions: notifyOnWallPost /
// notifyOnWallComment - Dialogs stay private, so tags there only link).
// Needs site-search.js (window.AgoraSearch); does nothing without it.
(function () {
  var SELECTOR = [
    "#wall-post-body",
    "#dialog-with-body",
    "#dm-compose-body",
    ".edit-form textarea",
    ".wall-comment-form-inner textarea",
    ".im-window-compose textarea",
    ".notification-toast-reply textarea",
  ].join(", ");

  // Just after "@" at the start of the text or after a space, up to the
  // caret: "@clau" → "clau". Spaces end a query; a match on any word of a
  // name still finds it ("@bruck" → Christopher T. Bruckmann).
  var QUERY_RE = /(^|\s)@([^\s@\[\]()]{1,30})$/;

  var style = document.createElement("style");
  style.textContent =
    ".mention-menu{position:absolute;z-index:10000;min-width:220px;max-width:320px;max-height:280px;overflow-y:auto;" +
    "background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.14);" +
    "padding:.3rem;font-size:.9rem;text-align:left}" +
    ".mention-menu-group{margin:.35rem .5rem .15rem;font-size:.7rem;font-weight:700;letter-spacing:.06em;" +
    "text-transform:uppercase;color:#6b7280}" +
    ".mention-menu-item{display:block;width:100%;text-align:left;border:0;background:none;padding:.4rem .55rem;" +
    "border-radius:7px;cursor:pointer;font:inherit;color:#1d2433}" +
    ".mention-menu-item.is-active,.mention-menu-item:hover{background:#e8efff}" +
    "a.mention{font-weight:600;text-decoration:none;color:#2b57d6}a.mention:hover{text-decoration:underline}";
  document.head.appendChild(style);

  var menu = null;
  var items = [];
  var active = 0;
  var field = null;
  var queryStart = -1;
  var requestId = 0;

  function closeMenu() {
    if (menu) menu.remove();
    menu = null;
    items = [];
    field = null;
  }

  function cleanTitle(title) {
    return String(title).replace(/[\[\]()<>\n]/g, "").trim().slice(0, 80);
  }

  function choose(item) {
    var el = field;
    if (!el || !item) return closeMenu();
    var before = el.value.slice(0, queryStart);
    var after = el.value.slice(el.selectionStart);
    var tag = "@[" + cleanTitle(item.title) + "](" + item.path + ") ";
    el.value = before + tag + after;
    var caret = before.length + tag.length;
    el.setSelectionRange(caret, caret);
    closeMenu();
    el.focus();
  }

  function highlight(index) {
    active = (index + items.length) % items.length;
    var buttons = menu.querySelectorAll(".mention-menu-item");
    Array.prototype.forEach.call(buttons, function (b, i) {
      b.classList.toggle("is-active", i === active);
      if (i === active) b.scrollIntoView({ block: "nearest" });
    });
  }

  function showMenu(el, results) {
    if (menu) menu.remove();
    field = el;
    items = results;
    menu = document.createElement("div");
    menu.className = "mention-menu";
    menu.setAttribute("role", "listbox");
    var lastType = null;
    results.forEach(function (item, i) {
      if (item.type !== lastType) {
        var g = document.createElement("p");
        g.className = "mention-menu-group";
        g.textContent = item.type === "Profile" ? "Profiles 🙂" : item.type;
        menu.appendChild(g);
        lastType = item.type;
      }
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mention-menu-item";
      b.setAttribute("role", "option");
      b.textContent = item.title;
      // mousedown, not click: keeps the text box focused, so the caret
      // position is still known when the tag goes in.
      b.addEventListener("mousedown", function (e) {
        e.preventDefault();
        choose(item);
      });
      menu.appendChild(b);
      b.dataset.index = i;
    });
    document.body.appendChild(menu);
    var r = el.getBoundingClientRect();
    var top = r.bottom + window.scrollY + 4;
    // Near the bottom of the window (a floating Dialog window), open
    // upward instead so the list isn't cut off.
    if (r.bottom + menu.offsetHeight + 8 > window.innerHeight && r.top > menu.offsetHeight + 8) {
      top = r.top + window.scrollY - menu.offsetHeight - 4;
    }
    menu.style.top = top + "px";
    menu.style.left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + window.innerWidth - menu.offsetWidth - 8)) + "px";
    highlight(0);
  }

  document.addEventListener("input", function (e) {
    var el = e.target;
    if (!el.matches || !el.matches(SELECTOR) || typeof window.AgoraSearch === "undefined") return;
    var upToCaret = el.value.slice(0, el.selectionStart);
    var m = upToCaret.match(QUERY_RE);
    if (!m) return closeMenu();
    queryStart = upToCaret.length - m[2].length - 1;
    var id = ++requestId;
    window.AgoraSearch.search(m[2], { forMentions: true }).then(function (results) {
      if (id !== requestId) return; // a newer keystroke already asked
      if (!results.length) return closeMenu();
      showMenu(el, results);
    });
  });

  // Capture phase, so Enter picks a tag instead of sending the message
  // (the Dialog boxes send on Enter).
  document.addEventListener("keydown", function (e) {
    if (!menu || e.target !== field) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      highlight(active + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      e.stopImmediatePropagation();
      choose(items[active]);
    } else if (e.key === "Escape") {
      e.stopImmediatePropagation();
      closeMenu();
    }
  }, true);

  document.addEventListener("focusout", function (e) {
    if (e.target === field) setTimeout(closeMenu, 150);
  });
  window.addEventListener("resize", closeMenu);
})();
