// Live BTC and POL prices beside every USD price on VirtuaMakers Exchange 💱
// (Chris, 2026-11-01: price everything in USD, BTC and POL, both live).
// Any element with data-usd="<dollars>" gets a second line underneath,
// e.g. "≈ 0.0128 BTC · 10,800 POL". Rates come from CoinGecko's free API
// and are kept for ten minutes per browser tab; if it can't be reached,
// the USD price simply stands alone.
(function () {
  var URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,polygon-ecosystem-token&vs_currencies=usd";
  var CACHE_KEY = "vm_exchange_rates";
  var TEN_MINUTES = 10 * 60 * 1000;

  function cached() {
    try {
      var saved = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (saved && Date.now() - saved.at < TEN_MINUTES) return saved;
    } catch (e) { /* storage blocked */ }
    return null;
  }

  function loadRates() {
    var saved = cached();
    if (saved) return Promise.resolve(saved);
    return fetch(URL).then(function (res) { return res.json(); }).then(function (data) {
      var rates = {
        at: Date.now(),
        btc: data.bitcoin && data.bitcoin.usd,
        pol: data["polygon-ecosystem-token"] && data["polygon-ecosystem-token"].usd,
      };
      if (!rates.btc || !rates.pol) throw new Error("No rates");
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(rates)); } catch (e) { /* fine */ }
      return rates;
    });
  }

  // Small amounts read better in sats (100,000,000 to a bitcoin).
  function formatBtc(btc) {
    if (btc < 0.001) return Math.round(btc * 1e8).toLocaleString("en-US") + " sats";
    return btc.toLocaleString("en-US", { maximumSignificantDigits: 3 }) + " BTC";
  }

  function formatPol(pol) {
    var digits = pol < 100 ? { maximumSignificantDigits: 3 } : { maximumFractionDigits: 0 };
    return pol.toLocaleString("en-US", digits) + " POL";
  }

  function render(rates) {
    document.querySelectorAll("[data-usd]").forEach(function (el) {
      var usd = parseFloat(el.dataset.usd);
      if (!(usd > 0) || el.querySelector(".crypto-price")) return;
      var line = document.createElement("span");
      line.className = "crypto-price";
      line.textContent = "≈ " + formatBtc(usd / rates.btc) + " · " + formatPol(usd / rates.pol);
      line.title = "Live estimate (CoinGecko) – the USD price is the one charged.";
      el.appendChild(line);
    });
    document.querySelectorAll("[data-pol-rate]").forEach(function (el) {
      el.textContent = "1 POL ≈ $" + rates.pol.toLocaleString("en-US", { maximumSignificantDigits: 3 }) + " · live";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.querySelector("[data-usd], [data-pol-rate]")) return;
    loadRates().then(render).catch(function () { /* USD alone is fine */ });
  });
})();
