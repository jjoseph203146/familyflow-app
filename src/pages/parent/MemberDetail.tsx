import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Flame, AlertCircle } from 'lucide-react'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import type { Chore } from '@/types'
import { TopBar } from '@/components/layout/AppLayout'
import { Avatar, Button, BottomSheet, Input, StatusPill, EmptyState } from '@/components/ui'
import { ChoreRow } from '@/components/ChoreRow'

type Tab = 'active' | 'done' | 'rejected'
const ADJUST = [-50, -25, -10, 10, 25, 50]

export function MemberDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { members, chores, refresh } = useFamily()
  const member = members.find((m) => m.id === id)

  const [tab, setTab] = useState<Tab>('active')
  const [editing, setEditing] = useState(false)
  const [balance, setBalance] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mine = useMemo(() => chores.filter((c) => c.assigned_to === id), [chores, id])

  if (!member) {
    return (
      <div className="ff-app">
        <TopBar title="Member" onBack={() => navigate(-1)} />
        <EmptyState icon={<AlertCircle size={26} />} title="Member not found" />
      </div>
    )
  }

  const doneCount = mine.filter((c) => c.status === 'approved').length
  const approvalRate = mine.length
    ? Math.round((doneCount / mine.filter((c) => c.status !== 'pending' && c.status !== 'in_progress').length || 1) * 100)
    : 0

  const filtered = mine.filter((c) => {
    if (tab === 'active') return c.status === 'pending' || c.status === 'in_progress' || c.status === 'submitted'
    if (tab === 'done') return c.status === 'approved'
    return c.status === 'rejected'
  })

  function openAdjust() {
    setBalance(member!.points_total)
    setError(null)
    setEditing(true)
  }

  async function save() {
    if (!member) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.rpc('set_member_points', {
      p_member_id: member.id,
      p_points: balance,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setEditing(false)
    await refresh()
  }

  return (
    <div className="ff-app">
      <TopBar title={member.full_name.split(' ')[0]} onBack={() => navigate(-1)} />
      <main className="ff-main ff-main--notab">
        <div className="ff-scroll">
          <div className="card card--pad flex items-center" style={{ gap: 12 }}>
            <Avatar name={member.full_name} url={member.avatar_url} square seed={member.id} size="lg" />
            <div className="flex-1">
              <div className="h2" style={{ fontSize: 16 }}>{member.full_name}</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--primary-ink)', letterSpacing: '-.02em', marginTop: 1 }}>
                {member.points_total} <span style={{ fontSize: 12, color: 'var(--muted)' }}>pts</span>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={openAdjust}>Adjust</Button>
          </div>

          <div className="flex" style={{ gap: 9 }}>
            <StatCard value={doneCount} label="Chores done" />
            <StatCard value={<span className="flex items-center" style={{ gap: 3 }}>{member.streak_current}<Flame size={15} color="#F2A50C" fill="#F2A50C" /></span>} label="Day streak" />
            <StatCard value={`${isFinite(approvalRate) ? approvalRate : 0}%`} label="Approved" />
          </div>

          <div className="segmented">
            {(['active', 'done', 'rejected'] as Tab[]).map((t) => (
              <button key={t} className={`segmented__opt ${tab === t ? 'is-on' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex col" style={{ gap: 9 }}>
            {filtered.length === 0 ? (
              <EmptyState icon={<AlertCircle size={24} />} title="Nothing here yet" body={`No ${tab} chores for ${member.full_name.split(' ')[0]}.`} />
            ) : (
              filtered.map((c: Chore) => (
                <ChoreRow key={c.id} chore={c} subtitle={undefined} onClick={() => navigate(`/parent/chores/${c.id}`)} rightSlot={<StatusPill status={c.status} />} />
              ))
            )}
          </div>
        </div>
      </main>

      <BottomSheet open={editing} onClose={() => setEditing(false)}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Adjust points</h2>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
          Set {member.full_name.split(' ')[0]}'s balance directly, or nudge it.
        </p>
        <div className="chips" style={{ marginBottom: 12 }}>
          {ADJUST.map((d) => (
            <button key={d} className="chip" onClick={() => setBalance((b) => Math.max(0, b + d))}>
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="field__label">Exact balance</label>
          <Input type="number" min={0} value={balance} onChange={(e) => setBalance(Math.max(0, Number(e.target.value) || 0))} />
        </div>
        {error && (
          <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <Button disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save balance'}</Button>
      </BottomSheet>
    </div>
  )
}

function StatCard({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="card" style={{ flex: 1, padding: '11px 10px' }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--muted)', marginTop: 1 }}>{label}</div>
    </div>
  )
}
