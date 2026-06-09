import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/utils'
import { TopBar } from '@/components/layout/AppLayout'

export function CreateFamily() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [familyName, setFamilyName] = useState('')
  const [role, setRole] = useState<'parent' | 'child'>('parent')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!familyName.trim()) { setError('Please enter a family name.'); return }
    if (!user) return

    setLoading(true)
    setError('')

    const inviteCode = generateInviteCode()
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({ name: familyName.trim(), invite_code: inviteCode, created_by: user.id })
      .select()
      .single()

    if (familyError) { setError(familyError.message); setLoading(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ family_id: family.id, role })
      .eq('id', user.id)

    if (profileError) { setError(profileError.message); setLoading(false); return }

    await refreshProfile()
    navigate(role === 'parent' ? '/parent' : '/child')
  }

  return (
    <div className="app-shell">
      <TopBar onBack={() => navigate('/onboarding')} />
      <div className="screen screen-padded">
        <div style={{ padding: '8px 0 24px' }}>
          <h1>Create your family</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>Name your household and pick your role.</p>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">Family name</label>
            <input
              className="input-field"
              placeholder="e.g. The Johnson Family"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
            />
          </div>

          <div>
            <div className="input-label" style={{ marginBottom: 10 }}>Your role</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['parent', 'child'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '14px 16px',
                    borderRadius: 12, border: `2px solid ${role === r ? '#5C5CE0' : '#E5E7EB'}`,
                    background: role === r ? '#EEF0FD' : '#fff',
                    color: role === r ? '#5C5CE0' : '#6B7280',
                    fontWeight: 600, fontSize: 15, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {r === 'parent' ? '👩 Parent' : '🧒 Child'}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted" style={{ marginTop: 8 }}>
              {role === 'parent' ? 'Assign chores, review submissions, manage rewards.' : 'Complete chores, earn points, redeem rewards.'}
            </p>
          </div>

          <div className="card" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
            <p className="text-sm" style={{ color: '#374151' }}>
              <strong>Your invite code</strong> will be generated automatically. Share it with family members after setup.
            </p>
          </div>

          {error && (
            <div className="notif-banner warning">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Creating family…' : 'Create family'}
          </button>
        </form>
      </div>
    </div>
  )
}
