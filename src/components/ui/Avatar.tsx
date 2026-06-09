import { avatarColor, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  userId: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  imageUrl?: string | null
}

export function Avatar({ name, userId, size = 'md', imageUrl }: AvatarProps) {
  const bg = avatarColor(userId)
  return (
    <div
      className={`avatar avatar-${size}`}
      style={imageUrl ? {} : { background: bg }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
