import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <div className="empty__title">{title}</div>
      {body && <div className="empty__body">{body}</div>}
      {action && <div style={{ marginTop: 8, width: '100%', maxWidth: 240 }}>{action}</div>}
    </div>
  )
}
