// Shared by profile-form.js (validate/flag on save) and member.js (display).
// Recognizes common social platforms from a pasted URL and reduces the
// display to just the platform name (e.g. "https://x.com/someone" -> "X").
// An unrecognized domain falls back to a simplistic capitalize-first-letter
// version of its hostname and gets flagged as unrecognized, so Chris can
// expand this list later - there's no automatic notification for that yet
// (see CLAUDE.md), just a socialsFlagged marker on the profile doc.
//
// Also flags a short list of well-known adult sites as blocked. This is a
// basic deterrent against the most obvious cases, not a comprehensive
// filter - a determined member could always use a lesser-known site.

(function (global) {
  var BRANDS = [
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
    { pattern: /(^|\.)substack\.com$/i, name: "Substack" }
  ];

  // Not remotely exhaustive - just the handful of sites well-known enough
  // that blocking them outright is an uncontroversial first pass.
  var ADULT_DOMAINS = [
    "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
    "youporn.com", "brazzers.com", "onlyfans.com", "chaturbate.com",
    "livejasmin.com", "spankbang.com", "tube8.com", "beeg.com", "txxx.com"
  ];

  function parseUrl(raw) {
    var trimmed = (raw || "").trim();
    if (!trimmed) return null;
    var withProto = /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
    try {
      return new URL(withProto);
    } catch (e) {
      return null;
    }
  }

  function hostOf(url) {
    return url.hostname.replace(/^www\./i, "").toLowerCase();
  }

  function format(raw) {
    var trimmed = (raw || "").trim();
    if (!trimmed) return null;

    var url = parseUrl(trimmed);
    if (!url) {
      // Not URL-shaped (e.g. "X: yourhandle") - show exactly as typed.
      return { label: trimmed, href: null, unrecognized: false };
    }

    var host = hostOf(url);
    for (var i = 0; i < BRANDS.length; i++) {
      if (BRANDS[i].pattern.test(host)) {
        return { label: BRANDS[i].name, href: url.href, unrecognized: false };
      }
    }

    // Unrecognized: capitalize just the first letter and leave the rest
    // exactly as typed - url.hostname would already be lowercased by the
    // URL parser, so pull the core domain token from the raw input instead.
    var rawCore = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[./]/)[0];
    var label = rawCore.charAt(0).toUpperCase() + rawCore.slice(1);
    return { label: label, href: url.href, unrecognized: true };
  }

  function isBlockedDomain(raw) {
    var url = parseUrl(raw);
    if (!url) return false;
    var host = hostOf(url);
    return ADULT_DOMAINS.some(function (d) {
      return host === d || host.slice(-(d.length + 1)) === "." + d;
    });
  }

  global.AgoraSocialFormat = { format: format, isBlockedDomain: isBlockedDomain };
})(window);
