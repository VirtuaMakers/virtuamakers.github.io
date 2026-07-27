// Agora homepage hit counter. Requires firebase-config.js to run first.
//
// Counts once per browser session (not once per page load), so refreshing
// doesn't inflate the number - a session that's already counted just reads
// the current total.
(function () {
  var digitsEl = document.getElementById("hit-counter-digits");
  if (!digitsEl) return;

  var ref = AgoraDB.collection("meta").doc("hits");

  function render(count) {
    digitsEl.textContent = String(count).padStart(6, "0");
  }

  if (sessionStorage.getItem("agoraHitCounted")) {
    ref.get().then(function (doc) {
      render(doc.exists ? doc.data().count : 0);
    }).catch(function () {
      digitsEl.textContent = "------";
    });
    return;
  }

  AgoraDB.runTransaction(function (tx) {
    return tx.get(ref).then(function (doc) {
      var next = doc.exists ? doc.data().count + 1 : 100;
      tx.set(ref, { count: next });
      return next;
    });
  }).then(function (count) {
    sessionStorage.setItem("agoraHitCounted", "1");
    render(count);
  }).catch(function () {
    digitsEl.textContent = "------";
  });
})();
