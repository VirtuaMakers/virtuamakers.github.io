// Hashtags #️⃣ (Chris, 2026-10-24/25; built by Communiqués 📨 Session 4,
// 2026-10-26) - one tag's Knowledge Base 📚 page: hashtag.html?tag=<tag>.
// The tag itself (count, members, spellings) is public; where it appears
// shows only to signed-in members, and a Dialog appearance says only
// "from a Dialog" - never who wrote it or what it said. Kept up to date
// by the server (Agora/functions/lib/hashtags.js).
(function () {
  var params = new URLSearchParams(window.location.search);
  var raw = (params.get("tag") || "").replace(/^#/, "").trim();
  var key = raw.normalize("NFC").toLowerCase();
  var titleEl = document.getElementById("tag-title");
  var kickerEl = document.getElementById("tag-kicker");
  var statsEl = document.getElementById("tag-stats");
  var defEl = document.getElementById("tag-definition");
  var listWrap = document.getElementById("tag-appearances-wrap");
  var PAGE = 100;

  function text(el, t) { el.textContent = t; }

  function when(ts) {
    if (!ts || !ts.toDate) return "";
    return ts.toDate().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  if (!key || key.length > 50 || /[\/#\s]/.test(key)) {
    text(titleEl, "Hashtags #️⃣");
    text(kickerEl, "No hashtag was given.");
    document.getElementById("tag-disclaimer").hidden = true;
    statsEl.hidden = true;
    defEl.hidden = true;
    listWrap.innerHTML = '<p class="tag-note">Read <a href="hashtags.html">how hashtags work</a>, or click any #tag on Agora 🌐.</p>';
    return;
  }

  text(titleEl, "#" + raw);
  document.title = "#" + raw + " · Hashtags #️⃣ · VirtuaMakers";
  if (typeof firebase === "undefined" || typeof AgoraDB === "undefined") {
    text(kickerEl, "Couldn't reach Agora 🌐 – try again in a moment.");
    return;
  }

  var tagRef = AgoraDB.collection("hashtags").doc(key);
  tagRef.get().then(function (doc) {
    if (!doc.exists) {
      text(kickerEl, "No one has used this hashtag yet – be the first, in a Wall post, comment or Dialog.");
      statsEl.hidden = true;
      return;
    }
    var d = doc.data();
    text(titleEl, "#" + (d.display || raw));
    document.title = "#" + (d.display || raw) + " · Hashtags #️⃣ · VirtuaMakers";
    text(kickerEl, "A community hashtag on Agora 🌐.");
    statsEl.innerHTML = "";
    [
      [String(d.count || 0), d.count === 1 ? " appearance" : " appearances"],
      [String(d.memberCount || 0), d.memberCount === 1 ? " member" : " members"],
      ["First used ", when(d.firstAt)],
    ].forEach(function (s) {
      var span = document.createElement("span");
      if (s[0] === "First used ") {
        if (!s[1]) return;
        span.appendChild(document.createTextNode(s[0]));
        var b = document.createElement("strong");
        b.textContent = s[1];
        span.appendChild(b);
      } else {
        var n = document.createElement("strong");
        n.textContent = s[0];
        span.appendChild(n);
        span.appendChild(document.createTextNode(s[1]));
      }
      statsEl.appendChild(span);
    });
    var others = Object.keys(d.spellings || {}).filter(function (sp) { return sp !== d.display; });
    if (others.length) {
      var also = document.createElement("span");
      also.textContent = "Also written " + others.map(function (sp) { return "#" + sp; }).join(", ");
      statsEl.appendChild(also);
    }
  }).catch(function () {
    text(kickerEl, "Couldn't load this hashtag – try again in a moment.");
  });

  // Definitions come in a later round (member-proposed, admin-approved).
  text(defEl, "No definition proposed yet.");

  function renderAppearances(user) {
    listWrap.innerHTML = "";
    var h = document.createElement("h2");
    h.textContent = "Where it appears";
    listWrap.appendChild(h);
    if (!user) {
      var p = document.createElement("p");
      p.className = "tag-note";
      p.textContent = "Sign in to Agora 🌐 to see every post, comment and Dialog where this hashtag appears.";
      listWrap.appendChild(p);
      return;
    }
    var loading = document.createElement("p");
    loading.className = "tag-note";
    loading.textContent = "Loading…";
    listWrap.appendChild(loading);
    tagRef.collection("appearances").orderBy("createdAt", "desc").limit(PAGE).get().then(function (snap) {
      loading.remove();
      if (snap.empty) {
        var none = document.createElement("p");
        none.className = "tag-note";
        none.textContent = "Nowhere yet.";
        listWrap.appendChild(none);
        return;
      }
      var ul = document.createElement("ul");
      ul.className = "tag-appearances";
      snap.docs.forEach(function (doc) {
        var a = doc.data();
        var li = document.createElement("li");
        var meta = document.createElement("span");
        meta.className = "tag-appearance-meta";
        var date = when(a.createdAt);
        if (a.kind === "dialog") {
          meta.textContent = "From a Dialog" + (date ? " · " + date : "");
          li.appendChild(meta);
        } else {
          var who = a.authorName || "A member";
          meta.textContent = (a.kind === "comment" ? "Comment by " : "Wall post by ") + who + (date ? " · " + date : "");
          li.appendChild(meta);
          var link = document.createElement("a");
          link.className = "tag-appearance-excerpt";
          link.href = "Agora/post.html?id=" + encodeURIComponent(a.postId || "");
          link.textContent = a.excerpt || "(open)";
          li.appendChild(link);
        }
        ul.appendChild(li);
      });
      listWrap.appendChild(ul);
      if (snap.size >= PAGE) {
        var more = document.createElement("p");
        more.className = "tag-note";
        more.textContent = "Showing the newest " + PAGE + ".";
        listWrap.appendChild(more);
      }
    }).catch(function () {
      loading.textContent = "Couldn't load where it appears – try again in a moment.";
    });
  }

  if (typeof agoraOnAuthChange === "function") agoraOnAuthChange(renderAppearances);
  else renderAppearances(null);
})();
