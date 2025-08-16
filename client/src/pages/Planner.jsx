// client/src/pages/Planner.jsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import '../styles/designSystem.css';
import WeatherPanel from '../components/WeatherPanel';

// Leaflet icon fix (Vite / bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function Planner({ user }) {
  const location = useLocation();
  const savedTripFromState = location.state?.savedTrip || null;

  const [city, setCity] = useState('');
  const [tripType, setTripType] = useState('hiking'); // 'hiking' | 'bike'
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [plan, setPlan] = useState(null);
  const [cover, setCover] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const mapRef = useRef(null);
  const map = useRef(null);
  const featuresGroup = useRef(null);

  // ---------------- Helpers ----------------
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}</div>
        <div>
          <div style="font-weight:700;margin-bottom:2px;">
            ${type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Error'}
          </div>
          <div style="font-size:.9rem;color:#4b5563">${message}</div>
        </div>
      </div>`;
    Object.assign(toast.style, {
      position: 'fixed', right: '16px', top: '16px', zIndex: 3000,
      background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
      padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,.08)',
      animation: 'fadeIn .15s ease-out'
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut .25s ease-in forwards';
      setTimeout(() => document.body.removeChild(toast), 250);
    }, 3500);
  };

  const clipText = (str = '', max = 400) =>
    String(str).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

  // server ➜ UI shape
  function toUiPlan(serverData, uiType) {
    const type = uiType === 'hiking' ? 'trek' : 'bike';
    const coords = serverData.coords || [];
    const dayDistances = serverData.dayDistances || [];
    const lineString = coords.length ? { type: 'LineString', coordinates: coords } : null;
    const kmh = type === 'bike' ? 15 : 4;
    const days = dayDistances.map((km, idx) => ({
      geometry: lineString,
      distanceKm: Number(km).toFixed(1),
      durationMin: Math.round((Number(km) / kmh) * 60),
      day: idx + 1,
    }));
    const w = serverData.weather || {};
    const forecast = Array.isArray(w?.time)
      ? w.time.map((date, i) => {
          const tmin = w.temperature_2m_min?.[i];
          const tmax = w.temperature_2m_max?.[i];
          const temp = (Number(tmin ?? 0) + Number(tmax ?? 0)) / 2;
          const precip = w.precipitation_sum?.[i] ?? 0;
          return { date, temp: Math.round(temp), description: precip > 0 ? 'rain likely' : 'clear', humidity: '-' };
        })
      : [];
    return { city: serverData.city, type, plan: serverData.narrative || '', days, weather: { forecast }, _raw: serverData };
  }

  const tryFetchCover = useCallback(async (q) => {
    const query = (q || plan?._raw?.label || plan?.city || city || '').trim();
    if (!query) return;
    try {
      const { data } = await api.get('/trips/place-photo', { params: { city: query } });
      if (data?.coverImageUrl) { setCover(data.coverImageUrl); return; }
    } catch {/* ignore */}
    setCover(`https://source.unsplash.com/featured/1200x630/?${encodeURIComponent(query)}`);
  }, [city, plan]);

  // Build payload strictly to schema expected by /trips/save
  const sanitizeForSave = (planObj, cityStr) => {
    const description = clipText(planObj?.plan || planObj?._raw?.placeDescription || '', 400);
    const dayDistances = (
      planObj?._raw?.dayDistances?.length ? planObj._raw.dayDistances
      : (planObj?.days || []).map(d => Number(d.distanceKm))
    ).map(n => (Number.isFinite(Number(n)) ? Number(n) : 0));
    const coords = Array.isArray(planObj?._raw?.coords)
      ? planObj._raw.coords.filter(p =>
          Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)
        )
      : [];
    const t = planObj?.type === 'bike' ? 'bike' : 'trek';
    return {
      name: `${t === 'bike' ? 'Cycling' : 'Hiking'} trip in ${planObj?.city || cityStr}`,
      description, type: t, coords, dayDistances,
      narrative: planObj?.plan || '',
      start: planObj?._raw?.start || null,
      end: planObj?._raw?.end || null,
    };
  };

  // ---------------- Map ----------------
  useEffect(() => {
    if (!map.current && mapRef.current) {
      map.current = L.map(mapRef.current, { zoomControl: false }).setView([31.7683, 35.2137], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map.current);
      L.control.zoom({ position: 'topright' }).addTo(map.current);
      featuresGroup.current = L.featureGroup().addTo(map.current);
    }
    return () => { if (map.current) { map.current.remove(); map.current = null; } };
  }, []);

  const drawPlan = useCallback((uiPlan) => {
    if (!featuresGroup.current || !map.current) return;
    featuresGroup.current.clearLayers();
    const color = uiPlan.type === 'bike' ? '#667eea' : '#48bb78';
    uiPlan.days?.forEach((d, index) => {
      if (!d.geometry) return;
      L.geoJSON(d.geometry, {
        style: { color, weight: 5, opacity: 0.9, dashArray: uiPlan.type === 'bike' ? '10, 6' : null, lineCap: 'round' },
      })
        .bindPopup(`
          <div style="font-weight:700;margin-bottom:4px;">Day ${d.day || index + 1}</div>
          <div>Distance: ${d.distanceKm} km</div>
          <div>Time: ${Math.floor(d.durationMin/60)}h ${d.durationMin%60}m</div>
        `)
        .addTo(featuresGroup.current);
    });
    const layers = featuresGroup.current.getLayers();
    if (layers.length > 0) map.current.fitBounds(featuresGroup.current.getBounds(), { padding: [28, 28], maxZoom: 15 });
  }, []);

  // preload trip if navigated with savedTrip
  useEffect(() => {
    if (!savedTripFromState) return;
    setCity(savedTripFromState.destinations?.[0]?.location || '');
    try {
      const parsed = JSON.parse(savedTripFromState.destinations?.[0]?.notes || '{}');
      if (parsed?.days) {
        setPlan(parsed);
        drawPlan(parsed);
        const savedCover = savedTripFromState.cover || parsed.cover || parsed?._raw?.cover;
        if (savedCover) setCover(savedCover); else tryFetchCover(parsed.city);
      }
    } catch {/* ignore */}
  }, [savedTripFromState, drawPlan, tryFetchCover]);

  // ---------------- Actions ----------------
  const generateTrip = async () => {
    if (!user) { showToast('Please login first', 'warning'); return; }
    if (!city.trim()) { showToast('Please enter a city or country', 'warning'); return; }
    setIsLoading(true); setErrorMsg('');
    try {
      const serverType = tripType === 'hiking' ? 'trek' : 'bike';
      const { data } = await api.post('/trips/plan', { city, type: serverType });
      const uiPlan = toUiPlan(data, tripType);
      const serverCover = data.cover || data.imageUrl || '';
      if (serverCover) setCover(serverCover); else tryFetchCover(data.city || city);
      try {
        const ai = await api.post('/trips/ai/narrative', {
          city: data.city || city, type: serverType, dayDistances: data.dayDistances || [],
        });
        if (ai?.data?.narrative) uiPlan.plan = ai.data.narrative;
      } catch { /* ignore */ }
      setPlan(uiPlan);
      drawPlan(uiPlan);
      showToast('Route created successfully!', 'success');
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e.message || 'Error creating route';
      setErrorMsg(errorMessage);
      showToast(errorMessage, 'error');
    } finally { setIsLoading(false); }
  };

  const saveTrip = async () => {
    if (!plan) { showToast('No route to save', 'warning'); return; }
    setIsSaving(true);
    try {
      const payload = sanitizeForSave(plan, city);
      await api.post('/trips/save', payload);
      const wasClipped = (plan?.plan || plan?._raw?.placeDescription || '')
        .replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().length > 400;
      showToast(wasClipped ? 'Trip saved (description clipped to 400 chars).' : 'Trip saved successfully!', 'success');
    } catch (e) {
      const status = e?.response?.status;
      const server = e?.response?.data;
      console.error('SAVE_FAILED', { status, server });
      const msg = (server?.message || server?.error || (server ? JSON.stringify(server) : '') || e.message || 'Failed to save trip');
      showToast(msg, 'error');
      setErrorMsg(msg);
    } finally { setIsSaving(false); }
  };

  const totalKm = useMemo(
    () => (plan?.days || []).reduce((s, d) => s + Number(d.distanceKm || 0), 0).toFixed(1),
    [plan]
  );

  // lat/lon מנקודת ההתחלה (תומך גם ב-[lon,lat])
  const startLL = useMemo(() => {
    const p = plan?._raw?.coords?.[0];
    if (!Array.isArray(p) || p.length < 2) return null;
    const [a, b] = p.map(Number);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    const isLonLat = Math.abs(a) > 90;
    return { lat: isLonLat ? b : a, lon: isLonLat ? a : b };
  }, [plan]);

  // ---------------- UI ----------------
  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔐</div>
        <h3>Please login to plan trips.</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--gray-50)', overflow: 'hidden' }}>
      {/* LEFT: Controls & details */}
      <aside
        style={{
          width: 420,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(18px)',
          borderRight: '1px solid var(--gray-200)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ padding: '20px 20px 8px 20px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-800)', margin: 0 }}>Trip Planner</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginTop: 6 }}>Plan your perfect adventure</p>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Create Route */}
          <section className="card">
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Create Route</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)' }}>
                  Destination
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input"
                  placeholder="e.g., Paris, Tokyo, New York"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-700)' }}>
                  Activity Type
                </label>
                <select value={tripType} onChange={(e) => setTripType(e.target.value)} className="input">
                  <option value="hiking">🥾 Hiking (5–15 km/day)</option>
                  <option value="bike">🚴 Cycling (30–80 km/day)</option>
                </select>
              </div>

              <button onClick={generateTrip} disabled={isLoading} className="btn btn-primary" style={{ width: '100%' }}>
                {isLoading ? 'Creating…' : 'Create Route'}
              </button>

              {cover && (
                <div style={{ marginTop: 4 }}>
                  <img
                    src={cover}
                    alt="Destination"
                    style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}
                    onError={() => setCover('')}
                  />
                </div>
              )}
            </div>
          </section>

          {errorMsg && (
            <div style={{ background: 'var(--error-50)', border: '1px solid var(--error-200)', borderRadius: 'var(--radius-lg)', padding: 12, color: 'var(--error-700)', fontSize: '0.9rem' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {plan?.days?.length > 0 && (
            <section className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{plan.city}</h3>
                  <span
                    style={{
                      background: plan.type === 'bike' ? 'var(--primary-100)' : 'var(--success-100)',
                      color: plan.type === 'bike' ? 'var(--primary-700)' : 'var(--success-700)',
                      padding: '4px 10px',
                      borderRadius: 10,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {plan.type === 'bike' ? '🚴 Cycling' : '🥾 Hiking'}
                  </span>
                </div>

                <button onClick={saveTrip} disabled={isSaving} className="btn btn-success btn-sm">
                  {isSaving ? 'Saving…' : '💾 Save Trip'}
                </button>
              </div>

              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gray-800)' }}>{plan.days?.length || 0}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Days</div>
                  </div>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gray-800)' }}>{totalKm}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Total KM</div>
                  </div>
                  <div style={{ background: 'var(--gray-50)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: plan.type === 'bike' ? 'var(--primary-700)' : 'var(--success-700)' }}>
                      {plan.type === 'bike' ? '🚴' : '🥾'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>Activity</div>
                  </div>
                </div>

                {/* Teaser */}
                {plan.plan && (
                  <div style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)', borderRadius: 12, padding: 14 }}>
                    <h4 style={{ margin: 0, color: 'var(--primary-900)', fontSize: '1rem', fontWeight: 800 }}>Trip Teaser</h4>
                    <p style={{ margin: '8px 0 0', lineHeight: 1.6, color: 'var(--primary-900)', fontSize: '0.95rem' }}>{plan.plan}</p>
                  </div>
                )}

                {/* Weather (Next 3 Days) – לפי נקודת ההתחלה */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--gray-800)', fontSize: '1rem', fontWeight: 800 }}>
                    Weather (Next 3 Days)
                  </h4>
                  <WeatherPanel lat={startLL?.lat} lon={startLL?.lon} />
                </div>

                {/* Daily plan */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--gray-800)', fontSize: '1rem', fontWeight: 800 }}>Daily Plan</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.days?.map((day, idx) => (
                      <div key={idx} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 12, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, color: 'var(--gray-800)' }}>Day {day.day || idx + 1}</span>
                          <span style={{ background: plan.type === 'bike' ? 'var(--primary-100)' : 'var(--success-100)', color: plan.type === 'bike' ? 'var(--primary-700)' : 'var(--success-700)', padding: '2px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                            {plan.type === 'bike' ? 'Cycling' : 'Hiking'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-800)' }}>{day.distanceKm} km</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Distance</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gray-800)' }}>
                              {Math.floor(day.durationMin / 60)}h {day.durationMin % 60}m
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Duration</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </section>
          )}
        </div>
      </aside>

      {/* RIGHT: Map */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--gray-100)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {isLoading && (
          <div
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '28px',
              textAlign: 'center', backdropFilter: 'blur(10px)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--primary-500)' }}>⏳</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 6 }}>
              Creating your route...
            </h3>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>This may take a few moments</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideOut { to { transform: translateX(100%); opacity: 0; } }
        @media (max-width: 1024px) { aside { width: 360px; } }
        @media (max-width: 768px) {
          aside { position: fixed; top: 0; left: 0; height: 100vh; width: 85vw; z-index: 2000; }
        }
      `}</style>
    </div>
  );
}
