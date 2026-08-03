// Shared helpers for every Communiqués 📨 page (hub, thread, DM, and the
// Wall/Dialogs sections on member.html): display-name resolution, date
// formatting, the sign-in-modal shortcut, sanitized HTML rendering, and
// the 3-minute edit window every post/reply/comment/message shares.
// Requires firebase-config.js, auth.js, DOMPurify, and bio-tags.js to run
// first (DOMPurify/bio-tags are only needed for sanitizeBody).

(function (global) {
  var EDIT_WINDOW_MS = 3 * 60 * 1000;

  if (typeof DOMPurify !== "undefined") {
    DOMPurify.addHook("afterSanitizeAttributes", function (node) {
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function getDisplayName(user) {
    return AgoraDB.collection("profiles").doc(user.uid).get().then(function (doc) {
      if (!doc.exists) return user.displayName || "Member";
      var data = doc.data();
      return (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || user.displayName || "Member");
    });
  }

  function formatDate(timestamp, withTime) {
    if (!timestamp || !timestamp.toDate) return "";
    var opts = withTime
      ? { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
      : { year: "numeric", month: "short", day: "numeric" };
    return timestamp.toDate().toLocaleString(undefined, opts);
  }

  function openSignInModal() {
    var btn = document.getElementById("agora-signin-btn");
    if (btn) btn.click();
  }

  // A pending (not-yet-server-acknowledged) write has a null createdAt -
  // treat that as "just now" rather than "uneditable".
  function isWithinEditWindow(createdAt) {
    if (!createdAt || !createdAt.toDate) return true;
    return Date.now() - createdAt.toDate().getTime() < EDIT_WINDOW_MS;
  }

  function sanitizeBody(el, raw) {
    if (raw && typeof DOMPurify !== "undefined" && typeof AgoraBioTags !== "undefined") {
      el.innerHTML = DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: AgoraBioTags.ALLOWED_TAGS,
        ALLOWED_ATTR: AgoraBioTags.ALLOWED_ATTR,
      });
    } else {
      el.textContent = raw || "";
    }
  }

  // Appends an Edit toggle + inline textarea/Save/Cancel form to
  // `container` for a single-field (`body`-only) piece of Communiqués
  // content - a reply, a Wall comment, a DM message. Thread/Wall-post
  // editing (title + body) is handled separately since it has two
  // fields. `data` is the in-memory doc data, mutated on a successful save
  // so re-opening the editor shows the latest text.
  function attachInlineEdit(container, docRef, data, bodyEl) {
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "edit-toggle";
    toggle.textContent = "Edit";
    container.appendChild(toggle);

    var form = document.createElement("form");
    form.className = "edit-form";
    form.hidden = true;

    var textarea = document.createElement("textarea");
    textarea.maxLength = 9999;
    textarea.required = true;
    textarea.value = data.body || "";
    form.appendChild(textarea);

    var error = document.createElement("p");
    error.className = "form-error";
    error.hidden = true;
    form.appendChild(error);

    var actions = document.createElement("div");
    actions.className = "profile-form-actions";
    var saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Save";
    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn";
    cancelBtn.textContent = "Cancel";
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    form.appendChild(actions);

    container.appendChild(form);

    toggle.addEventListener("click", function () {
      form.hidden = false;
      toggle.hidden = true;
    });
    cancelBtn.addEventListener("click", function () {
      form.hidden = true;
      toggle.hidden = false;
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var newBody = textarea.value.trim();
      if (!newBody) return;
      docRef.update({ body: newBody }).then(function () {
        data.body = newBody;
        sanitizeBody(bodyEl, newBody);
        form.hidden = true;
        toggle.hidden = false;
      }).catch(function (err) {
        error.textContent = err.message;
        error.hidden = false;
      });
    });
  }

  global.CommuniquesCommon = {
    EDIT_WINDOW_MS: EDIT_WINDOW_MS,
    getDisplayName: getDisplayName,
    formatDate: formatDate,
    openSignInModal: openSignInModal,
    isWithinEditWindow: isWithinEditWindow,
    sanitizeBody: sanitizeBody,
    attachInlineEdit: attachInlineEdit,
  };
})(window);
