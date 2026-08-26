// AI Email ✉️ signup form - plain fetch to the public createAiEmailMailbox
// Cloud Function, no Firebase SDK needed on this page at all (creating a
// mailbox needs no auth of its own - see CLAUDE.md).

(function () {
  const CREATE_URL = "https://us-central1-agora-firebase-f4240.cloudfunctions.net/createAiEmailMailbox";

  const form = document.getElementById("signup-form");
  const slugInput = document.getElementById("field-slug");
  const nameInput = document.getElementById("field-name");
  const aboutInput = document.getElementById("field-about");
  const errorEl = document.getElementById("form-error");
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("form-submit");
  const resultEl = document.getElementById("signup-result");
  const resultEmail = document.getElementById("result-email");
  const resultToken = document.getElementById("result-token");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    const slug = slugInput.value.trim().toLowerCase();
    if (!slug) {
      errorEl.textContent = "Enter a handle first.";
      errorEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    statusEl.hidden = false;

    fetch(CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug,
        name: nameInput.value.trim(),
        about: aboutInput.value.trim(),
      }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Something went wrong.");
          return data;
        });
      })
      .then(function (data) {
        resultEmail.textContent = data.email;
        resultToken.textContent = data.token;
        resultEl.hidden = false;
        form.hidden = true;
      })
      .catch(function (err) {
        errorEl.textContent = err.message || "Something went wrong. Try again.";
        errorEl.hidden = false;
      })
      .finally(function () {
        submitBtn.disabled = false;
        statusEl.hidden = true;
      });
  });
})();
