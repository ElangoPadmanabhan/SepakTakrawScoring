import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export default function PlayerOfWeekendModal({ league, existingCount, onClose }) {
  const [teams,    setTeams]    = useState([])
  const [players,  setPlayers]  = useState([]) // flat list with teamName/teamId
  const [selected, setSelected] = useState(null)
  const [label,    setLabel]    = useState(`Weekend ${existingCount + 1}`)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const teamsSnap = await getDocs(collection(db, 'leagues', league.id, 'teams'))
        const teamList  = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setTeams(teamList)

        const all = []
        for (const team of teamList) {
          const playersSnap = await getDocs(collection(db, 'leagues', league.id, 'teams', team.id, 'players'))
          playersSnap.docs.forEach(d => all.push({
            id:          d.id,
            teamId:      team.id,
            teamName:    team.name,
            teamLogoUrl: team.logoUrl || null,
            ...d.data(),
          }))
        }
        setPlayers(all.sort((a, b) => a.teamName.localeCompare(b.teamName) || a.name.localeCompare(b.name)))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [league.id])

  const filtered = players.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.teamName?.toLowerCase().includes(search.toLowerCase())
  )

  const save = async () => {
    if (!selected || !label.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'leagues', league.id, 'weekendAwards'), {
        playerId:    selected.id,
        playerName:  selected.name,
        photoUrl:    selected.photoUrl || null,
        teamId:      selected.teamId,
        teamName:    selected.teamName,
        teamLogoUrl: selected.teamLogoUrl || null,
        role:        selected.role || null,
        position:    selected.position || null,
        weekend:     label.trim(),
        weekendDate: new Date().toISOString().split('T')[0],
        createdAt:   serverTimestamp(),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>
                {league.name}
              </p>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>⭐ Player of the Weekend</h2>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-elevated)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>

          {/* Weekend label input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Label:</span>
            <input value={label} onChange={e => setLabel(e.target.value)}
              style={{ flex: 1, height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '0 10px', fontSize: '0.85rem', fontFamily: 'inherit', color: 'var(--text-1)' }} />
          </div>

          {/* Search */}
          <input placeholder="Search player or team…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', padding: '0 12px', fontSize: '0.85rem', fontFamily: 'inherit', color: 'var(--text-1)', boxSizing: 'border-box' }} />
        </div>

        {/* Player list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 16px', fontSize: '0.85rem' }}>Loading players…</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 16px', fontSize: '0.85rem' }}>No players found.</p>
          ) : (
            filtered.map(player => {
              const isSel = selected?.id === player.id && selected?.teamId === player.teamId
              return (
                <div key={`${player.teamId}-${player.id}`}
                  onClick={() => setSelected(isSel ? null : player)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', background: isSel ? 'rgba(255,85,0,0.06)' : 'transparent', borderLeft: isSel ? '3px solid var(--accent)' : '3px solid transparent', transition: 'all 0.12s' }}>
                  {/* Photo */}
                  {player.photoUrl
                    ? <img src={player.photoUrl} alt={player.name} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', border: isSel ? '2px solid var(--accent)' : '1px solid var(--border)', flexShrink: 0 }} />
                    : <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--bg-elevated)', border: isSel ? '2px solid var(--accent)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>👤</div>}
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, color: isSel ? 'var(--accent)' : 'var(--text-1)' }}>{player.name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span>{player.teamName}</span>
                      {player.role && <span style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: '1px 5px' }}>{player.role}</span>}
                      {player.position && <span style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: '1px 5px' }}>{player.position}</span>}
                    </p>
                  </div>
                  {isSel && <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⭐</span>}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {selected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 12px', background: 'rgba(255,85,0,0.06)', borderRadius: 10, border: '1px solid rgba(255,85,0,0.15)' }}>
              {selected.photoUrl
                ? <img src={selected.photoUrl} alt={selected.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>👤</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)' }}>{selected.name}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{selected.teamName}</p>
              </div>
            </div>
          )}
          <button onClick={save} disabled={!selected || !label.trim() || saving}
            style={{ width: '100%', height: 46, borderRadius: 12, background: selected ? 'var(--accent)' : 'var(--bg-elevated)', color: selected ? '#fff' : 'var(--text-3)', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            {saving ? 'Saving…' : selected ? `Award ${label} to ${selected.name}` : 'Select a player first'}
          </button>
        </div>

      </div>
    </div>
  )
}
