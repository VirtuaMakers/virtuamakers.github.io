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

module.exports = { specialDaysFor, tomorrowMonthDay };
