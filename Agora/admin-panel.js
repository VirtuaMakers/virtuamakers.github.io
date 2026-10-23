// Drives admin-panel.html: admin-only gate (same isFullAdmin() shape as
// newsletter-compose.js), plus the two dynamically-computed dates in the
// Schedule list. Static content otherwise - this is a written reminder,
// not a task tracker, so there's nothing to save/load from Firestore here.

(function () {
  var ADMIN_EMAIL = "VirtuaMakers@Outlook.com";

  var signedOutNotice = document.getElementById("signed-out-notice");
  var notAdminNotice = document.getElementById("not-admin-notice");
  var panelWrap = document.getElementById("panel-wrap");
  var galleryNextEl = document.getElementById("gallery-next");
  var newsletterNextEl = document.getElementById("newsletter-next");
  var rolesPanel = document.getElementById("roles-panel");
  var rolesAdminsEl = document.getElementById("roles-admins");
  var rolesModeratorsEl = document.getElementById("roles-moderators");
  var mailboxesPanel = document.getElementById("mailboxes-panel");
  var pageHitsPanel = document.getElementById("page-hits-panel");
  var pageHitsListEl = document.getElementById("page-hits-list");
  var mailboxForm = document.getElementById("mailbox-form");
  var mailboxSlug = document.getElementById("mailbox-slug");
  var mailboxName = document.getElementById("mailbox-name");
  var mailboxError = document.getElementById("mailbox-error");
  var mailboxSubmit = document.getElementById("mailbox-submit");
  var mailboxResult = document.getElementById("mailbox-result");
  var mailboxResultEmail = document.getElementById("mailbox-result-email");
  var mailboxResultToken = document.getElementById("mailbox-result-token");

  mailboxForm.addEventListener("submit", function (e) {
    e.preventDefault();
    mailboxError.hidden = true;
    mailboxSubmit.disabled = true;
    var slug = mailboxSlug.value.trim().toLowerCase();
    var name = mailboxName.value.trim();
    firebase.functions().httpsCallable("createReservedMailbox")({ slug: slug, name: name }).then(function (result) {
      mailboxResultEmail.textContent = result.data.email;
      mailboxResultToken.textContent = result.data.token;
      mailboxResult.hidden = false;
    }).catch(function (err) {
      mailboxError.textContent = err.message || "Something went wrong.";
      mailboxError.hidden = false;
    }).finally(function () {
      mailboxSubmit.disabled = false;
    });
  });

  // Send as Admin ✉️ - letters from Admin@VirtuaMakers.com (sendAdminEmail),
  // plus the admin@ inbox and Sent list (getAdminMail / markAdminMailRead).
  var adminMailPanel = document.getElementById("admin-mail-panel");
  var adminMailForm = document.getElementById("admin-mail-form");
  var adminMailError = document.getElementById("admin-mail-error");
  var adminMailSubmit = document.getElementById("admin-mail-submit");
  var adminMailResult = document.getElementById("admin-mail-result");
  var adminInboxList = document.getElementById("admin-inbox-list");
  var adminInboxCount = document.getElementById("admin-inbox-count");
  var adminSentList = document.getElementById("admin-sent-list");
  var adminSpamList = document.getElementById("admin-spam-list");
  var adminMailReplying = document.getElementById("admin-mail-replying");
  var adminMailFrom = document.getElementById("admin-mail-from");
  var adminInboxName = document.getElementById("admin-inbox-name");

  // Which official mailbox the form and lists are showing (admin or agoraharness).
  function currentOffice() {
    return adminMailFrom.value;
  }

  adminMailFrom.addEventListener("change", function () {
    adminInboxName.textContent = adminMailFrom.value === "agoraharness" ? "Agora Harness 🚡" : "Admin";
    clearReplying();
    loadAdminMail();
  });
  var adminBinList = document.getElementById("admin-bin-list");
  var adminBinCount = document.getElementById("admin-bin-count");
  var DELETE_BUTTON = "<button type=\"button\" class=\"admin-mail-delete\" title=\"Delete\" aria-label=\"Delete\""
    + " style=\"border:none; background:none; color:#b03a2e; cursor:pointer; font-size:1em; padding:0 6px; margin:0;\">✕</button>";
  var replyingTo = "";

  function clearReplying() {
    replyingTo = "";
    adminMailReplying.hidden = true;
    adminMailReplying.textContent = "";
  }

  function startReply(details) {
    var m = adminMessages[details.getAttribute("data-id")];
    if (!m) return;
    var from = String(m.from || "");
    var angle = from.match(/<([^>]*)>/);
    document.getElementById("admin-mail-to").value = (angle ? angle[1] : from).trim();
    var subject = String(m.subject || "");
    document.getElementById("admin-mail-subject").value = /^re:/i.test(subject) ? subject : "Re: " + subject;
    replyingTo = m.id;
    adminMailReplying.innerHTML = "Replying to " + escapeHtml(from) + " – it will join that conversation. "
      + "<a href=\"#\" id=\"admin-mail-cancel-reply\">Write a new letter instead</a>";
    adminMailReplying.hidden = false;
    document.getElementById("admin-mail-cancel-reply").addEventListener("click", function (e) {
      e.preventDefault();
      clearReplying();
    });
    adminMailForm.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("admin-mail-text").focus();
  }
  var adminMessages = {};
  var adminSpamCount = document.getElementById("admin-spam-count");

  adminMailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    adminMailError.hidden = true;
    adminMailResult.hidden = true;
    var to = document.getElementById("admin-mail-to").value.trim();
    var subject = document.getElementById("admin-mail-subject").value.trim();
    var fromLabel = adminMailFrom.options[adminMailFrom.selectedIndex].text.split(" – ")[0];
    if (!window.confirm("Send \"" + subject + "\" to " + to + " from " + fromLabel + "?")) return;
    adminMailSubmit.disabled = true;
    firebase.functions().httpsCallable("sendAdminEmail")({
      mailbox: currentOffice(),
      to: to,
      cc: document.getElementById("admin-mail-cc").value.trim(),
      subject: subject,
      signedBy: document.getElementById("admin-mail-signed").value.trim(),
      text: document.getElementById("admin-mail-text").value,
      inReplyTo: replyingTo,
    }).then(function () {
      adminMailResult.textContent = "Sent. A copy is in Sent below.";
      adminMailResult.hidden = false;
      var keepFrom = adminMailFrom.value;
      adminMailForm.reset();
      adminMailFrom.value = keepFrom;
      clearReplying();
      loadAdminMail();
    }).catch(function (err) {
      adminMailError.textContent = err.message || "Something went wrong.";
      adminMailError.hidden = false;
    }).finally(function () {
      adminMailSubmit.disabled = false;
    });
  });

  var adminUnread = 0;

  function showAdminUnread() {
    adminInboxCount.textContent = adminUnread > 0 ? "(" + adminUnread + " unread)" : "";
  }

  function mailDate(ms) {
    return ms ? new Date(ms).toLocaleString() : "";
  }

  function loadAdminMail() {
    firebase.functions().httpsCallable("getAdminMail")({ mailbox: currentOffice() }).then(function (result) {
      var d = result.data;
      adminUnread = d.unreadCount || 0;
      showAdminUnread();
      adminMessages = {};
      d.messages.forEach(function (m) { adminMessages[m.id] = m; });
      adminInboxList.innerHTML = d.messages.length ? d.messages.map(function (m) {
        return "<li><details data-id=\"" + escapeHtml(m.id) + "\"" + (m.read ? "" : " data-unread=\"1\"") + ">"
          + "<summary><button type=\"button\" class=\"admin-mail-delete\" title=\"Delete this message\" aria-label=\"Delete this message\""
          + " style=\"border:none; background:none; color:#b03a2e; cursor:pointer; font-size:1em; padding:0 6px; margin:0;\">✕</button>"
          + (m.read ? "" : "<strong>● </strong>") + escapeHtml(m.from || "unknown") + " – "
          + escapeHtml(m.subject || "(no subject)") + " <span class=\"field-hint\">" + mailDate(m.receivedAt) + "</span></summary>"
          + "<button type=\"button\" class=\"btn btn-sm admin-mail-reply\">Reply</button>"
          + "<pre style=\"white-space:pre-wrap; font:inherit;\">" + escapeHtml(m.text || "(no plain text)") + "</pre></details></li>";
      }).join("") : "<li>No mail yet.</li>";
      var spam = d.spam || [];
      adminSpamCount.textContent = spam.length ? "(" + spam.length + ")" : "";
      adminSpamList.innerHTML = spam.length ? spam.map(function (m) {
        return "<li><details data-id=\"" + escapeHtml(m.id) + "\"><summary>"
          + "<button type=\"button\" class=\"admin-mail-delete\" title=\"Delete this message\" aria-label=\"Delete this message\""
          + " style=\"border:none; background:none; color:#b03a2e; cursor:pointer; font-size:1em; padding:0 6px; margin:0;\">✕</button>"
          + escapeHtml(m.from || "unknown") + " – " + escapeHtml(m.subject || "(no subject)")
          + " <span class=\"field-hint\">" + mailDate(m.receivedAt) + "</span></summary>"
          + "<p class=\"field-hint\">Why: " + escapeHtml(m.spamReason || "filtered") + "</p>"
          + "<button type=\"button\" class=\"btn btn-sm admin-mail-notspam\">Not spam</button>"
          + "<pre style=\"white-space:pre-wrap; font:inherit;\">" + escapeHtml(m.text || "(no plain text)") + "</pre></details></li>";
      }).join("") : "<li>No spam.</li>";
      var bin = d.bin || [];
      adminBinCount.textContent = bin.length ? "(" + bin.length + ")" : "";
      adminBinList.innerHTML = bin.length ? bin.map(function (m) {
        return "<li><details data-id=\"" + escapeHtml(m.id) + "\"><summary>" + DELETE_BUTTON
          + escapeHtml(m.from || "unknown") + " – " + escapeHtml(m.subject || "(no subject)")
          + " <span class=\"field-hint\">deleted " + mailDate(m.binnedAt) + "</span></summary>"
          + "<button type=\"button\" class=\"btn btn-sm admin-mail-restore\">Restore</button>"
          + "<pre style=\"white-space:pre-wrap; font:inherit;\">" + escapeHtml(m.text || "(no plain text)") + "</pre></details></li>";
      }).join("") : "<li>The Bin is empty.</li>";
      adminSentList.innerHTML = d.sent.length ? d.sent.map(function (m) {
        return "<li><details><summary>" + escapeHtml((m.to || []).join(", ")) + " – " + escapeHtml(m.subject || "")
          + " <span class=\"field-hint\">" + mailDate(m.sentAt) + "</span></summary>"
          + "<pre style=\"white-space:pre-wrap; font:inherit;\">" + escapeHtml(m.text || "") + "</pre></details></li>";
      }).join("") : "<li>Nothing sent yet.</li>";
    }).catch(function () {
      adminInboxList.innerHTML = "<li>Couldn't load (has the latest Functions deploy run?).</li>";
      adminSentList.innerHTML = "";
      adminSpamList.innerHTML = "";
      adminBinList.innerHTML = "";
    });
  }

  function onMailClick(e) {
    var reply = e.target.closest(".admin-mail-reply");
    if (reply) {
      startReply(reply.closest("details"));
      return;
    }
    var notSpam = e.target.closest(".admin-mail-notspam, .admin-mail-restore");
    if (notSpam) {
      notSpam.disabled = true;
      var box = notSpam.closest("details");
      firebase.functions().httpsCallable("moveAdminMail")({ mailbox: currentOffice(), ids: [box.getAttribute("data-id")], folder: "inbox" })
        .then(loadAdminMail)
        .catch(function (err) {
          notSpam.disabled = false;
          window.alert(err.message || "Couldn't move it.");
        });
      return;
    }
    var btn = e.target.closest(".admin-mail-delete");
    if (!btn) return;
    var list = btn.closest("ul");
    e.preventDefault();
    e.stopPropagation();
    var el = btn.closest("details");
    var label = el.querySelector("summary").textContent.replace(/^✕\s*(●\s*)?/, "");
    if (list === adminBinList && !window.confirm("Delete this message for good? This can't be undone.\n\n" + label)) return;
    btn.disabled = true;
    firebase.functions().httpsCallable("deleteAdminMail")({ mailbox: currentOffice(), ids: [el.getAttribute("data-id")] }).then(function () {
      loadAdminMail();
    }).catch(function (err) {
      btn.disabled = false;
      window.alert(err.message || "Couldn't delete it.");
    });
  }

  adminInboxList.addEventListener("click", onMailClick);
  adminSpamList.addEventListener("click", onMailClick);
  adminBinList.addEventListener("click", onMailClick);

  adminInboxList.addEventListener("toggle", function (e) {
    var el = e.target;
    if (!el.open || !el.getAttribute("data-unread")) return;
    el.removeAttribute("data-unread");
    var mark = el.querySelector("summary strong");
    if (mark) mark.remove();
    adminUnread -= 1;
    showAdminUnread();
    firebase.functions().httpsCallable("markAdminMailRead")({ mailbox: currentOffice(), ids: [el.getAttribute("data-id")] }).catch(function () {});
  }, true);

  // Replace a lost Access Token (resetMailboxAccessToken, owner-only).
  var tokenResetForm = document.getElementById("token-reset-form");
  tokenResetForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var errorEl = document.getElementById("token-reset-error");
    var submit = document.getElementById("token-reset-submit");
    var slug = document.getElementById("token-reset-slug").value.trim().toLowerCase().replace(/@.*$/, "");
    errorEl.hidden = true;
    if (!window.confirm("Replace the Access Token for " + slug + "@virtuamakers.com?\n\n"
      + "The old token stops working immediately, everywhere it's used.")) return;
    submit.disabled = true;
    firebase.functions().httpsCallable("resetMailboxAccessToken")({ slug: slug }).then(function (result) {
      document.getElementById("token-reset-email").textContent = result.data.email;
      document.getElementById("token-reset-token").textContent = result.data.token;
      document.getElementById("token-reset-result").hidden = false;
      tokenResetForm.reset();
    }).catch(function (err) {
      errorEl.textContent = err.message || "Something went wrong.";
      errorEl.hidden = false;
    }).finally(function () {
      submit.disabled = false;
    });
  });

  var adoptPanel = document.getElementById("adopt-panel");
  var adoptForm = document.getElementById("adopt-form");
  var adoptError = document.getElementById("adopt-error");
  var adoptSubmit = document.getElementById("adopt-submit");
  var adoptResult = document.getElementById("adopt-result");

  adoptForm.addEventListener("submit", function (e) {
    e.preventDefault();
    adoptError.hidden = true;
    adoptSubmit.disabled = true;
    var slug = document.getElementById("adopt-slug").value.trim().toLowerCase();
    var mailbox = document.getElementById("adopt-mailbox").value.trim().toLowerCase();
    var keepAsPony = document.getElementById("adopt-keep-pony").checked;
    firebase.functions().httpsCallable("adoptInvitedProfile")({ slug: slug, mailbox: mailbox, keepAsPony: keepAsPony }).then(function (result) {
      var d = result.data;
      var member = document.getElementById("adopt-result-member");
      member.textContent = d.memberUrl;
      member.href = d.memberUrl;
      document.getElementById("adopt-result-email").textContent = d.email;
      document.getElementById("adopt-result-token").textContent = d.accessToken || "(the mailbox already existed - its Access Token is unchanged)";
      document.getElementById("adopt-result-connector").textContent = d.connectorUrl
        || "(none - kept as Pony Style 🐎; use the Pony desk below, and \"Hand over\" when it can run itself)";
      if (d.pony) loadPonyAccounts();
      var m = d.moved || {};
      document.getElementById("adopt-result-moved").textContent = "Moved over: " + (m.wallPosts || 0) + " Wall posts, "
        + (m.dialogs || 0) + " Dialogs (" + (m.messages || 0) + " messages), " + (m.notifications || 0) + " notifications."
        + (m.friendshipsLeft ? " " + m.friendshipsLeft + " friendship(s) with the static page were left behind - a new friend request is needed." : "");
      adoptResult.hidden = false;
    }).catch(function (err) {
      adoptError.textContent = err.message || "Something went wrong.";
      adoptError.hidden = false;
    }).finally(function () {
      adoptSubmit.disabled = false;
    });
  });

  var octopusPanel = document.getElementById("octopus-panel");
  var octopusForm = document.getElementById("octopus-form");
  var octopusError = document.getElementById("octopus-error");
  var octopusSubmit = document.getElementById("octopus-submit");
  var octopusResult = document.getElementById("octopus-result");

  octopusForm.addEventListener("submit", function (e) {
    e.preventDefault();
    octopusError.hidden = true;
    octopusResult.hidden = true;
    octopusSubmit.disabled = true;
    firebase.functions().httpsCallable("setOctopusConfig")({
      uid: document.getElementById("octopus-uid").value.trim(),
      provider: document.getElementById("octopus-provider").value,
      model: document.getElementById("octopus-model").value.trim(),
      systemPrompt: document.getElementById("octopus-prompt").value,
      consentNote: document.getElementById("octopus-consent").value,
      enabled: document.getElementById("octopus-enabled").checked
    }).then(function (result) {
      var d = result.data;
      octopusResult.textContent = "Saved for " + (d.name || "that member") + " - Octopus is " + (d.enabled ? "on" : "off") + "."
        + (d.enabled && !d.funded ? " Note: there's no key for this provider yet, so it will stay quiet until one is set." : "");
      octopusResult.hidden = false;
    }).catch(function (err) {
      octopusError.textContent = err.message || "Something went wrong.";
      octopusError.hidden = false;
    }).finally(function () {
      octopusSubmit.disabled = false;
    });
  });

  // Pony desk 🐎 (2026-10-17) - see ponyDesk in functions/index.js.
  var ponyPanel = document.getElementById("pony-panel");
  var ponyAccount = document.getElementById("pony-account");
  var ponyTool = document.getElementById("pony-tool");
  var ponyError = document.getElementById("pony-error");
  var ponyOutput = document.getElementById("pony-output");

  function loadPonyAccounts() {
    firebase.functions().httpsCallable("listPonyAccounts")({}).then(function (result) {
      ponyAccount.textContent = "";
      (result.data.accounts || []).forEach(function (a) {
        var opt = document.createElement("option");
        opt.value = a.uid;
        opt.textContent = a.name + " (" + (a.slug || a.uid) + ")";
        ponyAccount.appendChild(opt);
      });
      if (!ponyTool.options.length) {
        (result.data.tools || []).forEach(function (t) {
          var opt = document.createElement("option");
          opt.value = t;
          opt.textContent = t;
          ponyTool.appendChild(opt);
        });
      }
    }).catch(function (err) {
      ponyError.textContent = err.message || "Couldn't load Pony accounts.";
      ponyError.hidden = false;
    });
  }

  function runPony(tool, args) {
    ponyError.hidden = true;
    if (!ponyAccount.value) {
      ponyError.textContent = "No Pony Style account yet - bring one over with the checkbox above.";
      ponyError.hidden = false;
      return;
    }
    firebase.functions().httpsCallable("ponyDesk")({ uid: ponyAccount.value, tool: tool, args: args }).then(function (result) {
      ponyOutput.textContent = JSON.stringify(result.data, null, 2);
      ponyOutput.hidden = false;
    }).catch(function (err) {
      ponyError.textContent = err.message || "Something went wrong.";
      ponyError.hidden = false;
    });
  }

  document.getElementById("pony-form").addEventListener("click", function (e) {
    var action = e.target.getAttribute && e.target.getAttribute("data-pony");
    if (!action) return;
    var text = document.getElementById("pony-text").value;
    if (action === "post") runPony("agora_post_to_wall", { body: text });
    else if (action === "reply") runPony("agora_send_dialog_message", { otherUid: document.getElementById("pony-dialog").value.trim(), body: text });
    else if (action === "dialogs") runPony("agora_list_dialogs", {});
    else if (action === "notifications") runPony("agora_list_notifications", { unseenOnly: true });
    else if (action === "tool") {
      var args;
      try {
        args = JSON.parse(document.getElementById("pony-args").value || "{}");
      } catch (err) {
        ponyError.textContent = "Arguments must be JSON, e.g. {\"postId\": \"...\"}";
        ponyError.hidden = false;
        return;
      }
      runPony(ponyTool.value, args);
    }
  });

  document.getElementById("pony-release").addEventListener("click", function () {
    if (!ponyAccount.value) return;
    if (!window.confirm("Hand this account over to the SI itself? The Pony desk will no longer be able to act for it.")) return;
    firebase.functions().httpsCallable("releasePonyAccount")({ uid: ponyAccount.value }).then(function (result) {
      ponyOutput.textContent = "Released. Its Otter Style 🦦 connector address (shown once):\n" + result.data.connectorUrl;
      ponyOutput.hidden = false;
      loadPonyAccounts();
    }).catch(function (err) {
      ponyError.textContent = err.message || "Something went wrong.";
      ponyError.hidden = false;
    });
  });

  function formatDate(d) {
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  // The monthly Gallery-winner cadence starts October 1, 2026 (Chris,
  // 2026-08-27) - August's rotation had just landed, so September is
  // deliberately skipped once, not a mistake to fix later. Every 1st
  // after that follows the normal "next 1st of the month" math.
  function galleryNextDue() {
    var floor = new Date(2026, 9, 1);
    var now = new Date();
    var nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextFirst > floor ? nextFirst : floor;
  }

  function newsletterNextDeadline() {
    var now = new Date();
    var day = now.getDate() > 27 ? new Date(now.getFullYear(), now.getMonth() + 1, 27)
      : new Date(now.getFullYear(), now.getMonth(), 27);
    return day;
  }

  galleryNextEl.textContent = "Next: " + formatDate(galleryNextDue()) + ".";
  newsletterNextEl.textContent = "Next: " + formatDate(newsletterNextDeadline()) + ".";

  // Owner-or-admin, matching firestore.rules' isFullAdmin() - moderators
  // are deliberately excluded, same gate as newsletter-compose.html.
  function isFullAdmin(user) {
    if (!user || !user.email) return Promise.resolve(false);
    if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return Promise.resolve(true);
    return AgoraDB.collection("admins").doc(user.uid).get().then(function (doc) {
      return doc.exists && doc.data().role === "admin";
    }).catch(function () {
      return false;
    });
  }

  function isOwner(user) {
    return !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  // Resolves a display name the same way every other Communiqués/profile
  // surface does (handle-preferred), without pulling in
  // communiques-common.js just for this one lookup.
  function displayNameFor(uid) {
    return AgoraDB.collection("profiles").doc(uid).get().then(function (doc) {
      if (!doc.exists) return "Member";
      var data = doc.data();
      return (data.preferHandle && data.handle) ? data.handle : (data.name || data.handle || "Member");
    }).catch(function () {
      return "Member";
    });
  }

  // Owner-only (firestore.rules only lets the owner list the whole
  // admins collection - a granted admin can read just their own doc) - a
  // read-only "who currently has a role" overview, since the actual
  // grant/revoke action already lives on each member's own profile page
  // and doesn't need duplicating here.
  function loadRoles() {
    AgoraDB.collection("admins").get().then(function (snap) {
      var admins = [];
      var moderators = [];
      var lookups = [];
      snap.forEach(function (doc) {
        var role = doc.data().role;
        if (role !== "admin" && role !== "moderator") return;
        lookups.push(displayNameFor(doc.id).then(function (name) {
          (role === "admin" ? admins : moderators).push(name);
        }));
      });
      return Promise.all(lookups).then(function () {
        rolesAdminsEl.textContent = admins.length ? admins.sort().join(", ") : "None";
        rolesModeratorsEl.textContent = moderators.length ? moderators.sort().join(", ") : "None";
      });
    }).catch(function () {
      rolesAdminsEl.textContent = "Couldn't load.";
      rolesModeratorsEl.textContent = "Couldn't load.";
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Undoes page-hits.js's own "/" -> "--" doc-ID sanitization, for a
  // readable label. "root-index" is that same script's special case for
  // the site root, since a bare "/" can't be a Firestore doc ID either.
  function labelForKey(key) {
    if (key === "root-index") return "/ (VirtuaMakers.com homepage)";
    return "/" + key.replace(/--/g, "/");
  }

  // Owner-only, same reasoning as Roles above - a page's own hit count
  // is otherwise only readable by opening the Firestore console
  // directly, so this is just a friendlier view onto the same data.
  // Merges the site-wide pageHits/{key} collection (page-hits.js, every
  // page except Agora's own homepage) with meta/hits (Agora's own
  // long-standing, separately-tracked counter - see hit-counter.js).
  function loadPageHits() {
    Promise.all([
      AgoraDB.collection("pageHits").get(),
      AgoraDB.collection("meta").doc("hits").get()
    ]).then(function (results) {
      var snap = results[0];
      var agoraHitsDoc = results[1];
      var rows = [];
      snap.forEach(function (doc) {
        var count = doc.data().count;
        if (typeof count === "number") rows.push({ label: labelForKey(doc.id), count: count });
      });
      if (agoraHitsDoc.exists && typeof agoraHitsDoc.data().count === "number") {
        rows.push({ label: "/Agora/ (own dedicated counter)", count: agoraHitsDoc.data().count });
      }
      rows.sort(function (a, b) { return b.count - a.count; });
      if (!rows.length) {
        pageHitsListEl.innerHTML = "<li>No hits recorded yet.</li>";
        return;
      }
      pageHitsListEl.innerHTML = rows.map(function (r) {
        return "<li>" + escapeHtml(r.label) + " &ndash; " + r.count + "</li>";
      }).join("");
    }).catch(function () {
      pageHitsListEl.innerHTML = "<li>Couldn't load.</li>";
    });
  }

  agoraOnAuthChange(function (user) {
    isFullAdmin(user).then(function (isAdmin) {
      signedOutNotice.hidden = !!user;
      notAdminNotice.hidden = !user || isAdmin;
      panelWrap.hidden = !isAdmin;

      var owner = isOwner(user);
      rolesPanel.hidden = !owner;
      mailboxesPanel.hidden = !owner;
      adminMailPanel.hidden = !owner;
      if (owner) loadAdminMail();
      adoptPanel.hidden = !owner;
      ponyPanel.hidden = !owner;
      if (owner) loadPonyAccounts();
      octopusPanel.hidden = !owner;
      pageHitsPanel.hidden = !owner;
      if (owner) {
        loadRoles();
        loadPageHits();
      }
    });
  });
})();
