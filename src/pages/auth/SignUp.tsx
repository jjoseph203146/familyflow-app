import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TopBar } from '@/components/layout/AppLayout'
import { Button, Field, Input } from '@/components/ui'
import { PENDING_JOIN_KEY } from '@/lib/format'

export function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await signUp(email.trim(), password, fullName.trim())
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    const pendingCode = localStorage.getItem(PENDING_JOIN_KEY)
    if (pendingCode) {
      navigate(`/join/${pendingCode}`)
    } else {
      navigate('/onboarding')
    }
  }

  const passwordTooShort = password.length > 0 && password.length < 8

  return (
    <div className="ff-app">
      <TopBar onBack={() => navigate('/')} />
      <main className="ff-main ff-main--notab">
        <h1 className="h1">Create your account</h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 7 }}>
          Set up FamilyFlow in under a minute.
        </p>

        <form onSubmit={handleSubmit} className="flex col" style={{ gap: 14, marginTop: 22 }}>
          <Field label="Full name">
            <Input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sarah Rivera"
              required
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </Field>
          <Field label="Password" hint="8+ characters">
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              style={passwordTooShort ? { borderColor: 'var(--danger-border)' } : undefined}
            />
          </Field>

          {error && (
            <div
              className="flex items-center"
              style={{ gap: 8, background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '11px 13px', fontSize: 12.5, fontWeight: 700 }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading || !fullName || !email || password.length < 8}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <div style={{ flex: 1 }} />
        <p className="center" style={{ fontSize: 13, paddingBottom: 20, color: 'var(--muted)', fontWeight: 600 }}>
          Already have an account?{' '}
          <button onClick={() => navigate('/signin')} style={{ color: 'var(--primary-ink)', fontWeight: 800 }}>
            Sign in
          </button>
        </p>
      </main>
    </div>
  )
}
