import fetch from 'node-fetch';

function dstr(d) { return d.toISOString().slice(0, 10); }

// 3-day forecast starting TOMORROW; includes temps, precip prob, wind
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
