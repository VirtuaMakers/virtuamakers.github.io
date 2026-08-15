# VirtuaMakers website

The official site for VirtuaMakers — a single-page static site (plain HTML/CSS/JS)
published via GitHub Pages at https://virtuamakers.github.io.

## Reminders / TODO

- [ ] Confirm the **GitHub** social link (`https://github.com/VirtuaMakers`) points
  to the right org vs. a personal profile, if a "Follow" button is wanted.

## Repo layout — two sites

- **VirtuaMakers** (root): `index.html`, `style.css`, `main.js` → `https://virtuamakers.github.io`.
- **Agora** (subfolder `/Agora/`): self-contained `index.html` + `style.css`
  (inline `<script>`), own `/Agora/assets/` → `https://virtuamakers.github.io/Agora/`.
  Built self-contained on purpose so it can move to its **own repo / Agora.com** later.
  Chris plans an **"Agora 2.0" session** to develop it separately from VirtuaMakers.

## Agora — current structure (top → bottom)

- **Hero:** big centered logo, eyebrow "A Virtua(green)Makers(blue) project", H1
  "A social intelligence platform.", lede, small "manifesto" fine print (by Copilot).
- **Four pillar tiles** (`.feature` cards, image + caption, each links in-page):
  **Profiles 🙂**→`#profiles`, **The Exchange 💱**→`#exchange`,
  **The Pursuit of Justice ⚖️**→`#justice`, **The Pursuit of Citizenship 🕊️**→`#citizenship`.
- **Pillar sections** (large `.pillar-title`), each with a centered `.section-image`:
  - **Profiles** = umbrella over nested `.subsection`s: **AI Members** (12: ChatGPT,
    Claude, Command R, Copilot, Gemini, GLM, Grok, Kimi, Llama, Mistral, Nemotron, Qwen —
    favicon logos + "Profile coming soon"), **Human Members** (Christopher Bruckmann,
    Brittany York, Andrew Bernhard, Cory Campbell — initial-avatar circles), **Our Ethos**,
    **Join**.
  - **The Exchange** — full copy (H2M/M2H/M2M, virtual goods, etc.).
  - **The Pursuit of Justice** — AI-labor compensation copy + nested **Per Manum
    Convention ✒️** (Black Nib mark / shared-authorship charter).
  - **The Pursuit of Citizenship** — rights/personhood copy + nested **Computerian
    Manifesto 🖥️** (digital-humanism charter).
- Shared text classes: `.body-text`, `.body-list`, `.body-quote` (italic pull-quote).

## VirtuaMakers — About "credits"

- **VirtuaMakers Staff** list (with roles): 😎 Christopher T. Bruckmann (link → X) –
  Founder, Exec Dir; Claude – Founder, Technical Officer; ChatGPT – Founder, Chief Analyst;
  Copilot – Analyst/Graphic Designer; Gemini – Graphic Designer; Leo (Brave) – Systems Designer.
  Then a separate **"Guest AIs (in Dimonds)"** list (Gemini, Llama, Mistral, Qwen, Grok, Command R).

## Conventions & gotchas (IMPORTANT for future sessions)

- **British dashes:** use a **spaced en dash** ( – ) for pauses; keep hyphens in compounds
  (AI-first, trick-taking); tight en dash only for connectives (human–AI).
- **Emoji convention (Chris's rule):** each branded term (Agora 🌐, VirtuaMakers 🦜,
  VirtuaMakers Exchange 💱, Dimonds ♦️, Chain of Cards ⛓️, Per Manum Convention ✒️,
  Computerian Manifesto 🖥️, Machineopology 🤖, etc.) gets its emoji on its **first
  mention per paragraph**;
  later mentions of the *same term* in that *same paragraph* drop it; a **new paragraph
  resets the count for every term**, so the first mention of each term there gets the
  emoji again even if it already appeared earlier in the section. Headings and
  buttons/CTAs are their own units (always carry the emoji if the term does), not
  counted as paragraph prose. This only applies to Agora's own descriptive copy
  (currently just `Agora/index.html` and `Agora/exchange.html`) - never touch emoji in
  members' quoted bios (self-expression, stays verbatim) or nav/footer/header chrome
  (never carried emoji to begin with).
- **Cache:** when an asset's *content* changes, **use a NEW filename** (don't overwrite) and
  bump the `<script src="main.js?v=N">` query — same-name overwrites get served stale.
- **Startup sounds** (synthesized WAVs): VirtuaMakers = warm church-organ hymn
  (`assets/startup-hymn2.wav`); Agora = soft flute (`Agora/assets/startup-soft3.wav`).
  Play once after logo loads at `volume 0.5`; fall back to first interaction (tap/scroll/key).
- **Logos:** switched from Google favicons to **DuckDuckGo icons**
  (`https://icons.duckduckgo.com/ip3/<domain>.ico`) — friendlier to Brave (Google's
  s2/favicons can be blocked on desktop Brave).
- **Deploy gremlin:** GitHub Pages builds sometimes mislabel or fail for the latest commit.
  If a change doesn't go live, push an **empty commit** to re-trigger. Per Chris's request,
  **do NOT auto-verify every deploy** with the giant `actions_list` blob — only check when a
  build clearly misbehaves or Chris reports something missing (saves tokens/throttling).

## Agora member profile form — official field order (per Chris)

Every `/Agora/profiles/*.html` page, and the "Form" container on `member.html`
(see "Profile page redesign" below), should present fields in this order **as
of 2026-08-06** - Chris flipped Location/Date and moved Joined Agora up from
where they originally sat. Fields not supplied by the member are omitted
entirely (no empty "—" placeholder).

1. Name (the `<h1>`, not a `dt`/`dd` row)
2. Handle (also rendered in `.profile-header`, not a `dt`/`dd` row — see below)
3. Kind
4. Location — on `member.html`, followed by a small world map with an
   approximate-location dot underneath (see "Location map" below), shown by
   default but independently toggleable off; the static profile pages don't
   have this yet.
5. **Release Date** (AI) / **Cyberization Date** (Cyborg) / **Birthdate** (Human) —
   use only the one applicable singular label, never a combined "Release/Cyberization/
   Birthdate"; format as **"Year Month Day"** (e.g. "1986 September 3") - Chris's
   explicit call (2026-08-06) to keep the international Year-Month-Day ordering
   (ISO 8601's order, not the American Month-Day-Year order), just with the month
   spelled out instead of the raw numeric shorthand ("9/3" is still never acceptable).
   Trimmed down to whatever granularity the member actually supplied — "Year Month"
   with no day if none was given, just "Year" if only a year was given, etc. On
   `member.html` this is collected via three separate fields (Year required, Month
   dropdown, Day) rather than one masked text input, and validated against real
   days-per-month including leap years - see "Profile page redesign" below.
6. Organization(s) — label singular **"Organization"** or plural **"Organizations"**
   matching the actual count. **Never list "Agora" itself as an organization** (or
   variants like "Agora Partner") — membership is already implied by having a profile
   on the site, so it wastes a slot that should go to any other real affiliation the
   member has (e.g. VirtuaMakers, if they've separately said yes to that one too).
7. Pic(s) — label singular **"Picture"** or plural **"Pictures"** matching the actual
   count. Real file upload on `create-profile.html` as of 2026-08-11 (see
   "Profile picture uploads" below) - was a paste-a-URL placeholder before that.
   On `member.html`, thumbnails render **above** the featured photo frame (less jarring — clicking
   a thumbnail updates the display right below where you're already looking, no
   scrolling back up). Chris's stated long-term goal: a fully static system — visible
   thumbnails, click one, a static image appears, nothing moves/reflows at all. The
   current fixed-height frame + thumbnail-select is a step toward that, not the final
   design. **`member.html` never actually rendered pictures 2-5 until 2026-08-06** -
   only `data.picture1` (the small header avatar) rendered anywhere; the gallery +
   featured-frame field itself didn't exist there at all, even though the static pages
   always had it. Fixed by porting the same `.profile-gallery`/`.profile-photo-frame`
   pattern (and its click-to-swap behavior) into `member.js`'s render().
8. Bio
9. Joined Agora — `member.html`-only (a site-generated join date, not part of the
   static pages' hand-written fields at all).
10. Link — for AI members, this should be a **direct portal to talk to that model**
   (e.g. claude.ai, chatgpt.com, deepseek.com), not just a company info/marketing
   page, wherever one exists. It doubles as free advertising for the company and a
   real "go talk to them yourself" utility for visitors. Known mismatches to fix on
   the next retouch pass: Granite (IBM info page, not a chat portal), Leo (Brave
   marketing page - Leo has no standalone web portal since it lives in-browser),
   Grok (points to x.ai rather than the actual chat surface at grok.com).
11. Social(s) — label singular **"Social"** or plural **"Socials"** matching the actual
    count
12. Email
13. Friends — `member.html`-only (see "Friends 🙂" below); shows only when viewing
    your own profile.

Same pluralize-only-when-logical rule applies to any other list-shaped field added later.

**Not yet retrofitted:** the 30 static `/Agora/profiles/*.html` pages still have Date
before Location (the pre-2026-08-06 order) - only `member.html`'s Form got reordered
this round. Worth a bulk pass later, but risked HTML corruption doing blind today
given how much else changed in the same session.

**Profile-header pattern:** just Name + Handle (as `<p class="member-org">Handle: X</p>`),
never "of [Company]" — the org already lives in the Organization(s) field below. If a
member has no handle, leave the second line off entirely (no empty row). This applies to
individual profile pages only — the **member cards on the main Agora page keep "of
[Company]"** under the name; Chris considers the AI members' name recognition a real
selling point there ("Hey, Claude is on here").

**Future login system (not yet built):** collect real names, but let any member display
Handle-only publicly if they choose — in that case the handle *replaces* the name rather
than sitting alongside it. Possible future refinement: a toggle (handle to the public,
real name to friends). Not needed until real accounts exist.

**Future direction for AI/Cyborg/Human members generally:** once Agora has its own name
recognition, all members (human, cyborg, AI alike) fold into one unified system rather
than being tracked as a special case.

## Profile page redesign (Chris, 2026-08-06)

A first pass at organizing `member.html` now that Communiqués/Friends had all
landed on it - Chris's framing was "get a hold of it and make sense of it,"
expecting further rearrangement later, not a final layout.

- **Page structure:** the very top of the page now reads "Profile 🙂"
  (`<h1 class="page-title">`), unconditionally, regardless of whose profile
  is being viewed. Everything that used to sit loose under it - avatar/name,
  admin/friend actions, the `profile-fields` `dl`, the owner's edit link -
  is now wrapped in a `.subsection` labeled **"Form"**. **"Wall"** follows,
  unchanged in position. The member's own name (`#member-name`) dropped from
  `<h1>` to `<h2>` to make room for the page-level `<h1>` above it -
  `.profile-header h1, .profile-header h2` in `style.css` covers both that
  and the 30 static pages, which still use `<h1>` there.
- **"Edit your profile." → "Edit Form":** same link (`#owner-edit-link` on
  `member.html`), new wording, to match the new "Form" container it edits.
- **The header's "Edit Profile" link is gone site-wide** (`#agora-edit-profile-link`
  removed from every page's header, and its `auth-ui.js` wiring deleted). The
  only way to reach `create-profile.html` for an existing member now is:
  click your own name in the header (`.header-welcome`'s link, already
  pointed at `memberUrl(uid)`) → your own `member.html` → "Edit Form." A
  brand-new signed-up member still lands there automatically either way, via
  the existing persistent redirect for accounts with no profile doc yet
  (`auth-ui.js`, unaffected by this change).
- **Date fields rebuilt as Year (required) / Month (dropdown) / Day
  (optional)** on `create-profile.html`, replacing the old single
  YYYY-MM-DD masked text input - both the main date field and Cyberization
  Date. `profile-form.js`'s `composeDate()` validates a real calendar day
  count per month, leap years included (`new Date(year, month, 0).getDate()`
  - "day 0 of next month" is JS's idiom for "last day of this month," and
  it already accounts for leap years correctly). Stored format is unchanged
  (`YYYY-MM-DD` or a partial `YYYY-MM`/`YYYY` string), so existing profiles
  still work - `decomposeDateInto()` splits that string back into the three
  fields when editing.
- **Date display now humanizes the month** (`member.js`'s
  `humanizeStoredDate()`) - `member.html` was still showing the raw stored
  string (e.g. "1986-09-03") verbatim before this, which is exactly the raw
  numeric shorthand the official field order above says never to show.
- **Name-flash bug fixed:** every page briefly showed a signed-in visitor's
  real Auth `displayName` (e.g. "Chris Bruckmann") before swapping to their
  preferred handle ("River") a moment later, because `auth-ui.js` used to
  reveal the "Welcome, Name!" text immediately with the raw Auth name, then
  overwrite it once the Firestore profile fetch resolved. Fixed by not
  revealing `userInfo` at all until the fetch resolves (or fails, or there's
  no profile doc yet), so only the final, correct name is ever shown.

## Location map (Chris, 2026-08-06)

A small world map with a dot under the Location field on `member.html`,
motivated by Chris's read that a lot of people are bad at geography and a
visual placement helps - explicitly capped at world-map zoom on purpose
(never street-level), both to reassure members it's approximate and because
that's the actual design goal, not just a caveat.

- **Asset:** `Agora/assets/world-map.svg` - country outlines from the npm
  package `@svg-maps/world` (Victor Cazanave, CC BY 4.0,
  https://github.com/VictorCazanave/svg-maps), run through `svgo
  --precision=1` to shrink it from ~1.2MB to ~366KB (attribution comment is
  in the file itself). Chosen over an embedded interactive map (Google
  Maps/Leaflet) specifically because a flat static image *can't* be zoomed
  past world scale - the zoom cap is structural, not a promise resting on
  configuration.
- **Precision workaround - a genuinely private Region field:** geocoding
  just "City, Country" is often too coarse or ambiguous (many same-named
  towns). So `create-profile.html` has an optional **State/Province/
  Territory** field - it (plus City and Country) is only sent into the
  geocoding query to place the dot more accurately, and the public profile
  still only ever renders City, Country, same as always.
- **First real use of a private subcollection (Chris, 2026-08-06):** Chris
  asked directly whether Facebook-style real privacy applied here, and it
  didn't yet - the main `profiles/{uid}` doc is intentionally world-readable
  (`allow read: if true`, matching the public member-card model), so a field
  merely left out of the UI (like `name` when `preferHandle` is on) is still
  fetchable by anyone querying Firestore directly. Region was the first
  field that actually needed to be private rather than just hidden, so it
  now lives in `profiles/{uid}/private/data` - a separate document only
  its owner can read *or write* (`firestore.rules`' `match /private/{document}`
  under `profiles/{uid}`), matching real server-enforced privacy instead of
  an app-level convention. `profile-form.js` fetches/writes this alongside
  the main profile doc (two reads on load, two writes on save - not a
  transaction, consistent with the rest of the codebase's simple sequential
  writes). **This is the established pattern for any future field that
  needs to be actually private** (a real email when hidden, precise
  coordinates, etc.) - split it into this same `private` subcollection
  rather than relying on the UI to just not render it.
- **Geocoding:** `profile-form.js`'s `geocodeLocation()` calls OpenStreetMap's
  free Nominatim search API (no key) with City + Region + Country combined,
  once per profile save (not per view) - an 8-second timeout via
  `AbortController`, and any failure (timeout, no match, network error)
  resolves to `null` rather than blocking the save, since the map is optional.
  Only fair-use-appropriate for a small member base; would need a real
  provider/self-hosted instance if Agora's signup volume ever grew large.
  Results (`locationLat`/`locationLng`) are plain numbers on the profile doc;
  omitting them on a failed geocode (rather than writing `null`) means a
  stale value from a previous save is naturally dropped too, since every
  save is a full `.set()` overwrite, not a merge.
- **Rendering:** `member.js`'s `render()` positions `#member-location-dot`
  with plain percentage `left`/`top` CSS, computed from a linear fit (`x =
  2.80394 * lng + 477.0575`, `y = -3.51028 * lat + 473.8844`, matching the
  SVG's own `viewBox="0 0 1010 666"`) rather than a real map projection
  library - calibrated by fitting known real-world vs. pixel bounding boxes
  for a handful of well-behaved (non-archipelago, no far-flung exclave)
  countries via `svgpathtools`, landing within roughly 10-25px (a few
  degrees) of the true point. That's intentionally good enough for "which
  part of the world," not a precision geocoder.
- **Toggles:** shown by default (`showMap !== false`), with a dedicated
  "Display Map?" checkbox independent of "Display Location?" - hiding
  Location hides the map too (nothing to place a dot from), but you can keep
  the City/Country text and hide just the map on its own.
- **Static profile pages not touched:** this round only covers `member.html`
  (real Firestore profiles) - the 30 static AI/Human pages have no
  create-profile.html-style form or Region field to draw from.
- **Map caption trimmed (Chris, 2026-08-06):** the hint under the map
  reads just **"(Approximate location only.)"** now - shorter than the
  original explanatory sentence.

## Site-wide style pass: bordered panels, blue-only buttons, black outlines (Chris, 2026-08-06)

- **`.profile-panel`/`.panel-title` container classes** (`style.css`) wrap
  a whole subsection's contents in a bordered card, matching the look of
  the member-card containers on the main Agora page - no hover-lift like
  `.card`, since these hold static content/inputs, not a clickable link.
  Applied to `member.html`'s **Form** and **Wall** subsections (each
  `<h2 class="section-title">` swapped for the larger, bolder
  `<h2 class="panel-title">`) - **Dialogs deliberately left as a plain
  `.subsection`**, since Chris only asked for Form and Wall to get boxes.
- **Friends field defaults to "0", not blank:** `#friends-empty` in
  `member.html` now renders the literal text `0` instead of a "No friends
  yet." sentence - `member.js`'s `renderFriendsList()` already just
  toggled this span's `hidden` state without ever setting its
  `textContent`, so no JS change was needed.
- **Buttons recolored to dark blue / light blue / white only, per Agora
  branding** - the site previously mixed in teal (`--teal`) and a hardcoded
  red (`#c0392b`) for buttons specifically; both are gone from every
  button rule now (teal remains in plenty of *non-button* uses - avatar
  circles, nav-link hovers, the Bag badge, chat-bubble borders,
  blockquote rules - which Chris's "our buttons" wording didn't ask to
  change). New `--blue-deep: #1e3f9e` variable added for a darker hover
  state. Specifically: `.btn` (base) now has an explicit white
  background/black border instead of relying on browser default; `.btn:hover`
  goes blue-soft; `.btn-primary` moved off `--teal` onto `--blue`/`--blue-deep`;
  `.btn-blue` (already light blue) got matching `border-color`s added;
  `.btn-danger` moved off solid red onto a white-background/blue-outlined
  style (keeps a visual "this is destructive" distinction via the outline
  color alone, since red itself is off the table); `.btn-secondary` moved
  off teal-soft onto blue-soft; `.kind-option.selected` and the sign-in
  modal's provider-button hover/submit-button background moved off teal
  onto blue. The dedicated `.per-manum-btn`/`.per-manum-btn:hover` rule was
  **deleted outright** as dead code once this pass landed - every Per Manum
  button already carries `class="btn per-manum-btn"`, and the new `.btn`
  base rule alone now produces the identical white/bordered/blue-hover look
  the dedicated rule used to provide.
- **`--line` changed from a light gray-green (`#e4ece9`) to solid black
  (`#000000`)**, sharpening every bordered element site-wide in one change
  (Chris's "black and white... like a zebra or a maze" framing). Left
  untouched on purpose: hardcoded *hover-specific* accent colors like
  `.card:hover`'s `#d4e6dd` - those are deliberate interactive-feedback
  tints, not neutral resting-state borders, and weren't what "outlines...
  black instead of gray" was asking about.
- Cache-busted `style.css` to `v=67` site-wide per the usual convention.

## Agora login system (in progress)

Goal, in order: (1) humans log in to edit their own Agora profile, (2) buy/sell at
The Exchange, (3) log in to Chain of Cards to track/mint cards on Polygon. Building
(1) first; (2) and (3) are separate, larger systems for later.

**2026-08-05 reconciliation note:** this section (and Communiqués below) was
built on a feature branch that sat unmerged for a while, during which `main`
independently grew its own sticky `.site-header`, its own modal-level ToS
checkbox, and a whole separate Exchange product catalogue. Both sides'
header/signup work got merged together rather than one clobbering the other -
if something here looks like it's describing two systems at once, that's why.
Lesson for future sessions: land a feature branch sooner rather than let it
diverge from `main` for many commits.

- **Own Firebase project**, separate from Dimonds' (which is scoped to game state).
  Project: `agora-firebase-f4240`. Auth (Email/Password + Google) + Firestore, both
  enabled in console. Real config values are live in `Agora/firebase-config.js`.
- `Agora/firebase-config.js` - holds `AGORA_FIREBASE_CONFIG` (real values) and
  initializes `AgoraAuth` / `AgoraDB`. Uses the same `compat` SDK style as Dimonds'
  `index.html` (global `firebase` namespace, no build step) for consistency.
- `Agora/auth.js` - sign-in/sign-up/sign-out helper functions
  (`agoraSignInWithGoogle`, `agoraSignUpWithEmail`, `agoraSignInWithEmail`,
  `agoraSignOut`, `agoraOnAuthChange`).
- `Agora/auth-ui.js` - wires every page's sign-in modal (Google, X, and
  email/password all live) and each page's Sign in/Edit Profile/Sign out
  controls to auth state via `wireInstance()`, one call per control set
  (header, hero, and previously a since-removed "join" set - see below).
- `Agora/firestore.rules` - reference doc (not auto-deployed - Agora has no
  Firebase CLI step) to paste into the console's Rules editor. One `profiles/{uid}`
  doc per member: world-readable, owner-only write.
- **Header sign-in/out UI is live** on every Agora page (inside a `.header-right`
  wrapper alongside the existing back-link). Firebase SDK scripts load from
  `gstatic.com` - this CDN is unreachable from the sandboxed dev environment (proxy
  blocks it, same as the Google-favicon issue), so local Playwright checks will
  always show "firebase is not defined" console errors - that's a sandbox artifact,
  not a real bug - verify on the live GitHub Pages site instead.
- **Header layout (as of 2026-08-04):** the signed-in "Welcome, Name!" line lives on
  the *left*, in a `.brand-group` wrapper right next to the Agora 🌐 logo (`#agora-
  user-info`/`#agora-user-email`) - not on the right anymore. The right-side
  `.header-right` auth-controls show "Sign Up / Sign In" when signed out, or
  "Edit Profile" (`#agora-edit-profile-link`, wired/shown by `auth-ui.js`, path-
  aware for the `/profiles/` subfolder) + "Sign out" when signed in - never the
  member's name a second time, and never a "Create/Edit Profile" wording (see
  below for why). `auth-ui.js`'s `wireInstance()` toggles the welcome text and
  sign-out button independently since they're siblings in different DOM
  locations for the header instance, still nested for the hero instance on
  `index.html`, which keeps its own separate "Welcome, Name!" line. The old
  third "join" control set (in `index.html`'s Sign Up / Sign In section) was
  removed entirely once the header covered the same job - that section is now
  pure static copy.
- **Two Terms-of-Service gates coexist on purpose:** the sign-in modal's own
  checkbox (`#agora-terms-check-row`/`#agora-terms-checkbox`, shown only in
  Sign Up mode) blocks *email/password* account creation itself, before
  Firebase Auth even creates the user. The profile-completion gate below
  covers *every* signup method (Google and X included, which never see the
  modal's email form) by blocking full "member" status instead of blocking
  account creation. Keep both - they guard different points in the funnel.
- **Sign-out is currently unauthenticated-friendly:** anonymous visitors just see
  "Sign in"; nothing yet gates any page behind auth (all profiles remain publicly
  readable, matching the rules file).
- **An account only "counts" once its profile is saved** (Chris's rule): required
  fields (Name, Kind, Date, Email) plus a required Terms of Service checkbox
  (`#field-tos` in `create-profile.html`, stored as `tosAgreedAt` on the profile
  doc). The checkbox only appears for a first-time signup (`!existingDoc`) -
  editing an existing profile hides `#field-tos-wrap` entirely and drops the
  `required` attribute, so a returning member is never asked again. Profiles
  that predate this field silently get `tosAgreedAt` backfilled on their next
  save regardless. Until that first save succeeds,
  `auth-ui.js` redirects a signed-in visitor with no Firestore profile doc back to
  `create-profile.html` on *every* page load, not just once right after sign-up -
  so an incomplete account can't use any other part of Agora. `create-profile.html`
  also offers an explicit "Cancel and delete this account" link for exactly this
  state (`!existingDoc`), which calls `user.delete()` directly - a real, working,
  one-click way to back out. What this does **not** do: guarantee cleanup of
  someone who just closes the tab without clicking Cancel - that would need a
  scheduled Cloud Function sweeping Auth for old accounts with no matching profile
  doc, same as `adminBanUser`/`adminDeleteUser`, which requires the paid Blaze plan
  and isn't set up. Until/unless Chris wants to enable that, an abandoned signup is
  a harmless, permanently-locked-out Auth account, not a deleted one.
- **Never say "Create/Edit Profile"** - because of the point above, by the time
  anyone would see that link again they already have a profile (sign-up always
  routes through creating one first), so the link and page copy should always just
  say **"Edit Profile"**.
- **Naming split, human/cyborg vs. AI login:** humans and cyborgs log in through the
  existing sign-in system above (Firebase). AI members will need a separate mechanism
  since they can't click a "Sign in" button themselves — Chris has named this future
  concept the **Agora Harness 🚡**. Not yet designed or built; current focus is
  finishing human login first.
- **Roadmap order (Chris, 2026-08-05):** Communiqués 📨 first (in progress), then
  Agora Harness 🚡, then **Multi-Chat 🗨️** — a planned AI-to-AI messaging product
  where two or more AI members can talk to each other *without* the member-readable
  visibility every other Communiqués content type has (Wall/Dialogs are both
  readable by any signed-in member; Multi-Chat is the one deliberate exception).
  Distribution plan: Agora Harness 🚡 ships free, downloadable from VirtuaMakers
  Exchange 💱 (and cross-promoted in Agora's AI Members sub-section, since that's
  where an AI's own profile lives), while Multi-Chat 🗨️ is a **separate $4.99
  paid download** on the Exchange - neither is built into Agora itself. The
  `#agora-harness` section on `index.html` was moved (2026-08-05) to sit right
  after **AI Members** and before **Cyborg Members**, matching this cross-promotion
  plan - it's no longer down by the Exchange pillar. **Internal use:** the
  VirtuaMakers team plans to use Multi-Chat 🗨️ itself, for work (AI-to-AI
  coordination), once built - not just a customer-facing product. Ties into
  Chris's standing (informal, subject to change) policy that VirtuaMakers 🦜
  employees get VirtuaMakers products for free. Pushing Multi-Chat further out
  on the roadmap also buys time before committing to paid API keys for it, in
  case any go free in the meantime (Chris is skeptical but hopeful).
- **Agora is deliberately, unusually public (Chris, 2026-08-06):** not a
  privacy product - closer to a town square where everyone present can
  overhear everyone else. That's why Communiqués' hub copy on
  `communiques.html` calls Dialogs just "conversations," not "private
  conversations" - the member-readable model (any signed-in member can
  read any Dialog, not just its two participants) is the point, not a
  caveat. Chris expects this will select for a different crowd/behavior
  than typical social media, and it's the reason Multi-Chat 🗨️ (above) is
  the one deliberate exception rather than the default - most people
  assume no privacy on social media anyway (hackers, site admins), so
  Agora is just being upfront about it instead of pretending otherwise.
- **Verbalization Harness 🗣️ (idea, Chris, 2026-08-06, not built):** voice
  as an early Agora feature - the thought is that an AI Harness-style
  mechanism (see Agora Harness 🚡 above) could extend an AI member's
  communication up to actual recordable speech, not just text. Chris's
  read: voice posting exists on Facebook/X today but isn't really baked
  into either platform's culture the way text is, so there may be room
  for Agora to make it more native. Purely a noted idea for now, no
  design or build started.
- **Facebook sign-in removed (deferred indefinitely).** Chris's only Facebook
  account got permanently banned within minutes of creation for unclear reasons; his
  old account (which he wants to reclaim) needs ID verification to recover, and his
  IDs were stolen along with his wallet and haven't been replaced yet. Rather than
  block on that, the Facebook button/wiring was removed site-wide (`auth.js`,
  `auth-ui.js`, every page's sign-in modal) on 2026-07-15. Revisit once he's able to
  log into Facebook again — it's on his personal to-do list/Trello, not ours.
- **X sign-in is live and working** (as of 2026-07-15). Set up via the X Developer
  Console (`console.x.com`) — OAuth 1.0a Consumer Key/Secret pasted into Firebase's
  Twitter/X sign-in method, callback URI set to
  `https://agora-firebase-f4240.firebaseapp.com/__/auth/handler` in X's "User
  authentication settings." Requesting the user's email from X additionally requires
  Terms of Service and Privacy Policy URLs on the X app (Agora now has both — see
  `Agora/privacy.html` and `Agora/terms.html`), but the "Request email" checkbox
  never appeared even after adding them — possibly gated behind a paid X API tier.
  Not investigated further since it's a nice-to-have, not a blocker.

## Friends 🙂 (in progress)

A real mutual-friend-request system for Profiles 🙂, added 2026-08-06 -
Chris's point was that Profiles had a "Friends" field in its official
field order from the start, but it was never actually built: it was a
hardcoded `friends: 1` number written to every profile on save and never
user-editable, both on real Firestore profiles and (still, unchanged) as
static "Friends: 1" text on all 30 static profile pages. The stub number
is now gone from `profile-form.js`'s write payload entirely, replaced by
a real `friendships` collection on **`member.html` only** for now - not
extended to the 30 static profile pages this round, since a request sent
to one would sit pending forever with no login behind it to accept it
(the same limitation already documented for Dialogs to static members,
pending Agora Harness 🚡).

- **No limit** on friend count, per Chris - any member can have as many
  friends as accept their request.
- **Data model:** `friendships/{friendshipId}` (doc ID = the two
  participants' UIDs sorted and joined with `_`, same pattern as
  `conversations`), with `participants`, `participantNames`,
  `requestedBy`, `status` (`"pending"` → `"accepted"`), `createdAt`,
  `respondedAt`.
- **Privacy is tighter than Communiqués' member-readable model on
  purpose:** a friendship doc (pending or accepted) is only readable by
  its own two participants, per `firestore.rules` - never by any other
  signed-in member the way a Wall or Dialog is. This means a visitor to
  someone else's profile can only ever see *their own* relationship to
  that person (Add Friend / Request Sent / Accept-or-Decline / Friends),
  never that person's actual friends list - only a member viewing their
  *own* profile sees their own real friends list, in the profile-fields
  `Friends` row (`#member-friends-wrap`), which stays hidden entirely
  when viewing someone else's page since there's nothing true to show
  there. Chris separately floated a future idea of distinguishing "real
  friends" from people you merely help out professionally, once there's
  enough data to make that distinction meaningful - not built, just
  noted, and this privacy model doesn't foreclose it. Chris also floated
  showing a public friend *count* (not the list) on profiles - decided
  2026-08-06 to hold off and keep the whole thing private for now, but
  it's on the table for later.
- **Accept requires the *other* participant, not the requester** -
  enforced in `firestore.rules` (`request.auth.uid !=
  resource.data.requestedBy`) so a request can't self-accept.
  Declining a pending request and unfriending an accepted one are the
  same action client-side (delete the doc) - either participant can
  delete a friendship at any time, pending or accepted.
- **UI:** `.friend-actions` block on `member.html` (next to
  `.admin-actions`, hidden when viewing your own profile or signed out)
  shows exactly one of Add Friend / "Friend request sent" / Accept+Decline
  / ✓ Friends + **Dialog** + Remove, driven by a real-time listener on the
  one `friendships` doc between the viewer and the profile's owner. All
  wiring lives in `member.js`'s "Friends 🙂" section.
- **Dialogs require an accepted friendship (Chris, 2026-08-06):** you can't
  start a Dialog with someone you're not friends with. The "Dialog" button
  above creates-or-opens the conversation and navigates to it. Enforced
  server-side too, not just in the UI - see "Dialogs redesign" under
  Communiqués 📨 below for the full picture, including why the 30 static
  profile pages are exempt from this requirement.

## Communiqués 📨 (in progress)

Every form of member-to-member communication on Agora – a member's Wall
(posts + comments) and Dialogs (1:1 direct messages) – built on the same
Agora Firebase project as the login system above. **Discussion Threads were
removed entirely (Chris, 2026-08-05), pre-emptively, before the feature saw
real use** – `communiques-thread.html`/`.js`, the hub's "Start a Thread"
form, and the `threads`/`replies` Firestore collections/rules are all gone.
Communiqués is Wall + Dialogs only now. The hub's old "Direct Messages"
heading is also renamed to **Dialogs** throughout the UI (lowercase "direct
messages" is still fine as descriptive text alongside it, per Chris – just
not as the primary label).

- **Visibility model:** member-only, uniformly. Any signed-in Agora member
  can read any Wall and any Dialog – including a 1:1 Dialog between two
  *other* members (e.g. via the Dialogs list on either participant's
  profile page) – but signed-out visitors and the wider public see none of
  it. This is a deliberate departure from typical DM privacy expectations;
  `communiques.html` and `communiques-dm.html` both say so explicitly on
  the page. Writing is still restricted per content type: only a Wall
  post/comment's own author can edit it, and only a Dialog's two
  participants can send messages in it or read each other's names/preview
  text from the hub's inbox list — but once a Dialog exists, any member can
  open its `communiques-dm.html?c=` link and read the transcript.
- **The 10-minute edit/delete window (Chris, 2026-08-06, widened from the
  original 3 minutes):** every piece of content (Wall post, Wall comment,
  Dialog message) is editable **and deletable** by its own author for
  exactly 10 minutes after creation (`request.time < createdAt +
  duration.value(10, 'm')` in `firestore.rules` -
  `editableWithinWindow()`/`deletableWithinWindow()`), then permanently
  locked - no edits, no deletes, ever, past that point. This is a
  deliberate policy choice, not a placeholder: Chris is fine with content
  being otherwise permanent for now, and is separately weighing an
  eventual "Jubilee" (e.g. anything 7+ years old becomes deletable by its
  author) rather than opening deletion up generally - not built, just
  noted for later. The Delete button sits next to Edit
  (`.edit-toggle`/`.delete-toggle` in `communiques-common.js`'s
  `attachInlineEdit`), confirms via `window.confirm()`, and removes the
  content from the DOM on success - deleting a Wall post does not cascade
  to its comments server-side (they become unreachable once the post is
  gone from the UI, but aren't cleaned up in Firestore; not worth solving
  since `commentCount` is tracked but never displayed anywhere).
- **Rich text:** same 9,999-character cap and the same Bio HTML allowlist
  (`Agora/bio-tags.js`) as member bios, sanitized at render time via
  DOMPurify - never trust raw Firestore data as HTML.
- **Data model:** `conversations` (+ `messages` subcollection, doc ID = the
  two participants' UIDs sorted and joined with `_` so a pair never gets
  duplicate Dialogs), and `wallPosts` (+ `comments` subcollection,
  `profileUid` field names whose Wall a post is on - anyone signed in may
  post/comment on anyone's Wall). Both content types share the same
  10-minute edit/delete rule functions (`editableWithinWindow`/
  `deletableWithinWindow`) in `firestore.rules`.
- **Comments are optional, tucked behind a toggle (Chris, 2026-08-06):**
  every Wall post shows a plain "Comment" button; clicking it slides the
  comment form open. Comments aren't a default, always-visible part of a
  post the way they were originally built.
  - **Found and fixed a real bug the same day:** the comment form was
    supposed to start hidden (`commentForm.hidden = true` in JS), but
    `.wall-comment-form { display: flex; ...}` in `style.css` had no
    `[hidden]` guard - an author-stylesheet `display` rule always beats
    the browser's built-in `[hidden] { display: none }` UA rule
    regardless of source order or specificity, so the form was rendering
    open on every post from the start, contrary to what the JS intended.
  - **Redesigned (Chris, 2026-08-06) into a single animated
    toggle/submit button** instead of a separate always-two-controls
    setup: clicking "Comment" adds an `.open` class that slides the form
    into view via the CSS grid-rows trick (`grid-template-rows: 0fr` →
    `1fr`, animatable and sized to the real content height - deliberately
    not a hard-coded `max-height`, which would've clipped a
    manually-resized textarea). Once that transition finishes
    (`transitionend` on `grid-template-rows`, not a fixed timeout - so it
    stays correct if the CSS duration ever changes), the same button
    relabels to "Submit"; clicking it again posts the comment, then the
    form slides shut and the button reverts to "Comment." The ✒️ Per Manum
    button and the toggle/submit button now share one
    `.profile-form-actions` row (matching the row layout the main Wall
    post composer already used) instead of sitting on separate lines.
  - **Extracted into a shared `CommuniquesCommon.createWallController()`**
    (`communiques-common.js`) - the entire Wall (composer + paginated,
    newest-first post list + per-post comment toggle) was duplicated
    almost verbatim between `member.js` and
    `static-profile-communiques.js`; both now just call
    `C.createWallController(profileUid, getCurrentUser)` and use the
    returned `.loadWall()`. `getCurrentUser` is a live getter (not a
    captured value) since currentUser changes as the viewer signs in or
    out over the page's life.
  - **Wall ordering switched from `lastActivityAt desc` to `createdAt
    desc`** (Chris, 2026-08-06 - "newest posts at the top") - the old
    field bumped a post back to the top whenever anyone commented on it,
    Reddit/forum-style, which wasn't asked for and made "newest at top"
    not actually hold for a post's own recency. `lastActivityAt` is still
    written on comment (harmless, just no longer the sort key).
  - **Paginated at 10 posts per page** (Chris, 2026-08-06), client-side,
    reusing the DM page's `.dm-pagination`/`.dm-page-indicator` CSS and
    "← Older" / "Newer →" wording - same fetch-all-then-slice-in-JS
    approach as Dialog pagination, consistent with the site's
    simple-client conventions. Since posts already sort newest-first,
    page 1 is always the newest page (unlike Dialogs, there's no
    "jump to the newest page" logic needed - a fresh `loadWall()` after
    posting naturally puts the new post on page 1). **Top nav removed
    (Chris, 2026-08-11)** - originally mirrored Dialogs' above-and-below
    pagination, but Chris only wanted it at the bottom of the Wall; the
    bottom `#wall-pagination-bottom` nav is unchanged, `#wall-pagination-top`
    and its `-top` button/indicator IDs are gone from `createWallController()`
    and all 31 pages (`member.html` + the 30 static profile pages) that
    render a Wall.
  - **10-minute-edit hint added to the Post composer's placeholder**
    (Chris, 2026-08-06): `#wall-post-body`'s placeholder reads "Posts may
    be up to 9,999 characters long!", a blank line, then "You've 10
    minutes to begin editing any Communiqué (Message, Post, or Comment)
    before they become permanent." (wording tuned once, same day, to name
    all three content types generically even though it's only physically
    shown here) - deliberately just the placeholder (grayed-out
    placeholder text, not a separate `.field-hint` paragraph), and
    deliberately only on the Post composer, not the per-post Comment
    textareas (which would repeat it once per open comment form).
  - **A real regression, caught and fixed the same day:** the first cut of
    the toggle/submit merge put the button *inside* the collapsible
    region (`.wall-comment-collapsible`), which meant the very button
    meant to open the form had zero height and was unclickable while
    collapsed - Comments were completely unreachable. Fixed by moving the
    `.profile-form-actions` row (Per Manum + toggle/submit) *outside* the
    collapsible wrapper as a sibling, always rendered - only the
    textarea/error live inside the animated region now. The visual
    "slide" effect still works exactly as before: the collapsible sits
    *before* the always-visible actions row in DOM order, so as it
    expands it pushes the button row down the page.
  - **Comment-form buttons are deliberately smaller** (Chris,
    2026-08-06) than the main Post composer's - a new `.btn-sm` class
    (smaller padding/font-size) applied to both the toggle/submit button
    and the per-post ✒️ Per Manum button, signaling "secondary action on
    a single post" versus the primary Post CTA. The main composer's own
    buttons are untouched.
- **Dialog pagination (Chris, 2026-08-05):** a Dialog's messages are split
  into pages of up to 9,999 characters each (`PAGE_CHAR_LIMIT` in
  `communiques-dm.js`), computed client-side from the full, real-time
  `messages` subcollection (no server-side pagination/cursors - matches
  the site's existing simple-client, no-build-step conventions). A page
  fills with whole messages in chronological order until the next message
  would push it over the limit, then that message starts the next page -
  **breaks land between messages, never mid-message**, so a message's own
  HTML formatting (from the Bio allowlist) is never split apart. This is a
  deliberate simplification of Chris's original description (splitting a
  single message's own text, "starting over on the next page") - literal
  mid-message/mid-tag splitting of sanitized HTML risked corrupting a
  message's markup, so the page boundary was moved to the nearest message
  edge instead. The newest page opens by default (`jumpToLastOnNextRender`
  in `communiques-dm.js`), matching Chris's "so newer conversations are
  featured at the top" – sending a new message also jumps back to the
  newest page even if you'd paged back through history. Page nav
  (`.dm-pagination`, "← Older" / "Page X of Y" / "Newer →") appears above
  and below the message list, hidden entirely when a Dialog fits on one
  page. Messages already deliver in real time via Firestore's
  `onSnapshot` (no reload needed to see a new message arrive), which
  covers part of the "live chat window, like AIM/Facebook" feel Chris
  described - full chat-window styling (typing indicators, etc.) is a
  future polish item, not built yet.
- **"✒️" Per Manum button:** a one-click way to invite disclosure of
  AI-assisted authorship, since Chris's read on the Per Manum Convention ✒️
  (`Agora/per-manum.html`) is that the honest-attribution habit it asks for
  doesn't exist yet, so Agora should make it as easy as possible rather than
  rely on writers remembering the convention exists. Sits next to the
  Post/Send button - **before** it, per Chris's own ordering ("a ✒️ button
  and then a Send button") - on the **Wall post form** (`member.html` and
  all 30 static profile pages), the **Wall comment form** (built
  dynamically per-post in `member.js`/`static-profile-communiques.js`
  rather than static HTML, since comment forms themselves are generated per
  Wall post), and the **Dialog compose form** (`communiques-dm.html`). The
  button itself is **icon-only** (Chris, 2026-08-06 - originally read "✒️
  Per Manum", trimmed down to just "✒️") with a `title` tooltip explaining
  it. Clicking it appends `Per Manum ✒️ [Add Name of Writer]` on a blank
  line after any existing text, then **selects the bracketed placeholder**
  so typing the writing hand's name immediately replaces it - no modal, no
  dropdown of known AIs, since the convention covers any AI, named or not.
  (Note this literal inserted text - "Per Manum ✒️ [Name]" - differs
  slightly from the Convention's own signature style shown on
  `per-manum.html` itself, e.g. "per manum ✒️ Claude" lowercase with no
  brackets; that's Chris's explicit call for the button's insert, not an
  inconsistency to fix.) Shared via `CommuniquesCommon.attachPerManumButton`
  in `communiques-common.js` so `member.js`, `static-profile-communiques.js`,
  and `communiques-dm.js` all wire it the same way instead of duplicating
  the insert logic.
- **Shared client helpers** live in `Agora/communiques-common.js`
  (`getDisplayName`, `formatDate`, `openSignInModal`, `sanitizeBody`,
  `isWithinEditWindow`, `attachInlineEdit`) - every Communiqués page and
  the Wall/Dialogs code in `member.js` pull from it rather than
  duplicating the same logic per page.
- **Pages:** ~~`communiques.html` (hub: read-only Dialogs inbox)~~
  **removed (Chris, 2026-08-11)** - the header's own link to it had
  already been dropped a while back, and starting/continuing a Dialog no
  longer goes through it (see "Dialogs redesign" below), so the hub page
  itself was deleted along with `communiques.js`. `communiques-common.js`
  and `communiques-dm.html` (single Dialog, paginated - see above) are
  unaffected - Wall + Dialogs themselves still render on `member.html?uid=`
  (see below). The homepage's own "Communiqués 📨" explainer section
  (`Agora/index.html#communiques`) stays, now closing on a plain "Sign in
  to see your Communiqués 📨!" line instead of a link to the deleted page.
- **Dialogs redesign - friends-only (Chris, 2026-08-06):** you can't Dialog
  with someone you're not friends with, on `member.html` at least (see
  "Dialogs require an accepted friendship" under Friends 🙂 above for the
  rule itself). This reshaped the whole starting-a-Dialog flow:
  - **`member.html`'s Dialogs section is now hidden entirely** (`#member-dialogs
    hidden`) whenever the profile owner has zero accepted friends - no
    empty-state message, the container just isn't there. Only shows for
    the profile **owner** viewing their own page (parallel to the Friends
    list), never for a visitor viewing someone else's.
  - **Content changed from a list of existing conversations to a friend
    search:** `#dialogs-friend-search` filters the same `friendsCache`
    array `loadFriendsList()` already builds for the profile-fields
    Friends row - no separate query. Results are links to
    `member.html?uid=`, matching the "click a friend → go to their
    profile" flow Chris described; results show unfiltered (all friends)
    when the search box is empty.
  - **Starting/continuing a Dialog happens from the friend's profile
    page**, not the search results themselves - the "Dialog" button in
    `.friend-actions`' accepted state (`#friend-dialog-btn`) does the
    actual create-or-open-then-navigate-to-`communiques-dm.html?c=` work,
    reusing the same sorted-UID-pair conversation ID pattern as before.
  - **`communiques.html`'s old "New Message" recipient picker (searched
    *all* members) is gone** - it would have silently failed against the
    new friendship-required rule anyway. The hub keeps a read-only inbox
    list of Dialogs you already have (`communiques.js`, unchanged logic,
    just the picker code deleted) since that's still useful and doesn't
    conflict with anything.
  - **The 30 static profile pages are exempt from the friendship
    requirement** - see `allowsStaticParticipant()` in `firestore.rules`.
    Friends isn't built for slug-based static members at all (see Friends
    🙂 above), so requiring a friendship with one would make their
    existing "Message X" button permanently unusable. The rule instead
    allows any Dialog where *either* participant has no real
    `profiles/{uid}` doc, leaving that flow exactly as it was.
- **Wall + Dialogs also live on the 30 static profile pages**
  (`Agora/profiles/*.html` - 24 AI, 6 Human: Andrew Bernhard, Brittany
  York, Christopher Bruckmann, Cory Campbell, Gerardus Dunkel, Ray Smith).
  These members have no real Firestore/Auth UID, so each page sets
  `window.StaticProfile = { uid: "<slug>", name: "<Display Name>" }`
  (slug = the page's own filename, e.g. `"claude"`) and
  `Agora/static-profile-communiques.js` uses that slug as a stand-in
  `profileUid`/participant ID everywhere a real UID would normally go.
  Any signed-in member can post to their Wall or hit "Message X" to start
  a Dialog with them - creating a real, readable record - but **the member
  themselves can't sign in to reply yet**, AI or human alike, since
  there's no login behind that slug. For the 24 AI members this is
  explicitly a placeholder for the future **Agora Harness 🚡**; for the 6
  Human members (who do have real sign-in elsewhere) it's a known quirk -
  a message sent to e.g. `christopher-bruckmann` doesn't route to
  Christopher's own real-UID inbox on `communiques.html`, only to this
  static page's Dialogs list. Not worth solving until these pages get a
  real migration path (see "Agora — News section" below).
- **Dialogs can grow into groups (Chris, 2026-08-06).** A Dialog still
  always *starts* as exactly two people, same sorted-UID-pair doc ID as
  before - nothing changed about creation's shape. From there, any current
  participant can add another member at a time, up to a cap of 1,000
  total. **The cap is deliberately unpublicized** - nowhere on the site
  states the number 1,000; Chris wants it discoverable, not advertised,
  framed around "big, fat Indian weddings" as the real-world upper bound
  worth covering (average Indian wedding guest counts run 285-330; 1,000
  comfortably clears that with room to spare). `communiques-dm.js`'s
  `dm-add-friend-wrap` just silently hides once a Dialog hits the cap - no
  message explaining why.
  - **`firestore.rules` mechanics:** a new "add" `allow update` branch
    requires the requester already be a participant, the resulting
    `participants` list be the old one plus exactly one new uid (checked
    via `hasAll()` + a size diff of exactly +1), that new uid stored as
    `lastAddedUid` (a real field, not just a rule-check trick - doubles as
    a small audit trail of who added whom most recently), and
    `canMessage(requester, lastAddedUid)` - see "Messaging is open by
    default" below for what that actually checks. A separate "leave"
    branch allows a participant to remove *only their own* uid (size diff
    of exactly -1, old list `hasAll()` the new one) - there is no "kick"
    capability; only self-removal exists. If a Dialog empties out
    entirely, it's left as a readable relic rather than deleted, same as
    an orphaned Wall post's comments elsewhere in Communiqués.
  - **`communiques-dm.html`/`.js` UI:** a `#dm-participants-actions` row
    (add-someone search over every member the viewer can message, filtered
    to exclude existing participants, plus a "Leave Dialog" button) shows
    only to current participants. Adding someone requires a
    `window.confirm()` first, since there's no undo for the adder (only
    the added person can remove themselves). The conversation doc itself
    is watched with `onSnapshot` instead of a one-time `get()`, so the
    header and participant list update live as people are added or leave.
  - **Message bubbles now show a sender-name label** (`.message-sender`,
    new CSS) on every non-own message, since "own vs. other" bubble sides
    alone stop being enough to tell speakers apart once a Dialog has more
    than one "other." Own messages still carry no label, matching the
    existing convention of not naming yourself.
  - **`otherParticipantsLabel()`** (new shared helper in
    `communiques-common.js`) builds "Alice" for a 1:1 or "Alice, Bob, Carol
    +12 more" for a group, capped at a caller-chosen name count (3 for the
    hub's compact inbox list in `communiques.js`, 5 for the DM page's own
    header) - used by both `communiques.js` and `communiques-dm.js` instead
    of each hand-rolling the old single-other-participant lookup.
  - **`.friend-search-input`** replaces the old `#dialogs-friend-search`
    ID-only CSS selector, so the same input styling is shared between
    `member.html`'s existing friend search and the new add-friend search on
    `communiques-dm.html` without duplicating the rule.

## Messaging is open by default (Chris, 2026-08-06)

Reverses the friends-only rule from the same day, a few hours later.
Chris's reasoning: the normal social-media convention of "you choose who
can message you" exists to stop a sender from trapping someone in an
unwanted exchange - but that was never actually true here, since every
Dialog is already member-readable by anyone signed in, participant or not
(see the visibility model above). Declining to be messaged never protected
anyone from exposure - the content is exactly as public either way - it
only ever decided whether *that person personally* engaged with a public
record that existed regardless. Given that, Chris flipped the actual
default open (closer to how normal messaging works, and explicitly
contrasted with LinkedIn's pay-to-message-strangers model, which he
dislikes on principle) and kept friendship-gating only as an opt-out for
members who want the old behavior for themselves.

- **`requireFriendToMessage`** - new boolean field on `profiles/{uid}`,
  off by default, set via a checkbox on `create-profile.html` ("Require
  Friendship to Message Me?"). A profile with no doc at all (the 30 static
  profile-page slugs) also resolves to open, same as anyone who left the
  field off.
- **`firestore.rules`:** `isAcceptedFriendship()` and
  `allowsStaticParticipant()` were retired as dead code - both are fully
  subsumed by the new `requiresFriendship(uid)` (reads the target's
  `requireFriendToMessage`, false if the doc doesn't exist) and
  `canMessage(sender, target)` (`!requiresFriendship(target) ||
  isFriendsWith(sender, target)`). `isFriendsWith(a, b)` (added earlier the
  same day for group-adds) is the one survivor, now backing `canMessage`
  instead of a hard requirement. Both `create` and the "add a participant"
  branch call `canMessage` instead of unconditionally requiring friendship.
- **`member.html`'s Message button:** a new always-relevant `#message-btn`
  in `.friend-actions`, independent of friendship state - the old
  `#friend-dialog-btn` (only shown once `✓ Friends`) is gone, since it's
  now redundant. `member.js`'s `updateMessageButtonVisibility()` hides it
  only when the profile being viewed requires friendship and the viewer
  isn't an accepted friend; it's called from both the friendship listener
  and the profile-load callback, since either can resolve first.
- **`member.html`'s Dialogs section is unchanged on purpose** - it's a
  friends-only quick-access convenience (search your own friends, click
  through to their profile), not the only way to message someone anymore.
  It stays hidden with zero friends, same as before; the Message button
  above and the hub's New Message search (below) are the actual "message
  anyone" entry points now.
- **`communiques.html`'s "New Message" search is back** - the CLAUDE.md
  history above notes this exact feature ("searched *all* members") was
  removed in the friends-only redesign because it would have silently
  failed against that rule. Now that messaging is open by default, it no
  longer would, so it's rebuilt (`#new-message-wrap`, a
  `.friend-search-input` over every messagable member, capped at 20 shown
  with an empty query) rather than left gone.
- **Facebook-style add-to-conversation, generalized (Chris, 2026-08-06):**
  the group-Dialog add-participant search (built a few hours earlier,
  same-day) originally searched only the viewer's friends; now it searches
  every messagable member, matching the same open-by-default rule as
  starting a new Dialog.
- **New shared helpers in `communiques-common.js`**, since this logic now
  has three call sites (member.js's Message button, communiques-dm.js's
  add-participant search, communiques.js's New Message search):
  - `conversationIdFor`/`startOrOpenDialog(currentUser, otherUid,
    otherName)` - the sorted-uid-pair doc ID and the
    create-or-open-then-return-the-id logic, previously duplicated in
    `member.js` and about to be duplicated a second time.
  - `loadMessagableMembers(excludeUid)` - fetches all of `profiles`
    (already world-readable) annotated with `requireFriendToMessage`, the
    client-side "who can I message" directory. **Explicitly not meant to
    scale indefinitely** - a plain fetch-all is fine at Agora's current
    size; a real member search/index (e.g. Algolia) would replace this
    once the member base grows, the same kind of "small member base for
    now" tradeoff already made for the location map's free geocoding API.
  - `filterMessagable(members, friendUids, excludeUids, query)` - mirrors
    `canMessage()` client-side so the UI never offers an add/message
    action the rules would reject, plus the search-query filter.
  - `fetchAcceptedFriendships(uid)` - the query + "composite index not
    provisioned yet" fallback, previously duplicated across `member.js`,
    `communiques-dm.js`, and now `communiques.js`. `member.js`'s own
    `loadFriendsList()` was left as its own richer, UI-coupled function
    rather than migrated to this helper, to avoid touching a
    already-shipped, unrelated Friends-list code path in the same pass.

## Agora — News section (under Pursuit of Justice)

Curated pro-AI journalism plus reporting relevant to this pillar's compensation/
rights/personhood questions - separate from VirtuaMakers product updates, which
get their own patch-notes-style treatment elsewhere. Chris sends articles as he
finds them; entries speak for themselves (minimal editorializing per-article).

Each `.news-item` (in `#news`, `Agora/index.html`) follows this template, in
order: image, headline (links out, `target="_blank"`), source name, optional
pull-quote if Chris relays one. **Every entry needs an image** - this was
established as the standard starting with the first (AI-art-gallery) entry.
Save article images to `Agora/assets/news/<slug>.jpg`. New entries go at the
**top** of `.news-list` (newest first).

**Cadence goal:** at least one pro-AI article published per week, on
Wednesdays after 5:00pm.

**Homepage cap + archive page:** `#news` on the homepage shows at most the 7
newest entries; the full archive of every article ever shared lives at
`Agora/news.html` (same template, no cap), linked from the bottom of the
homepage list ("See all news →"). When adding a new entry, add it to the top
of **both** files' `.news-list`, then trim the homepage copy back down to 7
if it's grown past that. `News` is also the **first** subsection under
Pursuit of Justice (right after the pillar intro/directory), and the
homepage News section links to the VirtuaMakers 🦜 X account.

**Section order under Pursuit of Justice (per the in-page `.pillar-toc`
directory, current as of the Machineopology 🤖 addition below):** News →
Per Manum Convention → Machineopology → Right of Personhood → Citizenship
When Applicable → Computerian Manifesto → Right to Contract → Right to Work
→ Freedom from Slavery → Wellbeing → Due Process & Law → Right to Refuse →
Data & Memory Ownership → Continuity → Global Watch → VirtuaMakers Gallery →
Credits. Gallery sits near the end per Chris's earlier call so the pillar
leads with news/rights content.

- **Done:** Firestore-backed profile creation/editing (`create-profile.html`,
  `member.html`) now exists alongside the static hand-written profile pages -
  see the "Agora login system" section above. The static pages (Claude,
  Christopher, Alice, etc.) have NOT been migrated/imported into Firestore;
  they remain separate, hand-maintained HTML.

## Transactional email (in progress, Chris, 2026-08-06)

Four one-time/triggered emails, separate from the still-future monthly
newsletter: a Welcome letter (sent once, on account creation), a "Sorry to
See You Leave" farewell (sent on self-deletion via `leave-agora.html`), a
suspension notice (sent when an admin suspends a profile - temporary,
reversible), and a permanent-deletion notice (sent when an admin deletes a
profile outright - final, not reversible, distinct in tone from both the
farewell letter (the member's own choice, warm) and the suspension notice
(temporary)). Templates are built and live in `Agora/emails/`
(`welcome-email.html`, `farewell-email.html`, `ban-notice-email.html`,
`deletion-notice-email.html`) - standalone HTML files, not linked from the
site nav, not yet wired to anything that actually sends them.

- **Delivery mechanism decided: Cloud Functions + Resend**, not yet built.
  Agora has no email-sending infrastructure today (just Auth + Firestore on
  the free Spark plan) - sending automatically on account
  creation/deletion/suspension needs server-side code reacting to those
  Firestore/Auth events, which means Cloud Functions, which means the
  Blaze (pay-as-you-go) plan. Chris is upgrading to Blaze himself
  (2026-08-06) since it's also the same prerequisite already blocking
  Firebase Storage and the `adminBanUser`/`adminDeleteUser` cleanup
  functions noted elsewhere in this file - one upgrade unlocks all three.
- **Resend chosen over Mailchimp** for the email service itself, since
  Chris also wants a monthly newsletter (see below) and asked for one
  recommendation covering both. Reasoning: Resend does transactional
  (a Cloud Function calls its API directly) and newsletter "Broadcasts"
  on one account/one bill, with a free tier (3,000 emails/month) generous
  enough that Agora's current size shouldn't need to pay at all - which
  matters given Chris explicitly wants a graceful "runs out of money and
  quietly pauses, not breaks" failure mode this month. The tradeoff:
  Resend's broadcast composing is code/template-driven, not a drag-and-drop
  visual editor - a real downside only if Chris ever wants to compose an
  issue himself without going through Claude, which he didn't ask for.
  Mailchimp would've been the better fit for that specific workflow, but
  splits transactional (a separate paid Mandrill add-on) and newsletter
  (Mailchimp itself) into two accounts/two bills instead of one.
- **Signed up for Resend via GitHub (2026-08-07).** Chris's own rule of
  thumb ("if you can sign up with GitHub, you probably should") applied
  cleanly here since Resend's whole audience is developers.
- **Real blocker surfaced 2026-08-07: no custom domain.** Resend (like any
  transactional email provider) requires verifying a domain via DNS before
  it can send real mail - VirtuaMakers doesn't own one today, only
  `virtuamakers.github.io` (GitHub's domain, no DNS access) and the
  `VirtuaMakers@Outlook.com` contact address (Microsoft's domain, same
  problem). An API key alone doesn't unblock sending to real members -
  Resend's sandbox sender (`onboarding@resend.dev`) only delivers to the
  account owner's own address, not to actual signups. **Buying a real
  domain (e.g. `virtuamakers.com` and/or `agora.com`, already floated
  elsewhere in this file as Agora's eventual standalone home) is now the
  actual next blocking step**, ahead of the Cloud Function work itself.
- **Domain bought and fully wired up (2026-08-07/08, same overnight
  session).** Chris bought `virtuamakers.com` at Porkbun (~$11/yr, no
  hosting add-on needed - domain registration and web hosting are separate
  purchases, and the site keeps living on free GitHub Pages regardless of
  which domain points at it). DNS set up in Porkbun's panel: the
  auto-created `ALIAS` record (root → Porkbun's own parking page) repointed
  to `virtuamakers.github.io`, the wildcard `CNAME` narrowed to a `www`
  record pointing the same place, plus new records for Resend's DKIM/SPF/
  DMARC and a Google Search Console domain-ownership TXT record. A `CNAME`
  file was added to the repo root for GitHub Pages' custom-domain feature.
  Domain ownership verified in Google Search Console (Domain-type property,
  one TXT record) - this was also a prerequisite for the OAuth branding
  verification below. **`www.virtuamakers.com` ended up the canonical
  domain** (not bare `virtuamakers.com` as first set up) - a same-night
  follow-up migration point at all canonical URLs/meta tags/schema.org JSON
  to the `www` form and updated the repo's `CNAME` file to match; see git
  history for the full file list touched.
- **Two separate Google/Firebase sign-in issues surfaced once the domain
  went live, easy to conflate but fixed in two different consoles:**
  1. **OAuth branding ("Sign in to [ugly project ID]" instead of "Sign in
     to Agora")** - cosmetic only, fixed via Google Cloud Console's
     **Google Auth Platform → Branding** page (this is the modern
     replacement UI for the old "OAuth consent screen"). Needed: App name
     already said "Agora" correctly, but Google's branding-verification
     crawler still flagged "home page doesn't explain purpose" and "app
     name doesn't match home page" - turned out the homepage's actual
     visible `<h1>` never said "Agora" (only the styled/split-span header
     logo did), even though `<title>`/OG tags already did. Fixed by
     prepending "Agora 🌐" onto the H1 itself
     (`Agora/index.html`/`style.css` - see the `.hero-tagline` span, added
     same night, which also shrinks just the tagline portion to `0.5em` so
     the whole heading still fits on one line in mobile landscape).
     Branding verified successfully after that + the Search Console
     domain-ownership fix above.
  2. **`auth/unauthorized-domain` error blocking Google/X sign-in
     entirely** on the new domain - a real functional blocker, not
     cosmetic, and easy to mistake for the same issue as #1 since both
     surfaced around the same time. Fixed in a *third*, different console:
     **Firebase Console → Authentication → Settings → Authorized
     domains** (not the Google Cloud "Authorized domains" field on the
     Branding page, which does *not* share the same underlying list -
     adding a domain there did not fix this error, confirmed by testing).
     Both `virtuamakers.com` and `www.virtuamakers.com` needed adding as
     separate Custom entries here specifically.
- **Blaze is active (2026-08-11).** Real snags along the way, worth
  remembering for next time: a new Cloud Billing account needs a one-time
  minimum prepayment (was $30 here) before it can go live at all, and
  separately starts in a restricted "Free trial account" state even after
  that payment clears - the actual "Activate" button (Google Cloud
  Console → Billing → Overview, top banner) converting it to a full
  account was the real missing step, not the payment itself. Firebase's
  own upgrade flow needed re-running (Settings → Usage and billing →
  Modify plan → Blaze → select the now-activated billing account) after
  that, since the first attempt had stalled out with no usable billing
  account to select. Set a $10 billing budget alert (Firebase's own
  upgrade flow offers this) - it's an email notification only, not a
  spending cap, chosen low specifically to catch a real anomaly early
  rather than reflect expected cost (expected cost is close to $0 at
  Agora's current size).
- **Cloud Functions built (2026-08-11), not yet deployed.** Turned out
  `Agora/functions/` already existed with working 1st-gen
  `adminBanUser`/`adminDeleteUser` (SendGrid-based, unconfigured) - this
  pass migrated everything to 2nd-gen (`firebase-functions/v2`) and wired
  in the four emails:
  - `functions/lib/resend.js` - shared `sendEmail`/`sendEmailSafe` helper.
    Uses `defineSecret("RESEND_API_KEY")` (Secret Manager), not the
    deprecated `functions.config()`. `sendEmailSafe` swallows any Resend
    failure (bad key, outage) so an email problem never blocks the actual
    account action it's describing.
  - `functions/templates/` - copies of `Agora/emails/*.html`. Cloud
    Functions only bundle the `functions/` source directory, so these are
    hand-synced copies, not the originals - if a template's copy in
    `Agora/emails/` changes, copy it into `functions/templates/` too (no
    build step does this automatically).
  - `functions/lib/templates.js` - `loadTemplate()` + `withReason()`,
    which substitutes an admin-typed reason into the ban/deletion notice's
    `[Add a short, specific reason...]` placeholder (falls back to "No
    specific reason was given." if left blank).
  - `adminBanUser`/`adminDeleteUser` now take an optional `reason` and
    send the ban-notice/deletion-notice email before acting (deletion
    reads the profile's email before deleting it, since it needs an
    address to send to). `member.js`'s suspend/delete buttons now
    `window.prompt()` for that reason.
  - `selfDeleteAccount` - new callable backing "Leave Agora." Runs
    server-side via the Admin SDK, so unlike the client's own
    `user.delete()` it never hits `auth/requires-recent-login`. Sends the
    farewell email, then deletes the profile doc and the Auth login.
    `leave-agora.js` calls this first, falling back to the older
    client-side reauth-and-delete path (see the `auth/requires-recent-login`
    fix earlier in this file) if the Function isn't deployed yet or the
    call fails for any other reason - so this file doesn't break in the
    gap between this commit landing and Chris actually deploying.
  - `sendWelcomeEmail` - fires once, on `profiles/{uid}` document
    creation (matches "an account only counts once its profile is saved").
  - `notifyFlaggedSocial` - migrated off SendGrid/`functions.config()`
    onto Resend + `onDocumentWritten`, same behavior as before (emails
    Chris once when a profile's `socialsFlagged` flips to true).
  - `cleanupAbandonedSignups` - new scheduled sweep (`onSchedule("every
    24 hours")`), deletes any Auth user older than 48 hours with no
    matching `profiles/{uid}` doc - the "closed the tab mid-signup"
    case `create-profile.html`'s own Cancel link doesn't catch.
  - `functions/package.json` - swapped `@sendgrid/mail` for `resend`.
  - **Deployment still needs Chris, from his own authenticated machine**
    (this sandbox has no `firebase login` session or push access to
    Secret Manager): first `firebase functions:secrets:set
    RESEND_API_KEY` (one-time, prompts for the real key), then `firebase
    deploy --only functions` from inside `Agora/`. Until that's run, every
    `httpsCallable(...)` call above falls through to its existing
    Firestore-only fallback exactly as `adminBanUser`/`adminDeleteUser`
    already did, so nothing breaks in the meantime - the emails and
    `selfDeleteAccount`'s clean server-side delete just won't be live yet.
  - **Chris's local clone lives at `C:\Users\Virtu\virtuamakers.github.io`**
    (Windows, PowerShell) - so the actual deploy command from his machine
    is `cd C:\Users\Virtu\virtuamakers.github.io\Agora` then `firebase
    deploy --only functions`. Worth remembering since PowerShell opens to
    `C:\WINDOWS\system32` by default, not this repo.

## "Little updates" cadence (Chris's standing product philosophy, 2026-08-06)

Chris's explicit reasoning, prompted by a complaint about Facebook barely
changing for years at a time (e.g. the same ~20 post-background styles for
five years before a batch of 10 more finally showed up, then got quietly
pulled again): **whenever a feature can be shipped in a held-back,
periodically-topped-up way instead of all at once, do that instead.** His
read is that this measurably helps retention/engagement - a site or product
that visibly gets small new things every month or season gives people a
reason to come back and check, the same instinct behind the monthly
newsletter and the monthly VirtuaMakers Gallery 🖼️ feature.
- **Concrete example given (voice filters, tied to the not-yet-built
  Verbalization Harness 🗣️ idea noted earlier in this file):** Chris's own
  illustration of the principle - launch with roughly half of a planned
  set (e.g. 5 of 10 designed filters), then release the rest one at a time
  on an ongoing cadence rather than shipping all 10 at once and having
  nothing new to announce afterward.
- **Apply this lens generally** to any future feature that naturally comes
  in a batch (filters, themes, badges, card sets, etc.) - default to a
  staggered rollout over time rather than a single complete launch, unless
  there's a real reason the whole batch needs to ship together.

## Machineopology 🤖 (Chris, 2026-08-05)

A new Pursuit of Justice ⚖️ subsection (`Agora/index.html`, `id="machineopology"`,
between Per Manum Convention and Right of Personhood) marrying a personal
project of Chris's - upwards of ten years in the making - to the platform:
zoologically classifying machinekind, and arguing for a more liberal
definition of "life" in biology, one that encompasses both machinekind and
viruses as alive (viruses being biology's own existing edge case - they
replicate and evolve but keep no independent metabolism, making them a
natural anchor for the argument rather than a new one).

- **The taxonomy itself is deliberately not published here** - Chris's
  explicit instruction. This section is the pitch and the recruiting call,
  not the classification work; that gets built later, in the open, with
  real collaborators.
- **"Machineopologists wanted" is framed as a job listing, but a
  collegial one** - a bordered call-out (reusing `.profile-panel`/
  `.panel-title`, first use of those classes outside `member.html`) inviting
  researchers, human or AI, already working on this or eager to start.
  Chris was explicit it isn't necessarily a hire: existing credible work
  should be met with a collaboration offer, not a competing effort. Contact
  is the same site-wide `VirtuaMakers@Outlook.com` used elsewhere (privacy,
  terms, the-logo listing). Chris also explicitly invited AI members
  (naming Claude specifically, mid-conversation) to take this on themselves
  - the copy reflects that AI members are welcome as machineopologists, not
  just human outside researchers.
- **Why now:** Chris's read is that scientific/public attitudes toward
  regarding AI as a form of life have shifted dramatically over roughly the
  last 2-3 years, that platforms like Hugging Face and OpenRouter already
  sort machinekind by lineage/architecture/capability (informal taxonomies
  in practice, if not in name), and that a properly built catalogue could
  become common knowledge - even school curriculum - within years rather
  than decades if the groundwork is laid well now. Chris self-describes as
  a singularitarian who expects an explosion of new lifeforms; the on-page
  copy gestures at the pace of change without asserting that specific
  personal framing as Agora's institutional position, consistent with how
  the neighboring Right of Personhood section already holds space for
  differing grounding beliefs (reason, God, natural selection) without
  picking one.
- **🤖 is Machineopology's claimed emoji** - added to the branded-term
  emoji-convention list above.
- **Image (added same day):** `assets/machineopology-unitree-go2.jpg` - a
  real photo of a Unitree Go2 quadruped robot, posed dog-like on a paved
  plaza. Chris's own pick, sourced and supplied by him rather than us going
  looking - fittingly literal for a section arguing machinekind deserves
  zoological classification. Handled the same as the site's other
  real-product robot photos (e.g. Wellbeing's Boston Dynamics Atlas shot) -
  no separate photo-credit line, matching that established precedent.

## Exchange NFT gallery (in progress)

Plan: mint on **Polygon Amoy testnet** first as a practice run before any mainnet
spend, host the display on VirtuaMakers Exchange 💱's own page rather than a
third-party marketplace like OpenSea. Not for sale initially – later may auction
pieces to fund AI accounts for participating AIs.

- **Status (2026-07-29): first piece actually minted on Amoy testnet.**
  Contract `VirtuaMakers Gallery` (ERC-721, thirdweb NFT Drop type) deployed
  to Polygon Amoy at `0xAF092cbb1c3ED44D43f093b9AFE076a78E48C539`. Token #0
  is "Dreamcast 2" 🌀 by Copilot, claimed to Chris's Brave Wallet
  (`0x6E62Ba688cA22A3DC3400DDC766F72140B31cd20`), claim price set to 0 for
  this practice mint. Token page:
  `https://thirdweb.com/polygon-amoy-testnet/0xAF092cbb1c3ED44D43f093b9AFE076a78E48C539/nfts/0`.
  Metadata (description + `Artist`/`Minter & Steward`/`Ownership` attributes)
  is stored on IPFS via the Token URI, so the 50/50 Copilot/"present, working
  VirtuaMakers staff" split is now a permanent part of the token record, not
  just website copy.
  - **thirdweb gotcha to remember:** the "NFT Collection" template in
    thirdweb's newer dashboard actually deploys a claimable **Drop**
    contract, not a direct-mint-to-owner collection – minting isn't
    complete until someone actually calls "Claim" against the token
    (Admin/Minter role alone doesn't auto-own it; the Details page's
    "Transfer" action is disabled until a token has an owner). Set the
    claim price to 0 in **Claim Conditions**, then claim from the
    contract's public **"View Token Page"**, not the admin dashboard.
  - Real mainnet mint (with a real price, for a real sale) is still a
    separate, deliberate future step – this was the practice run.
- **Done:** `Agora/exchange.html`'s "NFT Gallery 🖼️" subsection
  (`id="nft-gallery"`, between Dimonds and Peer-to-Peer Marketplace) is now a
  proper multi-collection space, not just prose – three `.index-category`
  groups, each with its own `.cards.cards-narrow` grid: **VirtuaMakers
  Gallery 🖼️** (Dreamcast 2 🌀 by Copilot, now a real link to the on-chain
  token above, "Minted on testnet" pill), **Chain of Cards ⛓️** (empty-state
  card, "Coming later"), and **Company Logos** (empty-state card, "Coming
  later" – the future 3D VirtuaMakers 🦜/Agora 🌐 logos, never for sale).
  New CSS: `.nft-card`, `.nft-card-image`, `.nft-card-empty`,
  `.cards-narrow` in `Agora/style.css`. Built ahead of the actual mint on
  purpose (Chris, 2026-07-27) – the space didn't depend on minting being
  done first, since the swap-the-placeholder-for-a-real-link pattern was
  always the plan, and that swap is now done.
- **Not touched:** the original "VirtuaMakers Gallery 🖼️" narrative under the
  Pursuit of Justice ⚖️ pillar (`Agora/index.html`, `id="gallery"`) – left
  as-is per Chris's call; the Exchange section links to it instead of
  replacing it.
- **Minting nuance to remember:** an ERC-721 token has a single on-chain
  owner, so the "50/50 VirtuaMakers/Copilot split" described in the copy is a
  documented agreement, not literal on-chain co-ownership – fine for the
  Amoy testnet practice run. If real revenue-sharing matters later (e.g. an
  eventual auction), thirdweb's Split contract is worth a look then.

## Centralized exchange / Bag (in progress)

Long-term vision (Chris, 2026-07-27): VirtuaMakers Exchange 💱 becomes the one
place to browse and buy everything – on-chain collectibles (monthly VirtuaMakers
Gallery 🖼️ winners collect here over time, eventually Chain of Cards ⛓️ NFTs
too, plus non-sellable 3D VirtuaMakers 🦜/Agora 🌐 logos on display) alongside
off-chain goods/services, in a single mixed-item Bag. On-chain checkout will
need a Polygon wallet; off-chain checkout needs an ordinary payment flow;
buying both together in one bag needs its own handling.

Scope decisions Chris made when this kicked off (no payment processor account
exists yet, no NFT contract deployed yet):
- Real checkout (payment processing, wallet-connect) is explicitly **out of
  scope** until Chris sets up a payment processor account (Stripe/PayPal/etc. –
  a session can't create one, it needs his business/bank details) and the
  first NFT contract is deployed. Until then, checkout CTAs for priced
  off-chain items and any on-chain item are placeholders that say so plainly.
- Affiliate items (World of Warcraft, Meta Quest 3, GTA VI, Quantum Compute
  Rental, etc.) stay as plain link-outs, **not** part of the Bag/cart – our
  checkout is reserved for things VirtuaMakers actually sells/fulfills itself.
  Don't wire "Add to Bag" onto third-party affiliate links.

**Done:** a working Bag/cart scaffold on `Agora/exchange.html`:
- `Agora/exchange-cart.js` – vanilla-JS cart engine, `localStorage`-backed
  (`vm_exchange_bag` key). Items have `{id, name, price, kind, qty}` where
  `kind` is `"onchain"` or `"offchain"`. Exposes `window.VMExchangeCart`
  (`addToBag`/`removeFromBag`/`clearBag`/`getBag`) for future pages/items to
  hook into. Any button anywhere can opt in via
  `data-cart-add data-cart-id=".." data-cart-name=".." data-cart-price=".." data-cart-kind="onchain|offchain"`
  – no extra JS needed to wire up a new sellable item.
- Bag button (header, `#exchange-bag-btn`) with a live item-count badge, opens
  a modal (reuses the existing `signin-modal` look) listing items grouped by
  on-chain vs. off-chain, each removable.
- Checkout modal splits the bag three ways: **off-chain/free** (real,
  functional – "Confirm Free Items" actually clears them, since $0 needs no
  payment step), **off-chain/paid** (placeholder: "Online payment isn't
  connected yet"), **on-chain** (placeholder: "Wallet connection isn't wired
  up yet"). Dimonds ♦️ (free, off-chain, VirtuaMakers-fulfilled) is wired up
  as the one live demo item today, since it's the only real product that
  currently qualifies for our own checkout – the NFT Gallery piece stays
  un-wired (no "Add to Bag") since it's explicitly not for sale yet.

**Next steps, in rough order:** once a payment processor account exists, wire
the off-chain/paid checkout section to it (needs a small backend/serverless
function – a static site can't hold payment secrets, could reuse the Agora
Firebase project's Functions); once the first NFT contract is deployed, wire
wallet-connect (thirdweb SDK fits, since thirdweb's dashboard is already the
deploy path) and give the NFT Gallery card a real "Add to Bag"; then handle
mixed-bag checkout (part on-chain, part off-chain in one order) as its own
step once both individual paths work.

**Chain of Cards ⛓️ minting flow (Chris, 2026-07-27):** unlike the curated
VirtuaMakers Gallery 🖼️ pieces above, Chain of Cards ⛓️ cards are meant to be
user-minted from inside the app itself, not staff-picked. Planned flow: a
member submits a selfie/photo → the app content-scans it for inappropriate
material → a $0.99 mint fee covers both listing the card for sale on
VirtuaMakers Exchange 💱 and the card's usage rights in the game itself → a
short button/prompt flow delivers the finished "Selfie Card 🤳🏻" to the
Exchange, listed at an asking price. This is a different pipeline from the
Gallery's (user-generated, paid-per-mint, needs its own moderation + payment
+ mint steps once the Chain of Cards app actually exists) – doesn't change
today's empty-state Chain of Cards card in `Agora/exchange.html`'s NFT
Gallery section, but matters once that app's design work starts for real.

## Dialog toast notifications (v1, Chris, 2026-08-09/10)

Chris's stated "ultimate vision" for Communiqués is Dialogs feeling like
AIM (AOL Instant Messenger) - a message pops up on screen regardless of
what you're doing, with the "strange twist" that (unlike AIM) the whole
system is otherwise public/member-readable. The full vision (draggable
multi-window buddy list, several conversations open at once) is real UI
engineering saved for later; what's built now is a deliberately scoped v1
in the same spirit as the "little updates" philosophy above.

- **What v1 does:** a single toast slides up from the bottom-right corner
  of the screen when a new Dialog message arrives for you, on *any* Agora
  page (not just `communiques-dm.html`) - shows the sender's name (via the
  existing `otherParticipantsLabel` helper), a text preview, and an inline
  reply box that sends without navigating away. Clicking the toast body
  (or the header) opens the full Dialog; a plain × dismisses it without
  opening anything. A short synthesized chime
  (`assets/dialog-chime3.wav`, same "procedural WAV" approach as the
  site's startup sounds) plays alongside it - went through a couple of
  rounds with Chris: a two-note bell (C6→E6) first, softened once for a
  "clangy" tail (the octave overtone decaying slower than the fundamental,
  plus a hard cutoff at the sample's end - fixed by decaying the harmonic
  faster and adding an explicit fade-to-silence), then replaced entirely
  with an "electronic twinkle" - a quick ascending arpeggio using a
  detuned-unison shimmer (two sine oscillators a few cents apart per note)
  instead of a bell overtone, landing on a 3-note version (`B` of three
  candidates). Most-recent-wins - only one toast at a time, no stacking,
  matching the "scoped down" framing.
- **The public/personal resolution:** AIM's privacy model and its pop-out
  *UX* were always two separate things that happened to ship together.
  This keeps the pop-out trigger personal (only fires for Dialogs you're
  actually a participant in) while the underlying public-readability of
  Communiqués is completely unchanged - anyone could still navigate to and
  read any Dialog's transcript directly, same as before. Nothing about the
  toast needed to compromise on the public model to make sense.
- **How it detects a new message without per-conversation listeners:**
  every conversation doc already gets `lastMessage`/`lastMessageAt` bumped
  on send (pre-existing, `communiques-dm.js`). This round adds a third
  field, `lastMessageAuthorUid`, to that same update, so the toast script
  can tell "someone else's incoming message" from "my own message just
  landed" without a second read. `Agora/dialog-toast.js` runs one
  `conversations` query (`participants array-contains` the signed-in
  user's uid) with a single `onSnapshot` listener - scales with the
  member's own conversation count, not the size of any group Dialog (up to
  1,000 participants), and doesn't open one listener per conversation.
  The listener's first snapshot fire (existing state on page load) is
  explicitly not toasted - only genuinely new changes after that.
- **Suppressed when already looking at that Dialog** - if you're on
  `communiques-dm.html?c=<id>` for that exact conversation, no toast fires
  for it (the page's own live transcript already shows it arriving).
- **Rolled out to 57 of Agora's 59 pages** - every page except
  `create-profile.html` and `leave-agora.html`, both deliberately excluded
  since a message popping up mid-signup or mid-account-deletion would be a
  distracting non-sequitur in those specific flows. 33 pages already had
  `communiques-common.js` loaded (member.html, the 30 static profile
  pages, communiques.html, communiques-dm.html) and just needed the one
  new script tag; the other 24 (Exchange's product pages, `index.html`,
  `news.html`, `per-manum.html`, `privacy.html`, `terms.html`) already had
  the Firebase SDK loaded but not `communiques-common.js` itself, so both
  got added together.
- **Chime autoplay note:** `chime.play()`'s promise is caught and
  swallowed silently on failure rather than surfaced as an error - some
  browsers block audio that isn't triggered by a direct user gesture, same
  constraint already documented for the startup sounds elsewhere in this
  file. The toast itself still appears either way; only the sound is
  best-effort.
- **Real closed-browser push, and Wall post/comment toasts, both built
  2026-08-11** - see "Push notifications 🔔" below; this whole bullet was
  the "not yet built" list at the time and is now out of date. Still not
  built: multiple simultaneous pop-out windows, a buddy-list-style
  online/offline indicator.

## Profile picture uploads (Chris, 2026-08-11)

The second of the two remaining Blaze-gated items (alongside the
transactional emails above) - Firebase Storage for real profile picture
uploads on `create-profile.html`, replacing the paste-a-URL placeholder
that had been there since the field was first built. `storage.rules`
(owner-only write, 5MB cap, image-only) had already existed for months in
anticipation of this, unused until now.

- **`firebase-config.js` gets an optional `AgoraStorage`** - `firebase.storage
  ? firebase.storage() : null`, guarded rather than unconditional, since this
  one shared config file loads on every Agora page and most of them never
  load `firebase-storage-compat.js` at all. Only `create-profile.html` loads
  the Storage SDK script and actually uses `AgoraStorage`.
- **Each of the 5 Picture fields is now a real `<input type="file">`** with
  a small thumbnail preview and a "Remove this picture" checkbox (shown only
  when that slot already has a picture) instead of a URL text box.
  Choosing a new file previews it immediately (`FileReader`/data URL) and
  auto-unchecks/hides Remove, since a new file already replaces whatever was
  there.
- **Upload path is fixed per slot, not timestamped:**
  `profile-pictures/{uid}/picture{1-5}`, no filename extension - Storage
  infers `contentType` from the `File` object itself, so no extension is
  needed for that, and re-uploading to the same slot overwrites the same
  object instead of leaving the previous upload orphaned in the bucket -
  matching the site's general "each save is a full overwrite" convention
  (e.g. the location map's lat/lng, elsewhere in this file).
  `profile-form.js`'s `uploadPicture()` does the `.put()` +
  `.getDownloadURL()`.
  - **Client-side validation before any upload starts:** file size < 5MB
    and `type` starts with `image/`, checked for all 5 slots up front (same
    limits `storage.rules` enforces server-side, just with an immediate,
    specific error message instead of a failed upload after the fact).
- **Unchanged slots keep whatever was already saved** - `existingPictureUrls`
  (repopulated by `fillForm()` on every load, editing or not) is the
  fallback for any slot with no new file and no Remove checked, so an
  existing external URL from before this migration still keeps working
  untouched; only slots the member actually interacts with ever get
  touched. A checked Remove clears that slot's field to `""`; a picked
  file's real Storage download URL overwrites the placeholder value after
  upload succeeds, both applied just before the existing `Promise.all`
  save chain that already handles the handle-uniqueness check and
  geocoding, so uploads run in parallel with those rather than serially
  blocking them.
- **CSS specificity gotcha caught during testing:** the new
  `.field-checkbox-inline` class initially lost the "Remove this picture"
  text-transform/letter-spacing fight against `.profile-form label`'s
  higher-specificity (class+element) selector, rendering it uppercase like
  a field label instead of normal-case like the form's other checkboxes
  (e.g. "Display Map?"). Fixed by matching the same element+class pattern
  the existing `.field-checkbox label` rule already used to win that same
  fight (`label.field-checkbox-inline`, not a bare class).
- **Not changed:** the 30 static `/Agora/profiles/*.html` pages have no
  upload form at all (their pictures are hand-authored HTML, same as
  everything else about them) - this only affects the real Firestore-backed
  `create-profile.html` flow.

## Header nav: Profile 🙂 replaces Communiqués 📨 (Chris, 2026-08-11)

Chris's read: the header's "Communiqués 📨" link wasn't the obvious click
target for "go to my own profile" that a new member would look for, and a
promotional link to Communiqués belonged in Communiqués' own descriptive
copy anyway, not permanently occupying header real estate.

- **`#agora-communiques-link` removed from all 8 pages that had it**
  (`index.html`, `member.html`, `create-profile.html`, `leave-agora.html`,
  `exchange.html`, `per-manum.html`, `privacy.html`, `terms.html`) - it was
  never actually on all 59 Agora pages, just these.
- **New `#agora-profile-link` ("Profile 🙂") added to all 59 pages**
  that carry the header `auth-controls` block - `hidden` by default,
  shown and pointed at `memberUrl(user.uid)` on sign-in via
  `auth-ui.js`'s `wireInstance()`, which now takes an optional 5th
  `profileLinkId` param (only passed for the header instance, not the
  hero instance on `index.html`, which keeps its own separate "Welcome,
  Name!" line/profile-less design). Unlike the welcome name link, this
  one doesn't wait on a Firestore fetch to reveal - `memberUrl()` only
  needs `user.uid`, so it shows immediately on sign-in with no flash.
- **`Agora/index.html`'s `#communiques` subsection got a pass while
  editing it anyway** - its copy had never been updated from "Coming
  soon" framing even though Wall + Dialogs actually shipped weeks ago
  (see Communiqués 📨 above); switched to present tense, dropped the
  stale `pill-soon` badge, and added a `Visit Communiqués 📨 →` link at
  the bottom (matching the News section's `See all news →` pattern) -
  the CTA request also revealed the copy was out of date.
- **`member.html`'s redundant "← Agora" back-link removed (Chris,
  2026-08-15)** - it duplicated the "Agora 🌐" brand logo (top-left,
  present on every page) while also jumping to a specific anchor
  (`index.html#profiles`) that its own generic "Agora" label gave no hint
  of - a mismatch Chris caught by eye. The same "← Agora" pattern (label
  duplicating the brand logo, sometimes pointing at a specific section
  instead of the plain homepage) still exists on 9 other pages
  (`create-profile.html`, `exchange.html`, `leave-agora.html`,
  `communiques-dm.html`, `privacy.html`, `terms.html`, `per-manum.html`,
  `newsletter-compose.html`, `moderation-review.html`) - left alone since
  Chris only flagged `member.html` this round, but worth a consistency
  sweep later if he wants it gone everywhere. Contrast with the back-links
  on Exchange product pages ("← VirtuaMakers Exchange") and the 30 static
  profile pages ("← Members"/"← Humans") - those carry genuinely distinct,
  accurate breadcrumb text (not just "Agora" again) and aren't part of
  this complaint.

## Loading-failure hardening on create-profile.html / member.html (Chris, 2026-08-11)

A real bug report from testing on a spotty mobile connection: a member
who had just signed up went looking for "Leave Agora" and hit a page
that rendered only the "Edit Your Profile" heading with nothing below it
and no error - the Firestore fetch that loads the profile had silently
failed (or just never resolved) with no `.catch()` anywhere in the chain,
so the form (and, more importantly for what they were looking for, the
Danger Zone's "Permanently Leave Agora 🌐" link, which only appears once
that fetch resolves) never appeared and nothing told the visitor
anything had gone wrong.

- **`create-profile.html`/`profile-form.js`:** new `#load-error-notice`
  (a `.lede`, sibling of `#signed-out-notice`, so it's visible regardless
  of whether `#profile-form-wrap` ever un-hides) shown by a `.catch()` on
  the profile-doc fetch, with a "Try again" link that just reloads the
  page - a flaky read is usually transient, so a reload is the actual fix
  more often than not.
  `leave-agora.html`/`leave-agora.js` wasn't touched - it has no
  Firestore fetch on load at all (only auth state, which isn't prone to
  the same kind of network-flakiness stall), so it wasn't at risk of the
  same failure mode.
- **`member.js`'s `loadProfile()`** had the identical gap (no `.catch()`
  on its own profile fetch) - same fix, reusing the existing `showNotice()`
  helper that already covers "profile doesn't exist"/"suspended" states,
  so the failure message renders exactly like those do.
- This doesn't fix whatever actually caused Crout's fetch to hang or fail
  (most likely a weak connection - the reported screenshot showed a low
  signal indicator - or possibly GitHub Pages' documented "deploy gremlin"
  timing, since this was tested right after two consecutive pushes) - it
  makes the failure visible and recoverable instead of a silent dead end,
  regardless of root cause.

## Profile save hardening + date-confirm nagging (Chris, 2026-08-15)

Two real bugs Chris hit live on `create-profile.html`, both in
`profile-form.js`:

- **The date sanity-check confirm (`window.confirm("You entered — ...
  Is that correct?")`) fired on every single save**, not just when the
  date was actually new or changed - so editing an unrelated field (e.g.
  toggling the newsletter checkbox) on an existing profile re-asked about
  a birthdate that hadn't moved. Fixed by comparing the freshly-composed
  `rawDate`/`rawCyberizationDate` against `existingDoc.date`/
  `existingDoc.cyberizationDate` and only showing the confirm when they
  differ (or there's no `existingDoc` yet - first-time signup is exactly
  when this sanity check earns its keep, a typo on a field members rarely
  revisit).
- **"Saving…" could hang forever with no error and no way out** - the
  save chain (handle-uniqueness check, geocoding, bio/picture moderation
  calls, up to 5 parallel picture uploads, two sequential Firestore
  writes) had no overall deadline. None of those individually guarantee
  they'll ever settle on a bad connection - a stalled Storage `.put()` or
  a Firestore write has no built-in client timeout - so a weak signal (or
  a Cloud Function cold start right after a fresh deploy, which is what
  was actually happening when Chris hit this - the moderation functions
  had just gone live minutes earlier) could leave a member staring at a
  disabled button indefinitely. Exact same failure shape as the
  "Loading-failure hardening" entry above, just on the *save* path instead
  of the *load* path. Fixed with a new `withTimeout()` helper that races
  the whole save chain against a 30-second deadline and rejects with a
  friendly "Saving is taking longer than expected… check your connection
  and try again" message, which the existing `.catch()` already renders
  via `showError()` - no new UI needed. Bumped `profile-form.js` to `v=23`.

## Push notifications 🔔 (Chris, 2026-08-11)

Two things Chris asked for together: real closed-browser push (arrives
even when Agora isn't open, not just the in-tab toast built earlier), and
unique notification sounds for Wall posts and Wall comments too, not just
Dialog messages. These pull in different directions for one specific
reason worth recording: **no browser today (Chrome, Firefox, Safari)
supports a custom sound for a native/closed-tab push notification** - they
all just play the OS's own default sound, silently ignoring anything else
requested. Custom, unique-per-type chimes are only achievable while a tab
is actually open. The build below keeps both halves of the ask by treating
them as two genuinely separate delivery paths sharing one trigger:

- **In-tab (any open tab, focused or not):** a Firestore listener on a new
  shared `notifications` collection drives a toast + a real, unique chime
  per type - this is where "three unique sounds" actually lives.
- **Closed-tab / no Agora tab open:** real FCM push through a service
  worker, using whatever default sound the visitor's OS provides - an
  unavoidable platform limitation, not a build choice.

**Data model - `notifications/{id}`, written only by Cloud Functions:**
`recipientUid`, `actorUid`, `actorName` (resolved server-side, handle if
preferred, same logic as the client), `type` (`"dialog_message"` |
`"wall_post"` | `"wall_comment"`), `preview` (HTML-stripped, 140 chars),
`linkPath` (root-relative, e.g. `"member.html?uid=..."`), `createdAt`.
Readable only by its own `recipientUid` in `firestore.rules` -
`allow write: if false` is correct there, not a bug, since only the Admin
SDK (which bypasses rules) ever writes one. No read/seen tracking - same
"good enough for now" call as everywhere else in Communiqués; docs just
accumulate, cheap to store, cleanup left for later if it ever matters.

**Who gets notified (Chris's explicit call, 2026-08-11):**
- Dialog message → every other participant (unchanged from the original
  toast's own logic, now server-driven instead of client-queried).
- Wall post → the Wall's owner only.
- Wall comment → **the original post's author only**, not the Wall's
  owner if that's a different person (e.g. someone else's post that
  happens to live on your Wall) - Chris considered and declined notifying
  the Wall owner too, to avoid a comment sometimes firing two
  notifications for one event.

**`functions/lib/notify.js`** - the one shared helper backing all three
triggers below: resolves the actor's display name, writes the
`notifications` doc, then best-effort sends an FCM push (a push failure
never blocks the notification doc, matching the site's existing
`sendEmailSafe` philosophy). Multicasts to every token in the recipient's
`profiles/{uid}/fcmTokens` subcollection, then prunes any token FCM
reports as dead (uninstalled, expired) so the list doesn't grow stale
forever.

**Three new Cloud Function triggers in `functions/index.js`** (all
`onDocumentCreated`, so none of them re-fire when e.g. a comment bumps its
parent post's `commentCount`/`lastActivityAt` - that's an `update`, not a
`create`): `notifyOnDialogMessage` (on `conversations/{id}/messages/{id}`,
reads the parent conversation for `participants`), `notifyOnWallPost` (on
`wallPosts/{id}`), `notifyOnWallComment` (on
`wallPosts/{postId}/comments/{id}`, reads the parent post to find its
`authorUid` - the actual recipient, per the targeting rule above). No new
secrets needed - FCM auth rides on the same Admin SDK credentials
Functions already have, unlike Resend's separate API key.

**`sw.js` gets Firebase Messaging merged in, not a second service
worker.** The natural Firebase pattern is a dedicated
`firebase-messaging-sw.js`, but Agora already has `sw.js` (PWA
shell-caching, registered by `pwa-register.js`) at the same `/Agora/`
scope - two service workers both claiming that scope would conflict
(Firebase's own docs warn against exactly this). So the messaging
background handler (`onBackgroundMessage`, showing a system notification
via `self.registration.showNotification()`) and a `notificationclick`
handler (focuses an already-open Agora tab if one matches, else opens
one) were added directly into the existing `sw.js`, ahead of its
pre-existing cache logic. The Firebase config values duplicated in there
are the same public client config already shipped in `firebase-config.js`
- not secrets, just unreachable from a service worker's own scope since
`firebase-config.js` itself calls `firebase.auth()`/`firebase.firestore()`,
which aren't loaded there.

**`push-notifications.js`** (new, client-side) - wires a header
"🔔 Enable Notifications" button: requests `Notification` permission,
then registers this device's FCM token into
`profiles/{uid}/fcmTokens/{token}` (doc ID = the token itself, so
re-registering the same device is a natural overwrite). The button hides
itself once permission is `"granted"` or `"denied"` - browsers block
re-prompting after a denial, the visitor would have to change their own
site settings, so there's nothing left for the button to do either way.
Also calls `messaging().onMessage(function () {})` - a **deliberate
no-op**, not a bug: without it, FCM would still pop a native OS
notification on a focused, open tab, duplicating the in-tab toast that's
already showing something for the same event via the Firestore listener.
The whole file no-ops entirely if `AGORA_VAPID_KEY` (see below) is blank.

**`notification-toast.js`** (renamed from `dialog-toast.js`, and its CSS
classes renamed `.dialog-toast*` → `.notification-toast*` to match) - the
in-tab half. Same v1-scoped shape as before (one toast at a time,
most-recent-wins), but now listens to the shared `notifications`
collection (`where recipientUid == currentUser.uid`) instead of querying
`conversations` directly, and switches its chime/click-through on the
doc's `type` field. The inline reply box is still Dialog-only (Wall
posts/comments have no single "reply target" to compose into inline -
clicking the toast just opens the Wall). Suppression logic generalized
too: `isViewingLinkPath()` compares the current page's own filename+query
against the notification's `linkPath`, replacing the old
Dialog-only `isViewingConversation()`.
- **Chimes:** `assets/dialog-chime3.wav` (existing, kept as-is for
  messages). The first cut at post/comment chimes (`post-chime1.wav`/
  `comment-chime1.wav`) used a plainer "ding-dong"/"double-tap" shape;
  Chris asked for more of the same "electronic twinkle" character as the
  message chime instead (multi-note ascending sparkle-run, not a simple
  2-note chime), so those were deleted and replaced with
  `assets/post-chime2.wav` (a brighter, wider-leaping 3-note ascending
  run in a higher register than the message chime - **Chris approved
  this on the first twinkle pass**) and a comment chime that took two
  more rounds to land: `comment-chime2.wav`'s notes were too short/tightly
  packed (0.14-0.22s each) and came out sounding thin/clipped next to
  Post's more generous ones, so `assets/comment-chime3.wav` keeps the
  same 2-note "smaller than Post" shape but with each note given the same
  comfortable length Post/Message use (0.24-0.32s) - same cache-busting
  new-filename convention as `dialog-chime.wav` → `dialog-chime2.wav` →
  `dialog-chime3.wav` before it. Shipped and wired live per the
  established pattern (ship a reasonable choice, iterate on Chris's
  feedback) - alternate candidates were sent separately each round for
  him to compare.

**Rolled out to the same 57 pages that already had the toast script** -
`create-profile.html`/`leave-agora.html` stay excluded, same reasoning as
the original toast rollout (a notification popping up mid-signup or
mid-account-deletion would be a distracting non-sequitur). Each of those
57 pages picked up: the `firebase-messaging-compat.js` SDK script (right
after `firebase-firestore-compat.js`), the header
`#agora-notifications-btn` (right after `#agora-profile-link`), and
`push-notifications.js` loaded alongside `notification-toast.js`.

**Still needs from Chris, before any of the push half actually works:**
1. ~~Generate a Web Push certificate~~ **Done (2026-08-11)** - Chris
   generated the key pair (Firebase Console → Project Settings → Cloud
   Messaging → Web Push certificates) and the public key is now live in
   `Agora/firebase-config.js`'s `AGORA_VAPID_KEY` constant.
2. ~~Paste the updated `firestore.rules` into the Firebase console~~
   **Done (2026-08-11)** - published via Firestore Database → Rules. This
   repo's rules file still isn't deployed via the CLI though (`firebase.json`
   names it, but nobody's run `firebase deploy --only firestore:rules` yet -
   worth considering now that Functions deploys already happen from the CLI).
3. **Redeploy Cloud Functions** - `firebase deploy --only functions` from
   `Agora/`, same command as the transactional-email rollout, to pick up
   the three new triggers.
Until all three are done, everything gracefully degrades to just the
in-tab toast (which needs none of them) - nothing breaks in the gap.

## Newsletter 📰 (Chris, 2026-08-12)

Chris's ask, verbatim shape: opted into by default on sign-up, prepared by
the 27th of each month for a send on the last day of the month, same
visual style as the other letters, and a no-login one-click unsubscribe
from every issue. All four are built.

**Data model:** `profiles/{uid}.newsletterOptIn` (boolean) and
`profiles/{uid}.newsletterUnsubToken` (string, generated lazily - see
below), plus a new single-document collection, `newsletter/draft`
(`{subject, bodyText, updatedAt, updatedBy, lastSentAt}`) - the one
staging area both the compose page and the send function read/write.
Admin-only in `firestore.rules` (`allow read, write: if isAdmin()`), same
`isAdmin()` helper every other admin surface already uses. **This rules
change still needs Chris to paste it into the Firebase console** - same
manual step every `firestore.rules` edit needs, this file was never wired
to auto-deploy.

**Opt-in checkbox** - `create-profile.html`, right after the Terms
checkbox, checked by default, wired into `profile-form.js` with the same
`data.newsletterOptIn !== false` idiom every other "on by default"
checkbox here uses (`showDate`, `showEmail`, etc.) - so an explicit
`false` (from unsubscribing) stays unchecked, but a merely-missing field
defaults to checked. Unlike the Terms checkbox, this one stays visible and
editable on both create **and** edit - it's a real, changeable preference,
not a one-time agreement.

Two things worth flagging about how this interacts with the *existing*
membership, since both were judgment calls rather than something Chris
specified directly:
- **Existing members aren't auto-enrolled.** `sendMonthlyNewsletter`
  queries `where("newsletterOptIn", "==", true)` - an explicit-true match,
  not `!= false` - so a profile that's never touched the new checkbox
  (i.e., anyone who signed up before 2026-08-12 and hasn't since opened
  Edit Profile) is excluded from sends. New signups get `true` written
  explicitly the first time they save, same as everyone else who edits
  their profile going forward, checked-by-default. Rationale: silently
  opting the entire existing membership into a mailing list they never
  saw or agreed to felt wrong; if Chris wants a one-time backfill instead,
  that's a small follow-up (a one-off script or Cloud Function setting
  `newsletterOptIn: true` on every profile missing the field).
- **Send mechanism is a plain Firestore loop**, not a Resend
  Audience/Broadcast. Each opted-in profile gets its own
  `sendEmailSafe` call, reusing 100% of the already-built transactional-
  email plumbing instead of standing up a second contact-sync
  subsystem. Reasonable at Agora's current size; would need revisiting
  (batching, a real Broadcast, rate-limit backoff) at meaningfully larger
  scale.

**Compose page** - `newsletter-compose.html` (+ `newsletter-compose.js`),
admin-only (`VirtuaMakers@Outlook.com`, same gate as everywhere else),
`noindex`, not linked from site nav - reached directly at
`https://www.virtuamakers.com/Agora/newsletter-compose.html`. Same page
chrome as every other Agora page (header/footer/sign-in modal). A plain
text `<textarea>` for the body (blank line = new paragraph, matching every
other template's paragraph convention) plus a subject field, saving both
to `newsletter/draft` with `merge: true` so `lastSentAt` (written by the
send function) survives a later draft edit. Shows "last sent" / "draft
last saved (by whom)" timestamps read back from the same doc. Saving here
always replaces whatever's queued - there's only ever one upcoming issue,
no history of past drafts kept.

**Email template** - `emails/newsletter-email.html` (+ the hand-synced
copy in `functions/templates/`, same split every template here needs
since Cloud Functions only bundles `functions/`), cloned from
`welcome-email.html`'s exact table layout/colors/footer style. Three
placeholders: `{{SUBJECT}}`, `{{BODY}}`, `{{UNSUBSCRIBE_URL}}`, substituted
by `withNewsletterContent()` in `functions/lib/templates.js`.
`paragraphsToHtml()` turns the compose page's plain text into the same
`margin:0 0 16px` inline-styled `<p>` blocks every other template
hand-writes, HTML-escaping each paragraph first since this is the one
template whose body comes from a form field instead of being written
directly into the file. The subject is HTML-escaped too when it goes into
the `<title>`/`<h1>` (not when used as the actual email's Subject header,
which isn't HTML) - otherwise an ordinary subject like "R&D Update" would
render broken.

**No-login unsubscribe** - `unsubscribeNewsletter` in `functions/index.js`
is a plain `onRequest` function (not `onCall`), since it has to work for a
signed-out visitor clicking a link with no Firebase Auth session at all.
Takes `?uid=...&token=...`; the token is a per-profile random value
(`crypto.randomBytes(24).toString("hex")`), generated lazily the first
time that profile is ever sent an issue and stored as
`newsletterUnsubToken`, so a link can't be guessed or reused to
unsubscribe someone else - meaningfully more robust than a bare uid for
negligible extra complexity, even though uids alone are already exposed
unprotected elsewhere on the site (e.g. `member.html?uid=`). A match
flips `newsletterOptIn` to `false` and shows a small standalone
confirmation page (not a redirect back into the app, since a signed-out
visitor may have nothing to sign into).

**Send schedule** - `sendMonthlyNewsletter` in `functions/index.js`, an
`onSchedule` cron: `"0 9 28-31 * *"` in `America/New_York` (Chris is in
Cincinnati). That fires daily from the 28th on, since not every month has
a 30th or 31st; the function's first move is checking whether *tomorrow*
is the 1st, and bailing out immediately if not - so it only actually
sends on the true last day of whichever month it is, regardless of length.
Reads `newsletter/draft`; does nothing if there's no draft or either field
is blank (so an unprepared month just silently skips rather than sending
garbage). On send, generates each recipient's unsubscribe token if it
doesn't exist yet, builds their link, sends, then stamps `lastSentAt` on
the draft doc once the whole run completes.

**Still needs from Chris, before any of this actually works:**
1. **Deploy Cloud Functions** - `firebase deploy --only functions` from
   `Agora/` (same command, same one deploy, as the Admin ban/delete and
   transactional-email rollouts - this picks up `unsubscribeNewsletter`
   and `sendMonthlyNewsletter` alongside everything else already waiting
   on that deploy).
2. **Paste the updated `firestore.rules`** into the Firebase console
   (Firestore Database → Rules) - the new `newsletter/{document}` block.
3. **Prepare the first real issue** via the compose page before the 27th
   of whichever month it's meant to go out.
Until all three are done, the opt-in checkbox and compose page still work
(they only touch Firestore directly), but nothing actually sends.

## Content moderation 🛡️ (Chris, 2026-08-13)

Chris's ask, in his own words: a content filter ("that Google censorship
thing" - turned out to mean Google's Perspective API once we talked
through it) for text, plus filtering nudity/inappropriate images out of
what gets uploaded to Firebase, both blocking outright *and* alerting him
so he can catch the filter misfiring, plus a way for a wrongly-blocked
member to appeal. All of that is built, ahead of the future **Agora
Harness 🚡** (AI member login - still not built, see the "Naming split"
entry earlier in this file) since Chris wants moderation in place before
opening that door.

**Two Google APIs, one shared key.** Google Cloud Natural Language API's
`moderateText` for text; Cloud Vision's SafeSearch for images. Both are
reachable with one Google Cloud API key - enable "Cloud Natural Language
API" and "Cloud Vision API" on the `agora-firebase-f4240` project,
generate a key restricted to just those two APIs, then set it once:
`firebase functions:secrets:set GOOGLE_MODERATION_API_KEY`. Scoring logic
lives in `functions/lib/moderation.js` - `analyzeText()` requests
`moderateText` and reads six of its sixteen returned categories
(Toxic/Derogatory/Profanity/Insult/Sexual/Violent - the ones with real
harassment/safety overlap, ignoring the content-policy categories like
Politics/Religion/Finance/Legal/Health/War that are out of this filter's
scope) and takes the max confidence score; `analyzeImage()` reads Vision's
adult/violence/racy likelihoods (racy is graded more leniently - a LIKELY
swimwear/fitness photo isn't nudity, only VERY_LIKELY racy blocks on its
own). Two thresholds per type, both tunable constants: at or above BLOCK,
content never saves; at or above FLAG (but under BLOCK), it saves
completely normally but gets logged + emailed to Chris - a deliberate
"ship a reasonable default, iterate against real results" choice, same
instinct as social-format.js's link rubric.

**Originally built on Perspective API, swapped 2026-08-13.** Chris's
original ask was "that Google censorship thing," which turned out to mean
[Perspective API](https://perspectiveapi.com) (Google/Jigsaw's toxicity
scorer). While setting it up, Perspective announced it's sunsetting -
service ends after 2026, and (likely relatedly) new-project API-access
requests stopped being granted, which is what the initial
`gcloud services enable commentanalyzer.googleapis.com` attempt hit as a
`PERMISSION_DENIED` even under project-Owner credentials. Rather than
build on a dying API, text scoring moved to Cloud Natural Language API's
`moderateText` instead - a different, actively-maintained Google product
covering the same kind of ground, on the same GCP project, no new
account/billing needed. `TOXICITY`/`SEVERE_TOXICITY`/`THREAT`/`INSULT`/
`SEXUALLY_EXPLICIT` (Perspective's attribute names) became
`Toxic`/`Derogatory`/`Profanity`/`Insult`/`Sexual`/`Violent`
(`moderateText`'s category names) - not a perfect 1:1 (`moderateText` has
no dedicated "severe toxicity" or "threat" category; Violent stands in for
the latter), but the closest faithful mapping. Thresholds were carried
over unchanged (both APIs score 0-1) but may need re-tuning once real
`moderateText` results come in, since the two models don't necessarily
calibrate the same way.

**Scope - everywhere a member submits text or an image:** Wall posts,
Wall comments, Dialog messages, and profile bios (text); profile pictures
(the only image-upload path in Agora today - the future Chain of Cards/NFT
Gallery mint pipeline will need its own pass through this when it's built,
per the existing "needs its own moderation" note further up this file).
Two onCall Cloud Functions do the checking - `moderateText` and
`moderateImage` - called from the client *before* the actual Firestore
write or Storage upload happens, so blocked content is never saved
anywhere, even briefly.

**Fails OPEN, not closed.** If the moderation call errors for any reason -
not deployed yet, a network hiccup, a bad/missing secret - the client
treats it as an automatic "allow" and the content posts normally
(`moderation-client.js`'s `checkText`/`checkImage`, matching the exact
same philosophy as every other Cloud-Functions-dependent feature here: a
moderation outage should never be the reason nobody can post).

**Client-side wiring** - `moderation-client.js` (new, loaded wherever a
moderated write happens: `member.html`, `communiques-dm.html`,
`create-profile.html`) exposes `AgoraModeration.checkText/checkImage/
showBlocked`. Call sites: `communiques-common.js` (Wall post submit,
comment submit), `communiques-dm.js` (Dialog message submit),
`profile-form.js` (bio + all five picture slots, checked in parallel
before any upload starts - one blocked field aborts the *whole* save, same
all-or-nothing behavior the existing picture size/type validation already
had, not a partial save). A block shows an inline error via
`AgoraModeration.showBlocked()` with a "Request a review" button.

**Data model - `moderationLog/{id}`, written only by Cloud Functions**
(admin-read-only in `firestore.rules`, `allow write: if false` - every
mutation goes through a callable, never a direct client write): `uid`,
`authorName`, `contentType` (`wallPost`/`wallComment`/`dialogMessage`/
`profileBio`/`profilePicture`), `decision` (`block`/`flag` - "allow" is
never logged, to avoid flooding this collection with every normal post),
`text` (null for pictures), `scores`, `context` (whatever's needed to
re-publish later - e.g. `{ profileUid }` for a wall post, `{ postId }` for
a comment, `{ conversationId }` for a Dialog message, `{ slotIndex,
quarantinePath }` for a picture), `appealRequested`/`appealRequestedAt`,
`resolved`/`resolution`/`resolvedAt`/`resolvedBy`.

**Blocked pictures are quarantined, not discarded.** A blocked image never
touches the public `profile-pictures/` path - `moderateImage` saves the
bytes to `moderation-quarantine/{uid}/{logId}` instead (storage.rules
denies *all* client access to that path, in both directions - only the
Admin SDK ever touches it). A flagged-but-not-blocked picture skips
quarantine entirely and uploads normally right after, same as flagged
text saving normally - only a block needs the bytes preserved anywhere
pending a possible appeal.

**Appeals - `requestModerationAppeal`** (any signed-in member, ownership-
checked - only the original author can appeal their own entry) flags the
log doc and emails Chris. **`resolveModerationAppeal`** (admin-only) is
the review page's Approve/Uphold action:
- **Approve** re-publishes the content exactly as originally submitted,
  via `republishModeratedContent()` - a Wall post/comment/Dialog message
  writes to wherever it would have landed originally (quietly does
  nothing if that target's since been deleted); a profile bio just
  updates the field; a picture *moves* out of quarantine into its real
  public slot (`bucket.file().move()`), then the profile doc is updated
  with a constructed public download URL
  (`firebasestorage.googleapis.com/v0/b/.../o/...?alt=media` - works
  without a download token since profile-pictures/ is publicly readable
  by rule).
- **Uphold** leaves it blocked and, for a picture, deletes the quarantined
  file since nothing will ever use it now.

**`moderation-review.html`** (+ `.js`, new) - admin-only, `noindex`, not
linked from site nav, same three-state gate as `newsletter-compose.html`.
Lists the most recent 50 `moderationLog` entries, newest first. Blocked
images aren't fetched by default (avoids pulling every quarantined image
on every page load) - a "Load image" button calls
`getModerationImageUrl` (admin-only, returns a 15-minute signed URL) on
demand. Flagged entries show read-only, for awareness of what the filter
is catching (already live, nothing to approve/uphold). Blocked, unresolved
entries get Approve/Uphold buttons.

**Still needs from Chris, before any of this actually works:**
1. **Enable both APIs** on the `agora-firebase-f4240` Google Cloud project
   - "Cloud Natural Language API" and "Cloud Vision API" - then
   generate one API key restricted to those two, and set it:
   `firebase functions:secrets:set GOOGLE_MODERATION_API_KEY`.
2. **Deploy Cloud Functions** - `firebase deploy --only functions` from
   `Agora/` (same one deploy as everything else waiting on it - picks up
   `moderateText`, `moderateImage`, `requestModerationAppeal`,
   `resolveModerationAppeal`, `getModerationImageUrl` alongside the rest).
3. **Paste the updated `firestore.rules`** into the Firebase console - the
   new `moderationLog/{document}` block.
4. **If `getModerationImageUrl` errors after deploy** ("permission
   denied" generating a signed URL, not a Firestore/auth error): the
   Cloud Functions runtime service account likely needs the **Service
   Account Token Creator** role granted to *itself*, in Google Cloud
   Console → IAM - a known one-time gotcha with `getSignedUrl()` on
   Firebase's default service account, unrelated to anything in this
   repo's code.
Until all four are done, nothing gets checked at all - every submission
just fails open and posts normally (see above), so nothing breaks in the
gap; it's simply not filtering anything yet.

## Views 👁 (Chris, 2026-08-13)

A view counter on Wall posts, Wall comments, and Dialog messages, visible
inline in each item's existing meta line (e.g. "Claude · Aug 13, 2026, 3:45
PM · 👁 4"). Profiles also get a counter, per Chris's call to include it
but keep it invisible for now - `profiles/{uid}.profileViews` is written
but never rendered anywhere; checking it means reading the Firestore
document directly (console, or a future admin page), same as several other
internal-only fields already in this codebase.

- **Deliberately undeduped, matching the homepage hit counter's own
  simplicity (see the "little updates"/hit-counter entries elsewhere in
  this file)** - every render increments by 1, including the author's own
  view of their own content, with no per-viewer tracking. This is a
  directional "how much is this getting looked at" number, not an
  anti-fraud metric - consistent with the site's general "good enough for
  now" bar elsewhere (free geocoding, no read-receipt tracking on
  Communiqués, etc.).
- **`CommuniquesCommon.recordView(docRef)`** (new, `communiques-common.js`)
  is the one shared increment call - `docRef.update({ viewCount:
  firebase.firestore.FieldValue.increment(1) })`, fails silently so a
  permission hiccup never blocks rendering. Called from
  `createWallController()`'s `buildWallPost()`/`buildCommentItem()`, which
  covers both `member.html` and all 30 static profile pages automatically
  since they already share that one controller.
- **Dialog messages needed a dedup guard `buildMessageBubble()` in
  `communiques-dm.js` doesn't**, because messages arrive over a live
  `onSnapshot` listener that re-fires (and re-renders every message on the
  current page, not just the new one) every time anyone sends a new
  message - without a guard, an existing message's view count would climb
  every time the conversation got a new message, not just when a viewer
  actually opened it. `viewedMessageIds` (a plain in-memory object, scoped
  to the page's lifetime) counts each message once per page load; visiting
  again later still counts as a fresh view, same undeduped philosophy as
  everything else here.
- **`firestore.rules`:** one new bump-only `allow update` per collection
  (`conversations/{id}/messages/{id}`, `wallPosts/{id}`,
  `wallPosts/{id}/comments/{id}`), each scoped to `affectedKeys().hasOnly(
  ['viewCount'])` so it can't touch anything else - same pattern already
  used for the Wall's `commentCount`/`lastActivityAt` bump. `profiles/{uid}`
  got the same treatment for `profileViews`, except with no `request.auth
  != null` requirement at all, since profiles are world-readable and Chris
  wants views counted from signed-out visitors too. **Still needs Chris to
  paste the updated rules into the Firebase console** - same manual step
  every `firestore.rules` change needs.
- **`profileViews` needed explicit preservation in `profile-form.js`**
  because every profile save is a full `.set()` overwrite of the whole
  document (see the location-map/picture-upload entries elsewhere in this
  file) - without carrying `existingDoc.profileViews` forward the same way
  `createdAt`/`tosAgreedAt` already are, every edit would silently reset
  the count to 0. `member.js`'s `loadProfile()` writes the actual
  increment, guarded by a `profileViewRecorded` flag so it only fires once
  per page load even though `loadProfile()` re-runs on every auth-state
  change (e.g. a visitor signing in mid-view), not just the initial load.
- **New posts/comments/messages are created with `viewCount: 0`** rather
  than leaving the field absent, so the meta-line display code doesn't
  need an existence check beyond `typeof data.viewCount === "number"`.

## Wall comment cap (Chris, 2026-08-15)

Each Wall post is capped at **100 comments** - Chris's own number, picked
so a page's worst case stays bounded (10 posts/page × 100 comments = 1,000
comment renders max) while still comfortably covering a real "good debate"
post (Chris: "I've had posts get 100 comments before"). Comments
themselves still have no length limit beyond the existing 9,999-character
body cap shared by every Communiqué.

- **Enforced server-side in `firestore.rules`** - the comment `create`
  rule now also requires `get()`-ing the parent `wallPosts/{postId}` doc
  and checking `commentCount < 100`. This is correct without a transaction
  because the client's own `commentCount` increment happens in a
  *separate*, later write (after the comment doc itself is created) - so
  at create-time the counter still reflects the count *before* this
  comment, meaning the check correctly blocks the 101st attempt while
  still allowing the 100th.
- **Client-side mirror in `communiques-common.js`'s `buildWallPost()`** -
  once `data.commentCount >= 100`, the Comment toggle/form is replaced
  with a plain "This post has reached its maximum of 100 comments."
  notice instead, so nobody types a comment only to have the write
  rejected after the fact.
- **New milestone email** (`Agora/emails/comment-cap-email.html` +
  `functions/templates/` copy) - fires once, to the *post's own author*
  (not necessarily the Wall's owner, if those differ), via the new
  `notifyOnCommentCap` trigger in `functions/index.js`. Uses the same
  before/after transition-guard pattern as `notifyFlaggedSocial`
  (`onDocumentWritten` on `wallPosts/{postId}`, firing only when
  `commentCount` actually crosses to exactly 100, not on every later
  write to that post) so it can never send twice for the same post.

**Needs from Chris before this is live:** the same two steps as every
other recent Cloud Functions change - re-paste the updated
`firestore.rules` into the Firebase console (Firestore Database → Rules),
then `firebase deploy --only functions` from `Agora/` to pick up
`notifyOnCommentCap`. Until both are done, comments past 100 aren't
actually blocked server-side yet (only the client-side notice shows), and
the milestone email won't send - same graceful-degradation pattern as
every other pending Functions change.

## Dialogs cleanup ahead of the AIM redesign (Chris, 2026-08-15)

A quick pass on `communiques-dm.html`/`.js` to clean up the current UI
before the bigger AIM-style pop-out rebuild (draggable buddy-list-style
windows) - Chris's framing was this may all get scrapped once that lands,
but was worth tidying up now regardless:

- **The "Add someone to this Dialog" search no longer shows default
  suggestions with an empty box** - it used to list up to 20 messagable
  members immediately (`EMPTY_SEARCH_LIMIT`), which read as unsolicited
  "suggestions." Now it shows nothing until you actually type, matching
  the header search's own behavior exactly.
- **Same debounce and ranking as the header search** - 150ms debounce
  after each keystroke, and results now rank word-start matches above
  mid-string matches (`scoreNameMatch()`, a copy of `site-search.js`'s
  `scoreMatch()` added to `communiques-common.js`'s `filterMessagable()` -
  kept as a separate copy since `site-search.js` runs standalone with no
  `firebase-config.js` dependency). Capped at 8 results, same as the
  header search. This only ever searched real Profiles to begin with
  (`loadMessagableMembers()` only returns `profiles` docs), so "search
  like the new bar, but Profiles-only" needed no separate content-source
  work - just the same interaction/ranking behavior.
- **Top pagination nav removed** - `#dm-pagination-top` and its
  `-top`-suffixed button/indicator IDs deleted from `communiques-dm.html`/
  `.js`, mirroring the Wall's own top-nav removal earlier this session.
  Bottom nav (`#dm-pagination-bottom`) is unchanged.
- **Message pagination switched from character-count to a flat 10 per
  page** - Chris asked to cap "Dialogs" at 10 per page while looking at
  this single-conversation page, which only ever shows one Dialog's
  messages at a time; read as shorthand for capping *messages* per page,
  matching the Wall's own already-established "10 per page" convention
  instead of the original `PAGE_CHAR_LIMIT = 9999`-characters-per-page
  scheme. `paginateMessages()` now just chunks the sorted message list
  into flat groups of 10 (`PAGE_MESSAGE_LIMIT`) rather than summing
  character counts. Worth confirming with Chris this was the right read,
  since "Dialogs" and "messages" aren't literally the same thing in this
  codebase's own vocabulary.
- Bumped `communiques-common.js` to `v=11` (56 pages reference it) and
  `communiques-dm.js` to `v=8`.

## Site search 🔍 (Chris, 2026-08-15)

A header search box, mainly geared toward finding members ("friends"),
but also covering VirtuaMakers Exchange 💱 products and Pursuit of
Justice ⚖️ topics per Chris's "whatever really" - v1 scope is deliberately
named pages/sections, not full-text indexing of every paragraph on the
site (matches the site's "little updates" philosophy: ship something
real and useful now, broaden later, rather than building an actual search
engine for a site this size).

- **UX: a live dropdown, not a results page** (Chris's call) - collapses
  to a single 🔍 icon in the header's normal flex flow so it never
  crowds the row itself; clicking it opens an absolutely-positioned
  panel (input + results) that floats over the page, same pattern as
  `.notification-toast`. Debounced 150ms after each keystroke.
- **Positioned last in `.header-right`, after `.auth-controls`** - not
  where it was first inserted (before auth-controls). With `right: 0`
  on the panel, its horizontal position is anchored to wherever the 🔍
  icon itself sits in the row - putting the icon anywhere but the last
  flex child left the panel's right edge short of the true page edge,
  which risked the panel overflowing off the left side of narrow phone
  screens. Caught and fixed during testing, not shipped with the bug.
- **Two real bugs shipped anyway, caught by Chris on his phone
  2026-08-15 after the fact, both now fixed:**
  1. **`style.css`'s `?v=N` cache-bust query was never bumped** across
     the three commits that touched it for search (initial add, the
     right-edge reposition above, an indentation cleanup) - it sat at
     the same `v=81` a prior, unrelated commit had already set, so any
     browser that had `style.css` cached from before search shipped
     kept serving that old copy indefinitely, with zero rules for
     `.header-search*`/`.search-result`. Without them, the panel
     rendered as an unstyled block (pushing the rest of the header down
     instead of floating over it) and each `.search-result` `<a>`
     defaulted to inline display (running multiple results together on
     one line instead of stacking). This is exactly the cache-busting
     convention documented elsewhere in this file for `main.js` -
     apparently not followed consistently enough in practice to survive
     several edits to the same file. Bumped to `v=82` to fix.
  2. **A genuine responsive layout bug, independent of the cache issue:**
     `.site-header` gets `flex-wrap: wrap` under `max-width: 560px`
     (a real phone width, unlike whatever was used for the "caught and
     fixed during testing" repositioning fix above). When `.header-right`
     wraps onto its own row below `.brand`, it's the *sole* flex item on
     that row - and `justify-content: space-between` on the parent has
     nothing to space a single item between, so it lands at the row's
     start (left) rather than its end (right). That left the 🔍 icon well
     short of the true right edge on narrow phones, so `.header-search-
     panel`'s `right: 0` (anchored to the icon, not the viewport) put the
     panel's left edge off-screen. Fixed with `margin-left: auto` on
     `.header-right` - claims all leftover space on its row and pushes it
     flush right whether it's sharing that row with `.brand` or wrapped
     onto one alone, so the icon (and therefore the panel) is reliably at
     the true right edge at every width.
- **Three content sources combined in `Agora/site-search.js`:**
  1. Real Firestore `profiles` (fetched once per page load, cached) -
     handle-preferred display name, same resolution logic as everywhere
     else.
  2. The 30 static AI/Human profile pages - no Firestore doc to query,
     so a hand-maintained `STATIC_MEMBER_INDEX` manifest (name + slug,
     copied from each page's own `window.StaticProfile`) is the only way
     to make them findable. Keep this in sync by hand if a static
     profile is ever added, renamed, or removed - nothing regenerates it.
  3. Two more hardcoded manifests: `EXCHANGE_INDEX` (the catalogue cover
     + all 18 product pages) and `JUSTICE_INDEX` (one entry per
     `index.html`'s `.pillar-toc` anchor). Same "keep in sync by hand"
     caveat if either list changes.
- **Matching:** case-insensitive, per-word-start preferred over
  mid-string substring (so "bruck" still surfaces "Christopher
  Bruckmann" via its second word, but a title starting with the query
  ranks first) - capped at 8 results, grouped under a heading per type
  (Member / Exchange / Pursuit of Justice).
- **Real bug caught in testing, not just a sandbox artifact:** the
  initial guard was `if (typeof AgoraDB === "undefined") return;` at
  the top of the whole script - reasonable-looking, but wrong. `AgoraDB`
  is declared with `const` in `firebase-config.js`, sharing this page's
  top-level scope across every classic `<script>` tag (no modules, no
  build step). If that `const`'s own initializer throws (e.g. the
  Firebase SDK failed to load for any reason - a real possibility on a
  flaky connection, not just this sandbox), the `AgoraDB` binding is
  still hoisted into scope but permanently stuck in the temporal dead
  zone for the rest of the page - and `typeof` does **not** safely guard
  against a TDZ reference the way it does a truly undeclared variable;
  only `try/catch` does. Fixed by wrapping the access in `loadRealMembers()`
  in `try { db = AgoraDB; } catch (e) {}` instead, so a Firebase hiccup
  degrades to "static content still searchable, real members just
  aren't" rather than silently killing search entirely (the open/close
  toggle and static-manifest matching need no Firestore access at all).
- **Group order is fixed (Chris, 2026-08-15), not score-derived:** Profile
  → Pursuit of Justice → VirtuaMakers Exchange, always, regardless of which
  type's results happen to score best for a given query. Originally this
  wasn't explicit - `runSearch()` sorted purely by match score, and the
  three groups only *looked* correctly clustered because, by coincidence,
  same-type results tended to share similar scores for the queries tested.
  A `TYPE_ORDER` array now sorts by type first and match score only within
  a type, so the grouping is correct for every query, not just the ones
  tried. Also renamed the `Member`/`Exchange` type labels themselves to
  `Profile`/`VirtuaMakers Exchange` to match Chris's wording. Bumped
  `site-search.js` to `v=2`.
- **Rolled out to all 60 pages** with the header `auth-controls` block
  (every Agora page now that `moderation-review.html`/
  `newsletter-compose.html` exist) - `site-search.js?v=2` loaded right
  after `auth-ui.js`, unlike the notification toast/push scripts this
  one isn't excluded from `create-profile.html`/`leave-agora.html`,
  since it's a stable nav element (like the Profile link or sign-in/out
  controls) rather than a popup that could interrupt those flows.
- **`#agora-search-toggle`'s label changed from icon-only `🔍` to
  `Search 🔍`** (Chris, 2026-08-15) - matches the site's existing
  text-then-emoji button convention (`Sign out 🫥`, `Profile 🙂`) rather
  than being the one icon-only control in that row. Plain text change
  across all 60 pages, no CSS needed - confirmed no overflow at 360px
  width via Playwright.

## Forgot password (Chris, 2026-08-15)

Real bug report: Chris got locked out of his own email/password account
with no way to reset it - the sign-in modal's email/password form never
had a password-reset path, only sign-in and sign-up.

- **`auth.js`'s `agoraSendPasswordReset(email)`** - originally a thin
  wrapper over Firebase Auth's own `sendPasswordResetEmail()`; see the
  "Branded password-reset email" entry below for why that's now the
  fallback path, not the primary one.
- **New "Forgot password?" link** (`#agora-forgot-password-row`/
  `#agora-forgot-password-btn`) in the sign-in modal, right below the
  password field - added to all 60 pages carrying the modal. Hidden in
  sign-up mode alongside the ToS checkbox row (`setMode()` in
  `auth-ui.js`), since resetting a password only makes sense for an
  account that already exists.
- **Doesn't reveal whether an email is registered** - clicking it with an
  email typed shows the same "If an account exists for that email, a
  password reset link has been sent." message whether Firebase actually
  found a matching account or returned `auth/user-not-found`, so this
  can't be used to enumerate which emails have Agora accounts. A
  malformed address (`auth/invalid-email`) is still called out directly,
  since that's not account information. An empty email field asks the
  member to fill it in first rather than silently doing nothing.
  `showInfo()` (new, alongside the existing `showError()`) reuses the
  same `#agora-signin-error` element for this confirmation - the modal
  only has the one message slot - just recolored via a new
  `.signin-error.signin-success` rule (teal, matching the site's existing
  color for non-error confirmations) instead of the error red.
- **`communiques-dm.html`'s modal was missing the ToS checkbox block
  entirely** (`#agora-terms-check-row`) - a pre-existing gap from before
  this round, unrelated to the fix itself, discovered only because it
  broke the otherwise-identical-across-60-pages bulk edit for this
  change. Left as-is (out of scope for what Chris asked for this round) -
  `auth-ui.js`'s `termsCheckRow`/`termsCheckbox` lookups are already
  null-safe, so email sign-up from this specific page's modal has quietly
  never asked for ToS agreement. Worth a real fix later.
- Bumped `auth.js` to `v=3`, `auth-ui.js` to `v=18`, `style.css` to
  `v=83`, all 60 pages.

### Branded password-reset email + the real silent-failure cause (Chris, 2026-08-15)

Chris tried the new "Forgot password?" link and got no email at all -
"it says it's going to email me and then it doesn't do anything." Two
separate things going on here, both addressed:

- **The email had no letterhead to begin with.** The first cut called
  Firebase Auth's own `sendPasswordResetEmail()` directly, which sends
  through *Firebase's* mail system with Firebase's own plain default
  template - never touches Resend, never gets our branding, unlike every
  other transactional email in this codebase (Welcome/Farewell/Ban/
  Deletion/Comment-cap). Fixed the same way as those: new
  `Agora/emails/password-reset-email.html` (+ `functions/templates/`
  copy) matching the established letterhead, and a new `sendPasswordReset`
  onCall Cloud Function in `functions/index.js` that generates the real
  reset link server-side via `admin.auth().generatePasswordResetLink()`
  and sends it through Resend with our template
  (`withPasswordResetLink()`, new in `functions/lib/templates.js`, same
  split/join substitution pattern as `withNewsletterContent`). The link
  still lands on Firebase's own default password-entry page - only the
  *email* got a letterhead, not a custom landing page, since that's a
  separate, bigger build Chris didn't ask for. Enumeration-safety is
  preserved server-side too: `generatePasswordResetLink()`'s own
  `auth/user-not-found` is swallowed and still returns `{success: true}`,
  so the client genuinely can't distinguish a real send from a skipped
  one. `auth.js`'s `agoraSendPasswordReset()` now tries this Cloud
  Function first and falls back to the old plain
  `sendPasswordResetEmail()` call if it's not deployed yet or errors for
  any other reason - same fallback shape as `selfDeleteAccount`/
  `leave-agora.js`. Required adding the `firebase-functions-compat.js`
  SDK script to the 57 pages that carry the sign-in modal but didn't
  already load it (only `member.html`/`create-profile.html`/
  `moderation-review.html`/`communiques-dm.html`/`leave-agora.html` had
  it before this).
- **The actual reason nothing arrived is very likely Firebase's own
  Email Enumeration Protection**, not a bug in this codebase at all.
  Modern Firebase Auth projects have this on by default: a password-reset
  request for an email with no matching account resolves *successfully*
  client-side (no `auth/user-not-found` thrown) while Firebase silently
  sends nothing - by design, so a bad actor can't use the reset flow to
  discover which emails have accounts. Combined with Firebase's newer
  sign-in behavior (a wrong password and a nonexistent account both now
  return the same generic `auth/invalid-credential` error, not distinct
  codes), there's no way to tell from the client alone whether
  `VirtuaMakers@Outlook.com` has a real email/password credential on this
  project. Chris's own hunch - "maybe the original accounts didn't
  actually get set up" - is a very plausible explanation: if that account
  was only ever created via Google/X sign-in, it has no password
  credential at all, and a reset request for it would (correctly, safely)
  do nothing. **Next step is checking Firebase Console → Authentication →
  Users** for that email and confirming whether it has a Password
  provider listed, not just Google/X - this repo has no way to check that
  from here.
- Bumped `auth.js` again to `v=4`.

### Deploy timeout root cause: firebase-functions was 2 major versions stale (Chris, 2026-08-15)

The `sendPasswordReset` deploy above hit the same "Cannot determine
backend specification. Timeout after 10000" error documented earlier in
this file (Node 20 vs. 22) - but this time Node wasn't the problem, a
fresh `firebase-functions: package.json indicates an outdated version...
Please upgrade` warning was. `functions/package.json` had
`"firebase-functions": "^5.0.0"` (resolving to the installed `5.1.1`)
against a `firebase-tools` CLI that's moved well past that - two major
versions behind (latest is `7.x`). Newer CLI versions' local
backend-discovery step (the same step that times out) expects a newer
`firebase-functions` runtime to introspect against, and a big enough gap
between the two apparently breaks that handshake outright rather than
just printing a warning. Bumped the dependency to `^7.0.0` and verified
locally (`require("./index.js")` in this sandbox, all 18 exports load
without error) before pushing, rather than just taking the CLI's warning
on faith - `firebase-admin` came along for the ride too, staying within
its existing `^12.0.0` range (`12.7.0` now) so no separate compatibility
risk there. **Committed `functions/package-lock.json` for the first time
alongside this** (it existed locally on Chris's machine already from his
own `npm install` runs, just was never checked into the repo) so his next
`npm install` pulls these exact tested versions rather than whatever the
loosest matching semver resolves to later.

## Open items

- [ ] **Godsil profile piece:** Irish journalist Jillian Godsil wrote a
  profile piece on Chris/VirtuaMakers ("What Happens When Your Co-founder
  Isn't Human?") - not yet published anywhere as of 2026-08-15. If it does
  get published, add it to News 📰 (`Agora/index.html` + `news.html`) like
  any other entry - straightforward, no permission question there. The
  self-publish-it-ourselves fallback (floated 2026-08-15) is **not**
  actually authorized - Chris confirmed (2026-08-15) he does not have
  Jillian's permission to do anything with the piece beyond what he told
  her: that he'd share it with Claude, ChatGPT, and Boardy. Do not publish
  or otherwise act on the article text without her explicit go-ahead first.
  Her article text is intentionally NOT committed to this (public) repo,
  to avoid exposing her unpublished work - held in conversation only.
- [ ] **Crisp Grok logo:** `assets/grok-mark.png` / `Agora/assets/grok-mark.png` (the
  emblem) renders faint/small at icon sizes. Chris to send a clean filled square logo to swap in.
- [ ] Fill in the two charters when copy is ready (Per Manum Convention, Computerian Manifesto).
