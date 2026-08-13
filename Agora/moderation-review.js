// Drives moderation-review.html: admin-only gate, lists the most recent
// moderationLog entries (written by moderateText/moderateImage in
// functions/index.js), and wires the Approve/Uphold buttons for blocked,
// unresolved entries to resolveModerationAppeal.

(function () {
  var ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

  var signedOutNotice = document.getElementById("signed-out-notice");
  var notAdminNotice = document.getElementById("not-admin-notice");
  var reviewWrap = document.getElementById("review-wrap");
  var loadingEl = document.getElementById("review-loading");
  var emptyEl = document.getElementById("review-empty");
  var listEl = document.getElementById("review-list");

  var CONTENT_TYPE_LABELS = {
    wallPost: "Wall post",
    wallComment: "Wall comment",
    dialogMessage: "Dialog message",
    profileBio: "Profile bio",
    profilePicture: "Profile picture",
  };

  function formatTimestamp(ts) {
    if (!ts || !ts.toDate) return "";
    return ts.toDate().toLocaleString();
  }

  function callFn(name, payload) {
    return firebase.functions().httpsCallable(name)(payload).then(function (r) { return r.data; });
  }

  function scoreSummary(scores) {
    if (!scores) return "";
    var parts = [];
    Object.keys(scores).forEach(function (key) {
      var value = scores[key];
      if (typeof value === "number") {
        parts.push(key + ": " + Math.round(value * 100) + "%");
      } else if (value) {
        parts.push(key + ": " + value);
      }
    });
    return parts.join(" · ");
  }

  function buildEntry(doc) {
    var log = doc.data();
    var item = document.createElement("div");
    item.className = "subsection profile-panel";

    var title = document.createElement("h2");
    title.className = "panel-title";
    title.textContent = (CONTENT_TYPE_LABELS[log.contentType] || log.contentType)
      + " — " + log.decision.toUpperCase();
    item.appendChild(title);

    var meta = document.createElement("p");
    meta.className = "communique-item-meta";
    meta.textContent = (log.authorName || "Someone") + " (uid: " + log.uid + ") · " + formatTimestamp(log.createdAt);
    item.appendChild(meta);

    if (log.text) {
      var body = document.createElement("p");
      body.className = "body-text";
      body.textContent = "“" + log.text + "”";
      item.appendChild(body);
    } else if (log.contentType === "profilePicture") {
      var imgWrap = document.createElement("div");
      var imgBtn = document.createElement("button");
      imgBtn.type = "button";
      imgBtn.className = "btn btn-sm";
      imgBtn.textContent = "Load image";
      if (!(log.context && log.context.quarantinePath)) {
        imgBtn.disabled = true;
        imgBtn.textContent = "No image stored (flagged, not blocked - it uploaded normally)";
      } else {
        imgBtn.addEventListener("click", function () {
          imgBtn.disabled = true;
          imgBtn.textContent = "Loading…";
          callFn("getModerationImageUrl", { logId: doc.id }).then(function (result) {
            var img = document.createElement("img");
            img.src = result.url;
            img.alt = "Quarantined picture";
            img.style.maxWidth = "240px";
            img.style.display = "block";
            img.style.marginTop = "8px";
            imgWrap.appendChild(img);
            imgBtn.hidden = true;
          }).catch(function (err) {
            imgBtn.disabled = false;
            imgBtn.textContent = "Failed to load - try again (" + err.message + ")";
          });
        });
      }
      imgWrap.appendChild(imgBtn);
      item.appendChild(imgWrap);
    }

    var scores = document.createElement("p");
    scores.className = "field-hint";
    scores.textContent = scoreSummary(log.scores);
    item.appendChild(scores);

    if (log.appealRequested) {
      var appealNote = document.createElement("p");
      appealNote.className = "form-status";
      appealNote.hidden = false;
      appealNote.textContent = "⚑ Member requested a review" + (log.appealRequestedAt
        ? " (" + formatTimestamp(log.appealRequestedAt) + ")" : "") + ".";
      item.appendChild(appealNote);
    }

    if (log.resolved) {
      var resolvedNote = document.createElement("p");
      resolvedNote.className = "form-status";
      resolvedNote.hidden = false;
      resolvedNote.textContent = "Resolved: " + log.resolution + " ("
        + formatTimestamp(log.resolvedAt) + ", by " + (log.resolvedBy || "admin") + ").";
      item.appendChild(resolvedNote);
    } else if (log.decision === "block") {
      var actions = document.createElement("div");
      actions.className = "profile-form-actions";

      var approveBtn = document.createElement("button");
      approveBtn.type = "button";
      approveBtn.className = "btn btn-primary";
      approveBtn.textContent = "Approve (re-publish)";

      var upholdBtn = document.createElement("button");
      upholdBtn.type = "button";
      upholdBtn.className = "btn";
      upholdBtn.textContent = "Uphold (leave blocked)";

      var status = document.createElement("span");
      status.className = "form-status";
      status.hidden = true;

      function resolve(approve) {
        approveBtn.disabled = true;
        upholdBtn.disabled = true;
        status.hidden = false;
        status.textContent = "Working…";
        callFn("resolveModerationAppeal", { logId: doc.id, approve: approve }).then(function () {
          status.textContent = approve ? "Approved and re-published." : "Upheld.";
          approveBtn.hidden = true;
          upholdBtn.hidden = true;
        }).catch(function (err) {
          approveBtn.disabled = false;
          upholdBtn.disabled = false;
          status.textContent = "Failed: " + err.message;
        });
      }

      approveBtn.addEventListener("click", function () {
        if (window.confirm("Re-publish this exactly as the member submitted it?")) resolve(true);
      });
      upholdBtn.addEventListener("click", function () { resolve(false); });

      actions.appendChild(approveBtn);
      actions.appendChild(upholdBtn);
      actions.appendChild(status);
      item.appendChild(actions);
    }

    return item;
  }

  function loadLog() {
    loadingEl.hidden = false;
    emptyEl.hidden = true;
    listEl.textContent = "";

    firebase.firestore().collection("moderationLog")
      .orderBy("createdAt", "desc").limit(50).get()
      .then(function (snap) {
        loadingEl.hidden = true;
        if (snap.empty) {
          emptyEl.hidden = false;
          return;
        }
        snap.docs.forEach(function (doc) {
          listEl.appendChild(buildEntry(doc));
        });
      })
      .catch(function (err) {
        loadingEl.hidden = true;
        emptyEl.hidden = false;
        emptyEl.textContent = "Couldn't load: " + err.message;
      });
  }

  agoraOnAuthChange(function (user) {
    var isAdmin = !!user && user.email === ADMIN_EMAIL;

    signedOutNotice.hidden = !!user;
    notAdminNotice.hidden = !user || isAdmin;
    reviewWrap.hidden = !isAdmin;

    if (isAdmin) loadLog();
  });
})();
