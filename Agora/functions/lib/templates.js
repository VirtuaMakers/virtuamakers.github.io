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

module.exports = { loadTemplate, withReason };
