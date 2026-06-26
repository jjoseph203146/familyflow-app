import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ChildTabBar } from '@/components/layout/TabBar'
import { Avatar, Button, BottomSheet, Field, Input } from '@/components/ui'
import { rewardVisual } from '@/components/rewardVisual'
import { StatusPill, redemptionStatusMeta } from '@/components/ui'
import { relative } from '@/lib/format'

export function ChildSettings() {
  const navigate = useNavigate()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { family, redemptions, refresh } = useFamily()

  const [editingProfile, setEditingProfile] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [busy, setBusy] = useState(false)

  function openProfileEdit() {
    setName(profile?.full_name ?? '')
    setError(null)
    setEditingProfile(true)
  }

  async function saveProfile() {
    if (!user) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setEditingProfile(false)
    await refreshProfile()
    await refresh()
  }

  async function leaveFamily() {
    if (!user) return
    setBusy(true)
    await supabase.from('profiles').update({ family_id: null }).eq('id', user.id)
    setBusy(false)
    setLeaving(false)
    await signOut()
    navigate('/')
  }

  const myRedemptions = redemptions.filter((r) => r.redeemed_by === user?.id)

  return (
    <AppLayout tabBar={<ChildTabBar />}>
      <TopBar title="Settings" />
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 11 }}>
          <div className="card card--pad flex items-center" style={{ gap: 12 }}>
            <Avatar name={profile?.full_name} url={profile?.avatar_url} square seed={profile?.id} size="lg" />
            <div className="flex-1">
              <div className="h2" style={{ fontSize: 16 }}>{profile?.full_name}</div>
              <div className="meta" style={{ marginTop: 2 }}>{user?.email}</div>
              <div className="meta" style={{ marginTop: 1 }}>{family?.name}</div>
            </div>
            <button className="icon-btn" onClick={openProfileEdit} aria-label="Edit profile">
              <Pencil size={16} />
            </button>
          </div>

          {myRedemptions.length > 0 && (
            <>
              <div className="section-label">My reward requests</div>
              {myRedemptions.map((r) => {
                const { Icon, tone } = rewardVisual(r.reward?.reward_type ?? 'custom')
                const meta = redemptionStatusMeta(r.status)
                return (
                  <div key={r.id} className="card list-row">
                    <span className={`tile tile--sm tile-${tone}`}><Icon size={17} /></span>
                    <div className="flex-1">
                      <div className="title" style={{ fontSize: 12.5 }}>{r.reward?.title ?? 'Reward'}</div>
                      <div className="meta" style={{ marginTop: 1 }}>
                        {r.reward?.points_required} pts · {relative(r.requested_at)}
                      </div>
                    </div>
                    <StatusPill label={meta.label} variant={meta.variant} />
                  </div>
                )
              })}
            </>
          )}

          <Button variant="secondary" leftIcon={<LogOut size={16} />} onClick={() => signOut().then(() => navigate('/'))}>
            Sign out
          </Button>
          <button
            className="center"
            style={{ fontSize: 12, fontWeight: 800, color: 'var(--danger)', padding: '4px 0 8px' }}
            onClick={() => setLeaving(true)}
          >
            Leave family
          </button>
        </div>
      </main>

      <BottomSheet open={editingProfile} onClose={() => setEditingProfile(false)}>
        <h2 className="h2" style={{ marginBottom: 14 }}>Edit profile</h2>
        <div className="flex col" style={{ gap: 14 }}>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          {error && (
            <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <Button disabled={saving || !name.trim()} onClick={saveProfile}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={leaving} onClose={() => setLeaving(false)}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Leave this family?</h2>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.45 }}>
          You'll lose your points and access to {family?.name ?? 'this family'}. You can rejoin later with an invite code.
        </p>
        <div className="flex" style={{ gap: 10 }}>
          <Button variant="secondary" onClick={() => setLeaving(false)}>Cancel</Button>
          <Button variant="danger" onClick={leaveFamily} disabled={busy} style={{ flex: 1.3 }}>Leave family</Button>
        </div>
      </BottomSheet>
    </AppLayout>
  )
}
