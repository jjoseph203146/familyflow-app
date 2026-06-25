import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, Gift, Bell, SlidersHorizontal } from 'lucide-react'
import { useFamily } from '@/contexts/FamilyContext'

function Tab({
  to,
  label,
  icon,
  active,
  badge,
}: {
  to: string
  label: string
  icon: ReactNode
  active: boolean
  badge?: boolean
}) {
  const navigate = useNavigate()
  return (
    <button className={`nav-tab ${active ? 'is-active' : ''}`} onClick={() => navigate(to)}>
      {icon}
      <span>{label}</span>
      {badge && <span className="nav-tab__badge" />}
    </button>
  )
}

export function ParentTabBar() {
  const { pathname } = useLocation()
  const { unreadCount } = useFamily()
  const startsWith = (p: string) => pathname === p || pathname.startsWith(p + '/')
  return (
    <nav className="bottom-nav">
      <Tab to="/parent" label="Home" active={pathname === '/parent'} icon={<Home size={20} />} />
      <Tab to="/parent/chores" label="Chores" active={startsWith('/parent/chores')} icon={<ClipboardList size={20} />} />
      <Tab to="/parent/rewards" label="Rewards" active={startsWith('/parent/rewards')} icon={<Gift size={20} />} />
      <Tab
        to="/parent/activity"
        label="Activity"
        active={startsWith('/parent/activity')}
        icon={<Bell size={20} />}
        badge={unreadCount > 0}
      />
      <Tab to="/parent/settings" label="Settings" active={startsWith('/parent/settings')} icon={<SlidersHorizontal size={20} />} />
    </nav>
  )
}

export function ChildTabBar() {
  const { pathname } = useLocation()
  const { unreadCount } = useFamily()
  const startsWith = (p: string) => pathname === p || pathname.startsWith(p + '/')
  return (
    <nav className="bottom-nav">
      <Tab to="/child" label="Home" active={pathname === '/child'} icon={<Home size={20} />} />
      <Tab to="/child/rewards" label="Rewards" active={startsWith('/child/rewards')} icon={<Gift size={20} />} />
      <Tab
        to="/child/activity"
        label="Activity"
        active={startsWith('/child/activity')}
        icon={<Bell size={20} />}
        badge={unreadCount > 0}
      />
    </nav>
  )
}
