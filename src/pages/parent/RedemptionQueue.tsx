import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { timeAgo } from '@/lib/utils'
import { Redemption } from '@/types'

export function RedemptionQueue() {
  const { user, profile } = useAuth()
  const { redemptions, members, refresh } = useFamily()
  const [denyId, setDenyId] = useState<string | null>(null)
  const [denyComment, setDenyComment] = useState('')
  const [loading, setLoading] = useState(false)

  const pending = redemptions.filter(r => r.status === 'pending')
  const history = redemptions.filter(r => r.status !== 'pending')

  async function approve(r: Redemption) {
    setLoading(true)
    await supabase.from('redemptions').update({
      status: 'approved',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', r.id)

    const redeemer = members.find(m => m.id === r.redeemed_by)
    if (redeemer) {
      await supabase.from('notifications').insert({
        user_id: redeemer.id,
        family_id: profile?.family_id,
        type: 'redemption_approved',
        title: 'Reward approved! 🎉',
        body: `Your reward "${r.reward?.title}" was approved by ${profile?.full_name}.`,
        read: false,
      })
    }

    await refresh()
    setLoading(false)
  }

  async function deny() {
    if (!denyId) return
    setLoading(true)
    const r = redemptions.find(r => r.id === denyId)
    await supabase.from('redemptions').update({
      status: 'denied',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      denial_comment: denyComment.trim() || null,
    }).eq('id', denyId)

    const redeemer = r && members.find(m => m.id === r.redeemed_by)
    if (redeemer && r) {
      const pts = r.reward?.points_required ?? 0
      await supabase.from('profiles').update({ points_total: (redeemer.points_total || 0) + pts }).eq('id', redeemer.id)
      await supabase.from('notifications').insert({
        user_id: redeemer.id,
        family_id: profile?.family_id,
        type: 'redemption_denied',
        title: 'Reward request denied',
        body: `"${r.reward?.title}" was denied. ${denyComment ? `Reason: ${denyComment}` : 'Points refunded.'}`,
        read: false,
      })
    }

    await refresh()
    setLoading(false)
    setDenyId(null)
    setDenyComment('')
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Redemption queue" />
      <div className="screen">
        {pending.length === 0 && history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎁</div>
            <h3>No redemption requests</h3>
            <p className="text-sm text-muted">Requests from family members will appear here.</p>
          </div>
        ) : (
          <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pending.length > 0 && (
              <div>
                <div className="section-title" style={{ marginBottom: 10 }}>Pending ({pending.length})</div>
                {pending.map(r => {
                  const redeemer = members.find(m => m.id === r.redeemed_by)
                  return (
                    <div key={r.id} className="card" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        {redeemer && <Avatar name={redeemer.full_name} userId={redeemer.id} size="sm" imageUrl={redeemer.avatar_url} />}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{r.reward?.title}</div>
                          <div className="text-sm text-muted">{redeemer?.full_name} · {timeAgo(r.requested_at)}</div>
                        </div>
                        <span className="pill pill-amber">⭐ {r.reward?.points_required}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline btn-sm btn-full" onClick={() => setDenyId(r.id)} disabled={loading}>
                          Deny
                        </button>
                        <button className="btn btn-success btn-sm btn-full" onClick={() => approve(r)} disabled={loading}>
                          Approve ✓
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {history.length > 0 && (
              <div>
                <div className="section-title" style={{ marginBottom: 10 }}>History</div>
                {history.map(r => {
                  const redeemer = members.find(m => m.id === r.redeemed_by)
                  return (
                    <div key={r.id} className="card" style={{ marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                      {redeemer && <Avatar name={redeemer.full_name} userId={redeemer.id} size="sm" imageUrl={redeemer.avatar_url} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.reward?.title}</div>
                        <div className="text-sm text-muted">{redeemer?.full_name?.split(' ')[0]} · {timeAgo(r.requested_at)}</div>
                      </div>
                      <span className={`pill ${r.status === 'approved' ? 'pill-green' : 'pill-red'}`}>
                        {r.status === 'approved' ? 'Approved' : 'Denied'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={!!denyId} onClose={() => { setDenyId(null); setDenyComment('') }}>
        <h3 style={{ marginBottom: 8 }}>Deny this request?</h3>
        <p className="text-muted" style={{ marginBottom: 16, fontSize: 14 }}>The points will be refunded to them. Add a reason (optional).</p>
        <textarea
          className="input-field"
          placeholder="Optional reason…"
          value={denyComment}
          onChange={e => setDenyComment(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-full" onClick={() => { setDenyId(null); setDenyComment('') }}>Cancel</button>
          <button className="btn btn-danger btn-full" onClick={deny} disabled={loading}>Deny request</button>
        </div>
      </Modal>
    </AppLayout>
  )
}
