import { useNavigate } from 'react-router-dom'
import { Plus, Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { Avatar } from '@/components/ui/Avatar'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { formatDueDate } from '@/lib/utils'
import { Chore } from '@/types'

export function ParentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { family, members, chores, loading } = useFamily()

  const pendingReview = chores.filter(c => c.status === 'submitted')
  const activeChores = chores.filter(c => ['pending', 'in_progress', 'rejected'].includes(c.status))
  const now = new Date()
  const overdueChores = activeChores.filter(c => c.due_date && new Date(c.due_date) < now)

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)

  function getMemberChores(memberId: string): Chore[] {
    return chores.filter(c => (c.assigned_to === memberId || c.assigned_to === null) && c.status !== 'approved')
  }

  function getMemberDailyChores(memberId: string) {
    const daily = chores.filter(c => {
      if (c.assigned_to !== memberId && c.assigned_to !== null) return false
      if (!c.due_date) return false
      const due = new Date(c.due_date)
      if (due > todayEnd) return false
      if (c.status === 'approved') {
        return c.approved_at != null && new Date(c.approved_at) >= todayStart
      }
      return true
    })
    const done = daily.filter(c => c.status === 'approved').length
    return { total: daily.length, done }
  }

  if (loading) {
    return (
      <AppLayout tabBar={<ParentTabBar />}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <div className="screen">
        {/* Header */}
        <div style={{ padding: '20px 16px 12px' }}>
          <p className="text-sm text-muted">Good {getGreeting()},</p>
          <h1 style={{ fontSize: 22 }}>{profile?.full_name?.split(' ')[0]} 👋</h1>
          {family && <p className="text-sm text-muted" style={{ marginTop: 2 }}>{family.name}</p>}
        </div>

        {/* Pending review banner */}
        {pendingReview.length > 0 && (
          <div style={{ padding: '0 16px 12px' }}>
            <button
              className="notif-banner warning"
              style={{ width: '100%', border: 'none', cursor: 'pointer', justifyContent: 'space-between' }}
              onClick={() => navigate('/parent/review')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} />
                <span>{pendingReview.length} submission{pendingReview.length !== 1 ? 's' : ''} waiting for review</span>
              </div>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Overdue banner */}
        {overdueChores.length > 0 && (
          <div style={{ padding: '0 16px 12px' }}>
            <div className="notif-banner warning">
              <span>⏰</span>
              <span>{overdueChores.length} overdue chore{overdueChores.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 100 }}>
          {/* No members state */}
          {members.length === 0 && (
            <div className="card">
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <div className="empty-icon">👨‍👩‍👧‍👦</div>
                <h3>Invite your family</h3>
                <p className="text-sm text-muted">Share your invite code so family members can join.</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/parent/invite')} style={{ marginTop: 8 }}>
                  Get invite code
                </button>
              </div>
            </div>
          )}

          {/* Member cards */}
          {members.filter(m => m.id !== profile?.id).map(member => {
            const memberChores = getMemberChores(member.id)
            const { done, total } = getMemberDailyChores(member.id)
            const progress = total > 0 ? (done / total) * 100 : 0

            return (
              <button
                key={member.id}
                className="card"
                style={{ border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onClick={() => navigate(`/parent/member/${member.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Avatar name={member.full_name} userId={member.id} size="md" imageUrl={member.avatar_url} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{member.full_name}</div>
                    <div className="text-sm text-muted">{member.role}</div>
                  </div>
                  <div className="points-badge">
                    <span>⭐</span>
                    <span>{member.points_total}</span>
                  </div>
                </div>

                {total > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="text-sm text-muted">{done}/{total} due today</span>
                      {member.streak_current > 0 && (
                        <span className="streak-badge">🔥 {member.streak_current}</span>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted" style={{ marginBottom: 6 }}>No chores due today</p>
                )}

                {/* Pending chores preview */}
                {memberChores.slice(0, 2).map(chore => (
                  <div key={chore.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <StatusDot status={chore.status} />
                    <span className="text-sm" style={{ flex: 1, fontWeight: 500 }}>{chore.title}</span>
                    <span className="text-sm text-muted">{chore.due_date ? formatDueDate(chore.due_date) : ''}</span>
                  </div>
                ))}
                {memberChores.length > 2 && (
                  <p className="text-sm text-muted" style={{ marginTop: 6 }}>+{memberChores.length - 2} more</p>
                )}
                {memberChores.length === 0 && (
                  <p className="text-sm text-muted" style={{ marginTop: 4 }}>No chores assigned yet</p>
                )}
              </button>
            )
          })}

          {/* My own chores (if parent is also assigned chores) */}
          {chores.filter(c => c.assigned_to === profile?.id && c.status !== 'approved').length > 0 && (
            <div className="card">
              <div className="section-header">
                <span className="section-title">My chores</span>
              </div>
              {chores.filter(c => c.assigned_to === profile?.id && c.status !== 'approved').map(chore => (
                <div key={chore.id} className="chore-row">
                  <StatusDot status={chore.status} />
                  <div className="chore-info">
                    <div className="chore-title">{chore.title}</div>
                    {chore.due_date && <div className="chore-meta">{formatDueDate(chore.due_date)}</div>}
                  </div>
                  <span className="pill pill-amber">⭐ {chore.points_value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => navigate('/parent/add-chore')}>
        <Plus size={24} />
      </button>
    </AppLayout>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#9CA3AF',
    in_progress: '#5C5CE0',
    submitted: '#F97316',
    approved: '#22C55E',
    rejected: '#EF4444',
  }
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: colors[status] || '#9CA3AF',
      flexShrink: 0,
    }} />
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
