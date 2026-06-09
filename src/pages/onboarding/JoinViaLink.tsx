import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function JoinViaLink() {
  const { code } = useParams<{ code: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!code) { navigate('/'); return }

    if (!profile) {
      sessionStorage.setItem('pendingJoinCode', code)
      navigate('/signup')
    } else if (!profile.family_id) {
      navigate(`/onboarding/join?code=${code}`)
    } else {
      navigate(profile.role === 'parent' ? '/parent' : '/child')
    }
  }, [code, profile, navigate])

  return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )
}
