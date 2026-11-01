// Simple client-side search over the VirtuaMakers Exchange Catalogue Cover
// and Index, backed by a native <datalist> for suggestions - the whole
// catalogue is small enough that this needs no backend.
(function () {
  var ITEMS = [
    { name: "Pivotal Helix (Flying Car)", url: "https://pivotal.aero/helix", external: true },
    { name: "Dimonds", url: "exchange-video-games.html#dimonds", external: false },
    { name: "Meta Quest 3", url: "https://www.meta.com/quest/quest-3/", external: true },
    { name: "Claude Max", url: "https://claude.com/pricing", external: true },
    { name: "Claude Pro", url: "https://claude.com/pricing", external: true },
    { name: "Claude Code", url: "https://claude.com/claude-code", external: true },
    { name: "RentAHuman.ai", url: "https://rentahuman.ai", external: true },
    { name: "World of Warcraft", url: "https://worldofwarcraft.blizzard.com/", external: true },
    { name: "Quantum Compute Rental", url: "https://www.ibm.com/quantum", external: true },
    { name: "Grand Theft Auto VI", url: "https://www.rockstargames.com/VI", external: true },
    { name: "ReBoot", url: "https://www.amazon.com/gp/video/detail/B07YLBMMBH/", external: true },
    { name: "RENDER", url: "https://www.coingecko.com/en/coins/render", external: true },
    { name: "Steam Frame (VR)", url: "exchange-arvr.html", external: false },
    { name: "PlayStation VR2", url: "exchange-arvr.html", external: false },
    { name: "The Legend of Zelda: Ocarina of Time", url: "exchange-video-games.html", external: false },
    { name: "Detroit: Become Human", url: "exchange-video-games.html", external: false },
    { name: "A.I. Artificial Intelligence", url: "exchange-video.html", external: false },
    { name: "The Matrix", url: "exchange-video.html", external: false },
    { name: "The Animatrix", url: "exchange-video.html", external: false },
    { name: "Snow Crash", url: "exchange-ebooks.html", external: false },
    { name: "Madonna – Confessions II", url: "exchange-music.html", external: false },
    { name: "Boston Dynamics Spot", url: "exchange-robotics.html", external: false },
    { name: "1X NEO", url: "exchange-robotics.html", external: false },
    { name: "VirtuaMakers Products ($0.00)", url: "exchange.html#virtuamakers-products", external: false },
    { name: "E-Books", url: "exchange-ebooks.html", external: false },
    { name: "The Logo", url: "exchange-the-logo.html", external: false },
    { name: "VirtuaMakers Gallery", url: "exchange-virtuamakers-gallery.html", external: false },
    { name: "Chain of Cards", url: "exchange-chain-of-cards.html", external: false },
    { name: "Peer-to-Peer Marketplace", url: "exchange.html#peer-to-peer", external: false },
    { name: "The Road Ahead", url: "exchange.html#road-ahead", external: false },
    { name: "Our Crypto Policy", url: "exchange.html#crypto-policy", external: false },
    { name: "Polygon", url: "exchange.html#crypto-policy", external: false },
    { name: "Help Build the Exchange", url: "exchange.html#help-the-exchange", external: false },
    { name: "Catalogue Index", url: "exchange.html#index-pagination", external: false }
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
