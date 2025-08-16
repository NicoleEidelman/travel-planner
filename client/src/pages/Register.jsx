import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Register({ onRegister }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const nav = useNavigate()

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    let strength = 0
    if (pass.length >= 8) strength++
    if (/[a-z]/.test(pass)) strength++
    if (/[A-Z]/.test(pass)) strength++
    if (/[0-9]/.test(pass)) strength++
    if (/[^A-Za-z0-9]/.test(pass)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)
  const strengthColors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#059669']
  const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']

  async function submit(e){
    e.preventDefault()
    setErr('')
    setLoading(true)
    
    try{
      const { data } = await api.post('/auth/register', { name, email, password })
      onRegister?.(data.user)
      nav('/')
    }catch(e){
      setErr(e.response?.data?.message || 'Registration failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: '#2d3748',
          marginBottom: '8px'
        }}>
          Join Travel Planner
        </h2>
        <p style={{ 
          color: '#718096', 
          fontSize: '0.95rem',
          margin: 0
        }}>
          Create an account to start planning amazing adventures
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {err && (
          <div style={{
            background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
            border: '1px solid #fc8181',
            color: '#c53030',
            padding: '16px 20px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            {err}
          </div>
        )}
        
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
            fontSize: '0.9rem'
          }}>
            Full Name
          </label>
          <input 
            type="text"
            placeholder="Enter your full name" 
            value={name} 
            onChange={e=>setName(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '400',
              background: 'white',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea'
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0'
              e.target.style.boxShadow = 'none'
            }}
            required
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
            fontSize: '0.9rem'
          }}>
            Email Address
          </label>
          <input 
            type="email"
            placeholder="Enter your email address" 
            value={email} 
            onChange={e=>setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '400',
              background: 'white',
              transition: 'all 0.2s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea'
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0'
              e.target.style.boxShadow = 'none'
            }}
            required
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#374151',
            fontSize: '0.9rem'
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 50px 14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '400',
                background: 'white',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '8px',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(156, 163, 175, 0.1)'
                e.target.style.color = '#667eea'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'none'
                e.target.style.color = '#9ca3af'
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      background: passwordStrength >= level ? strengthColors[passwordStrength - 1] : '#e5e7eb',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
              <p style={{ 
                fontSize: '0.8rem', 
                color: strengthColors[passwordStrength - 1] || '#9ca3af', 
                fontWeight: '500',
                margin: 0
              }}>
                Password strength: {strengthTexts[passwordStrength - 1] || 'Too short'}
              </p>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          style={{
            width: '100%',
            padding: '16px',
            background: loading 
              ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
              : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: loading 
              ? 'none' 
              : '0 4px 15px rgba(72, 187, 120, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 20px rgba(72, 187, 120, 0.4)'
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(72, 187, 120, 0.3)'
            }
          }}
        >
          {loading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      
      <p style={{ 
        textAlign: 'center', 
        marginTop: '24px',
        fontSize: '0.9rem',
        color: '#718096'
      }}>
        Already have an account?{' '}
        <span 
          onClick={() => window.location.href = '/?mode=login'}
          style={{ 
            color: '#667eea',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
          onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.target.style.textDecoration = 'none'}
        >
          Sign in here
        </span>
      </p>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}