export function ProgressBar({
  value,
  lg,
  className = '',
}: {
  value: number
  lg?: boolean
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div className={`progress ${lg ? 'progress--lg' : ''} ${className}`}>
      <div className="progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
