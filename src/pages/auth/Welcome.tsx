import { useNavigate } from 'react-router-dom'
import { Check, ClipboardList, Camera, Trophy } from 'lucide-react'
import { Button } from '@/components/ui'

export function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="ff-app">
      <main className="ff-main ff-main--notab" style={{ paddingTop: 'calc(24px + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2" style={{ gap: 9 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--r-sm)',
              background: 'var(--primary)',
              color: 'var(--primary-contrast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={19} strokeWidth={2.6} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>FamilyFlow</span>
        </div>

        <div
          style={{
            borderRadius: 'var(--r-xl)',
            height: 200,
            marginTop: 18,
            background: 'linear-gradient(150deg, var(--soft), var(--p-sky))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -28, bottom: -32, width: 120, height: 120, borderRadius: 999, background: 'rgba(21,153,122,.1)' }} />
          <div
            style={{
              position: 'absolute',
              left: 22,
              top: 28,
              width: 200,
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 'var(--r-md)',
              padding: '13px 14px',
              boxShadow: 'var(--sh-primary)',
              transform: 'rotate(-3deg)',
            }}
          >
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.1em', opacity: 0.85, textTransform: 'uppercase' }}>Next reward</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>Movie night</div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.28)', marginTop: 9, overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', background: '#fff', borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.9, marginTop: 6 }}>60 points to go</div>
          </div>
          <div
            style={{
              position: 'absolute',
              right: 16,
              bottom: 20,
              width: 170,
              background: 'var(--surface)',
              borderRadius: 'var(--r-md)',
              padding: 11,
              boxShadow: 'var(--sh-raised)',
              transform: 'rotate(4deg)',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <span className="tile tile--sm tile-mint">
              <Check size={16} strokeWidth={2.6} />
            </span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800 }}>Bed made</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--primary-ink)', marginTop: 1 }}>Approved · +10</div>
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.15, marginTop: 24 }}>
          Chores done.
          <br />
          Kids motivated.
        </h1>

        <div className="flex col" style={{ gap: 13, marginTop: 20 }}>
          <Value icon={<ClipboardList size={17} />} tone="mint" text="Assign & track chores in seconds" />
          <Value icon={<Camera size={17} />} tone="sky" text="Approve real photo proof" />
          <Value icon={<Trophy size={17} />} tone="peach" text="Rewards that actually motivate" />
        </div>

        <div style={{ flex: 1 }} />
      </main>

      <div className="ff-footer">
        <Button onClick={() => navigate('/signup')}>Create your family</Button>
        <Button variant="ghost" onClick={() => navigate('/signin')}>
          I already have an account
        </Button>
      </div>
    </div>
  )
}

function Value({ icon, tone, text }: { icon: React.ReactNode; tone: 'mint' | 'sky' | 'peach'; text: string }) {
  return (
    <div className="flex items-center" style={{ gap: 11 }}>
      <span className={`tile tile--sm tile-${tone}`}>{icon}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{text}</span>
    </div>
  )
}
