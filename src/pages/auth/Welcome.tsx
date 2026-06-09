import { useNavigate } from 'react-router-dom'

export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="app-shell" style={{ justifyContent: 'space-between' }}>
      {/* Logo area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px 24px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, #5C5CE0 0%, #8B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, marginBottom: 20, boxShadow: '0 8px 32px rgba(92,92,224,0.3)',
        }}>
          🏠
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>FamilyFlow</h1>
        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 16, maxWidth: 280 }}>
          Chores, accountability, and rewards — all in one place.
        </p>
      </div>

      {/* Illustration */}
      <div style={{ padding: '0 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%', maxWidth: 320,
          background: 'linear-gradient(135deg, #EEF0FD 0%, #F3E8FF 100%)',
          borderRadius: 24, padding: 24,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {[
            { emoji: '✅', text: 'Assign chores & track completion', color: '#DCFCE7' },
            { emoji: '📸', text: 'Photo proof keeps everyone honest', color: '#EEF0FD' },
            { emoji: '⭐', text: 'Earn points & unlock rewards', color: '#FEF3C7' },
          ].map(({ emoji, text, color }) => (
            <div key={text} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: color, borderRadius: 12, padding: '10px 14px',
            }}>
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '24px 24px calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/signup')}>
          Create Account
        </button>
        <button className="btn btn-outline btn-full btn-lg" onClick={() => navigate('/signin')}>
          Sign In
        </button>
      </div>
    </div>
  )
}
