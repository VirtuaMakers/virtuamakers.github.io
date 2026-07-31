if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/Agora/sw.js").catch(() => {});
  });
}
