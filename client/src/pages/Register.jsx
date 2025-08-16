import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Register({ onRegister }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

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
    <form onSubmit={submit} className="card auth-form">
      <h2>Join Travel Planner</h2>
      <p>Create an account to start planning amazing adventures</p>
      
      {err && <div className="error">{err}</div>}
      
      <input 
        type="text"
        placeholder="Full name" 
        value={name} 
        onChange={e=>setName(e.target.value)}
        required
      />
      <input 
        type="email"
        placeholder="Email address" 
        value={email} 
        onChange={e=>setEmail(e.target.value)}
        required
      />
      <input 
        type="password"
        placeholder="Password (min 6 characters)" 
        value={password} 
        onChange={e=>setPassword(e.target.value)}
        required
        minLength={6}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
      
      <p>
        Already have an account? <Link to="/login">Sign in here</Link>
      </p>
    </form>
  )
}