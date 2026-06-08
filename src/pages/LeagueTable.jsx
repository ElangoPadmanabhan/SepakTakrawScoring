import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useSupportedTeam } from '../hooks/useSupportedTeam'

const POS_STYLE = {
  1: { color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  2: { color: '#4b5563', bg: '#f3f4f6', border: '#d1d5db' },
  3: { color: '#92400e', bg: '#fdf4ea', border: '#fcd9a8' },
}

const EVENT_ICON = { Regu: '👟', Quad: '🏐' }

export default function LeagueTable() {
  const { isAdmin } = useAuth()
  const { supportedTeam, supportTeam } = useSupportedTeam()

  const [leagues, setLeagues]       = useState([])
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [teams, setTeams]           = useState([])
  const [fixtures, setFixtures]     = useState([])
  const [activeEvent, setActiveEvent] = useState(null)
  const [loading, setLoading]       = useState(false)

  // Load all leagues — force-clear loading after 5s in case Firestore is slow
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000)
    const unsub = onSnapshot(collection(db, 'leagues'), snap => {
      clearTimeout(timeout)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      all.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setLeagues(all)
      setSelectedLeague(prev => {
        if (prev && all.find(l => l.id === prev.id)) return all.find(l => l.id === prev.id)
        const pinned = sessionStorage.getItem('selectedLeagueId')
        if (pinned) { sessionStorage.removeItem('selectedLeagueId'); return all.find(l => l.id === pinned) || all.find(l => l.status === 'active') || all[0] || null }
        return all.find(l => l.status === 'active') || all[0] || null
      })
      setLoading(false)
    }, () => {
      // onSnapshot error — stop loading and show empty state
      clearTimeout(timeout)
      setLoading(false)
    })
    return () => { clearTimeout(timeout); unsub() }
  }, [])

  // When selected league changes, set default event tab
  useEffect(() => {
    if (!selectedLeague) return
    const events = selectedLeague.events || []
    setActiveEvent(events[0] || null)
  }, [selectedLeague?.id])

  // Load teams for selected league
  useEffect(() => {
    if (!selectedLeague) { setTeams([]); return }
    return onSnapshot(
      collection(db, 'leagues', selectedLeague.id, 'teams'),
      snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [selectedLeague?.id])

  // Load fixtures to detect if league is complete
  useEffect(() => {
    if (!selectedLeague) { setFixtures([]); return }
    return onSnapshot(
      collection(db, 'leagues', selectedLeague.id, 'fixtures'),
      snap => setFixtures(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [selectedLeague?.id])

  const events = selectedLeague?.events || []
  const showEventTabs = events.length > 1

  // Sort: wins → sets diff → points diff
  const sortedTeams = [...teams].sort((a, b) => {
    const wDiff = (b.w || 0) - (a.w || 0); if (wDiff !== 0) return wDiff
    const sDiff = ((b.setsWon || 0) - (b.setsLost || 0)) - ((a.setsWon || 0) - (a.setsLost || 0)); if (sDiff !== 0) return sDiff
    return ((b.ptsFor || 0) - (b.ptsAgainst || 0)) - ((a.ptsFor || 0) - (a.ptsAgainst || 0))
  })

  // Determine if all matches for each event are done → reveal winner
  const isEventComplete = (event) => {
    const eventFixtures = fixtures.filter(f => !event || f.event === event)
    return eventFixtures.length > 0 && eventFixtures.every(f => f.status === 'completed')
  }
  const currentEventComplete = isEventComplete(activeEvent)

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
            <h1 className="page-title">League Table</h1>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>🏆</p>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>No leagues yet</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
            {isAdmin ? 'Go to the Leagues tab to create one.' : 'Check back once the admin creates a league.'}
          </p>
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
          <h1 className="page-title">League Table {selectedLeague?.year ? `· ${selectedLeague.year}` : ''}</h1>
        </div>
        {selectedLeague?.status === 'active' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            Live
          </span>
        )}
      </div>

      {/* League selector — shown if more than one league exists */}
      {leagues.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
          {leagues.map(l => {
            const sel = selectedLeague?.id === l.id
            return (
              <button key={l.id} onClick={() => setSelectedLeague(l)}
                style={{ flexShrink: 0, height: 36, padding: '0 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', background: sel ? 'var(--accent)' : 'var(--bg-card)', color: sel ? '#fff' : 'var(--text-2)', border: sel ? '1.5px solid var(--accent)' : '1.5px solid var(--border)', transition: 'all 150ms ease', boxShadow: sel ? '0 2px 8px rgba(255,85,0,0.2)' : 'none' }}>
                {l.name} {l.year ? `'${String(l.year).slice(-2)}` : ''}
                {l.status === 'active' && <span style={{ marginLeft: 5 }}>●</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* League meta strip */}
      {selectedLeague && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 2 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
            {selectedLeague.startDate}{selectedLeague.endDate ? ` → ${selectedLeague.endDate}` : ''}
          </p>
          <div style={{ display: 'flex', gap: 5 }}>
            {events.map(ev => (
              <span key={ev} style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.2)' }}>
                {EVENT_ICON[ev]} {ev}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Event tabs — only shown when league has both Regu & Quad */}
      {showEventTabs && (
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 }}>
          {events.map(ev => {
            const sel = activeEvent === ev
            return (
              <button key={ev} onClick={() => setActiveEvent(ev)}
                style={{ flex: 1, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', background: sel ? 'var(--bg-card)' : 'transparent', color: sel ? 'var(--accent)' : 'var(--text-2)', boxShadow: sel ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {EVENT_ICON[ev]} {ev} Table
              </button>
            )
          })}
        </div>
      )}

      {/* Support hint */}
      {!isAdmin && teams.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <span style={{ fontSize: '1rem' }}>❤️</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>Tap the heart to support your team</p>
        </div>
      )}

      {/* No teams yet */}
      {teams.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <p style={{ fontSize: '2rem', marginBottom: 10 }}>👥</p>
          <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 6 }}>No teams yet</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
            {isAdmin ? 'Go to Leagues → Manage to add teams.' : 'Teams will appear here once added.'}
          </p>
        </div>
      )}

      {/* Winner banner — shown when all matches in the event are completed */}
      {currentEventComplete && sortedTeams.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#b45309 0%,#f59e0b 60%,#fde68a 100%)', borderRadius: 16, padding: '20px 20px', marginBottom: 16, textAlign: 'center', boxShadow: '0 4px 20px rgba(180,83,9,0.25)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 6 }}>🏆</p>
          <p style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', marginBottom: 2 }}>
            {sortedTeams[0].name}
          </p>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            {activeEvent ? `${EVENT_ICON[activeEvent]} ${activeEvent} Champion` : 'League Champion'} {selectedLeague?.year ? `· ${selectedLeague.year}` : ''}
          </p>
        </div>
      )}

      {/* Table */}
      {sortedTeams.length > 0 && (
        <>
          {/* Column headers */}
          <div className="league-table-grid" style={{ padding: '0 10px 8px' }}>
            {['#', 'Team', 'P', 'W', 'L', 'Sets', 'PD', ''].map((h, i) => (
              <span key={i} title={['','','Played','Wins','Losses','Sets Won–Lost','Points Difference',''][i]}
                style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--text-3)', textAlign: i === 1 ? 'left' : 'center' }}>
                {h}
              </span>
            ))}
          </div>

          {sortedTeams.map((team, idx) => {
            const pos = idx + 1
            const ps  = POS_STYLE[pos] || {}
            const isSupported = supportedTeam === team.id

            const p        = team.p        || 0
            const w        = team.w        || 0
            const l        = team.l        || 0
            const setsWon  = team.setsWon  || 0
            const setsLost = team.setsLost || 0
            const ptsFor   = team.ptsFor   || 0
            const ptsAgainst = team.ptsAgainst || 0
            const pd       = ptsFor - ptsAgainst
            const netSets  = setsWon - setsLost
            const setsStr  = netSets > 0 ? `+${netSets}` : `${netSets}`
            const pdStr    = pd > 0 ? `+${pd}` : `${pd}`

            return (
              <div key={team.id} className="card" style={{
                padding: '11px 10px', marginBottom: 8,
                border: isSupported ? '1px solid rgba(255,85,0,0.4)' : pos === 1 ? '1px solid #fde68a' : '1px solid var(--border)',
                background: isSupported ? 'linear-gradient(135deg,#fff8f5 0%,#fff3ee 100%)' : pos === 1 ? '#fffbeb' : 'var(--bg-card)',
              }}>
                <div className="league-table-grid">

                  {/* Position */}
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: currentEventComplete && pos === 1 ? 'linear-gradient(135deg,#b45309,#f59e0b)' : ps.bg || 'var(--bg-elevated)', border: `1px solid ${currentEventComplete && pos === 1 ? '#f59e0b' : ps.border || 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: currentEventComplete && pos === 1 ? '0.75rem' : '0.65rem', fontWeight: 800, color: currentEventComplete && pos === 1 ? '#fff' : ps.color || 'var(--text-3)', flexShrink: 0 }}>
                    {currentEventComplete && pos === 1 ? '👑' : pos}
                  </div>

                  {/* Team name + logo */}
                  <div className="team-name-cell" style={{ paddingLeft: 1 }}>
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem' }}>👥</div>
                    )}
                    <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{team.name}</span>
                      {isSupported && <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700 }}>My Team</span>}
                    </div>
                  </div>

                  {/* P, W, L */}
                  {[p, w, l].map((v, i) => (
                    <span key={i} style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                  ))}

                  {/* Net Sets */}
                  <span style={{ textAlign: 'center', fontSize: '0.88rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: netSets > 0 ? '#16a34a' : netSets < 0 ? '#dc2626' : 'var(--text-3)' }}>
                    {setsStr}
                  </span>

                  {/* Points Difference */}
                  <span style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums', color: pd > 0 ? '#16a34a' : pd < 0 ? '#dc2626' : 'var(--text-3)' }}>
                    {pdStr}
                  </span>

                  {/* Heart — users only */}
                  {!isAdmin ? (
                    <button onClick={() => supportTeam(team.id)} aria-label={isSupported ? `Unsupport ${team.name}` : `Support ${team.name}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', transition: 'transform 150ms ease' }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <HeartIcon filled={isSupported} />
                    </button>
                  ) : <span />}

                </div>
              </div>
            )
          })}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, padding: '4px 2px', marginTop: 4 }}>
            {[{ color: '#b45309', label: '1st' }, { color: '#4b5563', label: '2nd' }, { color: '#92400e', label: '3rd' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#ff5500' : 'none'}
      stroke={filled ? '#ff5500' : '#b0b8c4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  )
}
