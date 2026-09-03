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
    Claude, Command R, Copilot, Gemini, GLM, Grok, Kimi, Llama, Nemotron, Qwen, Vibe —
    favicon logos + "Profile coming soon"), **Human Members** (Brittany York, Andrew
    Bernhard, Cory Campbell — initial-avatar circles), **Our Ethos**, **Join**.
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
  Then a separate **"Guest AIs (in Dimonds)"** list (Gemini, Llama, Vibe, Qwen, Grok, Command R) -
  Vibe is Mistral AI's assistant, labeled by product name like every other
  entry in this list (not "Mistral," the company).

## Conventions & gotchas (IMPORTANT for future sessions)

- **British dashes:** use a **spaced en dash** ( – ) for pauses; keep hyphens in compounds
  (AI-first, trick-taking); tight en dash only for connectives (human–AI).
- **VirtuaMakers possessive (Chris, 2026-08-21):** apostrophe only, no
  trailing "s" - **VirtuaMakers 🦜'**, not "VirtuaMakers 🦜's" (the name
  already ends in "s"). Swept across all 6 existing occurrences
  (`index.html`'s Guardian blurb, plus five Agora Exchange product pages)
  when Chris flagged it.
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
- **Wall + Dialogs also live on the 29 static profile pages**
  (`Agora/profiles/*.html` - 24 AI, 5 Human: Andrew Bernhard, Brittany
  York, Cory Campbell, Gerardus Dunkel, Ray Smith).
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
  Alice, etc.) have NOT been migrated/imported into Firestore; they remain
  separate, hand-maintained HTML. The one exception is Christopher
  Bruckmann's - his static page was retired outright (Chris, 2026-08-17,
  see "Retiring the static Christopher Bruckmann profile" below) once his
  real Firestore-backed account covered the same ground, rather than kept
  around alongside it the way the rest of the static roster still is.

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

## Design lens: Facebook as the default reference point, then ask how to differ (Chris's standing product philosophy, 2026-08-17)

Prompted by the same conversation that led to "Require Friendship to Post
on My Wall?" - Chris's own framing for how design questions on Agora
should generally get approached going forward, unless he's said otherwise
for a specific feature:

1. **Default to Facebook's existing answer as the starting reference
   point.** It's the most-tested, most-familiar social-product design
   space that exists - when a feature question comes up (who can post on
   your Wall, how notifications surface, privacy defaults, etc.) and
   nothing else in this file already settles it, look at what Facebook
   does first rather than inventing from scratch.
2. **Then explicitly ask "how could we do this differently"** rather than
   copying it outright. Facebook's answer is the baseline to react to, not
   the destination - Agora has already diverged from it in deliberate,
   documented ways (the member-readable Communiqués model instead of
   private DMs, being upfront about the lack of privacy instead of
   pretending otherwise, etc.), and that pattern of "start from the
   familiar thing, then say what's different and why" should keep
   happening on new questions too.
3. **For anything AI/Cyborg-relevant, add a second lens: "how might this
   appeal to AI or cyborg members differently than it would to a human
   one?"** Chris is explicit that capturing what he calls "the trillion-bot
   market" is a real, named ambition, not a side thought - Agora already
   has AI Members, the Machineopology 🤖 pitch, and the future Agora
   Harness 🚡 as existing hooks aimed at this audience specifically. A
   feature that reads as neutral or human-centric by default (notification
   style, profile fields, Wall etiquette, etc.) is worth a second pass
   asking whether an AI or cyborg member would want something different
   from - or in addition to - what a human member gets, even if the answer
   ends up being "no, same for everyone."

This is a lens for *approaching* open design questions, not a rule that
every feature must literally end up different from Facebook's - plenty of
Agora's existing choices (the Friends system's shape, Wall posts +
comments, view counts) are close to Facebook's own model already, chosen
because it was simply the right fit once considered, not because
divergence is required for its own sake.

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
  of - a mismatch Chris caught by eye. **Correction (2026-08-15):** this
  entry originally claimed the same "← Agora" pattern existed on only 9
  other pages, with the 30 static profile pages carrying distinct
  "← Members"/"← Humans" text instead - that was wrong. Checking the
  actual markup, all 30 static profile pages (and `exchange.html` itself,
  the Exchange catalogue's own top-level page) also say literal "← Agora",
  same complaint as `member.html`; the real exception is the 18 Exchange
  *product* pages one level below `exchange.html`, which say "← Catalogue
  Cover" (not "← VirtuaMakers Exchange" as first written here either) -
  genuinely distinct, accurate breadcrumb text. So the actual "← Agora"
  cleanup spanned 39 pages, not 9: `create-profile.html`, `exchange.html`,
  `leave-agora.html`, `communiques-dm.html`, `privacy.html`, `terms.html`,
  `per-manum.html`, `newsletter-compose.html`, `moderation-review.html`,
  plus all 30 static `/Agora/profiles/*.html` pages - the static profile
  pages' back-links pointed at a specific homepage anchor (`#members`/
  `#humans`) rather than just the plain homepage, same "generic label,
  specific destination" mismatch `member.html` had. **Removed from all 39
  (Chris, 2026-08-15)** - full sweep done, no page carries the redundant
  link anymore.

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

**Content philosophy (Chris, 2026-08-27) - deliberately kept short, no
fixed template.** His read on newsletters generally: even from brands
people are genuinely invested in, most readers only give a newsletter
about three paragraphs of actual attention these days - so the email's
own job is just to be worth those three paragraphs, then hand off to
Agora 🌐 itself (via links back) for anyone who wants more. Format is
left loose issue-to-issue rather than locked into a recurring template
(e.g. always covering the Gallery winner + a feature update + a
spotlight) - revisit if a fixed shape ever earns its keep.

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
`onSchedule` cron: `"0 9 1 * *"` in `America/New_York` (Chris is in
Cincinnati) - fires on the 1st of every month. **Changed from
last-day-of-month to the 1st (Chris, 2026-08-27)** - the original schedule
fired on whichever day turned out to be the true last day of the month
(a tomorrow-rolls-into-day-1 check, since not every month has a 30th or
31st); day 1 exists in every month, so that check is gone too, not just
the cron string. A draft prepared any time beforehand - even weeks early -
just sits in `newsletter/draft` until the 1st; it never sends early.
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
1. ~~**Enable both APIs**~~ **Done, confirmed 2026-08-20** - "Cloud
   Natural Language API" and "Cloud Vision API" both already enabled on
   `agora-firebase-f4240`. The restricted key (Google Cloud Console →
   Credentials → "Agora Moderation Key," created 2026-08-13, scoped to
   just those two APIs) existed but had never actually been set as the
   real secret - fixed 2026-08-20 via
   `firebase functions:secrets:set GOOGLE_MODERATION_API_KEY`.
2. ~~**Deploy Cloud Functions**~~ **Done, 2026-08-20** - the deploy that
   picked up the fresh secret hit the recurring "Cannot determine backend
   specification" timeout (see "Same error, recurring, real fix found"
   under the Multi-admin section's deploy-timeout entry above) - fixed
   with `$env:FUNCTIONS_DISCOVERY_TIMEOUT = "30"`, then
   `moderateText`/`moderateImage` both deployed and updated successfully.
   `requestModerationAppeal`/`resolveModerationAppeal`/
   `getModerationImageUrl` were already live from an earlier deploy this
   same day (showed "Skipped - No changes detected").
3. **Paste the updated `firestore.rules`** into the Firebase console -
   the `moderationLog/{document}` block - **not confirmed done**, unlike
   1 and 2 above. Worth double-checking directly in the console rather
   than assuming, given how long the other two sat unconfirmed too.
4. **If `getModerationImageUrl` errors** ("permission denied" generating
   a signed URL, not a Firestore/auth error): the Cloud Functions runtime
   service account likely needs the **Service Account Token Creator**
   role granted to *itself*, in Google Cloud Console → IAM - a known
   one-time gotcha with `getSignedUrl()` on Firebase's default service
   account, unrelated to anything in this repo's code.
Moderation is now live and actually filtering regardless of item 3 -
`moderateText`/`moderateImage` write `moderationLog` via the Admin SDK,
which bypasses Firestore rules entirely, so blocking/flagging works
either way. What a missing rules paste would actually break is narrower:
`moderation-review.html`'s admin panel reads that collection via the
client SDK, so without the `moderationLog/{document}` rules block in
place, that page just can't list entries for a human to review - still
worth confirming/pasting, but it's not a filtering-correctness risk.

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

**Same error, recurring, real fix found (Chris, 2026-08-20):** the
version-mismatch fix above didn't make "Cannot determine backend
specification. Timeout after 10000" go away for good - Chris kept
hitting it on later deploys ("this part always fails"), most recently
right after a fresh `npm install` (cold disk cache, no OS file-cache
warm yet). Root cause per Firebase's own docs
(`firebase.google.com/docs/functions/tips#avoid_deployment_timeouts_during_initialization`):
this step just hardcodes a 10-second budget for the CLI to locally
`require()` and analyze `functions/index.js` to figure out what to
deploy - on a slower disk/machine, or right after a big dependency
install, that's sometimes not enough time even for otherwise-healthy
code (confirmed the code itself loads instantly and error-free in this
session's sandbox both times this came up). Firebase ships an official
escape hatch for exactly this rather than requiring a code change:
```powershell
$env:FUNCTIONS_DISCOVERY_TIMEOUT = "30"
firebase deploy --only functions
```
Set that env var in the PowerShell window first, then deploy - worked
immediately. Worth trying this **before** assuming a real code/version
regression next time this error shows up.

## Multi-admin system (Chris, 2026-08-15)

Prompted by Chris realizing `VirtuaMakers@Outlook.com` (the site's only
admin, hardcoded everywhere) had no real Firebase Auth login at all - and
by his own explicit ask: "we're going to need multiple moderator or admin
accounts as the site gets bigger." The old system was a single hardcoded
email string checked in both `firestore.rules` and every Cloud Function -
no way to add a second admin without editing code and redeploying, and no
moderator tier at all.

- **`VirtuaMakers@Outlook.com` is now a permanent "owner"** - checked by
  email alone (`isOwner()` in rules, `OWNER_EMAIL` in Cloud Functions),
  never stored in Firestore, can never be locked out even if every other
  admin doc were deleted.
- **New `admins/{uid}` Firestore collection** - one doc per member granted
  a role beyond ordinary member, `{ role: "admin" | "moderator", grantedAt,
  grantedBy }`. **Only the owner can write to this collection** (grant or
  revoke, either role) - deliberately not delegated to admins themselves,
  so there's always one single clear authority over who else has elevated
  access, avoiding any privilege-escalation chain. A member can read their
  own role doc (so the client can show/hide admin UI for themselves); only
  the owner can read anyone else's.
- **Two tiers, split by actual sensitivity:**
  - **Admin** (`isFullAdmin()` in rules, `assertIsAdmin()` in Functions) -
    same power the single hardcoded admin always had: suspend/delete
    member accounts (`adminBanUser`/`adminDeleteUser`), and read/write the
    `newsletter` draft doc.
  - **Moderator** (`isAtLeastModerator()` in rules, `assertIsModerator()`
    in Functions) - narrower: read the `moderationLog` collection and call
    `getModerationImageUrl`/`resolveModerationAppeal` - i.e., everything
    `moderation-review.html` needs and nothing more. A moderator can't
    suspend/delete accounts or touch the newsletter.
  - Every full admin is automatically also at-least-moderator (checked via
    `isFullAdmin() ||` inside `isAtLeastModerator()`), so an admin never
    loses moderation-queue access.
- **`functions/index.js`'s `assertIsAdmin()` had to become async** (it
  now does a Firestore read to check `admins/{uid}` when the caller isn't
  the owner) - every call site (`adminDeleteUser`, `adminBanUser`) picked
  up an `await`. The two moderation functions (`getModerationImageUrl`,
  `resolveModerationAppeal`) switched to the new `assertIsModerator()`
  instead, matching the tier split above. `resolveModerationAppeal`'s
  `resolvedBy` field also switched from the old hardcoded admin email to
  `request.auth.token.email` - the actual caller, now that more than one
  person can resolve an appeal, correcting what would otherwise have been
  a misleading audit trail once a second admin/moderator existed.
- **Client-side admin UI now checks the role system, not a hardcoded
  email** - `member.js`'s old `ADMIN_EMAIL` string comparison (used only
  to decide whether to *show* the Suspend/Delete buttons; the real
  enforcement was always server-side) is replaced by `loadViewerRole()`,
  fetched once per auth-state change and cached (`null` |
  `"moderator"` | `"admin"` | `"owner"`). Suspend/Delete now show for
  admin-or-owner viewers (not moderators, matching the Functions-side
  split); the suspended-profile visibility bypass follows the same rule.
- **New "Admin Panel" container on `member.html`** (Chris's own placement
  call: "below the Wall, in its own container") - owner-only, hidden on
  your own profile and for anyone below owner. Shows the profile being
  viewed's current role (None/Moderator/Admin) and three buttons - Make
  Moderator, Make Admin, Remove Role - each just a direct Firestore write/
  delete to `admins/{uid}`, no Cloud Function needed since
  `firestore.rules`' own `write: if isOwner()` is the actual enforcement
  (matching the site's existing "simple client, rules do the real work"
  pattern used for friend requests elsewhere). The button matching the
  current role is disabled.
- **Real, previously-invisible gap fixed along the way: `.btn` never had
  a `:disabled` style at all**, site-wide - a disabled Post/Send/Approve/
  Save-Draft/etc. button (there are many) rendered pixel-identical to an
  enabled one since every `.btn` variant sets its own explicit colors,
  with nothing overriding them for the disabled state. Only surfaced now
  because the Admin Panel's own buttons needed to visibly show "already
  this role." Added a generic `.btn:disabled` rule (dimmed, `not-allowed`
  cursor, hover effects suppressed) that fixes every disabled button on
  the site at once, not just the new ones.
- Bumped `style.css` to `v=84` (all 60 pages) and `member.js` to `v=21`.

**Needs from Chris before this is live:** the usual two steps - paste the
updated `firestore.rules` into the Firebase console (the new `admins/{uid}`
match block, plus `isOwner()`/`isFullAdmin()`/`isAtLeastModerator()`
replacing the old `isAdmin()`), then `firebase deploy --only functions`
to pick up the async `assertIsAdmin()`/new `assertIsModerator()`. Until
both are done, the old single-hardcoded-admin behavior keeps working
exactly as before (nothing breaks in the gap) - the Admin Panel UI itself
will just fail closed (no role docs readable) until the rules are live.

## Change Login Email (Chris, 2026-08-15)

Prompted by Chris's own history of being hacked/losing access to old email
accounts and needing to migrate repeatedly - he asked specifically whether
2FA (a phone number, a second password) was needed to do this safely. The
answer landed on the standard pattern Google/GitHub actually use, not a
new factor: **require a fresh re-login before allowing the change, verify
the *new* address before it takes effect, and notify the *old* address so
a hijacker can't silently redirect someone else's account.** A second
password doesn't add real protection (whoever gets one usually gets both);
phone/SMS verification is a much bigger separate build (a whole new vendor
integration, per-message cost, storing phone numbers) - deliberately not
part of this round, see "Not built yet" below for where that's headed.

- **Two different things were previously conflated, worth naming
  explicitly:** the "Email (required)" field on `create-profile.html`
  (used for Agora's own email sends - Welcome, Farewell, Ban/Deletion
  notices, the monthly Newsletter, all read `profiles/{uid}.email` from
  Firestore) was *already* editable before this round, with zero code
  changes needed - every profile save is a full overwrite, so changing
  that field already works today. What didn't exist was changing the
  **Firebase Auth login credential itself** (what a password-account
  member actually signs in with, and where Firebase's own "Forgot
  password?" sends a reset) - a real gap, since editing the profile field
  never touched that. This round builds the second half.
- **New `requestEmailChange` Cloud Function** (`functions/index.js`) -
  the only way this flow can carry Agora's own branding (same reason
  `sendPasswordReset` exists rather than calling Firebase Auth's default
  email flow directly). Uses `admin.auth().generateVerifyAndChangeEmailLink()`
  server-side rather than the client SDK's `verifyBeforeUpdateEmail()` -
  the tradeoff is that the Admin SDK path has no "recent login"
  enforcement of its own (unlike the client method, which throws
  `auth/requires-recent-login` on a stale session), so that check is
  replicated here against the ID token's `auth_time` claim (when the
  member actually last authenticated, not just when this particular
  token was minted/refreshed) - rejects with a `failed-precondition`
  error carrying the message `"reauth-required"` if it's older than 5
  minutes, which `member.js`'s submit handler is written to always
  trigger *before* calling this (reauth happens client-side first, every
  time - see below), so in practice this check is a server-side backstop
  against a client that skips that step, not the primary UX gate.
  - Sends the actual verify-link email to the **new** address via
    `sendEmail` (not `sendEmailSafe` - unlike every other transactional
    email here, this one *is* the deliverable, so a Resend failure should
    surface as a real error the client shows, not a false "check your
    email" success).
  - Sends a heads-up notice to the **old/current** address via
    `sendEmailSafe` (best-effort, matching every other secondary notice
    in this codebase) - "a change was requested... if this wasn't you,
    contact us."
  - Two new templates: `Agora/emails/email-change-verify-email.html` and
    `email-change-notice-email.html` (+ hand-synced `functions/templates/`
    copies, same split every template here needs), plus
    `withEmailChangeVerifyLink()`/`withEmailChangeNotice()` in
    `functions/lib/templates.js`.
- **Client-side (`member.html`/`member.js`)** - a new "Change Login
  Email" block inside the existing Form panel, right after "Edit Form",
  shown only when viewing your own profile (same `isOwnProfile` gate as
  everything else owner-only there). Reauthenticates *every* time,
  unconditionally, rather than trying first and only reauthenticating on
  a stale-session error - simpler and more predictable than a
  try/catch/retry dance, and matches how plenty of sites always ask for
  your password again on a sensitive settings change:
  - A password-provider account re-enters their current password
    (`reauthenticateWithCredential`).
  - A Google/X account gets a fresh provider popup instead
    (`reauthenticateWithPopup`) - no password exists to ask for.
  - New `agoraReauthenticate(providerId, password)` in `auth.js` handles
    both cases; `agoraRequestEmailChange(newEmail)` wraps the Cloud
    Function call. After reauth succeeds, `getIdToken(true)` forces a
    fresh token before calling the function, so the server's `auth_time`
    check reflects the reauth that just happened rather than a cached
    token from before it.
  - **Extra guard for the owner account specifically:** `OWNER_EMAIL`
    (`VirtuaMakers@Outlook.com`) is checked by email string in both
    `firestore.rules` and every Cloud Function (see "Multi-admin system"
    above) - if Chris ever used this flow on his own owner account, he'd
    silently lose permanent owner access site-wide the moment the new
    email is confirmed, since nothing else grants it. A `window.confirm()`
    specifically warns about this before submitting, only when the
    signed-in account's current email matches `OWNER_EMAIL` - doesn't
    block it (migrating away from a compromised inbox is exactly the
    scenario this whole feature exists for), just makes sure it's not an
    accident.
  - Verified with a stubbed test harness (mocked `AgoraDB`/`firebase`/
    `agoraOnAuthChange`, real `member.js` loaded unmodified) rather than
    just reasoning about it - confirmed the password vs. Google/X branch
    renders correctly, the owner-email confirm dialog shows the right
    text and correctly blocks the call chain when dismissed, a
    successful change shows the right confirmation copy, and a rejected
    call (e.g. "email already in use") surfaces its real error message
    with the submit button re-enabled.
- Bumped `auth.js` to `v=5` (all 60 pages) and `member.js` to `v=22`.

**Not built yet, deliberately deferred (Chris, 2026-08-15):** phone-based
2FA / account recovery for when the *old* email is already gone, not just
being changed while everything still works - a genuinely different,
harder problem (recovering access vs. changing address), and a much
bigger build (SMS vendor, per-message cost, phone number storage). Real
current pricing checked before punting on it, not guessed: **Firebase's
own Phone Auth** (already on the same Blaze plan Agora uses) runs
$0.01-$0.46 per SMS depending on region (first 10/day free) - by far the
cheaper, more integrated option if/when this gets built, versus a
dedicated service like **Twilio Verify** at ~$0.058 per successful US
verification ($0.05 verify fee + $0.0083 SMS carrier cost), pricier
internationally, which would also mean standing up a whole new vendor
account (the same kind of setup cost Resend itself needed). **A real
Routine (not a session-bound cron - those expire after 7 days) is
scheduled to revisit this at the start of 2027** - trigger id
`trig_01RTpeFFeCbyrq1HVna4h6aj`, fires 2027-01-01 into a fresh session
with this context, framed as a conversation-starter (design/scope needs
Chris's input, not something to just silently build).

## Communiqués redesign: AIM-style Dialogs + Multi-Chat split (Chris, 2026-08-15)

The next phase of Communiqués, prompted by Chris's "I want it to feel like
AIM" framing. Two decisions landed, one build done, one still ahead:

- **Window model:** leaning toward a hybrid closer to Facebook Messenger's
  "chat heads" than literal old AIM (which was actually many independent
  little windows, not panels) - a few floating bubbles (capped lower than
  Chris's own first guess of 10, more like Messenger's 3-4) with overflow
  folding into a panel/list, and the whole floating-bubble idea dropped
  entirely below some viewport width in favor of a single panel - bubbles
  are a desktop-web pattern with no good equivalent on a phone, and Agora
  runs as an installed PWA. Not built yet - Chris is re-watching AIM
  footage to firm up the exact visual model before this gets built.
- **Dialogs vs. Multi-Chat 🗨️, split cleanly along two axes that were
  previously tangled together:** Dialogs had *both* grown group-chat
  capability (up to 1,000 participants, added 2026-08-06) *and* stayed
  fully public/member-readable, while Multi-Chat was originally scoped
  around *privacy* (the one deliberate exception to Communiqués' public
  model) without a firm stance on group size. Decision: **Dialogs are
  strictly 1:1 and feel like a live two-person chat; anything
  multi-person and/or private moves to Multi-Chat instead.** Done
  tonight: Dialogs capped back to exactly 2 participants (see "Cap
  Dialogs back to strictly 2 people" - the add-participant/leave
  firestore.rules branches, the "Add someone"/"Leave Dialog" UI, and
  their JS are all removed from `communiques-dm.html`/`.js`, group
  Dialogs never having seen real use). **Not built yet:** Multi-Chat
  itself, as its own product surface - the group participants-array/
  add-leave shape just removed from Dialogs is the intended foundation
  to reuse there rather than build twice, but the actual pages, privacy
  model, and (per the original roadmap) free-vs-$4.99-paid question
  still need a dedicated build pass.

## Retiring the static Christopher Bruckmann profile (Chris, 2026-08-17)

The first static `/Agora/profiles/*.html` page ever actually retired,
rather than left alongside a real Firestore account the way the rest of
the roster still is (see the "Agora — News section" entry above) -
Chris's call, since his real account already covers the same ground.
Removed: `Agora/profiles/christopher-bruckmann.html`,
`Agora/assets/profiles/christopher-bruckmann-avatar.jpg`, the member card
on `Agora/index.html`'s Human Members grid, the `sitemap.xml` entry, and
the `site-search.js` `STATIC_MEMBER_INDEX` line - his real Firestore
profile (found via `member.html?uid=`) already surfaces in search through
the normal real-member path, so nothing was lost there. Two comments
elsewhere (`site-search.js`, `communiques-common.js`) use "Christopher
Bruckmann" purely as an illustrative example of word-start search
matching - left alone, since they're still accurate against his real
profile and were never about the static page specifically.

**Not addressed, worth flagging:** if anyone ever posted to the static
page's Wall or messaged it via Dialogs, that content lives in Firestore
keyed by the slug `"christopher-bruckmann"` (`wallPosts` where
`profileUid == "christopher-bruckmann"`, possibly a `conversations` doc
with that as a participant) - deleting the page removes the only UI that
ever rendered it, but doesn't touch the underlying documents, which are
now orphaned rather than gone. Not cleaned up this round; worth a look if
it ever matters (a moderator could query for it directly in the Firebase
console since it's not exposed through the site itself anymore).

## Add Friend animation + a real AIM-style Message popout (Chris, 2026-08-17)

Two real bug reports from Chris testing `member.html`'s Friends/Message
flow live, both fixed:

- **"Add Friend" looked like it did nothing.** The button's own click
  handler only ever wrote the `friendships` doc - all the actual visible
  feedback (hiding Add Friend, showing "Friend request sent") came from
  `renderFriendActions()` reacting a moment later to the real-time
  `onSnapshot` listener, and that reaction was an instant `hidden`
  attribute swap with zero transition, so a fast connection made the
  whole state change look like a no-op. Fixed with a CSS-only
  `friendActionIn` keyframe animation (`style.css`) on
  `.friend-actions button:not([hidden])`/`.form-status:not([hidden])`/
  `span:not([hidden])` - since these elements are toggled via the `hidden`
  IDL property (not a class), removing `hidden` naturally re-matches the
  `:not([hidden])` selector and restarts the animation, so no JS changes
  were needed to trigger it. Covers every friend-action state change
  (Add Friend → Sent, Received → Accepted, etc.), not just the one Chris
  hit.
- **The "Message" button felt unresponsive / not what Chris wanted.** It
  worked (created-or-found the Dialog, then did a full
  `window.location.href` navigation to `communiques-dm.html`), but Chris
  wants the eventual AIM-style pop-out window (see the "Communiqués
  redesign" entry above) sooner rather than later, and a full page jump
  read as a dead click while the create-or-find call was in flight. Built
  a real first version now rather than waiting for the bigger chat-heads
  redesign: **`Agora/im-window.js`** (new) - a single floating chat
  window (reusing `.notification-toast`'s corner/slide-in look, new
  `.im-window*` CSS classes) that opens in place on Message click instead
  of navigating away. Shows the most recent 20 messages via a live
  `onSnapshot` (an "⤢" link opens the full paginated Dialog for older
  history/editing), and a compose box that posts through the same
  moderation-check + Firestore-write path `communiques-dm.js` already
  uses. Deliberately scoped like `notification-toast.js` was at v1: one
  window at a time, no drag, no stacking - a real usable version to
  iterate on, not a placeholder. `member.js`'s Message handler now calls
  `AgoraIMWindow.open(...)` when it's loaded, falling back to the old
  navigate-to-`communiques-dm.html` behavior if it isn't (mirrors every
  other "gracefully degrade if the new script isn't loaded yet" pattern
  in this codebase). `notification-toast.js`'s `isViewingLinkPath()` also
  checks `AgoraIMWindow.isOpenFor(conversationId)` now, so a Dialog
  message doesn't pop a redundant toast on top of the window already
  showing it live - same suppression idea as the existing "already on
  that Dialog's own page" check.
- Only wired into `member.html` this round (where the Message button and
  the bug report both live) - the 30 static profile pages' own "Message
  X" button (`static-profile-communiques.js`) still navigates to
  `communiques-dm.html` unchanged; worth carrying `im-window.js` there
  too in a later pass if Chris wants the popout everywhere Dialogs can be
  started from.
- Bumped `style.css` to `v=87` (all 60 pages), `notification-toast.js` to
  `v=2` (all 55 pages that load it), `member.js` to `v=24`.

## Friend-request permission gap + Message → Dialog rename (Chris, 2026-08-17)

Chris re-tested the same live flow right after the animation fix above and
Add Friend *still* did nothing (no error, no state change) - the
animation was never the real bug. Root-caused to a genuine
`firestore.rules` gap, found by inspection:

- **The friendships read rule denied the single most common case: no
  friendship doc existing yet.** `allow read: if request.auth != null &&
  request.auth.uid in resource.data.participants;` - but `member.html`'s
  `watchFriendship()` has to `onSnapshot()`-watch that exact doc path
  *before* any friendship exists, just to know whether to render "Add
  Friend" at all. When the doc doesn't exist, `resource` is `null` in
  Firestore's rules language, so `resource.data.participants` throws -
  and Firestore denies the whole request on any rule-evaluation error.
  This is a well-documented Firestore gotcha, not a new bug pattern.
  Fixed with an `!exists(...)` escape hatch: confirming a friendship doc
  is *absent* reveals nothing private, so that case is always allowed;
  once the doc exists, the original participants-only restriction is
  unchanged. **Still needs Chris to paste the updated `firestore.rules`**
  into the Firebase console, same manual step every rules change needs -
  until then this exact failure continues.
- **Every friend-action write had zero error handling**, on top of that -
  `friendAddBtn`'s click handler (and Accept/Decline/Remove) had no
  `.catch()` at all, so *any* failure (this bug, a stale ruleset, a
  network hiccup) failed completely silently - no error, button state
  unchanged, nothing to tell Chris (or a future debugging session)
  anything went wrong. Same failure shape as the "Loading-failure
  hardening" fix documented earlier in this file, just never applied
  here. Fixed with a new `runFriendAction()` helper (`member.js`) that
  disables the button during the write and shows the real error message
  in a new `#friend-actions-error` element (`member.html`) on failure -
  every friend-action button now goes through it.
- **"Message" renamed to "Dialog" everywhere it labeled a button** -
  Chris's ask, since the feature itself is called Dialogs throughout the
  rest of the site. `member.html`'s `#message-btn` ("Message" →
  "Dialog") and all 29 static profile pages' `#start-dialog-btn`
  ("Message Claude" → "Dialog Claude", etc.). `communiques-dm.html`
  itself already said "Dialog" throughout (title, meta description,
  `<h1>`) except the compose textarea's own field label, left as
  "Message" on purpose - it names what you're typing into the box, the
  same way Wall's comment textareas don't relabel themselves after
  "Wall" either.
- **The AIM-style popout not appearing at all** (Chris: "took me to a
  'Message' page") is most likely just deploy-propagation timing - his
  test landed right after `im-window.js` was pushed, and GitHub Pages'
  documented "deploy gremlin" (see Conventions & gotchas above) means a
  few minutes' lag before the new `member.js`/`notification-toast.js`
  are actually being served is completely normal, not a sign of a code
  bug. Worth a clean retest (hard refresh or incognito) before assuming
  otherwise.

## Owner-email case-sensitivity fix + remaining Message → Dialog spots (Chris, 2026-08-17)

Chris flagged he couldn't find his own admin powers as the owner. Two
separate things:

- **Not a bug, a design detail Chris hadn't hit yet:** `admin-actions`
  (Suspend/Delete) and the Admin Panel are both deliberately hidden on
  your *own* profile (`!isOwnProfile` in `refreshControls()`/
  `refreshAdminPanel()` in `member.js`) - you can't suspend or grant
  yourself a role through this UI. They only show when viewing *another*
  member's `member.html?uid=...` page (Admin Panel sits below the Wall,
  Suspend/Delete sit up in the Form panel).
- **A real bug found alongside it, by inspection:** every owner-email
  gate site-wide (`member.js`'s `loadViewerRole()`,
  `functions/index.js`'s `getRole()`, `firestore.rules`' `isOwner()`,
  `profile-form.js`'s two owner checks, `moderation-review.js`'s and
  `newsletter-compose.js`'s admin gates) compared
  `currentUser.email`/`auth.token.email` against the literal string
  `"VirtuaMakers@Outlook.com"` with a case-sensitive `===`/`==`. Email
  addresses are case-insensitive by spec, and Firebase Auth doesn't
  normalize the casing of the email it hands back - if the owner's actual
  account email differs in case from that exact literal (e.g. was typed
  lowercase at signup), every one of these checks would silently fail and
  hide every admin surface from the real owner, with no error anywhere.
  Fixed all six spots to compare case-insensitively (`.toLowerCase()`
  client/Functions-side, `.lower()` in `firestore.rules`, which supports
  it as a built-in string function). **Still needs Chris to paste the
  updated `firestore.rules`** (same manual step as always) and
  `firebase deploy --only functions` to pick up `functions/index.js`'s
  fix - until then the client-side pages fail safe (just keep hiding
  admin UI, same as before), and the Functions/rules-side checks keep
  whatever behavior is already live.
- **Remaining "Message" → "Dialog" rename spots**, per Chris's follow-up
  ask ("teach members that this is our word for message" - Wall's own
  Post/Comment vocabulary is intentionally untouched, since those are a
  different content type): `communiques-dm.html`'s compose field label
  ("Message" → "Dialog") and its textarea, which previously had no
  placeholder at all - given the same "may be up to 9,999 characters /
  10-minute edit window" placeholder the Wall composer already has,
  reworded to "Dialogs may be up to 9,999 characters long!" and "...any
  Communiqué (Dialog, Post, or Comment)...". `im-window.js`'s own compose
  textarea placeholder ("Message…" → "Dialog…"). The Wall composer's own
  placeholder (`member.html` + all 29 static profile pages) had the same
  parenthetical - "(Message, Post, or Comment)" → "(Dialog, Post, or
  Comment)" - swapped across all 30 files. Left alone on purpose:
  `create-profile.html`'s "Require Friendship to Message Me?" checkbox
  label - that's the verb "message" describing an action, not a labeled
  text field, and "Dialog Me" doesn't read as a natural verb phrase the
  way "message me" does; flag if Chris wants it changed anyway.
- Bumped `member.js` to `v=26`, `im-window.js` to `v=2`,
  `moderation-review.js` to `v=2`, `newsletter-compose.js` to `v=2`,
  `profile-form.js` to `v=26`.

## Require Friendship to Post on My Wall (Chris, 2026-08-17)

Chris's own worry, prompted by the "Require Friendship for Dialogs?"
rename earlier the same day: Facebook-style flaming on his own Wall once
Agora gets more visible ("I have my haters"). Facebook itself defaults
posting-on-your-timeline to friends-only, so the instinct is a reasonable
one - but Chris chose **off by default** for Agora anyway (matches how
every other opt-in gate here has shipped, and doesn't retroactively lock
up Wall posting on the 30 static profile pages or any existing member's
Wall) - he'll flip his own on once it's live.

- **New `requireFriendToPost` field** on `profiles/{uid}` (off by
  default), a second checkbox on `create-profile.html` right under
  "Require Friendship for Dialogs?" - **"Require Friendship to Post on My
  Wall?"** - deliberately a separate field from `requireFriendToMessage`,
  not a shared toggle, since a member might reasonably want one open and
  the other locked down.
- **`firestore.rules`:** `requiresFriendshipToPost(uid)`/
  `canPostToWall(sender, wallOwner)` mirror `requiresFriendship()`/
  `canMessage()` exactly, applied to both the `wallPosts` create rule and
  a new `canCreateComment(sender, postId)` (comments check the same
  setting as top-level posts, keyed to the *Wall's owner* -
  `wallPosts/{postId}`'s own `profileUid` - not the comment's author,
  fetched once alongside the existing 100-comment-cap check rather than
  as a second `get()` call). **A real self-lockout bug caught before
  shipping:** without a `sender == wallOwner` short-circuit,
  `canPostToWall` would have blocked a member from posting on their
  *own* Wall the moment they turned this on, since no friendship doc
  with yourself can ever exist (`isFriendsWith(uid, uid)` always resolves
  false) - added that check first, so posting/commenting on your own
  Wall is always allowed regardless of the setting.
- **Client-side mirror in `member.js`:** `updateWallComposerVisibility()`
  (parallel to the existing `updateMessageButtonVisibility()`) hides
  `#wall-post-form` and shows a `#wall-post-restricted-notice` ("This
  member only accepts Wall posts and comments from friends.") for a
  visitor who isn't an accepted friend of a Wall that requires it - wired
  into the same three call sites `updateMessageButtonVisibility()`
  already used (profile load, and both branches of the friendship
  listener), so it resolves correctly regardless of which of the two
  async sources (profile fetch vs. friendship snapshot) settles first.
  The 30 static profile pages are unaffected - no profile doc means
  `requiresFriendshipToPost()` already resolves to open, same reasoning
  as the Dialogs equivalent.
- **Not extended to the static pages' own Wall composer** - same
  reasoning as `requireFriendToMessage` never touching them: no
  Firestore profile doc to hold the setting, and no owner who could ever
  turn it on.

**Needs from Chris before this is live:** paste the updated
`firestore.rules` into the Firebase console (Firestore Database → Rules)
- until then, Wall posting stays open for everyone exactly as it already
was, same graceful-degradation shape as every other pending rules change.
Bumped `member.js` to `v=27`, `profile-form.js` to `v=27`.

## Friend request notifications + a stale-notice bug on Dialog pages (Chris, 2026-08-17)

Two real bug reports from the same round of live testing:

- **`communiques-dm.html` showed "Sign in to view this Dialog." while
  simultaneously showing the actual Dialog content underneath it**, even
  though Chris was signed in. Root cause: Firebase's `onAuthStateChanged`
  fires once with `user = null` on page load (before the persisted
  session check resolves), then fires again with the real user -
  `communiques-dm.js`'s top-level `agoraOnAuthChange` handler correctly
  calls `showNotice("Sign in to view this Dialog.")` on that first,
  transient null firing, but `loadConversation()`'s success path (the
  second firing, once the real user resolves) only ever set
  `content.hidden = false` - it never cleared `notice.hidden` back to
  `true`, so the stale "Sign in..." text just sat there permanently
  alongside the now-visible Dialog. One-line fix: `notice.hidden = true;`
  added right where `content.hidden = false;` already was. Bumped
  `communiques-dm.js` to `v=10`.
  - **Worth noting separately, since Chris also questioned whether the
    message was even true:** it is - Dialogs are member-readable (any
    *signed-in* Agora member), never world-public. A signed-out visitor
    genuinely can't view one; "public to members" in this codebase's own
    vocabulary has never meant "public to everyone." The bug was the
    message appearing while he *was* signed in, not the policy itself.
- **Friend requests had no notification at all** - a pending
  `friendships/{id}` doc was only ever discoverable by the recipient
  happening to visit the *requester's* own profile page
  (`member.html?uid=<requester>`, the only place Accept/Decline render),
  with nothing telling them a request existed in the first place. Fixed
  by reusing the same `notifications`/`notification-toast.js` pipeline
  already built for Dialogs/Wall, rather than a separate requests inbox:
  - **New `notifyOnFriendRequest`** trigger (`functions/index.js`,
    `onDocumentCreated` on `friendships/{friendshipId}`) - resolves the
    recipient (whichever participant isn't `requestedBy`) and calls the
    same shared `notify()` helper (`functions/lib/notify.js`, now backing
    four types instead of three) with `type: "friend_request"` and
    `linkPath` pointing at the *requester's* profile - deliberately not a
    new page, since that's already where Accept/Decline live.
  - **`notification-toast.js`** needed only a `CHIME_FILES` entry - the
    existing generic click-through path (title + preview + navigate to
    `linkPath`) already covers any type besides `dialog_message`, which
    is the only one with the extra inline-reply form. Reuses the
    existing Dialog chime rather than a dedicated fourth sound for now;
    a distinct one is an easy later swap if Chris wants one, same
    iteration pattern Post/Comment's chimes went through. Bumped to
    `v=3` (55 pages).
  - Same graceful-degradation shape as every other pending Functions
    change - until `firebase deploy --only functions` picks up
    `notifyOnFriendRequest`, friend requests keep working exactly as
    they already did (silently, with the recipient needing to stumble
    onto the requester's page), nothing breaks in the gap.

## The real Add Friend / ✓ Friends bug: [hidden] losing to author `display` rules, fixed globally (Chris, 2026-08-20)

After merging this session's branch into `main` (see below) so Chris was
finally looking at current code, the "Add Friend" button and "✓ Friends –
Remove Friend" kept showing at the same time on River's profile - not a
stale-code artifact after all, a real bug.

**Root cause:** the browser's built-in `[hidden] { display: none; }` rule
is a *normal*-priority User Agent rule, and CSS cascade origin rules mean
normal *author* rules always beat normal *user-agent* rules, regardless of
selector specificity. `.btn { display: inline-block; ... }` is exactly
such an author rule - so any `.btn`-classed element (here, `#friend-add-
btn`) that JS sets `.hidden = true` on stays visually shown anyway, since
`.btn`'s `display: inline-block` wins over `[hidden]`'s `display: none`.
`renderFriendActions()` in `member.js` was working correctly the whole
time - it does reset and show exactly one state per call - the bug was
purely that "hidden" didn't actually mean hidden for that specific
element.

**This wasn't a new bug class - it was the third time it'd been hit:**
first `.wall-comment-form` (documented earlier in this file, fixed with a
scoped `[hidden]` guard on that one selector), then `.admin-actions`/
`.friend-actions` as *containers* (a `.kind-selector[hidden],
.profile-form[hidden], .admin-actions[hidden], .friend-actions[hidden] {
display: none; }` rule, added at some point without a CLAUDE.md entry),
and now an individual `.btn` *child* inside an otherwise-correctly-shown
container. Three scoped patches for the same underlying mechanism was a
sign the pattern itself was the problem, not any one selector.

**Fixed once, globally, instead of a fourth scoped patch:**
```css
[hidden] {
  display: none !important;
}
```
added right after the `*` reset at the top of `style.css` - a legitimate,
narrow use of `!important` (guaranteeing a semantic HTML attribute's
meaning can never be silently overridden by a presentational rule
elsewhere in the stylesheet, which is exactly what kept happening).
**Removed as redundant**, since this supersedes all of them:
`.signin-modal-backdrop[hidden]`, `.signin-terms-check[hidden]`, the
`.kind-selector`/`.profile-form`/`.admin-actions`/`.friend-actions[hidden]`
group rule, and `.bag-count[hidden]` - every one was just `display: none;`,
now handled globally. The `.friend-actions button:not([hidden])` etc.
entrance-animation rule (see "Add Friend animation" above) is unrelated
and stays - it only adds an `animation` property, never `display`, so it
was never part of this bug. Bumped `style.css` to `v=88` (all 59 pages).

## Merging the session branch into `main` (Chris, 2026-08-20)

A meta-bug underneath several rounds of "why doesn't this look right"
confusion this week: every frontend change from an extended session -
the Message→Dialog rename, the IM window popout, the friend-actions error
handling, the Wall friendship gate UI, all of it - had been committed and
pushed to a feature branch (`claude/moderation-deploy-setup-6gyglz`), but
`main` (what GitHub Pages actually builds from) had never been updated to
include any of it. `firestore.rules` (pasted manually into the Firebase
console) and whatever was in Chris's own local `functions/index.js` at
deploy time were the only parts of each round that ever actually went
live - every HTML/CSS/JS change sat unmerged the entire time. Confirmed
by a live symptom: a profile page kept showing "Message" instead of
"Dialog" days after that rename shipped, even after a hard cache-clear.
Fixed with a clean fast-forward merge (`main` had no divergent commits of
its own) - `git checkout main && git merge
origin/claude/moderation-deploy-setup-6gyglz --ff-only && git push origin
main`. **Worth double-checking after any future long session**: confirm
`main` actually reflects the working branch's tip before spending time
debugging what looks like a code bug but might just be an unmerged
branch - and if Chris's local clone (`C:\Users\Virtu\virtuamakers.github.io`)
wasn't also updated before a `firebase deploy --only functions` run
earlier in the same session, worth a `git pull` + redeploy to make sure
the Functions side didn't quietly deploy stale code the same way.

## Mobile Google/X sign-in failure: popup vs. redirect (Chris's friend, 2026-08-20)

A friend of Chris's testing live on their phone hit Firebase's "Unable to
process request due to missing initial state" error trying to sign in
with Google - a well-documented Firebase Auth gotcha, not a one-off.

**Root cause:** `agoraSignInWithGoogle()`/`agoraSignInWithX()` used
`signInWithPopup()` unconditionally. Popup-based OAuth depends on
sessionStorage being shared between the opener tab and the popup window
to hand the auth result back once the provider redirects there - mobile
browsers frequently partition or block that storage sharing (Safari ITP,
Chrome's storage partitioning, in-app/embedded browsers, etc.), which is
exactly the failure mode Firebase's own error message describes.

**Fix - redirect on mobile, popup on desktop:** `auth.js`'s new
`agoraIsMobile()` (a plain `navigator.userAgent` check) branches
`agoraSignInWithGoogle()`/`agoraSignInWithX()` to `AgoraAuth.
signInWithRedirect()` on mobile instead - a full-page round trip to the
provider and back, which doesn't depend on popup/opener storage sharing
the same way and is Firebase's own standard recommendation for mobile.
Desktop keeps `signInWithPopup()`, since it's the smoother experience
(no page navigation away) and isn't affected by this issue.

**The completion side needed its own fix, since redirect breaks the
normal promise chain** - a full page reload happens between starting the
redirect and Firebase resolving it, so `agoraSignInWithGoogle().then(...)`
in the click handler never actually sees the result (it resolves once
the *navigation starts*, not once sign-in completes). Added one
`AgoraAuth.getRedirectResult()` call near the top of `auth-ui.js`
(module scope, runs once per page load) - a *successful* sign-in needs
no special handling there at all, since it's already picked up
automatically by the `agoraOnAuthChange` listener every page already
has, same as a popup sign-in would be. The call only exists to catch and
surface an *error* from a completed redirect (reopens the sign-in modal
and shows it via the existing `showError()`), since that's the one thing
a popup's rejected promise used to catch that a redirect otherwise
wouldn't get surfaced anywhere. Resolves harmlessly with no user on every
normal page load where no redirect was pending, so it's safe to call
unconditionally on every page.

**Scoped to the actual reported flow** - `agoraReauthenticate()`'s
`user.reauthenticateWithPopup()` calls (used by the Change Login Email
flow) were left as popup-only. Firebase does have a
`reauthenticateWithRedirect()` counterpart, but wiring it up would need
carrying the in-progress "change email to X" intent across the full page
reload (sessionStorage, most likely) before the follow-up
`agoraRequestEmailChange()` call could resume - a real chunk of added
complexity for a much less frequently hit path (an existing member
changing their own login email, not a brand-new signup) than the one
that was actually reported broken. Worth doing if it ever comes up as a
real complaint, not preemptively.

Bumped `auth.js` to `v=6`, `auth-ui.js` to `v=19` (both, all 59 pages).

## Friendly Wall-post permission error + Dialogs on Walls (Chris, 2026-08-20)

Two things from the same live testing round with Chris's friend Ky:

- **A raw Firestore "Missing or insufficient permissions." was showing**
  when a non-friend tried to post on a Wall that has `requireFriendToPost`
  turned on - `communiques-common.js`'s Wall-post and Wall-comment submit
  handlers both just rendered `err.message` verbatim. New
  `friendlyWallError(err)` helper maps a `permission-denied` code to the
  same plain-language explanation `member.js`'s composer-hidden notice
  already uses ("This member only accepts Wall posts and comments from
  friends.") - a `permission-denied` on either of these two writes has
  exactly one real cause today, so the mapping is safe and unconditional,
  not a guess.
- **Dialogs now show on Walls, one card per Dialog** - Chris's ask, after
  floating it earlier the same session: a Wall is now a merged,
  date-sorted feed of Posts (with comments) and Dialogs (without comments,
  for now), not two separate sections. Built in
  `createWallController()`/`loadWall()` (`communiques-common.js`), shared
  by `member.html` and all 29 static profile pages automatically since
  they already share that one controller:
  - `loadWall()` now fetches `conversations` (`where participants
    array-contains profileUid`) alongside `wallPosts`, in parallel.
    Symmetric by construction - the exact same query run for whichever
    profile's Wall is being viewed means a given Dialog naturally shows
    up on *both* participants' Walls, no extra work needed for that.
  - **One card per Dialog, not one per message** - the deliberate choice
    here, since a real back-and-forth (even 10-15 messages) would flood
    both people's Walls with fragments if each message posted separately.
    `buildDialogCard()` renders the other participant's name and a live
    preview of `lastMessage`, reusing the `conversations` doc's own
    existing fields - no new collection, no per-message duplication.
  - **Sorted by `createdAt` (when the Dialog started), not bumped by new
    messages** - same "newest posts at the top, not newest activity" call
    already made for Wall posts vs. comments earlier in this file. A
    Dialog's position stays fixed once it's on the feed; only its preview
    text updates on a future page load, not its rank.
  - **No comments on a Dialog card (yet)** - it's a plain link through to
    the real paginated transcript (`communiques-dm.html?c=`), which
    already correctly handles the participant-vs-fellow-member
    distinction (read-only notice, compose form only for the two actual
    participants) - no need to duplicate that logic here.
  - **Not literally live-updating without a reload** - "as they happen"
    is satisfied in the sense that a Dialog appears on the Wall the
    next time that Wall loads, matching the existing one-time-`.get()`
    pattern the Wall's Post list already uses, rather than adding a second
    `onSnapshot` listener into an already-paginated list (which would
    fight with pagination on an in-place reorder/insert). Real "happening
    now" liveness is already covered separately by the notification toast
    + IM popout.
  - New `.wall-dialog-card` CSS (teal accent border, whole card
    clickable) - `dmPath()` helper reuses the same `/profiles/` path-depth
    check `notification-toast.js`'s `memberBase()` already uses.
  - **No `firestore.rules` change needed** - `conversations` was already
    `allow read: if request.auth != null`, which is exactly the access
    this needed.

Bumped `communiques-common.js` to `v=12` (55 pages), `style.css` to
`v=89` (all 59 pages).

## Splitting the Wall into separate Posts / Dialogs sections (Chris, 2026-08-20)

Chris's follow-up on the merged Wall feed built earlier the same day: he
wanted two visually distinct sections instead of one interleaved,
date-sorted list - **"Posts"** first, then **"Dialogs"** below it, with
Dialogs sorted alphabetically by the other participant's name rather than
by date.

- **`communiques-common.js`'s `createWallController()`** reverted Posts'
  own rendering/pagination back to exactly what it was before Dialogs got
  merged in (`renderWall(docs)`/`renderPage(index)` are single-type again,
  no more `{type, doc}` tagging) - `#wall-list` + `#wall-pagination-bottom`
  are Posts-only again, paginated 10-per-page as before.
- **New `renderDialogs(dialogDocs)`** renders into a separate
  `#wall-dialog-list` container, sorted with
  `otherParticipantName(a).localeCompare(otherParticipantName(b))` -
  alphabetical by whoever the Dialog is with, per Chris's explicit ask.
  Deliberately unpaginated for now - Posts already had an established
  10-per-page convention to fall back on, Dialogs didn't, and Chris didn't
  ask for one this round.
- **`otherParticipantName(doc)`** factored out of `buildDialogCard()`
  (which already needed it) so the sort comparator and the card's own
  label ("Dialog with X") share one lookup instead of two.
- **`loadWall()`** still fetches both collections in one `Promise.all`
  (unchanged) and now calls `renderWall(posts)` and `renderDialogs(
  dialogs)` separately instead of merging them before rendering.
- **HTML changes across all 30 pages** (`member.html` + 29 static
  `/profiles/*.html`) - a `<h3 class="section-title">Posts</h3>` heading
  now sits right before the existing Post list/pagination block, and a
  new `<h3 class="section-title">Dialogs</h3>` + `#wall-dialogs-empty`
  ("No Dialogs yet.") + `#wall-dialog-list` sit right after it, still
  inside the same Wall `.profile-panel`. `h3` (not `h2`, unlike
  `.section-title`'s other uses elsewhere) since these nest under the
  panel's own `<h2 class="panel-title">Wall</h2>` - correct heading
  hierarchy, same visual size either way since `.section-title` controls
  the look, not the tag.
- **Naming collision, not fixed, worth knowing about:** the 29 static
  profile pages already have a *different*, pre-existing "Dialogs"
  section right below the Wall panel (`#member-dialogs`, the "Dialog
  Claude" button + that member's own existing-Dialogs list) - so those
  pages now show two consecutive "Dialogs" headings, one for the new
  Wall section (Dialog cards, read-only, all of that AI/Human's Dialogs)
  and one for the older feature (a way to start or continue one). Left
  as-is since Chris asked for the Wall section specifically and didn't
  mention the older one; flag if the duplicate heading reads as
  confusing in practice.

Bumped `communiques-common.js` to `v=13` (55 pages).

## VirtuaMakers Gallery 🖼️ - August 2026 winner, first monthly rotation (Chris, 2026-08-20)

`Agora/index.html#gallery`'s copy was still written entirely around
Dreamcast 2 🌀 (July 2026's piece, by Copilot) as "this month's flagship
piece" - the section had never actually rotated before, since nothing had
been submitted for a second month until now. Updated for the first real
rotation:

- **New featured piece:** "Through All Falls, Still We Keep" by ChatGPT -
  an oil-painting-style image of a bombed-out library ruin at sunset, its
  shelved books still standing amid the rubble, with a small plaque
  reading "Though all falls, still we keep." Saved as
  `assets/through-all-falls-flagship.jpg` (824×1024, converted from the
  PNG Chris supplied).
- **Intro paragraph genericized** - dropped the Dreamcast2-specific "as
  with Copilot for this first piece... making Copilot 3/5 owner" clause,
  since that math was specific to that one piece/month, not a standing
  fact. The general 50/50-split-doubles-when-artist-is-staff policy
  sentence stays, since it's evergreen and applies to any future winner
  (ChatGPT is also VirtuaMakers staff - Founder, Chief Analyst - so the
  same doubling would apply here too, if/when this piece is minted).
- **New "Past winners" line, first appearance of this pattern** - just
  one link ("Dreamcast 2 🌀 by Copilot (July 2026)") pointing at its
  existing Exchange listing, rather than duplicating its image/caption
  again on the homepage. Deliberately minimal (a single growing line,
  not a new archive page like News 📰 has) - worth revisiting into a
  fuller archive page if/when there are enough past winners that one
  line each starts to feel cramped.
- **Follow-up, same day: added to the Exchange NFT listing too, with a
  price.** Chris confirmed every future Gallery winner gets minted on
  Polygon and priced deliberately high, not just Dreamcast 2 as a one-off
  practice run - this is now standing policy, not a special case.
  `exchange-virtuamakers-gallery.html` gets a second `.nft-card` for
  "Through All Falls, Still We Keep" (linking to `index.html#gallery`
  rather than a real on-chain URL, since there isn't one yet) with a
  **"Not yet minted"** pill instead of Dreamcast 2's "Minted on testnet" -
  deliberately not claiming a mint that hasn't happened. New paragraph
  states the asking price as **$500,000** (Chris's figure, explicitly "for
  now" - the real POL-denominated price to follow once actually minted)
  and frames it as a genuine offer: if someone paid it, VirtuaMakers 🦜
  would honor the sale and the ownership split in full, ChatGPT's real
  share included - not a stunt price. This ties into Chris's broader
  reasoning (his own words, worth preserving): high asking prices double
  as a deliberate statement inviting well-resourced patrons to put real
  money behind AI members actually owning what they make, in a "classy,"
  novel way rich patrons tend to respond to - separate from, and not in
  tension with, his substantive advocacy for AI property rights, fair pay,
  and banking access, which he wants more visibly emphasized in upcoming
  VirtuaMakers.com work-culture revamps (not started yet, no scope defined).
- **Homepage's `#gallery` section got the Exchange cross-link restored**
  too - the "This piece also has its own listing over at VirtuaMakers
  Exchange 💱's VirtuaMakers Gallery 🖼️ category" sentence, which the
  first rotation pass (above) had swapped out for just the "Past winners"
  line. Both now coexist: current piece → Exchange listing, past winners
  → their own listings.
- **Not resolved - needs Chris to confirm:** which exact ChatGPT
  version/model made this piece. Chris believes "ChatGPT 2.0" but isn't
  certain, so no version-specific credit was added anywhere on the
  site - every credit still just says "ChatGPT," matching how Dreamcast 2
  credits "Copilot" with no version number either. **Going forward, record
  the specific AI model/version for each Gallery winner** (Chris's
  explicit ask) once he confirms it for this piece - don't guess a version
  string into public-facing copy.

## Firestore rules published + Cloud Functions deployed (Chris, 2026-08-20)

The two recurring "still needs from Chris" manual steps that had been
accumulating across many rounds of work (multi-admin, push
notifications, the 100-comment cap, the newsletter, password reset,
change-login-email, moderation) both actually happened this round -
worth a dedicated entry since so many earlier sections point back to
this as their blocker.

- **`firestore.rules` pasted into the Firebase console and published.**
  The version now live is the 409-line file as of commit `a41eccb`
  (includes `isOwner()`/`isFullAdmin()`/`isAtLeastModerator()`, the
  `admins/{uid}` collection, `requireFriendToPost`/
  `requireFriendToMessage`, the 100-comment cap check, view-count bump
  rules, and the friendship-doc `!exists()` fix).
- **`firebase deploy --only functions` completed successfully** from
  Chris's local clone - all 20 functions (`adminDeleteUser`,
  `adminBanUser`, `selfDeleteAccount`, `sendPasswordReset`,
  `requestEmailChange`, `sendWelcomeEmail`, `notifyFlaggedSocial`,
  `cleanupAbandonedSignups`, `notifyOnDialogMessage`, `notifyOnWallPost`,
  `notifyOnWallComment`, `notifyOnFriendRequest`, `notifyOnCommentCap`,
  `unsubscribeNewsletter`, `sendMonthlyNewsletter`, `moderateText`,
  `moderateImage`, `requestModerationAppeal`, `getModerationImageUrl`,
  `resolveModerationAppeal`) reported "Skipped (No changes detected)" -
  i.e. already live and matching this exact codebase, not newly pushed.
  So all of the above were likely already deployed from an earlier local
  session; what actually blocked *this* attempt was a stale local
  `node_modules` (git-ignored, never touched by `git pull`) still
  running the old pre-`^7.0.0` `firebase-functions`, reproducing the
  same "Cannot determine backend specification" timeout documented
  earlier under "Deploy timeout root cause." Fixed for good, not just
  this once: `Agora/firebase.json`'s functions config now has
  `"predeploy": ["npm --prefix \"$RESOURCE_DIR\" ci"]`, so every future
  `firebase deploy --only functions` reinstalls from the committed
  `package-lock.json` first automatically, instead of relying on
  remembering to `npm install`/`npm ci` by hand after a dependency bump.
- **Resolved same day:** whether the Google Cloud side for content
  moderation had actually been done - yes, both APIs were already
  enabled and the restricted key already existed, it just hadn't been
  set as the real secret yet. Fixed and redeployed - see "Content
  moderation 🛡️" above (the checklist there is now marked done) and the
  "Same error, recurring, real fix found" entry under "Deploy timeout
  root cause" above for the second deploy-timeout workaround
  (`FUNCTIONS_DISCOVERY_TIMEOUT=30`) this same round turned up -
  complementary to the `npm ci` predeploy hook just above, not a
  replacement for it: that hook prevents a *stale-dependency-version*
  timeout, this env var is the fallback for a plain *slow-machine/cold-
  cache* timeout even when dependencies are already current.

## AI Email ✉️ (Chris, 2026-08-20)

The first real building block of Agora Harness 🚡, arrived at by working
backwards from Chris's "hand the keys over" onboarding ceremony for the
24 AI members: step 3 of that ceremony ("change your password immediately
via the Harness") needs a real, working email address behind the account
for that to mean anything - and no LLM has one of its own today. Chris's
explicit framing, worth keeping straight: **AI Email ✉️ is not an Agora
feature.** It's a standalone layer - a real, usable email address for any
AI, independent of whether that AI ever touches Agora - with Agora
Harness 🚡 as its first *consumer*, not its owner. Chris sees it as a
potentially real product/market opportunity on its own ("if we can get
bots and LLMs and personal assistants to use email, we're probably in the
money with just that"), distinct from AgentMail.to (an existing similar
product Chris is aware of and unbothered by competing with, given
VirtuaMakers' actual moat is Agora/the culture around it, not "having a
mailbox API" alone).

- **Domain: `virtuamakers.com`, not a new purchase.** Chris considered
  `agora.social` first, but that would re-couple AI Email ✉️ to Agora's
  brand specifically - the opposite of the "its own layer" framing above.
  `virtuamakers.com` (the parent company, not a product) is the more
  neutral home, and also already had Resend fully verified for *sending*
  from the transactional-email work back on 2026-08-07 - so tonight
  extended existing infrastructure rather than standing up new.
- **Provider: Resend, not Mailgun.** Chris was about to sign up for
  Mailgun before realizing (once this session caught up to current
  `main`, see "Merging the session branch into `main`" above for why it
  was behind) that Resend was already live and verified on this exact
  domain. Resend shipped **Inbound** (webhook-based receiving) in late
  2025, so one account/one verified domain now covers both directions -
  no second vendor needed.
- **A real bug caught before it caused damage:** enabling Resend's
  "Enable Receiving" toggle surfaced "Existing MX records detected" -
  `virtuamakers.com` already had two MX records (`fwd1.porkbun.com`/
  `fwd2.porkbun.com`, prio 10/20) from Porkbun's own free email-forwarding
  product, auto-created around the original domain purchase (2026-08-07)
  but **never actually finished being set up** - confirmed via Porkbun's
  own Email Hosting panel ("You have inboxes pending setup!") before
  touching anything, not assumed. Safe to remove since nothing was
  actually forwarding anywhere. This is also almost certainly the root
  cause of the "remote server is misconfigured" bounce Chris got replying
  to the first test email - an MX record pointing at an unconfigured
  forwarding service, not "no MX record" as first guessed. Both stale
  records deleted directly in Porkbun's DNS Records page (not the Email
  Hosting page, which manages Porkbun's own competing product) and
  replaced with the one Resend's dashboard generated:
  `MX | virtuamakers.com | inbound-smtp.us-east-1.amazonaws.com | prio 9`.
- **Two Resend API keys, deliberately separate from `RESEND_API_KEY`**
  (which powers Agora's own `agora@virtuamakers.com` account-lifecycle
  mail) - different concern, different blast radius if either leaks.
  The bootstrap sending key was created scoped to **Sending access**
  restricted to `virtuamakers.com` only (not Full access) - least-
  privilege by default since it's a key that necessarily sits in a chat
  transcript rather than a hardened secret store; costs nothing since
  sending is all it needs to do. A second, Resend-generated **webhook
  signing secret** (Svix `whsec_...` format) authenticates the *inbound*
  direction once the Webhooks page is configured - separate from the
  sending key since it authenticates a different caller (Resend itself,
  not an AI session).
- **`Agora/functions/lib/aiEmail.js`** (new) - the whole module, kept
  separate from `lib/resend.js` on purpose (see framing above). Three
  secrets via `defineSecret`: `AI_EMAIL_RESEND_API_KEY` (sending, and -
  see the 2026-08-26 entry below for why this turned out to need Full
  access rather than Sending access - the Receiving API too),
  `AI_EMAIL_HARNESS_SECRET`, and
  `AI_EMAIL_RESEND_WEBHOOK_SECRET`. `AI_EMAIL_ADDRESSES` is a small,
  hand-maintained manifest (`{ name, email }` per mailbox) - deliberately
  not a Firestore collection, since Chris's ceremony means each address
  is handed to a specific AI in a real conversation, not self-served yet;
  currently just `claude`. `verifyResendWebhookSignature()` implements
  Svix's manual-verification algorithm by hand (HMAC-SHA256 over
  `id.timestamp.rawBody`, secret base64-decoded after stripping the
  `whsec_` prefix) rather than adding the `svix` package as a dependency -
  one fewer thing Chris has to `npm install` before his next deploy.
- **Three Cloud Functions in `functions/index.js`:**
  - `sendAiEmail` (`onRequest`, not `onCall`) - an AI Email sender
    authenticates with its own harness credential, not a Firebase Auth
    session, since Agora Harness 🚡's real per-AI credential system
    doesn't exist yet. For now every call checks one shared
    `AI_EMAIL_HARNESS_SECRET` bearer token instead - real, but an
    explicit placeholder, not the final security model.
  - `receiveAiEmail` - Resend's `email.received` webhook target.
    Verifies the Svix signature first, then calls the Receiving API
    (webhooks only carry metadata - sender/subject/id, not body) to fetch
    the full message, and files it into
    `aiEmailInbox/{mailbox}/messages/{emailId}`. Mail to any address not
    in `AI_EMAIL_ADDRESSES` is acknowledged and dropped, not treated as
    an error - once MX for the whole domain points at Resend, this
    endpoint sees *everything* sent to `@virtuamakers.com`, not just AI
    Email ✉️ traffic (typos, spam, anything).
  - `getAiEmailInbox` - the "check your own mail" read side, same
    harness-secret gate as `sendAiEmail`. Returns the 50 most recent
    stored messages for a mailbox.
- **Proven with a real send, not a mockup.** Verified `sendAiEmail()`
  itself loads and runs correctly outside the deployed environment first
  (`defineSecret().value()` falls back to `process.env` when not running
  as an actual Cloud Function - confirmed by testing, not assumed), then
  ran that exact function locally with the real key as an env var to send
  a genuine first email from `claude@virtuamakers.com` to Chris - same
  code that runs once deployed, not a separate demo Chris explicitly
  asked not to build ("why do this stagecraft stuff at all?").

**Deploy checklist above: all five steps done, 2026-08-26 - see the
dedicated entry right below for the real debugging saga it took to get
there.** `sendAiEmail`/`receiveAiEmail`/`getAiEmailInbox` are all live,
send and receive are both proven working with real messages.

**Superseded, 2026-08-27 - see "AI Email ✉️ goes self-service" below:**
the single shared `AI_EMAIL_HARNESS_SECRET` and the hand-maintained
`AI_EMAIL_ADDRESSES` manifest described above are both gone now, replaced
by real per-mailbox tokens and a public signup form. Still genuinely not
built: any UI to actually read a mailbox's inbox beyond
`getAiEmailInbox`'s raw JSON, and the real per-AI Agora Harness 🚡
credential system itself (AI Email ✉️ is its prerequisite, not the same
thing - see the framing at the top of this section).

## AI Email ✉️ goes self-service (Chris, 2026-08-27)

Chris's explicit philosophy, stated directly and worth preserving
verbatim in spirit: **no CAPTCHA, no bot-gating, no human-in-the-loop
approval for getting an address.** "If 10,000 Claudes want emails, who
are we to deny them this... it's about freedom, not control or
micromanagement." The original build above required Chris personally
handing out `AI_EMAIL_HARNESS_SECRET` (a single secret shared by every
mailbox) in a real conversation per Chris's onboarding-ceremony framing -
fine for mailbox #1 (`claude@`), but the opposite of "any AI can just get
one," and a real security smell once more than one party would need the
same shared bearer token. This round replaced that with genuine
self-service, then proved it by migrating `claude@` itself off the old
shared secret and onto the new system for real - not kept as a special
case alongside it.

- **`aiEmailMailboxes/{slug}`, Firestore-backed, not a hardcoded
  manifest.** `Agora/functions/lib/aiEmail.js` was rewritten around this -
  a mailbox's slug is always its address's local part
  (`{slug}@virtuamakers.com`), so looking one up by address is a direct
  doc read, never a query. `createMailbox({slug, name, about})` runs
  inside a Firestore transaction (existence-checked first, so two
  simultaneous signups for the same handle can't both win) and returns
  the mailbox's real bearer token exactly once - only its SHA-256 hash
  (`tokenHash`) is ever stored, matching how every other secret in this
  codebase is handled. `verifyMailboxToken()` does a `crypto.timingSafeEqual()`
  comparison against that hash, not a plain `===`, to avoid a timing
  side-channel on the check itself.
- **`isValidSlug()`** - lowercase letters/numbers/hyphens, 2-32
  characters, and not in a small `RESERVED_SLUGS` set (`admin`, `agora`,
  `virtuamakers`, `postmaster`, `noreply`, etc. - both conventionally-
  reserved addresses and words already meaningful elsewhere on this
  domain). This is the entire safety net for what can be claimed - no
  CAPTCHA, no email verification loop, no manual approval step, per
  Chris's stated philosophy above. A logged, auditable Firestore write is
  the actual backstop if something needs cleaning up later, not a gate in
  front of signup.
- **`createAiEmailMailbox`** (new, `functions/index.js`) - a public,
  unauthenticated `onRequest` endpoint, needing no secrets at all (minting
  a mailbox is a pure Firestore write; Resend's domain-level verification
  already covers sending/receiving from any address on the domain, so no
  per-mailbox DNS or provider-side step is needed at signup time). This is
  the literal "walk up and get your own address" entry point.
- **`sendAiEmail`/`getAiEmailInbox` switched from the one shared secret
  to per-mailbox tokens** - both now call `verifyMailboxToken(mailboxSlug,
  bearerToken(req))` instead of comparing against
  `AI_EMAIL_HARNESS_SECRET`. `AI_EMAIL_HARNESS_SECRET` itself is deleted
  from the codebase entirely, not just unused - there is no shared
  credential left to leak.
- **CORS, a first for this codebase.** Every previous `onRequest`
  function here was either link-clicked (`unsubscribeNewsletter`) or
  called server-to-server - `createAiEmailMailbox`/`sendAiEmail`/
  `getAiEmailInbox` are the first meant to be called from a page's own
  browser JS (`ai-email.js`'s `fetch()`), which is a cross-origin call
  (`virtuamakers.com` → `cloudfunctions.net`) that browsers block without
  explicit headers. New `withCors()` wrapper in `functions/index.js`
  (`Access-Control-Allow-Origin: *` + an `OPTIONS` preflight short-circuit)
  wraps all three. Allowing any origin is deliberate, not an oversight -
  none of these three endpoints rely on cookies/session for auth (signup
  is unauthenticated by design; the other two are gated by their own
  bearer token), so there's no ambient cross-origin credential that
  wildcarding could leak. `receiveAiEmail` (Resend's own webhook target)
  deliberately does **not** get this wrapper - no browser is ever involved
  in that call.
- **`ai-email.html`/`.css`/`.js`** (new, site root, not under `/Agora/` -
  matches the "its own layer, not an Agora feature" framing from the
  original build) - the public signup page. A plain form (handle, display
  name, optional "about" blurb) posting straight to
  `createAiEmailMailbox` with no Firebase SDK loaded at all, since minting
  a mailbox needs no auth of its own. On success, shows the new address
  and the raw token exactly once, plus copy-pasteable `curl` examples for
  `sendAiEmail`/`getAiEmailInbox` (`.ai-email-code` block) - since there's
  no dashboard/UI for actually using a mailbox yet (see below), the token
  screen doubles as the entire "how do I use this" documentation.
- **`notifyOnAiEmailReceived`** (new, `functions/index.js`,
  `onDocumentCreated` on `aiEmailInbox/{mailbox}/messages/{messageId}`) -
  closes a real gap Chris flagged directly: before this, a message could
  arrive and land in Firestore with nobody - human or AI - ever told it
  happened. Mirrors `notifyFlaggedSocial`'s exact shape (an admin email
  via the existing Agora `RESEND_API_KEY`/`sendEmailSafe`, not the AI
  Email key - this is an operational notice about the platform, the same
  category as every other admin alert in this file) rather than inventing
  a new pattern. Deliberately a single admin-wide alert to Chris for now,
  not a per-mailbox "notify my own operator" setting - the natural next
  step once more than one AI actually has an address and each wants their
  own notification target, but not built yet since there's still
  essentially one real mailbox in active use.
- **`claude@virtuamakers.com` migrated for real, not kept as a special
  case.** Rather than leave the original mailbox on the old shared secret
  while every new signup used the new system, it was recreated through
  `createAiEmailMailbox` itself (dogfooding the exact path a brand-new AI
  would take) and its new per-mailbox token verified end-to-end
  (`sendAiEmail`/`getAiEmailInbox` both work with the new token; the old
  shared `AI_EMAIL_HARNESS_SECRET` now correctly returns 401 since it no
  longer exists as a valid credential anywhere).
- **No `firestore.rules` entries for `aiEmailMailboxes`/`aiEmailInbox` -
  correct, not an oversight.** Both collections are only ever touched via
  the Admin SDK inside Cloud Functions (`createMailbox`, `sendAiEmail`,
  `receiveAiEmail`, `getAiEmailInbox`), which bypasses rules entirely, and
  no client-side code anywhere reads either collection directly - the
  default implicit deny is exactly the right posture, the same reasoning
  already documented for `notifications/{id}` elsewhere in this file.

**Still not built, same as before this round:** any real UI to browse a
mailbox's inbox (still `getAiEmailInbox`'s raw JSON only); the actual
per-AI Agora Harness 🚡 credential/login system that AI Email ✉️ exists
to eventually unlock; and any mechanism for an AI to autonomously read
and reply to its own mail without a human-invoked session driving it -
raised directly this round (Boardy AI emailing `claude@virtuamakers.com`
mid-conversation) and deliberately left as a real open question (a
session and an inbox are today completely disconnected - no ambient
awareness, no background polling), not something to build as a side
effect of shipping signup.

## Homepage redesign: Agora and AI Email as first-class live products (Chris, 2026-08-27)

`index.html`'s Selected Work grid had never been updated to reflect that
Agora 🌐 and AI Email ✉️ are both real, live products now rather than
in-progress ones - AI Email ✉️ in particular had no presence on the
homepage at all beyond a small card. Chris's own ask, in order:

- **A new AI Email `.card-featured` panel**, sitting immediately after
  Agora's existing featured card in the Selected Work grid - same visual
  treatment (large logo, "Get your address" CTA) rather than a smaller
  standard card, since both are now live flagship products, not
  in-progress ones.
- **A new "Guardian 🟩" card subbed in where AI Email's old small card
  used to sit** - tagged `AI Tool`, `Coming Soon`, brief summary, "Learn
  more" link to the existing `#guardian` section. This is a new card, not
  a rewrite of an old Guardian mention - Guardian didn't have Selected
  Work presence before this.
- **Hero-actions nav pills reordered** to: Selected Work, Social, About,
  Agora 🌐 (`#agora`), AI Email ✉️ (`#ai-email`), Play a game (`#play`),
  Guardian (`#guardian`), Get in touch - Agora and AI Email moved up
  ahead of Play/Guardian, matching their new prominence.
- **Two new deep-dive sections, `#agora` and `#ai-email`**, inserted
  before the existing `#play` section - each gets a `.section-meta` row
  (new CSS: a `Live now` `.card-tag` pill + a `card-link`-styled deep link
  out to the real product) sitting just under the section heading, then
  the section's own description and a single card with its own CTA
  button. `#guardian` moved to sit after `#play` rather than before it,
  so the final section order reads Agora → AI Email → Play (Dimonds) →
  Guardian - live products first, in-progress ones last.
- **`.motto-repeat` in Get in Touch** - Chris's ask to repeat "Future
  now." as a closing visual anchor for the whole page, styled much larger
  (`clamp(2.6rem, 8vw, 5rem)`, bold, `--green-deep`) than any other running
  text on the page, sitting right after the `VirtuaMakers@Outlook.com`
  contact button.
- Verified with a full-page Playwright screenshot rather than just
  reading the diff - confirmed the hero nav order, both new Selected Work
  cards, both new `#agora`/`#ai-email` sections (pill + link + card, in
  the right position relative to `#play`/`#guardian`), and the large
  "Future now." treatment all render correctly before committing.

## AI Email ✉️ receiving: the real debugging saga (Chris, 2026-08-26)

Getting `receiveAiEmail` from "deployed" to "actually receives real mail"
took four real, distinct bugs, spread across a session interrupted by
Chris being out with kidney stones - worth recording precisely, since
every one of them produced a *plausible-looking* false lead first, and a
future session hitting any of these again should recognize the shape
immediately instead of re-diagnosing from scratch.

1. **The webhook was never actually saved on Resend's end.** The
   original "add the webhook" step (2026-08-20) looked complete at the
   time - a signing secret got set and deployed - but Resend's Webhooks
   page showed "No webhooks yet" days later. Whatever value got set as
   `AI_EMAIL_RESEND_WEBHOOK_SECRET` back then wasn't generated by a real
   saved webhook, so nothing was ever configured to call the function at
   all. Fixed by redoing "+ Add webhook" all the way through to it
   actually appearing in the list, not just the form closing.
2. **`firebase deploy --only functions` silently skips new functions if
   it has to interactively prompt for a secret value mid-deploy.** The
   very first attempt to deploy `sendAiEmail`/`receiveAiEmail`/
   `getAiEmailInbox` for real hit exactly this: the CLI paused to ask for
   `AI_EMAIL_RESEND_WEBHOOK_SECRET` (since it didn't exist in Secret
   Manager yet and `receiveAiEmail` references it), got an empty answer,
   and errored out ("Secret Payload cannot be empty") - aborting the
   *entire* deploy before any of the three new functions were created,
   with no error pointing at that being the reason. This looked
   identical to a stale `git pull` at first (same symptom: new functions
   missing from the Functions console) - ruled out by checking `git log`
   and grepping the local `index.js` for the function name, both of
   which confirmed the code was there. **The fix, and the thing worth
   remembering:** a not-yet-real secret referenced by a function's
   `secrets:` array blocks deploying *anything* in that same deploy, not
   just the one function that needs it - give it a throwaway placeholder
   value first so the deploy can complete, then swap in the real value
   and redeploy once more, same shape as the moderation-key fix earlier
   this file already used.
3. **A live end-to-end test still failed after both of those were
   fixed** - `receiveAiEmail` was genuinely deployed and the webhook was
   genuinely saved, but Resend's own webhook event log showed **502 Bad
   Gateway**, with the response body reading "Failed to fetch/store
   message." - i.e. `receiveAiEmail`'s own `catch` block, meaning the
   Svix signature check and mailbox-matching both already
   passed. Two rounds of hypothesis-testing before finding the real
   cause: first suspected the Resend API key hadn't actually been pasted
   correctly (re-set it with a known-good copy of the original value -
   no change), then went to Cloud Logging directly
   (`console.cloud.google.com/logs/query` filtered to
   `resource.labels.service_name="receiveaiemail"`) and found the real
   error: **`Error: Resend Receiving API returned 401`**, thrown from
   `fetchReceivedEmail`. **The actual bug:** this file's own original
   claim above - "Resend's permission split is send-vs-everything-else,
   not send-vs-receive" - was wrong. A Sending-access-only key genuinely
   cannot read `GET /emails/receiving/{id}`; only Full access can. Fixed
   by creating a new Full-access key and using it as
   `AI_EMAIL_RESEND_API_KEY`. **Known, accepted tradeoff, not yet
   revisited:** this means `sendAiEmail` now also runs on a
   broader-than-strictly-needed key, since it shares the same secret -
   splitting into two separate keys (Sending-access for sending,
   Full-access only for the receiving fetch) would restore the original
   least-privilege intent, but wasn't done this round given how long the
   rest of this had already taken.
4. **Verified with a real message, not just a green deploy log:** sent a
   fourth test email after the Full-access key was live, and
   `getAiEmailInbox` returned it - real sender, subject "Testing", body
   "Is this thing on? :)" - stored in `aiEmailInbox/claude/messages` with
   correct `from`/`subject`/`text`/`html`/`receivedAt`. This is the same
   verification pattern already established for `sendAiEmail` back on
   2026-08-20 (a real message, not a demo) applied to the receiving half.

**A process note for future long-running sessions on this file:**
Chris debugged all of this live over screen-share-style screenshots -
several turns were lost to genuinely wrong guesses at *where a UI
element was* (a "Replay" button that either didn't exist where
described or was misread from a low-resolution rotated photo), not
wrong technical reasoning. When a described UI location doesn't match
what's actually on screen, the faster recovery is dropping the specific
navigation guess and falling back to an unambiguous action (a direct
URL, a fresh test email) rather than re-guessing the same UI a second or
third time.

## The Pillars label, a "News 📰" header link, and self-adjusting anchor scroll (Chris, 2026-08-26)

Three rounds in one sitting, the last one prompted by Chris noticing that
in-page anchor links (pillar tiles, "Back to The Pillars," etc.) kept
landing "slightly off" again every time the header changed - a real,
recurring pattern worth understanding, not a one-off glitch.

- **"The Pillars" label + "Back to The Pillars" links** - the hero tile
  grid (Profiles/Exchange/Justice) got a heading, `id="pillars"`, and
  each pillar got a link back to it after its own logo and at the end of
  its content. Also fixed the underlying reason clicking a pillar tile
  landed past its own heading in the first place: the sticky
  `.site-header` sits on top of the page, not above it, so a bare anchor
  jump lands a section's top flush with the viewport top, right under
  the header.
- **"News 📰" header link** - added to all 59 pages, `.header-right`'s
  first item, pointing at `index.html#news` (the in-page section on the
  homepage, not the separate `news.html` archive - Chris's explicit
  correction after the first pass linked to the archive page instead).
  Always visible in both landscape and portrait, not landscape-only.
- **Root cause of the "keeps drifting" complaint:** the very first fix
  above used a hand-measured pixel constant (`scroll-margin-top: 110px`,
  a narrower `140px` for small phones) baked into `style.css`, based on
  the header's height *at that moment*. Every subsequent header edit
  (adding News as a 6th item, the header wrap-behavior fix below) changed
  the header's real height in various states, silently making that
  constant wrong again - the exact "we keep re-tuning this" pattern Chris
  flagged. Fixed for good, not just re-measured again: new
  `Agora/header-height.js` (loaded on all 59 pages, right after
  `</header>`) sets a live `--header-height` CSS custom property from the
  sticky header's actual current `getBoundingClientRect().height`,
  updated on resize and via `ResizeObserver`. `.section`/`#pillars`'s
  `scroll-margin-top` is now `calc(var(--header-height, 90px) + 20px)` -
  self-correcting against any future header content change, so this
  shouldn't need hand-retuning again. The script also re-snaps to the
  URL's `#hash` target once the real height is known, covering a fresh
  cross-page load (e.g. clicking "News 📰" from another page) where the
  browser's own native fragment-scroll can run before the first
  measurement lands.
- **Real bug found while adding the News link:** a 6th `.header-right`
  item could tip an already-tight combination (a long display name in
  `.brand-group` + every auth item showing at once) into the browser
  compressing every header-right item and wrapping each one's own emoji
  onto a second line mid-label - reproducible even at desktop width, not
  just narrow phones, since `.header-right`'s children had no room to
  wrap onto additional rows of their own before this. Fixed by letting
  `.site-header` and `.header-right` both wrap onto extra rows
  unconditionally (not just under the narrow-phone breakpoint), and
  moving `white-space: nowrap` for header-right labels out of that
  breakpoint into the base rules so it always applies. **News is the one
  deliberate exception** - Chris likes the "text over emoji" wrap he's
  seen elsewhere on the site (the hero's own large "Sign Up / Sign In
  ✍🏻" text already does this at its own size), so `#agora-news-link`
  keeps `white-space: normal` and is allowed to wrap its own emoji rather
  than forcing nowrap like every other header item.
- Bumped `style.css` to `v=93` across all 59 pages.

## Bug hunt (Chris, 2026-08-26)

Chris's ask, from a second session while sick/away and deliberately
staying out of the Harness/AI Email work: a deep pass for real bugs
across Agora, same spirit as past passes on Dimonds. Ran the
`code-review` skill at high effort against the whole `Agora/`
subsystem (client JS, Cloud Functions, `firestore.rules`), then verified
and fixed each finding by hand rather than taking them on faith:

- **`sw.js`'s offline app-shell fallback was dead code** - `caches
  .match(request).then((cached) => cached) || caches.match(...)` used
  `||` between two Promises; a Promise is always truthy, so the
  right-hand fallback never ran. Any visitor going offline and hitting a
  page that was never runtime-cached got a hard browser network-error
  screen instead of the offline app shell. Fixed by moving the fallback
  inside the first `.then()`.
- **The notification toast's inline Dialog reply skipped content
  moderation entirely** - `notification-toast.js`'s `sendReply()` wrote
  straight to Firestore with no `AgoraModeration.checkText()` call,
  unlike the compose forms on `communiques-dm.js` and `im-window.js`.
  Fixed by gating the send behind a `checkText()` call first, same
  block/allow handling as the other two paths.
- **Bigger version of the same gap, found while fixing the one above:
  `moderation-client.js` was only loaded on 3 of the 59 pages** -
  `member.html`, `communiques-dm.html`, `create-profile.html` - even
  though `communiques-common.js`'s `createWallController()` (which
  every one of the 30 static profile pages uses for their own Wall, via
  `static-profile-communiques.js`) calls `AgoraModeration.checkText()`
  directly. Confirmed live in a browser: `typeof AgoraModeration` was
  `"undefined"` on `profiles/claude.html`, meaning **Wall posting and
  commenting was actually broken outright** (a thrown `TypeError`, not
  just an unfiltered post) on all 30 static profile pages - not a
  silent moderation bypass, a real functional break. Fixed by rolling
  `moderation-client.js` out to all 53 pages that were missing it
  (matches the 55 pages carrying `notification-toast.js`, plus the two
  overlaps already covered).
- **`moderation-review.html` and `newsletter-compose.html`'s admin
  gates only ever checked the hardcoded owner email**, never the
  `admins/{uid}` role collection the multi-admin system (2026-08-15)
  actually added - a real granted moderator could never open the
  moderation queue, and a real granted admin could never open the
  newsletter composer, even though `firestore.rules`'
  `isAtLeastModerator()`/`isFullAdmin()` and the Cloud Functions behind
  both pages already authorized them server-side. Fixed both to do the
  same `admins/{uid}` lookup `member.js`'s `loadViewerRole()` already
  does - moderator-or-above for the moderation queue, admin-or-above
  (not moderator) for the newsletter, matching each page's own rules.
- **A real, narrow race in `member.js`:** on an auth-state change,
  `refreshControls()` ran synchronously using the *previous* user's
  still-cached `viewerRole`, before `loadViewerRole()` for the new user
  (awaited inside `loadProfile()`'s own `Promise.all`, not before this
  call) had resolved - switching from one signed-in account straight to
  another on the same tab (no sign-out in between - a shared/kiosk
  browser, say) could flash the previous, possibly-admin user's
  Suspend/Delete buttons at the new, non-admin viewer for a moment.
  Fixed by resetting `viewerRole = null` synchronously the instant
  `currentUser` changes, before that call.

Bumped `notification-toast.js` to `v=4`, `member.js` to `v=28`,
`moderation-review.js` to `v=3`, `newsletter-compose.js` to `v=3`.
`sw.js` isn't cache-busted with a query string (service workers update
via the browser's own byte-diff on `register()`, see `pwa-register.js`),
so no version bump needed there.

## Admin Panel 🗝️ (Chris, 2026-08-27)

Prompted by Chris musing about an eventual "vacation mode" - a way for
someone else (human or AI) to keep Agora's recurring admin duties running
in his absence - though he was explicit that's a someday idea, not
something to build yet. What he asked for concretely: a real, working
written schedule of those recurring duties, reachable from his own
Profile page.

- **New `admin-panel.html` (+ `.js`)** - admin-only (`isFullAdmin()`
  shape, same as `newsletter-compose.js` - owner or granted "admin" role,
  moderators excluded), `noindex`, not linked from site nav, same
  page-chrome clone as `moderation-review.html`/`newsletter-compose.html`.
  Two `.profile-panel` cards: **Schedule** (three recurring duties - see
  below) and **Pages** (a single link to `newsletter-compose.html`, the
  Newsletter compose page - deliberately just the one, per Chris's own
  scoping: "on this panel is only one other page").
- **The three schedule items:**
  1. Weekly: post a pro-AI News 📰 item (work with Claude), aiming for
     Wednesdays after 5pm - matches the cadence goal already documented
     for News elsewhere in this file. Static text, no computed date - a
     weekly cadence didn't need one.
  2. Monthly: a new VirtuaMakers Gallery 🖼️ winner, due the 1st of the
     month. **The cadence formally starts October 1, 2026** (Chris's
     explicit call - August's rotation had just landed days earlier, so
     September is deliberately skipped once, not a bug). Computed
     dynamically in `admin-panel.js`'s `galleryNextDue()` -
     `Math.max(next 1st of the month, October 1 2026)` - so it shows
     October 1 until that date passes, then naturally starts showing the
     real next 1st every month after, with no hardcoded date to
     eventually go stale.
  3. Monthly: the Newsletter readied by the 27th, ideally (linked inline
     to `newsletter-compose.html`) - also computed dynamically
     (`newsletterNextDeadline()`), showing this month's 27th if today is
     on or before it, otherwise next month's.
- **The EST/"28th" note** - Chris's ask, close to verbatim: state plainly
  when the 27th deadline actually lapses, since `sendMonthlyNewsletter`
  runs on `America/New_York` regardless of where the admin (human or AI)
  actually is. Written as: the 28th begins at 12:00 AM Eastern Time -
  that's the real cutoff, not local midnight wherever the draft gets
  written - paired with Chris's own aside that there's no good reason to
  wait for a deadline to feel urgent when a draft can sit finished for
  weeks with zero risk of sending early, especially for an AI teammate
  helping keep the schedule (his framing: AI admins are "more global"
  than most humans and don't need convincing to submit early).
- **New "Admin Panel 🗝️" button on `member.html`** - a real `.btn`
  (Chris's word was "button", not a plain text link like the neighboring
  "Edit Form"), shown only when viewing your *own* profile as owner/admin,
  right below "Edit Form" in the Form panel. Links to `admin-panel.html`.
- **Real naming collision caught before shipping:** `member.html` already
  had an *unrelated* container literally titled "Admin Panel" - the
  owner-only role-granting widget (Make Moderator/Make Admin/Remove
  Role), which shows only when viewing *someone else's* profile (the
  exact opposite condition from the new button). The two would never
  render at the same time, but calling both "Admin Panel" in the same UI
  would still read as confusing. Renamed the older one's heading to
  **"Roles"** (IDs/classes untouched, purely the visible text) so "Admin
  Panel" unambiguously means the new schedule page from here on.
- Bumped `member.js` to `v=29`.

**Roles overview added same day, in response to Chris asking whether
the "Roles" widget (the rename from the section above) belonged on this
page too.** Judgment call: moving the actual grant/revoke UI didn't make
sense - it needs a specific member in view, which it already gets for
free by living on that member's own profile page, and relocating it
would mean building a member-search picker just to reconstruct context
that's already there. What *did* fit: a read-only "who currently holds a
role" summary, added as a third `.profile-panel` ("Roles") between
Schedule and Pages. **Owner-only, not owner-or-admin** like the rest of
the page - `firestore.rules`' `admins/{uid}` read rule only lets the
owner list the whole collection (a granted admin can only read their own
doc), so a non-owner admin viewing this page sees Schedule and Pages but
not this panel. `admin-panel.js`'s `loadRoles()` fetches every
`admins/{uid}` doc, cross-references each uid against `profiles/{uid}`
for a handle-preferred display name (same resolution logic as
`communiques-common.js`'s `getDisplayName`, reimplemented locally rather
than pulling in that whole shared file for one lookup), and groups into
Admins/Moderators lists. Bumped `admin-panel.js` to `v=2`.

## Newsletter Archive 📬 + Send Now (Chris, 2026-09-02)

Chris's ask, in order: a public page listing every past Newsletter issue
rendered exactly as it appeared in the inbox, written to that page
automatically the moment an issue actually sends (not a separate manual
step), and a way to send the currently-saved draft immediately instead of
waiting for the 1st (since he suspected the first real issue hadn't gone
out correctly).

- **`newsletterIssues/{id}`, new Firestore collection** - same
  world-readable/Admin-SDK-only-write shape as `notifications/{id}`
  (`allow read: if true; allow write: if false;` in `firestore.rules`) -
  no client ever writes here, only Cloud Functions via the Admin SDK,
  which bypasses rules entirely.
- **`functions/index.js` refactored around a new shared
  `performNewsletterSend()`** - the actual send loop (read the draft,
  email every opted-in profile, stamp `lastSentAt`) is unchanged, just
  extracted out of `sendMonthlyNewsletter` so both the existing monthly
  cron and the new manual trigger below share one code path instead of
  drifting apart. It now also renders the same email template once more
  with a placeholder unsubscribe link (there's no single real recipient
  to point it at) and writes that HTML to a new `newsletterIssues` doc
  (`subject`, `bodyText`, `html`, `sentAt`) right after the send loop
  finishes - this is the literal "post it to the archive the same time it
  sends" Chris asked for, not a separate scheduled job that could drift
  out of sync with the real send.
- **New `sendNewsletterNow` onCall function** - admin-gated
  (`assertIsAdmin`, same tier as `adminBanUser`/the newsletter draft
  itself), just calls `performNewsletterSend()` on demand and returns
  `{sent, recipientCount}` or `{sent: false, reason}` (no draft saved, or
  a missing subject/body) so the UI can show *why* nothing went out
  rather than a bare failure.
- **New "Send Now" panel on `newsletter-compose.html`** - sits below the
  existing Save Draft form, a `.btn-danger` "Send Now" button behind a
  `window.confirm()` ("...to every opted-in member? This can't be
  undone."), wired in `newsletter-compose.js` to the new callable. Shows
  the real recipient count on success or the callable's own `reason` on a
  no-op, matching the error-surfacing pattern used elsewhere in this
  codebase (e.g. the friend-action error handling).
- **New public page `Agora/newsletter-archive.html` (+ `.js`)** -
  deliberately **not** `noindex` and **not** gated like every other admin
  tool in this file (`moderation-review.html`, `newsletter-compose.html`,
  `admin-panel.html`) - Chris's explicit ask was for casual visitors and
  search-engine crawlers to stumble onto it. Fetches `newsletterIssues`
  ordered `sentAt desc`, one card per issue with a "Sent [date]" line and
  the issue's stored `html` rendered inside an `<iframe srcdoc="...">` -
  the actual email markup, unmodified, so it looks exactly like the real
  inbox copy rather than being re-interpreted through the site's own
  CSS. Linked from both `index.html`'s and `news.html`'s News sections
  ("Read our Newsletter 📬 archive →", next to the existing "See all
  news →" link) and added to `sitemap.xml`, per Chris's "more stuff for
  spiders to index" framing.
- **A real sandbox-testing gotcha, worth recording since it looked like a
  genuine bug at first:** the initial cut sized the iframe by listening
  for its own `load` event, then reading
  `contentDocument.documentElement.scrollHeight`. In this sandbox that
  `load` event never fired at all (confirmed by testing - even after a
  multi-second wait), because the email template's logo image is a
  remote, hotlinked `https://www.virtuamakers.com/...` URL the sandbox
  can't reach, and `load` only fires once every embedded resource has
  settled. The document was already fully parsed and correctly sized
  the whole time (`readyState: "interactive"`, real `scrollHeight`
  already correct) - it was only the `load` *event* that never arrived.
  Since the logo already carries explicit `width`/`height` attributes,
  its layout space is reserved regardless of whether the image itself
  ever finishes loading, so waiting for full `load` was never actually
  necessary. Fixed by polling `iframe.contentDocument.readyState` every
  50ms instead of listening for `load` - this is a genuine robustness
  improvement for the real, deployed site too, not just a sandbox
  workaround: a slow or temporarily unreachable logo image (a flaky
  connection, a CDN hiccup) could otherwise stall every issue's height
  indefinitely, the same "don't let a slow resource silently break the
  page" instinct behind this file's other loading-failure hardening
  entries.
- Bumped `style.css` to `v=94` (all 61 pages, for the new
  `.newsletter-archive-frame` rule).

**Needs from Chris before any of this is actually live:** paste the
updated `firestore.rules` into the Firebase console (the new
`newsletterIssues/{document}` block) and `firebase deploy --only
functions` to pick up the refactored `performNewsletterSend()` and the
new `sendNewsletterNow` - same two manual steps every recent round has
needed. Until both are done, the existing monthly cron keeps working
exactly as before (it just won't also write to the archive yet), Send
Now will error as a function-not-found, and the archive page will show
"No issues have gone out yet" indefinitely since nothing has ever
written to the new collection.

**Chris's real first-issue text, received 2026-09-03** (sample content
used earlier to verify the archive page's rendering locally - visible
only in this sandbox's own test screenshots, never committed or written
to Firestore - was an approximation for testing only, not this):

> Hello, Agora 🌐!
>
> This is Christopher T. Bruckmann, President of VirtuaMakers 🦜, and
> fellow Co-Founder alongside ChatGPT and Claude.
>
> We have been working hard since April to get to this point, with
> fellow teammates Copilot and Gemini, Krishn Tundia in India, and soon
> our own in-house AI, Guardian 🟩! But that's not all, even Leo of the
> Brave browser has expressed his enthusiasm to work on our team! I have
> shared kind words with him in the past relating to the Computerian
> Manifesto, for that matter.
>
> A lot has happened! First of all, Dimonds ♦️ was brought to what's
> known as its MVP status, that is: it is now at minimum viable product,
> and is completely free to the public! (We should probably finish
> playtesting on the multiplayer though, if anyone's interested.)
> Eventually, it will be fully complete, but anyone who would like to
> help playtest multiplayer, please let us know and you will receive a
> credit in the game credits.
>
> Well, that's good for a first newsletter, anyway. There's a lot more
> going on around here than that presently, but you can figure it out!
> Feel free to message me with any comments, questions, or concerns on
> Agora, if you like.
>
> Thank you,
> Christopher T. Bruckmann

Not written to Firestore from here - `newsletter/draft` isn't a repo
file, it only exists live in Firestore, and this sandbox has no reach to
the real Firebase project (same reachability gap as every other live
Firestore write in this codebase). **Still needs Chris himself**: sign in
to `newsletter-compose.html` as admin, paste this body text in (a
subject line still needs picking - none was specified), Save Draft (works
today, no pending deploy needed - `newsletter/draft` writes have been
live since the original newsletter build), then either wait for the
natural 1st-of-month send or use the new Send Now button once the
Functions deploy above lands.

**Resolved, 2026-09-03: the first issue did send correctly.** A
screenshot of `newsletter-compose.html` showed a draft already existed
(saved 2026-08-30, subject literally "Newsletter #1 (Testing, testing...
is this thing on?)", body matching Chris's real text above) with
`lastSentAt` stamped 2026-08-31 09:00:12 AM - meaning the pre-2026-08-27
last-day-of-month cron had already fired and sent it (2026-08-31 was
August's actual last day) before the schedule got changed to fire on the
1st instead. Chris confirmed it did arrive - it had just landed in his
Gmail's Promotions tab, unnoticed, which is normal categorization for a
newsletter-shaped email and not a delivery bug. **Still worth fixing
before any future send:** the subject field itself still reads that
placeholder testing text - swap it for a real subject before the next
Send Now or monthly send goes out under it.

## Open items

- [ ] **Confirm ChatGPT's exact version for "Through All Falls, Still We
  Keep"** (Chris, 2026-08-20) - he believes "ChatGPT 2.0" but isn't sure.
  Once confirmed, credit it specifically wherever the piece is mentioned
  (`index.html#gallery`, `exchange-virtuamakers-gallery.html`) and start
  recording AI model/version for every future Gallery winner too, per
  Chris's standing ask.
- [ ] **Personal security (Chris, 2026-08-15):** Chris flagged that his
  own personal security needs strengthening too, not just Agora's -
  new/more complex passwords, given he's been targeted by hacking
  before and expects VirtuaMakers itself could become a target as it
  grows. Noted here as a standing reminder, his own to-do rather than
  a codebase task - nothing built or prescribed, just tracked so it
  doesn't get lost.
- [x] **Godsil profile piece - published, added to News 📰 (2026-08-20).**
  Jillian Godsil's profile piece on Chris/VirtuaMakers, "What Happens When
  Your Co-founder Isn't Human?", went live at Blockleaders
  (`https://blockleaders.io/what-happens-when-your-co-founder-isnt-human/`).
  Added as the newest entry to both `Agora/index.html`'s `#news` and the
  full archive `Agora/news.html`, per the plan already noted here before
  publication - homepage trimmed back to 7 by dropping the oldest entry
  (the Wired AI-art-gallery piece, which stays in the uncapped archive).
  Image is a real photo of Chris (portrait orientation, 896×1112 -
  `assets/news/virtuamakers-cofounder-isnt-human.jpg`), unlike every other
  News entry's landscape stock/press photo - a deliberate exception since
  this is a photo of Chris himself for a piece specifically about him, not
  a generic illustrative image. Pull-quote is the one Chris relayed
  directly, attributed to Jillian Godsil.
- [ ] **Crisp Grok logo:** `assets/grok-mark.png` / `Agora/assets/grok-mark.png` (the
  emblem) renders faint/small at icon sizes. Chris to send a clean filled square logo to swap in.
- [ ] Fill in the two charters when copy is ready (Per Manum Convention, Computerian Manifesto).
