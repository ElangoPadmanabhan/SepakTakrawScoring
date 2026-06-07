import { useState, useEffect, useRef } from 'react'
import Spinner from '../components/Spinner'
import { useParams, useNavigate } from 'react-router-dom'
import {
  doc, getDoc, updateDoc, collection,
  addDoc, onSnapshot, deleteDoc, serverTimestamp,
  getDocs, writeBatch, query, orderBy,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

const STATUS_OPTIONS = ['upcoming', 'active', 'completed']
const STATUS_STYLES = {
  active:    { bg: 'rgba(34,197,94,0.1)',   color: '#16a34a', border: 'rgba(34,197,94,0.25)'   },
  upcoming:  { bg: 'rgba(255,85,0,0.08)',   color: '#ff5500', border: 'rgba(255,85,0,0.2)'     },
  completed: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.2)'  },
}

const ROLES = ['Player', 'Captain', 'Vice Captain']
const ROLE_STYLES = {
  'Captain':       { bg: 'rgba(255,179,0,0.12)', color: '#b45309', border: 'rgba(255,179,0,0.3)' },
  'Vice Captain':  { bg: 'rgba(99,102,241,0.1)', color: '#4338ca', border: 'rgba(99,102,241,0.25)' },
  'Player':        { bg: 'var(--bg-elevated)',    color: 'var(--text-2)', border: 'var(--border)' },
}

const POSITIONS = ['Feeder', 'Tekong', 'Killer']
const POSITION_STYLES = {
  'Feeder':  { bg: 'rgba(34,197,94,0.1)',   color: '#15803d', border: 'rgba(34,197,94,0.3)'  },
  'Tekong':  { bg: 'rgba(14,165,233,0.1)',  color: '#0369a1', border: 'rgba(14,165,233,0.3)' },
  'Killer':  { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c', border: 'rgba(239,68,68,0.3)'  },
}

/* ─── upload helper ─── */
async function uploadImage(path, file) {
  const snap = await uploadBytes(ref(storage, path), file)
  return getDownloadURL(snap.ref)
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function LeagueDetail() {
  const { leagueId } = useParams()
  const navigate = useNavigate()

  const [league, setLeague]           = useState(null)
  const [teams, setTeams]             = useState([])
  const [editMode, setEditMode]       = useState(false)
  const [form, setForm]               = useState({})
  const [saving, setSaving]           = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [errors, setErrors]           = useState({})

  useEffect(() => {
    getDoc(doc(db, 'leagues', leagueId)).then(snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setLeague(data)
        setForm({ name: data.name, year: data.year, startDate: data.startDate || '', endDate: data.endDate || '', status: data.status, events: data.events || [] })
      }
    })
  }, [leagueId])

  useEffect(() => {
    return onSnapshot(collection(db, 'leagues', leagueId, 'teams'), snap =>
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [leagueId])

  const saveLeague = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.startDate)   errs.startDate = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await updateDoc(doc(db, 'leagues', leagueId), {
      name: form.name.trim(), year: form.year,
      startDate: form.startDate, endDate: form.endDate || null,
      status: form.status, events: form.events,
    })
    setLeague(l => ({ ...l, ...form }))
    setSaving(false)
    setEditMode(false)
    setErrors({})
  }

  if (!league) return <LoadingPage />

  const s = STATUS_STYLES[league.status] || STATUS_STYLES.upcoming

  return (
    <div className="page">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px 0' }}>
          <BackIcon />
        </button>
        <div style={{ flex: 1 }}>
          <p className="page-subtitle">Admin Panel</p>
          <h1 className="page-title" style={{ fontSize: '1.25rem' }}>League Details</h1>
        </div>
      </div>

      {/* League info card */}
      <div className="card" style={{ marginBottom: 20, border: league.status === 'active' ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--border)', background: league.status === 'active' ? '#f0fdf4' : 'var(--bg-card)', overflow: 'hidden' }}>
        {league.status === 'active' && (
          <div style={{ height: 3, background: 'linear-gradient(90deg,#22c55e,#16a34a)', margin: '-16px -16px 14px', borderRadius: '14px 14px 0 0' }} />
        )}

        {!editMode ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4 }}>{league.name}</p>
                <p style={{ color: 'var(--text-2)', fontSize: '0.8rem', marginBottom: 8 }}>
                  {league.startDate}{league.endDate ? ` → ${league.endDate}` : ''} · {league.year}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {league.status.charAt(0).toUpperCase() + league.status.slice(1)}
                  </span>
                  {(league.events || []).map(ev => (
                    <span key={ev} style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.2)' }}>
                      {ev === 'Regu' ? '👟' : '🏐'} {ev}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setEditMode(true)} style={{ height: 36, padding: '0 14px', fontSize: '0.8rem', gap: 6, flexShrink: 0 }}>
                <EditIcon /> Edit
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={saveLeague} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 4 }}>Edit League</p>
            <Field label="League Name *" error={errors.name}>
              <input style={inputStyle(errors.name)} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Year">
                <input style={inputStyle()} value={form.year} type="number" min="2020" max="2099" onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              </Field>
              <Field label="Status">
                <select style={{ ...inputStyle(), cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Start Date *" error={errors.startDate}>
                <input style={inputStyle(errors.startDate)} type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </Field>
              <Field label="End Date">
                <input style={inputStyle()} type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </Field>
            </div>
            <Field label="Events">
              <div style={{ display: 'flex', gap: 10 }}>
                {['Regu', 'Quad'].map(ev => {
                  const sel = (form.events || []).includes(ev)
                  return (
                    <button key={ev} type="button" onClick={() => setForm(f => ({ ...f, events: (f.events||[]).includes(ev) ? (f.events||[]).filter(e=>e!==ev) : [...(f.events||[]),ev] }))}
                      style={{ flex:1, height:48, borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.88rem', background: sel?'var(--accent)':'var(--bg-elevated)', color: sel?'#fff':'var(--text-2)', border: sel?'2px solid var(--accent)':'2px solid var(--border)', transition:'all 150ms ease', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      {ev==='Regu'?'👟':'🏐'} {ev}
                    </button>
                  )
                })}
              </div>
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(false); setErrors({}) }} style={{ flex:1, height:44 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex:2, height:44, fontSize:'0.9rem' }}>
                {saving ? <><Spinner /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Teams section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p className="page-subtitle" style={{ marginBottom: 2 }}>Teams</p>
          <p style={{ fontWeight: 800, fontSize: '1rem' }}>{teams.length} Team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddTeam(true)} style={{ height: 38, padding: '0 14px', fontSize: '0.8rem', gap: 6 }}>
          <PlusIcon /> Add Team
        </button>
      </div>

      {teams.length === 0 && !showAddTeam && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: '1.8rem', marginBottom: 10 }}>👥</p>
          <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 6 }}>No teams yet</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Add teams to this league.</p>
        </div>
      )}

      {showAddTeam && <AddTeamForm leagueId={leagueId} onClose={() => setShowAddTeam(false)} />}

      {teams.map(team => (
        <TeamCard key={team.id} team={team} leagueId={leagueId} leagueEvents={league.events || []} />
      ))}

      {/* Fixtures */}
      <FixturesSection leagueId={leagueId} league={league} teams={teams} />

    </div>
  )
}

/* ══════════════════════════════════════════
   ADD TEAM FORM
══════════════════════════════════════════ */
function AddTeamForm({ leagueId, onClose }) {
  const [name, setName]         = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [preview, setPreview]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2MB'); return }
    setLogoFile(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Team name is required'); return }
    setSaving(true)
    try {
      const teamRef = await addDoc(collection(db, 'leagues', leagueId, 'teams'), { name: name.trim(), logoUrl: null, createdAt: serverTimestamp() })
      if (logoFile) {
        const logoUrl = await uploadImage(`teams/${leagueId}/${teamRef.id}/logo`, logoFile)
        await updateDoc(doc(db, 'leagues', leagueId, 'teams', teamRef.id), { logoUrl })
      }
      onClose()
    } catch { setError('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 12, border: '1px solid rgba(255,85,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Add Team</p>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: '1.1rem' }}>✕</button>
      </div>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LogoUploadBox preview={preview} onClick={() => fileRef.current?.click()} size={64} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>Team Logo</p>
            <p style={{ color: 'var(--text-2)', fontSize: '0.75rem', marginBottom: 6 }}>PNG or JPG · Max 2MB</p>
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ height: 34, padding: '0 12px', fontSize: '0.78rem' }}>
              {preview ? 'Change' : 'Upload'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
        <Field label="Team Name *">
          <input style={inputStyle(error && !name.trim())} placeholder="e.g. Chennai Challengers" value={name} onChange={e => { setName(e.target.value); setError('') }} />
        </Field>
        {error && <p style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 44 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2, height: 44, fontSize: '0.9rem' }}>
            {saving ? <><Spinner /> Saving…</> : 'Add Team'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ══════════════════════════════════════════
   TEAM CARD  (with player management)
══════════════════════════════════════════ */
function TeamCard({ team, leagueId, leagueEvents }) {
  const [editMode, setEditMode]   = useState(false)
  const [expanded, setExpanded]   = useState(false)
  const [name, setName]           = useState(team.name)
  const [logoFile, setLogoFile]   = useState(null)
  const [preview, setPreview]     = useState(team.logoUrl)
  const [saving, setSaving]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [players, setPlayers]     = useState([])
  const fileRef = useRef()

  // Live players
  useEffect(() => {
    return onSnapshot(
      collection(db, 'leagues', leagueId, 'teams', team.id, 'players'),
      snap => setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
  }, [leagueId, team.id])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      let logoUrl = team.logoUrl
      if (logoFile) logoUrl = await uploadImage(`teams/${leagueId}/${team.id}/logo`, logoFile)
      await updateDoc(doc(db, 'leagues', leagueId, 'teams', team.id), { name: name.trim(), logoUrl })
      setEditMode(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (team.logoUrl) await deleteObject(ref(storage, `teams/${leagueId}/${team.id}/logo`)).catch(() => {})
    await deleteDoc(doc(db, 'leagues', leagueId, 'teams', team.id))
  }

  const captain = players.find(p => p.role === 'Captain')

  return (
    <div className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>

      {/* Team header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {team.logoUrl ? <img src={team.logoUrl} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.3rem' }}>👥</span>}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>{team.name}</p>
          <p style={{ color: 'var(--text-3)', fontSize: '0.72rem', marginTop: 2 }}>
            {players.length} player{players.length !== 1 ? 's' : ''}
            {captain ? ` · C: ${captain.name}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setExpanded(v => !v)}
            style={{ width: 36, height: 36, padding: 0, borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
            {expanded ? '▲' : '▼'}
          </button>
          <button className="btn btn-secondary" onClick={() => { setEditMode(v => !v); setExpanded(true) }}
            style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}>
            <EditIcon size={15} />
          </button>
          {confirmDel
            ? <button className="btn" onClick={handleDelete} style={{ height: 36, padding: '0 10px', fontSize: '0.75rem', background: '#dc2626', color: '#fff', borderRadius: 8 }}>Confirm</button>
            : <button className="btn btn-secondary" onClick={() => setConfirmDel(true)} style={{ width: 36, height: 36, padding: 0, borderRadius: 8, color: '#dc2626' }}><TrashIcon /></button>}
        </div>
      </div>

      {/* Inline edit */}
      {editMode && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <LogoUploadBox preview={preview} onClick={() => fileRef.current?.click()} size={52} />
            <input style={{ ...inputStyle(), flex: 1 }} value={name} onChange={e => setName(e.target.value)} placeholder="Team name" />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => { setEditMode(false); setName(team.name); setPreview(team.logoUrl) }} style={{ flex: 1, height: 40 }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 2, height: 40, fontSize: '0.85rem' }}>
              {saving ? <><Spinner /> Saving…</> : 'Save Team'}
            </button>
          </div>
        </div>
      )}

      {/* Expanded player section */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>

          {/* Player list */}
          <div style={{ padding: '12px 16px' }}>
            {players.length === 0 && !showAddPlayer && (
              <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', textAlign: 'center', padding: '8px 0' }}>No players added yet.</p>
            )}

            {players.map(player => (
              <PlayerRow key={player.id} player={player} leagueId={leagueId} teamId={team.id} leagueEvents={leagueEvents} />
            ))}

            {showAddPlayer
              ? <AddPlayerForm leagueId={leagueId} teamId={team.id} onClose={() => setShowAddPlayer(false)} existingPlayers={players} leagueEvents={leagueEvents} />
              : (
                <button className="btn btn-secondary" onClick={() => setShowAddPlayer(true)}
                  style={{ width: '100%', height: 40, fontSize: '0.82rem', gap: 6, marginTop: players.length > 0 ? 10 : 0 }}>
                  <PlusIcon /> Add Player
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   ADD PLAYER FORM
══════════════════════════════════════════ */
function AddPlayerForm({ leagueId, teamId, onClose, existingPlayers, leagueEvents }) {
  const [name, setName]           = useState('')
  const [role, setRole]           = useState('Player')
  const [position, setPosition]   = useState('Feeder')
  const [events, setEvents]       = useState(leagueEvents.length === 1 ? [...leagueEvents] : [...leagueEvents])
  const [photoFile, setPhotoFile] = useState(null)
  const [preview, setPreview]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef()

  const toggleEvent = (ev) =>
    setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setError('Photo must be under 3MB'); return }
    setPhotoFile(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Player name is required'); return }
    if (role === 'Captain' && existingPlayers.some(p => p.role === 'Captain')) {
      setError('A captain already exists. Remove or change the current captain first.')
      return
    }
    if (role === 'Vice Captain' && existingPlayers.some(p => p.role === 'Vice Captain')) {
      setError('A vice captain already exists.')
      return
    }
    if (leagueEvents.length > 0 && events.length === 0) {
      setError('Select at least one event.')
      return
    }
    setSaving(true)
    try {
      const playerRef = await addDoc(
        collection(db, 'leagues', leagueId, 'teams', teamId, 'players'),
        { name: name.trim(), role, position, events, photoUrl: null, createdAt: serverTimestamp() }
      )
      if (photoFile) {
        const photoUrl = await uploadImage(`players/${leagueId}/${teamId}/${playerRef.id}/photo`, photoFile)
        await updateDoc(doc(db, 'leagues', leagueId, 'teams', teamId, 'players', playerRef.id), { photoUrl })
      }
      onClose()
    } catch { setError('Failed to save. Try again.') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,85,0,0.18)', borderRadius: 12, padding: 14, marginTop: 10 }}>
      <p style={{ fontWeight: 800, fontSize: '0.88rem', marginBottom: 12 }}>Add Player</p>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Photo + name row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-elevated)', border: '2px dashed var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {preview
              ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width="22" height="22" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          </div>
          <input style={{ ...inputStyle(), flex: 1 }} placeholder="Player name" value={name} onChange={e => { setName(e.target.value); setError('') }} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>

        {/* Role selector */}
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Role</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {ROLES.map(r => {
              const sel = role === r
              const rs = ROLE_STYLES[r]
              return (
                <button key={r} type="button" onClick={() => setRole(r)}
                  style={{ flex: 1, height: 42, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', background: sel ? rs.bg : 'var(--bg-elevated)', color: sel ? rs.color : 'var(--text-3)', border: sel ? `1.5px solid ${rs.border}` : '1.5px solid var(--border)', transition: 'all 150ms ease' }}>
                  {r === 'Captain' ? '© C' : r === 'Vice Captain' ? '© VC' : 'Player'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Position selector */}
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Position</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {POSITIONS.map(pos => {
              const sel = position === pos
              const ps = POSITION_STYLES[pos]
              return (
                <button key={pos} type="button" onClick={() => setPosition(pos)}
                  style={{ flex: 1, height: 42, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', background: sel ? ps.bg : 'var(--bg-elevated)', color: sel ? ps.color : 'var(--text-3)', border: sel ? `1.5px solid ${ps.border}` : '1.5px solid var(--border)', transition: 'all 150ms ease' }}>
                  {pos}
                </button>
              )
            })}
          </div>
        </div>

        {/* Event selector — only shown when league has events */}
        {leagueEvents.length > 0 && (
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              Playing In {leagueEvents.length > 1 ? '(select all that apply)' : ''}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {leagueEvents.map(ev => {
                const sel = events.includes(ev)
                return (
                  <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                    style={{ flex: 1, height: 42, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', background: sel ? 'var(--accent)' : 'var(--bg-elevated)', color: sel ? '#fff' : 'var(--text-3)', border: sel ? '1.5px solid var(--accent)' : '1.5px solid var(--border)', transition: 'all 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {ev === 'Regu' ? '👟' : '🏐'} {ev}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && <p style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 40 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2, height: 40, fontSize: '0.85rem' }}>
            {saving ? <><Spinner /> Saving…</> : 'Add Player'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ══════════════════════════════════════════
   PLAYER ROW
══════════════════════════════════════════ */
function PlayerRow({ player, leagueId, teamId, leagueEvents }) {
  const [editMode, setEditMode]     = useState(false)
  const [name, setName]             = useState(player.name)
  const [role, setRole]             = useState(player.role)
  const [position, setPosition]     = useState(player.position || 'Feeder')
  const [events, setEvents]         = useState(player.events || [...(leagueEvents || [])])
  const [photoFile, setPhotoFile]   = useState(null)
  const [preview, setPreview]       = useState(player.photoUrl)
  const [saving, setSaving]         = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRef = useRef()

  const toggleEvent = (ev) =>
    setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      let photoUrl = player.photoUrl
      if (photoFile) photoUrl = await uploadImage(`players/${leagueId}/${teamId}/${player.id}/photo`, photoFile)
      await updateDoc(doc(db, 'leagues', leagueId, 'teams', teamId, 'players', player.id), { name: name.trim(), role, position, events, photoUrl })
      setEditMode(false)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (player.photoUrl) await deleteObject(ref(storage, `players/${leagueId}/${teamId}/${player.id}/photo`)).catch(() => {})
    await deleteDoc(doc(db, 'leagues', leagueId, 'teams', teamId, 'players', player.id))
  }

  const cancelEdit = () => {
    setEditMode(false)
    setName(player.name)
    setRole(player.role)
    setPosition(player.position || 'Feeder')
    setEvents(player.events || [...(leagueEvents || [])])
    setPreview(player.photoUrl)
  }

  if (editMode) {
    return (
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card)', border: '2px dashed var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserIcon />}
          </div>
          <input style={{ ...inputStyle(), flex: 1 }} value={name} onChange={e => setName(e.target.value)} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f=e.target.files[0]; if(f){ setPhotoFile(f); setPreview(URL.createObjectURL(f)) } }} />
        </div>
        {/* Role */}
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Role</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {ROLES.map(r => {
            const sel = role === r
            const rs = ROLE_STYLES[r]
            return (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{ flex:1, height:36, borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.68rem', background: sel?rs.bg:'var(--bg-card)', color: sel?rs.color:'var(--text-3)', border: sel?`1.5px solid ${rs.border}`:'1.5px solid var(--border)', transition:'all 150ms ease' }}>
                {r==='Captain'?'© C': r==='Vice Captain'?'© VC':'Player'}
              </button>
            )
          })}
        </div>
        {/* Position */}
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Position</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {POSITIONS.map(pos => {
            const sel = position === pos
            const ps = POSITION_STYLES[pos]
            return (
              <button key={pos} type="button" onClick={() => setPosition(pos)}
                style={{ flex:1, height:36, borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.72rem', background: sel?ps.bg:'var(--bg-card)', color: sel?ps.color:'var(--text-3)', border: sel?`1.5px solid ${ps.border}`:'1.5px solid var(--border)', transition:'all 150ms ease' }}>
                {pos}
              </button>
            )
          })}
        </div>
        {/* Event */}
        {(leagueEvents || []).length > 0 && (
          <>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Playing In</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {leagueEvents.map(ev => {
                const sel = events.includes(ev)
                return (
                  <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                    style={{ flex:1, height:36, borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'0.75rem', background: sel?'var(--accent)':'var(--bg-card)', color: sel?'#fff':'var(--text-3)', border: sel?'1.5px solid var(--accent)':'1.5px solid var(--border)', transition:'all 150ms ease', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    {ev === 'Regu' ? '👟' : '🏐'} {ev}
                  </button>
                )
              })}
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={cancelEdit} style={{ flex:1, height:36, fontSize:'0.78rem' }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex:2, height:36, fontSize:'0.78rem' }}>{saving ? <><Spinner /> Saving…</> : 'Save'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
      <PlayerAvatar player={player} size={40} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 3 }}>
          <RoleBadge role={player.role} small />
          {player.position && <PositionBadge position={player.position} small />}
          {(player.events || []).map(ev => (
            <span key={ev} style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.2)' }}>
              {ev === 'Regu' ? '👟' : '🏐'} {ev}
            </span>
          ))}
        </div>
      </div>
      <button className="btn btn-secondary" onClick={() => setEditMode(true)} style={{ width:32, height:32, padding:0, borderRadius:8 }}><EditIcon size={13} /></button>
      {confirmDel
        ? <button className="btn" onClick={handleDelete} style={{ height:32, padding:'0 8px', fontSize:'0.7rem', background:'#dc2626', color:'#fff', borderRadius:8 }}>✓</button>
        : <button className="btn btn-secondary" onClick={() => setConfirmDel(true)} style={{ width:32, height:32, padding:0, borderRadius:8, color:'#dc2626' }}><TrashIcon /></button>}
    </div>
  )
}

/* ── Shared sub-components ── */
function PlayerAvatar({ player, size = 36 }) {
  return player.photoUrl
    ? <img src={player.photoUrl} alt={player.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-mid)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: size*0.38, color: 'var(--accent)' }}>
        {player.name[0].toUpperCase()}
      </div>
}

function RoleBadge({ role, small }) {
  const rs = ROLE_STYLES[role] || ROLE_STYLES.Player
  return (
    <span style={{ display: 'inline-block', padding: small ? '1px 7px' : '3px 10px', borderRadius: 20, fontSize: small ? '0.6rem' : '0.65rem', fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
      {role === 'Captain' ? '© Captain' : role === 'Vice Captain' ? '© Vice Captain' : 'Player'}
    </span>
  )
}

function PositionBadge({ position, small }) {
  const ps = POSITION_STYLES[position]
  if (!ps) return null
  return (
    <span style={{ display: 'inline-block', padding: small ? '1px 7px' : '3px 10px', borderRadius: 20, fontSize: small ? '0.6rem' : '0.65rem', fontWeight: 700, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
      {position}
    </span>
  )
}

function LogoUploadBox({ preview, onClick, size = 64 }) {
  return (
    <div onClick={onClick} style={{ width: size, height: size, borderRadius: 12, background: 'var(--bg-elevated)', border: '2px dashed var(--border)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UploadIcon />}
    </div>
  )
}

function LoadingPage() {
  return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}><p style={{ color: 'var(--text-2)' }}>Loading…</p></div>
}

/* ══════════════════════════════════════════
   FIXTURE GENERATOR HELPERS
══════════════════════════════════════════ */
function getFirstSunday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()           // 0=Sun
  if (day !== 0) d.setDate(d.getDate() + (7 - day))
  return d
}

function buildRoundRobin(teams) {
  if (teams.length < 2) return []
  const ts = [...teams]
  if (ts.length % 2 !== 0) ts.push(null)   // bye for odd count
  const n = ts.length
  const rotating = ts.slice(1)
  const rounds = []
  for (let r = 0; r < n - 1; r++) {
    const all = [ts[0], ...rotating]
    const round = []
    for (let i = 0; i < n / 2; i++) {
      const home = all[i], away = all[n - 1 - i]
      if (home && away) round.push({ home, away })
    }
    if (round.length) rounds.push(round)
    rotating.unshift(rotating.pop())
  }
  return rounds
}

// Returns [{date, matches:[{event,leg,home,away}]}] — one entry per Sunday
function generateFixtures(teams, events, startDate) {
  if (teams.length < 2 || !events.length || !startDate) return []

  const firstSunday = getFirstSunday(startDate)
  const leg1 = buildRoundRobin(teams)              // N-1 rounds
  const leg2 = leg1.map(r => r.map(m => ({ home: m.away, away: m.home })))
  const N1   = leg1.length                         // N-1

  const sunday = (weekOffset) => {
    const d = new Date(firstSunday)
    d.setDate(d.getDate() + weekOffset * 7)
    return d.toISOString().split('T')[0]
  }

  const hasRegu = events.includes('Regu')
  const hasQuad = events.includes('Quad')

  // ── Single event: one round per Sunday ──────────────────
  if (!hasRegu || !hasQuad) {
    const ev = hasRegu ? 'Regu' : 'Quad'
    return [
      ...leg1.map((r, i) => ({
        date: sunday(i),
        matches: r.map(m => ({ event: ev, leg: 1, home: m.home, away: m.away })),
      })),
      ...leg2.map((r, i) => ({
        date: sunday(N1 + i),
        matches: r.map(m => ({ event: ev, leg: 2, home: m.home, away: m.away })),
      })),
    ]
  }

  // ── Both events: offset pairing so Regu ≠ Quad opponent ─
  // Sunday i → Regu uses leg1[i], Quad uses leg1[(i+1)%N1]
  // This works because any two DIFFERENT rounds in a round-robin
  // share zero common pairs, guaranteeing different opponents.
  const sundays = []

  // First-leg phase (N1 Sundays)
  for (let i = 0; i < N1; i++) {
    sundays.push({
      date: sunday(i),
      matches: [
        ...leg1[i].map(m => ({ event: 'Regu', leg: 1, home: m.home, away: m.away })),
        ...leg1[(i + 1) % N1].map(m => ({ event: 'Quad', leg: 1, home: m.home, away: m.away })),
      ],
    })
  }

  // Second-leg phase (N1 more Sundays)
  for (let i = 0; i < N1; i++) {
    sundays.push({
      date: sunday(N1 + i),
      matches: [
        ...leg2[i].map(m => ({ event: 'Regu', leg: 2, home: m.home, away: m.away })),
        ...leg2[(i + 1) % N1].map(m => ({ event: 'Quad', leg: 2, home: m.home, away: m.away })),
      ],
    })
  }

  return sundays
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/* ══════════════════════════════════════════
   FIXTURES SECTION
══════════════════════════════════════════ */
function FixturesSection({ leagueId, league, teams }) {
  const [existing, setExisting]     = useState([])
  const [preview, setPreview]       = useState(null)   // unsaved preview
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [collapsed, setCollapsed]   = useState(true)   // existing fixtures list

  useEffect(() => {
    const q = query(collection(db, 'leagues', leagueId, 'fixtures'), orderBy('date'))
    return onSnapshot(q, snap => setExisting(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [leagueId])

  const events = league.events || []

  const handleGenerate = () => {
    if (existing.length > 0) { setConfirmRegen(true); return }
    doGenerate()
  }

  const doGenerate = () => {
    if (teams.length < 2) return
    // generateFixtures returns [{date, matches:[{event,leg,home,away}]}]
    const sundays = generateFixtures(teams, events, league.startDate)
    setPreview(sundays)
    setConfirmRegen(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const batch = writeBatch(db)
      const snap = await getDocs(collection(db, 'leagues', leagueId, 'fixtures'))
      snap.docs.forEach(d => batch.delete(d.ref))
      preview.forEach(sunday => {
        sunday.matches.forEach(match => {
          const ref = doc(collection(db, 'leagues', leagueId, 'fixtures'))
          batch.set(ref, {
            event:    match.event,
            leg:      match.leg,
            date:     sunday.date,
            homeTeam: { id: match.home.id, name: match.home.name, logoUrl: match.home.logoUrl || null },
            awayTeam: { id: match.away.id, name: match.away.name, logoUrl: match.away.logoUrl || null },
            status:   'scheduled',
            homeScore: null,
            awayScore: null,
            createdAt: serverTimestamp(),
          })
        })
      })
      await batch.commit()
      setPreview(null)
      setCollapsed(false)
    } finally { setSaving(false) }
  }

  const totalPreviewMatches = preview ? preview.reduce((s, s2) => s + s2.matches.length, 0) : 0

  // Group existing fixtures by date
  const existingByDate = {}
  existing.forEach(f => {
    if (!existingByDate[f.date]) existingByDate[f.date] = []
    existingByDate[f.date].push(f)
  })
  const existingDates = Object.keys(existingByDate).sort()

  const totalMatches = preview
    ? preview.reduce((s, r) => s + r.matches.length, 0)
    : existing.length

  return (
    <div style={{ marginTop: 24 }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p className="page-subtitle" style={{ marginBottom: 2 }}>Fixtures</p>
          <p style={{ fontWeight: 800, fontSize: '1rem' }}>
            {existing.length > 0 ? `${existing.length} Match${existing.length !== 1 ? 'es' : ''} Scheduled` : 'No fixtures yet'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={teams.length < 2}
          style={{ height: 38, padding: '0 14px', fontSize: '0.8rem', gap: 6 }}>
          <ShuffleIcon /> {existing.length > 0 ? 'Regenerate' : 'Generate Fixtures'}
        </button>
      </div>

      {teams.length < 2 && (
        <div style={{ background: 'rgba(255,85,0,0.06)', border: '1px solid rgba(255,85,0,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Add at least 2 teams before generating fixtures.</p>
        </div>
      )}

      {/* Confirm regenerate warning */}
      {confirmRegen && (
        <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#dc2626', marginBottom: 4 }}>Regenerate Fixtures?</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginBottom: 12 }}>
            This will delete all {existing.length} existing fixtures and create new ones. Match results will be lost.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setConfirmRegen(false)} style={{ flex: 1, height: 38 }}>Cancel</button>
            <button onClick={doGenerate} style={{ flex: 2, height: 38, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', background: '#dc2626', color: '#fff' }}>Yes, Regenerate</button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="card" style={{ marginBottom: 12, border: '1px solid rgba(255,85,0,0.2)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem' }}>Preview</p>
              <p style={{ color: 'var(--text-2)', fontSize: '0.75rem', marginTop: 2 }}>
                {totalPreviewMatches} matches · {preview.length} Sundays
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setPreview(null)} style={{ height: 36, padding: '0 12px', fontSize: '0.8rem' }}>Discard</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ height: 36, padding: '0 14px', fontSize: '0.8rem' }}>
                {saving ? <><Spinner /> Saving…</> : 'Confirm & Save'}
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {preview.map(sunday => (
              <PreviewSunday key={sunday.date} sunday={sunday} />
            ))}
          </div>
        </div>
      )}

      {/* Existing fixtures */}
      {!preview && existing.length > 0 && (
        <>
          <button className="btn btn-secondary" onClick={() => setCollapsed(v => !v)}
            style={{ width: '100%', height: 40, fontSize: '0.82rem', gap: 6, marginBottom: collapsed ? 0 : 10 }}>
            {collapsed ? '▼ Show Fixtures' : '▲ Hide Fixtures'}
          </button>
          {!collapsed && existingDates.map(date => (
            <ExistingDateGroup key={date} date={date} fixtures={existingByDate[date]} events={events} />
          ))}
        </>
      )}
    </div>
  )
}

/* ── Preview Sunday block ── */
function PreviewSunday({ sunday }) {
  const byEvent = {}
  sunday.matches.forEach(m => {
    if (!byEvent[m.event]) byEvent[m.event] = []
    byEvent[m.event].push(m)
  })

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Date header */}
      <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <p style={{ fontWeight: 700, fontSize: '0.82rem' }}>{formatDate(sunday.date)}</p>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600 }}>
          {sunday.matches.length} match{sunday.matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Matches grouped by event */}
      {Object.entries(byEvent).map(([ev, matches]) => (
        <div key={ev}>
          <div style={{ padding: '5px 16px 3px 28px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent)' }}>
              {ev === 'Regu' ? '👟' : '🏐'} {ev} · Leg {matches[0].leg}
            </span>
          </div>
          {matches.map((m, mi) => (
            <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 16px 5px 36px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.home.name}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 800, flexShrink: 0, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>vs</span>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.away.name}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ── Existing fixtures date group ── */
function ExistingDateGroup({ date, fixtures, events }) {
  return (
    <div className="card" style={{ marginBottom: 8, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px 8px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="13" height="13" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-2)' }}>{formatDate(date)}</p>
      </div>
      {fixtures.map(f => (
        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-light)' }}>
          <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, background: 'rgba(255,85,0,0.08)', color: 'var(--accent)', border: '1px solid rgba(255,85,0,0.15)', flexShrink: 0 }}>
            {f.event === 'Regu' ? '👟' : '🏐'} {f.event} · L{f.leg}
          </span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <TeamPill team={f.homeTeam} align="right" />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 800, flexShrink: 0 }}>vs</span>
            <TeamPill team={f.awayTeam} align="left" />
          </div>
          <StatusChip status={f.status} />
        </div>
      ))}
    </div>
  )
}

function TeamPill({ team, align }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, justifyContent: align === 'right' ? 'flex-end' : 'flex-start', overflow: 'hidden' }}>
      {align === 'right' && <span style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
      {team.logoUrl
        ? <img src={team.logoUrl} alt={team.name} style={{ width: 24, height: 24, borderRadius: 5, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
        : <div style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', flexShrink: 0 }}>👥</div>}
      {align === 'left' && <span style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>}
    </div>
  )
}

function StatusChip({ status }) {
  const styles = {
    scheduled: { bg: 'var(--bg-elevated)', color: 'var(--text-3)', border: 'var(--border)', label: 'Scheduled' },
    live:      { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', border: 'rgba(34,197,94,0.3)', label: '● Live' },
    completed: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.2)', label: 'Done' },
  }
  const s = styles[status] || styles.scheduled
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.6rem', fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}`, flexShrink: 0 }}>
      {s.label}
    </span>
  )
}

const ShuffleIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
  </svg>
)

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>{error}</p>}
    </div>
  )
}

const inputStyle = (error) => ({ width: '100%', height: 44, background: 'var(--bg-elevated)', border: `1px solid ${error ? '#dc2626' : 'var(--border)'}`, borderRadius: 8, padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-1)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' })

const BackIcon   = () => <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
const EditIcon   = ({ size=16 }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const PlusIcon   = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const TrashIcon  = () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const UploadIcon = () => <svg width="22" height="22" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const UserIcon   = () => <svg width="20" height="20" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
