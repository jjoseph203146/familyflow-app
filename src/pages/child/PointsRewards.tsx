import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ChildTabBar } from '@/components/layout/TabBar'
import { Reward } from '@/types'

const REWARD_EMOJI: Record<string, string> = {
  money: '💵',
  screen_time: '📱',
  privilege: '✨',
  custom: '🎁',
}

export function PointsRewards() {
  const { profile, refreshProfile } = useAuth()
  const { rewards, refresh } = useFamily()
  const [confirmReward, setConfirmReward] = useState<Reward | null>(null)
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pts = profile?.points_total ?? 0
  const unlocked = rewards.filter(r => r.points_required <= pts)
  const locked = rewards.filter(r => r.points_required > pts).sort((a, b) => a.points_required - b.points_required)

  async function handleRedeem(reward: Reward) {
    if (!profile) return
    setLoading(true)

    await supabase.from('profiles').update({ points_total: pts - reward.points_required }).eq('id', profile.id)
    await supabase.from('redemptions').insert({
      reward_id: reward.id,
      redeemed_by: profile.id,
      family_id: profile.family_id,
      status: 'pending',
      requested_at: new Date().toISOString(),
    })

    await refreshProfile()
    await refresh()
    setLoading(false)
    setConfirmReward(null)
    setRedeemSuccess(reward.title)
    setTimeout(() => setRedeemSuccess(null), 3000)
  }

  return (
    <AppLayout tabBar={<ChildTabBar />}>
      <div className="screen">
        {/* Hero points display */}
        <div className="hero-gradient">
          <div style={{ marginBottom: 8, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Your balance</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1 }}>⭐ {pts}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6 }}>points</div>
          {profile?.streak_current && profile.streak_current > 0 ? (
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 14px', color: '#fff', fontSize: 14, fontWeight: 600 }}>
              🔥 {profile.streak_current} day streak
            </div>
          ) : null}
        </div>

        {redeemSuccess && (
          <div className="notif-banner success" style={{ margin: '12px 16px 0' }}>
            <span>🎉</span> Redeemed "{redeemSuccess}" — waiting for parent approval!
          </div>
        )}

        <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 }}>
          {/* Unlocked rewards */}
          {unlocked.length > 0 && (
            <div>
              <div className="section-title" style={{ marginBottom: 10 }}>Ready to redeem 🎉</div>
              {unlocked.map(reward => (
                <div key={reward.id} className="card" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 32 }}>{REWARD_EMOJI[reward.reward_type]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{reward.title}</div>
                    <div className="text-sm" style={{ color: '#22C55E' }}>⭐ {reward.points_required} pts</div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setConfirmReward(reward)}
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Locked rewards */}
          {locked.length > 0 && (
            <div>
              <div className="section-title" style={{ marginBottom: 10 }}>Keep earning 🔒</div>
              {locked.map(reward => {
                const needed = reward.points_required - pts
                const progress = Math.max(0, Math.min(100, (pts / reward.points_required) * 100))
                return (
                  <div key={reward.id} className="card" style={{ marginBottom: 10, opacity: 0.75 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ fontSize: 32 }}>{REWARD_EMOJI[reward.reward_type]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{reward.title}</div>
                        <div className="text-sm text-muted">Need {needed} more pts</div>
                      </div>
                      <span className="pill pill-gray">🔒 {reward.points_required}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%`, background: '#F59E0B' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {rewards.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎁</div>
              <p className="text-muted">No rewards set up yet. Ask a parent to add some!</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm redeem */}
      {confirmReward && (
        <Modal open={true} onClose={() => setConfirmReward(null)}>
          <div style={{ textAlign: 'center', paddingBottom: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{REWARD_EMOJI[confirmReward.reward_type]}</div>
            <h3 style={{ marginBottom: 6 }}>Redeem "{confirmReward.title}"?</h3>
            <p className="text-muted" style={{ fontSize: 14, marginBottom: 20 }}>
              This will use ⭐ {confirmReward.points_required} points. A parent will need to approve your request.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary btn-full"
                onClick={() => handleRedeem(confirmReward)}
                disabled={loading}
              >
                {loading ? 'Redeeming…' : 'Yes, redeem!'}
              </button>
              <button className="btn btn-ghost btn-full" onClick={() => setConfirmReward(null)}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  )
}
