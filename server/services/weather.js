
import fetch from 'node-fetch';

/**
 * Formats a Date object as 'YYYY-MM-DD' for API requests.
 */
function dstr(d) { return d.toISOString().slice(0, 10); }

/**
 * Fetches a 3-day weather forecast (starting tomorrow) for the given lat/lon using Open-Meteo API.
 * Returns daily max/min temperature, precipitation probability, and wind speed.
 * Design decision: Always starts forecast from tomorrow to avoid partial data for today.
 */
export async function getThreeDayForecast({ lat, lon }) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const end   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max` +
    `&start_date=${dstr(start)}&end_date=${dstr(end)}&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather failed');
  const data = await res.json();
  return data.daily;
}
