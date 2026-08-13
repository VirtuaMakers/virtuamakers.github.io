// Shared helper for the write flows that go through content moderation:
// Wall posts/comments and Dialog messages (communiques-common.js,
// communiques-dm.js) and profile bio/pictures (profile-form.js). Fails
// OPEN, not closed - any error calling the Cloud Function (wrong config,
// network hiccup, or simply not deployed yet) resolves to "allow", so a
// moderation outage is never the reason nobody can post. See
// functions/index.js's own note on this same choice server-side.

var AgoraModeration = (function () {
  function callFn(name, payload) {
    if (typeof firebase === "undefined" || !firebase.functions) {
      return Promise.resolve({ decision: "allow" });
    }
    return firebase.functions().httpsCallable(name)(payload)
      .then(function (result) { return result.data; })
      .catch(function () { return { decision: "allow" }; });
  }

  // Does NOT fail open - a failed appeal request should tell the member it
  // failed, not silently pretend to have worked.
  function callRaw(name, payload) {
    if (typeof firebase === "undefined" || !firebase.functions) {
      return Promise.reject(new Error(name + " not available"));
    }
    return firebase.functions().httpsCallable(name)(payload)
      .then(function (result) { return result.data; });
  }

  function checkText(text, contentType, context) {
    return callFn("moderateText", { text: text, contentType: contentType, context: context || {} });
  }

  // file is a File; resolves the same {decision, logId} shape as checkText.
  function checkImage(file, slotIndex) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        // reader.result is "data:image/png;base64,AAAA..." - the API wants
        // just the base64 payload.
        var base64 = String(reader.result).split(",")[1] || "";
        callFn("moderateImage", { base64: base64, mimeType: file.type, slotIndex: slotIndex })
          .then(resolve);
      };
      reader.onerror = function () { resolve({ decision: "allow" }); };
      reader.readAsDataURL(file);
    });
  }

  // Renders the shared "blocked" experience into an existing form-error
  // element: a message (a sensible default, or a caller-supplied one for
  // contexts like profile-form.js that need to say which field), plus a
  // "Request a review" button that files the appeal (once) if a logId
  // came back.
  function showBlocked(errorEl, logId, message) {
    errorEl.textContent = "";
    errorEl.hidden = false;
    errorEl.appendChild(document.createTextNode(
      message || "This didn't pass Agora's content filter, so it wasn't posted. "
    ));
    if (!logId) return;

    var link = document.createElement("button");
    link.type = "button";
    link.className = "auth-link";
    link.textContent = "Think this is a mistake? Request a review.";
    link.addEventListener("click", function () {
      link.disabled = true;
      link.textContent = "Requesting…";
      callRaw("requestModerationAppeal", { logId: logId }).then(function () {
        link.textContent = "Review requested - thanks, we'll take a look.";
      }).catch(function () {
        link.disabled = false;
        link.textContent = "Think this is a mistake? Request a review.";
      });
    });
    errorEl.appendChild(link);
  }

  return { checkText: checkText, checkImage: checkImage, showBlocked: showBlocked };
})();
