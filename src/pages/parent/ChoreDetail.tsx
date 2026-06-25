import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, Camera, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import type { ChoreRecurrence } from '@/types'
import { TopBar } from '@/components/layout/AppLayout'
import {
  Avatar,
  Button,
  BottomSheet,
  Field,
  Input,
  Textarea,
  Segmented,
  Switch,
  StatusPill,
  ProofImage,
  EmptyState,
} from '@/components/ui'
import { isOverdue, formatDue, relative } from '@/lib/format'

const POINTS = [5, 10, 15, 25, 50, 100]

export function ChoreDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { chores, members, refresh } = useFamily()
  const chore = chores.find((c) => c.id === id)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigned_to: '' as string | null,
    due_date: '',
    recurrence: 'none' as ChoreRecurrence,
    points_value: 10,
    requires_photo: true,
  })

  if (!chore) {
    return (
      <div className="ff-app">
        <TopBar title="Chore" onBack={() => navigate(-1)} />
        <EmptyState icon={<AlertCircle size={26} />} title="Chore not found" body="It may have been deleted." />
      </div>
    )
  }

  const children = members.filter((m) => m.role === 'child')
  const overdue = isOverdue(chore)

  function openEdit() {
    if (!chore) return
    setForm({
      title: chore.title,
      description: chore.description ?? '',
      assigned_to: chore.assigned_to,
      due_date: chore.due_date ? chore.due_date.slice(0, 10) : '',
      recurrence: chore.recurrence,
      points_value: chore.points_value,
      requires_photo: chore.requires_photo,
    })
    setError(null)
    setEditing(true)
  }

  async function saveEdit() {
    if (!chore) return
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('chores')
      .update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        assigned_to: form.assigned_to,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        recurrence: form.recurrence,
        points_value: form.points_value,
        requires_photo: form.requires_photo,
      })
      .eq('id', chore.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setEditing(false)
    await refresh()
  }

  async function remove() {
    if (!chore) return
    if (!window.confirm('Delete this chore? This cannot be undone.')) return
    const { error } = await supabase.from('chores').delete().eq('id', chore.id)
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
        title="Chore"
        onBack={() => navigate(-1)}
        right={
          <button className="icon-btn" onClick={openEdit} aria-label="Edit chore">
            <Pencil size={17} />
          </button>
        }
      />
      <main className="ff-main ff-main--notab">
        <div className="ff-scroll">
          <div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <StatusPill status={chore.status} overdue={overdue} />
              <span className="pill pill--points">+{chore.points_value} pts</span>
            </div>
            <h1 className="h1" style={{ marginTop: 8 }}>{chore.title}</h1>
            {chore.description && (
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>{chore.description}</p>
            )}
          </div>

          {chore.status === 'rejected' && chore.rejection_comment && (
            <div className="card" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger-border)', padding: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--danger)' }}>SENT BACK FOR A REDO</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 5, lineHeight: 1.5 }}>"{chore.rejection_comment}"</div>
            </div>
          )}

          <div className="card" style={{ padding: '4px 14px' }}>
            <Row label="Assigned to">
              <span className="flex items-center" style={{ gap: 6, fontWeight: 800, fontSize: 12.5 }}>
                <Avatar name={chore.assignee?.full_name} seed={chore.assigned_to} size="sm" />
                {chore.assignee?.full_name ?? 'Unassigned'}
              </span>
            </Row>
            <Row label="Due" last={false}>{formatDue(chore.due_date)}</Row>
            <Row label="Repeats" last={false}>{chore.recurrence === 'none' ? 'Does not repeat' : chore.recurrence}</Row>
            <Row label="Photo proof" last>
              <span style={{ color: chore.requires_photo ? 'var(--primary-ink)' : 'var(--muted)' }}>
                {chore.requires_photo ? 'Required' : 'Optional'}
              </span>
            </Row>
          </div>

          {(chore.status === 'submitted' || chore.status === 'approved') && chore.photo_url && (
            <div>
              <div className="section-label" style={{ marginBottom: 7 }}>
                Submitted proof{chore.submitted_at ? ` · ${relative(chore.submitted_at)}` : ''}
              </div>
              <ProofImage src={chore.photo_url} height={160} />
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div className="ff-footer">
          {chore.status === 'submitted' && (
            <Button onClick={() => navigate('/parent/review')}>Review submission</Button>
          )}
          <div className="flex" style={{ gap: 9 }}>
            <Button variant="secondary" leftIcon={<Pencil size={15} />} onClick={openEdit}>Edit</Button>
            <Button variant="danger-soft" leftIcon={<Trash2 size={15} />} onClick={remove}>Delete</Button>
          </div>
        </div>
      </main>

      <BottomSheet open={editing} onClose={() => setEditing(false)}>
        <div style={{ maxHeight: '74vh', overflowY: 'auto' }}>
          <h2 className="h2" style={{ marginBottom: 14 }}>Edit chore</h2>
          <div className="flex col" style={{ gap: 14 }}>
            <Field label="Title">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Description" hint="optional">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div>
              <div className="field__label" style={{ marginBottom: 8 }}>Assigned to</div>
              <div className="chips">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${form.assigned_to === c.id ? 'is-on' : ''}`}
                    onClick={() => setForm({ ...form, assigned_to: c.id })}
                  >
                    {c.full_name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Due date" hint="optional">
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
            <div>
              <div className="field__label" style={{ marginBottom: 8 }}>Repeats</div>
              <Segmented
                value={form.recurrence}
                onChange={(v) => setForm({ ...form, recurrence: v })}
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
                  <button key={p} type="button" className={`chip ${form.points_value === p ? 'is-on' : ''}`} onClick={() => setForm({ ...form, points_value: p })}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="card row-toggle">
              <span className="flex items-center" style={{ gap: 8, fontSize: 13, fontWeight: 700 }}>
                <Camera size={16} color="var(--muted)" /> Require photo proof
              </span>
              <Switch on={form.requires_photo} onChange={(v) => setForm({ ...form, requires_photo: v })} />
            </div>
            {error && (
              <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <Button disabled={saving || !form.title.trim()} onClick={saveEdit}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

function Row({ label, children, last = false }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex between items-center"
      style={{ padding: '11px 0', borderBottom: last ? 'none' : '1px solid var(--line)' }}
    >
      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 800 }}>{children}</span>
    </div>
  )
}
