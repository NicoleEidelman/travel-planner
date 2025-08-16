import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from './services/api'
import Login from './pages/Login'
import Register from './pages/Register'
import Planner from './pages/Planner'
import History from './pages/History'
import './styles/designSystem.css'
export default function App(){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function logout(){
    await api.post('/auth/logout')
    setUser(null)
    nav('/login')
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="topbar">
        <Link to="/">
          <h1>🗺️ Travel Planner</h1>
        </Link>
        <nav>
          {user ? (
            <>
              <span>Welcome, {user.name}!</span>
              <Link to="/history">My Trips</Link>
              <button onClick={logout} className="btn-danger">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Planner user={user} />} />
          <Route path="/history" element={<History user={user} />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          <Route path="/register" element={<Register onRegister={setUser} />} />
        </Routes>
      </main>
    </div>
  )
}