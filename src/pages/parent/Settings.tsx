import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, LogOut, ChevronRight, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { Avatar, Button, BottomSheet, Field, Input } from '@/components/ui'

export function Settings() {
  const navigate = useNavigate()
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { family, members, refresh } = useFamily()

  const [leaving, setLeaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const [editingProfile, setEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [editingFamily, setEditingFamily] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [familySaving, setFamilySaving] = useState(false)
  const [familyError, setFamilyError] = useState<string | null>(null)

  const [removingMember, setRemovingMember] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const code = family?.invite_code ?? ''
  const formatted = code.startsWith('FAM-') ? code : `FAM-${code}`

  function openProfileEdit() {
    setProfileName(profile?.full_name ?? '')
    setProfileError(null)
    setEditingProfile(true)
  }

  async function saveProfile() {
    if (!user) return
    setProfileSaving(true)
    setProfileError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profileName.trim() })
      .eq('id', user.id)
    setProfileSaving(false)
    if (error) {
      setProfileError(error.message)
      return
    }
    setEditingProfile(false)
    await refreshProfile()
    await refresh()
  }

  function openFamilyEdit() {
    setFamilyName(family?.name ?? '')
    setFamilyError(null)
    setEditingFamily(true)
  }

  async function saveFamily() {
    if (!family) return
    setFamilySaving(true)
    setFamilyError(null)
    const { error } = await supabase
      .from('families')
      .update({ name: familyName.trim() })
      .eq('id', family.id)
    setFamilySaving(false)
    if (error) {
      setFamilyError(error.message)
      return
    }
    setEditingFamily(false)
    await refresh()
  }

  async function removeMember() {
    if (!removingMember) return
    setBusy(true)
    setRemoveError(null)
    const { error } = await supabase.rpc('remove_member', {
      p_member_id: removingMember,
    })
    setBusy(false)
    if (error) {
      setRemoveError(error.message)
      return
    }
    setRemovingMember(null)
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

  const memberToRemove = members.find((m) => m.id === removingMember)

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Settings" />
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 11 }}>
          <div className="hero" style={{ borderRadius: 'var(--r-lg)' }}>
            <div className="flex between items-center">
              <div className="eyebrow" style={{ color: '#fff', opacity: 0.85 }}>Your family</div>
              <button
                className="icon-btn"
                style={{ background: 'rgba(255,255,255,.18)', color: '#fff', border: 'none', width: 28, height: 28 }}
                onClick={openFamilyEdit}
                aria-label="Edit family name"
              >
                <Pencil size={13} />
              </button>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{family?.name ?? 'Your family'}</div>
            <div
              className="flex between items-center"
              style={{ background: 'rgba(255,255,255,.18)', borderRadius: 'var(--r-sm)', padding: '9px 12px', marginTop: 11 }}
            >
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.85, letterSpacing: '.06em' }}>INVITE CODE</div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.12em' }}>{formatted}</div>
              </div>
              <button
                className="flex items-center"
                style={{ gap: 6, background: '#fff', color: 'var(--primary-ink)', borderRadius: 'var(--r-xs)', padding: '8px 12px', fontSize: 11.5, fontWeight: 800 }}
                onClick={() => navigate('/parent/invite')}
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          <div className="section-label">Members</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {members.map((m, i) => (
              <div
                key={m.id}
                className="list-row"
                style={{ borderBottom: i < members.length - 1 ? '1px solid var(--line)' : 'none' }}
              >
                <Avatar name={m.full_name} url={m.avatar_url} square seed={m.id} size="sm" />
                <div className="flex-1">
                  <div className="title" style={{ fontSize: 13 }}>
                    {m.full_name}
                    {m.id === user?.id && <span className="meta" style={{ fontWeight: 700 }}> · You</span>}
                  </div>
                </div>
                <span className={`pill ${m.role === 'parent' ? 'pill--approved' : 'pill--assigned'}`} style={{ textTransform: 'capitalize' }}>
                  {m.role}
                </span>
                {m.id !== user?.id && (
                  <button
                    className="icon-btn"
                    style={{ width: 28, height: 28, color: 'var(--danger)', opacity: 0.7 }}
                    onClick={() => { setRemoveError(null); setRemovingMember(m.id) }}
                    aria-label={`Remove ${m.full_name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="section-label">Account</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="list-row" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex-1">
                <div className="title" style={{ fontSize: 13 }}>{profile?.full_name}</div>
                <div className="meta" style={{ marginTop: 1 }}>{user?.email}</div>
              </div>
              <button className="icon-btn" onClick={openProfileEdit} aria-label="Edit profile">
                <Pencil size={15} />
              </button>
            </div>
            <button className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate('/parent/redemptions')}>
              <div className="flex-1"><div className="title" style={{ fontSize: 13 }}>Reward requests</div></div>
              <ChevronRight size={18} color="var(--faint)" />
            </button>
          </div>

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

      {/* Edit Profile */}
      <BottomSheet open={editingProfile} onClose={() => setEditingProfile(false)}>
        <h2 className="h2" style={{ marginBottom: 14 }}>Edit profile</h2>
        <div className="flex col" style={{ gap: 14 }}>
          <Field label="Name">
            <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} autoFocus />
          </Field>
          {profileError && (
            <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700 }}>
              <AlertCircle size={16} /> {profileError}
            </div>
          )}
          <Button disabled={profileSaving || !profileName.trim()} onClick={saveProfile}>
            {profileSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </BottomSheet>

      {/* Edit Family Name */}
      <BottomSheet open={editingFamily} onClose={() => setEditingFamily(false)}>
        <h2 className="h2" style={{ marginBottom: 14 }}>Rename family</h2>
        <div className="flex col" style={{ gap: 14 }}>
          <Field label="Family name">
            <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} autoFocus />
          </Field>
          {familyError && (
            <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700 }}>
              <AlertCircle size={16} /> {familyError}
            </div>
          )}
          <Button disabled={familySaving || !familyName.trim()} onClick={saveFamily}>
            {familySaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </BottomSheet>

      {/* Remove Member */}
      <BottomSheet open={!!removingMember} onClose={() => setRemovingMember(null)}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Remove {memberToRemove?.full_name?.split(' ')[0]}?</h2>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.45 }}>
          They'll lose access to {family?.name ?? 'this family'}'s chores and rewards. They can rejoin later with an invite code.
        </p>
        {removeError && (
          <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
            <AlertCircle size={16} /> {removeError}
          </div>
        )}
        <div className="flex" style={{ gap: 10 }}>
          <Button variant="secondary" onClick={() => setRemovingMember(null)}>Cancel</Button>
          <Button variant="danger" onClick={removeMember} disabled={busy} style={{ flex: 1.3 }}>Remove</Button>
        </div>
      </BottomSheet>

      {/* Leave Family */}
      <BottomSheet open={leaving} onClose={() => setLeaving(false)}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Leave this family?</h2>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.45 }}>
          You'll lose access to {family?.name ?? 'this family'}'s chores and rewards. You can rejoin later with an invite code.
        </p>
        <div className="flex" style={{ gap: 10 }}>
          <Button variant="secondary" onClick={() => setLeaving(false)}>Cancel</Button>
          <Button variant="danger" onClick={leaveFamily} disabled={busy} style={{ flex: 1.3 }}>Leave family</Button>
        </div>
      </BottomSheet>
    </AppLayout>
  )
}
