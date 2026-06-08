import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useSupportedTeam } from '../hooks/useSupportedTeam'

const EVENT_ICON = { Regu: '👟', Quad: '🏐' }

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Fixtures() {
  const { isAdmin } = useAuth()
  const { supportedTeam } = useSupportedTeam()

  const [leagues, setLeagues]               = useState([])
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [fixtures, setFixtures]             = useState([])
  const [activeEvent, setActiveEvent]       = useState('All')
  const [activeTab, setActiveTab]           = useState('upcoming') // 'upcoming' | 'results'
  const [loading, setLoading]               = useState(true)

  // Load leagues — force-clear loading after 5s in case Firestore is slow
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
    }, () => { clearTimeout(timeout); setLoading(false) })
    return () => { clearTimeout(timeout); unsub() }
  }, [])

  // Load fixtures for selected league
  useEffect(() => {
    if (!selectedLeague) { setFixtures([]); return }
    return onSnapshot(
      collection(db, 'leagues', selectedLeague.id, 'fixtures'),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        all.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        setFixtures(all)
      }
    )
  }, [selectedLeague?.id])

  // Reset filters when league changes
  useEffect(() => { setActiveEvent('All') }, [selectedLeague?.id])

  const leagueEvents = selectedLeague?.events || []
  const eventFilters = ['All', ...leagueEvents]

  const filtered  = activeEvent === 'All' ? fixtures : fixtures.filter(f => f.event === activeEvent)
  const today     = new Date().toISOString().split('T')[0]
  const live      = filtered.filter(f => f.status === 'live')
  const upcoming  = filtered.filter(f => f.status === 'scheduled' && f.date >= today)
  const past      = filtered.filter(f => f.status === 'completed' || (f.status === 'scheduled' && f.date < today))

  // Auto-switch to results tab if there are no upcoming but there are results
  const upcomingCount = live.length + upcoming.length
  const resultsCount  = past.length

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}>
      <p style={{ color: 'var(--text-2)' }}>Loading…</p>
    </div>
  )

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <p className="page-subtitle">{selectedLeague?.name || 'Chennai Sepak Takraw'}</p>
          <h1 className="page-title">Fixtures {selectedLeague?.year ? `· ${selectedLeague.year}` : ''}</h1>
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
          {filtered.length} Match{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* League selector */}
      {leagues.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
          {leagues.map(l => {
            const sel = selectedLeague?.id === l.id
            return (
              <button key={l.id} onClick={() => setSelectedLeague(l)}
                style={{ flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', background: sel ? 'var(--accent)' : 'var(--bg-card)', color: sel ? '#fff' : 'var(--text-2)', border: sel ? '1.5px solid var(--accent)' : '1.5px solid var(--border)', transition: 'all 150ms ease' }}>
                {l.name}{l.status === 'active' ? ' ●' : ''}
              </button>
            )
          })}
        </div>
      )}

      {/* Event filter */}
      {leagueEvents.length > 1 && (
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 12, padding: 4, marginBottom: 14, gap: 4 }}>
          {eventFilters.map(ev => {
            const sel = activeEvent === ev
            return (
              <button key={ev} onClick={() => setActiveEvent(ev)}
                style={{ flex: 1, height: 38, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', background: sel ? 'var(--bg-card)' : 'transparent', color: sel ? 'var(--accent)' : 'var(--text-2)', boxShadow: sel ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 150ms ease' }}>
                {ev === 'All' ? 'All' : `${EVENT_ICON[ev]} ${ev}`}
              </button>
            )
          })}
        </div>
      )}

      {/* No league / no fixtures */}
      {!selectedLeague && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ fontSize: '2rem', marginBottom: 10 }}>📅</p>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>No leagues yet</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Fixtures will appear once a league is set up.</p>
        </div>
      )}
      {selectedLeague && fixtures.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 16px' }}>
          <p style={{ fontSize: '2rem', marginBottom: 10 }}>📅</p>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>No fixtures yet</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Fixtures will appear once the admin generates them in the Leagues section.</p>
        </div>
      )}

      {/* ── Upcoming / Results tab switcher ── */}
      {selectedLeague && fixtures.length > 0 && (
        <>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 }}>
            <TabBtn active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} badge={upcomingCount > 0 ? upcomingCount : null}>
              Upcoming
            </TabBtn>
            <TabBtn active={activeTab === 'results'} onClick={() => setActiveTab('results')} badge={resultsCount > 0 ? resultsCount : null}>
              Results
            </TabBtn>
          </div>

          {/* ── Upcoming tab ── */}
          {activeTab === 'upcoming' && (
            <>
              {live.length === 0 && upcoming.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <p style={{ fontSize: '1.8rem', marginBottom: 8 }}>✅</p>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>All matches played</p>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Check the Results tab for scores.</p>
                </div>
              )}
              {live.length > 0 && (
                <Section label="Live Now" fixtures={live} supportedTeam={supportedTeam} isAdmin={isAdmin} leagueId={selectedLeague?.id} showLiveDot />
              )}
              {upcoming.length > 0 && (
                <Section label="Upcoming" fixtures={upcoming} supportedTeam={supportedTeam} isAdmin={isAdmin} leagueId={selectedLeague?.id} />
              )}
            </>
          )}

          {/* ── Results tab ── */}
          {activeTab === 'results' && (
            <>
              {past.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <p style={{ fontSize: '1.8rem', marginBottom: 8 }}>🕐</p>
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>No results yet</p>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Results will appear here after matches are played.</p>
                </div>
              )}
              {past.length > 0 && <ResultsTable fixtures={past} supportedTeam={supportedTeam} leagueId={selectedLeague?.id} />}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Tab button ─────────────────────────────────────────────
function TabBtn({ active, onClick, badge, children }) {
  return (
    <button onClick={onClick}
      style={{ flex: 1, height: 40, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', background: active ? 'var(--bg-card)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-2)', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {children}
      {badge !== null && (
        <span style={{ minWidth: 18, height: 18, borderRadius: 20, background: active ? 'var(--accent)' : 'var(--border)', color: active ? '#fff' : 'var(--text-3)', fontSize: '0.6rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
          {badge}
        </span>
      )}
    </button>
  )
}

// ── Results table ──────────────────────────────────────────
function ResultsTable({ fixtures, supportedTeam, leagueId }) {
  const navigate = useNavigate()

  // Group by date descending (most recent first)
  const byDate = {}
  fixtures.forEach(f => {
    if (!byDate[f.date]) byDate[f.date] = []
    byDate[f.date].push(f)
  })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ marginBottom: 20 }}>
      {dates.map(date => (
        <div key={date} style={{ marginBottom: 14 }}>
          {/* Date header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)' }}>{formatDate(date)}</p>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Table card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Column headers */}
            <div className="fixture-header" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Home</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Score</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right', paddingRight: 8 }}>Away</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Event</span>
            </div>

            {byDate[date].map((f, idx) => {
              const isMyMatch   = supportedTeam && (f.homeTeam?.id === supportedTeam || f.awayTeam?.id === supportedTeam)
              const isCompleted = f.status === 'completed'
              const homeWon     = isCompleted && f.homeScore > f.awayScore
              const awayWon     = isCompleted && f.awayScore > f.homeScore
              const isLast      = idx === byDate[date].length - 1

              return (
                <div key={f.id}
                  onClick={() => leagueId && navigate(`/scoring/${leagueId}/${f.id}`)}
                  className="fixture-row"
                  style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', cursor: 'pointer', background: isMyMatch ? 'rgba(255,85,0,0.03)' : 'transparent', transition: 'background 120ms ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = isMyMatch ? 'rgba(255,85,0,0.03)' : 'transparent'}>

                  {/* Home team */}
                  <div className="team-name-cell">
                    {f.homeTeam?.logoUrl
                      ? <img src={f.homeTeam.logoUrl} alt={f.homeTeam.name} style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                      : <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0 }}>👥</div>}
                    <span className="team-name-text" style={{ fontWeight: homeWon ? 800 : 600, color: homeWon ? 'var(--text-1)' : 'var(--text-2)' }}>
                      {f.homeTeam?.name}
                    </span>
                    {homeWon && <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>🏆</span>}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCompleted ? (
                      <span style={{ fontWeight: 900, fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums', color: 'var(--text-1)', letterSpacing: '-0.5px' }}>
                        {f.homeScore ?? 0}–{f.awayScore ?? 0}
                      </span>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-3)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 6px' }}>TBD</span>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="team-name-cell" style={{ justifyContent: 'flex-end' }}>
                    {awayWon && <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>🏆</span>}
                    <span className="team-name-text" style={{ fontWeight: awayWon ? 800 : 600, textAlign: 'right', color: awayWon ? 'var(--text-1)' : 'var(--text-2)' }}>
                      {f.awayTeam?.name}
                    </span>
                    {f.awayTeam?.logoUrl
                      ? <img src={f.awayTeam.logoUrl} alt={f.awayTeam.name} style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                      : <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0 }}>👥</div>}
                  </div>

                  {/* Event badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: 'rgba(255,85,0,0.07)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.15)', whiteSpace: 'nowrap' }}>
                      {EVENT_ICON[f.event]} L{f.leg}
                    </span>
                  </div>

                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Upcoming section (grouped by date) ────────────────────
function Section({ label, fixtures, supportedTeam, isAdmin, leagueId, showLiveDot }) {
  const byDate = {}
  fixtures.forEach(f => {
    if (!byDate[f.date]) byDate[f.date] = []
    byDate[f.date].push(f)
  })
  const dates = Object.keys(byDate).sort()

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-3)', paddingLeft: 2, marginBottom: 10 }}>
        {showLiveDot && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22c55e', marginRight: 6, verticalAlign: 'middle' }} />}
        {label}
      </p>
      {dates.map(date => (
        <div key={date} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)' }}>{formatDate(date)}</p>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          {byDate[date].map(f => (
            <FixtureCard key={f.id} f={f} supportedTeam={supportedTeam} isAdmin={isAdmin} leagueId={leagueId} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Fixture card (upcoming/live) ──────────────────────────
function FixtureCard({ f, supportedTeam, isAdmin, leagueId }) {
  const navigate  = useNavigate()
  const isLive    = f.status === 'live'
  const isDone    = f.status === 'completed'
  const isMyMatch = supportedTeam && (f.homeTeam?.id === supportedTeam || f.awayTeam?.id === supportedTeam)

  return (
    <div className="card" style={{ marginBottom: 8, padding: 0, overflow: 'hidden', border: isMyMatch ? '1px solid rgba(255,85,0,0.35)' : isLive ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)', background: isMyMatch ? '#fff8f5' : 'var(--bg-card)' }}>
      {(isLive || isMyMatch) && (
        <div style={{ height: 3, background: isLive ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#ff5500,#ffb300)' }} />
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 0' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.15)' }}>
            {f.event ? `${EVENT_ICON[f.event] || ''} ${f.event}` : ''} · Leg {f.leg}
          </span>
          {isMyMatch && (
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent)', background: 'rgba(255,85,0,0.08)', border: '1px solid rgba(255,85,0,0.2)', borderRadius: 20, padding: '2px 7px' }}>❤️ My Team</span>
          )}
        </div>
        {isLive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, color: '#16a34a', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '2px 8px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />Live
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 12px' }}>
        <TeamBlock team={f.homeTeam} supported={f.homeTeam?.id === supportedTeam} align="right" />
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', textAlign: 'center', minWidth: 60, flexShrink: 0 }}>
          {isLive ? (
            <span style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{(f.sets || []).filter(s => s.winner === 'home').length} – {(f.sets || []).filter(s => s.winner === 'away').length}</span>
          ) : (
            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-3)' }}>vs</span>
          )}
        </div>
        <TeamBlock team={f.awayTeam} supported={f.awayTeam?.id === supportedTeam} align="left" />
      </div>

      {/* Score / Watch button */}
      <div style={{ padding: '0 14px 12px' }}>
        <button onClick={() => leagueId && navigate(`/scoring/${leagueId}/${f.id}`)}
          style={{ width: '100%', height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 150ms ease',
            background: isAdmin ? (isLive ? '#ff5500' : 'rgba(255,85,0,0.08)') : (isLive ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)'),
            color:      isAdmin ? (isLive ? '#fff'    : 'var(--accent)')        : (isLive ? '#16a34a'              : 'var(--text-2)'),
            border:     isAdmin ? (isLive ? 'none'    : '1px solid rgba(255,85,0,0.2)') : (isLive ? '1px solid rgba(34,197,94,0.25)' : '1px solid var(--border)'),
          }}>
          {isAdmin
            ? <>{isLive ? '● ' : ''}{ isLive ? 'Update Score' : 'Score Match'}</>
            : <>{isLive ? '● ' : ''}{ isLive ? 'Watch Live'   : 'Watch'}</>}
        </button>
      </div>
    </div>
  )
}

function TeamBlock({ team, supported, align }) {
  if (!team) return <div style={{ flex: 1 }} />
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, justifyContent: align === 'right' ? 'flex-end' : 'flex-start', overflow: 'hidden' }}>
      {align === 'right' && <span style={{ fontWeight: supported ? 800 : 700, fontSize: '0.9rem', color: supported ? 'var(--accent)' : 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
      {team.logoUrl
        ? <img src={team.logoUrl} alt={team.name} style={{ width: 32, height: 32, borderRadius: 7, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
        : <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>👥</div>}
      {align === 'left' && <span style={{ fontWeight: supported ? 800 : 700, fontSize: '0.9rem', color: supported ? 'var(--accent)' : 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
    </div>
  )
}
