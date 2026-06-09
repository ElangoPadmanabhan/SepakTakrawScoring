import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const ROLE_STYLES = {
  Captain:      { bg: 'rgba(217,119,6,0.12)',  color: '#b45309', border: 'rgba(217,119,6,0.3)'  },
  'Vice Captain':{ bg: 'rgba(99,102,241,0.1)',  color: '#6366f1', border: 'rgba(99,102,241,0.25)'},
  Player:       { bg: 'rgba(100,116,139,0.08)', color: '#64748b', border: 'rgba(100,116,139,0.2)'},
}
const POSITION_STYLES = {
  Feeder:  { bg: 'rgba(34,197,94,0.08)',  color: '#16a34a', border: 'rgba(34,197,94,0.2)'  },
  Striker: { bg: 'rgba(239,68,68,0.08)',  color: '#dc2626', border: 'rgba(239,68,68,0.2)'  },
  Tekong:  { bg: 'rgba(14,165,233,0.08)', color: '#0284c7', border: 'rgba(14,165,233,0.2)' },
}

function PlayerAvatar({ player, size = 48 }) {
  const [err, setErr] = useState(false)
  return (player.photoUrl && !err)
    ? <img src={player.photoUrl} alt={player.name} referrerPolicy="no-referrer" onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-mid)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: size * 0.36, color: 'var(--accent)', flexShrink: 0 }}>
        {player.name?.[0]?.toUpperCase() || '?'}
      </div>
}

export default function TeamSheet({ team, leagueId, open, onClose }) {
  const [players, setPlayers] = useState([])
  const [logoErr, setLogoErr] = useState(false)
  const [visible, setVisible] = useState(false)

  // Load players
  useEffect(() => {
    if (!open || !team || !leagueId) return
    return onSnapshot(
      collection(db, 'leagues', leagueId, 'teams', team.id, 'players'),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        // Sort: Captain first, then VC, then Players
        const order = { Captain: 0, 'Vice Captain': 1, Player: 2 }
        all.sort((a, b) => (order[a.role] ?? 3) - (order[b.role] ?? 3))
        setPlayers(all)
      }
    )
  }, [open, team?.id, leagueId])

  // Stagger animation trigger
  useEffect(() => {
    if (open) {
      setLogoErr(false)
      setTimeout(() => setVisible(true), 50)
    } else {
      setVisible(false)
    }
  }, [open])

  if (!open && !visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 400,
          opacity: visible ? 1 : 0,
          transition: 'opacity 220ms ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '100%'})`,
        transition: 'transform 320ms cubic-bezier(0.32,0.72,0,1)',
        width: '100%', maxWidth: 480,
        background: 'var(--bg-card)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)',
        borderBottom: 'none',
        zIndex: 401,
        maxHeight: '88dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* Team header */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 24px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* Logo with scale-in animation */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--accent)',
            background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: visible ? 'scale(1)' : 'scale(0.6)',
            opacity: visible ? 1 : 0,
            transition: 'transform 380ms cubic-bezier(0.34,1.56,0.64,1), opacity 280ms ease',
            marginBottom: 12,
            boxShadow: '0 0 0 6px rgba(255,85,0,0.08)',
          }}>
            {(team?.logoUrl && !logoErr)
              ? <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" onError={() => setLogoErr(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '2.2rem' }}>👥</span>
            }
          </div>

          <h2 style={{
            fontWeight: 900, fontSize: '1.2rem', textAlign: 'center',
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            opacity: visible ? 1 : 0,
            transition: 'transform 320ms ease 80ms, opacity 280ms ease 80ms',
          }}>
            {team?.name}
          </h2>
          <p style={{
            color: 'var(--text-3)', fontSize: '0.78rem', marginTop: 4,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            opacity: visible ? 1 : 0,
            transition: 'transform 320ms ease 120ms, opacity 280ms ease 120ms',
          }}>
            {players.length} Player{players.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Player list */}
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)' }}>
          {players.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem', padding: '32px 16px' }}>
              No players added yet
            </p>
          ) : (
            players.map((player, i) => (
              <PlayerRow key={player.id} player={player} index={i} visible={visible} />
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </>
  )
}

function PlayerRow({ player, index, visible }) {
  const rs = ROLE_STYLES[player.role] || ROLE_STYLES.Player
  const ps = POSITION_STYLES[player.position]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px',
      borderBottom: '1px solid var(--border)',
      transform: visible ? 'translateX(0)' : 'translateX(-20px)',
      opacity: visible ? 1 : 0,
      transition: `transform 350ms ease ${160 + index * 45}ms, opacity 300ms ease ${160 + index * 45}ms`,
    }}>
      <PlayerAvatar player={player} size={48} />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.name}
        </p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {/* Role badge */}
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
            {player.role === 'Captain' ? '© Captain' : player.role === 'Vice Captain' ? '© Vice Captain' : 'Player'}
          </span>
          {/* Position badge */}
          {ps && (
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
              {player.position}
            </span>
          )}
          {/* Event tags */}
          {(player.events || []).map(ev => (
            <span key={ev} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.2)' }}>
              {ev === 'Regu' ? '👟' : '🏐'} {ev}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
