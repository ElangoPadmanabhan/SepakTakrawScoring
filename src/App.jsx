import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import Home from './pages/Home'
import Scoring from './pages/Scoring'
import LeagueTable from './pages/LeagueTable'
import Fixtures from './pages/Fixtures'
import ManageLeagues from './pages/ManageLeagues'
import LeagueDetail from './pages/LeagueDetail'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Splash />
  if (!user && !isAdmin) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}

function Splash() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="" width={72} style={{ objectFit: 'contain', marginBottom: 16 }}
          onError={e => { e.currentTarget.style.display = 'none' }} />
        <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Loading…</p>
      </div>
    </div>
  )
}

const LOGO_BG = `${import.meta.env.BASE_URL}HomePage Logo.jpg`

export default function App() {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Splash />
  const isAuthed = user || isAdmin

  return (
    <>
      {/* Global logo watermark — visible on every page */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url("${LOGO_BG}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: '70vw auto',
        opacity: 0.045,
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <Routes>
        <Route path="/login"          element={isAuthed ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/"               element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/scoring"                               element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
        <Route path="/scoring/:leagueId/:fixtureId"          element={<ProtectedRoute><Scoring /></ProtectedRoute>} />
        <Route path="/table"          element={<ProtectedRoute><LeagueTable /></ProtectedRoute>} />
        <Route path="/fixtures"       element={<ProtectedRoute><Fixtures /></ProtectedRoute>} />
        <Route path="/admin/leagues"           element={<ProtectedRoute adminOnly><ManageLeagues /></ProtectedRoute>} />
        <Route path="/admin/leagues/:leagueId" element={<ProtectedRoute adminOnly><LeagueDetail /></ProtectedRoute>} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
      {isAuthed && <Navbar />}
    </>
  )
}
