import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import ViewerCount from '../components/ViewerCount'

const EVENT_ICON = { Regu: '👟', Quad: '🏐' }

export default function Home() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [league,   setLeague]   = useState(null)
  const [teams,    setTeams]    = useState([])
  const [fixtures, setFixtures] = useState([])

  // Load active league
  useEffect(() => {
    return onSnapshot(query(collection(db, 'leagues'), orderBy('createdAt', 'desc')), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLeague(all.find(l => l.status === 'active') || all[0] || null)
    })
  }, [])

  // Load teams + fixtures for the active league
  useEffect(() => {
    if (!league) { setTeams([]); setFixtures([]); return }
    const unsubTeams = onSnapshot(collection(db, 'leagues', league.id, 'teams'),
      snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const unsubFix = onSnapshot(
      query(collection(db, 'leagues', league.id, 'fixtures'), orderBy('date')),
      snap => setFixtures(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { unsubTeams(); unsubFix() }
  }, [league?.id])

  // Derived
  const today      = new Date().toISOString().split('T')[0]
  const live       = fixtures.filter(f => f.status === 'live')
  const todayFix   = fixtures.filter(f => f.date === today && f.status === 'scheduled')
  const played     = fixtures.filter(f => f.status === 'completed')
  const lastResult = [...played].sort((a, b) => b.date?.localeCompare(a.date))[0] || null

  // Top 3 teams sorted by wins → sets diff → pts diff
  const topTeams = [...teams].sort((a, b) => {
    const wDiff = (b.w || 0) - (a.w || 0); if (wDiff !== 0) return wDiff
    const sDiff = ((b.setsWon || 0) - (b.setsLost || 0)) - ((a.setsWon || 0) - (a.setsLost || 0)); if (sDiff !== 0) return sDiff
    return ((b.ptsFor || 0) - (b.ptsAgainst || 0)) - ((a.ptsFor || 0) - (a.ptsAgainst || 0))
  }).slice(0, 3)

  const liveMatch = live[0] || null

  return (
    <div className="page" style={{ paddingTop: 0 }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg,#ff5500 0%,#ff8c00 100%)', margin: '0 -16px', padding: '40px 24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: 6 }}>
              {league?.year ? `Season ${league.year}` : 'Chennai Sepak Takraw'}
            </p>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              {league?.name || 'Chennai Sepak\nTakraw League'}
            </h1>
            <span style={{ display: 'inline-block', marginTop: 10, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: '0.68rem', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
              {isAdmin ? '⚡ Admin' : `👤 ${user?.displayName?.split(' ')[0] || 'User'}`}
            </span>
          </div>
          <img src="/logo.jpg" alt="Logo" width={80} height={80}
            style={{ objectFit: 'contain', flexShrink: 0, mixBlendMode: 'multiply', borderRadius: 8 }}
            onError={e => { e.currentTarget.style.display = 'none' }} />
        </div>
      </div>

      {/* ── Live match ── */}
      {liveMatch ? (
        <div className="card" onClick={() => navigate(`/scoring/${league.id}/${liveMatch.id}`)}
          style={{ border: '1px solid rgba(34,197,94,0.3)', marginBottom: 14, cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
          <div style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Now</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <ViewerCount />
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.15)' }}>
                  {EVENT_ICON[liveMatch.event]} {liveMatch.event} · L{liveMatch.leg}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TeamBlock team={liveMatch.homeTeam} align="right" />
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '6px 14px', textAlign: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 900, fontSize: '1.1rem', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                  {liveMatch.homeScore ?? 0} – {liveMatch.awayScore ?? 0}
                </span>
                <p style={{ fontSize: '0.55rem', color: 'var(--text-3)', fontWeight: 600, marginTop: 1 }}>SETS</p>
              </div>
              <TeamBlock team={liveMatch.awayTeam} align="left" />
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: 10 }}>Tap to watch live →</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ border: '1px solid rgba(255,85,0,0.12)', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="card-label" style={{ marginBottom: 4 }}>Live Match</p>
              <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
                {todayFix.length > 0 ? `${todayFix.length} match${todayFix.length > 1 ? 'es' : ''} scheduled today` : 'No match in progress'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ViewerCount />
              <span className="badge badge-upcoming">Waiting</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick stats ── */}
      <p className="card-label" style={{ paddingLeft: 2 }}>Overview</p>
      <div className="stat-grid" style={{ marginBottom: 14 }}>
        {[
          { label: 'Teams',   value: teams.length    || '—', color: 'var(--text-1)' },
          { label: 'Played',  value: played.length   || '—', color: 'var(--text-1)' },
          { label: 'Today',   value: todayFix.length || '—', color: 'var(--accent)'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-chip">
            <div className="stat-chip-value" style={{ color }}>{value}</div>
            <div className="stat-chip-label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Latest result ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="card-label">Latest Result</p>
        {lastResult ? (
          <div onClick={() => navigate(`/scoring/${league.id}/${lastResult.id}`)}
            style={{ cursor: 'pointer', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.15)' }}>
                {EVENT_ICON[lastResult.event]} {lastResult.event} · L{lastResult.leg}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600 }}>{formatDate(lastResult.date)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamBlock team={lastResult.homeTeam} align="right" />
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', textAlign: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 900, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
                  {lastResult.homeScore ?? 0} – {lastResult.awayScore ?? 0}
                </span>
                <p style={{ fontSize: '0.52rem', color: 'var(--text-3)', fontWeight: 600 }}>SETS</p>
              </div>
              <TeamBlock team={lastResult.awayTeam} align="left" />
            </div>
            {/* Winner label */}
            {lastResult.homeScore !== null && (
              <p style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>
                🏆 {lastResult.homeScore > lastResult.awayScore ? lastResult.homeTeam?.name : lastResult.awayTeam?.name} won
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginTop: 4 }}>No results yet. Appears here once matches begin.</p>
        )}
      </div>

      {/* ── Top of table ── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: topTeams.length > 0 ? 12 : 4 }}>
          <p className="card-label" style={{ margin: 0 }}>Top of Table</p>
          {topTeams.length > 0 && (
            <button onClick={() => navigate('/table')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'inherit' }}>
              See all →
            </button>
          )}
        </div>
        {topTeams.length === 0 ? (
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Standings will appear here once matches begin.</p>
        ) : (
          topTeams.map((team, idx) => {
            const pos = idx + 1
            const MEDALS = ['🥇', '🥈', '🥉']
            return (
              <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: idx < topTeams.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, width: 24, textAlign: 'center' }}>{MEDALS[idx]}</span>
                {team.logoUrl
                  ? <img src={team.logoUrl} alt={team.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                  : <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem' }}>👥</div>}
                <span style={{ flex: 1, fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontWeight: 600 }}>W</p>
                    <p style={{ fontSize: '0.88rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{team.w || 0}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontWeight: 600 }}>L</p>
                    <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{team.l || 0}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontWeight: 600 }}>PD</p>
                    <p style={{ fontSize: '0.88rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: (team.ptsFor || 0) - (team.ptsAgainst || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                      {(team.ptsFor || 0) - (team.ptsAgainst || 0) > 0 ? '+' : ''}{(team.ptsFor || 0) - (team.ptsAgainst || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────
function TeamBlock({ team, align }) {
  if (!team) return <div style={{ flex: 1 }} />
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: align === 'right' ? 'flex-end' : 'flex-start', overflow: 'hidden' }}>
      {align === 'right' && <span style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
      {team.logoUrl
        ? <img src={team.logoUrl} alt={team.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
        : <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>👥</div>}
      {align === 'left' && <span style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
