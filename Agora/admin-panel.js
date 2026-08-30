// Drives admin-panel.html: admin-only gate (same isFullAdmin() shape as
// newsletter-compose.js), plus the two dynamically-computed dates in the
// Schedule list. Static content otherwise - this is a written reminder,
// not a task tracker, so there's nothing to save/load from Firestore here.

(function () {
  var ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

  var signedOutNotice = document.getElementById("signed-out-notice");
  var notAdminNotice = document.getElementById("not-admin-notice");
  var panelWrap = document.getElementById("panel-wrap");
  var galleryNextEl = document.getElementById("gallery-next");
  var newsletterNextEl = document.getElementById("newsletter-next");

  function formatDate(d) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  // The monthly Gallery-winner cadence starts October 1, 2026 (Chris,
  // 2026-08-27) - August's rotation had just landed, so September is
  // deliberately skipped once, not a mistake to fix later. Every 1st
  // after that follows the normal "next 1st of the month" math.
  function galleryNextDue() {
    var floor = new Date(2026, 9, 1);
    var now = new Date();
    var nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextFirst > floor ? nextFirst : floor;
  }

  function newsletterNextDeadline() {
    var now = new Date();
    var day = now.getDate() > 27 ? new Date(now.getFullYear(), now.getMonth() + 1, 27)
      : new Date(now.getFullYear(), now.getMonth(), 27);
    return day;
  }

  galleryNextEl.textContent = "Next: " + formatDate(galleryNextDue()) + ".";
  newsletterNextEl.textContent = "Next: " + formatDate(newsletterNextDeadline()) + ".";

  // Owner-or-admin, matching firestore.rules' isFullAdmin() - moderators
  // are deliberately excluded, same gate as newsletter-compose.html.
  function isFullAdmin(user) {
    if (!user || !user.email) return Promise.resolve(false);
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return Promise.resolve(true);
    return AgoraDB.collection("admins").doc(user.uid).get().then(function (doc) {
      return doc.exists && doc.data().role === "admin";
    }).catch(function () {
      return false;
    });
  }

  agoraOnAuthChange(function (user) {
    isFullAdmin(user).then(function (isAdmin) {
      signedOutNotice.hidden = !!user;
      notAdminNotice.hidden = !user || isAdmin;
      panelWrap.hidden = !isAdmin;
    });
  });
})();
