import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useFamily } from '@/contexts/FamilyContext'
import { AppLayout, TopBar } from '@/components/layout/AppLayout'
import { ParentTabBar } from '@/components/layout/TabBar'

export function InviteMembers() {
  const navigate = useNavigate()
  const { family } = useFamily()
  const [copied, setCopied] = useState(false)

  function copy() {
    if (family?.invite_code) {
      navigator.clipboard.writeText(family.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function share() {
    if (navigator.share && family?.invite_code) {
      navigator.share({ title: 'Join our family on FamilyFlow', text: `Use invite code ${family.invite_code}` })
    } else {
      copy()
    }
  }

  return (
    <AppLayout tabBar={<ParentTabBar />}>
      <TopBar title="Invite members" onBack={() => navigate(-1)} />
      <div className="screen screen-padded">
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>👥</div>
          <h2 style={{ marginBottom: 8 }}>Share your invite code</h2>
          <p className="text-muted">Anyone with this code can join your family on FamilyFlow.</p>
        </div>

        {family ? (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #EEF0FD 0%, #F3E8FF 100%)',
              borderRadius: 20, padding: '28px 24px', textAlign: 'center', marginBottom: 24,
            }}>
              <div className="text-sm text-muted" style={{ marginBottom: 8 }}>Your family invite code</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '0.15em', color: '#5C5CE0' }}>
                {family.invite_code}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ padding: 16, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <QRCodeSVG
                  value={`${window.location.origin}/join/${family.invite_code}`}
                  size={160}
                  fgColor="#5C5CE0"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary btn-full" onClick={copy}>
                <Copy size={16} /> {copied ? 'Copied!' : 'Copy code'}
              </button>
              <button className="btn btn-primary btn-full" onClick={share}>
                <Share2 size={16} /> Share
              </button>
            </div>
          </>
        ) : (
          <p className="text-muted" style={{ textAlign: 'center' }}>No family found.</p>
        )}
      </div>
    </AppLayout>
  )
}
