// server/services/routePlan.js
import fetch from 'node-fetch';

const ORS_BASE = 'https://api.openrouteservice.org/v2';
const PROFILE = { bike: 'cycling-regular', trek: 'foot-hiking' };
const MAX_PER_DAY_KM = { bike: 60, trek: 15 };


// ---------- geo helpers ----------

/**
 * Converts degrees to radians.
 */
function toRad(d) { return (d * Math.PI) / 180; }

/**
 * Converts radians to degrees.
 */
function toDeg(r) { return (r * 180) / Math.PI; }

/**
 * Calculates the great-circle distance (in km) between two [lon,lat] points using the haversine formula.
 */
function haversineKm(a, b) {
  const [lon1, lat1] = a, [lon2, lat2] = b;
  const R = 6371;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const x = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Computes the total distance (in km) for a list of [lon,lat] coordinates.
 */
function totalDistanceKm(coords) {
  let s = 0;
  for (let i = 1; i < coords.length; i++) s += haversineKm(coords[i-1], coords[i]);
  return s;
}

/**
 * Calculates a destination point given a start [lon,lat], distance in km, and bearing in degrees.
 * Used to generate candidate endpoints for route planning.
 */
function destinationPoint([lon, lat], distanceKm, bearingDeg) {
  const R = 6371;
  const δ = distanceKm / R;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);

  const sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ), cosδ = Math.cos(δ);
  const sinθ = Math.sin(θ), cosθ = Math.cos(θ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
  const φ2 = Math.asin(sinφ2);
  const y = sinθ * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return [toDeg(λ2), toDeg(φ2)];
}

/* ---------- ORS helpers ---------- */
/**
 * Finds the nearest routable point for a given profile and coordinates, searching with increasing radii.
 * Used to snap start/end points to the nearest road or trail.
 */
async function getRoutablePoint(profile, lon, lat, radii = [500, 1000, 2000, 5000, 10000]) {
  for (const r of radii) {
    try {
      const u = new URL(`${ORS_BASE}/nearest/${profile}`);
      u.searchParams.set('point', `${lon},${lat}`);
      u.searchParams.set('number', '1');
      u.searchParams.set('radius', String(r));
      const res = await fetch(u, { headers: { Authorization: process.env.ORS_API_KEY } });
      if (!res.ok) continue;
      const j = await res.json();
      const p = j?.features?.[0]?.geometry?.coordinates;
      if (p) return p; // [lon,lat]
    } catch { /* try next radius */ }
  }
  return null;
}

/**
 * Attempts to get a route between coordinates using OpenRouteService directions API.
 * Returns route coordinates and total distance if successful.
 */
async function tryDirections(profile, coordinates) {
  const res = await fetch(`${ORS_BASE}/directions/${profile}/geojson`, {
    method: 'POST',
    headers: { Authorization: process.env.ORS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates, instructions: false })
  });
  const json = await res.json().catch(() => ({}));
  const coords = json?.features?.[0]?.geometry?.coordinates || [];
  if (!res.ok) {
    const code = json?.error?.code;
    return { okFlag: false, code, error: json };
  }
  return { okFlag: coords.length > 1, coords, km: totalDistanceKm(coords) };
}

/**
 * Attempts to generate a round-trip route of a given length using OpenRouteService.
 * Used as a fallback if point-to-point routing fails.
 */
async function tryRoundTrip(profile, startLon, startLat, meters, seed) {
  const res = await fetch(`${ORS_BASE}/directions/${profile}/geojson`, {
    method: 'POST',
    headers: { Authorization: process.env.ORS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      coordinates: [[startLon, startLat]],
      options: { round_trip: { length: meters, seed } },
      instructions: false
    })
  });
  const json = await res.json().catch(() => ({}));
  const coords = json?.features?.[0]?.geometry?.coordinates || [];
  if (!res.ok) return { okFlag: false, error: json };
  return { okFlag: coords.length > 3, coords, km: totalDistanceKm(coords) };
}

/* ---------- day split helpers ---------- */
/**
 * Computes the split of total distance into two days for bike trips, capping at 60km per day.
 * Returns null if the split is not feasible.
 */
function computeDayDistancesTwoDays(totalKm) {
  const cappedTotal = Math.min(totalKm, MAX_PER_DAY_KM.bike * 2);
  let d1 = Math.min(cappedTotal / 2, MAX_PER_DAY_KM.bike);
  let d2 = Math.min(cappedTotal - d1, MAX_PER_DAY_KM.bike);
  if (d1 <= 0 || d2 <= 0) return null;
  return [d1, d2];
}

/* ---------- BIKE: city → city (2 days, ≤60/day) ---------- */
/**
 * Plans a two-day bike trip from a start location, using OpenRouteService.
 * - Tries various bearings and distances to find a realistic route.
 * - Falls back to a round-trip loop if point-to-point fails.
 * - Returns route coordinates, day splits, and start/end points.
 *
 * Design decision: Uses randomization and multiple attempts for robustness.
 */
export async function planBikeTwoDays({ start }) {
  // Snap start to cycling network if possible
  let [sLon, sLat] = [start.lon, start.lat];
  const snappedStart = await getRoutablePoint(PROFILE.bike, sLon, sLat, [500, 1000, 2000, 5000]);
  if (snappedStart) [sLon, sLat] = snappedStart;

  const seed = Math.floor(Math.random() * 10000);
  const base = seed % 360;
  const bearings = [0, 30, -30, 60, -60, 90, -90, 120, -120].map(b => (base + b + 360) % 360);
  const distCandidates = [110, 100, 90, 80, 70, 60, 120, 95, 85]; // target “as the crow flies”

  // Primary attempt: point-to-point with varied bearings/distances
  for (const D of distCandidates) {
    for (const B of bearings) {
      try {
        let [dLon, dLat] = destinationPoint([sLon, sLat], D, B);
        const snap = await getRoutablePoint(PROFILE.bike, dLon, dLat);
        if (snap) [dLon, dLat] = snap;

        const t = await tryDirections(PROFILE.bike, [[sLon, sLat], [dLon, dLat]]);
        if (!t.okFlag) {
          // 2010 = “couldn’t find routable within radius”; try other candidates
          if (t.code === 2010) continue;
          continue;
        }
        // Keep it realistic, but don’t be overly strict
        const totalKm = t.km;
        if (totalKm < 30 || totalKm > 140) continue;

        const days = computeDayDistancesTwoDays(totalKm);
        if (!days) continue;

        return {
          coords: t.coords,
          dayDistances: days,
          start: { lat: sLat, lon: sLon },
          end:   { lat: dLat, lon: dLon }
        };
      } catch { /* keep trying */ }
    }
  }

  // Robust fallback: build a round-trip loop, pick a destination on the loop (~90–110 km away),
  // then route start → that destination.
  const loopLengths = [120_000, 100_000, 80_000, 60_000]; // meters
  const targetKmPrefs = [100, 90, 110, 80, 70]; // what we’d like total to be

  for (const L of loopLengths) {
    const rt = await tryRoundTrip(PROFILE.bike, sLon, sLat, L, seed);
    if (!rt.okFlag) continue;

    // cumulative distances along loop
    const cum = [0];
    for (let i = 1; i < rt.coords.length; i++) cum[i] = cum[i-1] + haversineKm(rt.coords[i-1], rt.coords[i]);
    const loopTotal = cum[cum.length - 1];

    for (const target of targetKmPrefs) {
      const targetKm = Math.min(Math.max(target, 30), Math.min(loopTotal, 140));
      // find the point on the loop closest to targetKm from start
      let idx = 1;
      for (let i = 1; i < cum.length; i++) {
        if (Math.abs(cum[i] - targetKm) < Math.abs(cum[idx] - targetKm)) idx = i;
      }
      let [dLon, dLat] = rt.coords[idx];
      const snap = await getRoutablePoint(PROFILE.bike, dLon, dLat);
      if (snap) [dLon, dLat] = snap;

      const ab = await tryDirections(PROFILE.bike, [[sLon, sLat], [dLon, dLat]]);
      if (!ab.okFlag) continue;

      const totalKm = ab.km;
      if (totalKm < 30 || totalKm > 140) continue;

      const days = computeDayDistancesTwoDays(totalKm);
      if (!days) continue;

      return {
        coords: ab.coords,
        dayDistances: days,
        start: { lat: sLat, lon: sLon },
        end:   { lat: dLat, lon: dLon }
      };
    }
  }

  throw new Error('Routing error (bike city-to-city)');
}

/* ---------- TREK: single-day loop 5–15 km, start≈end ---------- */
/**
 * Plans a single-day trek (hiking) loop from a start location, using OpenRouteService.
 * - Tries various loop lengths and random seeds to find a feasible route.
 * - Ensures the loop closes visually (within 50 meters).
 * - Returns route coordinates, day distance, and start/end points.
 */
export async function planTrekLoop({ start }) {
  let [sLon, sLat] = [start.lon, start.lat];
  const snappedStart = await getRoutablePoint(PROFILE.trek, sLon, sLat, [500, 1000, 2000, 5000]);
  if (snappedStart) [sLon, sLat] = snappedStart;

  const lengthCandidates = [9_000, 11_000, 13_000, 7_000, 15_000]; // meters
  const seed0 = Math.floor(Math.random() * 10000);
  const seeds = [seed0, seed0 + 1, seed0 + 2, seed0 + 3, seed0 + 4];

  for (const L of lengthCandidates) {
    for (const S of seeds) {
      const t = await tryRoundTrip(PROFILE.trek, sLon, sLat, L, S);
      if (!t.okFlag) continue;
      const km = t.km;
      if (km < 5 || km > 15.5) continue; // within spec (tiny slack)

      // ensure loop closes (≤ 50 m). If not, append start to close visually.
      const a = t.coords[0], b = t.coords[t.coords.length - 1];
      const closureM = haversineKm(a, b) * 1000;
      const coords = closureM <= 50 ? t.coords : [...t.coords, a];

      return {
        coords,
        dayDistances: [km],
        start: { lat: sLat, lon: sLon },
        end:   { lat: sLat, lon: sLon },
        meta: { closureMeters: Math.round(closureM) }
      };
    }
  }

  throw new Error('Trek route too short');
}

/* ---------- router-facing wrapper ---------- */
/**
 * Router-facing wrapper for planning a route based on trip type.
 * Delegates to the appropriate planner for 'bike' or 'trek'.
 */
export async function planRoute({ start, type }) {
  if (type === 'bike') return planBikeTwoDays({ start });
  if (type === 'trek') return planTrekLoop({ start });
  throw new Error(`Unknown trip type: ${type}`);
}
