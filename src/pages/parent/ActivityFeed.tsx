import { useNavigate } from 'react-router-dom'
import { useFamily } from '@/contexts/FamilyContext'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { timeAgo } from '@/lib/utils'

const TYPE_COLOR: Record<string, string> = {
  chore_submitted: '#F97316',
  redemption_requested: '#7C3AED',
  chore_approved: '#22C55E',
  chore_rejected: '#EF4444',
  chore_assigned: '#5C5CE0',
  streak: '#F59E0B',
  reward_unlocked: '#F59E0B',
  redemption_approved: '#22C55E',
  redemption_denied: '#EF4444',
}

const TYPE_ICON: Record<string, string> = {
  chore_submitted: '📸',
  redemption_requested: '🎁',
  chore_approved: '✅',
  chore_rejected: '❌',
  chore_assigned: '📋',
  streak: '🔥',
  reward_unlocked: '⭐',
  redemption_approved: '🎉',
  redemption_denied: '❌',
}

export function ParentActivityFeed() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markNotificationRead } = useFamily()

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Activity" right={unreadCount > 0 ? <span className="pill pill-orange">{unreadCount} new</span> : undefined} />
      <div className="screen">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No activity yet</h3>
            <p className="text-sm text-muted">Notifications will appear here as your family gets going.</p>
          </div>
        ) : (
          <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notifications.map(notif => {
              const color = TYPE_COLOR[notif.type] ?? '#6B7280'
              const icon = TYPE_ICON[notif.type] ?? '🔔'
              return (
                <button
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: notif.read ? 'transparent' : '#F9F9F7',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderLeft: `3px solid ${notif.read ? 'transparent' : color}`,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: notif.read ? 500 : 700, fontSize: 14 }}>{notif.title}</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{notif.body}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{timeAgo(notif.created_at)}</div>
                  </div>
                  {!notif.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
