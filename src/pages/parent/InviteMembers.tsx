import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Share2, Check } from 'lucide-react'
import { useFamily } from '@/contexts/FamilyContext'
import { TopBar } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui'

export function InviteMembers() {
  const navigate = useNavigate()
  const { family } = useFamily()
  const [copied, setCopied] = useState(false)

  const code = family?.invite_code ?? ''
  const formatted = code.startsWith('FAM-') ? code : `FAM-${code}`
  const joinUrl = `${window.location.origin}/join/${code.replace(/^FAM-/, '')}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  async function share() {
    const data = {
      title: 'Join our family on FamilyFlow',
      text: `Join ${family?.name ?? 'our family'} on FamilyFlow with code ${formatted}`,
      url: joinUrl,
    }
    if (navigator.share) {
      try {
        await navigator.share(data)
      } catch {
        /* user cancelled */
      }
    } else {
      copy()
    }
  }

  return (
    <div className="ff-app">
      <TopBar title="Invite a child" onBack={() => navigate(-1)} />
      <main className="ff-main ff-main--notab">
        <div className="ff-scroll" style={{ alignItems: 'center', marginTop: 8 }}>
          <p className="muted center" style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: 280 }}>
            Share this code or QR. Your child installs FamilyFlow and joins your family instantly.
          </p>

          <div className="card card--pad" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 300, marginTop: 6 }}>
            <div style={{ background: '#fff', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}>
              <QRCodeSVG value={joinUrl} size={150} bgColor="#ffffff" fgColor="#18261F" level="M" />
            </div>
            <div className="center">
              <div className="section-label">Invite code</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '.14em', color: 'var(--primary-ink)', marginTop: 3 }}>
                {formatted}
              </div>
            </div>
          </div>

          <div className="flex" style={{ gap: 9, width: '100%', maxWidth: 300 }}>
            <Button variant="secondary" leftIcon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy}>
              {copied ? 'Copied!' : 'Copy code'}
            </Button>
            <Button leftIcon={<Share2 size={16} />} onClick={share}>Share</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
