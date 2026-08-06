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

  // Builds a display label for everyone in a Dialog besides the current
  // viewer - "Alice" for a 1:1, "Alice, Bob, Carol +12 more" once a Dialog
  // has grown into a group. maxNames caps how many names are spelled out
  // before the rest collapse into a count.
  function otherParticipantsLabel(participants, participantNames, currentUid, maxNames) {
    maxNames = maxNames || 3;
    var names = (participants || [])
      .filter(function (uid) { return uid !== currentUid; })
      .map(function (uid) { return (participantNames && participantNames[uid]) || "Member"; });
    if (!names.length) return "Member";
    if (names.length <= maxNames) return names.join(", ");
    return names.slice(0, maxNames).join(", ") + " +" + (names.length - maxNames) + " more";
  }

  function conversationIdFor(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  // Creates (or finds) the Dialog between currentUser and otherUid, and
  // resolves to its conversationId - shared by every "start messaging
  // someone" entry point (a profile's Message button, the hub's New
  // Message search) so the sorted-uid-pair doc ID and participant-doc
  // shape only live in one place.
  function startOrOpenDialog(currentUser, otherUid, otherName) {
    var conversationId = conversationIdFor(currentUser.uid, otherUid);
    var ref = AgoraDB.collection("conversations").doc(conversationId);
    return ref.get().then(function (doc) {
      if (doc.exists) return conversationId;
      return getDisplayName(currentUser).then(function (myName) {
        var participantNames = {};
        participantNames[currentUser.uid] = myName;
        participantNames[otherUid] = otherName;
        var now = firebase.firestore.FieldValue.serverTimestamp();
        return ref.set({
          participants: [currentUser.uid, otherUid].sort(),
          participantNames: participantNames,
          lastMessage: "",
          lastMessageAt: now,
          createdAt: now,
        });
      }).then(function () { return conversationId; });
    });
  }

  // profiles/{uid} is world-readable, so this doubles as the "who can I
  // message" directory - a plain fetch-all is fine at Agora's current
  // size, not meant to scale indefinitely (a real member search/index
  // would replace this once the member base grows). Excludes the caller.
  function loadMessagableMembers(excludeUid) {
    return AgoraDB.collection("profiles").get().then(function (snap) {
      return snap.docs
        .filter(function (doc) { return doc.id !== excludeUid; })
        .map(function (doc) {
          var data = doc.data();
          var name = (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || "Member");
          return { uid: doc.id, name: name, requireFriendToMessage: !!data.requireFriendToMessage };
        });
    });
  }

  // Filters a loadMessagableMembers() list down to who's actually
  // messagable by the viewer right now (open, or friends with them if
  // they've opted into requireFriendToMessage) and matches the search
  // query - mirrors firestore.rules' canMessage() so the UI never offers
  // an add/message action that the rules would reject.
  function filterMessagable(members, friendUids, excludeUids, query) {
    var q = query.trim().toLowerCase();
    var candidates = members.filter(function (m) {
      if (excludeUids.indexOf(m.uid) !== -1) return false;
      if (m.requireFriendToMessage && friendUids.indexOf(m.uid) === -1) return false;
      return true;
    });
    return q ? candidates.filter(function (m) { return m.name.toLowerCase().indexOf(q) !== -1; }) : candidates;
  }

  // Fetches uid's accepted friendships (raw docs). Handles the "composite
  // index not provisioned yet" case by re-fetching unfiltered and
  // filtering client-side - the same fallback used everywhere else in
  // Communiqués that queries friendships by status.
  function fetchAcceptedFriendships(uid) {
    return AgoraDB.collection("friendships")
      .where("participants", "array-contains", uid)
      .where("status", "==", "accepted")
      .get()
      .catch(function () {
        return AgoraDB.collection("friendships")
          .where("participants", "array-contains", uid)
          .get()
          .then(function (snap) {
            return { docs: snap.docs.filter(function (doc) { return doc.data().status === "accepted"; }) };
          });
      });
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

  // Wires an icon-only "✒️" button to append a per-manum credit line to a
  // compose textarea, so a writer can flag AI-assisted authorship (per the
  // Per Manum Convention ✒️) with one click instead of having to remember
  // the convention exists and type it themselves. Appends on a blank line
  // after any existing text, then selects the "[Add Name of Writer]"
  // placeholder so typing the writing hand's name immediately replaces it.
  function attachPerManumButton(button, textarea) {
    if (!button || !textarea) return;
    button.addEventListener("click", function () {
      var existing = textarea.value.replace(/\s+$/, "");
      var placeholder = "[Add Name of Writer]";
      var credit = "Per Manum ✒️ " + placeholder;
      var insertedAt = (existing ? existing + "\n\n" : "").length;
      textarea.value = (existing ? existing + "\n\n" : "") + credit;
      textarea.focus();
      textarea.setSelectionRange(insertedAt + credit.length - placeholder.length, insertedAt + credit.length);
    });
  }

  global.CommuniquesCommon = {
    EDIT_WINDOW_MS: EDIT_WINDOW_MS,
    getDisplayName: getDisplayName,
    formatDate: formatDate,
    openSignInModal: openSignInModal,
    otherParticipantsLabel: otherParticipantsLabel,
    conversationIdFor: conversationIdFor,
    startOrOpenDialog: startOrOpenDialog,
    loadMessagableMembers: loadMessagableMembers,
    filterMessagable: filterMessagable,
    fetchAcceptedFriendships: fetchAcceptedFriendships,
    isWithinEditWindow: isWithinEditWindow,
    sanitizeBody: sanitizeBody,
    attachInlineEdit: attachInlineEdit,
    attachPerManumButton: attachPerManumButton,
  };
})(window);
