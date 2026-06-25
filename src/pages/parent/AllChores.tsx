import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ClipboardList } from 'lucide-react'
import { useFamily } from '@/contexts/FamilyContext'
import type { Chore } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { ChoreRow } from '@/components/ChoreRow'
import { EmptyState } from '@/components/ui'
import { isOverdue } from '@/lib/format'

type Filter = 'all' | 'active' | 'submitted' | 'overdue' | 'done'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done' },
]

function matches(chore: Chore, filter: Filter): boolean {
  switch (filter) {
    case 'active':
      return chore.status === 'pending' || chore.status === 'in_progress'
    case 'submitted':
      return chore.status === 'submitted'
    case 'overdue':
      return isOverdue(chore)
    case 'done':
      return chore.status === 'approved'
    default:
      return true
  }
}

export function AllChores() {
  const navigate = useNavigate()
  const { chores } = useFamily()
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(
    () =>
      chores
        .filter((c) => matches(c, filter))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [chores, filter],
  )

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar
        title="Chores"
        right={
          <button className="icon-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }} onClick={() => navigate('/parent/chores/new')} aria-label="New chore">
            <Plus size={18} strokeWidth={2.4} />
          </button>
        }
      />
      <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'is-on' : ''}`}
            style={{ flex: 'none' }}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 9 }}>
          {visible.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={26} />}
              title="No chores here"
              body={filter === 'all' ? 'Assign your first chore to get started.' : 'Nothing matches this filter right now.'}
            />
          ) : (
            visible.map((c) => (
              <ChoreRow key={c.id} chore={c} onClick={() => navigate(`/parent/chores/${c.id}`)} />
            ))
          )}
        </div>
      </main>
    </AppLayout>
  )
}
