import { ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface AppLayoutProps {
  children: ReactNode
  tabBar?: ReactNode
}

export function AppLayout({ children, tabBar }: AppLayoutProps) {
  return (
    <div className="app-shell">
      {children}
      {tabBar}
    </div>
  )
}

interface TopBarProps {
  title?: string
  onBack?: () => void
  onClose?: () => void
  right?: ReactNode
  transparent?: boolean
}

export function TopBar({ title, onBack, onClose, right, transparent }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div className="top-bar" style={transparent ? { background: 'transparent', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 } : {}}>
      {(onBack !== undefined) && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '8px', minWidth: 0 }}
          onClick={onBack ?? (() => navigate(-1))}
        >
          <ArrowLeft size={20} />
        </button>
      )}
      {onClose && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '8px', minWidth: 0 }}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      )}
      {title && <span className="top-bar-title">{title}</span>}
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  )
}
