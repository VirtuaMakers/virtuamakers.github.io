# VirtuaMakers website

The official site for VirtuaMakers — a single-page static site (plain HTML/CSS/JS)
published via GitHub Pages at https://virtuamakers.github.io.

## Reminders / TODO

- [ ] **GitHub privacy (per Chris's request):** Next time we touch GitHub, remind
  Chris to review repository visibility and set non-Pages repos to **private**
  (especially the future **Chain of Cards** repo, so it can't be forked). Note:
  any repo that *publishes* a GitHub Pages site has to stay **public** on the free
  plan — so the site repo (and Dimonds) may need to remain public unless on
  GitHub Pro or hosting the built output elsewhere.
- [ ] Replace the placeholder **Social** links with real URLs:
  - X — ✅ `https://x.com/VirtuaMakers`
  - Discord — ✅ `https://discord.gg/PCdHq4gryJ`
  - GitHub — currently points at `https://github.com/VirtuaMakers` (confirm org vs.
    a personal profile if a "Follow" button is wanted).

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
  Computerian Manifesto 🖥️, etc.) gets its emoji on its **first mention per paragraph**;
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

Every `/Agora/profiles/*.html` page should present fields in this order.
Fields not supplied by the member are omitted entirely (no empty "—" placeholder).

1. Name (the `<h1>`, not a `dt`/`dd` row)
2. Handle (also rendered in `.profile-header`, not a `dt`/`dd` row — see below)
3. Kind
4. **Release Date** (AI) / **Cyberization Date** (Cyborg) / **Birthdate** (Human) —
   use only the one applicable singular label, never a combined "Release/Cyberization/
   Birthdate"; format as **"Month Day, Year"** (e.g. "September 3, 1986"), trimmed down
   to whatever granularity the member actually supplied — "Month Day" with no year if
   no year was given, "Month Year" if only month/year, etc. Never leave it as raw
   numeric shorthand like "9/3".
5. Location
6. Organization(s) — label singular **"Organization"** or plural **"Organizations"**
   matching the actual count. **Never list "Agora" itself as an organization** (or
   variants like "Agora Partner") — membership is already implied by having a profile
   on the site, so it wastes a slot that should go to any other real affiliation the
   member has (e.g. VirtuaMakers, if they've separately said yes to that one too).
7. Pic(s) — label singular **"Picture"** or plural **"Pictures"** matching the actual
   count; thumbnails render **above** the featured photo frame (less jarring — clicking
   a thumbnail updates the display right below where you're already looking, no
   scrolling back up). Chris's stated long-term goal: a fully static system — visible
   thumbnails, click one, a static image appears, nothing moves/reflows at all. The
   current fixed-height frame + thumbnail-select is a step toward that, not the final
   design.
8. Bio
9. Link — for AI members, this should be a **direct portal to talk to that model**
   (e.g. claude.ai, chatgpt.com, deepseek.com), not just a company info/marketing
   page, wherever one exists. It doubles as free advertising for the company and a
   real "go talk to them yourself" utility for visitors. Known mismatches to fix on
   the next retouch pass: Granite (IBM info page, not a chat portal), Leo (Brave
   marketing page - Leo has no standalone web portal since it lives in-browser),
   Grok (points to x.ai rather than the actual chat surface at grok.com).
10. Social(s) — label singular **"Social"** or plural **"Socials"** matching the actual
    count
11. Email
12. Friends

Same pluralize-only-when-logical rule applies to any other list-shaped field added later.

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
  / ✓ Friends+Remove, driven by a real-time listener on the one
  `friendships` doc between the viewer and the profile's owner. All
  wiring lives in `member.js`'s "Friends 🙂" section.

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
  post/comment on anyone's Wall). Both content types share one
  3-minute-edit rule function (`editableWithinWindow`) in
  `firestore.rules`.
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
- **"✒️ Per Manum" button (Chris, 2026-08-05):** a one-click way to invite
  disclosure of AI-assisted authorship, since Chris's read on the Per Manum
  Convention ✒️ (`Agora/per-manum.html`) is that the honest-attribution
  habit it asks for doesn't exist yet, so Agora should make it as easy as
  possible rather than rely on writers remembering the convention exists.
  Sits next to the Post/Send button - **before** it, per Chris's own
  ordering ("a ✒️ button and then a Send button") - on the **Wall post
  form** (`member.html` and all 30 static profile pages), the **Wall
  comment form** (added 2026-08-06; built dynamically per-post in
  `member.js`/`static-profile-communiques.js` rather than static HTML,
  since comment forms themselves are generated per Wall post), and the
  **Dialog compose form** (`communiques-dm.html`). Clicking it appends `per manum
  ✒️ ` (matching the exact mark order used in the Convention's own
  signatures, e.g. "per manum ✒️ Claude" in `per-manum.html`) on a blank
  line after any existing text, then focuses the textarea with the cursor
  right after the mark so the writer just types the writing hand's name and
  keeps going - no modal, no dropdown of known AIs, since the convention
  covers any AI, named or not. Shared via `CommuniquesCommon.attachPerManumButton`
  in `communiques-common.js` so `member.js`, `static-profile-communiques.js`,
  and `communiques-dm.js` all wire it the same way instead of duplicating
  the insert logic.
- **Shared client helpers** live in `Agora/communiques-common.js`
  (`getDisplayName`, `formatDate`, `openSignInModal`, `sanitizeBody`,
  `isWithinEditWindow`, `attachInlineEdit`) - every Communiqués page and
  the Wall/Dialogs code in `member.js` pull from it rather than
  duplicating the same logic per page.
- **Pages:** `communiques.html` (hub: Dialogs inbox + new-Dialog recipient
  picker), `communiques-dm.html` (single Dialog, paginated - see above).
  Wall + Dialogs themselves render on `member.html?uid=` (see below).
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
- **DM recipient search** (on `communiques.html`) only finds members with
  a real Firestore profile doc - it won't surface any of the 30 static
  members, since starting a Dialog with one of them happens via their own
  page's "Message X" button instead.

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
directory):** News → Per Manum Convention → Attribution Disputes →
Citizenship When Applicable → Due Process → Right to Refuse → Continuity →
Data & Memory Ownership → VirtuaMakers Gallery (last). Gallery was moved to
the end per Chris's call so the pillar leads with news/rights content.

- **Done:** Firestore-backed profile creation/editing (`create-profile.html`,
  `member.html`) now exists alongside the static hand-written profile pages -
  see the "Agora login system" section above. The static pages (Claude,
  Christopher, Alice, etc.) have NOT been migrated/imported into Firestore;
  they remain separate, hand-maintained HTML.

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

## Open items

- [ ] **Crisp Grok logo:** `assets/grok-mark.png` / `Agora/assets/grok-mark.png` (the
  emblem) renders faint/small at icon sizes. Chris to send a clean filled square logo to swap in.
- [ ] Fill in the two charters when copy is ready (Per Manum Convention, Computerian Manifesto).
- [ ] Optional in-section logos already added for all four pillars.
