import { useState } from 'react'
import { Flame, Check, Gift, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import type { Reward } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ChildTabBar } from '@/components/layout/TabBar'
import { Button, BottomSheet, ProgressBar, EmptyState } from '@/components/ui'
import { rewardVisual } from '@/components/rewardVisual'

export function PointsRewards() {
  const { profile } = useAuth()
  const { rewards, refresh } = useFamily()

  const [target, setTarget] = useState<Reward | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const points = profile?.points_total ?? 0
  const active = rewards.filter((r) => r.is_active)
  const unlocked = active.filter((r) => points >= r.points_required).sort((a, b) => a.points_required - b.points_required)
  const locked = active.filter((r) => points < r.points_required).sort((a, b) => a.points_required - b.points_required)

  async function confirmRedeem() {
    if (!target) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.rpc('redeem_reward', {
      p_reward_id: target.id,
      p_points_cost: target.points_required,
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setTarget(null)
    await refresh()
  }

  return (
    <AppLayout tabBar={<ChildTabBar />}>
      <TopBar title="Rewards" />
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 10 }}>
          <div className="hero hero--gradient flex between items-center" style={{ borderRadius: 'var(--r-lg)', padding: '13px 16px' }}>
            <div>
              <div className="eyebrow" style={{ color: '#fff', opacity: 0.85 }}>Your points</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.1 }} className="tnum">{points}</div>
            </div>
            <span className="flex items-center" style={{ gap: 5, background: 'rgba(255,255,255,.2)', padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
              <Flame size={14} fill="currentColor" /> {profile?.streak_current ?? 0} streak
            </span>
          </div>

          {active.length === 0 && (
            <EmptyState icon={<Gift size={26} />} title="No rewards yet" body="Ask a parent to add some rewards you can work toward!" />
          )}

          {unlocked.length > 0 && (
            <div className="flex items-center section-label" style={{ gap: 6, color: 'var(--primary-ink)' }}>
              <Check size={13} strokeWidth={2.6} /> Ready to redeem · {unlocked.length}
            </div>
          )}
          {unlocked.map((r) => {
            const { Icon, tone } = rewardVisual(r.reward_type)
            return (
              <div key={r.id} className="list-row" style={{ background: 'var(--soft-2)', border: '1.5px solid var(--soft-border)', borderRadius: 'var(--r-lg)', boxShadow: '0 10px 20px -14px rgba(21,153,122,.45)' }}>
                <span className={`tile tile-${tone}`}><Icon size={19} /></span>
                <div className="flex-1">
                  <div className="title" style={{ fontSize: 13.5 }}>{r.title}</div>
                  <div className="points">{r.points_required} pts</div>
                </div>
                <Button size="sm" onClick={() => { setError(null); setTarget(r) }}>Redeem</Button>
              </div>
            )
          })}

          {locked.length > 0 && <div className="section-label" style={{ marginTop: 4 }}>Keep going</div>}
          {locked.map((r) => {
            const { Icon, tone } = rewardVisual(r.reward_type)
            const toGo = r.points_required - points
            return (
              <div key={r.id} className="card card--pad">
                <div className="flex items-center" style={{ gap: 11 }}>
                  <span className={`tile tile--sm tile-${tone}`}><Icon size={18} /></span>
                  <div className="flex-1">
                    <div className="title" style={{ fontSize: 13.5 }}>{r.title}</div>
                    <div className="meta" style={{ marginTop: 2 }}>{toGo} points to go</div>
                  </div>
                  <span className="points">{r.points_required}</span>
                </div>
                <ProgressBar value={(points / r.points_required) * 100} className="mt" />
              </div>
            )
          })}
        </div>
      </main>

      <BottomSheet open={!!target} onClose={() => setTarget(null)}>
        {target && (() => {
          const { Icon, tone } = rewardVisual(target.reward_type)
          return (
            <div className="center">
              <span className={`tile tile--lg tile-${tone}`} style={{ margin: '0 auto', width: 56, height: 56 }}><Icon size={26} /></span>
              <h2 className="h2" style={{ marginTop: 12 }}>Redeem {target.title}?</h2>
              <p className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                This uses <strong style={{ color: 'var(--primary-ink)' }}>{target.points_required} points</strong>. Your parent will get the request to make it happen.
              </p>
              <div className="card" style={{ padding: '4px 14px', marginTop: 14, textAlign: 'left' }}>
                <div className="flex between" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <span className="meta" style={{ fontWeight: 700 }}>You have</span>
                  <span style={{ fontSize: 13, fontWeight: 800 }} className="tnum">{points} pts</span>
                </div>
                <div className="flex between" style={{ padding: '10px 0' }}>
                  <span className="meta" style={{ fontWeight: 700 }}>Left after</span>
                  <span style={{ fontSize: 13, fontWeight: 800 }} className="tnum">{points - target.points_required} pts</span>
                </div>
              </div>
              {error && (
                <div style={{ color: 'var(--danger)', fontSize: 12.5, fontWeight: 700, marginTop: 12 }}>{error}</div>
              )}
              <div className="flex col" style={{ gap: 8, marginTop: 16 }}>
                <Button leftIcon={<Sparkles size={17} />} disabled={busy} onClick={confirmRedeem}>
                  {busy ? 'Redeeming...' : `Redeem for ${target.points_required} pts`}
                </Button>
                <Button variant="ghost" onClick={() => setTarget(null)}>Maybe later</Button>
              </div>
            </div>
          )
        })()}
      </BottomSheet>
    </AppLayout>
  )
}
