import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFamily } from '@/contexts/FamilyContext'
import { Avatar } from '@/components/ui/Avatar'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { formatDueDate } from '@/lib/utils'

type Tab = 'active' | 'history' | 'rejected'

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'pill-gray' },
  in_progress:{ label: 'In progress',cls: 'pill-indigo' },
  submitted:  { label: 'Submitted',  cls: 'pill-orange' },
  approved:   { label: 'Done',       cls: 'pill-green' },
  rejected:   { label: 'Rejected',   cls: 'pill-red' },
}

export function MemberDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { members, chores } = useFamily()
  const [tab, setTab] = useState<Tab>('active')

  const member = members.find(m => m.id === id)
  const memberChores = chores.filter(c => c.assigned_to === id || c.assigned_to === null)

  const tabChores = {
    active: memberChores.filter(c => ['pending', 'in_progress', 'submitted'].includes(c.status)),
    history: memberChores.filter(c => c.status === 'approved'),
    rejected: memberChores.filter(c => c.status === 'rejected'),
  }

  const totalDone = memberChores.filter(c => c.status === 'approved').length
  const totalPoints = memberChores.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.points_value, 0)

  if (!member) {
    return (
      <AppLayout tabBar={<ParentTabBar />}>
        <TopBar onBack={() => navigate(-1)} title="Member" />
        <div className="empty-state"><p>Member not found.</p></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <div className="screen">
        {/* Hero */}
        <div className="hero-gradient" style={{ paddingTop: 48 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '6px 12px', color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: 14 }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={member.full_name} userId={member.id} size="xl" imageUrl={member.avatar_url} />
            <div>
              <h2 style={{ color: '#fff' }}>{member.full_name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' }}>{member.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>⭐ {member.points_total}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Total points</div>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{totalDone}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Chores done</div>
            </div>
            {member.streak_current > 0 && (
              <div>
                <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>🔥 {member.streak_current}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Day streak</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 16px 0' }}>
          <div className="segment">
            {(['active', 'history', 'rejected'] as Tab[]).map(t => (
              <button
                key={t}
                className={`seg-btn ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} ({tabChores[t].length})
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tabChores[tab].length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <p className="text-muted">No chores here.</p>
            </div>
          ) : (
            tabChores[tab].map(chore => {
              const pill = STATUS_PILL[chore.status] ?? STATUS_PILL.pending
              return (
                <div key={chore.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chore-title">{chore.title}</div>
                    {chore.due_date && <div className="chore-meta">{formatDueDate(chore.due_date)}</div>}
                    {chore.status === 'rejected' && chore.rejection_comment && (
                      <div style={{ marginTop: 4, padding: '6px 10px', background: '#FEE2E2', borderRadius: 8, fontSize: 13, color: '#B91C1C' }}>
                        "{chore.rejection_comment}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`pill ${pill.cls}`}>{pill.label}</span>
                    <span className="text-xs text-muted">⭐ {chore.points_value}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </AppLayout>
  )
}
