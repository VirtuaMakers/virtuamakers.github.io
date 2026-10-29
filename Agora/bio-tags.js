// The current allowlist of HTML tags/attributes permitted in a member's
// Bio. Sanitization happens at render time (member.js), not at save time,
// so expanding this list later makes every existing bio light up with the
// newly-allowed tag automatically - nobody has to re-save anything. Meant
// to grow every month or two as a small, deliberate "here's what's new"
// event for the community, not all at once.

(function (global) {
  var ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "br", "p", "a", "ul", "ol", "li", "blockquote", "img"];
  var ALLOWED_ATTR = ["href", "src", "alt"];

  // Pictures (Chris, 2026-10-13): <img> is allowed, but only from Agora 🌐
  // itself plus seven trusted image hosts - big, moderated sites that don't
  // track viewers, so a picture can't be used to spy on readers or slip
  // past moderation. Anything else is removed when the text is shown.
  // Agora will host more of members' own pictures later; this list can
  // grow too. GIF sites (GIPHY, Tenor) were left out on purpose (Chris,
  // 2026-10-13): VirtuaMakers may build its own GIF library (the GifLM
  // idea, a Guardian 🟩 / Melon Drive 🍈 project). Each entry: [name shown in the guide, test on the URL].
  var TRUSTED_IMAGE_HOSTS = [
    ["Agora 🌐 itself (virtuamakers.com and pictures uploaded to Agora)", function (u) {
      return u.hostname === "www.virtuamakers.com" || u.hostname === "virtuamakers.com"
        || u.hostname === "virtuamakers.github.io"
        || (u.hostname === "firebasestorage.googleapis.com"
          && /^\/v0\/b\/agora-firebase-f4240\.(firebasestorage\.app|appspot\.com)\//.test(u.pathname));
    }],
    ["Wikimedia Commons (upload.wikimedia.org)", function (u) { return u.hostname === "upload.wikimedia.org"; }],
    ["Imgur (i.imgur.com)", function (u) { return u.hostname === "i.imgur.com"; }],
    ["Unsplash (images.unsplash.com)", function (u) { return u.hostname === "images.unsplash.com"; }],
    ["Pexels (images.pexels.com)", function (u) { return u.hostname === "images.pexels.com"; }],
    ["Pixabay (cdn.pixabay.com)", function (u) { return u.hostname === "cdn.pixabay.com"; }],
    ["Flickr (live.staticflickr.com)", function (u) { return u.hostname === "live.staticflickr.com"; }],
    ["NASA Image Library (images-assets.nasa.gov)", function (u) { return u.hostname === "images-assets.nasa.gov"; }],
  ];

  function isTrustedImageSrc(src) {
    var u;
    try { u = new URL(src, window.location.href); } catch (e) { return false; }
    if (u.protocol !== "https:" && !(u.protocol === "http:" && u.hostname === "localhost")) return false;
    return TRUSTED_IMAGE_HOSTS.some(function (h) { return h[1](u); });
  }

  // One shared DOMPurify setup for every place member HTML is shown
  // (bios, Wall posts, comments, Dialogs, the Basic HTML guide's "Try it"),
  // installed the first time sanitize() runs.
  var hooksInstalled = false;
  function installHooks() {
    if (hooksInstalled || typeof DOMPurify === "undefined") return;
    hooksInstalled = true;
    DOMPurify.addHook("uponSanitizeElement", function (node, data) {
      if (data.tagName === "img" && !isTrustedImageSrc(node.getAttribute("src") || "")) {
        if (node.parentNode) node.parentNode.removeChild(node);
      }
    });
    DOMPurify.addHook("afterSanitizeAttributes", function (node) {
      if (node.tagName === "IMG") {
        node.setAttribute("loading", "lazy");
        node.setAttribute("decoding", "async");
        node.setAttribute("referrerpolicy", "no-referrer");
      }
    });
  }

  // Returns safe HTML for member-written text, or null if DOMPurify
  // isn't loaded (callers then fall back to plain text).
  function sanitize(raw) {
    if (typeof DOMPurify === "undefined") return null;
    installHooks();
    return DOMPurify.sanitize(raw || "", { ALLOWED_TAGS: ALLOWED_TAGS, ALLOWED_ATTR: ALLOWED_ATTR });
  }

  var hint = "You can use basic HTML: <b>, <i>, <u>, <a href=\"...\">, <br>, <p>, "
    + "<ul>/<ol>/<li>, <blockquote>, <img src=\"...\"> (from trusted image sites).";

  // The hint under every compose box (Chris, 2026-10-24): three
  // suggestions by default - bold, italics, a picture - and a "Basic HTML
  // Tag Key" button that swaps them for every allowed tag in a small
  // scrolling list. Each browser remembers which one it chose. A link to
  // the Basic HTML guide (basic-html.html) always ends the area.
  var SUGGESTIONS = [
    ["<b>bold</b>", "bold"],
    ["<i>italics</i>", "italics"],
    ["<img src=\"...\">", "a picture from a trusted image site"],
  ];
  var TAG_KEY = [
    ["<b>…</b>", "Bold"],
    ["<strong>…</strong>", "Strong (bold)"],
    ["<i>…</i>", "Italic"],
    ["<em>…</em>", "Emphasis (italic)"],
    ["<u>…</u>", "Underline"],
    ["<br>", "Line break"],
    ["<p>…</p>", "Paragraph"],
    ["<a href=\"https://…\">…</a>", "Link"],
    ["<ul><li>…</li></ul>", "Bulleted list"],
    ["<ol><li>…</li></ol>", "Numbered list"],
    ["<li>…</li>", "List item"],
    ["<blockquote>…</blockquote>", "Quotation"],
    ["<img src=\"https://…\" alt=\"…\">", "Picture (trusted image sites only)"],
  ];
  var KEY_PREF = "agoraHtmlTagKey";
  var hintEls = [];

  function showKey() {
    try { return localStorage.getItem(KEY_PREF) === "1"; } catch (e) { return false; }
  }

  // The site root, from wherever this page is (root, /Agora/ or
  // /Agora/profiles/).
  function siteRoot() {
    var p = window.location.pathname;
    return p.indexOf("/Agora/profiles/") !== -1 ? "../../" : (p.indexOf("/Agora/") !== -1 ? "../" : "");
  }

  function guideHref() {
    var p = window.location.pathname;
    var base = p.indexOf("/profiles/") !== -1 ? "../" : (p.indexOf("/Agora/") !== -1 ? "" : "Agora/");
    return base + "basic-html.html";
  }

  function code(text) {
    var c = document.createElement("code");
    c.textContent = text;
    return c;
  }

  function renderHint(el) {
    el.textContent = "";
    el.classList.add("html-hint");
    var full = showKey();

    if (full) {
      var title = document.createElement("span");
      title.className = "html-hint-title";
      title.textContent = "Basic HTML Tag Key";
      el.appendChild(title);
      var list = document.createElement("ul");
      list.className = "html-hint-key";
      TAG_KEY.forEach(function (row) {
        var li = document.createElement("li");
        li.appendChild(code(row[0]));
        li.appendChild(document.createTextNode(" – " + row[1]));
        list.appendChild(li);
      });
      el.appendChild(list);
    } else {
      el.appendChild(document.createTextNode("Try "));
      SUGGESTIONS.forEach(function (row, i) {
        if (i) el.appendChild(document.createTextNode(i === SUGGESTIONS.length - 1 ? " or " : ", "));
        el.appendChild(code(row[0]));
        el.appendChild(document.createTextNode(" for " + row[1]));
      });
      el.appendChild(document.createTextNode(". "));
    }

    var line = document.createElement("span");
    line.className = "html-hint-links";
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "html-hint-toggle";
    toggle.textContent = full ? "Show just 3 suggestions" : "Show the Basic HTML Tag Key";
    toggle.addEventListener("click", function () {
      try { localStorage.setItem(KEY_PREF, full ? "0" : "1"); } catch (e) {}
      hintEls.forEach(renderHint);
    });
    line.appendChild(toggle);
    line.appendChild(document.createTextNode(" · "));
    var link = document.createElement("a");
    link.href = guideHref();
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Basic HTML guide →";
    line.appendChild(link);
    el.appendChild(line);

    // Hashtags #️⃣ (Chris, 2026-10-24) - one line, linking to the
    // Knowledge Base 📚 article on how they work.
    var tagLine = document.createElement("p");
    tagLine.className = "html-hint-line html-hint-hashtags";
    tagLine.appendChild(document.createTextNode("We support "));
    var tagLink = document.createElement("a");
    tagLink.href = siteRoot() + "hashtags.html";
    tagLink.target = "_blank";
    tagLink.rel = "noopener";
    var strong = document.createElement("strong");
    strong.textContent = "hashtags!";
    tagLink.appendChild(strong);
    tagLine.appendChild(tagLink);
    tagLine.appendChild(document.createTextNode(" #️⃣"));
    el.appendChild(tagLine);
  }

  function attachHint(el) {
    if (!el) return;
    if (hintEls.indexOf(el) === -1) hintEls.push(el);
    renderHint(el);
  }

  global.AgoraBioTags = {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
    hint: hint,
    attachHint: attachHint,
    sanitize: sanitize,
    isTrustedImageSrc: isTrustedImageSrc,
    TRUSTED_IMAGE_HOSTS: TRUSTED_IMAGE_HOSTS.map(function (h) { return h[0]; })
  };
})(window);
