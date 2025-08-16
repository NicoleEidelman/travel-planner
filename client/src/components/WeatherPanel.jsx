// client/src/components/WeatherPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';

// עוזר קטן להצגה נעימה
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

export default function WeatherPanel({ lat, lon }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [days, setDays] = useState([]);
  /**
   * Chip component
   * Displays a small labeled value, used for weather metrics.
   */
  const valid = useMemo(() => Number.isFinite(lat) && Number.isFinite(lon), [lat, lon]);

  async function fetchWeather() {
    if (!valid) return;
    setLoading(true);
    setErr('');
    try {
      // Open-Meteo ללא מפתח, CORS פתוח
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`weather http ${res.status}`);
      const data = await res.json();

      const out = (data?.daily?.time || []).map((d, i) => ({
        date: d,
        tmin: data.daily.temperature_2m_min?.[i],
        tmax: data.daily.temperature_2m_max?.[i],
        pop: data.daily.precipitation_probability_max?.[i], // %
  /**
   * WeatherPanel React component
   * Fetches and displays a 3-day weather forecast for a given latitude and longitude.
   * Uses Open-Meteo API (no API key required, but CORS is enforced).
   * Shows loading, error, and no-data states. Weather is shown as a set of chips for each day.
   *
   * Design decision: Uses useMemo to validate coordinates and avoid unnecessary fetches.
   * Fetches weather on mount and whenever coordinates change.
   */
        wind: data.daily.windspeed_10m_max?.[i], // km/h
      })).slice(0, 3);

      setDays(out);
    } catch (e) {
      setErr(e.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  }

  // טען אוטומטית כשהקואורדינטות זמינות
  useEffect(() => { fetchWeather(); /* eslint-disable-next-line */ }, [lat, lon]);

  if (!valid) {
    return <div style={{ color: '#9ca3af', fontSize: '.95rem' }}>אין קואורדינטת התחלה להצגת מזג אוויר.</div>;
  }
     // Open-Meteo API: free, no auth, but CORS is enforced
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong>🌤️ תחזית 3 ימים – נקודת התחלה</strong>
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
          {loading ? 'טוען…' : 'רענן'}
        </button>
      </div>

      {err && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 6 }}>⚠️ {err}</div>}

      {days.length === 0 && !loading ? (
        <div style={{ color: '#9ca3af', fontSize: '.95rem' }}>אין נתוני תחזית זמינים.</div>
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
                יום {idx + 1}{' '}
                <span style={{ color: '#6b7280', fontWeight: 500 }}>
                  ({new Date(d.date).toLocaleDateString()})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip label="טמפ׳" value={`${Math.round(d.tmin)}–${Math.round(d.tmax)}°C`} />
                <Chip label="גשם" value={`${d.pop ?? 0}%`} />
                <Chip label="רוח" value={`${Math.round(d.wind ?? 0)} קמ״ש`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
