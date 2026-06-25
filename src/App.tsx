import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { FamilyProvider } from '@/contexts/FamilyContext'

// Auth
import { Welcome } from '@/pages/auth/Welcome'
import { SignIn } from '@/pages/auth/SignIn'
import { SignUp } from '@/pages/auth/SignUp'

// Onboarding
import { CreateOrJoin } from '@/pages/onboarding/CreateOrJoin'
import { CreateFamily } from '@/pages/onboarding/CreateFamily'
import { JoinFamily } from '@/pages/onboarding/JoinFamily'
import { JoinViaLink } from '@/pages/onboarding/JoinViaLink'

// Parent
import { ParentDashboard } from '@/pages/parent/ParentDashboard'
import { AddChore } from '@/pages/parent/AddChore'
import { ReviewProof } from '@/pages/parent/ReviewProof'
import { AllChores } from '@/pages/parent/AllChores'
import { MemberDetail } from '@/pages/parent/MemberDetail'
import { RewardsManager } from '@/pages/parent/RewardsManager'
import { RedemptionQueue } from '@/pages/parent/RedemptionQueue'
import { ParentActivityFeed } from '@/pages/parent/ActivityFeed'
import { Settings } from '@/pages/parent/Settings'
import { InviteMembers } from '@/pages/parent/InviteMembers'
import { ChoreDetail } from '@/pages/parent/ChoreDetail'

// Child
import { ChildDashboard } from '@/pages/child/ChildDashboard'
import { SubmitProof } from '@/pages/child/SubmitProof'
import { ResubmitChore } from '@/pages/child/ResubmitChore'
import { PointsRewards } from '@/pages/child/PointsRewards'
import { ChildActivityFeed } from '@/pages/child/ActivityFeed'

function AppRoutes() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  // Not signed in
  if (!profile) {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/join/:code" element={<JoinViaLink />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Signed in but no family
  if (!profile.family_id) {
    return (
      <Routes>
        <Route path="/onboarding" element={<CreateOrJoin />} />
        <Route path="/onboarding/create" element={<CreateFamily />} />
        <Route path="/onboarding/join" element={<JoinFamily />} />
        <Route path="/join/:code" element={<JoinViaLink />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  // Parent routes
  if (profile.role === 'parent') {
    return (
      <FamilyProvider>
        <Routes>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/chores/new" element={<AddChore />} />
          <Route path="/parent/review" element={<ReviewProof />} />
          <Route path="/parent/chores" element={<AllChores />} />
          <Route path="/parent/chores/:id" element={<ChoreDetail />} />
          <Route path="/parent/members/:id" element={<MemberDetail />} />
          <Route path="/parent/rewards" element={<RewardsManager />} />
          <Route path="/parent/redemptions" element={<RedemptionQueue />} />
          <Route path="/parent/activity" element={<ParentActivityFeed />} />
          <Route path="/parent/settings" element={<Settings />} />
          <Route path="/parent/invite" element={<InviteMembers />} />
          <Route path="*" element={<Navigate to="/parent" replace />} />
        </Routes>
      </FamilyProvider>
    )
  }

  // Child routes
  return (
    <FamilyProvider>
      <Routes>
        <Route path="/child" element={<ChildDashboard />} />
        <Route path="/child/submit/:id" element={<SubmitProof />} />
        <Route path="/child/resubmit/:id" element={<ResubmitChore />} />
        <Route path="/child/rewards" element={<PointsRewards />} />
        <Route path="/child/activity" element={<ChildActivityFeed />} />
        <Route path="*" element={<Navigate to="/child" replace />} />
      </Routes>
    </FamilyProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
