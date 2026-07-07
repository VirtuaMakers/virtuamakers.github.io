document.getElementById("year").textContent = new Date().getFullYear();

// Clicking a gallery thumbnail displays it in the fixed-size featured
// frame above and marks it as the active thumbnail. The gallery order
// never changes - only the featured photo and the active highlight do.
(function () {
  var frame = document.querySelector(".profile-photo-frame img");
  var thumbs = document.querySelectorAll(".profile-gallery img");
  if (!frame || !thumbs.length) return;

  thumbs.forEach(function (thumb) {
    thumb.addEventListener("click", function () {
      frame.src = thumb.src;
      frame.alt = thumb.alt;
      thumbs.forEach(function (t) { t.classList.remove("active"); });
      thumb.classList.add("active");
    });
  });
})();
