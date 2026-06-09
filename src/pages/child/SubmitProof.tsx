import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFamily } from '@/contexts/FamilyContext'
import { supabase } from '@/lib/supabase'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'

export function SubmitProof() {
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
        <TopBar onBack={() => navigate(-1)} title="Submit chore" />
        <div className="empty-state"><p>Chore not found.</p></div>
      </AppLayout>
    )
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const MAX = 5 * 1024 * 1024
    if (file.size > MAX) { setError('Photo must be under 5MB.'); return }
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !chore) return
    if (chore.requires_photo && !photo) { setError('This chore requires a photo.'); return }

    setLoading(true)
    setError('')

    let photoUrl: string | null = null
    let photoPath: string | null = null

    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${chore.family_id}/${chore.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('chore-photos').upload(path, photo, { upsert: true })
      if (uploadError) { setError(uploadError.message); setLoading(false); return }

      const { data: signedData } = await supabase.storage.from('chore-photos').createSignedUrl(path, 60 * 60 * 24 * 30)
      photoUrl = signedData?.signedUrl ?? null
      photoPath = path
    }

    const { error: updateError } = await supabase.rpc('submit_proof', {
      p_chore_id: chore.id,
      p_photo_url: photoUrl,
      p_photo_path: photoPath,
      p_is_resubmit: false,
    })

    if (updateError) { setError(updateError.message); setLoading(false); return }

    await refresh()
    setSuccess(true)
    setTimeout(() => navigate('/child'), 2000)
  }

  if (success) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>✅</div>
          <h2>Submitted!</h2>
          <p className="text-muted text-sm" style={{ textAlign: 'center' }}>
            Your parent will review and award <strong>⭐ {chore.points_value} points</strong> once approved.
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <TopBar title={chore.title} onBack={() => navigate(-1)} />
      <div className="screen screen-padded">
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pill pill-amber">⭐ {chore.points_value} pts</span>
            {chore.requires_photo && <span className="pill pill-indigo">📸 Photo required</span>}
          </div>
          {chore.description && <p className="text-sm text-muted" style={{ marginTop: 8 }}>{chore.description}</p>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 32 }}>
          {(chore.requires_photo || true) && (
            <div>
              <div className="input-label" style={{ marginBottom: 8 }}>
                {chore.requires_photo ? 'Add photo proof *' : 'Add photo proof (optional)'}
              </div>
              <div
                className="photo-slot"
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" />
                ) : (
                  <>
                    <Camera size={32} color="#9CA3AF" />
                    <span>Tap to take or upload a photo</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
              {preview && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { setPhoto(null); setPreview(null) }}>
                  Remove photo
                </button>
              )}
            </div>
          )}

          {error && <div className="notif-banner warning"><span>⚠️</span> {error}</div>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit for review ✓'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
