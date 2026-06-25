import { useState } from 'react'
import { Check, X, Gift } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import type { Redemption } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { Avatar, Button, BottomSheet, Textarea, EmptyState, StatusPill, redemptionStatusMeta } from '@/components/ui'
import { rewardVisual } from '@/components/rewardVisual'
import { relative } from '@/lib/format'

export function RedemptionQueue() {
  const { user, profile } = useAuth()
  const { redemptions, members, refresh } = useFamily()

  const [denyTarget, setDenyTarget] = useState<Redemption | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const pending = redemptions.filter((r) => r.status === 'pending')
  const history = redemptions.filter((r) => r.status !== 'pending')

  async function approve(r: Redemption) {
    if (!user) return
    setBusy(true)
    await supabase
      .from('redemptions')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', r.id)
    await supabase.from('notifications').insert({
      user_id: r.redeemed_by,
      family_id: profile?.family_id,
      type: 'redemption_approved',
      title: 'Reward approved!',
      body: `Your ${r.reward?.title ?? 'reward'} is ready to enjoy.`,
      chore_id: null,
      read: false,
    })
    setBusy(false)
    await refresh()
  }

  async function confirmDeny() {
    if (!denyTarget || !user) return
    setBusy(true)
    const r = denyTarget
    await supabase
      .from('redemptions')
      .update({
        status: 'denied',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        denial_comment: reason.trim() || null,
      })
      .eq('id', r.id)

    const member = members.find((m) => m.id === r.redeemed_by)
    if (member && r.reward) {
      await supabase
        .from('profiles')
        .update({ points_total: member.points_total + r.reward.points_required })
        .eq('id', member.id)
    }
    await supabase.from('notifications').insert({
      user_id: r.redeemed_by,
      family_id: profile?.family_id,
      type: 'redemption_denied',
      title: 'Reward request declined',
      body: reason.trim() ? reason.trim() : `Your points for ${r.reward?.title ?? 'the reward'} were returned.`,
      chore_id: null,
      read: false,
    })
    setBusy(false)
    setDenyTarget(null)
    setReason('')
    await refresh()
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Redemptions" />
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 11 }}>
          {redemptions.length === 0 && (
            <EmptyState icon={<Gift size={26} />} title="No requests yet" body="When a child redeems a reward, it'll appear here for your approval." />
          )}

          {pending.length > 0 && <div className="section-label">Pending · {pending.length}</div>}
          {pending.map((r) => {
            const { Icon, tone } = rewardVisual(r.reward?.reward_type ?? 'custom')
            return (
              <div key={r.id} className="card card--pad flex col" style={{ gap: 11 }}>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <span className={`tile tile-${tone}`}><Icon size={19} /></span>
                  <div className="flex-1">
                    <div className="title" style={{ fontSize: 13.5 }}>{r.reward?.title}</div>
                    <div className="meta flex items-center" style={{ gap: 5, marginTop: 2 }}>
                      <Avatar name={r.redeemer?.full_name} seed={r.redeemed_by} size="sm" />
                      {r.redeemer?.full_name?.split(' ')[0]} · {relative(r.requested_at)}
                    </div>
                  </div>
                  <span className="pill pill--points">{r.reward?.points_required} pts</span>
                </div>
                <div className="flex" style={{ gap: 8 }}>
                  <Button variant="danger-soft" size="sm" leftIcon={<X size={15} />} onClick={() => setDenyTarget(r)} disabled={busy} style={{ flex: 1 }}>
                    Deny
                  </Button>
                  <Button size="sm" leftIcon={<Check size={15} strokeWidth={2.6} />} onClick={() => approve(r)} disabled={busy} style={{ flex: 1.4 }}>
                    Approve
                  </Button>
                </div>
              </div>
            )
          })}

          {history.length > 0 && <div className="section-label" style={{ marginTop: 4 }}>History</div>}
          {history.map((r) => {
            const { Icon, tone } = rewardVisual(r.reward?.reward_type ?? 'custom')
            const meta = redemptionStatusMeta(r.status)
            return (
              <div key={r.id} className="card list-row" style={{ opacity: 0.78 }}>
                <span className={`tile tile--sm tile-${tone}`}><Icon size={17} /></span>
                <div className="flex-1">
                  <div className="title" style={{ fontSize: 12.5 }}>{r.reward?.title}</div>
                  <div className="meta" style={{ marginTop: 1 }}>{r.redeemer?.full_name?.split(' ')[0]} · {relative(r.reviewed_at)}</div>
                </div>
                <StatusPill label={meta.label} variant={meta.variant} />
              </div>
            )
          })}
        </div>
      </main>

      <BottomSheet open={!!denyTarget} onClose={() => setDenyTarget(null)}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Decline this reward?</h2>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.45 }}>
          {denyTarget?.redeemer?.full_name?.split(' ')[0]}'s {denyTarget?.reward?.points_required} points will be returned.
        </p>
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="field__label">Reason <span style={{ color: 'var(--faint)', fontWeight: 600 }}>· optional</span></label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let them know why..." />
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <Button variant="secondary" onClick={() => setDenyTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeny} disabled={busy} style={{ flex: 1.4 }}>Decline & refund</Button>
        </div>
      </BottomSheet>
    </AppLayout>
  )
}
