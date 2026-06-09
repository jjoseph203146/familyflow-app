import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'

export function ResubmitChore() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { chores, refresh } = useFamily()
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const chore = chores.find(c => c.id === id)

  if (!chore) {
    return (
      <AppLayout>
        <TopBar onBack={() => navigate(-1)} title="Resubmit" />
        <div className="empty-state"><p>Chore not found.</p></div>
      </AppLayout>
    )
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleResubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !chore) return
    if (chore.requires_photo && !photo) { setError('A new photo is required.'); return }

    setLoading(true)
    setError('')

    let photoUrl: string | null = chore.photo_url
    let photoPath: string | null = chore.photo_path

    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${chore.family_id}/${chore.id}/${Date.now()}-resubmit.${ext}`
      const { error: uploadError } = await supabase.storage.from('chore-photos').upload(path, photo, { upsert: true })
      if (!uploadError) {
        const { data: signedData } = await supabase.storage.from('chore-photos').createSignedUrl(path, 60 * 60 * 24 * 30)
        photoUrl = signedData?.signedUrl ?? null
        photoPath = path
      }
    }

    await supabase.rpc('submit_proof', {
      p_chore_id: chore.id,
      p_photo_url: photoUrl,
      p_photo_path: photoPath,
      p_is_resubmit: true,
    })

    await refresh()
    setSuccess(true)
    setTimeout(() => navigate('/child'), 2000)
  }

  if (success) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>✅</div>
          <h2>Resubmitted!</h2>
          <p className="text-muted text-sm" style={{ textAlign: 'center' }}>Your parent will review it again.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <TopBar title="Redo & resubmit" onBack={() => navigate(-1)} />
      <div className="screen screen-padded">
        {/* Parent's rejection feedback */}
        <div style={{ marginBottom: 20, padding: '14px 16px', background: '#FEF2F2', borderRadius: 12, borderLeft: '3px solid #EF4444' }}>
          <div className="text-sm" style={{ fontWeight: 700, color: '#B91C1C', marginBottom: 4 }}>Feedback from parent</div>
          <div style={{ fontSize: 14, color: '#374151' }}>{chore.rejection_comment}</div>
        </div>

        {/* Previous photo */}
        {chore.photo_url && (
          <div style={{ marginBottom: 20 }}>
            <div className="input-label" style={{ marginBottom: 8 }}>Previous photo</div>
            <img
              src={chore.photo_url}
              alt="Previous submission"
              style={{ width: '100%', borderRadius: 12, aspectRatio: '4/3', objectFit: 'cover', opacity: 0.7 }}
            />
          </div>
        )}

        <form onSubmit={handleResubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
          <div>
            <div className="input-label" style={{ marginBottom: 8 }}>New photo</div>
            <div className="photo-slot" onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="New preview" />
              ) : (
                <>
                  <Camera size={32} color="#9CA3AF" />
                  <span>Take a new photo</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
          </div>

          {error && <div className="notif-banner warning"><span>⚠️</span> {error}</div>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Resubmitting…' : 'Resubmit ✓'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
