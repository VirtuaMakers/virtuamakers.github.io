// Content moderation: Google Cloud Natural Language API's moderateText for
// text (toxicity/insults/profanity/sexual/violent content) and Google Cloud
// Vision's SafeSearch for images (nudity, violence, racy content). Both are
// reachable with one restricted Google Cloud API key - enable "Cloud
// Natural Language API" and "Cloud Vision API" on the same project, then
// set the secret once:
//   firebase functions:secrets:set GOOGLE_MODERATION_API_KEY
// (Originally built on Perspective API - swapped out 2026-08-13 once
// Perspective announced it's sunsetting after 2026. moderateText is
// Google's actively-maintained replacement, on the same GCP project, no
// separate account needed.)
// Node 20's built-in fetch is used directly - no extra HTTP dependency.

const { defineSecret } = require("firebase-functions/params");

const moderationApiKey = defineSecret("GOOGLE_MODERATION_API_KEY");

// Neither Google API call has any other timeout, so a slow/hung response
// (rate limiting, a transient outage, anything short of a clean error)
// would otherwise stall the whole onCall function - and since the client
// fails open on ANY error (see moderation-client.js), a fast timeout here
// is what actually keeps that promise, rather than leaving the caller's
// own 30s save-chain deadline (profile-form.js's withTimeout) as the only
// thing standing between a slow moderation call and a stuck "Saving…".
const FETCH_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

// Anything at or above BLOCK never gets saved; FLAG saves normally but gets
// logged + emailed to Chris so the thresholds here can be tuned against
// real false positives/negatives over time - same "ship a reasonable
// default, iterate" approach as social-format.js's link rubric. Thresholds
// are unchanged from the Perspective-era values (0-1 confidence scale on
// both APIs), but re-tuning may be worth revisiting once real moderateText
// results come in - the two models don't necessarily calibrate the same.
const TEXT_BLOCK_THRESHOLD = 0.85;
const TEXT_FLAG_THRESHOLD = 0.6;

// moderateText actually returns 16 categories (Politics, Religion & Belief,
// Finance, Legal, Health, Illicit Drugs, War & Conflict, Firearms &
// Weapons, Public Safety, Death Harm & Tragedy, and more) - only the ones
// with real harassment/safety overlap are used here, matching this
// filter's original scope (a harassment filter, not a general
// content-policy one). Toxic/Derogatory/Profanity together approximate
// Perspective's old TOXICITY/SEVERE_TOXICITY pairing; Insult and Sexual
// map directly to INSULT/SEXUALLY_EXPLICIT; Violent stands in for THREAT,
// since moderateText has no dedicated threat category.
const TEXT_CATEGORIES = ["Toxic", "Derogatory", "Profanity", "Insult", "Sexual", "Violent"];

async function analyzeText(text) {
  const res = await fetchWithTimeout(
    "https://language.googleapis.com/v1/documents:moderateText?key=" + moderationApiKey.value(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document: { type: "PLAIN_TEXT", content: text },
      }),
    }
  );
  if (!res.ok) {
    throw new Error("Natural Language API error: " + res.status + " " + (await res.text()));
  }
  const data = await res.json();

  const scores = {};
  let maxScore = 0;
  (data.moderationCategories || []).forEach((category) => {
    if (TEXT_CATEGORIES.indexOf(category.name) === -1) return;
    scores[category.name] = category.confidence;
    if (category.confidence > maxScore) maxScore = category.confidence;
  });

  const decision = maxScore >= TEXT_BLOCK_THRESHOLD ? "block"
    : maxScore >= TEXT_FLAG_THRESHOLD ? "flag"
    : "allow";

  return { scores, maxScore, decision };
}

// Vision's SafeSearch likelihoods run UNKNOWN < VERY_UNLIKELY < UNLIKELY <
// POSSIBLE < LIKELY < VERY_LIKELY - ranked 0-5 so thresholds can compare
// numerically. "Racy" is graded more leniently than adult/violence (a
// LIKELY-racy swimwear or fitness photo is common and isn't actually
// nudity) - only VERY_LIKELY racy blocks on its own.
const LIKELIHOOD_RANK = { UNKNOWN: 0, VERY_UNLIKELY: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, VERY_LIKELY: 5 };

async function analyzeImage(base64) {
  const res = await fetchWithTimeout(
    "https://vision.googleapis.com/v1/images:annotate?key=" + moderationApiKey.value(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{ image: { content: base64 }, features: [{ type: "SAFE_SEARCH_DETECTION" }] }],
      }),
    }
  );
  if (!res.ok) {
    throw new Error("Vision API error: " + res.status + " " + (await res.text()));
  }
  const data = await res.json();
  const result = data.responses && data.responses[0];
  if (!result || result.error) {
    throw new Error("Vision API returned an error: " + JSON.stringify(result && result.error));
  }
  const safe = result.safeSearchAnnotation || {};

  const adult = LIKELIHOOD_RANK[safe.adult] || 0;
  const violence = LIKELIHOOD_RANK[safe.violence] || 0;
  const racy = LIKELIHOOD_RANK[safe.racy] || 0;

  let decision = "allow";
  if (adult >= LIKELIHOOD_RANK.LIKELY || violence >= LIKELIHOOD_RANK.LIKELY || racy >= LIKELIHOOD_RANK.VERY_LIKELY) {
    decision = "block";
  } else if (adult >= LIKELIHOOD_RANK.POSSIBLE || violence >= LIKELIHOOD_RANK.POSSIBLE || racy >= LIKELIHOOD_RANK.LIKELY) {
    decision = "flag";
  }

  return { safeSearch: safe, decision };
}

module.exports = { moderationApiKey, analyzeText, analyzeImage };
