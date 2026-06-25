import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PENDING_JOIN_KEY } from '@/lib/format'

export function JoinViaLink() {
  const navigate = useNavigate()
  const { code } = useParams<{ code: string }>()
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    const normalized = (code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)

    if (!normalized) {
      navigate('/', { replace: true })
      return
    }
    if (!profile) {
      localStorage.setItem(PENDING_JOIN_KEY, normalized)
      navigate('/signup', { replace: true })
      return
    }
    if (!profile.family_id) {
      navigate(`/onboarding/join?code=${normalized}`, { replace: true })
      return
    }
    navigate(profile.role === 'parent' ? '/parent' : '/child', { replace: true })
  }, [code, profile, loading, navigate])

  return (
    <div className="ff-app">
      <div className="page-loading">
        <div className="spinner" />
      </div>
    </div>
  )
}
