import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { formatDueDate } from '@/lib/utils'

type Tab = 'active' | 'history' | 'rejected'

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'pill-gray' },
  in_progress:{ label: 'In progress',cls: 'pill-indigo' },
  submitted:  { label: 'Submitted',  cls: 'pill-orange' },
  approved:   { label: 'Done',       cls: 'pill-green' },
  rejected:   { label: 'Rejected',   cls: 'pill-red' },
}

const QUICK_ADJUSTMENTS = [-50, -25, -10, +10, +25, +50]

export function MemberDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { members, chores, refresh } = useFamily()
  const [tab, setTab] = useState<Tab>('active')

  const [showBalance, setShowBalance] = useState(false)
  const [newBalance, setNewBalance] = useState('')
  const [balanceSaving, setBalanceSaving] = useState(false)

  const member = members.find(m => m.id === id)
  const memberChores = chores.filter(c => c.assigned_to === id || c.assigned_to === null)

  const tabChores = {
    active: memberChores.filter(c => ['pending', 'in_progress', 'submitted'].includes(c.status)),
    history: memberChores.filter(c => c.status === 'approved'),
    rejected: memberChores.filter(c => c.status === 'rejected'),
  }

  const totalDone = memberChores.filter(c => c.status === 'approved').length

  function openBalanceEditor() {
    setNewBalance(String(member?.points_total ?? 0))
    setShowBalance(true)
  }

  async function handleSaveBalance() {
    if (!member) return
    const val = parseInt(newBalance)
    if (isNaN(val) || val < 0) return
    setBalanceSaving(true)
    await supabase.rpc('set_member_points', { p_member_id: member.id, p_points: val })
    await refresh()
    setBalanceSaving(false)
    setShowBalance(false)
  }

  function adjust(delta: number) {
    setNewBalance(prev => String(Math.max(0, (parseInt(prev) || 0) + delta)))
  }

  if (!member) {
    return (
      <AppLayout tabBar={<ParentTabBar />}>
        <TopBar onBack={() => navigate(-1)} title="Member" />
        <div className="empty-state"><p>Member not found.</p></div>
      </AppLayout>
    )
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <div className="screen">
        {/* Hero */}
        <div className="hero-gradient" style={{ paddingTop: 48 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '6px 12px', color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: 16, fontSize: 14 }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={member.full_name} userId={member.id} size="xl" imageUrl={member.avatar_url} />
            <div>
              <h2 style={{ color: '#fff' }}>{member.full_name}</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' }}>{member.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 20, alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>⭐ {member.points_total}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Total points</div>
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{totalDone}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Chores done</div>
            </div>
            {member.streak_current > 0 && (
              <div>
                <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>🔥 {member.streak_current}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Day streak</div>
              </div>
            )}
            <button
              onClick={openBalanceEditor}
              style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: 10, padding: '6px 14px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              Edit balance
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 16px 0' }}>
          <div className="segment">
            {(['active', 'history', 'rejected'] as Tab[]).map(t => (
              <button
                key={t}
                className={`seg-btn ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} ({tabChores[t].length})
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tabChores[tab].length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <p className="text-muted">No chores here.</p>
            </div>
          ) : (
            tabChores[tab].map(chore => {
              const pill = STATUS_PILL[chore.status] ?? STATUS_PILL.pending
              return (
                <div key={chore.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="chore-title">{chore.title}</div>
                    {chore.due_date && <div className="chore-meta">{formatDueDate(chore.due_date)}</div>}
                    {chore.status === 'rejected' && chore.rejection_comment && (
                      <div style={{ marginTop: 4, padding: '6px 10px', background: '#FEE2E2', borderRadius: 8, fontSize: 13, color: '#B91C1C' }}>
                        "{chore.rejection_comment}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`pill ${pill.cls}`}>{pill.label}</span>
                    <span className="text-xs text-muted">⭐ {chore.points_value}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Balance editor modal */}
      <Modal open={showBalance} onClose={() => setShowBalance(false)}>
        <h3 style={{ marginBottom: 4 }}>Edit point balance</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 20 }}>
          Current balance: <strong>⭐ {member.points_total}</strong>
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {QUICK_ADJUSTMENTS.map(delta => (
            <button
              key={delta}
              type="button"
              onClick={() => adjust(delta)}
              style={{
                padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                background: delta > 0 ? '#F0FDF4' : '#FEF2F2',
                color: delta > 0 ? '#15803D' : '#B91C1C',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>

        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Set exact balance</label>
          <input
            className="input-field"
            type="number"
            min="0"
            value={newBalance}
            onChange={e => setNewBalance(e.target.value.replace(/\D/g, ''))}
            style={{ fontWeight: 700, fontSize: 20, textAlign: 'center' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-full" onClick={() => setShowBalance(false)}>Cancel</button>
          <button className="btn btn-primary btn-full" disabled={balanceSaving} onClick={handleSaveBalance}>
            {balanceSaving ? 'Saving…' : 'Save balance'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  )
}
