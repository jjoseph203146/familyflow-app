import { formatDistanceToNow, isPast, isToday, isTomorrow, isYesterday, format } from 'date-fns'
import type { Chore } from '@/types'

export function isOverdue(chore: Chore): boolean {
  if (!chore.due_date) return false
  if (chore.status === 'approved' || chore.status === 'submitted') return false
  return isPast(new Date(chore.due_date))
}

export function formatDue(due: string | null): string {
  if (!due) return 'No due date'
  const d = new Date(due)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d')
}

export function relative(date: string | null | undefined): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function happenedToday(date: string | null | undefined): boolean {
  if (!date) return false
  return isToday(new Date(date))
}

export const PENDING_JOIN_KEY = 'ff_pending_join_code'
