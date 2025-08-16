import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function Login({ onLogin }){
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
      const { data } = await api.post('/auth/login', { email, password })
      onLogin?.(data.user)
      nav('/')
    }catch(e){
      setErr(e.response?.data?.message || 'Login failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="card auth-form">
      <h2>Welcome Back</h2>
      <p>Sign in to continue planning your adventures</p>
      
      {err && <div className="error">{err}</div>}
      
      <input 
        type="email"
        placeholder="Email address" 
        value={email} 
        onChange={e=>setEmail(e.target.value)}
        required
      />
      <input 
        type="password"
        placeholder="Password" 
        value={password} 
        onChange={e=>setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      
      <p>
        Don't have an account? <Link to="/register">Create one here</Link>
      </p>
    </form>
  )
}