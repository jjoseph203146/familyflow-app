import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, PartyPopper } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { TopBar } from '@/components/layout/AppLayout'
import { Avatar, Button, BottomSheet, Textarea, ProofImage, EmptyState } from '@/components/ui'
import { relative } from '@/lib/format'

const BONUSES = [5, 10]
const REJECT_REASONS = [
  'Not finished yet',
  'Photo is unclear',
  'Please redo more neatly',
  'Missing part of the task',
  'Wrong photo',
  'Other',
]

export function ReviewProof() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { chores, refresh } = useFamily()

  const queue = chores.filter((c) => c.status === 'submitted')
  const [index, setIndex] = useState(0)
  const [bonus, setBonus] = useState(0)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (index >= queue.length && queue.length > 0) setIndex(queue.length - 1)
  }, [queue.length, index])

  const chore = queue[index]

  if (!chore) {
    return (
      <div className="ff-app">
        <TopBar title="Review" onBack={() => navigate('/parent')} />
        <EmptyState
          icon={<PartyPopper size={26} />}
          title="All caught up!"
          body="There are no submissions waiting for your review."
          action={<Button onClick={() => navigate('/parent')}>Back to home</Button>}
        />
      </div>
    )
  }

  async function approve() {
    if (!chore || !user) return
    setBusy(true)
    const { error } = await supabase.rpc('approve_chore', {
      p_chore_id: chore.id,
      p_approver_id: user.id,
      p_bonus: bonus,
    })
    setBusy(false)
    if (error) {
      window.alert(error.message)
      return
    }
    setBonus(0)
    await refresh()
  }

  async function confirmReject() {
    if (!chore) return
    const comment = reason === 'Other' ? note.trim() : [reason, note.trim()].filter(Boolean).join(' — ')
    setBusy(true)
    const { error } = await supabase.rpc('reject_chore', {
      p_chore_id: chore.id,
      p_comment: comment || null,
    })
    setBusy(false)
    if (error) {
      window.alert(error.message)
      return
    }
    setRejecting(false)
    setReason(null)
    setNote('')
    await refresh()
  }

  return (
    <div className="ff-app">
      <TopBar
        title="Review"
        onClose={() => navigate('/parent')}
        right={<span className="pill pill--assigned">{index + 1} of {queue.length}</span>}
      />
      <main className="ff-main ff-main--notab">
        <div className="ff-scroll">
          <ProofImage src={chore.photo_url} hint="CHILD'S PHOTO PROOF" height={240} />

          <div className="flex between items-center">
            <div>
              <div className="h2" style={{ fontSize: 17 }}>{chore.title}</div>
              <div className="flex items-center" style={{ gap: 6, marginTop: 5 }}>
                <Avatar name={chore.assignee?.full_name} seed={chore.assigned_to} size="sm" />
                <span className="meta" style={{ fontWeight: 700 }}>
                  {chore.assignee?.full_name?.split(' ')[0]} · submitted {relative(chore.submitted_at)}
                </span>
              </div>
            </div>
            <span className="pill pill--points" style={{ fontSize: 12, padding: '6px 10px' }}>+{chore.points_value}</span>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: 7 }}>
              Add a bonus <span style={{ color: 'var(--faint)', fontWeight: 600 }}>· optional</span>
            </div>
            <div className="chips">
              {BONUSES.map((b) => (
                <button key={b} className={`chip ${bonus === b ? 'is-on' : ''}`} onClick={() => setBonus(bonus === b ? 0 : b)}>
                  +{b}
                </button>
              ))}
              {bonus > 0 && !BONUSES.includes(bonus) && <span className="chip is-on">+{bonus}</span>}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div className="ff-footer">
          <div className="flex" style={{ gap: 9 }}>
            <Button variant="danger-soft" leftIcon={<X size={16} />} onClick={() => setRejecting(true)} disabled={busy}>
              Reject
            </Button>
            <Button leftIcon={<Check size={17} strokeWidth={2.6} />} onClick={approve} disabled={busy} style={{ flex: 1.5 }}>
              Approve{bonus ? ` · +${chore.points_value + bonus}` : ` · +${chore.points_value}`}
            </Button>
          </div>
        </div>
      </main>

      <BottomSheet open={rejecting} onClose={() => setRejecting(false)}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Why send it back?</h2>
        <p className="muted" style={{ fontSize: 12, marginBottom: 14, lineHeight: 1.45 }}>
          {chore.assignee?.full_name?.split(' ')[0]} will see this so they know exactly what to fix.
        </p>
        <div className="flex col" style={{ gap: 8 }}>
          {REJECT_REASONS.map((r) => (
            <button key={r} type="button" className={`option ${reason === r ? 'is-on' : ''}`} onClick={() => setReason(r)}>
              <span className={`radio ${reason === r ? 'is-on' : ''}`} />
              <span className="option__title">{r}</span>
            </button>
          ))}
        </div>
        {reason === 'Other' && (
          <div className="field" style={{ marginTop: 11 }}>
            <label className="field__label">Add a short note</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell them what to fix…" autoFocus />
          </div>
        )}
        <div className="flex" style={{ gap: 10, marginTop: 14 }}>
          <Button variant="secondary" onClick={() => setRejecting(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmReject} disabled={busy || !reason || (reason === 'Other' && !note.trim())} style={{ flex: 1.4 }}>
            Send back
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
