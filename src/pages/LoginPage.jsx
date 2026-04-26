// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { sb, isConfigured } from '../lib/supabase'
import { useBootstrap } from '../hooks/useBootstrap'
import { Spinner, Icon } from '../components/UI'

export default function LoginPage() {
  const { dispatch } = useApp()
  const boot = useBootstrap()
  const [email, setEmail]       = useState('ankurgupta@ivp.in')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    setError('')
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)

    if (!isConfigured()) {
      if (password === 'demo') {
        dispatch({ type: 'SET_USER', payload: {
          user: { id: 'demo-user', email, display_name: email.split('@')[0],
            initials: email.slice(0, 2).toUpperCase(), avatar_color: '#404789', role: 'admin' },
          token: 'demo',
        }})
        await boot()
      } else {
        setError('Demo mode: use any email with password "demo"')
      }
      setLoading(false)
      return
    }

    try {
      const result = await sb.rpc('app_login', { p_email: email.trim().toLowerCase(), p_password: password })
      if (result.error) { setError(result.error); setLoading(false); return }
      localStorage.setItem('ivp_session', result.token)
      dispatch({ type: 'SET_DB_CONNECTED', payload: true })
      dispatch({ type: 'SET_USER', payload: {
        user: { id: result.id, email: result.email, display_name: result.display_name,
          initials: result.initials, avatar_color: result.avatar_color, role: result.role },
        token: result.token,
      }})
      await boot()
    } catch (e) {
      setError('Login failed: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--ivp-nav-bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: '40px 40px 32px', width: 380,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ width: 48, height: 48, background: 'var(--ivp-primary)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          fontSize: 16, fontWeight: 700, margin: '0 auto 20px' }}>IVP</div>
        <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 600, color: 'var(--ivp-heading)', marginBottom: 4 }}>Task Manager</div>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#999', marginBottom: 24 }}>Sign in to your account</div>

        {error && (
          <div style={{ background: '#fdecea', border: '1px solid #f5c6c6', color: '#b71c1c',
            borderRadius: 4, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        {!isConfigured() && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe082', color: '#6d4c00',
            borderRadius: 4, padding: '8px 12px', fontSize: 12, marginBottom: 12, textAlign: 'center' }}>
            ⚠ Demo mode — use any email + password "demo"
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 5 }}>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="you@company.com"
            style={{ width: '100%', border: '1px solid var(--ivp-border-input)', borderRadius: 4,
              padding: '9px 12px', fontSize: 14, fontFamily: 'var(--ivp-font)', outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 5 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            style={{ width: '100%', border: '1px solid var(--ivp-border-input)', borderRadius: 4,
              padding: '9px 12px', fontSize: 14, fontFamily: 'var(--ivp-font)', outline: 'none' }} />
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: 'var(--ivp-primary)', color: '#fff', border: 'none',
            borderRadius: 4, padding: 10, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.8 : 1 }}>
          {loading ? <Spinner size={16} /> : <Icon name="login" size={16} />}
          Sign In
        </button>
      </div>
    </div>
  )
}
