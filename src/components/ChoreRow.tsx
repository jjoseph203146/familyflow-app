import type { ReactNode } from 'react'
import type { Chore } from '@/types'
import { StatusPill } from './ui'
import { choreVisual } from './choreVisual'
import { isOverdue, formatDue } from '@/lib/format'

export function ChoreRow({
  chore,
  subtitle,
  onClick,
  rightSlot,
  faded,
}: {
  chore: Chore
  subtitle?: string
  onClick?: () => void
  rightSlot?: ReactNode
  faded?: boolean
}) {
  const overdue = isOverdue(chore)
  const { Icon, tone } = choreVisual(chore.title)
  const meta =
    subtitle ??
    [chore.assignee?.full_name, formatDue(chore.due_date)].filter(Boolean).join(' · ')

  return (
    <button
      className="card list-row"
      style={{ width: '100%', textAlign: 'left', opacity: faded ? 0.72 : 1 }}
      onClick={onClick}
    >
      <span className={`tile tile--sm tile-${tone}`}>
        <Icon size={18} />
      </span>
      <div className="flex-1">
        <div className="title" style={{ fontSize: 13.5 }}>{chore.title}</div>
        {meta && <div className="meta" style={{ marginTop: 2 }}>{meta}</div>}
      </div>
      {rightSlot ?? (
        <div className="center" style={{ flex: 'none' }}>
          <StatusPill status={chore.status} overdue={overdue} />
          <div className="points" style={{ marginTop: 4 }}>+{chore.points_value}</div>
        </div>
      )}
    </button>
  )
}
