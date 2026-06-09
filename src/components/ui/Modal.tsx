import { ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  type?: 'sheet' | 'dialog'
}

export function Modal({ open, onClose, children, type = 'sheet' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className={type === 'sheet' ? 'sheet' : 'dialog'}
        style={type === 'dialog' ? { alignSelf: 'center' } : {}}
        onClick={e => e.stopPropagation()}
      >
        {type === 'sheet' && <div className="sheet-handle" />}
        {children}
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} type="dialog">
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p className="text-muted" style={{ marginBottom: 24 }}>{description}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className={`btn btn-full ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => { onConfirm(); onClose() }}
        >
          {confirmLabel}
        </button>
        <button className="btn btn-full btn-ghost" onClick={onClose}>
          {cancelLabel}
        </button>
      </div>
    </Modal>
  )
}
