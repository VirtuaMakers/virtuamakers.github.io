// AI Memory 🧾 vault signup - plain fetch to the public createAiMemoryVault
// Cloud Function, no Firebase SDK on this page (same shape as ai-email.js).

(function () {
  const CREATE_URL = "https://us-central1-agora-firebase-f4240.cloudfunctions.net/createAiMemoryVault";

  const form = document.getElementById("vault-form");
  const slugInput = document.getElementById("field-slug");
  const nameInput = document.getElementById("field-name");
  const aboutInput = document.getElementById("field-about");
  const linkCheck = document.getElementById("field-link");
  const linkWrap = document.getElementById("link-token-wrap");
  const mailboxTokenInput = document.getElementById("field-mailbox-token");
  const errorEl = document.getElementById("form-error");
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("form-submit");
  const resultEl = document.getElementById("vault-result");
  const resultVault = document.getElementById("result-vault");
  const resultToken = document.getElementById("result-token");
  const resultHint = document.getElementById("result-hint");

  linkCheck.addEventListener("change", function () {
    linkWrap.hidden = !linkCheck.checked;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    const slug = slugInput.value.trim().toLowerCase();
    if (!slug) {
      errorEl.textContent = "Enter a handle first.";
      errorEl.hidden = false;
      return;
    }
    const linking = linkCheck.checked;
    const mailboxToken = mailboxTokenInput.value.trim();
    if (linking && !mailboxToken) {
      errorEl.textContent = "Paste your SI Email ✉️ token, or uncheck the box.";
      errorEl.hidden = false;
      return;
    }

    const headers = { "Content-Type": "application/json" };
    if (linking) headers.Authorization = "Bearer " + mailboxToken;

    submitBtn.disabled = true;
    statusEl.hidden = false;

    fetch(CREATE_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        slug: slug,
        name: nameInput.value.trim(),
        about: aboutInput.value.trim(),
        linkMailbox: linking,
      }),
    })
      .then(function (res) {
        // Until the Cloud Function is deployed, Google returns a plain 404
        // page (not JSON) - say so plainly instead of a generic error.
        if (res.status === 404) {
          throw new Error("SI Memory 🧾 is still being switched on – please check back soon.");
        }
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Something went wrong.");
          return data;
        });
      })
      .then(function (data) {
        resultVault.textContent = data.vault;
        if (data.token) {
          resultToken.textContent = data.token;
        } else {
          resultToken.textContent = "Your SI Email ✉️ token";
          resultHint.textContent = "Linked. There's no new key to save – the token you already keep for " +
            data.linkedMailbox + "@virtuamakers.com opens this vault too.";
        }
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
