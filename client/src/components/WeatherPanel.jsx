import React, { useEffect, useMemo, useState } from 'react';

/** Small labeled value chip used for weather metrics */
function Chip({ label, value }) {
  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: '6px 10px',
      fontSize: 12,
      display: 'inline-flex',
      gap: 6,
      alignItems: 'baseline'
    }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <strong style={{ color: '#1f2937' }}>{value}</strong>
    </div>
  );
}

/**
 * WeatherPanel
 * Fetches and displays a 3-day forecast (Open-Meteo; no API key).
 * - Triggers when valid lat/lon are provided
 * - Graceful loading/error/empty states
 */
export default function WeatherPanel({ lat, lon }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [days, setDays] = useState([]);

  // Only fetch when coordinates are sane (Number + finite)
  const valid = useMemo(() => Number.isFinite(lat) && Number.isFinite(lon), [lat, lon]);

  async function fetchWeather() {
    if (!valid) return;
    setLoading(true);
    setErr('');
    try {
      // Open-Meteo: public endpoint (CORS enabled, no key)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`weather http ${res.status}`);
      const data = await res.json();

      const out = (data?.daily?.time || []).map((d, i) => ({
        date: d,
        tmin: data.daily.temperature_2m_min?.[i],
        tmax: data.daily.temperature_2m_max?.[i],
        pop: data.daily.precipitation_probability_max?.[i], // %
        wind: data.daily.windspeed_10m_max?.[i], // km/h
      })).slice(0, 3);

      setDays(out);
    } catch (e) {
      setErr(e.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on coordinate change
  useEffect(() => { fetchWeather(); /* eslint-disable-next-line */ }, [lat, lon]);

  if (!valid) {
    return <div style={{ color: '#9ca3af', fontSize: '.95rem' }}>No start coordinates available for weather.</div>;
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong>🌤️ 3-day forecast – Start point</strong>
        <button
          onClick={fetchWeather}
          disabled={loading}
          style={{
            padding: '8px 12px',
            fontSize: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#1f2937',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {err && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 6 }}>⚠️ {err}</div>}

      {days.length === 0 && !loading ? (
        <div style={{ color: '#9ca3af', fontSize: '.95rem' }}>No forecast data available.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {days.map((d, idx) => (
            <div key={idx} style={{
              background: '#fafafa',
              border: '1px solid #eee',
              borderRadius: 10,
              padding: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 700, color: '#111827' }}>
                Day {idx + 1}{' '}
                <span style={{ color: '#6b7280', fontWeight: 500 }}>
                  ({new Date(d.date).toLocaleDateString()})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip label="Temp" value={`${Math.round(d.tmin)}–${Math.round(d.tmax)}°C`} />
                <Chip label="Rain" value={`${d.pop ?? 0}%`} />
                <Chip label="Wind" value={`${Math.round(d.wind ?? 0)} km/h`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
