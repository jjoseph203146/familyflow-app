import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { ChildTabBar } from '@/components/layout/TabBar'
import { formatDueDate } from '@/lib/utils'
import { Chore } from '@/types'

export function ChildDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { family, chores, loading } = useFamily()

  const myChores = chores.filter(c =>
    (c.assigned_to === profile?.id || c.assigned_to === null) &&
    c.status !== 'approved'
  )

  const done = chores.filter(c =>
    (c.assigned_to === profile?.id || c.assigned_to === null) &&
    c.status === 'approved'
  ).length

  const total = chores.filter(c =>
    c.assigned_to === profile?.id || c.assigned_to === null
  ).length

  const progress = total > 0 ? (done / total) * 100 : 0
  const now = new Date()

  if (loading) {
    return (
      <AppLayout tabBar={<ChildTabBar />}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout tabBar={<ChildTabBar />}>
      <div className="screen">
        {/* Header with points badge */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p className="text-sm text-muted">Hey {profile?.full_name?.split(' ')[0]},</p>
            <h1 style={{ fontSize: 22 }}>Today's chores ✨</h1>
            {family && <p className="text-sm text-muted">{family.name}</p>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div className="points-badge">
              <span>⭐</span>
              <span>{profile?.points_total ?? 0}</span>
            </div>
            {profile && profile.streak_current > 0 && (
              <div className="streak-badge">
                🔥 {profile.streak_current} day{profile.streak_current !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        {total > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="text-sm text-muted">{done}/{total} complete</span>
              <span className="text-sm" style={{ fontWeight: 600, color: '#5C5CE0' }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Chore list */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 100 }}>
          {myChores.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-icon">🎉</div>
                <h3>All done!</h3>
                <p className="text-sm text-muted">No chores right now. Enjoy your time!</p>
                {total > 0 && (
                  <p className="text-sm text-muted" style={{ marginTop: 4 }}>You've completed {done} chore{done !== 1 ? 's' : ''} total.</p>
                )}
              </div>
            </div>
          ) : (
            myChores.map(chore => <ChoreCard key={chore.id} chore={chore} now={now} />)
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function ChoreCard({ chore, now }: { chore: Chore; now: Date }) {
  const navigate = useNavigate()
  const isOverdue = chore.due_date && new Date(chore.due_date) < now && chore.status !== 'submitted'
  const isRejected = chore.status === 'rejected'

  return (
    <button
      className="card"
      style={{
        border: 'none', cursor: 'pointer', textAlign: 'left',
        borderLeft: isRejected ? '3px solid #EF4444' : isOverdue ? '3px solid #F97316' : undefined,
      }}
      onClick={() => navigate(isRejected ? `/child/resubmit/${chore.id}` : `/child/submit/${chore.id}`)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: isRejected ? '#FEE2E2' : isOverdue ? '#FFEDD5' : '#EEF0FD',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {isRejected ? '↩️' : isOverdue ? '⏰' : '📋'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{chore.title}</div>
          {chore.due_date && (
            <div className="text-sm" style={{ color: isOverdue ? '#F97316' : '#6B7280', marginTop: 2 }}>
              {formatDueDate(chore.due_date)}
            </div>
          )}
          {isRejected && chore.rejection_comment && (
            <div style={{ marginTop: 6, padding: '6px 10px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#B91C1C' }}>
              💬 "{chore.rejection_comment}"
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span className="pill pill-amber">⭐ {chore.points_value}</span>
          <span style={{ fontSize: 11, color: isRejected ? '#EF4444' : '#9CA3AF', fontWeight: 600 }}>
            {isRejected ? 'Redo required' : chore.status === 'submitted' ? 'Under review' : chore.requires_photo ? '📸 required' : 'Tap to submit'}
          </span>
        </div>
      </div>
    </button>
  )
}
