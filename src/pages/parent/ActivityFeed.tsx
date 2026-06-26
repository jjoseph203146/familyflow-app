import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { useFamily } from '@/contexts/FamilyContext'
import type { Notification } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { EmptyState } from '@/components/ui'
import { notificationVisual } from '@/components/notificationVisual'
import { relative } from '@/lib/format'

export function ParentActivityFeed() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markNotificationRead, clearAllNotifications, deleteNotification } = useFamily()

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar
        title="Activity"
        right={
          unreadCount > 0 ? (
            <button className="section-head__action" style={{ paddingRight: 4 }} onClick={clearAllNotifications}>
              Mark all read
            </button>
          ) : undefined
        }
      />
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 9 }}>
          {notifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={26} />}
              title="No activity yet"
              body="Approvals, submissions, and streaks will show up here."
            />
          ) : (
            notifications.map((n: Notification) => {
              const { Icon, tone } = notificationVisual(n.type)
              return (
                <button
                  key={n.id}
                  className="card list-row"
                  style={{ width: '100%', textAlign: 'left', opacity: n.read ? 0.72 : 1 }}
                  onClick={() => {
                    if (!n.read) markNotificationRead(n.id)
                    if (n.chore_id) navigate(`/parent/chores/${n.chore_id}`)
                  }}
                >
                  <span className={`tile tile--sm tile-${tone}`}><Icon size={18} /></span>
                  <div className="flex-1">
                    <div className="title" style={{ fontSize: 12.5 }}>{n.title}</div>
                    <div className="meta" style={{ marginTop: 1 }}>{n.body} · {relative(n.created_at)}</div>
                  </div>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--primary)', flex: 'none' }} />}
                  <span
                    className="icon-btn"
                    style={{ width: 24, height: 24, opacity: 0.4, flex: 'none' }}
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
                    role="button"
                    aria-label="Dismiss"
                  >
                    <X size={13} />
                  </span>
                </button>
              )
            })
          )}
        </div>
      </main>
    </AppLayout>
  )
}
