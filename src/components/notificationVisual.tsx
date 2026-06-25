import {
  ClipboardList,
  Camera,
  CheckCircle2,
  XCircle,
  Gift,
  Flame,
  Trophy,
  Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NotificationType } from '@/types'

type Tone = 'sky' | 'sage' | 'lilac' | 'peach' | 'blush' | 'mint' | 'butter'

export function notificationVisual(type: NotificationType): { Icon: LucideIcon; tone: Tone } {
  switch (type) {
    case 'chore_assigned':
      return { Icon: ClipboardList, tone: 'sky' }
    case 'chore_submitted':
      return { Icon: Camera, tone: 'butter' }
    case 'chore_approved':
      return { Icon: CheckCircle2, tone: 'mint' }
    case 'chore_rejected':
      return { Icon: XCircle, tone: 'blush' }
    case 'redemption_requested':
      return { Icon: Gift, tone: 'lilac' }
    case 'redemption_approved':
      return { Icon: Gift, tone: 'mint' }
    case 'redemption_denied':
      return { Icon: Gift, tone: 'blush' }
    case 'streak':
      return { Icon: Flame, tone: 'peach' }
    case 'reward_unlocked':
      return { Icon: Trophy, tone: 'butter' }
    default:
      return { Icon: Bell, tone: 'sky' }
  }
}
