// server/routes/trips.js
import express from 'express';
import Trip from '../models/Trip.js';
import { authRequired } from '../middleware/authRequired.js';
import { planSchema, saveTripSchema } from '../utils/validate.js';
import { geocodeCity } from '../services/geo.js';
import { planRoute } from '../services/routePlan.js';
import { getThreeDayForecast } from '../services/weather.js';
import { placeInfoFor } from '../services/placeInfo.js'; // Import the existing function
import fetch from 'node-fetch';

const router = express.Router();
const isHexId = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ''));

/* ---------------- helpers ---------------- */
// Build a short narrative/teaser for a trip based on city, type, and distances
function buildNarrative(city, type, days) {
  if (type === 'bike') {
    const d1 = Math.round(days[0] || 0);
    const d2 = Math.round(days[1] || 0);
    return `Two-day bike route from ${city}: about ${d1} km on day 1 and ${d2} km on day 2. Uses real cycling roads/tracks (OpenRouteService).`;
  } else {
    const d = Math.round(days[0] || 0);
    return `One-day hiking loop near ${city}, about ${d} km, following real trails/roads (OpenRouteService).`;
  }
}

/* ---------------- plan routes ---------------- */

// POST /api/trips/plan  { city, type: 'bike'|'trek' }
// Plan a new trip route (POST /api/trips/plan)
router.post('/plan', authRequired, async (req, res) => {
  try {
    const { city, type } = await planSchema.validateAsync(req.body);

    const start = await geocodeCity(city);              // { lat, lon, displayName }
    const planned = await planRoute({ start, type });   // { coords, dayDistances, start, end }
    const weather = await getThreeDayForecast(start);   // Open-Meteo daily
    
    // Fetch place information including cover image
    const placeInfo = await placeInfoFor(start.displayName || city);

    const label = start.displayName || city;

    res.json({
      city,
      type,
      ...planned,
      weather,
      cover: placeInfo.cover,           // Wikipedia image or Unsplash fallback
      imageUrl: placeInfo.cover,        // for older clients
      placeDescription: placeInfo.description, // Wikipedia description
      label,
      narrative: buildNarrative(city, type, planned.dayDistances)
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to plan route' });
  }
});

// Guard: if someone accidentally GETs /plan, don't fall into /:id
// Guard: Prevent accidental GET on /plan (should be POST)
router.get('/plan', authRequired, (_req, res) => {
  res.status(405).json({ message: 'Use POST /api/trips/plan' });
});

/* ---------------- optional AI narrative ---------------- */

// Generate an AI-powered narrative for a trip (POST /api/trips/ai/narrative)
router.post('/ai/narrative', authRequired, async (req, res) => {
  try {
    const { city, type, dayDistances } = req.body;
    if (!city || !type || !Array.isArray(dayDistances)) {
      return res.status(400).json({ message: 'Missing city/type/dayDistances' });
    }

    const days = dayDistances.length;
    const prompt = `
You are a friendly travel guide. A user is planning a ${days}-day ${type} trip starting in ${city}.
Daily distances (km): ${dayDistances.map(d => Number(d).toFixed(1)).join(', ')}.
Write a lively, concise teaser (max ~120 words). Mention the city; do not use coordinates.
    `.trim();

    let narrative = '';

    if (process.env.GROQ_API_KEY) {
      // Use a current Groq model; fall back gracefully if it errors.
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Updated model (older "llama-3.1-70b-versatile" is decommissioned)
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You write concise, vivid travel blurbs.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.9
        })
      });

      const ct = resp.headers.get('content-type') || '';
      if (resp.ok && ct.includes('application/json')) {
        const j = await resp.json();
        narrative = j?.choices?.[0]?.message?.content?.trim() || '';
      } else {
        // keep going with fallback
        await resp.text().catch(()=>{});
      }
    }

    if (!narrative) {
      narrative = dayDistances
        .map((d, i) => `Day ${i + 1}: approx ${Number(d).toFixed(1)} km`)
        .join('. ') + '.';
    }

    res.json({ narrative });
  } catch (e) {
    res.status(500).json({ message: 'Failed to generate narrative' });
  }
});

/* ---------------- persistence ---------------- */

// POST /api/trips/save — persist a planned trip (without weather)
// Save a planned trip to the database (POST /api/trips/save)
router.post('/save', authRequired, async (req, res) => {
  try {
    const payload = await saveTripSchema.validateAsync(req.body);
    const doc = await Trip.create({ ...payload, owner: req.session.user.id });
    res.status(201).json({ id: doc._id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/trips — list my trips
// List all trips for the logged-in user (GET /api/trips)
router.get('/', authRequired, async (req, res) => {
  const list = await Trip.find({ owner: req.session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  res.json(
    list.map(({ _id, name, description, type, createdAt }) => ({
      id: _id, name, description, type, createdAt
    }))
  );
});

// GET /api/trips/:id — validate first, then query
// Get a specific trip by ID for the logged-in user (GET /api/trips/:id)
router.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;

  // ✅ prevents CastError and also stops /plan from querying Mongo if it slips through
  if (!isHexId(id)) return res.status(404).json({ message: 'Not found' });

  const trip = await Trip.findOne({
    _id: id,
    owner: req.session.user.id
  }).lean();

  if (!trip) return res.status(404).json({ message: 'Not found' });

  const weather = await getThreeDayForecast(trip.start);
  const label = trip.city || trip.name || `${trip.start.lat},${trip.start.lon}`;
  
  // Fetch fresh place info for saved trips too
  const placeInfo = await placeInfoFor(label);

  res.json({ 
    ...trip, 
    weather, 
    cover: placeInfo.cover, 
    imageUrl: placeInfo.cover, 
    placeDescription: placeInfo.description,
    label 
  });
});

export default router;