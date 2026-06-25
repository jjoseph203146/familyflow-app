import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Gift, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import type { Chore, Profile } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'
import { ChoreRow } from '@/components/ChoreRow'
import { Avatar, Button, ProgressBar, SectionHeader } from '@/components/ui'
import { isOverdue, happenedToday } from '@/lib/format'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function childDayProgress(child: Profile, chores: Chore[]) {
  const mine = chores.filter((c) => c.assigned_to === child.id)
  const today = mine.filter(
    (c) =>
      (c.due_date && happenedToday(c.due_date)) ||
      (c.status === 'approved' && happenedToday(c.approved_at)),
  )
  const done = today.filter((c) => c.status === 'approved').length
  return { done, total: today.length }
}

export function ParentDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { family, members, chores, loading } = useFamily()

  if (loading) {
    return (
      <AppLayout tabBar={<ParentTabBar />}>
        <div className="page-loading"><div className="spinner" /></div>
      </AppLayout>
    )
  }

  const submissions = chores.filter((c) => c.status === 'submitted')
  const overdue = chores.filter(isOverdue)
  const doneToday = chores.filter((c) => c.status === 'approved' && happenedToday(c.approved_at))
  const active = chores.filter((c) => c.status === 'pending' || c.status === 'in_progress')
  const children = members.filter((m) => m.role === 'child')
  const myChores = chores.filter(
    (c) => c.assigned_to === profile?.id && c.status !== 'approved',
  )

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar
        transparent
        right={
          <Avatar name={profile?.full_name} url={profile?.avatar_url} square seed={profile?.id} />
        }
      />
      <main className="ff-main">
        <div className="ff-scroll">
          <div>
            <div className="eyebrow">{greeting()}</div>
            <div className="h1" style={{ marginTop: 3 }}>
              {profile?.full_name?.split(' ')[0] ?? 'there'}
            </div>
          </div>

          {submissions.length > 0 ? (
            <button className="hero" style={{ width: '100%', textAlign: 'left' }} onClick={() => navigate('/parent/review')}>
              <div className="hero__blob" style={{ width: 104, height: 104, right: -28, top: -28 }} />
              <div className="flex between items-center" style={{ position: 'relative' }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', opacity: 0.9 }}>
                  Needs your review
                </span>
                <div className="avatar-stack">
                  {submissions.slice(0, 3).map((c) => (
                    <span
                      key={c.id}
                      className="avatar avatar--sm"
                      style={{ background: 'rgba(255,255,255,.28)', color: '#fff', border: '1.5px solid var(--primary)' }}
                    >
                      {(c.assignee?.full_name ?? '?').charAt(0).toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center" style={{ gap: 8, alignItems: 'baseline', marginTop: 9, position: 'relative' }}>
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1 }} className="tnum">
                  {submissions.length}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, opacity: 0.92 }}>
                  {submissions.length === 1 ? 'submission' : 'submissions'}
                </span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4, fontWeight: 500, position: 'relative' }}>
                Approve photo proof to award their points
              </div>
              <div
                className="flex items-center"
                style={{ justifyContent: 'center', gap: 6, background: '#fff', color: 'var(--primary-ink)', borderRadius: 'var(--r-md)', padding: 14, fontWeight: 800, fontSize: 14, marginTop: 16, position: 'relative' }}
              >
                Review now <ChevronRight size={17} strokeWidth={2.6} />
              </div>
            </button>
          ) : (
            <div className="card card--pad flex items-center" style={{ gap: 12 }}>
              <span className="tile tile--lg tile-mint"><CheckCircle2 size={22} /></span>
              <div>
                <div className="title">You're all caught up</div>
                <div className="meta" style={{ marginTop: 2 }}>No submissions waiting for review.</div>
              </div>
            </div>
          )}

          <div className="stat-strip">
            <div className="stat-strip__cell">
              <div className="stat-strip__num tnum" style={{ color: 'var(--st-overdue-fg)' }}>{overdue.length}</div>
              <div className="stat-strip__lbl">Overdue</div>
            </div>
            <div className="stat-strip__div" />
            <div className="stat-strip__cell">
              <div className="stat-strip__num tnum" style={{ color: 'var(--primary-ink)' }}>{doneToday.length}</div>
              <div className="stat-strip__lbl">Done today</div>
            </div>
            <div className="stat-strip__div" />
            <div className="stat-strip__cell">
              <div className="stat-strip__num tnum">{active.length}</div>
              <div className="stat-strip__lbl">Active</div>
            </div>
          </div>

          <div className="flex" style={{ gap: 9 }}>
            <Button leftIcon={<Plus size={17} strokeWidth={2.4} />} onClick={() => navigate('/parent/chores/new')}>
              Assign chore
            </Button>
            <Button variant="secondary" leftIcon={<Gift size={16} />} onClick={() => navigate('/parent/rewards')}>
              Add reward
            </Button>
          </div>

          {children.length > 0 && (
            <>
              <SectionHeader label="Kids · today" action="View all" onAction={() => navigate('/parent/chores')} />
              {children.map((child) => {
                const { done, total } = childDayProgress(child, chores)
                const pct = total ? (done / total) * 100 : 0
                return (
                  <button
                    key={child.id}
                    className="card list-row"
                    style={{ width: '100%', textAlign: 'left' }}
                    onClick={() => navigate(`/parent/members/${child.id}`)}
                  >
                    <Avatar name={child.full_name} url={child.avatar_url} square seed={child.id} size="sm" />
                    <div className="flex-1">
                      <div className="flex between" style={{ alignItems: 'baseline' }}>
                        <span className="title" style={{ fontSize: 14 }}>{child.full_name.split(' ')[0]}</span>
                        <span className="meta" style={{ fontWeight: 700 }}>{done} of {total || 0}</span>
                      </div>
                      <ProgressBar value={pct} className="mt" />
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {myChores.length > 0 && (
            <>
              <SectionHeader label="Your chores" />
              {myChores.map((c) => (
                <ChoreRow key={c.id} chore={c} onClick={() => navigate(`/parent/chores/${c.id}`)} />
              ))}
            </>
          )}
        </div>
      </main>
    </AppLayout>
  )
}
