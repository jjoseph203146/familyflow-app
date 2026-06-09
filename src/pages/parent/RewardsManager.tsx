import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { Reward } from '@/types'

const TEMPLATES = [
  { title: '$5 allowance', points_required: 100, reward_type: 'money' as const, emoji: '💵' },
  { title: '30 min extra screen time', points_required: 50, reward_type: 'screen_time' as const, emoji: '📱' },
  { title: 'Choose dinner', points_required: 75, reward_type: 'privilege' as const, emoji: '🍕' },
  { title: 'Skip one chore', points_required: 150, reward_type: 'privilege' as const, emoji: '😌' },
  { title: 'Movie night pick', points_required: 100, reward_type: 'privilege' as const, emoji: '🎬' },
  { title: '$10 spending money', points_required: 200, reward_type: 'money' as const, emoji: '💰' },
]

export function RewardsManager() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { rewards, refresh } = useFamily()
  const [showAdd, setShowAdd] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('')
  const [rewardType, setRewardType] = useState<Reward['reward_type']>('custom')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !points) { setError('Fill in all fields.'); return }
    setLoading(true)
    const { error } = await supabase.from('rewards').insert({
      family_id: profile?.family_id,
      title: title.trim(),
      points_required: parseInt(points),
      reward_type: rewardType,
      created_by: user?.id,
      is_active: true,
    })
    if (error) { setError(error.message); setLoading(false); return }
    await refresh()
    setTitle(''); setPoints(''); setRewardType('custom'); setError('')
    setLoading(false)
    setShowAdd(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('rewards').update({ is_active: false }).eq('id', deleteId)
    await refresh()
    setDeleteId(null)
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setTitle(t.title)
    setPoints(String(t.points_required))
    setRewardType(t.reward_type)
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Rewards" right={
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add reward
        </button>
      } />

      <div className="screen">
        {rewards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎁</div>
            <h3>No rewards yet</h3>
            <p className="text-sm text-muted">Add rewards that your family can redeem with points.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
              Add first reward
            </button>
          </div>
        ) : (
          <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rewards.map(reward => (
              <div key={reward.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{REWARD_EMOJI[reward.reward_type]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{reward.title}</div>
                  <div className="text-sm text-muted">⭐ {reward.points_required} points</div>
                </div>
                <button
                  onClick={() => setDeleteId(reward.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 6 }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add reward sheet */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError('') }}>
        <h3 style={{ marginBottom: 16 }}>Add a reward</h3>

        {/* Templates */}
        <div style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Suggestions</div>
          <div className="scroll-x">
            {TEMPLATES.map(t => (
              <button
                key={t.title}
                onClick={() => applyTemplate(t)}
                style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: 10,
                  border: '1.5px solid #E5E7EB', background: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{t.emoji}</span> {t.title}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Reward name</label>
            <input className="input-field" placeholder="e.g. $5 allowance" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Points required</label>
            <input className="input-field" type="number" placeholder="e.g. 100" value={points} onChange={e => setPoints(e.target.value)} />
          </div>
          <div>
            <div className="input-label" style={{ marginBottom: 8 }}>Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['money', 'screen_time', 'privilege', 'custom'] as Reward['reward_type'][]).map(t => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${rewardType === t ? 'active' : ''}`}
                  onClick={() => setRewardType(t)}
                >
                  {REWARD_EMOJI[t]} {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="notif-banner warning"><span>⚠️</span> {error}</div>}
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Adding…' : 'Add reward'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove this reward?"
        description="Members won't be able to see or redeem this reward anymore."
        confirmLabel="Yes, remove"
        cancelLabel="Cancel"
        danger
      />
    </AppLayout>
  )
}

const REWARD_EMOJI: Record<string, string> = {
  money: '💵',
  screen_time: '📱',
  privilege: '✨',
  custom: '🎁',
}
