import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  const [pullRefreshing, setPullRefreshing] = useState(false)

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

  // Refresh when app comes back into focus
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  // Pull-to-refresh
  useEffect(() => {
    let startY = 0
    let pulling = false

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        pulling = true
      }
    }
    const onTouchEnd = async (e: TouchEvent) => {
      if (!pulling) return
      const dy = e.changedTouches[0].clientY - startY
      pulling = false
      startY = 0
      if (dy > 80) {
        setPullRefreshing(true)
        await load()
        setPullRefreshing(false)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
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

    const membersChannel = supabase
      .channel('family-members')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `family_id=eq.${familyId}` },
        () => load())
      .subscribe()

    const notifChannel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(choresChannel)
      supabase.removeChannel(membersChannel)
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
      {pullRefreshing && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 8, padding: '10px 16px',
          background: '#5C5CE0', color: '#fff', fontSize: 13, fontWeight: 600,
        }}>
          <div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
          Refreshing…
        </div>,
        document.body
      )}
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider')
  return ctx
}
