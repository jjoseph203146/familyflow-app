import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, ChevronRight } from 'lucide-react'

export function CreateOrJoin() {
  const navigate = useNavigate()

  return (
    <div className="ff-app">
      <main className="ff-main ff-main--notab" style={{ paddingTop: 'calc(28px + env(safe-area-inset-top))' }}>
        <h1 className="h1">Let's get set up</h1>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 7, lineHeight: 1.5 }}>
          Start a new family, or join one you've been invited to.
        </p>

        <div className="flex col" style={{ gap: 12, marginTop: 24 }}>
          <button className="card card--pad flex items-center" style={{ gap: 13, textAlign: 'left' }} onClick={() => navigate('/onboarding/create')}>
            <span className="tile tile--lg tile-mint">
              <Users size={22} />
            </span>
            <div className="flex-1">
              <div className="title">Create a family</div>
              <div className="meta" style={{ marginTop: 2 }}>Set up chores and rewards for your kids</div>
            </div>
            <ChevronRight size={20} color="var(--faint)" />
          </button>

          <button className="card card--pad flex items-center" style={{ gap: 13, textAlign: 'left' }} onClick={() => navigate('/onboarding/join')}>
            <span className="tile tile--lg tile-sky">
              <UserPlus size={22} />
            </span>
            <div className="flex-1">
              <div className="title">Join a family</div>
              <div className="meta" style={{ marginTop: 2 }}>Enter an invite code from a parent</div>
            </div>
            <ChevronRight size={20} color="var(--faint)" />
          </button>
        </div>
      </main>
    </div>
  )
}
