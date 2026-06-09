import { useNavigate, useLocation } from 'react-router-dom'
import { Home, CheckSquare, Gift, Bell, Settings } from 'lucide-react'
import { useFamily } from '@/contexts/FamilyContext'
import { useAuth } from '@/contexts/AuthContext'

export function ParentTabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { unreadCount } = useFamily()

  const tabs = [
    { icon: Home, label: 'Home', path: '/parent' },
    { icon: CheckSquare, label: 'Chores', path: '/parent/chores' },
    { icon: Gift, label: 'Rewards', path: '/parent/rewards' },
    { icon: Bell, label: 'Activity', path: '/parent/activity', badge: unreadCount },
    { icon: Settings, label: 'Settings', path: '/parent/settings' },
  ]

  return (
    <nav className="tab-bar">
      {tabs.map(({ icon: Icon, label, path, badge }) => (
        <button
          key={path}
          className={`tab-item ${pathname === path || (path !== '/parent' && pathname.startsWith(path)) ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <div style={{ position: 'relative' }}>
            <Icon size={22} />
            {badge && badge > 0 ? (
              <span style={{
                position: 'absolute', top: -4, right: -6,
                background: '#EF4444', color: '#fff',
                fontSize: 10, fontWeight: 700,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </div>
          {label}
        </button>
      ))}
    </nav>
  )
}

export function ChildTabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { unreadCount } = useFamily()

  const tabs = [
    { icon: Home, label: 'Home', path: '/child' },
    { icon: Gift, label: 'Rewards', path: '/child/rewards' },
    { icon: Bell, label: 'Activity', path: '/child/activity', badge: unreadCount },
  ]

  return (
    <nav className="tab-bar">
      {tabs.map(({ icon: Icon, label, path, badge }) => (
        <button
          key={path}
          className={`tab-item ${pathname === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <div style={{ position: 'relative' }}>
            <Icon size={22} />
            {badge && badge > 0 ? (
              <span style={{
                position: 'absolute', top: -4, right: -6,
                background: '#EF4444', color: '#fff',
                fontSize: 10, fontWeight: 700,
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {badge > 9 ? '9+' : badge}
              </span>
            ) : null}
          </div>
          {label}
        </button>
      ))}
    </nav>
  )
}
