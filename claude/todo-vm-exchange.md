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
