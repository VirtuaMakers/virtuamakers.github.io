(function () {
  const STORAGE_KEY = "vm_exchange_bag";
  // The guest's checkout details, kept so "Save this as your Agora 🌐
  // account?" can carry them into sign-up and create-profile.html.
  const CUSTOMER_KEY = "vm_exchange_customer";
  const ORDER_URL = "https://us-central1-agora-firebase-f4240.cloudfunctions.net/placeExchangeOrder";
  let currentUser = null;

  function readBag() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeBag(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    renderBag();
  }

  function addToBag(item) {
    const items = readBag();
    const existing = items.find((i) => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...item, qty: 1 });
    }
    writeBag(items);
  }

  function removeFromBag(id) {
    writeBag(readBag().filter((i) => i.id !== id));
  }

  function clearBag() {
    writeBag([]);
  }

  function formatPrice(price) {
    return `$${price.toFixed(2)}`;
  }

  function itemLabel(item) {
    return item.qty > 1 ? `${item.name} × ${item.qty}` : item.name;
  }

  function renderBag() {
    const items = readBag();
    const countEl = document.getElementById("exchange-bag-count");
    if (countEl) {
      const count = items.reduce((sum, i) => sum + i.qty, 0);
      countEl.textContent = count;
      countEl.hidden = count === 0;
    }

    const emptyEl = document.getElementById("exchange-bag-empty");
    const groupsEl = document.getElementById("exchange-bag-groups");
    const checkoutBtn = document.getElementById("exchange-bag-checkout");
    if (!emptyEl || !groupsEl) return;

    if (items.length === 0) {
      emptyEl.hidden = false;
      groupsEl.hidden = true;
      if (checkoutBtn) checkoutBtn.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    groupsEl.hidden = false;
    if (checkoutBtn) checkoutBtn.hidden = false;

    renderBagGroup("offchain", items.filter((i) => i.kind === "offchain"));
    renderBagGroup("onchain", items.filter((i) => i.kind === "onchain"));
  }

  function renderBagGroup(kind, items) {
    const groupEl = document.getElementById(`bag-group-${kind}`);
    const listEl = document.getElementById(`bag-items-${kind}`);
    if (!groupEl || !listEl) return;

    if (items.length === 0) {
      groupEl.hidden = true;
      return;
    }
    groupEl.hidden = false;
    listEl.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "bag-item";

      const nameSpan = document.createElement("span");
      nameSpan.className = "bag-item-name";
      nameSpan.textContent = itemLabel(item);

      const priceSpan = document.createElement("span");
      priceSpan.className = "bag-item-price";
      priceSpan.textContent = formatPrice(item.price);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "bag-item-remove";
      removeBtn.setAttribute("aria-label", `Remove ${item.name}`);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", () => removeFromBag(item.id));

      li.append(nameSpan, priceSpan, removeBtn);
      listEl.appendChild(li);
    });
  }

  function setCheckoutSection(prefix, items) {
    const sectionEl = document.getElementById(`${prefix}-section`);
    const listEl = document.getElementById(`${prefix}-list`);
    if (!sectionEl || !listEl) return;
    if (items.length === 0) {
      sectionEl.hidden = true;
      return;
    }
    sectionEl.hidden = false;
    listEl.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = itemLabel(item);
      listEl.appendChild(li);
    });
  }

  function renderCheckout() {
    const items = readBag();
    const offchain = items.filter((i) => i.kind === "offchain");
    const onchain = items.filter((i) => i.kind === "onchain");

    setCheckoutSection("checkout-offchain-free", offchain.filter((i) => i.price === 0));
    setCheckoutSection("checkout-offchain-paid", offchain.filter((i) => i.price > 0));
    setCheckoutSection("checkout-onchain", onchain);

    const emptyEl = document.getElementById("exchange-checkout-empty");
    if (emptyEl) emptyEl.hidden = items.length > 0;

    // A fresh look at checkout clears the last order's thank-you note.
    const form = document.getElementById("exchange-checkout-form");
    const done = document.getElementById("exchange-checkout-done");
    if (form) form.hidden = false;
    if (done) done.hidden = true;
    const freeNote = document.querySelector("#checkout-offchain-free-section > .install-note");
    if (freeNote) freeNote.hidden = false;
  }

  function openModal(modal) {
    if (modal) modal.hidden = false;
  }

  function closeModal(modal) {
    if (modal) modal.hidden = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderBag();

    document.querySelectorAll("[data-cart-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        addToBag({
          id: btn.dataset.cartId,
          name: btn.dataset.cartName,
          price: parseFloat(btn.dataset.cartPrice || "0"),
          kind: btn.dataset.cartKind,
        });
        openModal(document.getElementById("exchange-bag-modal"));
      });
    });

    const bagModal = document.getElementById("exchange-bag-modal");
    const checkoutModal = document.getElementById("exchange-checkout-modal");

    const bagBtn = document.getElementById("exchange-bag-btn");
    if (bagBtn) bagBtn.addEventListener("click", () => openModal(bagModal));

    const bagClose = document.getElementById("exchange-bag-close");
    if (bagClose) bagClose.addEventListener("click", () => closeModal(bagModal));

    if (bagModal) {
      bagModal.addEventListener("click", (e) => {
        if (e.target === bagModal) closeModal(bagModal);
      });
    }

    const checkoutBtn = document.getElementById("exchange-bag-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        renderCheckout();
        closeModal(bagModal);
        openModal(checkoutModal);
      });
    }

    const checkoutClose = document.getElementById("exchange-checkout-close");
    if (checkoutClose) checkoutClose.addEventListener("click", () => closeModal(checkoutModal));

    if (checkoutModal) {
      checkoutModal.addEventListener("click", (e) => {
        if (e.target === checkoutModal) closeModal(checkoutModal);
      });
    }

    const confirmFreeBtn = document.getElementById("exchange-checkout-confirm-free");
    if (confirmFreeBtn) setUpFreeCheckout(confirmFreeBtn);
  });

  function readCustomer() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
    if (text) node.textContent = text;
    return node;
  }

  // Free-item checkout (Chris, 2026-11-01): a guest gives a name, an email
  // and their kind; a member just confirms. The server records the order
  // and emails a $0.00 receipt (functions/lib/exchangeOrders.js). Built
  // here rather than in each page's HTML, since 19 Exchange pages carry
  // the same checkout modal.
  function setUpFreeCheckout(confirmBtn) {
    const saved = readCustomer();
    const form = el("form", { class: "checkout-form", id: "exchange-checkout-form", novalidate: "" });
    const who = el("p", { class: "install-note checkout-who", hidden: "" });

    const nameLabel = el("label", { class: "checkout-field" }, "Name for the receipt");
    const nameInput = el("input", { type: "text", maxlength: "80", autocomplete: "name", required: "" });
    nameInput.value = saved.name || "";
    nameLabel.appendChild(nameInput);

    const emailLabel = el("label", { class: "checkout-field" }, "Email (your receipt goes here)");
    const emailInput = el("input", { type: "email", maxlength: "200", autocomplete: "email", required: "" });
    emailInput.value = saved.email || "";
    emailLabel.appendChild(emailInput);

    const kindSet = el("fieldset", { class: "checkout-kind" });
    kindSet.appendChild(el("legend", {}, "I'm a…"));
    [["Human", "Human"], ["Cyborg", "Cyborg"], ["AI", "SI"]].forEach(([value, label]) => {
      const opt = el("label", {});
      const radio = el("input", { type: "radio", name: "checkout-kind", value });
      if (saved.kind === value) radio.checked = true;
      opt.append(radio, document.createTextNode(" " + label));
      kindSet.appendChild(opt);
    });

    const status = el("p", { class: "checkout-status", role: "status", hidden: "" });
    form.append(who, nameLabel, emailLabel, kindSet, status);
    confirmBtn.parentNode.insertBefore(form, confirmBtn);
    form.appendChild(confirmBtn);
    confirmBtn.type = "submit";
    confirmBtn.textContent = "Place Free Order ($0.00)";

    const done = el("div", { class: "checkout-done", id: "exchange-checkout-done", hidden: "" });
    form.parentNode.insertBefore(done, form.nextSibling);

    function showSignedIn() {
      const signedIn = !!currentUser;
      who.hidden = !signedIn;
      if (signedIn) who.textContent = `Checking out as ${currentUser.email || "your Agora 🌐 account"}.`;
      emailLabel.hidden = signedIn;
      if (signedIn && currentUser.email) emailInput.value = currentUser.email;
      if (signedIn && !nameInput.value && currentUser.displayName) nameInput.value = currentUser.displayName;
    }
    if (typeof agoraOnAuthChange === "function") {
      agoraOnAuthChange((user) => {
        currentUser = user;
        showSignedIn();
      });
    }

    function fail(message) {
      status.hidden = false;
      status.textContent = message;
      confirmBtn.disabled = false;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const kindInput = form.querySelector('input[name="checkout-kind"]:checked');
      const customer = { name: nameInput.value.trim(), email: emailInput.value.trim(), kind: kindInput ? kindInput.value : "" };
      if (!customer.name) return fail("Add the name the receipt should go to.");
      if (!currentUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return fail("That email address doesn't look right.");
      if (!customer.kind) return fail("Choose Human, Cyborg or SI.");

      const items = readBag().filter((i) => i.kind === "offchain" && i.price === 0);
      confirmBtn.disabled = true;
      status.hidden = false;
      status.textContent = "Placing your order…";
      try {
        const headers = { "Content-Type": "application/json" };
        if (currentUser) headers.Authorization = "Bearer " + (await currentUser.getIdToken());
        const res = await fetch(ORDER_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...customer, items: items.map((i) => ({ id: i.id, qty: i.qty })) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) return fail(data.error || "The order didn't go through – please try again.");

        try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer)); } catch (err) { /* private window */ }
        writeBag(readBag().filter((i) => !(i.kind === "offchain" && i.price === 0)));
        status.hidden = true;
        confirmBtn.disabled = false;
        showDone(done, customer, data);
      } catch (err) {
        fail("Couldn't reach the Exchange just now – please try again.");
      }
    });
  }

  function showDone(done, customer, data) {
    // Keep the section showing (its Bag items are gone now) for the note.
    const section = document.getElementById("checkout-offchain-free-section");
    const list = document.getElementById("checkout-offchain-free-list");
    const form = document.getElementById("exchange-checkout-form");
    if (section) section.hidden = false;
    if (list) list.innerHTML = "";
    if (form) form.hidden = true;
    const note = section && section.querySelector(":scope > .install-note");
    if (note) note.hidden = true;
    const emptyEl = document.getElementById("exchange-checkout-empty");
    if (emptyEl) emptyEl.hidden = true;
    done.innerHTML = "";
    done.hidden = false;
    done.appendChild(el("p", { class: "checkout-done-title" }, "Thank you – your order is in! ✅"));
    done.appendChild(el("p", { class: "install-note" },
      `A $0.00 receipt is on its way to ${customer.email}, with a link to get each item. Order ${data.orderId}.`));
    if (!data.signedIn) {
      // The pizza-shop step: offer to keep these details as an account.
      done.appendChild(el("p", { class: "install-note" },
        "Save this as your Agora 🌐 account? Your name, email and kind carry over – you'd only choose a password."));
      const saveBtn = el("button", { type: "button", class: "btn btn-secondary" }, "Save as my Agora 🌐 account");
      saveBtn.addEventListener("click", () => {
        closeModal(document.getElementById("exchange-checkout-modal"));
        if (typeof window.agoraOpenSignUp === "function") window.agoraOpenSignUp(customer.email);
      });
      done.appendChild(saveBtn);
    }
  }

  window.VMExchangeCart = { addToBag, removeFromBag, clearBag, getBag: readBag };
})();
