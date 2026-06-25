import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, ImagePlus, Check, RotateCcw, AlertCircle, PartyPopper } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { TopBar } from '@/components/layout/AppLayout'
import { Button, EmptyState } from '@/components/ui'
import { choreVisual } from '@/components/choreVisual'
import { useProofSubmit } from '@/lib/useProofSubmit'

export function SubmitProof() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { chores, refresh } = useFamily()
  const chore = chores.find((c) => c.id === id)

  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const [done, setDone] = useState(false)
  const { preview, pick, submit, submitting, error } = useProofSubmit(id, user?.id)

  if (!chore) {
    return (
      <div className="ff-app">
        <TopBar title="Submit proof" onBack={() => navigate(-1)} />
        <EmptyState icon={<AlertCircle size={26} />} title="Chore not found" />
      </div>
    )
  }

  const { Icon, tone } = choreVisual(chore.title)

  async function handleSubmit() {
    const ok = await submit(false, chore!.requires_photo)
    if (ok) {
      await refresh()
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="ff-app" style={{ background: 'var(--primary)', color: '#fff' }}>
        <TopBar transparent />
        <main className="ff-main ff-main--notab" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ flex: 1 }} />
          <div style={{ width: 96, height: 96, borderRadius: 999, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 66, height: 66, borderRadius: 999, background: '#fff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={34} strokeWidth={2.6} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>Nice work, {chore.assignee?.full_name?.split(' ')[0] ?? 'you'}!</div>
          <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.92, lineHeight: 1.5, marginTop: 6, maxWidth: 260 }}>
            Your proof was sent for review. You'll get your points once it's approved.
          </p>
          <div className="flex items-center" style={{ gap: 6, background: 'rgba(255,255,255,.18)', padding: '9px 16px', borderRadius: 999, fontSize: 14, fontWeight: 800, marginTop: 16 }}>
            <PartyPopper size={16} /> +{chore.points_value} pts pending
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 9, paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
            <button className="btn" style={{ background: '#fff', color: 'var(--primary-ink)' }} onClick={() => navigate('/child')}>
              Back to my chores
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="ff-app">
      <TopBar title="Submit proof" onClose={() => navigate(-1)} />
      <main className="ff-main ff-main--notab">
        <div className="ff-scroll">
          <div className="card list-row">
            <span className={`tile tile--sm tile-${tone}`}><Icon size={17} /></span>
            <div className="flex-1">
              <div className="title" style={{ fontSize: 13.5 }}>{chore.title}</div>
              <div className="points">+{chore.points_value} pts</div>
            </div>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: 7 }}>
              Your photo {chore.requires_photo ? '' : '(optional)'}
            </div>
            {preview ? (
              <div className="proof" style={{ height: 260 }}>
                <img src={preview} alt="Your proof" />
                <button
                  className="flex items-center"
                  style={{ position: 'absolute', bottom: 10, right: 10, background: '#fff', color: 'var(--primary-ink)', fontSize: 11, fontWeight: 800, padding: '6px 11px', borderRadius: 999, gap: 5 }}
                  onClick={() => libraryRef.current?.click()}
                >
                  <RotateCcw size={13} /> Retake
                </button>
              </div>
            ) : (
              <div className="upload" style={{ height: 260 }} onClick={() => cameraRef.current?.click()}>
                <Camera size={28} strokeWidth={1.8} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Add a photo of your finished work</span>
              </div>
            )}
          </div>

          <div className="flex" style={{ gap: 10 }}>
            <Button variant="secondary" leftIcon={<Camera size={16} />} onClick={() => cameraRef.current?.click()}>Camera</Button>
            <Button variant="secondary" leftIcon={<ImagePlus size={16} />} onClick={() => libraryRef.current?.click()}>Library</Button>
          </div>

          {error && (
            <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div className="ff-footer">
          <p className="center muted" style={{ fontSize: 11, fontWeight: 600, marginBottom: 0 }}>
            A parent will review your photo before points are added.
          </p>
          <Button disabled={submitting || (chore.requires_photo && !preview)} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Submit for review'}
          </Button>
        </div>
      </main>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
    </div>
  )
}
