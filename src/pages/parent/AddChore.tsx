import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Camera, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import type { ChoreRecurrence } from '@/types'
import { TopBar } from '@/components/layout/AppLayout'
import { Avatar, Button, Field, Input, Textarea, Segmented, Switch } from '@/components/ui'

const POINTS = [5, 10, 15, 25, 50, 100]

export function AddChore() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { members, refresh } = useFamily()
  const children = members.filter((m) => m.role === 'child')

  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [allChildren, setAllChildren] = useState(false)

  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<ChoreRecurrence>('none')
  const [points, setPoints] = useState(10)
  const [requiresPhoto, setRequiresPhoto] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const assigneeIds = allChildren ? children.map((c) => c.id) : [...selected]
  const canContinue = title.trim().length > 0 && assigneeIds.length > 0

  async function handleCreate() {
    if (!profile?.family_id || !user) return
    setError(null)
    setSaving(true)
    const rows = assigneeIds.map((id) => ({
      family_id: profile.family_id,
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: id,
      assigned_by: user.id,
      points_value: points,
      requires_photo: requiresPhoto,
      recurrence,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status: 'pending',
    }))
    const { error } = await supabase.from('chores').insert(rows)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    await refresh()
    navigate('/parent/chores')
  }

  return (
    <div className="ff-app">
      <TopBar
        onClose={() => navigate(-1)}
        title={step === 1 ? 'New chore' : 'Details'}
        right={<span className="pill pill--assigned">Step {step} of 2</span>}
      />

      {step === 1 ? (
        <main className="ff-main ff-main--notab">
          <div className="ff-scroll" style={{ gap: 16, marginTop: 6 }}>
            <Field label="Chore title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Make your bed" autoFocus />
            </Field>
            <Field label="Description" hint="optional">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add any details or instructions…" />
            </Field>
            <div>
              <div className="field__label" style={{ marginBottom: 8 }}>Assign to</div>
              <div className="chips">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${!allChildren && selected.has(c.id) ? 'is-on' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 7, opacity: allChildren ? 0.5 : 1 }}
                    onClick={() => !allChildren && toggle(c.id)}
                  >
                    <Avatar name={c.full_name} url={c.avatar_url} seed={c.id} size="sm" />
                    {c.full_name.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="card row-toggle" style={{ marginTop: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Assign to all kids</span>
                <Switch on={allChildren} onChange={setAllChildren} />
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="ff-footer">
            <Button disabled={!canContinue} onClick={() => setStep(2)}>Continue</Button>
          </div>
        </main>
      ) : (
        <main className="ff-main ff-main--notab">
          <div className="ff-scroll" style={{ gap: 16, marginTop: 6 }}>
            <Field label="Due date" hint="optional">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <div>
              <div className="field__label" style={{ marginBottom: 8 }}>Repeats</div>
              <Segmented
                value={recurrence}
                onChange={setRecurrence}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
              />
            </div>
            <div>
              <div className="field__label" style={{ marginBottom: 8 }}>Points</div>
              <div className="chips">
                {POINTS.map((p) => (
                  <button key={p} type="button" className={`chip ${points === p ? 'is-on' : ''}`} onClick={() => setPoints(p)}>
                    {p}
                  </button>
                ))}
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 0))}
                  style={{ width: 80, padding: '8px 10px', textAlign: 'center', fontSize: 13 }}
                  aria-label="Custom points"
                />
              </div>
            </div>
            <div className="card row-toggle">
              <span className="flex items-center" style={{ gap: 8, fontSize: 13, fontWeight: 700 }}>
                <Camera size={16} color="var(--muted)" /> Require photo proof
              </span>
              <Switch on={requiresPhoto} onChange={setRequiresPhoto} />
            </div>
            {error && (
              <div className="flex items-center" style={{ gap: 8, background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--r-md)', padding: '11px 13px', fontSize: 12.5, fontWeight: 700 }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <div className="ff-footer">
            <Button disabled={saving} leftIcon={<Check size={17} strokeWidth={2.4} />} onClick={handleCreate}>
              {saving ? 'Creating…' : assigneeIds.length > 1 ? `Create ${assigneeIds.length} chores` : 'Create chore'}
            </Button>
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
          </div>
        </main>
      )}
    </div>
  )
}
