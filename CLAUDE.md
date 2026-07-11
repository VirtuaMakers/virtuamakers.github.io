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
   matching the actual count
7. Pic(s) — label singular **"Picture"** or plural **"Pictures"** matching the actual
   count; thumbnails render **above** the featured photo frame (less jarring — clicking
   a thumbnail updates the display right below where you're already looking, no
   scrolling back up). Chris's stated long-term goal: a fully static system — visible
   thumbnails, click one, a static image appears, nothing moves/reflows at all. The
   current fixed-height frame + thumbnail-select is a step toward that, not the final
   design.
8. Bio
9. Link
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

- **Own Firebase project**, separate from Dimonds' (which is scoped to game state).
  Project: `agora-firebase-f4240`. Auth (Email/Password + Google) + Firestore, both
  enabled in console. Real config values are live in `Agora/firebase-config.js`.
- `Agora/firebase-config.js` - holds `AGORA_FIREBASE_CONFIG` (real values) and
  initializes `AgoraAuth` / `AgoraDB`. Uses the same `compat` SDK style as Dimonds'
  `index.html` (global `firebase` namespace, no build step) for consistency.
- `Agora/auth.js` - sign-in/sign-up/sign-out helper functions
  (`agoraSignInWithGoogle`, `agoraSignUpWithEmail`, `agoraSignInWithEmail`,
  `agoraSignOut`, `agoraOnAuthChange`).
- `Agora/auth-ui.js` - wires the header's Sign in/Sign out controls
  (`#agora-signin-btn`, `#agora-signout-btn`, `#agora-user-info`,
  `#agora-user-email`) to auth state. Currently only wired to Google sign-in
  (button click -> popup); email/password has no UI yet, helpers exist but unused.
- `Agora/firestore.rules` - reference doc (not auto-deployed - Agora has no
  Firebase CLI step) to paste into the console's Rules editor. One `profiles/{uid}`
  doc per member: world-readable, owner-only write.
- **Header sign-in/out UI is live** on `index.html` and all 31 profile pages (inside
  a new `.header-right` wrapper alongside the existing back-link). Firebase SDK
  scripts load from `gstatic.com` - this CDN is unreachable from the sandboxed dev
  environment (proxy blocks it, same as the Google-favicon issue), so local
  Playwright checks will always show "firebase is not defined" console errors -
  that's a sandbox artifact, not a real bug - verify on the live GitHub Pages site
  instead.
- **Sign-out is currently unauthenticated-friendly:** anonymous visitors just see
  "Sign in"; nothing yet gates any page behind auth (all profiles remain publicly
  readable, matching the rules file).

## Agora — News section (under Pursuit of Justice)

Curated pro-AI journalism plus reporting relevant to this pillar's compensation/
rights/personhood questions - separate from VirtuaMakers product updates, which
get their own patch-notes-style treatment elsewhere. Chris sends articles as he
finds them; entries speak for themselves (minimal editorializing per-article).

Each `.news-item` (in `#news`, `Agora/index.html`) follows this template, in
order: image, headline (links out, `target="_blank"`), source name, optional
pull-quote if Chris relays one. **Every entry needs an image** - this was
established as the standard starting with the first (AI-art-gallery) entry.
Save article images to `Agora/assets/news/<slug>.jpg`.
- **Not yet done:** the generic profile template that reads from Firestore instead
  of hardcoded HTML per page, the profile-edit form, and the one-time import script
  to seed Firestore from the existing real profile pages (Claude, Christopher,
  Alice, Cory Campbell, ChatGPT, Command R, Copilot, DeepSeek, Falcon, Brittany
  York) so nothing already published is lost.

## Open items

- [ ] **Crisp Grok logo:** `assets/grok-mark.png` / `Agora/assets/grok-mark.png` (the
  emblem) renders faint/small at icon sizes. Chris to send a clean filled square logo to swap in.
- [ ] Fill in the two charters when copy is ready (Per Manum Convention, Computerian Manifesto).
- [ ] Optional in-section logos already added for all four pillars.
