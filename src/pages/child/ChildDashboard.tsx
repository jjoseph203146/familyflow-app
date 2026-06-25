import { useNavigate } from 'react-router-dom'
import { Bell, Flame, Clock, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import type { Chore, Reward } from '@/types'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ChildTabBar } from '@/components/layout/TabBar'
import { Avatar } from '@/components/ui'
import { choreVisual } from '@/components/choreVisual'
import { happenedToday } from '@/lib/format'

function nextReward(points: number, rewards: Reward[]): Reward | null {
  const reachable = rewards
    .filter((r) => r.is_active && r.points_required > points)
    .sort((a, b) => a.points_required - b.points_required)
  return reachable[0] ?? null
}

export function ChildDashboard() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { chores, rewards, unreadCount, loading } = useFamily()

  if (loading) {
    return (
      <AppLayout tabBar={<ChildTabBar />}>
        <div className="page-loading"><div className="spinner" /></div>
      </AppLayout>
    )
  }

  const mine = chores.filter((c) => c.assigned_to === profile?.id)
  const todo = mine.filter((c) => c.status === 'pending' || c.status === 'in_progress' || c.status === 'rejected')
  const doneToday = mine.filter((c) => c.status === 'approved' && happenedToday(c.approved_at)).length
  const points = profile?.points_total ?? 0
  const goal = nextReward(points, rewards)
  const toGo = goal ? goal.points_required - points : 0
  const goalPct = goal ? (points / goal.points_required) * 100 : 100

  return (
    <AppLayout tabBar={<ChildTabBar />}>
      <TopBar
        transparent
        right={
          <button className="icon-btn" onClick={() => navigate('/child/activity')} style={{ position: 'relative' }} aria-label="Activity">
            <Bell size={19} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 999, background: 'var(--primary)', border: '1.5px solid var(--surface)' }} />
            )}
          </button>
        }
      />
      <main className="ff-main">
        <div className="ff-scroll">
          <div className="flex items-center" style={{ gap: 10 }}>
            <Avatar name={profile?.full_name} url={profile?.avatar_url} square seed={profile?.id} />
            <div>
              <div className="eyebrow">Let's go</div>
              <div className="h2" style={{ fontSize: 18 }}>Hi, {profile?.full_name?.split(' ')[0]}</div>
            </div>
          </div>

          {goal ? (
            <button
              className="hero hero--gradient"
              style={{ width: '100%', textAlign: 'left', borderRadius: 'var(--r-2xl)', padding: 18 }}
              onClick={() => navigate('/child/rewards')}
            >
              <div className="hero__blob" style={{ width: 108, height: 108, right: -26, top: -30 }} />
              <div className="hero__blob" style={{ width: 46, height: 46, right: 24, top: 42, background: 'rgba(255,255,255,.06)' }} />
              <div className="flex between items-center" style={{ position: 'relative' }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', opacity: 0.9 }}>Your next reward</span>
                <span className="tile tile--sm" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', borderRadius: 999, width: 30, height: 30 }}>
                  <Flame size={16} />
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em', marginTop: 8, position: 'relative' }}>{goal.title}</div>
              <div className="flex" style={{ gap: 7, alignItems: 'baseline', marginTop: 7, position: 'relative' }}>
                <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, letterSpacing: '-.03em' }} className="tnum">{toGo}</span>
                <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.92 }}>points to go!</span>
              </div>
              <div style={{ position: 'relative', marginTop: 13 }}>
                <div style={{ height: 11, borderRadius: 999, background: 'rgba(255,255,255,.22)', overflow: 'hidden' }}>
                  <div style={{ width: `${goalPct}%`, height: '100%', background: '#fff', borderRadius: 999, boxShadow: '0 0 12px rgba(255,255,255,.5)' }} />
                </div>
              </div>
              <div className="flex between items-center" style={{ marginTop: 9, position: 'relative' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.9 }} className="tnum">{points} / {goal.points_required} pts</span>
                <span className="flex items-center" style={{ gap: 4, fontSize: 11, fontWeight: 800, background: '#fff', color: 'var(--primary-ink)', padding: '4px 10px', borderRadius: 999 }}>
                  <Flame size={12} fill="currentColor" /> So close!
                </span>
              </div>
            </button>
          ) : (
            <div className="hero hero--gradient" style={{ borderRadius: 'var(--r-2xl)' }}>
              <div className="eyebrow" style={{ color: '#fff', opacity: 0.9 }}>Your points</div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.1 }} className="tnum">{points}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>You've unlocked everything — ask for a new reward!</div>
            </div>
          )}

          <div className="flex" style={{ gap: 9 }}>
            <div className="stat-chip" style={{ background: 'var(--p-sky)' }}>
              <div className="stat-chip__num tnum" style={{ color: 'var(--p-sky-ink)' }}>{todo.length}</div>
              <div className="stat-chip__lbl">To do</div>
            </div>
            <div className="stat-chip" style={{ background: 'var(--p-sage)' }}>
              <div className="stat-chip__num tnum" style={{ color: 'var(--p-sage-ink)' }}>{doneToday}</div>
              <div className="stat-chip__lbl">Done today</div>
            </div>
            <div className="stat-chip" style={{ background: 'var(--p-peach)' }}>
              <div className="stat-chip__num tnum" style={{ color: 'var(--p-peach-ink)' }}>
                {profile?.streak_current ?? 0} <Flame size={15} fill="var(--p-peach-ink)" color="var(--p-peach-ink)" />
              </div>
              <div className="stat-chip__lbl">Day streak</div>
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 1 }}>Today's chores</div>
          {todo.length === 0 ? (
            <div className="card card--pad flex items-center" style={{ gap: 12 }}>
              <span className="tile tile--lg tile-mint"><Check size={22} strokeWidth={2.4} /></span>
              <div>
                <div className="title">All done!</div>
                <div className="meta" style={{ marginTop: 2 }}>You've finished everything for today.</div>
              </div>
            </div>
          ) : (
            todo.map((c: Chore) => {
              const { Icon, tone } = choreVisual(c.title)
              const isRejected = c.status === 'rejected'
              return (
                <div key={c.id} className="card list-row" style={{ borderColor: isRejected ? 'var(--danger-border)' : undefined, borderWidth: isRejected ? 1.5 : 1 }}>
                  <span className={`tile tile-${tone}`} style={{ width: 42, height: 42 }}><Icon size={20} /></span>
                  <div className="flex-1">
                    <div className="title">{c.title}</div>
                    <div style={{ marginTop: 3 }}>
                      {isRejected ? (
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--danger)' }}>Sent back · tap to fix</span>
                      ) : (
                        <span className="points">+{c.points_value} pts</span>
                      )}
                    </div>
                  </div>
                  <button
                    className={`btn ${isRejected ? 'btn--danger' : 'btn--primary'}`}
                    style={{ width: 'auto', padding: '9px 16px', fontSize: 12.5, boxShadow: 'none' }}
                    onClick={() => navigate(isRejected ? `/child/resubmit/${c.id}` : `/child/submit/${c.id}`)}
                  >
                    {isRejected ? 'Fix' : 'Start'}
                  </button>
                </div>
              )
            })
          )}

          {mine.filter((c) => c.status === 'submitted').map((c) => {
            const { Icon, tone } = choreVisual(c.title)
            return (
              <div key={c.id} className="card list-row" style={{ opacity: 0.72 }}>
                <span className={`tile tile-${tone}`} style={{ width: 42, height: 42 }}><Icon size={20} /></span>
                <div className="flex-1">
                  <div className="title">{c.title}</div>
                  <div style={{ marginTop: 3 }}><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--st-submitted-fg)' }}>Awaiting review</span></div>
                </div>
                <Clock size={20} color="var(--st-submitted-fg)" />
              </div>
            )
          })}
        </div>
      </main>
    </AppLayout>
  )
}
