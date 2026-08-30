// Drives newsletter-compose.html: admin-only gate, loads/prefills the
// current newsletter/draft doc, saves edits back to it. sendMonthlyNewsletter
// (Cloud Function) reads this same doc on the 1st of the month - see
// functions/index.js.

(function () {
  var ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

  var signedOutNotice = document.getElementById("signed-out-notice");
  var notAdminNotice = document.getElementById("not-admin-notice");
  var composeWrap = document.getElementById("compose-wrap");
  var lastSentNotice = document.getElementById("last-sent-notice");
  var lastUpdatedNotice = document.getElementById("last-updated-notice");
  var form = document.getElementById("newsletter-form");
  var subjectInput = document.getElementById("field-subject");
  var bodyInput = document.getElementById("field-body");
  var errorEl = document.getElementById("form-error");
  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("form-submit");

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function formatTimestamp(ts) {
    if (!ts || !ts.toDate) return "";
    return ts.toDate().toLocaleString();
  }

  function loadDraft() {
    AgoraDB.collection("newsletter").doc("draft").get().then(function (doc) {
      if (!doc.exists) return;
      var data = doc.data();
      subjectInput.value = data.subject || "";
      bodyInput.value = data.bodyText || "";

      if (data.lastSentAt) {
        lastSentNotice.textContent = "Last sent: " + formatTimestamp(data.lastSentAt) + ".";
        lastSentNotice.hidden = false;
      }
      if (data.updatedAt) {
        lastUpdatedNotice.textContent = "Draft last saved: " + formatTimestamp(data.updatedAt)
          + (data.updatedBy ? " by " + data.updatedBy : "") + ".";
        lastUpdatedNotice.hidden = false;
      }
    }).catch(function () {});
  }

  // Owner-or-admin, matching firestore.rules' isFullAdmin() (the same
  // rule guarding newsletter/{document} itself) - moderators are
  // deliberately excluded, same as they can't suspend/delete accounts.
  // Checking only the hardcoded owner email here locked out every real
  // granted admin the multi-admin system was built to support.
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
      composeWrap.hidden = !isAdmin;

      if (isAdmin) loadDraft();
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    var subject = subjectInput.value.trim();
    var bodyText = bodyInput.value.trim();
    if (!subject || !bodyText) {
      showError("Please fill in both Subject and Body.");
      return;
    }

    submitBtn.disabled = true;
    statusEl.hidden = false;

    AgoraDB.collection("newsletter").doc("draft").set({
      subject: subject,
      bodyText: bodyText,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: firebase.auth().currentUser.email,
    }, { merge: true }).then(function () {
      statusEl.textContent = "Saved!";
      loadDraft();
    }).catch(function (err) {
      showError(err.message);
    }).finally(function () {
      submitBtn.disabled = false;
      setTimeout(function () { statusEl.hidden = true; statusEl.textContent = "Saving…"; }, 2000);
    });
  });
})();
