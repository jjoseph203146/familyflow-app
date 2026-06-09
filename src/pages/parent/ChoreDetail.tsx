import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Toggle } from '@/components/ui/Toggle'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { formatDueDate } from '@/lib/utils'
import type { ChoreRecurrence } from '@/types'

const POINT_PRESETS = [10, 20, 30, 50, 100]

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'Pending',     cls: 'pill-gray' },
  in_progress: { label: 'In progress', cls: 'pill-indigo' },
  submitted:   { label: 'Submitted',   cls: 'pill-orange' },
  approved:    { label: 'Done',        cls: 'pill-green' },
  rejected:    { label: 'Rejected',    cls: 'pill-red' },
}

export function ChoreDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { chores, members, refresh } = useFamily()

  const chore = chores.find(c => c.id === id)
  const assignee = chore?.assigned_to ? members.find(m => m.id === chore.assigned_to) : null

  // Edit state — pre-filled from chore
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [assignAll, setAssignAll] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<ChoreRecurrence>('none')
  const [points, setPoints] = useState(30)
  const [customPoints, setCustomPoints] = useState('')
  const [requiresPhoto, setRequiresPhoto] = useState(false)

  function openEdit() {
    if (!chore) return
    setTitle(chore.title)
    setDescription(chore.description ?? '')
    setAssignedTo(chore.assigned_to)
    setAssignAll(chore.assigned_to === null)
    setDueDate(chore.due_date ? toLocalDatetimeInput(chore.due_date) : '')
    setRecurrence(chore.recurrence)
    setPoints(POINT_PRESETS.includes(chore.points_value) ? chore.points_value : 0)
    setCustomPoints(POINT_PRESETS.includes(chore.points_value) ? '' : String(chore.points_value))
    setRequiresPhoto(chore.requires_photo)
    setError('')
    setShowEdit(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Chore name is required.'); return }
    setSaving(true)
    setError('')

    const finalPoints = customPoints ? parseInt(customPoints) || points : points

    const { error: updateError } = await supabase
      .from('chores')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: assignAll ? null : assignedTo,
        points_value: finalPoints,
        requires_photo: requiresPhoto,
        recurrence,
        due_date: dueDate || null,
      })
      .eq('id', chore!.id)

    if (updateError) { setError(updateError.message); setSaving(false); return }

    await refresh()
    setSaving(false)
    setShowEdit(false)
  }

  async function handleDelete() {
    if (!chore) return
    await supabase.from('chores').delete().eq('id', chore.id)
    await refresh()
    navigate(-1)
  }

  if (!chore) {
    return (
      <AppLayout tabBar={<ParentTabBar />}>
        <TopBar title="Chore" onBack={() => navigate(-1)} />
        <div className="empty-state"><p>Chore not found.</p></div>
      </AppLayout>
    )
  }

  const pill = STATUS_PILL[chore.status] ?? STATUS_PILL.pending
  const now = new Date()
  const isOverdue = chore.due_date && new Date(chore.due_date) < now && chore.status !== 'approved'

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar
        title="Chore detail"
        onBack={() => navigate(-1)}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={openEdit}>Edit</button>
            <button className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} onClick={() => setShowDelete(true)}>Delete</button>
          </div>
        }
      />

      <div className="screen screen-padded">
        {/* Title + status */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <h2 style={{ flex: 1 }}>{chore.title}</h2>
            <span className={`pill ${pill.cls}`}>{pill.label}</span>
          </div>
          {chore.description && <p className="text-muted" style={{ fontSize: 15 }}>{chore.description}</p>}
        </div>

        {/* Details card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <DetailRow label="Assigned to">
            {assignee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={assignee.full_name} userId={assignee.id} size="sm" imageUrl={assignee.avatar_url} />
                <span style={{ fontWeight: 600 }}>{assignee.full_name}</span>
              </div>
            ) : (
              <span style={{ fontWeight: 600 }}>Everyone</span>
            )}
          </DetailRow>

          <DetailRow label="Points">
            <span className="pill pill-amber">⭐ {chore.points_value} pts</span>
          </DetailRow>

          <DetailRow label="Due">
            <span style={{ fontWeight: 600, color: isOverdue ? '#EF4444' : '#111827' }}>
              {chore.due_date ? formatDueDate(chore.due_date) : 'No due date'}
            </span>
          </DetailRow>

          <DetailRow label="Repeats">
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {chore.recurrence === 'none' ? 'One time' : chore.recurrence}
            </span>
          </DetailRow>

          <DetailRow label="Photo proof">
            <span style={{ fontWeight: 600 }}>{chore.requires_photo ? 'Required' : 'Not required'}</span>
          </DetailRow>
        </div>

        {/* Rejection comment if rejected */}
        {chore.status === 'rejected' && chore.rejection_comment && (
          <div style={{ padding: '12px 14px', background: '#FEF2F2', borderRadius: 12, borderLeft: '3px solid #EF4444', marginBottom: 16 }}>
            <div className="text-sm" style={{ fontWeight: 700, color: '#B91C1C', marginBottom: 4 }}>Rejection reason</div>
            <div style={{ fontSize: 14 }}>{chore.rejection_comment}</div>
          </div>
        )}

        {/* Submitted photo */}
        {chore.photo_url && (
          <div style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 8 }}>Submitted photo</div>
            <img
              src={chore.photo_url}
              alt="Proof"
              style={{ width: '100%', borderRadius: 16, aspectRatio: '4/3', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Review button if submitted */}
        {chore.status === 'submitted' && (
          <button className="btn btn-primary btn-full" onClick={() => navigate('/parent/review')}>
            Review submission →
          </button>
        )}
      </div>

      {/* Edit bottom sheet */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)}>
        <h3 style={{ marginBottom: 16 }}>Edit chore</h3>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Chore name</label>
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Details <span className="text-muted">(optional)</span></label>
            <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <div className="input-label" style={{ marginBottom: 8 }}>Assign to</div>
            <Toggle
              on={assignAll}
              onChange={v => { setAssignAll(v); if (v) setAssignedTo(null) }}
              label="All family members"
            />
            {!assignAll && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAssignedTo(assignedTo === m.id ? null : m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 10,
                      border: `2px solid ${assignedTo === m.id ? '#5C5CE0' : '#E5E7EB'}`,
                      background: assignedTo === m.id ? '#EEF0FD' : '#fff',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Avatar name={m.full_name} userId={m.id} size="sm" imageUrl={m.avatar_url} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: assignedTo === m.id ? '#5C5CE0' : '#374151' }}>
                      {m.full_name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Due date</label>
            <input className="input-field" type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>

          <div>
            <div className="input-label" style={{ marginBottom: 8 }}>Repeats</div>
            <div className="segment">
              {(['none', 'daily', 'weekly', 'monthly'] as ChoreRecurrence[]).map(r => (
                <button key={r} type="button" className={`seg-btn ${recurrence === r ? 'active' : ''}`} onClick={() => setRecurrence(r)}>
                  {r === 'none' ? 'Once' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="input-label" style={{ marginBottom: 8 }}>Points</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {POINT_PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPoints(p); setCustomPoints('') }}
                  style={{
                    padding: '8px 14px', borderRadius: 10,
                    border: `2px solid ${points === p && !customPoints ? '#5C5CE0' : '#E5E7EB'}`,
                    background: points === p && !customPoints ? '#EEF0FD' : '#fff',
                    color: points === p && !customPoints ? '#5C5CE0' : '#374151',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
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
                style={{ width: 80, textAlign: 'center', fontWeight: 700 }}
              />
            </div>
          </div>

          <Toggle on={requiresPhoto} onChange={setRequiresPhoto} label="Require photo proof" />

          {error && <div className="notif-banner warning"><span>⚠️</span> {error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost btn-full" onClick={() => setShowEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete this chore?"
        description={`"${chore.title}" will be permanently deleted for all family members.`}
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        danger
      />
    </AppLayout>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span className="text-sm text-muted">{label}</span>
      {children}
    </div>
  )
}

function toLocalDatetimeInput(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
