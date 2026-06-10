import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
const EVENT_ICON = { Regu: '👟', Quad: '🏐' }

export default function Home() {
  const { user, isAdmin } = useAuth()
  const [allLeagues, setAllLeagues] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, 'leagues'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      all.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setAllLeagues(all)
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  const activeLeagues    = allLeagues.filter(l => l.status === 'active')
  const completedLeagues = allLeagues.filter(l => l.status === 'completed')

  return (
    <div className="page" style={{ paddingTop: 0 }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg,#ff5500 0%,#ff8c00 100%)', margin: '0 -16px', padding: '36px 24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        {/* subtle circle accents */}
        <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 50, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        {/* text */}
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
            Chennai Sepak Takraw
          </p>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 10 }}>
            {activeLeagues.length > 1 ? `${activeLeagues.length} Tournaments Live` : activeLeagues[0]?.name || 'League Dashboard'}
          </h1>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: '0.68rem', fontWeight: 700, color: '#fff' }}>
            {isAdmin ? '⚡ Admin' : `👤 ${user?.displayName?.split(' ')[0] || 'User'}`}
          </span>
        </div>
      </div>

      {/* ── Live Matches (all leagues combined) ── */}
      <LiveMatchesSection leagues={activeLeagues} />

      {/* ── Skeleton while loading ── */}
      {loading && <HomeSkeletons />}

      {/* ── League cards ── */}
      {!loading && activeLeagues.length === 0 && completedLeagues.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>🏐</p>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>No active tournaments</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Leagues will appear here once activated.</p>
        </div>
      )}

      {!loading && activeLeagues.map(league => (
        <LeagueCard key={league.id} league={league} />
      ))}

      {/* ── Past Tournaments ── */}
      {completedLeagues.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10, paddingLeft: 2 }}>
            Past Tournaments
          </p>
          {completedLeagues.map(league => (
            <CompletedLeagueRow key={league.id} league={league} />
          ))}
        </div>
      )}

    </div>
  )
}

function HomeSkeletons() {
  const S = ({ w = '100%', h = 14, r = 6, mb = 0 }) => (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
  )
  return (
    <>
      {[0, 1].map(i => (
        <div key={i} className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <S w="40%" h={10} mb={6} />
            <S w="60%" h={16} mb={10} />
            <div style={{ display: 'flex', gap: 8 }}>
              <S w="30%" h={34} r={8} /> <S w="30%" h={34} r={8} />
            </div>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <S w={26} h={26} r={6} />
            <S w={26} h={26} r={13} />
            <S w="40%" h={14} />
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <S w={28} h={28} r={4} /> <S w={28} h={28} r={4} /> <S w={28} h={28} r={4} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

// ── Live matches across ALL leagues ───────────────────────
function LiveMatchesSection({ leagues }) {
  const navigate = useNavigate()
  const [liveByLeague, setLiveByLeague] = useState({}) // leagueId → fixtures[]

  useEffect(() => {
    if (leagues.length === 0) { setLiveByLeague({}); return }
    const unsubs = leagues.map(league =>
      onSnapshot(
        collection(db, 'leagues', league.id, 'fixtures'),
        snap => {
          const live = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(f => f.status === 'live')
          setLiveByLeague(prev => ({ ...prev, [league.id]: { fixtures: live, leagueName: league.name } }))
        }
      )
    )
    return () => unsubs.forEach(u => u())
  }, [leagues.map(l => l.id).join(',')])

  const allLive = Object.entries(liveByLeague).flatMap(([leagueId, data]) =>
    data.fixtures.map(f => ({ ...f, leagueId, leagueName: data.leagueName }))
  )

  if (allLive.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
        <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Matches Going On · {allLive.length}
        </p>
      </div>
      {allLive.map(f => (
        <div key={f.id} className="card"
          onClick={() => navigate(`/scoring/${f.leagueId}/${f.id}`)}
          style={{ border: '1px solid rgba(34,197,94,0.3)', marginBottom: 10, cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)' }}>{f.leagueName}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.15)' }}>
                {EVENT_ICON[f.event]} {f.event} · L{f.leg}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamBlock team={f.homeTeam} align="right" />
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '5px 12px', textAlign: 'center', flexShrink: 0 }}>
                <p style={{ fontWeight: 900, fontSize: '1rem', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                  {(f.sets || []).filter(s => s.winner === 'home').length} – {(f.sets || []).filter(s => s.winner === 'away').length}
                </p>
                <p style={{ fontSize: '0.5rem', color: 'var(--text-3)', fontWeight: 600 }}>SETS</p>
              </div>
              <TeamBlock team={f.awayTeam} align="left" />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>Tap to watch scores →</p>
              {f.liveUrl && (
                <a href={f.liveUrl} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', fontWeight: 700, fontSize: '0.68rem', textDecoration: 'none', flexShrink: 0 }}>
                  📺 Watch Live
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Compact league card ────────────────────────────────────
function LeagueCard({ league }) {
  const navigate = useNavigate()
  const [teams,    setTeams]    = useState([])
  const [fixtures, setFixtures] = useState([])

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'leagues', league.id, 'teams'),
      snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(
      collection(db, 'leagues', league.id, 'fixtures'),
      snap => setFixtures(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2() }
  }, [league.id])

  const today    = new Date().toISOString().split('T')[0]
  const live     = fixtures.filter(f => f.status === 'live')
  const todayFix = fixtures.filter(f => f.date === today && f.status === 'scheduled')
  const played   = fixtures.filter(f => f.status === 'completed')
  const events   = league.events || []
  const [activeEvent, setActiveEvent] = useState(() => events[0] || null)

  const getStats = (team) => {
    const s = activeEvent ? (team.eventStats?.[activeEvent] || {}) : {}
    return {
      w: s.w || 0, l: s.l || 0, p: s.p || 0,
      setsWon: s.setsWon || 0, setsLost: s.setsLost || 0,
      ptsFor: s.ptsFor || 0, ptsAgainst: s.ptsAgainst || 0,
      pts: s.pts || 0,
    }
  }

  const topTeams = [...teams].sort((a, b) => {
    const sa = getStats(a), sb = getStats(b)
    const wD = sb.pts - sa.pts; if (wD) return wD
    const sD = (sb.setsWon - sb.setsLost) - (sa.setsWon - sa.setsLost); if (sD) return sD
    return (sb.ptsFor - sb.ptsAgainst) - (sa.ptsFor - sa.ptsAgainst)
  }).slice(0, 2)

  const goTable    = () => { sessionStorage.setItem('selectedLeagueId', league.id); navigate('/table') }
  const goFixtures = () => { sessionStorage.setItem('selectedLeagueId', league.id); navigate('/fixtures') }

  return (
    <div className="card" style={{ marginBottom: 14, padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* ── Header bar ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
              {league.year ? `Season ${league.year}` : 'Active'}
            </p>
            <p style={{ fontWeight: 800, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{league.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {live.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', fontWeight: 700, color: '#16a34a', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '3px 8px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> {live.length} Live
              </span>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={goTable}
            style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-1)' }}>
            📊 Table
          </button>
          <button onClick={goFixtures}
            style={{ flex: 1, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-1)' }}>
            📅 Fixtures
          </button>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600 }}>
              {played.length}P · {todayFix.length > 0 ? `${todayFix.length} today` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Event tabs (only if league has multiple events) ── */}
      {events.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          {events.map(ev => (
            <button key={ev} onClick={() => setActiveEvent(ev)}
              style={{
                height: 28, padding: '0 12px', borderRadius: 20, fontFamily: 'inherit',
                fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                border: activeEvent === ev ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                background: activeEvent === ev ? 'rgba(255,85,0,0.08)' : 'var(--bg-card)',
                color: activeEvent === ev ? 'var(--accent)' : 'var(--text-2)',
                transition: 'all 150ms ease',
              }}>
              {EVENT_ICON[ev]} {ev}
            </button>
          ))}
        </div>
      )}

      {/* ── Top 2 teams ── */}
      {topTeams.length > 0 && topTeams.map((team, idx) => {
        const s       = getStats(team)
        const setDiff = s.setsWon - s.setsLost
        const pd      = s.ptsFor - s.ptsAgainst
        const medal   = idx === 0 ? '🥇' : '🥈'
        return (
          <div key={team.id} style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: idx === 0 ? 'rgba(255,85,0,0.03)' : 'transparent',
          }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{medal}</span>
            {team.logoUrl
              ? <img src={team.logoUrl} referrerPolicy="no-referrer" alt={team.name}
                  style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
              : <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>👥</div>
            }
            <span style={{ flex: 1, fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {[
                { l: 'Pts',  v: s.pts,                                   c: 'var(--accent)'                    },
                { l: 'W',    v: s.w,                                     c: 'var(--text-1)'                    },
                { l: 'L',    v: s.l,                                     c: 'var(--text-2)'                    },
                { l: 'Sets', v: `${setDiff >= 0 ? '+' : ''}${setDiff}`, c: setDiff >= 0 ? '#16a34a' : '#dc2626' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '0.55rem', color: 'var(--text-3)', fontWeight: 600 }}>{l}</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums' }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

    </div>
  )
}

// ── Completed league row ───────────────────────────────────
function CompletedLeagueRow({ league }) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])

  useEffect(() => {
    return onSnapshot(collection(db, 'leagues', league.id, 'teams'),
      snap => setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [league.id])

  const champion = [...teams].sort((a, b) => {
    const wD = (b.w||0)-(a.w||0); if (wD) return wD
    const sD = ((b.setsWon||0)-(b.setsLost||0))-((a.setsWon||0)-(a.setsLost||0)); if (sD) return sD
    return ((b.ptsFor||0)-(b.ptsAgainst||0))-((a.ptsFor||0)-(a.ptsAgainst||0))
  })[0] || null

  const goTable = () => { sessionStorage.setItem('selectedLeagueId', league.id); navigate('/table') }

  return (
    <div className="card" style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid rgba(234,179,8,0.2)', background: 'linear-gradient(135deg,rgba(234,179,8,0.03),transparent)', cursor: 'pointer' }}
      onClick={goTable}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🏆</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{league.name}</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 1 }}>
            {league.year ? `Season ${league.year}` : ''}{champion ? ` · 👑 ${champion.name}` : ''}
          </p>
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>Table →</span>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────
function TeamBlock({ team, align }) {
  if (!team) return <div style={{ flex: 1 }} />
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: align === 'right' ? 'flex-end' : 'flex-start', overflow: 'hidden' }}>
      {align === 'right' && <span style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
      {team.logoUrl
        ? <img src={team.logoUrl} alt={team.name} style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
        : <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>👥</div>}
      {align === 'left' && <span style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
    </div>
  )
}
