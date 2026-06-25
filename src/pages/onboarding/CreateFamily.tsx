import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types'
import { TopBar } from '@/components/layout/AppLayout'
import { Button, Field, Input, Segmented } from '@/components/ui'

export function CreateFamily() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('parent')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.rpc('create_family', {
      p_name: name.trim(),
      p_role: role,
    })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }
    await refreshProfile()
    navigate(role === 'parent' ? '/parent' : '/child')
  }

  return (
    <div className="ff-app">
      <TopBar onBack={() => navigate(-1)} />
      <main className="ff-main ff-main--notab">
        <span className="tile tile--lg tile-mint">
          <Users size={24} />
        </span>
        <h1 className="h1" style={{ marginTop: 16 }}>Name your family</h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 7, lineHeight: 1.5 }}>
          This is what your kids will see when they join.
        </p>

        <form onSubmit={handleSubmit} className="flex col" style={{ gap: 16, marginTop: 22 }}>
          <Field label="Family name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Rivera Family"
              required
              autoFocus
            />
          </Field>
          <Field label="Your role">
            <Segmented
              value={role}
              onChange={setRole}
              options={[
                { value: 'parent', label: 'Parent' },
                { value: 'child', label: 'Child' },
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
        <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
          {loading ? 'Creating…' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
