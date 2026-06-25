import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'
import { TopBar } from '@/components/layout/AppLayout'
import { Button, Field, Segmented } from '@/components/ui'
import { PENDING_JOIN_KEY } from '@/lib/format'

export function JoinFamily() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [params] = useSearchParams()
  const initialCode = (params.get('code') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)

  const [code, setCode] = useState(initialCode)
  const [role, setRole] = useState<UserRole>('child')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.rpc('join_family', {
      p_invite_code: code.toUpperCase(),
      p_role: role,
    })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }
    localStorage.removeItem(PENDING_JOIN_KEY)
    await refreshProfile()
    navigate(role === 'parent' ? '/parent' : '/child')
  }

  return (
    <div className="ff-app">
      <TopBar onBack={() => navigate(-1)} />
      <main className="ff-main ff-main--notab">
        <span className="tile tile--lg tile-sky">
          <UserPlus size={24} />
        </span>
        <h1 className="h1" style={{ marginTop: 16 }}>Enter your invite code</h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 7, lineHeight: 1.5 }}>
          Ask a parent for the 4-character code from their FamilyFlow.
        </p>

        <form onSubmit={handleSubmit} className="flex col" style={{ gap: 16, marginTop: 22 }}>
          <Field label="Invite code">
            <div className="flex items-center" style={{ gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--faint)', letterSpacing: '.06em' }}>FAM-</span>
              <input
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                placeholder="3K9Q"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={4}
                required
                style={{ fontSize: 22, fontWeight: 800, letterSpacing: '.18em', textAlign: 'center' }}
              />
            </div>
          </Field>
          <Field label="Your role">
            <Segmented
              value={role}
              onChange={setRole}
              options={[
                { value: 'child', label: 'Child' },
                { value: 'parent', label: 'Parent' },
              ]}
            />
          </Field>

          {error && (
            <div className="flex items-center" style={{ gap: 8, background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '11px 13px', fontSize: 12.5, fontWeight: 700 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </form>

        <div style={{ flex: 1 }} />
      </main>

      <div className="ff-footer">
        <Button onClick={handleSubmit} disabled={loading || code.length < 4}>
          {loading ? 'Joining…' : 'Join family'}
        </Button>
      </div>
    </div>
  )
}
