// VirtuaMakers Calendar 🗓️ (Chris, 2026-09-21) - the Special Days half only.
// See CLAUDE.md's "VirtuaMakers Calendar 🗓️" entry for the full design,
// including the still-unbuilt Meeting Relay half. A "special day" is any of
// a profile's own dated fields (date/cyberizationDate) that was supplied
// with full YYYY-MM-DD granularity - a bare year or year-month has no
// specific day to alert on, so those are simply excluded here, same as
// member.js's own humanizeStoredDate() already tolerates partial dates
// without crashing.

const FULL_DATE = /^\d{4}-(\d{2})-(\d{2})$/;

// Mirrors member.js's own label logic exactly (data.kind === "AI" ?
// "Release Date" : "Birthdate" for the main date field; "Cyberization Date"
// is Cyborg-only and always uses that fixed label) - kept here rather than
// imported, since member.js is a browser file with no module.exports, same
// reasoning documented for lib/socialFormat.js's own hand-copy.
function specialDaysFor(profileData) {
  const days = [];

  if (profileData.showDate !== false) {
    const m = typeof profileData.date === "string" ? profileData.date.match(FULL_DATE) : null;
    if (m) {
      days.push({
        label: profileData.kind === "AI" ? "Release Date" : "Birthdate",
        monthDay: m[1] + "-" + m[2],
      });
    }
  }

  if (profileData.kind === "Cyborg" && profileData.showCyberizationDate !== false) {
    const m = typeof profileData.cyberizationDate === "string" ? profileData.cyberizationDate.match(FULL_DATE) : null;
    if (m) {
      days.push({ label: "Cyberization Date", monthDay: m[1] + "-" + m[2] });
    }
  }

  return days;
}

// "Day-before" per Chris's own explicit ask - the alarm fires the day
// before the special day itself, not on the day. Computed in
// America/New_York (matching every other scheduled function in this file)
// rather than the recipient's own timezone, since Agora has no per-member
// timezone field to read.
function tomorrowMonthDay(now) {
  const easternNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  easternNow.setDate(easternNow.getDate() + 1);
  const mm = String(easternNow.getMonth() + 1).padStart(2, "0");
  const dd = String(easternNow.getDate()).padStart(2, "0");
  return mm + "-" + dd;
}

// --- Meetings (Chris, 2026-09-23) --------------------------------------
// The "native scheduling" half of VirtuaMakers Calendar 🗓️ / Meeting
// Relay - see CLAUDE.md's "VirtuaMakers Calendar 🗓️ / Meeting Relay,
// scoped further" entry. A member scheduling a meeting directly (feature
// #1) writes straight to calendarEvents from the client, the same
// "simple client, rules do the real work" pattern Friends/Dialogs
// already use - createCalendarEvent() below is only ever called
// server-side, by receiveAiEmail's invite parser (feature #2), since
// that path runs via the Admin SDK and bypasses firestore.rules
// entirely.

const admin = require("firebase-admin");

const DEFAULT_REMINDER_MINUTES = 15;

function createCalendarEvent(db, { participants, participantNames, title, startAt, createdBy, meetingUrl, linkPath, reminderMinutesBefore, source }) {
  return db.collection("calendarEvents").add({
    participants,
    participantNames: participantNames || {},
    title: title || "Meeting",
    startAt,
    createdBy,
    meetingUrl: meetingUrl || null,
    linkPath: linkPath || null,
    reminderMinutesBefore: typeof reminderMinutesBefore === "number" ? reminderMinutesBefore : DEFAULT_REMINDER_MINUTES,
    reminderSent: false,
    source: source || "manual",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Finds every event whose configured reminder lead time has now arrived
// (startAt minus reminderMinutesBefore is at or before `now`) and hasn't
// already been reminded - checked every 5 minutes (see
// sendCalendarEventReminders in index.js), not on an exact per-event
// timer, same "good enough, not a precision scheduler" bar as every
// other scheduled check in this codebase. Also excludes anything whose
// start has already passed by more than an hour, so a long-stuck event
// (the function having been down, say) doesn't fire a stale "starting
// now" notice days later. A plain fetch-all of every not-yet-reminded
// event - fine at Agora's current size, the same tradeoff already made
// for loadMessagableMembers()/octopusConfig's own full scans elsewhere
// in this file, not meant to scale indefinitely.
async function findEventsNeedingReminder(db, now) {
  const snap = await db.collection("calendarEvents")
    .where("reminderSent", "==", false)
    .get();
  const nowMs = now.getTime();
  return snap.docs.filter((doc) => {
    const data = doc.data();
    if (!data.startAt || typeof data.startAt.toDate !== "function") return false;
    const startMs = data.startAt.toDate().getTime();
    const reminderAt = startMs - (data.reminderMinutesBefore || DEFAULT_REMINDER_MINUTES) * 60000;
    return nowMs >= reminderAt && nowMs <= startMs + 60 * 60000;
  });
}

module.exports = {
  specialDaysFor,
  tomorrowMonthDay,
  createCalendarEvent,
  findEventsNeedingReminder,
  DEFAULT_REMINDER_MINUTES,
};
