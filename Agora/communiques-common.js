// Shared helpers for every Communiqués 📨 page (hub, DM, and the
// Wall/Dialogs sections on member.html): display-name resolution, date
// formatting, the sign-in-modal shortcut, sanitized HTML rendering, and
// the 10-minute edit/delete window every post/comment/message shares.
// Requires firebase-config.js, auth.js, DOMPurify, and bio-tags.js to run
// first (DOMPurify/bio-tags are only needed for sanitizeBody).

(function (global) {
  var EDIT_WINDOW_MS = 10 * 60 * 1000;

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

  // Appends an Edit toggle, a Delete button, and an inline
  // textarea/Save/Cancel form to `container` for a single-field
  // (`body`-only) piece of Communiqués content - a Wall post, a Wall
  // comment, a Dialog message. `data` is the in-memory doc data, mutated
  // on a successful save so re-opening the editor shows the latest text.
  // Both Edit and Delete are only offered within the 10-minute window
  // (callers gate attachInlineEdit itself on isWithinEditWindow), matching
  // Chris's rule that content is otherwise permanent.
  function attachInlineEdit(container, docRef, data, bodyEl) {
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "edit-toggle";
    toggle.textContent = "Edit";
    container.appendChild(toggle);

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "edit-toggle delete-toggle";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      if (!window.confirm("Delete this permanently? This can't be undone.")) return;
      docRef.delete().then(function () {
        container.remove();
      }).catch(function (err) {
        window.alert(err.message);
      });
    });
    container.appendChild(deleteBtn);

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

  // Wires a "✒️ Per Manum" button to append a per-manum credit line to a
  // compose textarea, so a writer can flag AI-assisted authorship (per the
  // Per Manum Convention ✒️) with one click instead of having to remember
  // the convention exists and type it themselves. Appends on a blank line
  // after any existing text, then focuses the textarea with the cursor
  // right after the mark so the writer can type the writing hand's name.
  function attachPerManumButton(button, textarea) {
    if (!button || !textarea) return;
    button.addEventListener("click", function () {
      var existing = textarea.value.replace(/\s+$/, "");
      var credit = "per manum ✒️ ";
      textarea.value = (existing ? existing + "\n\n" : "") + credit;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
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
    attachPerManumButton: attachPerManumButton,
  };
})(window);
