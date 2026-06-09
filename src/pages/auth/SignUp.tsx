import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { TopBar } from '@/components/layout/AppLayout'

export function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      setError('Please fill in all fields. Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password, fullName)
    setLoading(false)
    if (error) { setError(error); return }
    navigate('/onboarding')
  }

  return (
    <div className="app-shell">
      <TopBar onBack={() => navigate('/')} />
      <div className="screen screen-padded">
        <div style={{ padding: '8px 0 32px' }}>
          <h1>Create account</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>Join FamilyFlow and set up your family.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Your name</label>
            <input
              className="input-field"
              placeholder="e.g. Sarah Johnson"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="notif-banner warning">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6B7280' }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/signin')} style={{ color: '#5C5CE0', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
