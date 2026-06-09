import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFamily } from '@/contexts/FamilyContext'
import { Avatar } from '@/components/ui/Avatar'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { formatDueDate } from '@/lib/utils'
import { Chore } from '@/types'

type Filter = 'all' | 'active' | 'submitted' | 'overdue' | 'done'

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'pill-gray' },
  in_progress:{ label: 'In progress',cls: 'pill-indigo' },
  submitted:  { label: 'Submitted',  cls: 'pill-orange' },
  approved:   { label: 'Done',       cls: 'pill-green' },
  rejected:   { label: 'Rejected',   cls: 'pill-red' },
}

export function AllChores() {
  const navigate = useNavigate()
  const { chores, members } = useFamily()
  const [filter, setFilter] = useState<Filter>('all')

  const now = new Date()
  const filtered = chores.filter(c => {
    if (filter === 'active') return ['pending', 'in_progress', 'rejected'].includes(c.status)
    if (filter === 'submitted') return c.status === 'submitted'
    if (filter === 'overdue') return ['pending', 'in_progress'].includes(c.status) && c.due_date && new Date(c.due_date) < now
    if (filter === 'done') return c.status === 'approved'
    return true
  })

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'submitted', label: `Submitted (${chores.filter(c => c.status === 'submitted').length})` },
    { key: 'overdue', label: 'Overdue' },
    { key: 'done', label: 'Done' },
  ]

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="All chores" />

      <div style={{ padding: '4px 16px 8px' }}>
        <div className="scroll-x">
          {filters.map(f => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="screen">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="text-muted">No chores match this filter.</p>
          </div>
        ) : (
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(chore => {
              const assignee = chore.assigned_to ? members.find(m => m.id === chore.assigned_to) : null
              const pill = STATUS_PILL[chore.status] ?? STATUS_PILL.pending
              const isOverdue = chore.due_date && new Date(chore.due_date) < now && chore.status !== 'approved'

              return (
                <button
                  key={chore.id}
                  className="card"
                  style={{ border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center' }}
                  onClick={() => navigate(`/parent/chore/${chore.id}`)}
                >
                  {assignee ? (
                    <Avatar name={assignee.full_name} userId={assignee.id} size="sm" imageUrl={assignee.avatar_url} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👥</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chore-title">{chore.title}</div>
                    <div className="chore-meta">
                      {assignee ? assignee.full_name.split(' ')[0] : 'Everyone'}
                      {chore.due_date && (
                        <span style={{ marginLeft: 6, color: isOverdue ? '#EF4444' : undefined }}>
                          · {formatDueDate(chore.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`pill ${pill.cls}`}>{pill.label}</span>
                    <span className="text-xs text-muted">⭐ {chore.points_value}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
