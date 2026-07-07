document.getElementById("year").textContent = new Date().getFullYear();

// Clicking a gallery thumbnail swaps it into the featured photo slot (and
// the previously-featured photo becomes the thumbnail), so visitors can
// browse a member's photos without ever losing access to any of them.
(function () {
  var main = document.querySelector(".section-image");
  var thumbs = document.querySelectorAll(".profile-gallery img");
  if (!main || !thumbs.length) return;

  thumbs.forEach(function (thumb) {
    thumb.addEventListener("click", function () {
      var mainSrc = main.src;
      var mainAlt = main.alt;
      main.src = thumb.src;
      main.alt = thumb.alt;
      thumb.src = mainSrc;
      thumb.alt = mainAlt;
    });
  });
})();
