import fetch from 'node-fetch';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const UA = 'TravelPlannerMVP/1.0 (edu)';

export async function geocodeCity(q) {
  const url = `${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('Geocoding failed');
  const [first] = await res.json();
  if (!first) throw new Error('City not found');
  return { lat: +first.lat, lon: +first.lon, displayName: first.display_name };
}

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

export function shortCityName(displayName) {
  return (displayName || '').split(',')[0].trim();
}
