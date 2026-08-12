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

module.exports = { loadTemplate, withReason, withNewsletterContent };
