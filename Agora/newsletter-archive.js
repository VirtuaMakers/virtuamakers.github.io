// Drives newsletter-archive.html: lists every newsletterIssues doc
// (written by performNewsletterSend() in functions/index.js each time an
// issue actually sends), newest first. World-readable collection, no
// auth needed - this runs the moment AgoraDB exists, same as the static
// News list elsewhere.

(function () {
  var loadingEl = document.getElementById("archive-loading");
  var emptyEl = document.getElementById("archive-empty");
  var listEl = document.getElementById("archive-list");

  function formatDate(ts) {
    if (!ts || !ts.toDate) return "";
    return ts.toDate().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  // Sized to the email template's own max-width (560px content + 32px
  // padding either side, see functions/templates/newsletter-email.html)
  // plus a little slack, then auto-grown to the real rendered height once
  // the srcdoc content loads - email bodies vary in length issue to issue,
  // so a fixed height would either clip a long one or leave a short one
  // floating in empty space.
  function buildIssueCard(doc) {
    var data = doc.data();

    var card = document.createElement("div");
    card.className = "profile-panel";

    var meta = document.createElement("p");
    meta.className = "body-text";
    meta.textContent = "Sent " + formatDate(data.sentAt);
    card.appendChild(meta);

    var iframe = document.createElement("iframe");
    iframe.className = "newsletter-archive-frame";
    iframe.title = data.subject || "Agora Newsletter issue";
    iframe.setAttribute("srcdoc", data.html || "");
    card.appendChild(iframe);

    // Polls instead of relying on the iframe's own `load` event - `load`
    // only fires once every embedded resource has settled, including the
    // template's remote, hotlinked logo image, which could be slow or
    // temporarily unreachable and stall sizing indefinitely (confirmed by
    // testing: `load` can fail to fire at all while the image is stuck,
    // even though the document itself is already fully parsed and its
    // real height is already correct). The logo carries explicit
    // width/height attributes, so layout height is right as soon as the
    // srcdoc document finishes parsing, well before the image needs to
    // finish loading.
    var attempts = 0;
    var poll = setInterval(function () {
      attempts++;
      var doc2;
      try {
        doc2 = iframe.contentDocument;
      } catch (e) {
        doc2 = null;
      }
      if (doc2 && doc2.readyState !== "loading") {
        clearInterval(poll);
        iframe.style.height = doc2.documentElement.scrollHeight + "px";
      } else if (attempts > 100) {
        clearInterval(poll);
      }
    }, 50);

    return card;
  }

  AgoraDB.collection("newsletterIssues").orderBy("sentAt", "desc").get().then(function (snap) {
    loadingEl.hidden = true;
    if (snap.empty) {
      emptyEl.hidden = false;
      return;
    }
    snap.forEach(function (doc) {
      listEl.appendChild(buildIssueCard(doc));
    });
  }).catch(function (err) {
    loadingEl.hidden = true;
    emptyEl.hidden = false;
    emptyEl.textContent = "Couldn't load the archive: " + err.message;
  });
})();
