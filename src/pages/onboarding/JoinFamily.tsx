import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/AppLayout'

export function JoinFamily() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const [code, setCode] = useState('')
  const [role, setRole] = useState<'parent' | 'child'>('child')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const normalized = code.trim().toUpperCase()
    if (!normalized) { setError('Please enter an invite code.'); return }

    setLoading(true)
    setError('')

    const { error: rpcError } = await supabase.rpc('join_family', {
      p_invite_code: normalized,
      p_role: role,
    })

    if (rpcError) {
      setError(rpcError.message.includes('Invalid invite code')
        ? "That code doesn't match any family. Double-check it and try again."
        : rpcError.message)
      setLoading(false)
      return
    }

    await refreshProfile()
    navigate(role === 'parent' ? '/parent' : '/child')
  }

  function handleCodeChange(val: string) {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    setCode(cleaned)
    setError('')
  }

  return (
    <div className="app-shell">
      <TopBar onBack={() => navigate('/onboarding')} />
      <div className="screen screen-padded">
        <div style={{ padding: '8px 0 24px' }}>
          <h1>Join a family</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>Enter the invite code from your family manager.</p>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">Invite code</label>
            <input
              className={`input-field ${error ? 'error' : ''}`}
              placeholder="FAM-XXXX"
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center' }}
              maxLength={8}
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
          </div>

          {error && (
            <div className="notif-banner warning">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Joining…' : 'Join family'}
          </button>
        </form>
      </div>
    </div>
  )
}
