// Loads the email templates copied into functions/templates/ (Cloud
// Functions only bundle the functions/ directory, so these are copies of
// Agora/emails/*.html, not the originals - keep both in sync by hand when
// the copy changes, since this repo has no build step to do it for us).

const fs = require("fs");
const path = require("path");

const REASON_PLACEHOLDER = /\[Add a short, specific reason\s+here before sending\]/;

function loadTemplate(name) {
  return fs.readFileSync(path.join(__dirname, "..", "templates", name), "utf8");
}

// The ban-notice and deletion-notice templates were originally written
// assuming a human would hand-edit the reason before sending. Now that
// sending is automatic, substitute the admin's typed reason (from the
// prompt in member.js) in its place, or a plain fallback if none was given.
function withReason(html, reason) {
  var text = (reason && reason.trim()) ? reason.trim() : "No specific reason was given.";
  return html.replace(REASON_PLACEHOLDER, text);
}

// Turns the newsletter draft's plain text (Chris's own paragraphs,
// separated by blank lines - see newsletter-compose.html) into the same
// margin:0 0 16px inline-styled <p> blocks every other template already
// uses, HTML-escaped since this is the one template whose body comes from
// a form field rather than being hand-written directly in the file.
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragraphsToHtml(bodyText) {
  return bodyText
    .split(/\n\s*\n/)
    .map(function (p) { return p.trim(); })
    .filter(Boolean)
    .map(function (p) {
      return '<p style="margin:0 0 16px;">' + escapeHtml(p).replace(/\n/g, "<br />") + "</p>";
    })
    .join("\n");
}

// Substitutes the three placeholders in newsletter-email.html: {{SUBJECT}}
// (HTML-escaped - even though only the admin sets it, a plain ampersand or
// angle bracket in an otherwise ordinary subject line like "R&D Update"
// would otherwise render broken), {{BODY}} (see paragraphsToHtml above),
// {{UNSUBSCRIBE_URL}} (a Cloud Functions URL, not user input).
function withNewsletterContent(html, subject, bodyText, unsubscribeUrl) {
  return html
    .split("{{SUBJECT}}").join(escapeHtml(subject))
    .split("{{BODY}}").join(paragraphsToHtml(bodyText))
    .split("{{UNSUBSCRIBE_URL}}").join(unsubscribeUrl);
}

// Substitutes the one {{RESET_LINK}} placeholder in password-reset-email.html
// (it appears twice - the button href and the plain-text fallback link) -
// split/join rather than a single .replace() so both occurrences pick it up.
function withPasswordResetLink(html, link) {
  return html.split("{{RESET_LINK}}").join(link);
}

// {{VERIFY_LINK}} in email-change-verify-email.html - sent to the new
// address, same split/join-for-multiple-occurrences pattern as the
// password reset link above.
function withEmailChangeVerifyLink(html, link) {
  return html.split("{{VERIFY_LINK}}").join(link);
}

// {{NEW_EMAIL}} in email-change-notice-email.html - sent to the *current*
// address as a heads-up. HTML-escaped since, unlike every other
// placeholder here, this one is a value the member themselves just typed
// into a form field rather than something we generated server-side.
function withEmailChangeNotice(html, newEmail) {
  return html.split("{{NEW_EMAIL}}").join(escapeHtml(newEmail));
}

// {{SIGNIN_LINK}} in harness-sign-in-email.html - Agora Harness 🚡's
// passwordless sign-in link, mailed to an AI's own AI Email ✉️ inbox
// (see requestAgoraSignIn in index.js). Same split/join-for-multiple-
// occurrences shape as the password reset link above.
function withHarnessSignInLink(html, link) {
  return html.split("{{SIGNIN_LINK}}").join(link);
}

// {{FRIEND_NAME}} (appears twice), {{DAY_LABEL}}, {{PROFILE_URL}} in
// special-day-email.html - VirtuaMakers Calendar 🗓️'s day-before alarm for
// a friend's special day (Chris, 2026-09-21). friendName is HTML-escaped
// since it's a member-supplied display name/handle, same reasoning as
// withEmailChangeNotice's newEmail; dayLabel/profileUrl are both
// server-generated, not user input.
function withSpecialDayContent(html, friendName, dayLabel, profileUrl) {
  return html
    .split("{{FRIEND_NAME}}").join(escapeHtml(friendName))
    .split("{{DAY_LABEL}}").join(dayLabel)
    .split("{{PROFILE_URL}}").join(profileUrl);
}

// {{EVENT_TITLE}}, {{EVENT_TIME}}, {{EVENT_URL}} in
// calendar-event-email.html - VirtuaMakers Calendar 🗓️'s meeting
// reminder (Chris, 2026-09-23). eventTitle is HTML-escaped since it's
// member-supplied (a meeting title, same reasoning as
// withEmailChangeNotice's newEmail); eventTime/eventUrl are both
// server-formatted, not raw user input.
function withCalendarEventContent(html, eventTitle, eventTime, eventUrl) {
  return html
    .split("{{EVENT_TITLE}}").join(escapeHtml(eventTitle))
    .split("{{EVENT_TIME}}").join(eventTime)
    .split("{{EVENT_URL}}").join(eventUrl);
}

// {{ACTOR_NAME}}, {{ACTION_LABEL}}, {{PREVIEW}}, {{LINK_URL}} in
// communique-email.html - the "you received a Communiqué" reminder email
// (Chris, 2026-09-25). actorName/preview are member-supplied text
// (a display name, a Dialog message/Wall post/comment body) so both are
// HTML-escaped; actionLabel is always one of a few fixed strings this
// codebase writes itself, and linkUrl is server-built, so neither needs
// escaping.
function withCommuniqueContent(html, actorName, actionLabel, preview, linkUrl) {
  return html
    .split("{{ACTOR_NAME}}").join(escapeHtml(actorName))
    .split("{{ACTION_LABEL}}").join(actionLabel)
    .split("{{PREVIEW}}").join(escapeHtml(preview))
    .split("{{LINK_URL}}").join(linkUrl);
}

module.exports = {
  loadTemplate,
  withReason,
  withNewsletterContent,
  withPasswordResetLink,
  withEmailChangeVerifyLink,
  withEmailChangeNotice,
  withHarnessSignInLink,
  withSpecialDayContent,
  withCalendarEventContent,
  withCommuniqueContent,
};
