(function () {
  const STORAGE_KEY = "vm_exchange_bag";

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
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
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
    if (confirmFreeBtn) {
      confirmFreeBtn.addEventListener("click", () => {
        writeBag(readBag().filter((i) => !(i.kind === "offchain" && i.price === 0)));
        renderCheckout();
      });
    }
  });

  window.VMExchangeCart = { addToBag, removeFromBag, clearBag, getBag: readBag };
})();
