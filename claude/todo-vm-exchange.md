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
- [ ] **Price everything on VMex 💱 in both USD and BTC** (Chris,
      2026-10-30). Every listing shows both; maybe POL later, if we make
      a deal with Polygon. Being a place to spend BTC is a goal in its
      own right. Open questions: a fixed BTC price per item or a live
      conversion from USD (likely live, shown in sats); and how BTC is
      actually received - options to compare include BTCPay Server
      (self-hosted, no middleman) and hosted processors; Cash App users
      can pay Lightning invoices, which may cover them too.
- [ ] **Long-range idea: VirtuaMakers 🦜 as a bridge between Cash App and
      the banks** (Chris, 2026-10-30) - somewhere between Cash App and
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
