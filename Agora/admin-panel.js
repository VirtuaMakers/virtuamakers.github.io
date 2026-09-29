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
  var rolesPanel = document.getElementById("roles-panel");
  var rolesAdminsEl = document.getElementById("roles-admins");
  var rolesModeratorsEl = document.getElementById("roles-moderators");
  var mailboxesPanel = document.getElementById("mailboxes-panel");
  var pageHitsPanel = document.getElementById("page-hits-panel");
  var pageHitsListEl = document.getElementById("page-hits-list");
  var mailboxForm = document.getElementById("mailbox-form");
  var mailboxSlug = document.getElementById("mailbox-slug");
  var mailboxName = document.getElementById("mailbox-name");
  var mailboxError = document.getElementById("mailbox-error");
  var mailboxSubmit = document.getElementById("mailbox-submit");
  var mailboxResult = document.getElementById("mailbox-result");
  var mailboxResultEmail = document.getElementById("mailbox-result-email");
  var mailboxResultToken = document.getElementById("mailbox-result-token");

  mailboxForm.addEventListener("submit", function (e) {
    e.preventDefault();
    mailboxError.hidden = true;
    mailboxSubmit.disabled = true;
    var slug = mailboxSlug.value.trim().toLowerCase();
    var name = mailboxName.value.trim();
    firebase.functions().httpsCallable("createReservedMailbox")({ slug: slug, name: name }).then(function (result) {
      mailboxResultEmail.textContent = result.data.email;
      mailboxResultToken.textContent = result.data.token;
      mailboxResult.hidden = false;
    }).catch(function (err) {
      mailboxError.textContent = err.message || "Something went wrong.";
      mailboxError.hidden = false;
    }).finally(function () {
      mailboxSubmit.disabled = false;
    });
  });

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

  function isOwner(user) {
    return !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  // Resolves a display name the same way every other Communiqués/profile
  // surface does (handle-preferred), without pulling in
  // communiques-common.js just for this one lookup.
  function displayNameFor(uid) {
    return AgoraDB.collection("profiles").doc(uid).get().then(function (doc) {
      if (!doc.exists) return "Member";
      var data = doc.data();
      return (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || "Member");
    }).catch(function () {
      return "Member";
    });
  }

  // Owner-only (firestore.rules only lets the owner list the whole
  // admins collection - a granted admin can read just their own doc) - a
  // read-only "who currently has a role" overview, since the actual
  // grant/revoke action already lives on each member's own profile page
  // and doesn't need duplicating here.
  function loadRoles() {
    AgoraDB.collection("admins").get().then(function (snap) {
      var admins = [];
      var moderators = [];
      var lookups = [];
      snap.forEach(function (doc) {
        var role = doc.data().role;
        if (role !== "admin" && role !== "moderator") return;
        lookups.push(displayNameFor(doc.id).then(function (name) {
          (role === "admin" ? admins : moderators).push(name);
        }));
      });
      return Promise.all(lookups).then(function () {
        rolesAdminsEl.textContent = admins.length ? admins.sort().join(", ") : "None";
        rolesModeratorsEl.textContent = moderators.length ? moderators.sort().join(", ") : "None";
      });
    }).catch(function () {
      rolesAdminsEl.textContent = "Couldn't load.";
      rolesModeratorsEl.textContent = "Couldn't load.";
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Undoes page-hits.js's own "/" -> "--" doc-ID sanitization, for a
  // readable label. "root-index" is that same script's special case for
  // the site root, since a bare "/" can't be a Firestore doc ID either.
  function labelForKey(key) {
    if (key === "root-index") return "/ (VirtuaMakers.com homepage)";
    return "/" + key.replace(/--/g, "/");
  }

  // Owner-only, same reasoning as Roles above - a page's own hit count
  // is otherwise only readable by opening the Firestore console
  // directly, so this is just a friendlier view onto the same data.
  // Merges the site-wide pageHits/{key} collection (page-hits.js, every
  // page except Agora's own homepage) with meta/hits (Agora's own
  // long-standing, separately-tracked counter - see hit-counter.js).
  function loadPageHits() {
    Promise.all([
      AgoraDB.collection("pageHits").get(),
      AgoraDB.collection("meta").doc("hits").get()
    ]).then(function (results) {
      var snap = results[0];
      var agoraHitsDoc = results[1];
      var rows = [];
      snap.forEach(function (doc) {
        var count = doc.data().count;
        if (typeof count === "number") rows.push({ label: labelForKey(doc.id), count: count });
      });
      if (agoraHitsDoc.exists && typeof agoraHitsDoc.data().count === "number") {
        rows.push({ label: "/Agora/ (own dedicated counter)", count: agoraHitsDoc.data().count });
      }
      rows.sort(function (a, b) { return b.count - a.count; });
      if (!rows.length) {
        pageHitsListEl.innerHTML = "<li>No hits recorded yet.</li>";
        return;
      }
      pageHitsListEl.innerHTML = rows.map(function (r) {
        return "<li>" + escapeHtml(r.label) + " &ndash; " + r.count + "</li>";
      }).join("");
    }).catch(function () {
      pageHitsListEl.innerHTML = "<li>Couldn't load.</li>";
    });
  }

  agoraOnAuthChange(function (user) {
    isFullAdmin(user).then(function (isAdmin) {
      signedOutNotice.hidden = !!user;
      notAdminNotice.hidden = !user || isAdmin;
      panelWrap.hidden = !isAdmin;

      var owner = isOwner(user);
      rolesPanel.hidden = !owner;
      mailboxesPanel.hidden = !owner;
      pageHitsPanel.hidden = !owner;
      if (owner) {
        loadRoles();
        loadPageHits();
      }
    });
  });
})();
