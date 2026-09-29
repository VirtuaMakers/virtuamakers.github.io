// Site-wide page-hit tabulation (Chris, 2026-09-29). One Firestore doc per
// page, keyed by that page's own pathname - counted once per browsing
// session, same dedup approach as the original Agora homepage counter
// (hit-counter.js, untouched by this file, keeps its own separate
// meta/hits doc so its real accumulated count isn't disturbed).
//
// Visible display is opt-in: a page only renders a number if it has a
// #hit-counter-digits element. Every other page just counts silently -
// "invisible tabulation," per Chris's own framing - readable directly
// from the Firestore console (or the Page Hits panel on admin-panel.html)
// but not rendered anywhere in that page's own UI.
//
// A page can set window.PageHitsSeed (a number) before this script loads
// to choose what its very first-ever hit should read as, matching
// meta/hits' own "starts at 100" convention - e.g. the homepage seeds at
// 500, a rough pre-tabulation estimate since GitHub Pages keeps no
// request logs we can read (see CLAUDE.md's Spider Style entry for the
// same "no logs available" limitation). Every other page defaults to 1.
(function () {
  if (typeof AgoraDB === "undefined") return;

  var path = window.location.pathname.replace(/\/+$/, "");
  if (path === "") path = "/";
  var key = path === "/"
    ? "root-index"
    : path.replace(/^\//, "").replace(/\//g, "--");
  if (!key) return;

  var digitsEl = document.getElementById("hit-counter-digits");
  var ref = AgoraDB.collection("pageHits").doc(key);
  var sessionFlag = "pageHitCounted:" + key;

  function render(count) {
    if (digitsEl) digitsEl.textContent = String(count).padStart(6, "0");
  }

  if (sessionStorage.getItem(sessionFlag)) {
    if (digitsEl) {
      ref.get().then(function (doc) {
        render(doc.exists ? doc.data().count : 0);
      }).catch(function () {
        digitsEl.textContent = "------";
      });
    }
    return;
  }

  AgoraDB.runTransaction(function (tx) {
    return tx.get(ref).then(function (doc) {
      var next = doc.exists ? doc.data().count + 1 : (window.PageHitsSeed || 1);
      tx.set(ref, { count: next });
      return next;
    });
  }).then(function (count) {
    sessionStorage.setItem(sessionFlag, "1");
    render(count);
  }).catch(function () {
    if (digitsEl) digitsEl.textContent = "------";
  });
})();
