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

  // Word-start matches rank above mid-word matches (e.g. "cl" surfaces
  // "Claude" before "Nicolas" even though neither contains "cl" at index 0
  // of the whole string) - split on spaces so e.g. "bruck" still finds
  // "Christopher Bruckmann" via its second word. Same algorithm as the
  // header search's scoreMatch() in site-search.js, kept as a separate
  // copy since site-search.js runs standalone (no firebase-config.js
  // dependency) and this one only ever scores real member names.
  function scoreNameMatch(name, q) {
    var words = name.toLowerCase().split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (words[i].indexOf(q) === 0) return i === 0 ? 0 : 1;
    }
    return name.toLowerCase().indexOf(q) !== -1 ? 2 : -1;
  }

  // Filters a loadMessagableMembers() list down to who's actually
  // messagable by the viewer right now (open, or friends with them if
  // they've opted into requireFriendToMessage) and matches the search
  // query - mirrors firestore.rules' canMessage() so the UI never offers
  // an add/message action that the rules would reject. Ranked the same
  // way as the header search (word-start match first) rather than left in
  // whatever order the caller's member list happened to be in.
  function filterMessagable(members, friendUids, excludeUids, query) {
    var q = query.trim().toLowerCase();
    var candidates = members.filter(function (m) {
      if (excludeUids.indexOf(m.uid) !== -1) return false;
      if (m.requireFriendToMessage && friendUids.indexOf(m.uid) === -1) return false;
      return true;
    });
    if (!q) return candidates;
    return candidates
      .map(function (m) { return { member: m, score: scoreNameMatch(m.name, q) }; })
      .filter(function (s) { return s.score !== -1; })
      .sort(function (a, b) { return a.score - b.score; })
      .map(function (s) { return s.member; });
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

  // View counts (Chris, 2026-08-13) - a simple, undeduped increment on
  // every render, same spirit as the homepage hit counter (see CLAUDE.md):
  // this is a directional "how much is this getting looked at" number,
  // not an anti-fraud metric. Fails silently so a permission hiccup never
  // breaks rendering.
  function recordView(docRef) {
    docRef.update({ viewCount: firebase.firestore.FieldValue.increment(1) }).catch(function () {});
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

  // Builds and wires an entire Wall section - the post composer plus a
  // paginated, newest-first list of posts, each with a togglable
  // Comment/Submit form - for a given profileUid. Shared by member.js
  // (real Firestore profiles) and static-profile-communiques.js (the 30
  // static profile-page slugs), which were otherwise carrying two copies
  // of the same non-trivial logic. `getCurrentUser` is a live getter
  // (not a captured value) since currentUser changes as the viewer signs
  // in or out over the page's life. Requires #wall-post-form and its
  // fields, #wall-list/#wall-loading/#wall-empty, and the
  // #wall-pagination-top/bottom rows to already exist in the DOM.
  function createWallController(profileUid, getCurrentUser) {
    var POSTS_PER_PAGE = 10;

    var wallList = document.getElementById("wall-list");
    var wallLoading = document.getElementById("wall-loading");
    var wallEmpty = document.getElementById("wall-empty");
    var pagBottom = document.getElementById("wall-pagination-bottom");
    var olderBottom = document.getElementById("wall-page-older-bottom");
    var newerBottom = document.getElementById("wall-page-newer-bottom");
    var indicatorBottom = document.getElementById("wall-page-indicator-bottom");

    var pages = [[]];
    var currentPageIndex = 0;

    function buildCommentItem(doc) {
      var data = doc.data();
      var currentUser = getCurrentUser();
      var item = document.createElement("div");
      item.className = "wall-comment";

      var meta = document.createElement("p");
      meta.className = "communique-item-meta";
      meta.textContent = (data.authorName || "Member") + " · " + formatDate(data.createdAt, true) +
        " · 👁 " + (typeof data.viewCount === "number" ? data.viewCount : 0);
      item.appendChild(meta);

      var body = document.createElement("p");
      body.className = "body-text communique-body";
      sanitizeBody(body, data.body);
      item.appendChild(body);

      if (currentUser && currentUser.uid === data.authorUid && isWithinEditWindow(data.createdAt)) {
        attachInlineEdit(item, doc.ref, data, body);
      }

      recordView(doc.ref);

      return item;
    }

    // A single button does double duty as the toggle and the submit
    // action: "Comment" opens the form (sliding it into view), and once
    // that animation finishes the same button relabels to "Submit" -
    // clicking it again posts the comment, then the form slides shut and
    // the button reverts to "Comment". Keeps the ✒️ Per Manum button and
    // the toggle/submit button on one shared action row instead of two.
    function buildCommentForm(postRef) {
      var form = document.createElement("form");
      form.className = "wall-comment-form";

      // The collapsible piece holds only the textarea/error - the actions
      // row (Per Manum + the toggle/submit button) lives OUTSIDE it and is
      // always rendered, so the very button that opens the form is never
      // itself trapped inside the collapsed (zero-height) region.
      var collapsible = document.createElement("div");
      collapsible.className = "wall-comment-collapsible";
      form.appendChild(collapsible);

      var inner = document.createElement("div");
      inner.className = "wall-comment-form-inner";
      collapsible.appendChild(inner);

      var textarea = document.createElement("textarea");
      textarea.maxLength = 9999;
      textarea.required = true;
      textarea.placeholder = "Comments may be up to 9,999 characters long!";
      inner.appendChild(textarea);

      var error = document.createElement("p");
      error.className = "form-error";
      error.hidden = true;
      inner.appendChild(error);

      var actions = document.createElement("div");
      actions.className = "profile-form-actions";
      form.appendChild(actions);

      var perManumBtn = document.createElement("button");
      perManumBtn.type = "button";
      perManumBtn.className = "btn btn-sm per-manum-btn";
      perManumBtn.title = "Insert a Per Manum Convention ✒️ credit line, if AI helped write this";
      perManumBtn.textContent = "✒️";
      actions.appendChild(perManumBtn);
      attachPerManumButton(perManumBtn, textarea);

      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "btn btn-sm";
      toggleBtn.textContent = "Comment";
      actions.appendChild(toggleBtn);

      var status = document.createElement("span");
      status.className = "form-status";
      status.textContent = "Posting…";
      status.hidden = true;
      actions.appendChild(status);

      var isOpen = false;

      function close() {
        isOpen = false;
        collapsible.classList.remove("open");
        toggleBtn.textContent = "Comment";
        toggleBtn.classList.remove("btn-primary");
        textarea.value = "";
      }

      function submitComment() {
        var currentUser = getCurrentUser();
        if (!currentUser) return;
        var body = textarea.value.trim();
        if (!body) return;
        error.hidden = true;
        toggleBtn.disabled = true;
        status.hidden = false;

        AgoraModeration.checkText(body, "wallComment", { postId: postRef.id }).then(function (result) {
          if (result.decision === "block") {
            toggleBtn.disabled = false;
            status.hidden = true;
            AgoraModeration.showBlocked(error, result.logId);
            return;
          }

          var now = firebase.firestore.FieldValue.serverTimestamp();
          getDisplayName(currentUser).then(function (authorName) {
            return postRef.collection("comments").add({
              body: body,
              authorUid: currentUser.uid,
              authorName: authorName,
              createdAt: now,
              viewCount: 0,
            });
          }).then(function () {
            return postRef.update({
              commentCount: firebase.firestore.FieldValue.increment(1),
              lastActivityAt: now,
            });
          }).then(function () {
            toggleBtn.disabled = false;
            status.hidden = true;
            close();
          }).catch(function (err) {
            toggleBtn.disabled = false;
            status.hidden = true;
            error.textContent = err.message;
            error.hidden = false;
          });
        });
      }

      toggleBtn.addEventListener("click", function () {
        if (!isOpen) {
          isOpen = true;
          collapsible.classList.add("open");
          textarea.focus();
          collapsible.addEventListener("transitionend", function onDone(e) {
            if (e.propertyName !== "grid-template-rows") return;
            collapsible.removeEventListener("transitionend", onDone);
            if (isOpen) {
              toggleBtn.textContent = "Submit";
              toggleBtn.classList.add("btn-primary");
            }
          });
        } else {
          submitComment();
        }
      });

      form.addEventListener("submit", function (e) { e.preventDefault(); });

      return form;
    }

    function buildWallPost(doc) {
      var data = doc.data();
      var currentUser = getCurrentUser();
      var post = document.createElement("div");
      post.className = "wall-post";

      var meta = document.createElement("p");
      meta.className = "communique-item-meta";
      meta.textContent = (data.authorName || "Member") + " · " + formatDate(data.createdAt, true) +
        " · 👁 " + (typeof data.viewCount === "number" ? data.viewCount : 0);
      post.appendChild(meta);

      var body = document.createElement("p");
      body.className = "body-text communique-body";
      sanitizeBody(body, data.body);
      post.appendChild(body);

      if (currentUser && currentUser.uid === data.authorUid && isWithinEditWindow(data.createdAt)) {
        attachInlineEdit(post, doc.ref, data, body);
      }

      recordView(doc.ref);

      var commentsWrap = document.createElement("div");
      commentsWrap.className = "wall-comments";
      post.appendChild(commentsWrap);

      doc.ref.collection("comments").orderBy("createdAt", "asc").get()
        .then(function (snap) {
          snap.docs.forEach(function (commentDoc) {
            commentsWrap.appendChild(buildCommentItem(commentDoc));
          });
        })
        .catch(function () {
          doc.ref.collection("comments").get().then(function (snap) {
            snap.docs.forEach(function (commentDoc) {
              commentsWrap.appendChild(buildCommentItem(commentDoc));
            });
          });
        });

      // Capped at 100 comments per post (Chris, 2026-08-15) - enforced
      // server-side in firestore.rules; this just hides the form and
      // explains why once a post's own counter reaches the cap, rather
      // than letting someone type a comment only to have the write
      // rejected.
      var commentCount = typeof data.commentCount === "number" ? data.commentCount : 0;
      if (commentCount >= 100) {
        var capNotice = document.createElement("p");
        capNotice.className = "communique-item-meta";
        capNotice.textContent = "This post has reached its maximum of 100 comments.";
        post.appendChild(capNotice);
      } else if (currentUser) {
        // Comments are optional, so the form stays tucked behind the
        // toggle/submit button instead of sitting open under every post.
        post.appendChild(buildCommentForm(doc.ref));
      }

      return post;
    }

    function renderPage(index) {
      currentPageIndex = Math.max(0, Math.min(index, pages.length - 1));

      wallList.textContent = "";
      pages[currentPageIndex].forEach(function (doc) {
        wallList.appendChild(buildWallPost(doc));
      });

      var multiPage = pages.length > 1;
      pagBottom.hidden = !multiPage;
      if (multiPage) {
        indicatorBottom.textContent = "Page " + (currentPageIndex + 1) + " of " + pages.length;
        newerBottom.disabled = currentPageIndex === 0;
        olderBottom.disabled = currentPageIndex === pages.length - 1;
      }
    }

    olderBottom.addEventListener("click", function () { renderPage(currentPageIndex + 1); });
    newerBottom.addEventListener("click", function () { renderPage(currentPageIndex - 1); });

    function renderWall(docs) {
      wallLoading.hidden = true;
      docs = docs.slice().sort(function (a, b) {
        var aTime = a.data().createdAt ? a.data().createdAt.toMillis() : 0;
        var bTime = b.data().createdAt ? b.data().createdAt.toMillis() : 0;
        return bTime - aTime;
      });
      if (!docs.length) {
        wallEmpty.hidden = false;
        wallList.textContent = "";
        pagBottom.hidden = true;
        return;
      }
      wallEmpty.hidden = true;
      pages = [];
      for (var i = 0; i < docs.length; i += POSTS_PER_PAGE) {
        pages.push(docs.slice(i, i + POSTS_PER_PAGE));
      }
      renderPage(0);
    }

    function loadWall() {
      wallLoading.hidden = false;
      wallEmpty.hidden = true;
      wallList.textContent = "";

      AgoraDB.collection("wallPosts").where("profileUid", "==", profileUid)
        .orderBy("createdAt", "desc").get()
        .then(function (snap) { renderWall(snap.docs); })
        .catch(function () {
          AgoraDB.collection("wallPosts").where("profileUid", "==", profileUid).get()
            .then(function (snap) { renderWall(snap.docs); });
        });
    }

    var postForm = document.getElementById("wall-post-form");
    var postError = document.getElementById("wall-post-error");
    var postStatus = document.getElementById("wall-post-status");
    var postSubmit = document.getElementById("wall-post-submit");
    var postBody = document.getElementById("wall-post-body");

    attachPerManumButton(document.getElementById("wall-post-per-manum"), postBody);

    postForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var currentUser = getCurrentUser();
      if (!currentUser) return;
      postError.hidden = true;

      var body = postBody.value.trim();
      if (!body) return;

      postSubmit.disabled = true;
      postStatus.hidden = false;

      AgoraModeration.checkText(body, "wallPost", { profileUid: profileUid }).then(function (result) {
        if (result.decision === "block") {
          postSubmit.disabled = false;
          postStatus.hidden = true;
          AgoraModeration.showBlocked(postError, result.logId);
          return;
        }

        var now = firebase.firestore.FieldValue.serverTimestamp();
        getDisplayName(currentUser).then(function (authorName) {
          return AgoraDB.collection("wallPosts").add({
            profileUid: profileUid,
            body: body,
            authorUid: currentUser.uid,
            authorName: authorName,
            createdAt: now,
            lastActivityAt: now,
            commentCount: 0,
            viewCount: 0,
          });
        }).then(function () {
          postBody.value = "";
          postSubmit.disabled = false;
          postStatus.hidden = true;
          loadWall();
        }).catch(function (err) {
          postSubmit.disabled = false;
          postStatus.hidden = true;
          postError.textContent = err.message;
          postError.hidden = false;
        });
      });
    });

    return { loadWall: loadWall };
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
    recordView: recordView,
    sanitizeBody: sanitizeBody,
    attachInlineEdit: attachInlineEdit,
    attachPerManumButton: attachPerManumButton,
    createWallController: createWallController,
  };
})(window);
