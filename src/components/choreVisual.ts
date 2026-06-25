import { BedDouble, Utensils, Shirt, Dog, BookOpen, Trash2, Sparkles, CheckSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Tone = 'sky' | 'sage' | 'lilac' | 'peach' | 'blush' | 'mint'

export function choreVisual(title: string): { Icon: LucideIcon; tone: Tone } {
  const t = title.toLowerCase()
  if (/\bbed\b|make.*bed|tidy|room/.test(t)) return { Icon: BedDouble, tone: 'sage' }
  if (/dish|kitchen|plate|table/.test(t)) return { Icon: Utensils, tone: 'sky' }
  if (/laundry|fold|cloth|wash/.test(t)) return { Icon: Shirt, tone: 'blush' }
  if (/dog|walk|pet|cat|feed/.test(t)) return { Icon: Dog, tone: 'lilac' }
  if (/home ?work|study|math|read|book/.test(t)) return { Icon: BookOpen, tone: 'sky' }
  if (/trash|garbage|bin|recycl/.test(t)) return { Icon: Trash2, tone: 'peach' }
  if (/clean|vacuum|sweep|dust|wipe/.test(t)) return { Icon: Sparkles, tone: 'mint' }
  return { Icon: CheckSquare, tone: 'mint' }
}
