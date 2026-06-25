import type { ChoreStatus, RedemptionStatus } from '@/types'

export type PillVariant =
  | 'assigned'
  | 'progress'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'overdue'

export function choreStatusMeta(
  status: ChoreStatus,
  overdue = false,
): { label: string; variant: PillVariant } {
  if (overdue && (status === 'pending' || status === 'in_progress')) {
    return { label: 'Overdue', variant: 'overdue' }
  }
  switch (status) {
    case 'pending':
      return { label: 'Assigned', variant: 'assigned' }
    case 'in_progress':
      return { label: 'In progress', variant: 'progress' }
    case 'submitted':
      return { label: 'Awaiting review', variant: 'submitted' }
    case 'approved':
      return { label: 'Approved', variant: 'approved' }
    case 'rejected':
      return { label: 'Needs a redo', variant: 'rejected' }
    default:
      return { label: status, variant: 'assigned' }
  }
}

export function redemptionStatusMeta(
  status: RedemptionStatus,
): { label: string; variant: PillVariant } {
  switch (status) {
    case 'pending':
      return { label: 'Pending', variant: 'submitted' }
    case 'approved':
      return { label: 'Approved', variant: 'approved' }
    case 'denied':
      return { label: 'Denied', variant: 'rejected' }
    default:
      return { label: status, variant: 'assigned' }
  }
}

export function StatusPill({
  status,
  overdue,
  label,
  variant,
}: {
  status?: ChoreStatus
  overdue?: boolean
  label?: string
  variant?: PillVariant
}) {
  const meta = status
    ? choreStatusMeta(status, overdue)
    : { label: label ?? '', variant: variant ?? 'assigned' }
  return <span className={`pill pill--${meta.variant}`}>{meta.label}</span>
}
