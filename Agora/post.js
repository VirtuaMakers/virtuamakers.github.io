// Drives post.html?id=<postId>[&page=N]: one Wall post with all of its
// comments, oldest first, CommuniquesCommon.COMMENTS_PER_PAGE (100) to a
// page, for at most 100 pages (Chris, 2026-10-13: "maybe it loads the
// (Wall) Post in its own page and the comments carry on as needed, up to
// 100 a page for a total possible 100 pages. The last page explains that
// they've hit the limit."). Walls themselves show only each post's newest
// few comments and link here with "View all N comments →".
//
// Pages are fetched with Firestore cursors (startAfter the previous page's
// last comment), so reading page 1 costs at most 100 reads, not 10,000.
// Wall posts and comments are readable by signed-in members only (see
// firestore.rules), so a signed-out visitor is asked to sign in.
// Requires firebase-config.js, auth.js and communiques-common.js first.

(function () {
  var C = CommuniquesCommon;
  var PER_PAGE = C.COMMENTS_PER_PAGE;
  var params = new URLSearchParams(window.location.search);
  var postId = params.get("id");
  var requestedPage = Math.max(1, parseInt(params.get("page"), 10) || 1);

  var notice = document.getElementById("post-notice");
  var content = document.getElementById("post-content");
  var heading = document.getElementById("post-heading");
  var backLink = document.getElementById("post-back-link");
  var postItem = document.getElementById("post-item");
  var commentsTitle = document.getElementById("post-comments-title");
  var commentsList = document.getElementById("post-comments");
  var commentsEmpty = document.getElementById("post-comments-empty");
  var capNotice = document.getElementById("post-cap-notice");
  var formSlot = document.getElementById("post-comment-form-slot");

  var currentUser = null;
  var postRef = null;
  var commentCount = 0;
  var currentPage = 1;
  // pageEnds[n] = last comment doc on page n (1-based), the cursor for n+1.
  var pageEnds = {};
  var loadToken = 0;

  function getCurrentUser() { return currentUser; }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    content.hidden = true;
  }

  function totalPages() {
    return Math.max(1, Math.ceil(commentCount / PER_PAGE));
  }

  function commentsQuery() {
    return postRef.collection("comments").orderBy("createdAt", "asc");
  }

  // Walks forward from the last page whose end is already known, so a deep
  // link like ?page=7 still works; ordinary Earlier/Later clicks only ever
  // need the page right next to one already loaded.
  function fetchPage(n) {
    if (n === 1) return commentsQuery().limit(PER_PAGE).get();
    if (pageEnds[n - 1]) return commentsQuery().startAfter(pageEnds[n - 1]).limit(PER_PAGE).get();
    return fetchPage(n - 1).then(function (snap) {
      if (!snap.docs.length) return snap;
      pageEnds[n - 1] = snap.docs[snap.docs.length - 1];
      return commentsQuery().startAfter(pageEnds[n - 1]).limit(PER_PAGE).get();
    });
  }

  function setPagination(suffix, pages) {
    var row = document.getElementById("post-pagination-" + suffix);
    row.hidden = pages <= 1;
    document.getElementById("post-page-indicator-" + suffix).textContent = "Page " + currentPage + " of " + pages;
    document.getElementById("post-page-prev-" + suffix).disabled = currentPage <= 1;
    document.getElementById("post-page-next-" + suffix).disabled = currentPage >= pages;
  }

  function loadPage(n) {
    var pages = totalPages();
    currentPage = Math.max(1, Math.min(n, pages));
    var token = ++loadToken;
    commentsList.textContent = "Loading comments…";
    commentsEmpty.hidden = true;
    setPagination("top", pages);
    setPagination("bottom", pages);

    var url = new URL(window.location.href);
    if (currentPage > 1) url.searchParams.set("page", String(currentPage));
    else url.searchParams.delete("page");
    history.replaceState(null, "", url.toString());

    fetchPage(currentPage).then(function (snap) {
      if (token !== loadToken) return;
      commentsList.textContent = "";
      if (snap.docs.length) pageEnds[currentPage] = snap.docs[snap.docs.length - 1];
      snap.docs.forEach(function (doc) {
        commentsList.appendChild(C.buildCommentItem(doc, getCurrentUser));
      });
      commentsEmpty.hidden = snap.docs.length > 0;

      // The last page says so plainly once a post is full.
      var full = commentCount >= C.COMMENT_CAP;
      capNotice.hidden = !(full && currentPage === pages);
      capNotice.textContent = C.COMMENT_CAP_NOTICE;
    }).catch(function (err) {
      if (token !== loadToken) return;
      commentsList.textContent = (err && err.message) || "Couldn't load these comments.";
    });
  }

  ["top", "bottom"].forEach(function (suffix) {
    document.getElementById("post-page-prev-" + suffix).addEventListener("click", function () {
      loadPage(currentPage - 1);
      if (suffix === "bottom") commentsTitle.scrollIntoView();
    });
    document.getElementById("post-page-next-" + suffix).addEventListener("click", function () {
      loadPage(currentPage + 1);
      if (suffix === "bottom") commentsTitle.scrollIntoView();
    });
  });

  function updateTitle() {
    commentsTitle.textContent = commentCount === 1 ? "1 comment" : commentCount.toLocaleString() + " comments";
  }

  // Where "← Back to the Wall" goes: a real member's profile, a product
  // page (Wall uid "product-<slug>" → /<slug>-product.html), or one of the
  // static /profiles/<slug>.html pages.
  function wireOwner(profileUid) {
    if (!profileUid) return;
    if (profileUid.indexOf("product-") === 0) {
      backLink.href = "../" + profileUid.slice("product-".length) + "-product.html";
      heading.textContent = "Post on a product page";
      return;
    }
    AgoraDB.collection("profiles").doc(profileUid).get().then(function (doc) {
      if (doc.exists) {
        var d = doc.data();
        var name = (d.preferHandle && d.handle) ? d.handle : (d.name || d.handle || "Member");
        backLink.href = "member.html?uid=" + encodeURIComponent(profileUid);
        backLink.textContent = "← Back to " + name + "'s Wall";
        heading.textContent = "Post on " + name + "'s Wall";
      } else {
        backLink.href = "profiles/" + encodeURIComponent(profileUid) + ".html";
      }
    }).catch(function () {});
  }

  function renderPost(doc) {
    var data = doc.data();
    postItem.textContent = "";

    var meta = document.createElement("p");
    meta.className = "communique-item-meta";
    var author = document.createElement("a");
    author.href = "member.html?uid=" + encodeURIComponent(data.authorUid);
    author.textContent = data.authorName || "Member";
    meta.appendChild(author);
    meta.appendChild(document.createTextNode(" · " + C.formatDate(data.createdAt, true) +
      " · 👁 " + (typeof data.viewCount === "number" ? data.viewCount : 0)));
    postItem.appendChild(meta);
    C.tagIfDeletedProfile(author, data.authorUid);

    var body = document.createElement("p");
    body.className = "body-text communique-body";
    C.sanitizeBody(body, data.body);
    postItem.appendChild(body);

    C.recordView(doc.ref);
  }

  function renderForm() {
    formSlot.textContent = "";
    if (commentCount >= C.COMMENT_CAP) return;
    formSlot.appendChild(C.buildCommentForm(postRef, getCurrentUser, function () {
      // A new comment always lands at the very end - go there to show it.
      commentCount++;
      updateTitle();
      loadPage(totalPages());
      if (commentCount >= C.COMMENT_CAP) renderForm();
    }));
  }

  if (!postId) {
    showNotice("No post was specified.");
    return;
  }

  var started = false;
  agoraOnAuthChange(function (user) {
    currentUser = user;
    if (!user) {
      showNotice("Sign in to read this post and its comments – Communiqués 📨 are for Agora 🌐 members.");
      return;
    }
    if (started) return;
    started = true;
    notice.hidden = true;

    postRef = AgoraDB.collection("wallPosts").doc(postId);
    postRef.get().then(function (doc) {
      if (!doc.exists) {
        showNotice("This post doesn't exist – it may have been deleted.");
        return;
      }
      content.hidden = false;
      var data = doc.data();
      commentCount = typeof data.commentCount === "number" ? data.commentCount : 0;
      wireOwner(data.profileUid);
      renderPost(doc);
      updateTitle();
      renderForm();
      loadPage(requestedPage);
    }).catch(function (err) {
      showNotice((err && err.message) || "Couldn't load this post.");
    });
  });
})();
