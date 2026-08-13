// Content moderation: Google's Perspective API for text (toxicity, threats,
// insults, sexually-explicit language) and Google Cloud Vision's SafeSearch
// for images (nudity, violence, racy content). Both are reachable with one
// restricted Google Cloud API key - enable "Perspective Comment Analyzer
// API" and "Cloud Vision API" on the same project, then set the secret
// once:
//   firebase functions:secrets:set GOOGLE_MODERATION_API_KEY
// Node 20's built-in fetch is used directly - no extra HTTP dependency.

const { defineSecret } = require("firebase-functions/params");

const moderationApiKey = defineSecret("GOOGLE_MODERATION_API_KEY");

// Anything at or above BLOCK never gets saved; FLAG saves normally but gets
// logged + emailed to Chris so the thresholds here can be tuned against
// real false positives/negatives over time - same "ship a reasonable
// default, iterate" approach as social-format.js's link rubric.
const TEXT_BLOCK_THRESHOLD = 0.85;
const TEXT_FLAG_THRESHOLD = 0.6;
const TEXT_ATTRIBUTES = ["TOXICITY", "SEVERE_TOXICITY", "THREAT", "INSULT", "SEXUALLY_EXPLICIT"];

async function analyzeText(text) {
  const requestedAttributes = {};
  TEXT_ATTRIBUTES.forEach((attr) => { requestedAttributes[attr] = {}; });

  const res = await fetch(
    "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" + moderationApiKey.value(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: { text },
        languages: ["en"],
        requestedAttributes,
      }),
    }
  );
  if (!res.ok) {
    throw new Error("Perspective API error: " + res.status + " " + (await res.text()));
  }
  const data = await res.json();

  const scores = {};
  let maxScore = 0;
  TEXT_ATTRIBUTES.forEach((attr) => {
    const score = (data.attributeScores && data.attributeScores[attr])
      ? data.attributeScores[attr].summaryScore.value
      : 0;
    scores[attr] = score;
    if (score > maxScore) maxScore = score;
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
  const res = await fetch(
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
