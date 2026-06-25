import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { TopBar } from '@/components/layout/AppLayout'
import { Button, Field, Input } from '@/components/ui'

export function SignIn() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <div className="ff-app">
      <TopBar onBack={() => navigate('/')} />
      <main className="ff-main ff-main--notab">
        <h1 className="h1">Welcome back</h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 7 }}>Sign in to your family.</p>

        <form onSubmit={handleSubmit} className="flex col" style={{ gap: 14, marginTop: 22 }}>
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
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
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

          <Button type="submit" disabled={loading || !email || !password}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div style={{ flex: 1 }} />
        <p className="center" style={{ fontSize: 13, paddingBottom: 20, color: 'var(--muted)', fontWeight: 600 }}>
          New here?{' '}
          <button
            onClick={() => navigate('/signup')}
            style={{ color: 'var(--primary-ink)', fontWeight: 800 }}
          >
            Create an account
          </button>
        </p>
      </main>
    </div>
  )
}
