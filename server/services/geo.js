
import fetch from 'node-fetch';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const UA = 'TravelPlannerMVP/1.0 (edu)';

/**
 * Geocodes a city name to latitude/longitude using OpenStreetMap Nominatim API.
 * Returns the first result's lat/lon and display name.
 * Throws an error if no result is found or the API fails.
 * Design decision: Uses a custom User-Agent to comply with Nominatim's usage policy.
 */
export async function geocodeCity(q) {
  const url = `${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('Geocoding failed');
  const [first] = await res.json();
  if (!first) throw new Error('City not found');
  return { lat: +first.lat, lon: +first.lon, displayName: first.display_name };
}

/**
 * Reverse geocodes latitude/longitude to a city name using Nominatim API.
 * Returns the best available city/town/village/county name, or 'Unknown' if not found.
 * Design decision: Uses zoom=10 for city-level granularity and English language results.
 */
export async function reverseToCity(lat, lon) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const j = await res.json();
  const name =
    j.address?.city || j.address?.town || j.address?.village ||
    j.address?.county || j.name || 'Unknown';
  return { name, lat, lon };
}

/**
 * Extracts the short city name from a display name string (e.g., 'Paris, Île-de-France, France' -> 'Paris').
 */
export function shortCityName(displayName) {
  return (displayName || '').split(',')[0].trim();
}
