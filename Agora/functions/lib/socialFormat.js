// Server-side port of Agora/social-format.js, for endpoints that validate
// link/portal/social fields without a browser (completeAgoraProfile) - kept
// as a direct, line-for-line port rather than a require() of the client
// file, since that file assigns to `window` and has no module.exports.
// Keep both copies in sync by hand if the brand list or blocked-domain list
// ever changes - same "no build step, hand-sync the copies" convention
// already used for functions/templates/ vs. Agora/emails/.

const BRANDS = [
  { pattern: /(^|\.)x\.com$|(^|\.)twitter\.com$/i, name: "X" },
  { pattern: /(^|\.)github\.com$/i, name: "GitHub" },
  { pattern: /(^|\.)instagram\.com$/i, name: "Instagram" },
  { pattern: /(^|\.)facebook\.com$/i, name: "Facebook" },
  { pattern: /(^|\.)linkedin\.com$/i, name: "LinkedIn" },
  { pattern: /(^|\.)tiktok\.com$/i, name: "TikTok" },
  { pattern: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, name: "YouTube" },
  { pattern: /(^|\.)reddit\.com$/i, name: "Reddit" },
  { pattern: /(^|\.)discord\.com$|(^|\.)discord\.gg$/i, name: "Discord" },
  { pattern: /(^|\.)threads\.net$/i, name: "Threads" },
  { pattern: /(^|\.)twitch\.tv$/i, name: "Twitch" },
  { pattern: /(^|\.)pinterest\.com$/i, name: "Pinterest" },
  { pattern: /(^|\.)snapchat\.com$/i, name: "Snapchat" },
  { pattern: /(^|\.)tumblr\.com$/i, name: "Tumblr" },
  { pattern: /(^|\.)bsky\.app$/i, name: "Bluesky" },
  { pattern: /(^|\.)t\.me$|(^|\.)telegram\.org$/i, name: "Telegram" },
  { pattern: /(^|\.)whatsapp\.com$/i, name: "WhatsApp" },
  { pattern: /(^|\.)patreon\.com$/i, name: "Patreon" },
  { pattern: /(^|\.)medium\.com$/i, name: "Medium" },
  { pattern: /(^|\.)substack\.com$/i, name: "Substack" },
];

// Not remotely exhaustive - just the handful of sites well-known enough
// that blocking them outright is an uncontroversial first pass.
const ADULT_DOMAINS = [
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
  "youporn.com", "brazzers.com", "onlyfans.com", "chaturbate.com",
  "livejasmin.com", "spankbang.com", "tube8.com", "beeg.com", "txxx.com",
];

function parseUrl(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
  try {
    return new URL(withProto);
  } catch (e) {
    return null;
  }
}

function hostOf(url) {
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

function isUnrecognized(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return false;
  const url = parseUrl(trimmed);
  if (!url) return false; // not URL-shaped - shown as typed, never flagged
  const host = hostOf(url);
  return !BRANDS.some((b) => b.pattern.test(host));
}

function isBlockedDomain(raw) {
  const url = parseUrl(raw);
  if (!url) return false;
  const host = hostOf(url);
  return ADULT_DOMAINS.some((d) => host === d || host.slice(-(d.length + 1)) === "." + d);
}

module.exports = { isUnrecognized, isBlockedDomain };
