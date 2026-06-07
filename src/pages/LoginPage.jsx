import { useState } from 'react'
import Spinner from '../components/Spinner'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]         = useState('user')   // 'user' | 'admin'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // ── Google Sign-In ───────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/')
    } catch (e) {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Admin login ──────────────────────────────────────
  const handleAdminLogin = (e) => {
    e.preventDefault()
    setError('')
    const result = adminLogin(username, password)
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>

      {/* Logo + title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img
          src={`${import.meta.env.BASE_URL}logo.jpg`}
          alt="Chennai Sepak Takraw League"
          width={90}
          height={90}
          style={{ objectFit: 'contain', marginBottom: 12 }}
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text-1)', lineHeight: 1.2 }}>
          Chennai Sepak<br />Takraw League
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.82rem', marginTop: 6 }}>Season 2025</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-elevated)',
          borderRadius: 10,
          padding: 3,
          marginBottom: 24,
          border: '1px solid var(--border)',
        }}>
          {[
            { id: 'user',  label: 'User Login' },
            { id: 'admin', label: 'Admin Login' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError('') }}
              style={{
                flex: 1,
                padding: '9px 0',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 180ms ease',
                background: tab === t.id ? 'var(--accent)' : 'transparent',
                color:      tab === t.id ? '#fff'         : 'var(--text-2)',
                boxShadow:  tab === t.id ? '0 2px 8px rgba(255,85,0,0.25)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── User tab ── */}
        {tab === 'user' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', textAlign: 'center', marginBottom: 4 }}>
              Sign in with your Gmail to view live scores and league updates.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ width: '100%', height: 48, gap: 10, fontSize: '0.95rem' }}
            >
              <GoogleIcon />
              {loading ? <><Spinner /> Signing in…</> : 'Continue with Google'}
            </button>
          </div>
        )}

        {/* ── Admin tab ── */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', textAlign: 'center', marginBottom: 4 }}>
              Admin access for scorers and organizers only.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.5px' }}>
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                autoCapitalize="none"
                autoComplete="username"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.5px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 4,
                    color: 'var(--text-3)',
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              className="btn btn-primary"
              type="submit"
              style={{ width: '100%', height: 48, fontSize: '0.95rem', marginTop: 4 }}
            >
              Login as Admin
            </button>
          </form>
        )}

      </div>

      <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', marginTop: 20, textAlign: 'center' }}>
        Chennai Sepak Takraw League © 2025
      </p>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  height: 48,
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 14px',
  fontSize: '0.95rem',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  outline: 'none',
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
