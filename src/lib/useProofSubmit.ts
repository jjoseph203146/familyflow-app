import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useProofSubmit(choreId: string | undefined, userId: string | undefined) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function pick(f: File | null) {
    setError(null)
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function submit(isResubmit: boolean, requiresPhoto: boolean): Promise<boolean> {
    if (!choreId || !userId) return false
    if (requiresPhoto && !file) {
      setError('A photo is required for this chore.')
      return false
    }
    setSubmitting(true)
    setError(null)
    try {
      let photoUrl: string | null = null
      let photoPath: string | null = null

      if (file) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${userId}/${choreId}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('chore-photos')
          .upload(path, file, { upsert: true })
        if (upErr) throw upErr

        const { data: signed, error: signErr } = await supabase.storage
          .from('chore-photos')
          .createSignedUrl(path, 60 * 60 * 24 * 365)
        if (signErr) throw signErr

        photoUrl = signed.signedUrl
        photoPath = path
      }

      const { error: rpcErr } = await supabase.rpc('submit_proof', {
        p_chore_id: choreId,
        p_photo_url: photoUrl,
        p_photo_path: photoPath,
        ...(isResubmit ? { p_is_resubmit: true } : {}),
      })
      if (rpcErr) throw rpcErr

      setSubmitting(false)
      return true
    } catch (e) {
      setSubmitting(false)
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      return false
    }
  }

  return { file, preview, pick, submit, submitting, error }
}
