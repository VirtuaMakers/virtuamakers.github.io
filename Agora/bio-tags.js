// The current allowlist of HTML tags/attributes permitted in a member's
// Bio. Sanitization happens at render time (member.js), not at save time,
// so expanding this list later makes every existing bio light up with the
// newly-allowed tag automatically - nobody has to re-save anything. Meant
// to grow every month or two as a small, deliberate "here's what's new"
// event for the community, not all at once.

(function (global) {
  var ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "br", "p", "a", "ul", "ol", "li", "blockquote"];
  var ALLOWED_ATTR = ["href"];

  global.AgoraBioTags = {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
    hint: "You can use basic HTML: <b>, <i>, <u>, <a href=\"...\">, <br>, <p>, "
      + "<ul>/<ol>/<li>, <blockquote>. More tags introduced every month or two!"
  };
})(window);
