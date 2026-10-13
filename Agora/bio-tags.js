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
  // itself plus nine trusted image hosts - big, moderated sites that don't
  // track viewers, so a picture can't be used to spy on readers or slip
  // past moderation. Anything else is removed when the text is shown.
  // Agora will host more of members' own pictures later; this list can
  // grow too. Each entry: [name shown in the guide, test on the URL].
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
    ["GIPHY GIFs (media.giphy.com, i.giphy.com)", function (u) { return /^(media\d?|i)\.giphy\.com$/.test(u.hostname); }],
    ["Tenor GIFs (media.tenor.com)", function (u) { return u.hostname === "media.tenor.com"; }],
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

  // Fills a hint element with the text above plus a link to the Basic
  // HTML guide (basic-html.html, Chris, 2026-10-13), which lists every
  // tag, what it does and how to write it. Works from any page depth.
  function attachHint(el) {
    if (!el) return;
    var p = window.location.pathname;
    var base = p.indexOf("/profiles/") !== -1 ? "../" : (p.indexOf("/Agora/") !== -1 ? "" : "Agora/");
    el.textContent = hint + " ";
    var link = document.createElement("a");
    link.href = base + "basic-html.html";
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "See the Basic HTML guide →";
    el.appendChild(link);
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
