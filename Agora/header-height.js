// Keeps --header-height (used by .section/#pillars's scroll-margin-top in
// style.css) in sync with the sticky .site-header's *actual* current
// height, instead of a hand-measured pixel guess baked into the
// stylesheet - every past round of header edits (a new header-right item,
// a name-length edge case forcing a wrap, a breakpoint change) quietly
// invalidated whatever constant was last measured, so anchor links landed
// a little further off the sticky header each time. This makes that
// self-correcting: any future header change just changes the number this
// script reads, not a constant someone has to remember to re-tune.
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;

  function updateHeaderHeight() {
    document.documentElement.style.setProperty(
      "--header-height",
      header.getBoundingClientRect().height + "px"
    );
  }

  updateHeaderHeight();
  window.addEventListener("resize", updateHeaderHeight);
  if (window.ResizeObserver) {
    new ResizeObserver(updateHeaderHeight).observe(header);
  }

  // A fresh page load straight to a #hash URL (e.g. clicking "News 📰"
  // from another page) scrolls via the browser's own native fragment
  // handling, which can run before this script's first measurement lands
  // - re-snap to the real target position once --header-height is known,
  // so that first landing is never left resting on the stale CSS fallback.
  if (window.location.hash) {
    var target = document.querySelector(window.location.hash);
    if (target) {
      requestAnimationFrame(function () {
        target.scrollIntoView({ block: "start" });
      });
    }
  }
})();
