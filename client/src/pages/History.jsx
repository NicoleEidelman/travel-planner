import { useEffect, useState } from 'react'
import api from '../services/api'
import MapView from '../components/MapView'

export default function History({ user }){
  const [list, setList] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { 
    if (user) {
      setLoading(true)
      api.get('/trips')
        .then(r => setList(r.data))
        .finally(() => setLoading(false))
    }
  }, [user])

  async function open(id){
    setLoading(true)
    try {
      const { data } = await api.get(`/trips/${id}`)
      setActive(data)
    } catch (error) {
      console.error('Failed to load trip:', error)
    } finally {
      setLoading(false)
    }
  }

  async function refreshWeather(){
    if (!active) return
    setLoading(true)
    try {
      const { data } = await api.get(`/trips/${active._id || active.id}`)
      setActive(data)
    } catch (error) {
      console.error('Failed to refresh weather:', error)
    } finally {
      setLoading(false)
    }
  }

  if(!user) {
    return (
      <div className="card auth-form">
        <h2>Trip History</h2>
        <p>Please login to view your saved trips.</p>
      </div>
    )
  }

  const total = active?.dayDistances?.reduce((a,b)=>a+b,0)||0

  return (
    <div className="grid">
      <div className="card">
        <h3>My Saved Trips</h3>
        
        {loading && !active ? (
          <div className="loading">Loading trips...</div>
        ) : list.length === 0 ? (
          <p>No trips saved yet. Start planning your first adventure!</p>
        ) : (
          <div className="trip-list">
            {list.map(t => (
              <div key={t.id} className="trip-item">
                <button onClick={() => open(t.id)}>
                  <div>
                    <strong>{t.name}</strong>
                    <br />
                    <small>{new Date(t.createdAt).toLocaleDateString()}</small>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        {active ? (
          <>
            <h3>{active.name}</h3>
            
            {active.cover && (
              <img 
                src={active.cover} 
                alt="Trip cover" 
                className="cover-image"
              />
            )}
            
            {active.placeDescription && (
              <div className="place-description">
                {active.placeDescription}
              </div>
            )}
            
            {active.description && active.description !== active.placeDescription && (
              <p>{active.description}</p>
            )}

            {/* Trip Statistics */}
            <div className="trip-stats">
              <div className="stat-item">
                <span className="stat-value">{active.dayDistances?.length || 0}</span>
                <span className="stat-label">Days</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{total.toFixed(1)}</span>
                <span className="stat-label">Total km</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{active.type === 'bike' ? 'Cycling' : 'Hiking'}</span>
                <span className="stat-label">Activity</span>
              </div>
            </div>

            {/* Daily breakdown */}
            <div style={{margin:'16px 0'}}>
              {active.type==='bike' ? (
                <div className="trip-stats">
                  <div className="stat-item">
                    <span className="stat-value">{active.dayDistances?.[0]?.toFixed(1) || '0'}</span>
                    <span className="stat-label">Day 1 km</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{active.dayDistances?.[1]?.toFixed(1) || '0'}</span>
                    <span className="stat-label">Day 2 km</span>
                  </div>
                </div>
              ) : (
                <div className="stat-item">
                  <span className="stat-value">{active.dayDistances?.[0]?.toFixed(1) || '0'} km</span>
                  <span className="stat-label">Loop distance</span>
                </div>
              )}
            </div>

            <div className="map-container">
              <MapView coords={active.coords} segments={active.segments} />
            </div>
            
            <div style={{marginTop: 16, marginBottom: 16}}>
              <button 
                onClick={refreshWeather}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? 'Refreshing...' : 'Refresh Weather'}
              </button>
            </div>

            <h4>Weather Forecast (Next 3 Days)</h4>
            <ul className="weather-list">
              {active.weather?.time?.map((d,i)=> (
                <li key={d}>
                  <strong>{d}:</strong> {active.weather.temperature_2m_min[i]}–{active.weather.temperature_2m_max[i]}°C,
                  {active.weather.precipitation_probability_max?.[i] && 
                    ` ${active.weather.precipitation_probability_max[i]}% rain chance,`
                  }
                  wind up to {active.weather.windspeed_10m_max[i]} km/h
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="loading">
            Select a trip from the list to view details
          </div>
        )}
      </div>
    </div>
  )
}