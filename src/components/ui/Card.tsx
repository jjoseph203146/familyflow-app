import type { HTMLAttributes, ReactNode } from 'react'

export function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function SectionHeader({
  label,
  action,
  onAction,
}: {
  label: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="section-head">
      <span className="section-label">{label}</span>
      {action && (
        <button className="section-head__action" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}

export function IconTile({
  tone = 'mint',
  size = 'md',
  children,
}: {
  tone?: 'sky' | 'sage' | 'lilac' | 'peach' | 'blush' | 'mint'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}) {
  const cls = ['tile', size === 'sm' ? 'tile--sm' : size === 'lg' ? 'tile--lg' : '', `tile-${tone}`]
    .filter(Boolean)
    .join(' ')
  return <div className={cls}>{children}</div>
}
