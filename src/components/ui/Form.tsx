import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label className="field__label">
        {label}
        {hint && <span style={{ color: 'var(--faint)', fontWeight: 600 }}> · {hint}</span>}
      </label>
      {children}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />
}

export function Chip({
  label,
  on,
  soft,
  onClick,
}: {
  label: ReactNode
  on?: boolean
  soft?: boolean
  onClick?: () => void
}) {
  const cls = ['chip', soft ? 'chip--soft' : '', on ? 'is-on' : ''].filter(Boolean).join(' ')
  return (
    <button type="button" className={cls} onClick={onClick}>
      {label}
    </button>
  )
}

export function Switch({
  on,
  onChange,
}: {
  on: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      className={`switch ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      onClick={() => onChange?.(!on)}
    >
      <span className="switch__knob" />
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`segmented__opt ${value === opt.value ? 'is-on' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
