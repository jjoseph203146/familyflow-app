import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Toggle } from '@/components/ui/Toggle'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import type { ChoreRecurrence } from '@/types'

const POINT_PRESETS = [10, 20, 30, 50, 100]

export function AddChore() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { members, refresh } = useFamily()
  const [step, setStep] = useState(1)

  // Step 1
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [assignAll, setAssignAll] = useState(false)

  // Step 2
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [recurrence, setRecurrence] = useState<ChoreRecurrence>('none')
  const [points, setPoints] = useState(30)
  const [customPoints, setCustomPoints] = useState('')
  const [requiresPhoto, setRequiresPhoto] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const assignableMembers = members.filter(m => m.id !== user?.id)

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Please enter a chore name.'); return }
    if (!assignedTo && !assignAll) { setError('Please assign this chore to someone.'); return }
    setError('')
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    const finalPoints = customPoints ? parseInt(customPoints) || points : points

    const chore = {
      family_id: profile?.family_id,
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignAll ? null : assignedTo,
      assigned_by: user.id,
      points_value: finalPoints,
      requires_photo: requiresPhoto,
      recurrence,
      due_date: dueDate || null,
      status: 'pending',
    }

    const { error } = await supabase.from('chores').insert(chore)
    if (error) { setError(error.message); setLoading(false); return }

    await refresh()
    navigate(-1)
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: 8, minWidth: 0 }} onClick={() => step === 1 ? navigate(-1) : setStep(1)}>
            ←
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, flex: 1 }}>
            {step === 1 ? 'What & who' : 'When & details'}
          </span>
          <span className="text-sm text-muted">Step {step} of 2</span>
        </div>

        {/* Step progress bar */}
        <div className="step-bar" style={{ padding: '12px 16px' }}>
          <div className={`step-bar-segment ${step >= 1 ? 'filled' : ''}`} />
          <div className={`step-bar-segment ${step >= 2 ? 'filled' : ''}`} />
        </div>

        <div className="screen screen-padded">
          {step === 1 ? (
            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 100 }}>
              <div className="input-group">
                <label className="input-label">What needs to be done?</label>
                <input
                  className="input-field"
                  placeholder="e.g. Clean room · Empty dishwasher · Feed the dog"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label className="input-label">Details <span className="text-muted">(optional)</span></label>
                <textarea
                  className="input-field"
                  placeholder="Add any specific instructions…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div>
                <div className="input-label" style={{ marginBottom: 12 }}>Assign to</div>
                <Toggle
                  on={assignAll}
                  onChange={(v) => { setAssignAll(v); if (v) setAssignedTo(null) }}
                  label="Assign to all family members"
                />

                {!assignAll && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                    {assignableMembers.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setAssignedTo(assignedTo === member.id ? null : member.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 14px', borderRadius: 12,
                          border: `2px solid ${assignedTo === member.id ? '#5C5CE0' : '#E5E7EB'}`,
                          background: assignedTo === member.id ? '#EEF0FD' : '#fff',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <Avatar name={member.full_name} userId={member.id} size="sm" imageUrl={member.avatar_url} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: assignedTo === member.id ? '#5C5CE0' : '#374151' }}>
                          {member.full_name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                    {assignableMembers.length === 0 && (
                      <p className="text-sm text-muted">No other family members yet. You can still create this chore.</p>
                    )}
                  </div>
                )}
              </div>

              {error && <div className="notif-banner warning"><span>⚠️</span> {error}</div>}

              <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 4 }}>
                Next: When & details →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 100 }}>
              <div className="input-group">
                <label className="input-label">Due date</label>
                <input
                  className="input-field"
                  type="datetime-local"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>

              <div>
                <div className="input-label" style={{ marginBottom: 10 }}>Repeats</div>
                <div className="segment">
                  {(['none', 'daily', 'weekly', 'monthly'] as ChoreRecurrence[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      className={`seg-btn ${recurrence === r ? 'active' : ''}`}
                      onClick={() => setRecurrence(r)}
                    >
                      {r === 'none' ? 'One time' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="input-label" style={{ marginBottom: 10 }}>Points value</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {POINT_PRESETS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPoints(p); setCustomPoints('') }}
                      style={{
                        padding: '9px 16px', borderRadius: 10,
                        border: `2px solid ${points === p && !customPoints ? '#5C5CE0' : '#E5E7EB'}`,
                        background: points === p && !customPoints ? '#EEF0FD' : '#fff',
                        color: points === p && !customPoints ? '#5C5CE0' : '#374151',
                        fontWeight: 700, fontSize: 15, cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <input
                    className="input-field"
                    placeholder="Custom"
                    value={customPoints}
                    onChange={e => { setCustomPoints(e.target.value.replace(/\D/g, '')); setPoints(0) }}
                    style={{ width: 90, textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              </div>

              <Toggle
                on={requiresPhoto}
                onChange={setRequiresPhoto}
                label="Require photo proof"
                description="Best for chores that need visual confirmation, like cleaning or yard work."
              />

              {error && <div className="notif-banner warning"><span>⚠️</span> {error}</div>}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? 'Creating chore…' : 'Create chore ✓'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

function defaultDueDate(): string {
  const d = new Date()
  d.setHours(18, 0, 0, 0)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
