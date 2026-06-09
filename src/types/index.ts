export type UserRole = 'parent' | 'child'

export type ChoreStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'rejected'

export type ChoreRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export type RedemptionStatus = 'pending' | 'approved' | 'denied'

export type NotificationType =
  | 'chore_assigned'
  | 'chore_submitted'
  | 'chore_approved'
  | 'chore_rejected'
  | 'redemption_requested'
  | 'redemption_approved'
  | 'redemption_denied'
  | 'streak'
  | 'reward_unlocked'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  family_id: string | null
  role: UserRole
  points_total: number
  streak_current: number
  streak_longest: number
  created_at: string
}

export interface Family {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface Chore {
  id: string
  family_id: string
  title: string
  description: string | null
  assigned_to: string | null
  assigned_by: string
  points_value: number
  requires_photo: boolean
  recurrence: ChoreRecurrence
  due_date: string | null
  status: ChoreStatus
  rejection_comment: string | null
  created_at: string
  completed_at: string | null
  approved_at: string | null
  approved_by: string | null
  photo_url: string | null
  photo_path: string | null
  submitted_at: string | null
  assignee?: Profile
  assigner?: Profile
}

export interface Reward {
  id: string
  family_id: string
  title: string
  description: string | null
  points_required: number
  reward_type: 'money' | 'screen_time' | 'privilege' | 'custom'
  created_by: string
  is_active: boolean
  created_at: string
}

export interface Redemption {
  id: string
  reward_id: string
  redeemed_by: string
  status: RedemptionStatus
  requested_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  denial_comment: string | null
  reward?: Reward
  redeemer?: Profile
}

export interface Notification {
  id: string
  user_id: string
  family_id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  chore_id: string | null
  created_at: string
}
