// Parses a meeting invite out of an incoming AI Email ✉️ message - the
// "no OAuth needed" half of VirtuaMakers Calendar 🗓️ / Meeting Relay (see
// CLAUDE.md's "VirtuaMakers Calendar 🗓️ / Meeting Relay, scoped further"
// entry). Deliberately hand-rolled, not a full ICS library - same "one
// fewer thing to npm install" call already made for Svix signature
// verification in lib/aiEmail.js.
//
// Real, honestly-flagged limitation: this only reads whatever
// fetchReceivedEmail() (lib/aiEmail.js) already returns - `text`/`html`/
// `attachments`, if Resend's Receiving API populates that last field. A
// real calendar invite commonly arrives as a *separate* .ics attachment,
// not inline text - whether Resend's API actually surfaces attachment
// content this way hasn't been verified against a real invite in this
// sandbox (no network reach to send/receive a live test through Gmail/
// Google Calendar). This parser still correctly handles the case where
// the ICS content shows up inline in the plain-text/HTML body, which
// some simpler invite senders do - but a real Google Calendar invite
// through Gmail is the case most worth testing live once this is
// deployed, per the same "verified live, not just reasoned about"
// standard this codebase holds every other Harness/AI Email endpoint to.

const MEETING_URL_PATTERNS = [
  /https?:\/\/meet\.google\.com\/[a-z0-9-]+/i,
  /https?:\/\/[\w.-]*zoom\.us\/j\/\d+[^\s"'<>]*/i,
  /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s"'<>]+/i,
];

function findMeetingUrl(text) {
  for (const pattern of MEETING_URL_PATTERNS) {
    const m = String(text || "").match(pattern);
    if (m) return m[0];
  }
  return null;
}

// Matches "NAME:value" or "NAME;PARAM=x:value" at the start of a line -
// ICS lines can fold onto a continuation line starting with a space,
// which this deliberately doesn't unfold (good enough for the fields
// this cares about, which are rarely long enough to fold in practice).
function icsField(icsText, name) {
  const re = new RegExp("^" + name + "(;[^:\\r\\n]*)?:(.*)$", "im");
  const m = icsText.match(re);
  return m ? m[2].trim() : null;
}

// Converts an ICS DTSTART value into a real JS Date. Three real shapes
// handled: a trailing "Z" (UTC, parsed directly - always correct), a
// TZID param (converted via the standard two-pass Intl trick below -
// correct for the general case, can be off by an hour right at a DST
// transition, an accepted approximation), and a bare floating local time
// with neither (treated as UTC, the same fallback most calendar tooling
// uses when nothing better is given).
function parseIcsDate(rawValue, tzid) {
  const m = rawValue.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;
  const year = +m[1], month = +m[2], day = +m[3], hour = +m[4], minute = +m[5], second = +m[6];

  if (m[7]) return new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  if (tzid) {
    try {
      const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
      const asIfLocal = new Date(new Date(guessUtcMs).toLocaleString("en-US", { timeZone: tzid }));
      const offsetMs = guessUtcMs - asIfLocal.getTime();
      return new Date(guessUtcMs + offsetMs);
    } catch (err) {
      // Unrecognized TZID string - fall through to the floating-time
      // treatment below rather than failing the whole parse over it.
    }
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

// Extracts { title, startAt, meetingUrl } from a raw ICS VEVENT block, or
// null if it doesn't look like a real timed event (no VEVENT/DTSTART).
function extractIcsEvent(icsText) {
  if (typeof icsText !== "string" || icsText.indexOf("BEGIN:VEVENT") === -1) return null;

  const dtstartLine = icsText.match(/^DTSTART(;[^:\r\n]*)?:(\d{8}T\d{6}Z?)\r?$/im);
  if (!dtstartLine) return null;

  const tzidMatch = (dtstartLine[1] || "").match(/TZID=([^;:\r\n]+)/i);
  const startAt = parseIcsDate(dtstartLine[2], tzidMatch ? tzidMatch[1] : null);
  if (!startAt) return null;

  const summary = icsField(icsText, "SUMMARY") || "Meeting";
  const location = icsField(icsText, "LOCATION") || "";
  const description = icsField(icsText, "DESCRIPTION") || "";
  const url = icsField(icsText, "URL") || "";

  const meetingUrl = findMeetingUrl(url) || findMeetingUrl(location) || findMeetingUrl(description);

  return { title: summary, startAt, meetingUrl: meetingUrl || null };
}

// Best-effort search across an inbound message's attachments (if
// Resend's Receiving API populates them - see the module comment above)
// for a text/calendar or .ics attachment, base64-decoded.
function findIcsAttachment(attachments) {
  if (!Array.isArray(attachments)) return null;
  const ics = attachments.find((a) =>
    (a.content_type && /calendar/i.test(a.content_type))
    || (a.filename && /\.ics$/i.test(a.filename))
  );
  if (!ics || !ics.content) return null;
  try {
    return Buffer.from(ics.content, "base64").toString("utf8");
  } catch (err) {
    return null;
  }
}

// The one entry point: given the object fetchReceivedEmail() returns
// (from/subject/text/html/attachments), tries to produce a real, timed
// Calendar 🗓️ event. Returns null (not an error) when nothing parseable
// was found - a plain email with no invite content is the overwhelmingly
// common case, and that's fine, not a failure. Deliberately does NOT
// fall back to "a bare meeting link with no known start time" - creating
// a Calendar event needs a real startAt, so a Meet/Zoom link with no
// accompanying ICS data is left unparsed rather than guessed at.
function parseInviteFromEmail(email) {
  const fromIcsAttachment = extractIcsEvent(findIcsAttachment(email.attachments) || "");
  if (fromIcsAttachment) return fromIcsAttachment;

  return extractIcsEvent(email.text || "") || extractIcsEvent(email.html || "") || null;
}

module.exports = { parseInviteFromEmail, extractIcsEvent, findMeetingUrl, parseIcsDate };
