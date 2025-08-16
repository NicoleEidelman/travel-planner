import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import MapView from '../components/MapView';
import WeatherPanel from '../components/WeatherPanel';

/**
 * History page
 * - Lists user's saved trips
 * - Shows selected trip on a map + compact stats + 3-day weather (by start point)
 */
export default function History({ user }) {
  const [list, setList] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simple speed model (km/h) used for ETA calculation
  const speedKmh = (type) => (type === 'bike' ? 15 : 4);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get('/trips')
      .then((r) => setList(Array.isArray(r.data) ? r.data : []))
      .finally(() => setLoading(false));
  }, [user]);

  async function openTrip(id) {
    setLoading(true);
    try {
      const { data } = await api.get(`/trips/${id}`);
      setActive(data);
    } catch (err) {
      console.error('Failed to load trip:', err);
    } finally {
      setLoading(false);
    }
  }

  // Aggregate distance across dayDistances
  const totalKm = useMemo(() => {
    const arr = active?.dayDistances || [];
    return arr.reduce((s, n) => s + Number(n || 0), 0);
  }, [active]);

  // Convert distance to minutes using the speed model above
  const totalMinutes = useMemo(() => {
    if (!active) return 0;
    const kmh = speedKmh(active.type);
    return kmh > 0 ? Math.round((totalKm / kmh) * 60) : 0;
  }, [active, totalKm]);

  /**
   * Extract starting lat/lon from the first coordinate.
   * Accepts either [lat, lon] or [lon, lat]:
   * - If |first| > 90 → assume [lon, lat] and swap.
   */
  const startLL = useMemo(() => {
    const p = active?.coords?.[0];
    if (!Array.isArray(p) || p.length < 2) return null;
    const [a, b] = p.map(Number);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    const isLonLat = Math.abs(a) > 90;
    return { lat: isLonLat ? b : a, lon: isLonLat ? a : b };
  }, [active]);

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔐</div>
        <h3>Please login to view your saved trips.</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>
      {/* Sidebar: saved trips list */}
      <aside
        className="card"
        style={{ padding: 16, alignSelf: 'start', position: 'sticky', top: 16, maxHeight: 'calc(100vh - 32px)', overflow: 'auto' }}
      >
        <h3 style={{ marginTop: 0 }}>My Saved Trips</h3>

        {loading && list.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ color: '#9ca3af' }}>No trips saved yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.map((t) => (
              <button
                key={t.id || t._id}
                onClick={() => openTrip(t.id || t._id)}
                style={{
                  textAlign: 'left',
                  background:
                    active && (active.id === t.id || active._id === t._id)
                      ? 'rgba(102,126,234,0.10)'
                      : 'rgba(248,250,252,0.8)',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, color: '#1f2937' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Main: map + details */}
      <main className="card" style={{ padding: 16 }}>
        {active ? (
          <>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0 }}>{active.name || 'Trip'}</h2>
                <span
                  style={{
                    background: active.type === 'bike' ? 'rgba(102,126,234,0.15)' : 'rgba(72,187,120,0.15)',
                    color: active.type === 'bike' ? '#4338ca' : '#047857',
                    padding: '2px 8px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  {active.type === 'bike' ? '🚴 Cycling' : '🥾 Hiking'}
                </span>
              </div>
            </header>

            {/* Map */}
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 12 }}>
              <MapView
                geojson={
                  Array.isArray(active?.coords) && active.coords.length
                    ? { type: 'LineString', coordinates: active.coords }
                    : active?.geojson?.type === 'LineString'
                    ? active.geojson
                    : null
                }
                coords={active?.coords || []}
                color={active?.type === 'bike' ? '#667eea' : '#48bb78'}
                height={420}
              />
            </div>

            {/* Weather */}
            <div style={{ marginBottom: 12 }}>
              <WeatherPanel lat={startLL?.lat} lon={startLL?.lon} />
            </div>

            {/* Description */}
            {active.description && (
              <p style={{ margin: '8px 0 16px', color: '#4b5563' }}>{active.description}</p>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: 12 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{(active.dayDistances?.length || 0)}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Days</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{totalKm.toFixed(1)} km</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Total distance</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Estimated time</div>
              </div>
            </div>

            {/* Daily breakdown */}
            {Array.isArray(active.dayDistances) && active.dayDistances.length > 0 && (
              <>
                <h4 style={{ margin: '12px 0 8px' }}>Daily breakdown</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {active.dayDistances.map((km, i) => {
                    const minutes = Math.round((Number(km || 0) / speedKmh(active.type)) * 60);
                    return (
                      <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Day {i + 1}</div>
                        <div style={{ fontSize: 14, color: '#374151' }}>{Number(km || 0).toFixed(1)} km</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          {Math.floor(minutes / 60)}h {minutes % 60}m
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ color: '#9ca3af' }}>Select a trip from the list…</div>
        )}
      </main>
    </div>
  );
}
