const COLORS = ['sky', 'sage', 'lilac', 'peach', 'blush'] as const

export function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last || first).toUpperCase()
}

export function avatarColor(seed?: string | null): (typeof COLORS)[number] {
  const s = seed ?? ''
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

export function Avatar({
  name,
  url,
  size = 'md',
  square,
  seed,
}: {
  name?: string | null
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
  square?: boolean
  seed?: string | null
}) {
  const cls = [
    'avatar',
    size === 'sm' ? 'avatar--sm' : size === 'lg' ? 'avatar--lg' : '',
    square ? 'avatar--sq' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (url) {
    return <img className={cls} src={url} alt={name ?? ''} style={{ objectFit: 'cover' }} />
  }
  const color = avatarColor(seed ?? name)
  return (
    <div
      className={cls}
      style={{ background: `var(--p-${color})`, color: `var(--p-${color}-ink)` }}
    >
      {initials(name)}
    </div>
  )
}
