import { Coins, MonitorSmartphone, Ticket, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Reward } from '@/types'

type Tone = 'sage' | 'sky' | 'lilac' | 'peach'

export function rewardVisual(type: Reward['reward_type']): { Icon: LucideIcon; tone: Tone; label: string } {
  switch (type) {
    case 'money':
      return { Icon: Coins, tone: 'sage', label: 'Money' }
    case 'screen_time':
      return { Icon: MonitorSmartphone, tone: 'sky', label: 'Screen time' }
    case 'privilege':
      return { Icon: Ticket, tone: 'lilac', label: 'Privilege' }
    default:
      return { Icon: Sparkles, tone: 'peach', label: 'Custom' }
  }
}
