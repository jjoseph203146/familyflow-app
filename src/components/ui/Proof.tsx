import { ImageIcon } from 'lucide-react'

export function ProofImage({
  src,
  hint = 'PHOTO PROOF',
  height = 140,
  dim,
}: {
  src?: string | null
  hint?: string
  height?: number
  dim?: boolean
}) {
  return (
    <div className="proof" style={{ height, opacity: dim ? 0.7 : 1 }}>
      {src ? (
        <img src={src} alt="Chore proof" />
      ) : (
        <>
          <ImageIcon size={22} strokeWidth={1.8} />
          <span className="proof__hint">{hint}</span>
        </>
      )}
    </div>
  )
}
