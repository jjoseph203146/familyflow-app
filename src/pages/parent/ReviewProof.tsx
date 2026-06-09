import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { formatDueDate, timeAgo } from '@/lib/utils'
import { Chore } from '@/types'

const REJECT_CHIPS = [
  'Not complete',
  'Photo unclear',
  'Please redo',
  'Other…',
]

export function ReviewProof() {
  const navigate = useNavigate()
  const { chores, members, refresh } = useFamily()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)

  const pendingChores = chores.filter(c => c.status === 'submitted')

  if (pendingChores.length === 0) {
    return (
      <AppLayout tabBar={<ParentTabBar />}>
        <TopBar title="Review submissions" onBack={() => navigate(-1)} />
        <div className="screen">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>All caught up!</h3>
            <p className="text-sm text-muted">No submissions waiting for review.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const chore = pendingChores[Math.min(currentIdx, pendingChores.length - 1)]
  const assignee = members.find(m => m.id === chore.assigned_to)

  async function handleApprove() {
    setLoading(true)
    await supabase.rpc('approve_chore', { p_chore_id: chore.id })
    await refresh()
    setSuccessId(chore.id)
    setLoading(false)
    setRejecting(false)
    setRejectReason('')
    setTimeout(() => {
      setSuccessId(null)
      if (currentIdx >= pendingChores.length - 1) setCurrentIdx(0)
    }, 1500)
  }

  async function handleReject() {
    if (!rejectReason.trim()) { return }
    setLoading(true)
    await supabase.rpc('reject_chore', { p_chore_id: chore.id, p_reason: rejectReason.trim() })
    await refresh()
    setLoading(false)
    setRejecting(false)
    setRejectReason('')
    if (currentIdx >= pendingChores.length - 1 && currentIdx > 0) setCurrentIdx(currentIdx - 1)
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar
        title={`Review (${currentIdx + 1}/${pendingChores.length})`}
        onBack={() => navigate(-1)}
      />

      <div className="screen">
        {/* Success flash */}
        {successId && (
          <div className="notif-banner success" style={{ margin: '0 16px 12px' }}>
            <span>✅</span>
            <span>Approved! ⭐ {chore.points_value} pts awarded.</span>
          </div>
        )}

        {/* Assignee info */}
        <div style={{ padding: '8px 16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {assignee && <Avatar name={assignee.full_name} userId={assignee.id} size="md" imageUrl={assignee.avatar_url} />}
          <div>
            <h3>{chore.title}</h3>
            <p className="text-sm text-muted">
              {assignee?.full_name} · {chore.submitted_at ? timeAgo(chore.submitted_at) : 'Just now'}
            </p>
          </div>
          <span className="pill pill-amber" style={{ marginLeft: 'auto' }}>⭐ {chore.points_value}</span>
        </div>

        {/* Photo */}
        {chore.photo_url ? (
          <div style={{ padding: '0 16px 16px' }}>
            <img
              src={chore.photo_url}
              alt="Proof"
              style={{ width: '100%', borderRadius: 16, aspectRatio: '4/3', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ background: '#F3F4F6', borderRadius: 16, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 40 }}>📷</span>
              <p className="text-sm text-muted">No photo required</p>
            </div>
          </div>
        )}

        {/* Rejection section */}
        {rejecting ? (
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="input-label" style={{ marginBottom: 10 }}>Reason for rejection</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {REJECT_CHIPS.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    className={`chip ${rejectReason === chip || (chip === 'Other…' && !REJECT_CHIPS.slice(0, -1).includes(rejectReason) && rejectReason) ? 'active' : ''}`}
                    onClick={() => {
                      if (chip === 'Other…') setRejectReason('')
                      else setRejectReason(chip)
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <textarea
                className="input-field"
                placeholder="Write your feedback here…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <p className="text-sm text-muted" style={{ marginTop: 6 }}>
                This feedback will be shown to {assignee?.full_name?.split(' ')[0]} when they resubmit.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-full" onClick={() => { setRejecting(false); setRejectReason('') }}>
                Cancel
              </button>
              <button
                className="btn btn-danger btn-full"
                disabled={!rejectReason.trim() || loading}
                onClick={handleReject}
              >
                {loading ? 'Sending…' : 'Send back'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '0 16px 16px', display: 'flex', gap: 12 }}>
            <button className="btn btn-outline btn-full" onClick={() => setRejecting(true)} disabled={loading}>
              Needs redo
            </button>
            <button className="btn btn-success btn-full" onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving…' : '✓ Approve'}
            </button>
          </div>
        )}

        {/* Navigation */}
        {pendingChores.length > 1 && !rejecting && (
          <div style={{ padding: '8px 16px 24px', display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-sm" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>← Prev</button>
            <button className="btn btn-ghost btn-sm" disabled={currentIdx === pendingChores.length - 1} onClick={() => setCurrentIdx(i => i + 1)}>Next →</button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

