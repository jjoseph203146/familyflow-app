import { Bell } from 'lucide-react'
import { useFamily } from '@/contexts/FamilyContext'
import type { Notification } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ChildTabBar } from '@/components/layout/TabBar'
import { EmptyState } from '@/components/ui'
import { notificationVisual } from '@/components/notificationVisual'
import { relative } from '@/lib/format'

export function ChildActivityFeed() {
  const { notifications, markNotificationRead, clearAllNotifications } = useFamily()
  const hasUnread = notifications.some((n) => !n.read)

  return (
    <AppLayout tabBar={<ChildTabBar />}>
      <TopBar
        title="Activity"
        right={
          hasUnread ? (
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
              title="Nothing yet"
              body="Approvals, streaks, and reward updates will show up here."
            />
          ) : (
            notifications.map((n: Notification) => {
              const { Icon, tone } = notificationVisual(n.type)
              return (
                <button
                  key={n.id}
                  className="card list-row"
                  style={{ width: '100%', textAlign: 'left', opacity: n.read ? 0.72 : 1 }}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                >
                  <span className={`tile tile--sm tile-${tone}`}><Icon size={18} /></span>
                  <div className="flex-1">
                    <div className="title" style={{ fontSize: 12.5 }}>{n.title}</div>
                    <div className="meta" style={{ marginTop: 1 }}>{n.body} · {relative(n.created_at)}</div>
                  </div>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--primary)', flex: 'none' }} />}
                </button>
              )
            })
          )}
        </div>
      </main>
    </AppLayout>
  )
}
