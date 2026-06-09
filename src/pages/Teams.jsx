import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import TeamSheet from '../components/TeamSheet'

export default function Teams() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [leagues, setLeagues]               = useState([])
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [teams, setTeams]                   = useState([])
  const [loading, setLoading]               = useState(true)
  const [selectedTeam, setSelectedTeam]     = useState(null)

  // Load leagues
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'leagues'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      all.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setLeagues(all)
      setSelectedLeague(prev => {
        if (prev && all.find(l => l.id === prev.id)) return all.find(l => l.id === prev.id)
        return all.find(l => l.status === 'active') || all[0] || null
      })
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  // Load teams for selected league
  useEffect(() => {
    if (!selectedLeague) { setTeams([]); return }
    return onSnapshot(
      collection(db, 'leagues', selectedLeague.id, 'teams'),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        all.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setTeams(all)
      }
    )
  }, [selectedLeague?.id])

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}>
        <p style={{ color: 'var(--text-2)' }}>Loading…</p>
      </div>
    )
  }

  if (leagues.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <p className="page-subtitle">Chennai Sepak Takraw</p>
            <h1 className="page-title">Teams</h1>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</p>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>No leagues yet</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Check back once a league is created.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <p className="page-subtitle">{selectedLeague?.name || 'Chennai Sepak Takraw'}</p>
          <h1 className="page-title">Teams</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/admin/leagues')}
            style={{
              height: 36, padding: '0 14px', borderRadius: 10,
              background: 'rgba(255,85,0,0.08)', border: '1px solid rgba(255,85,0,0.2)',
              color: 'var(--accent)', fontFamily: 'inherit', fontWeight: 700,
              fontSize: '0.78rem', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6, flexShrink: 0,
            }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Manage
          </button>
        )}
      </div>

      {/* League switcher */}
      {leagues.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, scrollbarWidth: 'none' }}>
          {leagues.map(l => (
            <button key={l.id} onClick={() => setSelectedLeague(l)}
              style={{
                flexShrink: 0, height: 32, padding: '0 14px', borderRadius: 20,
                border: selectedLeague?.id === l.id ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                background: selectedLeague?.id === l.id ? 'rgba(255,85,0,0.08)' : 'var(--bg-elevated)',
                color: selectedLeague?.id === l.id ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                transition: 'all 150ms ease',
              }}>
              {l.name}
            </button>
          ))}
        </div>
      )}

      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</p>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>No teams yet</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Teams will appear here once added.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {teams.map((team, i) => (
            <TeamCard key={team.id} team={team} index={i} onClick={() => setSelectedTeam(team)} />
          ))}
        </div>
      )}

      {/* Team detail sheet */}
      <TeamSheet
        team={selectedTeam}
        leagueId={selectedLeague?.id}
        open={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
      />
    </div>
  )
}

function TeamCard({ team, index, onClick }) {
  const [logoErr, setLogoErr] = useState(false)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 12px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        animation: `cardIn 350ms ease ${index * 60}ms both`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';   e.currentTarget.style.boxShadow = 'none' }}
      onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Logo */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        overflow: 'hidden',
        border: '2.5px solid var(--accent)',
        background: 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 5px rgba(255,85,0,0.07)',
        flexShrink: 0,
      }}>
        {(team.logoUrl && !logoErr)
          ? <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" onError={() => setLogoErr(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '1.8rem' }}>👥</span>
        }
      </div>

      {/* Name */}
      <p style={{ fontWeight: 800, fontSize: '0.88rem', textAlign: 'center', lineHeight: 1.3, color: 'var(--text-1)' }}>
        {team.name}
      </p>

      {/* View squad hint */}
      <span style={{
        fontSize: '0.65rem', fontWeight: 700,
        color: 'var(--accent)',
        background: 'rgba(255,85,0,0.08)',
        border: '1px solid rgba(255,85,0,0.2)',
        borderRadius: 20, padding: '3px 10px',
      }}>
        View Squad →
      </span>
    </div>
  )
}
