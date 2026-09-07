// Server-side port of profile-form.js's geocodeLocation() - same free
// OpenStreetMap Nominatim search (no API key), same 8-second timeout, same
// "any failure just resolves to null rather than blocking the save"
// philosophy, since the location map is optional. Used by
// completeAgoraProfile so a Harness-created profile's location dot works
// the same way a browser-created one's does.

const GEOCODE_TIMEOUT_MS = 8000;

async function geocodeLocation(city, region, country) {
  const query = [city, region, country].filter(Boolean).join(", ");
  if (!query) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(query),
      { signal: controller.signal, headers: { "User-Agent": "Agora (VirtuaMakers)" } }
    );
    const results = await res.json();
    if (!results || !results.length) return null;
    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon);
    return (isNaN(lat) || isNaN(lng)) ? null : { lat, lng };
  } catch (err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { geocodeLocation };
