import { useNavigate } from 'react-router-dom'
import { Users, UserPlus } from 'lucide-react'

export function CreateOrJoin() {
  const navigate = useNavigate()

  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ marginBottom: 6 }}>Set up your family</h1>
          <p className="text-muted">Create a new family group, or join one with an invite code.</p>
        </div>

        <button
          className="card"
          style={{ textAlign: 'left', border: 'none', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start' }}
          onClick={() => navigate('/onboarding/create')}
        >
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EEF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={24} color="#5C5CE0" />
          </div>
          <div>
            <h3>Create a family</h3>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              Start a new family group and invite your household. You'll be the family manager.
            </p>
          </div>
        </button>

        <button
          className="card"
          style={{ textAlign: 'left', border: 'none', cursor: 'pointer', display: 'flex', gap: 16, alignItems: 'flex-start' }}
          onClick={() => navigate('/onboarding/join')}
        >
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserPlus size={24} color="#16A34A" />
          </div>
          <div>
            <h3>Join a family</h3>
            <p className="text-sm text-muted" style={{ marginTop: 4 }}>
              Enter an invite code shared by your family manager to join their group.
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
