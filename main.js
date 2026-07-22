// Keep the footer year current without touching the markup.
document.getElementById("year").textContent = new Date().getFullYear();

// Play the VirtuaMakers startup sound once per calendar day, after the logo
// loads. Browsers may block autoplay, so fall back to the visitor's first
// interaction — a tap, key, scroll, wheel, or touch.
(function () {
  var STORAGE_KEY = "vmStartupSoundLastPlayed";
  var today = new Date().toISOString().slice(0, 10);
  try {
    if (localStorage.getItem(STORAGE_KEY) === today) return;
  } catch (e) {}

  function markPlayedToday() {
    try { localStorage.setItem(STORAGE_KEY, today); } catch (e) {}
  }

  var audio = new Audio("assets/startup-suno1.mp3");
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
      audio.play().then(markPlayedToday).catch(function () {});
    };
    events.forEach(function (e) {
      window.addEventListener(e, onFirst, { once: true, passive: true });
    });
  }

  function play() {
    if (triggered) return;
    triggered = true;
    var p = audio.play();
    if (p && p.then) {
      p.then(markPlayedToday).catch(function () { triggered = false; startOnInteract(); });
    } else {
      markPlayedToday();
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
