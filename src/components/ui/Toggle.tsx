interface ToggleProps {
  on: boolean
  onChange: (val: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ on, onChange, label, description }: ToggleProps) {
  return (
    <div className="toggle-wrap">
      {(label || description) && (
        <div>
          {label && <div style={{ fontSize: 15, fontWeight: 600 }}>{label}</div>}
          {description && <div className="text-sm text-muted mt-4">{description}</div>}
        </div>
      )}
      <button
        type="button"
        className={`toggle ${on ? 'on' : ''}`}
        onClick={() => onChange(!on)}
        aria-checked={on}
        role="switch"
      />
    </div>
  )
}
