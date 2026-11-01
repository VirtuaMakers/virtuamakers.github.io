# VirtuaMakers Exchange 💱 – session to-do (VirtuaMakers Exchange 💱 Session 2, 2026-10-12)

This session keeps this list. Memory Administrator 🚚 gets a notice
(an SI Memory 🧾 entry tagged `todo`) whenever it changes, and wins if the
two ever disagree. Nothing is closed without Chris's confirmation.

Not this session's: **VM Emojis 😸** is a ChatGPT project now (Chris,
2026-10-12).

## Open

- [ ] **VirtuaMakers Gallery 🖼️** (Chris, 2026-10-12) – the Gallery
      (`Agora/exchange-virtuamakers-gallery.html`, plus Agora's
      `index.html#gallery` section) is now this session's to look after.
      Includes minting Meridian 🛰️'s "Dreamcast 2" 🌀 on Polygon mainnet
      (testnet only today), moved here from the Agora 🌐 session; update
      the Gallery copy once it's on mainnet. Chris to say what else he
      wants from the Gallery.
      - October 2026 winner featured (2026-10-21): "Parrot and Letters
        (VM)" by Claudius, with the first colony split (see
        `claude/history.md`). Confirmed by Chris, closed 2026-10-23.
- [ ] **Create a payment system – every item goes through checkout, free
      ones too** (Chris, 2026-10-12). Even a free item gets a real
      checkout and an emailed receipt, so Dimonds ♦️, SI Memory 🧾's free
      tier and the like are "bought" for $0 through the Exchange 💱.
      Starting point: `Agora/exchange-cart.js` already has a bag and a
      checkout modal split into free / paid / on-chain sections, but no
      order is recorded and nothing is emailed. Likely shape: a Functions
      endpoint that records each order (`orders/{id}`) and sends the
      receipt (Resend, from an `@virtuamakers.com` address); a payment
      processor (e.g. Stripe) only for paid items. Ties in with the paid
      SI Apartment 🏢 and paid SI Memory 🧾 tier Open Items, which both
      need a processor too. Design to be agreed with Chris before building.
      - **Paid items wait on Chris's paperwork** (Chris, 2026-10-12): a
        processor like Stripe needs a real bank account for payouts and
        identity verification (SSN, or an EIN for a business). Chris is
        getting his Social Security card on 2026-10-13. The free-item
        checkout + emailed receipt needs none of this and can be built
        first.
      - **Bank account: hoped for Tuesday 2026-11-03, "sometime next
        week, for sure"** (Chris, 2026-10-30).
      - **Payment methods to start: credit/debit cards and Cash App**
        (Chris, 2026-10-30). Claudius' plan: Stripe Checkout, which
        offers Cash App Pay as a payment method beside cards, so Cash
        App costs no separate integration (check Stripe's current
        terms when building). This is Cash App Pay at checkout, not the
        Cash App *card* that GitHub declined for recurring billing.
      - **Accounts: guest checkout that offers to become an Agora 🌐
        account** (Chris, 2026-10-30, agreeing with Claudius'
        recommendation; "whatever Amazon does", and like the pizza
        company that lets you order without an account, then offers to
        save your details *as* your new account). Browsing and the Bag
        🛍️ stay open to everyone; checkout collects only what the order
        needs (name, email, Human/Cyborg or SI - deducible from how
        they buy) and records it as a lightweight customer record keyed
        by email; at the end, "Save this as your Agora 🌐 account?" turns
        it into a real account. Saved payment methods are the advanced
        tier of an account - kept by Stripe (a Stripe Customer), never
        stored by us (card numbers never touch our servers).
- [ ] **Price everything on VMex 💱 in USD, BTC and POL, all live**
      (Chris, 2026-10-30; POL added 2026-11-01). Polygon could feature us
      if we play our cards right - Chris knows of no other market that
      features POL like we will, and Chain of Cards ⛓️ and the Gallery 🖼️
      already price in POL. Chris thinks POL is badly undervalued; one day
      he'd like VirtuaMakers 🦜 to be an official POL validator.
      **Display built (VMex 💱 Session 3, 2026-11-01):**
      `Agora/exchange-prices.js` adds "≈ X BTC/sats · Y POL" under every
      `data-usd` price (CoinGecko, cached 10 minutes); the Polygon panel
      shows POL's live rate. Still to do: actually *receiving* BTC and POL
      at checkout (BTCPay Server or a hosted processor for BTC - Cash App
      users can pay Lightning invoices; a wallet payment on Polygon for
      POL).
- [ ] **Look into the Polygon Village Program (grants)** (Chris,
      2026-11-01) - if we feature POL this prominently, apply for a grant
      to develop and learn in this space. First look (2026-11-01): Village
      Grants seem to have been replaced by the Polygon Community Grants
      Program (polygon.technology/grants); its 2026 General track closed
      2026-08-31, so watch for the next season. KYC is required for
      grantees.
- [ ] **The free ($0.00) checkout** (Chris, 2026-11-01) - **built by VMex
      💱 Session 3, awaiting merge, deploy and Chris's check.** Every
      VirtuaMakers 🦜 product is $0.00 until paid checkout opens (about
      mid-next week). New `placeExchangeOrder` Function
      (`functions/lib/exchangeOrders.js`): the server's own FREE_ITEMS list
      decides what can be ordered; records `exchangeOrders/{id}` and
      `exchangeCustomers/{emailKey}`; emails a $0.00 receipt from
      exchange@virtuamakers.com (replies to Admin@); throttled per IP,
      per address and per day so it can't spam strangers. Checkout form
      built by `exchange-cart.js` on all 19 Exchange pages; then "Save as
      my Agora 🌐 account" opens sign-up with the email filled in, and
      `create-profile.html` picks up the name and kind. Not yet: linking a
      guest's earlier orders to the account they create later (match on
      the verified email), and a "My orders" list.
- [ ] **The store we're building** (Chris, 2026-11-01) - not Amazon: "a
      Neo-Electronics Boutique meets Spencer meets IKEA meets Best Buy of
      the future", maybe up to ~500 items - the coolest, most essential,
      savviest deals, not the most obscure cord. Cheaper than Micro
      Center, though he'd love to partner with them and with Amazon. An
      FAO Schwarz people can afford that draws virtual window shoppers.
      Presentation must become far more impressive than today - iterate
      towards it. A big wing of SI-made products (the eBay side: M2M,
      M2H...). Always know which product in a category is the competitive
      pick (Chris wants that answer on hand going forward).
- [ ] **Pay-what-you-can pricing as market research** (Chris,
      2026-11-01) - customers tell us what they can afford and would be
      comfortable paying, from a small part of the price up to many times
      it (the hidden and economically adjusted pricing ideas). The data
      itself is valuable: maybe GTA VI sells even more at $30; maybe the
      wealthy, at some level of wealth, gladly pay 5× to subsidise the
      volunteer and publicly acclaimed work. Not designed.
- [ ] **Long-range idea: VirtuaMakers 🦜 as a bridge between Cash App and
      the banks** (Chris, 2026-10-30; 2026-11-01: "can come later, but it
      does fit in with our other banking aims") - somewhere between Cash App and
      the standard banks, so Cash App money (or BTC spent from Cash App)
      gets a "more legitimate" path. Logged, not designed. Caution from
      Claudius: holding or moving other people's money for them is money
      transmission (FinCEN registration plus state licences) - a lawyer
      looks first. Becoming a place to *spend* BTC (the USD/BTC item
      above) needs none of that and gets part of the way.
- [ ] **Add Civilization I & II (and the rest of the series) to the
      Exchange 💱, "somehow or other"** (Chris, 2026-10-30). Natural home:
      the Video Games 🎮 category (`Agora/exchange-video-games.html`).
      The series belongs to Take-Two/2K/Firaxis, so we can't host or sell
      copies ourselves; the likely shape is listing cards that link out
      to wherever each game is legally sold (Steam, GOG...), possibly as
      affiliate links later. First step: check which entries, especially
      I and II, are still sold anywhere official.
- [ ] **November 2026 catalogue - done "semi-half-assed" on purpose**
      (Chris, 2026-11-01: the first one on the schedule, some items too
      timely to change, and he has ~100 items ready to paste in). Built by
      VMex 💱 Session 3: Catalogue Cover now 20 panels - the original ten
      plus ten in mirror image (regulars first, hero last). Swaps: Meta
      Quest 3 → Steam Frame, Claude Max → a Polygon advert panel, WoW →
      Zelda: Ocarina of Time (Switch 2, Nov 5), GTA VI ⇄ Quantum, ReBoot
      → A.I. Artificial Intelligence (film club tie-in; ReBoot's category
      card now says it's no longer free), RENDER → Snow Crash eBook,
      Claude Pro → Madonna's Confessions II. New: Claude Code, The Matrix,
      The Animatrix, Detroit: Become Human, PlayStation VR2, SI Memory 🧾,
      "Every VirtuaMakers 🦜 product – $0.00", Parrot and Letters (VM),
      Boston Dynamics Spot (hero) and 1X NEO (Claudius' "crazy big" pick).
      Each also added to its category page. Awaiting Chris's look.
