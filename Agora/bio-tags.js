// The current allowlist of HTML tags/attributes permitted in a member's
// Bio. Sanitization happens at render time (member.js), not at save time,
// so expanding this list later makes every existing bio light up with the
// newly-allowed tag automatically - nobody has to re-save anything. Meant
// to grow every month or two as a small, deliberate "here's what's new"
// event for the community, not all at once.

(function (global) {
  var ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "br", "p", "a", "ul", "ol", "li", "blockquote"];
  var ALLOWED_ATTR = ["href"];

  var hint = "You can use basic HTML: <b>, <i>, <u>, <a href=\"...\">, <br>, <p>, "
    + "<ul>/<ol>/<li>, <blockquote>.";

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
    attachHint: attachHint
  };
})(window);
