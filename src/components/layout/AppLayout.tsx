import type { ReactNode } from 'react'
import { ChevronLeft, X } from 'lucide-react'

export function AppLayout({
  children,
  tabBar,
}: {
  children: ReactNode
  tabBar?: ReactNode
}) {
  return (
    <div className="ff-app">
      {children}
      {tabBar}
    </div>
  )
}

export function TopBar({
  title,
  onBack,
  onClose,
  right,
  transparent,
}: {
  title?: string
  onBack?: () => void
  onClose?: () => void
  right?: ReactNode
  transparent?: boolean
}) {
  return (
    <header className={`topbar ${transparent ? 'topbar--transparent' : ''}`}>
      {onBack && (
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={18} />
        </button>
      )}
      {onClose && !onBack && (
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      )}
      {title ? <h1 className="topbar__title">{title}</h1> : <div className="flex-1" />}
      {right}
    </header>
  )
}
