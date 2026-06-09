import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { Family, Profile, Chore, Reward, Redemption, Notification } from '@/types'

interface FamilyContextValue {
  family: Family | null
  members: Profile[]
  chores: Chore[]
  rewards: Reward[]
  redemptions: Redemption[]
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  refresh: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
}

const FamilyContext = createContext<FamilyContextValue | null>(null)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [chores, setChores] = useState<Chore[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.family_id) return
    setLoading(true)
    const familyId = profile.family_id

    const [
      { data: familyData },
      { data: membersData },
      { data: choresData },
      { data: rewardsData },
      { data: redemptionsData },
      { data: notificationsData },
    ] = await Promise.all([
      supabase.from('families').select('*').eq('id', familyId).single(),
      supabase.from('profiles').select('*').eq('family_id', familyId),
      supabase.from('chores').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
      supabase.from('rewards').select('*').eq('family_id', familyId).eq('is_active', true),
      supabase.from('redemptions').select('*, reward:rewards(*), redeemer:profiles!redemptions_redeemed_by_fkey(*)').eq('family_id', familyId).order('requested_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50),
    ])

    if (familyData) setFamily(familyData as Family)
    if (membersData) setMembers(membersData as Profile[])
    if (choresData) setChores(choresData as Chore[])
    if (rewardsData) setRewards(rewardsData as Reward[])
    if (redemptionsData) setRedemptions(redemptionsData as Redemption[])
    if (notificationsData) setNotifications(notificationsData as Notification[])
    setLoading(false)
  }, [profile?.family_id, profile?.id])

  useEffect(() => { load() }, [load])

  // Refresh when app comes back into focus (e.g. switching back from camera or another app)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  // Real-time subscriptions
  useEffect(() => {
    if (!profile?.family_id) return
    const familyId = profile.family_id

    const choresChannel = supabase
      .channel('family-chores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores', filter: `family_id=eq.${familyId}` },
        () => load())
      .subscribe()

    const notifChannel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(choresChannel)
      supabase.removeChannel(notifChannel)
    }
  }, [profile?.family_id, profile?.id, load])

  async function markNotificationRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <FamilyContext.Provider value={{ family, members, chores, rewards, redemptions, notifications, unreadCount, loading, refresh: load, markNotificationRead }}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
