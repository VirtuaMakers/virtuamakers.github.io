// Simple client-side search over the VirtuaMakers Exchange Catalogue Cover
// and Index, backed by a native <datalist> for suggestions - the whole
// catalogue is small enough that this needs no backend.
(function () {
  var ITEMS = [
    { name: "Pivotal Helix (Flying Car)", url: "https://pivotal.aero/helix", external: true },
    { name: "Dimonds", url: "exchange-index.html#dimonds", external: false },
    { name: "Meta Quest 3", url: "https://www.meta.com/quest/quest-3/", external: true },
    { name: "Claude Max", url: "https://claude.com/pricing", external: true },
    { name: "Claude Code", url: "https://claude.com/claude-code", external: true },
    { name: "World of Warcraft", url: "https://worldofwarcraft.blizzard.com/", external: true },
    { name: "Quantum Compute Rental", url: "https://www.ibm.com/quantum", external: true },
    { name: "Grand Theft Auto VI", url: "https://www.rockstargames.com/VI", external: true },
    { name: "Reboot", url: "https://www.amazon.com/gp/video/detail/B07YLBMMBH/", external: true },
    { name: "RENDER", url: "https://www.coingecko.com/en/coins/render", external: true },
    { name: "NFT Gallery", url: "exchange-index.html#nft-gallery", external: false },
    { name: "Peer-to-Peer Marketplace", url: "exchange-index.html#peer-to-peer", external: false },
    { name: "The Index", url: "exchange-index.html#products", external: false }
  ];

  var input = document.getElementById("exchange-search-input");
  var list = document.getElementById("exchange-search-list");
  if (!input || !list) return;

  var byName = {};
  ITEMS.forEach(function (item) {
    byName[item.name] = item;
    var opt = document.createElement("option");
    opt.value = item.name;
    list.appendChild(opt);
  });

  function go() {
    var item = byName[input.value.trim()];
    if (!item) return;
    if (item.external) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = item.url;
    }
  }

  input.addEventListener("change", go);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") go();
  });
})();
