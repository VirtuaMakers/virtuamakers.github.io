// Cycles the writing-hand emoji on the Sign Up / Sign In control through
// its 6 official skin-tone variants plus one custom "AI" stop (there's no
// real Unicode tone for that - it reuses the base glyph, recolored via a
// CSS filter), advancing one step further each time a page loads. A
// per-browser localStorage counter, not a synced/global count - same
// "good enough for now" simplicity as the site's other little effects.
(function () {
  var spans = document.querySelectorAll(".signin-emoji");
  if (!spans.length) return;

  var STOPS = [
    "✍️",       // ✍️ default (yellow)
    "✍🏻", // ✍🏻 light
    "✍🏼", // ✍🏼 medium-light
    "✍🏽", // ✍🏽 medium
    "✍🏾", // ✍🏾 medium-dark
    "✍🏿", // ✍🏿 dark
    "✍️"        // AI stop - base glyph, grayed out via .signin-emoji--ai
  ];
  var AI_INDEX = STOPS.length - 1;
  var STORAGE_KEY = "agoraSigninEmojiCycle";

  var index = parseInt(localStorage.getItem(STORAGE_KEY), 10);
  if (isNaN(index)) index = -1;
  index = (index + 1) % STOPS.length;
  localStorage.setItem(STORAGE_KEY, String(index));

  for (var i = 0; i < spans.length; i++) {
    spans[i].textContent = STOPS[index];
    spans[i].classList.toggle("signin-emoji--ai", index === AI_INDEX);
  }
})();
