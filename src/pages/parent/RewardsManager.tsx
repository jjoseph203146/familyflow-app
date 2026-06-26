import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Gift, AlertCircle, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import type { Reward } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { Switch, EmptyState, Button, BottomSheet, Field, Input } from '@/components/ui'
import { rewardVisual } from '@/components/rewardVisual'

type RewardType = Reward['reward_type']

const TYPES: { value: RewardType; label: string }[] = [
  { value: 'money', label: 'Money' },
  { value: 'screen_time', label: 'Screen time' },
  { value: 'privilege', label: 'Privilege' },
  { value: 'custom', label: 'Custom' },
]

const TEMPLATES: { title: string; type: RewardType; points: number }[] = [
  { title: 'Movie night', type: 'privilege', points: 400 },
  { title: '1 hour screen time', type: 'screen_time', points: 150 },
  { title: '$10 cash', type: 'money', points: 1000 },
  { title: 'Pick dinner', type: 'privilege', points: 250 },
]
const POINT_PRESETS = [100, 250, 400, 750, 1000]

export function RewardsManager() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { rewards, refresh } = useFamily()

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Reward | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<RewardType>('privilege')
  const [points, setPoints] = useState(400)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = rewards.filter((r) => r.is_active)
  const paused = rewards.filter((r) => !r.is_active)

  async function setActiveState(id: string, value: boolean) {
    await supabase.from('rewards').update({ is_active: value }).eq('id', id)
    await refresh()
  }

  function openAdd() {
    setTitle('')
    setType('privilege')
    setPoints(400)
    setError(null)
    setEditing(null)
    setAdding(true)
  }

  function openEdit(r: Reward) {
    setTitle(r.title)
    setType(r.reward_type)
    setPoints(r.points_required)
    setError(null)
    setEditing(r)
    setAdding(true)
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setTitle(t.title)
    setType(t.type)
    setPoints(t.points)
  }

  async function save() {
    if (editing) {
      setSaving(true)
      setError(null)
      const { error } = await supabase.from('rewards').update({
        title: title.trim(),
        points_required: points,
        reward_type: type,
      }).eq('id', editing.id)
      setSaving(false)
      if (error) { setError(error.message); return }
    } else {
      if (!profile?.family_id || !user) return
      setSaving(true)
      setError(null)
      const { error } = await supabase.from('rewards').insert({
        family_id: profile.family_id,
        title: title.trim(),
        description: null,
        points_required: points,
        reward_type: type,
        created_by: user.id,
        is_active: true,
      })
      setSaving(false)
      if (error) { setError(error.message); return }
    }
    setAdding(false)
    setEditing(null)
    await refresh()
  }

  async function deleteReward(id: string) {
    if (!window.confirm('Delete this reward? This cannot be undone.')) return
    const { error } = await supabase.from('rewards').delete().eq('id', id)
    if (error) { window.alert(error.message); return }
    await refresh()
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar
        title="Rewards"
        right={
          <button className="icon-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }} onClick={openAdd} aria-label="New reward">
            <Plus size={18} strokeWidth={2.4} />
          </button>
        }
      />
      <main className="ff-main">
        <div className="ff-scroll" style={{ gap: 10 }}>
          {rewards.length === 0 && (
            <EmptyState
              icon={<Gift size={26} />}
              title="No rewards yet"
              body="Create a reward your kids can work toward — it's what makes points worth earning."
              action={<Button onClick={openAdd}>Create a reward</Button>}
            />
          )}

          {active.map((r) => {
            const { Icon, tone, label } = rewardVisual(r.reward_type)
            return (
              <div key={r.id} className="card list-row">
                <span className={`tile tile-${tone}`}><Icon size={19} /></span>
                <div className="flex-1">
                  <div className="title" style={{ fontSize: 13.5 }}>{r.title}</div>
                  <div className="meta" style={{ color: 'var(--primary-ink)', fontWeight: 700, marginTop: 2 }}>
                    {r.points_required} pts · {label}
                  </div>
                </div>
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => openEdit(r)} aria-label="Edit">
                  <Pencil size={13} />
                </button>
                <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--danger)', opacity: 0.7 }} onClick={() => deleteReward(r.id)} aria-label="Delete">
                  <Trash2 size={13} />
                </button>
                <Switch on onChange={() => setActiveState(r.id, false)} />
              </div>
            )
          })}

          {paused.length > 0 && <div className="section-label" style={{ marginTop: 4 }}>Paused</div>}
          {paused.map((r) => {
            const { Icon, tone, label } = rewardVisual(r.reward_type)
            return (
              <div key={r.id} className="card list-row" style={{ opacity: 0.62 }}>
                <span className={`tile tile-${tone}`}><Icon size={19} /></span>
                <div className="flex-1">
                  <div className="title" style={{ fontSize: 13.5 }}>{r.title}</div>
                  <div className="meta" style={{ marginTop: 2 }}>{r.points_required} pts · {label}</div>
                </div>
                <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => openEdit(r)} aria-label="Edit">
                  <Pencil size={13} />
                </button>
                <button className="icon-btn" style={{ width: 28, height: 28, color: 'var(--danger)', opacity: 0.7 }} onClick={() => deleteReward(r.id)} aria-label="Delete">
                  <Trash2 size={13} />
                </button>
                <Switch on={false} onChange={() => setActiveState(r.id, true)} />
              </div>
            )
          })}
        </div>
      </main>

      <BottomSheet open={adding} onClose={() => { setAdding(false); setEditing(null) }}>
        <div style={{ maxHeight: '76vh', overflowY: 'auto' }}>
          <h2 className="h2" style={{ marginBottom: 12 }}>{editing ? 'Edit reward' : 'New reward'}</h2>

          {!editing && (
            <>
              <div className="section-label" style={{ marginBottom: 8 }}>Quick start</div>
              <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
                {TEMPLATES.map((t) => (
                  <button key={t.title} className="chip" style={{ flex: 'none' }} onClick={() => applyTemplate(t)}>
                    {t.title}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex col" style={{ gap: 14 }}>
            <Field label="Reward name">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Movie night" autoFocus />
            </Field>
            <div>
              <div className="field__label" style={{ marginBottom: 8 }}>Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TYPES.map((t) => {
                  const { Icon, tone } = rewardVisual(t.value)
                  const on = type === t.value
                  return (
                    <button
                      key={t.value}
                      className="card flex items-center"
                      style={{ gap: 8, padding: 10, borderColor: on ? 'var(--primary)' : 'var(--line)', borderWidth: on ? 1.5 : 1, boxShadow: 'none' }}
                      onClick={() => setType(t.value)}
                    >
                      <span className={`tile tile--sm tile-${tone}`}><Icon size={15} /></span>
                      <span style={{ fontSize: 12, fontWeight: on ? 800 : 700 }}>{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <Field label="Points to unlock">
              <Input type="number" min={1} value={points} onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 0))} />
            </Field>
            <div className="chips" style={{ marginTop: -4 }}>
              {POINT_PRESETS.map((p) => (
                <button key={p} className={`chip chip--soft ${points === p ? 'is-on' : ''}`} onClick={() => setPoints(p)}>{p}</button>
              ))}
            </div>

            {error && (
              <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <Button disabled={saving || !title.trim()} onClick={save}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create reward'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AppLayout>
  )
}
