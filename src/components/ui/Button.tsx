import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'sm'
  leftIcon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = ['btn', `btn--${variant}`, size === 'sm' ? 'btn--sm' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...rest}>
      {leftIcon}
      {children}
    </button>
  )
}
