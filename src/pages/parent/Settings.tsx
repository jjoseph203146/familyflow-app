import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Share2, LogOut, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/Modal'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'

export function Settings() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const { family, members } = useFamily()
  const [copied, setCopied] = useState(false)
  const [showLeave, setShowLeave] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  function copyCode() {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function shareCode() {
    if (navigator.share && family?.invite_code) {
      navigator.share({ title: 'Join our family on FamilyFlow', text: `Use invite code ${family.invite_code} to join our family.` })
    } else {
      copyCode()
    }
  }

  async function handleLeave() {
    if (!user) return
    await supabase.from('profiles').update({ family_id: null }).eq('id', user.id)
    await signOut()
    navigate('/')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Settings" />
      <div className="screen">
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
          {/* Family info */}
          {family && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Family</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{family.name}</div>

              {/* Invite code */}
              <div style={{ background: '#F3F4F6', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Invite code</div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.12em', color: '#111827', marginBottom: 12 }}>
                  {family.invite_code}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm btn-full" onClick={copyCode}>
                    <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="btn btn-primary btn-sm btn-full" onClick={shareCode}>
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>

              <button className="btn btn-outline btn-sm btn-full" onClick={() => navigate('/parent/invite')}>
                Invite members
              </button>
            </div>
          )}

          {/* Members */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Members ({members.length})</div>
            {members.map(member => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <Avatar name={member.full_name} userId={member.id} size="sm" imageUrl={member.avatar_url} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{member.full_name}</div>
                  <div className="text-sm text-muted" style={{ textTransform: 'capitalize' }}>{member.role}</div>
                </div>
                {member.id === user?.id && <span className="pill pill-indigo">You</span>}
              </div>
            ))}
          </div>

          {/* Account */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Account</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{profile?.full_name}</div>
            <div className="text-sm text-muted" style={{ marginBottom: 16 }}>{profile?.email}</div>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'flex-start', color: '#EF4444' }}>
              <LogOut size={16} /> Sign out
            </button>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ borderColor: '#FEE2E2', border: '1px solid' }}>
            <div className="section-title" style={{ marginBottom: 12, color: '#B91C1C' }}>Danger zone</div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowLeave(true)}
              style={{ width: '100%', justifyContent: 'flex-start', color: '#EF4444', marginBottom: 8 }}
            >
              <LogOut size={16} /> Leave family
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowDelete(true)}
              style={{ width: '100%', justifyContent: 'flex-start', color: '#EF4444' }}
            >
              <Trash2 size={16} /> Delete family
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showLeave}
        onClose={() => setShowLeave(false)}
        onConfirm={handleLeave}
        title="Leave this family?"
        description="You'll be removed from the family and signed out. Your chore history will remain."
        confirmLabel="Yes, leave"
        cancelLabel="Cancel"
        danger
      />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleLeave}
        title="Delete this family?"
        description="This will permanently delete the family, all chores, and all data for every member. This cannot be undone."
        confirmLabel="Yes, delete family"
        cancelLabel="Cancel"
        danger
      />
    </AppLayout>
  )
}
