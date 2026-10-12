// Friends List 📨 (Chris, 2026-10-13) - an AIM-style buddy list opened
// by the header's own "Communiqués 📨" button, in place of that button
// always navigating to communiques.html. Chris's framing: show who's
// online now vs. last seen, scoped to a member's own Agora 🌐 friends
// ("this kind of encourages people to keep their friends on Agora 🌐"),
// plus "some semblance of all the different LLMs of the world" - the
// SI Members 🤖 roster from the Agora homepage, as its own group.
// Clicking anyone opens a floating Dialog window (im-window.js) right
// where you are. Requires firebase-config.js, auth.js,
// communiques-common.js and im-window.js to run first.
//
// Presence: nothing in Agora tracked "online" before this. Every page
// carrying this script now writes presence/{uid}.lastActive (server
// time) once a minute while the tab is visible; "online" means a write
// in the last 3 minutes. A member can choose "Appear offline", which
// stops the heartbeat and shows them as plain "Offline" (no last-seen
// time) to friends. Only accepted friends can read a member's presence
// doc (firestore.rules, presence/{uid}).
//
// The open/minimized state survives page navigation the same way the
// Dialog windows do (sessionStorage, one tab's lifetime).

(function () {
  if (typeof CommuniquesCommon === "undefined" || typeof AgoraDB === "undefined") return;
  var C = CommuniquesCommon;

  var HEARTBEAT_MS = 60 * 1000;
  var ONLINE_MS = 3 * 60 * 1000;
  var STATE_KEY = "agoraFriendsList";
  var LAST_WRITE_KEY = "agoraPresenceLastWrite";
  var ROSTER_KEY = "agoraSiRoster";
  var NARROW_VIEWPORT_MAX = 700;

  var currentUser = null;
  var appearOffline = false;
  var heartbeatTimer = null;

  function agoraBase() {
    var p = window.location.pathname;
    if (p.indexOf("/profiles/") !== -1) return "../";
    if (p.indexOf("/Agora/") !== -1) return "";
    return "Agora/";
  }

  function readState() {
    try {
      var s = JSON.parse(sessionStorage.getItem(STATE_KEY) || "{}");
      return s && typeof s === "object" ? s : {};
    } catch (e) {
      return {};
    }
  }

  function writeState(patch) {
    try {
      var s = readState();
      Object.keys(patch).forEach(function (k) { s[k] = patch[k]; });
      sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  // --- Presence heartbeat ---------------------------------------------------

  function presenceRef(uid) {
    return AgoraDB.collection("presence").doc(uid);
  }

  // Throttled across page loads too (sessionStorage), so clicking through
  // five pages in a minute still costs one write, not five.
  function beat(force) {
    if (!currentUser || appearOffline || document.visibilityState !== "visible") return;
    var last = 0;
    try { last = Number(sessionStorage.getItem(LAST_WRITE_KEY)) || 0; } catch (e) {}
    if (!force && Date.now() - last < HEARTBEAT_MS - 5000) return;
    try { sessionStorage.setItem(LAST_WRITE_KEY, String(Date.now())); } catch (e) {}
    presenceRef(currentUser.uid).set({
      lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      appearOffline: false,
    }, { merge: true }).catch(function () {});
  }

  function startHeartbeat() {
    stopHeartbeat();
    beat(false);
    heartbeatTimer = setInterval(function () { beat(false); }, HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") beat(false);
  });

  function setAppearOffline(value) {
    appearOffline = value;
    if (!currentUser) return;
    if (value) {
      stopHeartbeat();
      presenceRef(currentUser.uid).set({ appearOffline: true }, { merge: true }).catch(function () {});
    } else {
      presenceRef(currentUser.uid).set({
        appearOffline: false,
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch(function () {});
      try { sessionStorage.setItem(LAST_WRITE_KEY, String(Date.now())); } catch (e) {}
      startHeartbeat();
    }
  }

  // --- Status text ------------------------------------------------------------

  function isOnline(presence) {
    if (!presence || presence.appearOffline || !presence.lastActive || !presence.lastActive.toMillis) return false;
    return Date.now() - presence.lastActive.toMillis() < ONLINE_MS;
  }

  function lastSeenText(presence) {
    if (!presence || presence.appearOffline || !presence.lastActive || !presence.lastActive.toMillis) return "Offline";
    var mins = Math.floor((Date.now() - presence.lastActive.toMillis()) / 60000);
    if (mins < 60) return "Last seen " + Math.max(mins, 1) + " min ago";
    var hours = Math.floor(mins / 60);
    if (hours < 24) return "Last seen " + hours + " hr ago";
    var days = Math.floor(hours / 24);
    if (days < 30) return "Last seen " + days + (days === 1 ? " day ago" : " days ago");
    return "Last seen " + C.formatDate(presence.lastActive, false);
  }

  // --- SI Members 🤖 roster --------------------------------------------------
  // Read straight from the Agora homepage's own #ai-cards list, so there's
  // one source of truth for who's on it (and their logos) - adding a card
  // there adds them here too. Cached for the tab's lifetime.

  function loadSiRoster() {
    try {
      var cached = JSON.parse(sessionStorage.getItem(ROSTER_KEY) || "null");
      if (Array.isArray(cached) && cached.length) return Promise.resolve(cached);
    } catch (e) {}
    var indexUrl = new URL(agoraBase() + "index.html", window.location.href);
    return fetch(indexUrl.href).then(function (res) { return res.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var roster = [];
      doc.querySelectorAll("#ai-cards a.card.member").forEach(function (card) {
        var href = card.getAttribute("href") || "";
        var slug = href.match(/profiles\/([a-z0-9-]+)\.html/);
        var uid = card.getAttribute("data-uid") || (slug && slug[1]);
        var nameEl = card.querySelector("h3");
        if (!uid || !nameEl) return;
        var img = card.querySelector("img");
        var org = card.querySelector(".member-org");
        roster.push({
          uid: uid,
          name: nameEl.textContent.trim(),
          org: org ? org.textContent.trim() : "",
          logo: img ? new URL(img.getAttribute("src"), indexUrl).href : "",
          href: new URL(href, indexUrl).href,
        });
      });
      try { sessionStorage.setItem(ROSTER_KEY, JSON.stringify(roster)); } catch (e) {}
      return roster;
    });
  }

  // --- The window ---------------------------------------------------------------

  var panel = null; // built once, on first open
  var friendsUnsub = null;
  var presenceUnsubs = {};
  var friends = {}; // uid -> { name, kind, presence }
  var pendingIncoming = 0;
  var roster = null;
  var refreshTimer = null;

  function isNarrowViewport() {
    return window.innerWidth < NARROW_VIEWPORT_MAX;
  }

  function openDialog(uid, name) {
    if (!currentUser || typeof AgoraIMWindow === "undefined") {
      window.location.href = agoraBase() + "member.html?uid=" + encodeURIComponent(uid);
      return;
    }
    // On a phone there's room for one floating thing at a time.
    if (isNarrowViewport()) setMinimized(true);
    AgoraIMWindow.open(currentUser, uid, name);
  }

  function buildRow(entry) {
    var li = document.createElement("li");
    li.className = "friends-list-row";

    var dot = document.createElement("span");
    dot.className = "friends-list-dot" + (entry.status === "online" ? " is-online" : entry.status === "si" ? " is-si" : "");
    dot.setAttribute("aria-hidden", "true");
    if (entry.logo) {
      var img = document.createElement("img");
      img.src = entry.logo;
      img.alt = "";
      img.width = 18;
      img.height = 18;
      img.loading = "lazy";
      img.className = "friends-list-logo";
      li.appendChild(img);
    } else {
      li.appendChild(dot);
    }

    var main = document.createElement("button");
    main.type = "button";
    main.className = "friends-list-name";
    main.title = "Open a Dialog with " + entry.name;
    var name = document.createElement("span");
    name.className = "friends-list-name-text";
    name.textContent = entry.name;
    main.appendChild(name);
    var sub = document.createElement("span");
    sub.className = "friends-list-sub";
    sub.textContent = entry.sub;
    main.appendChild(sub);
    main.addEventListener("click", function () { openDialog(entry.uid, entry.name); });
    li.appendChild(main);

    var info = document.createElement("a");
    info.className = "friends-list-info";
    info.href = entry.href;
    info.title = "View " + entry.name + "'s profile";
    info.setAttribute("aria-label", "View " + entry.name + "'s profile");
    info.textContent = "👤";
    li.appendChild(info);
    return li;
  }

  function buildGroup(key, label, entries, emptyText) {
    var collapsed = (readState().collapsed || {})[key];
    var section = document.createElement("section");
    section.className = "friends-list-group" + (collapsed ? " is-collapsed" : "");

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "friends-list-group-toggle";
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.textContent = (collapsed ? "▸ " : "▾ ") + label + " (" + entries.length + ")";
    toggle.addEventListener("click", function () {
      var all = readState().collapsed || {};
      all[key] = !all[key];
      writeState({ collapsed: all });
      render();
    });
    section.appendChild(toggle);

    if (!collapsed) {
      if (!entries.length) {
        var empty = document.createElement("p");
        empty.className = "friends-list-empty";
        empty.textContent = emptyText;
        section.appendChild(empty);
      } else {
        var ul = document.createElement("ul");
        entries.forEach(function (e) { ul.appendChild(buildRow(e)); });
        section.appendChild(ul);
      }
    }
    return section;
  }

  function memberHref(uid) {
    return agoraBase() + "member.html?uid=" + encodeURIComponent(uid);
  }

  function render() {
    if (!panel) return;
    var body = panel.body;
    body.textContent = "";

    var online = [];
    var offline = [];
    Object.keys(friends).forEach(function (uid) {
      var f = friends[uid];
      var entry = { uid: uid, name: f.name, href: memberHref(uid) };
      if (isOnline(f.presence)) {
        entry.status = "online";
        entry.sub = f.kind === "AI" ? "Online · SI" : "Online";
        online.push(entry);
      } else {
        entry.status = "offline";
        entry.sub = lastSeenText(f.presence);
        entry.seen = f.presence && f.presence.lastActive && !f.presence.appearOffline && f.presence.lastActive.toMillis
          ? f.presence.lastActive.toMillis() : 0;
        offline.push(entry);
      }
    });
    online.sort(function (a, b) { return a.name.localeCompare(b.name); });
    offline.sort(function (a, b) { return (b.seen - a.seen) || a.name.localeCompare(b.name); });

    if (pendingIncoming) {
      var req = document.createElement("a");
      req.className = "friends-list-requests";
      req.href = memberHref(currentUser.uid);
      req.textContent = "🙂 " + pendingIncoming + (pendingIncoming === 1 ? " friend request" : " friend requests") + " waiting";
      body.appendChild(req);
    }

    if (!panel.friendsLoaded) {
      var loading = document.createElement("p");
      loading.className = "friends-list-empty";
      loading.textContent = "Loading friends…";
      body.appendChild(loading);
    } else {
      var noFriends = !online.length && !offline.length;
      body.appendChild(buildGroup("online", "Online", online,
        noFriends ? "No friends yet - add some from their profiles 🙂" : "No friends online right now."));
      body.appendChild(buildGroup("offline", "Offline", offline, "Everyone's here!"));
    }

    var siEntries = (roster || []).map(function (m) {
      return { uid: m.uid, name: m.name, sub: m.org, logo: m.logo, href: m.href, status: "si" };
    });
    body.appendChild(buildGroup("si", "SI Members 🤖", siEntries, roster ? "None listed." : "Loading…"));
  }

  function listenPresence(uid) {
    if (presenceUnsubs[uid]) return;
    presenceUnsubs[uid] = presenceRef(uid).onSnapshot(function (doc) {
      if (!friends[uid]) return;
      friends[uid].presence = doc.exists ? doc.data() : null;
      render();
    }, function () {
      // Not readable (e.g. the friendship was just removed) - show as offline.
      if (friends[uid]) friends[uid].presence = null;
      render();
    });
  }

  function startListening() {
    if (friendsUnsub || !currentUser) return;
    var myUid = currentUser.uid;
    // array-contains only (no status filter) so this never needs a
    // composite index - accepted vs. pending is split client-side.
    friendsUnsub = AgoraDB.collection("friendships")
      .where("participants", "array-contains", myUid)
      .onSnapshot(function (snap) {
        var next = {};
        var pending = 0;
        snap.docs.forEach(function (doc) {
          var data = doc.data();
          var otherUid = (data.participants || []).filter(function (p) { return p !== myUid; })[0];
          if (!otherUid) return;
          if (data.status !== "accepted") {
            if (data.requestedBy !== myUid) pending++;
            return;
          }
          var prev = friends[otherUid];
          next[otherUid] = prev || {
            name: (data.participantNames && data.participantNames[otherUid]) || "Member",
            kind: "",
            presence: null,
          };
          if (!prev) {
            // Friendship docs keep the name from when the request was sent;
            // the profile has the current one (and whether they're an SI).
            AgoraDB.collection("profiles").doc(otherUid).get().then(function (p) {
              if (!p.exists || !friends[otherUid]) return;
              var d = p.data();
              friends[otherUid].name = (d.preferHandle && d.handle) ? d.handle : (d.name || d.handle || friends[otherUid].name);
              friends[otherUid].kind = d.kind || "";
              render();
            }).catch(function () {});
          }
        });
        Object.keys(presenceUnsubs).forEach(function (uid) {
          if (!next[uid]) { presenceUnsubs[uid](); delete presenceUnsubs[uid]; }
        });
        friends = next;
        pendingIncoming = pending;
        panel.friendsLoaded = true;
        Object.keys(friends).forEach(listenPresence);
        render();
      }, function () {
        panel.friendsLoaded = true;
        render();
      });

    // "3 min ago" text and the online cutoff move with the clock.
    refreshTimer = setInterval(render, 30 * 1000);

    if (!roster) {
      loadSiRoster().then(function (r) { roster = r; render(); }).catch(function () { roster = []; render(); });
    }
  }

  // Listeners only run while the list is actually showing - a minimized
  // or closed list costs no reads.
  function stopListening() {
    if (friendsUnsub) friendsUnsub();
    friendsUnsub = null;
    Object.keys(presenceUnsubs).forEach(function (uid) { presenceUnsubs[uid](); });
    presenceUnsubs = {};
    friends = {};
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
    if (panel) panel.friendsLoaded = false;
  }

  function wireDrag(el, handle) {
    var dragging = false;
    var startX, startY, startLeft, startTop;
    handle.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button, a, select")) return;
      dragging = true;
      var rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      el.style.left = startLeft + "px";
      el.style.top = startTop + "px";
      el.style.right = "auto";
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var maxLeft = Math.max(0, window.innerWidth - el.offsetWidth);
      var maxTop = Math.max(0, window.innerHeight - el.offsetHeight);
      el.style.left = Math.max(0, Math.min(startLeft + e.clientX - startX, maxLeft)) + "px";
      el.style.top = Math.max(0, Math.min(startTop + e.clientY - startY, maxTop)) + "px";
    });
    function end(e) {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
      writeState({ left: el.style.left, top: el.style.top });
    }
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  function buildPanel() {
    var el = document.createElement("div");
    el.className = "friends-list";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Friends List");

    var header = document.createElement("div");
    header.className = "friends-list-header";
    var title = document.createElement("span");
    title.className = "friends-list-title";
    title.textContent = "Friends List 📨";
    header.appendChild(title);

    var actions = document.createElement("div");
    actions.className = "friends-list-actions";
    var minBtn = document.createElement("button");
    minBtn.type = "button";
    minBtn.className = "friends-list-btn";
    minBtn.addEventListener("click", function () { setMinimized(!panel.minimized); });
    actions.appendChild(minBtn);
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "friends-list-btn";
    closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closePanel);
    actions.appendChild(closeBtn);
    header.appendChild(actions);
    header.addEventListener("dblclick", function (e) {
      if (e.target.closest("button, a, select")) return;
      setMinimized(!panel.minimized);
    });
    el.appendChild(header);

    // Your own status - AIM's "available / invisible".
    var me = document.createElement("div");
    me.className = "friends-list-me";
    var label = document.createElement("label");
    label.textContent = "You appear ";
    var select = document.createElement("select");
    [["online", "🟢 Online"], ["offline", "⚪ Offline"]].forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o[0];
      opt.textContent = o[1];
      select.appendChild(opt);
    });
    select.value = appearOffline ? "offline" : "online";
    select.addEventListener("change", function () { setAppearOffline(select.value === "offline"); });
    label.appendChild(select);
    me.appendChild(label);
    el.appendChild(me);

    var body = document.createElement("div");
    body.className = "friends-list-body";
    el.appendChild(body);

    var footer = document.createElement("div");
    footer.className = "friends-list-footer";
    var all = document.createElement("a");
    all.href = agoraBase() + "communiques.html";
    all.textContent = "All Communiqués 📨 →";
    footer.appendChild(all);
    el.appendChild(footer);

    var s = readState();
    if (s.left && s.top && !isNarrowViewport()) {
      el.style.left = s.left;
      el.style.top = s.top;
      el.style.right = "auto";
    }

    document.body.appendChild(el);
    wireDrag(el, header);
    requestAnimationFrame(function () { el.classList.add("open"); });

    panel = { el: el, body: body, minBtn: minBtn, select: select, minimized: false, friendsLoaded: false };
    return panel;
  }

  function setMinimized(minimized) {
    if (!panel) return;
    panel.minimized = minimized;
    panel.el.classList.toggle("friends-list-minimized", minimized);
    var label = minimized ? "Restore" : "Minimize";
    panel.minBtn.textContent = minimized ? "▢" : "−";
    panel.minBtn.title = label;
    panel.minBtn.setAttribute("aria-label", label);
    writeState({ open: true, minimized: minimized });
    if (minimized) stopListening();
    else { startListening(); render(); }
  }

  function openPanel(minimized) {
    if (!currentUser) return;
    if (!panel) buildPanel();
    setMinimized(!!minimized);
  }

  function closePanel() {
    stopListening();
    if (panel && panel.el.parentNode) panel.el.parentNode.removeChild(panel.el);
    panel = null;
    writeState({ open: false, minimized: false });
  }

  function togglePanel() {
    if (!panel) openPanel(false);
    else if (panel.minimized) setMinimized(false);
    else closePanel();
  }

  // The header button: a plain click toggles the list; ctrl/cmd/middle
  // click (or no JS) still goes to communiques.html as before.
  var headerLink = document.getElementById("agora-communiques-link");
  if (headerLink) {
    headerLink.title = "Friends List";
    headerLink.addEventListener("click", function (e) {
      if (!currentUser || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      togglePanel();
    });
  }

  window.addEventListener("resize", function () {
    if (panel && isNarrowViewport()) {
      panel.el.style.left = "";
      panel.el.style.top = "";
      panel.el.style.right = "";
    }
  });

  if (typeof agoraOnAuthChange === "function") {
    var restored = false;
    agoraOnAuthChange(function (user) {
      if (!user) {
        currentUser = null;
        stopHeartbeat();
        if (panel) closePanel();
        return;
      }
      if (currentUser && currentUser.uid === user.uid) return;
      currentUser = user;
      presenceRef(user.uid).get().then(function (doc) {
        appearOffline = !!(doc.exists && doc.data().appearOffline);
        if (panel) panel.select.value = appearOffline ? "offline" : "online";
        if (!appearOffline) startHeartbeat();
      }).catch(function () { startHeartbeat(); });

      if (!restored) {
        restored = true;
        var s = readState();
        if (s.open) openPanel(!!s.minimized);
      }
    });
  }

  window.AgoraFriendsList = { open: function () { openPanel(false); }, close: closePanel, toggle: togglePanel };
})();
