import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, ImagePlus, Check, RotateCcw, AlertCircle, MessageSquare, PartyPopper } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { TopBar } from '@/components/layout/AppLayout'
import { Button, EmptyState, ProofImage, StatusPill } from '@/components/ui'
import { choreVisual } from '@/components/choreVisual'
import { useProofSubmit } from '@/lib/useProofSubmit'

export function ResubmitChore() {
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
        <TopBar title="Fix & resubmit" onBack={() => navigate(-1)} />
        <EmptyState icon={<AlertCircle size={26} />} title="Chore not found" />
      </div>
    )
  }

  const { Icon, tone } = choreVisual(chore.title)

  async function handleSubmit() {
    const ok = await submit(true, chore!.requires_photo)
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
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>Sent again!</div>
          <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.92, lineHeight: 1.5, marginTop: 6, maxWidth: 260 }}>
            Your updated proof is back with your parent for another look.
          </p>
          <div className="flex items-center" style={{ gap: 6, background: 'rgba(255,255,255,.18)', padding: '9px 16px', borderRadius: 999, fontSize: 14, fontWeight: 800, marginTop: 16 }}>
            <PartyPopper size={16} /> +{chore.points_value} pts pending
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: '100%', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
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
      <TopBar
        title="Chore"
        onClose={() => navigate(-1)}
        right={<StatusPill status="rejected" />}
      />
      <main className="ff-main ff-main--notab">
        <div className="ff-scroll">
          {chore.rejection_comment && (
            <div className="card" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger-border)', padding: 14 }}>
              <div className="flex items-center" style={{ gap: 9 }}>
                <span className="tile tile--sm" style={{ background: 'var(--surface)', color: 'var(--danger)' }}><MessageSquare size={17} /></span>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--danger)' }}>Your parent left a note</div>
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '11px 13px', marginTop: 11, fontSize: 12.5, fontWeight: 600, lineHeight: 1.5 }}>
                "{chore.rejection_comment}"
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--danger)', marginTop: 10 }}>
                Almost there — fix this and send it again.
              </div>
            </div>
          )}

          <div className="card list-row">
            <span className={`tile tile-${tone}`} style={{ width: 46, height: 46 }}><Icon size={22} /></span>
            <div className="flex-1">
              <div className="title">{chore.title}</div>
              <div className="points" style={{ marginTop: 2 }}>+{chore.points_value} pts when approved</div>
            </div>
          </div>

          <div>
            <div className="section-label" style={{ marginBottom: 7 }}>
              {preview ? 'Your new photo' : 'Add a new photo'}
            </div>
            {preview ? (
              <div className="proof" style={{ height: 240 }}>
                <img src={preview} alt="Your new proof" />
                <button
                  className="flex items-center"
                  style={{ position: 'absolute', bottom: 10, right: 10, background: '#fff', color: 'var(--primary-ink)', fontSize: 11, fontWeight: 800, padding: '6px 11px', borderRadius: 999, gap: 5 }}
                  onClick={() => libraryRef.current?.click()}
                >
                  <RotateCcw size={13} /> Retake
                </button>
              </div>
            ) : chore.photo_url ? (
              <div>
                <ProofImage src={chore.photo_url} hint="PREVIOUS PHOTO" height={120} dim />
                <button className="btn btn--secondary" style={{ marginTop: 9 }} onClick={() => cameraRef.current?.click()}>
                  <Camera size={16} /> Take a new photo
                </button>
              </div>
            ) : (
              <div className="upload" style={{ height: 200 }} onClick={() => cameraRef.current?.click()}>
                <Camera size={28} strokeWidth={1.8} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Add a photo of your fixed work</span>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center" style={{ gap: 8, color: 'var(--danger)', fontSize: 12.5, fontWeight: 700 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />
        <div className="ff-footer">
          <Button disabled={submitting || (chore.requires_photo && !preview)} leftIcon={<Camera size={17} />} onClick={handleSubmit}>
            {submitting ? 'Submitting...' : 'Fix & resubmit'}
          </Button>
        </div>
      </main>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />
    </div>
  )
}
