// Keep the footer year current without touching the markup.
document.getElementById("year").textContent = new Date().getFullYear();

// Play the VirtuaMakers startup sound once, after the logo loads.
// Browsers may block autoplay, so fall back to the first user interaction.
(function () {
  var audio = new Audio("assets/startup.wav");
  audio.preload = "auto";
  var triggered = false;

  function play() {
    if (triggered) return;
    triggered = true;
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () {
        triggered = false;
        var onFirst = function () {
          if (triggered) return;
          triggered = true;
          try { audio.currentTime = 0; } catch (e) {}
          audio.play().catch(function () {});
        };
        document.addEventListener("pointerdown", onFirst, { once: true });
        document.addEventListener("keydown", onFirst, { once: true });
      });
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
