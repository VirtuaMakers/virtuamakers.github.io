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

  // SafeSearch doesn't need a full-resolution photo, so the copy sent for
  // moderation is downscaled/re-encoded first - the real picture upload
  // (uploadPicture() in profile-form.js) still sends the original file to
  // Storage untouched. Without this, saving several full-size pictures at
  // once meant every picture went out over the wire twice (once here as
  // base64, again as the real upload) - on a save with 5 pictures near the
  // 5MB Storage cap each, that's ~25MB to Storage plus another ~33MB of
  // base64 here, comfortably enough to blow the save chain's 30s deadline
  // on an ordinary home connection. Falls back to "allow" (fails open,
  // same as every other moderation failure mode) if the resize itself
  // fails for any reason - a broken/corrupt image shouldn't block a save.
  function resizeForModeration(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var maxEdge = 1024;
        var scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        resolve(String(dataUrl).split(",")[1] || "");
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Could not load image for moderation check."));
      };
      img.src = url;
    });
  }

  // file is a File; resolves the same {decision, logId} shape as checkText.
  function checkImage(file, slotIndex) {
    return resizeForModeration(file).then(function (base64) {
      return callFn("moderateImage", { base64: base64, mimeType: "image/jpeg", slotIndex: slotIndex });
    }).catch(function () {
      return { decision: "allow" };
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
