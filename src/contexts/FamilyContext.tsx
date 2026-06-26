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
  clearAllNotifications: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
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
      supabase.from('rewards').select('*').eq('family_id', familyId),
      supabase.from('redemptions').select('*, reward:rewards(*), redeemer:profiles!redemptions_redeemed_by_fkey(*)').eq('family_id', familyId).order('requested_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(50),
    ])

    if (familyData) setFamily(familyData as Family)
    const profileList = (membersData ?? []) as Profile[]
    if (membersData) setMembers(profileList)
    if (choresData) {
      const memberMap = new Map(profileList.map(p => [p.id, p]))
      setChores((choresData as Chore[]).map(c => ({
        ...c,
        assignee: c.assigned_to ? memberMap.get(c.assigned_to) : undefined,
        assigner: memberMap.get(c.assigned_by),
      })))
    }
    if (rewardsData) setRewards(rewardsData as Reward[])
    if (redemptionsData) setRedemptions(redemptionsData as Redemption[])
    if (notificationsData) setNotifications(notificationsData as Notification[])
    setLoading(false)
  }, [profile?.family_id, profile?.id])

  useEffect(() => { load() }, [load])

  // Refresh when app comes back into focus
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  // Real-time subscriptions
  useEffect(() => {
    if (!profile?.family_id) return
    const familyId = profile.family_id

    const familyChannel = supabase
      .channel(`family-${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores', filter: `family_id=eq.${familyId}` },
        () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `family_id=eq.${familyId}` },
        () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemptions', filter: `family_id=eq.${familyId}` },
        () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(familyChannel)
    }
  }, [profile?.family_id, profile?.id, load])

  async function markNotificationRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function clearAllNotifications() {
    if (!profile) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <FamilyContext.Provider value={{ family, members, chores, rewards, redemptions, notifications, unreadCount, loading, refresh: load, markNotificationRead, clearAllNotifications, deleteNotification }}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
