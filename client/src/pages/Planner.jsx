import { useState } from 'react'
import api from '../services/api'
import MapView from '../components/MapView'

export default function Planner({ user }){
  const [city,setCity]=useState('Tel Aviv')
  const [type,setType]=useState('trek') // 'trek' (loop) or 'bike' (city-to-city)
  const [plan,setPlan]=useState(null)
  const [err,setErr]=useState('')
  const [planning,setPlanning]=useState(false)
  const [saving,setSaving]=useState(false)

  async function planRoute(){
    setErr(''); setPlan(null); setPlanning(true)
    try{
      // 1) get the route/cover/weather & fallback narrative
      const { data } = await api.post('/trips/plan', { city, type })
      setPlan(data)

      // 2) ask Groq (Llama) for a nicer narrative and merge
      try{
        const r = await api.post('/trips/ai/narrative', {
          city: data.label || data.city || city,
          type,
          dayDistances: data.dayDistances
        })
        setPlan(prev => prev ? { ...prev, narrative: r.data.narrative } : prev)
      }catch(e){
        console.warn('LLM narrative failed, keeping fallback.', e)
      }
    }catch(e){
      const msg = e.response?.data?.message || e.message || 'Plan failed'
      console.error('[client] /trips/plan error:', e.response?.data || e)
      setErr(msg)
    }finally{
      setPlanning(false)
    }
  }

  async function save(){
    if(!plan) return
    setSaving(true)
    try{
      const payload = {
        name: `${city} ${type}`,
        description: plan.narrative || '',
        type,
        coords: plan.coords,
        dayDistances: plan.dayDistances,
        narrative: plan.narrative,
        start: plan.start,
        end: plan.end,
        // Include the new place information fields
        cover: plan.cover || '',
        placeDescription: plan.placeDescription || ''
      }
      await api.post('/trips/save', payload)
      alert('Saved! Go to History to view it.')
    } finally { setSaving(false) }
  }

  if(!user) {
    return (
      <div className="card auth-form">
        <h2>Welcome to Travel Planner</h2>
        <p>Please login to start planning your adventures!</p>
      </div>
    )
  }

  const totalDistance = plan?.dayDistances?.reduce((a,b) => a+b, 0) || 0;

  return (
    <div className="card">
      <h2>Plan Your Adventure</h2>

      {err && <div className="error">{err}</div>}

      <div className="planning-form">
        <input
          value={city}
          onChange={(e)=>setCity(e.target.value)}
          placeholder="Enter city or destination"
        />
        <select value={type} onChange={(e)=>setType(e.target.value)}>
          <option value="trek">Hiking Trek (5–15 km loop)</option>
          <option value="bike">Bike Tour (2 days, up to 60 km/day)</option>
        </select>
        <button onClick={planRoute} disabled={planning}>
          {planning ? 'Planning...' : 'Plan Route'}
        </button>
        {plan && (
          <button 
            disabled={saving} 
            onClick={save}
            className="btn-secondary"
          >
            {saving ? 'Saving...' : 'Save Trip'}
          </button>
        )}
      </div>

      {plan && (
        <>
          {/* Cover image with resilient fallback */}
          {(plan.cover || plan.imageUrl) && (
            <img
              src={plan.cover || plan.imageUrl}
              alt={`Cover for ${plan.label || plan.city || city}`}
              className="plan-image"
              loading="lazy"
              onError={(e)=>{
                e.currentTarget.src =
                  `https://source.unsplash.com/featured/1200x630/?${encodeURIComponent(
                    plan.label || plan.city || city || 'travel'
                  )}&sig=${Date.now()%10000}`
              }}
            />
          )}

          {/* Show ONLY the AI-generated narrative OR place description, prefer the AI one */}
          {plan.narrative ? (
            <div className="place-description">
              {plan.narrative}
            </div>
          ) : plan.placeDescription && (
            <div className="place-description">
              {plan.placeDescription}
            </div>
          )}

          {/* Trip Statistics */}
          <div className="trip-stats">
            <div className="stat-item">
              <span className="stat-value">{plan.dayDistances.length}</span>
              <span className="stat-label">Days</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{totalDistance.toFixed(1)}</span>
              <span className="stat-label">Total km</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{type === 'bike' ? 'Cycling' : 'Hiking'}</span>
              <span className="stat-label">Activity</span>
            </div>
          </div>

          {/* Daily Distances */}
          <h4>Daily Distances</h4>
          <ul className="distances-list">
            {plan.dayDistances.map((d, i) => (
              <li key={i}>Day {i+1}: {Number(d).toFixed(1)} km</li>
            ))}
          </ul>

          {/* Map */}
          <div className="map-container">
            <MapView
              coords={plan.coords}
              segments={plan.segments}
              dayDistances={plan.dayDistances}
            />
          </div>

          {/* Weather */}
          <h4>Weather Forecast (Next 3 Days)</h4>
          <ul className="weather-list">
            {(plan.weather?.time || []).map((date, i) => {
              const tmin = plan.weather?.temperature_2m_min?.[i]
              const tmax = plan.weather?.temperature_2m_max?.[i]
              const precip = plan.weather?.precipitation_sum?.[i]
              return (
                <li key={date || i}>
                  <strong>{date}:</strong> {tmin ?? '?'}–{tmax ?? '?'}°C
                  {precip != null && `, ${precip}mm rain expected`}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}