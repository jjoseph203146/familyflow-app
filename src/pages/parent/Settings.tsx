import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Share2, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { Avatar, Button, BottomSheet } from '@/components/ui'

export function Settings() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const { family, members } = useFamily()
  const [leaving, setLeaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const code = family?.invite_code ?? ''
  const formatted = code.startsWith('FAM-') ? code : `FAM-${code}`

  async function leaveFamily() {
    if (!user) return
    setBusy(true)
    await supabase.from('profiles').update({ family_id: null }).eq('id', user.id)
    setBusy(false)
    setLeaving(false)
    await signOut()
    navigate('/')
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Settings" />
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 11 }}>
          <div className="hero" style={{ borderRadius: 'var(--r-lg)' }}>
            <div className="eyebrow" style={{ color: '#fff', opacity: 0.85 }}>Your family</div>
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
