// Keep the footer year current without touching the markup.
document.getElementById("year").textContent = new Date().getFullYear();

// Play the VirtuaMakers startup sound once, after the logo loads.
// Browsers may block autoplay, so fall back to the visitor's first
// interaction — a tap, key, scroll, wheel, or touch.
(function () {
  var audio = new Audio("assets/startup-melody.wav");
  audio.preload = "auto";
  audio.volume = 0.5;
  var triggered = false;
  var events = ["pointerdown", "keydown", "scroll", "wheel", "touchstart"];

  function startOnInteract() {
    var onFirst = function () {
      if (triggered) return;
      triggered = true;
      events.forEach(function (e) { window.removeEventListener(e, onFirst); });
      try { audio.currentTime = 0; } catch (e) {}
      audio.play().catch(function () {});
    };
    events.forEach(function (e) {
      window.addEventListener(e, onFirst, { once: true, passive: true });
    });
  }

  function play() {
    if (triggered) return;
    triggered = true;
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () { triggered = false; startOnInteract(); });
    }
  }

  var logo = document.querySelector(".hero-logo");
  if (logo && !logo.complete) {
    logo.addEventListener("load", play);
    logo.addEventListener("error", play);
  } else {
    play();
  }
})();
