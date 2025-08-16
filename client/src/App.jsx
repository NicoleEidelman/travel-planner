import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import api from './services/api'
import ModernAuthPage from './pages/ModernAuthPage'
import Planner from './pages/Planner'
import History from './pages/History'
import './styles/designSystem.css'

/**
 * App React component
 * Handles authentication state, routing, and layout for the Travel Planner app.
 * - Checks login status on mount and shows a loading spinner while authenticating.
 * - If not logged in, shows the ModernAuthPage for login/register.
 * - If logged in, shows the main app UI with navigation and routes.
 *
 * Design decision: Uses a loading state to prevent UI flicker and ensure a smooth user experience.
 */
export default function App(){
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  // On mount, check if the user is authenticated
  useEffect(() => {
    api.get('/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  /**
   * Logs the user out by calling the API and clearing user state.
   * Navigates to the login page after logout.
   */
  async function logout(){
    await api.post('/auth/logout')
    setUser(null)
    nav('/?mode=login')
  }

  // Show a loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#2d3748',
            margin: 0
          }}>Loading Travel Planner</h2>
          <p style={{
            color: '#718096',
            marginTop: '8px',
            fontSize: '0.9rem'
          }}>Preparing your adventure dashboard...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  // If not logged in, show modern auth page
  if (!user) {
    return <ModernAuthPage setUser={setUser} />
  }

  // Main app UI with navigation and routes
  return (
    <div className="container">
      <header className="topbar">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🗺️
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Travel Planner
            </h1>
          </div>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#4a5568'
          }}>
            Welcome, {user.name}!
          </div>
          <Link 
            to="/history" 
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '12px',
              textDecoration: 'none',
              color: '#4a5568',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 1)'
              e.target.style.transform = 'translateY(-1px)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.8)'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            My Trips
          </Link>
          <button 
            onClick={logout} 
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(245, 101, 101, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 20px rgba(245, 101, 101, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(245, 101, 101, 0.3)'
            }}
          >
            Logout
          </button>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Planner user={user} />} />
          <Route path="/history" element={<History user={user} />} />
        </Routes>
      </main>
    </div>
  )
}