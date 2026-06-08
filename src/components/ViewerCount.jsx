import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const STALE_MS = 45_000 // viewers not seen in 45s are considered gone

export default function ViewerCount({ fixtureId }) {
  const { isAdmin } = useAuth()
  const [viewers, setViewers]     = useState([])
  const [showList, setShowList]   = useState(false)
  const [now, setNow]             = useState(Date.now())

  // Refresh "now" every 15s so stale viewers drop off the UI without a full re-fetch
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!fixtureId) return
    return onSnapshot(
      collection(db, 'matchPresence', fixtureId, 'viewers'),
      snap => setViewers(snap.docs.map(d => d.data()))
    )
  }, [fixtureId])

  // Only count viewers whose heartbeat arrived within the last 45s
  const active = viewers.filter(v => {
    const lastSeen = v.lastSeen?.toMillis?.()
    return lastSeen && (now - lastSeen) < STALE_MS
  })

  return (
    <>
      <button
        onClick={() => setShowList(v => !v)}
        aria-label={`${active.length} viewers watching`}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'var(--accent-dim)',
          border: '1px solid rgba(255,85,0,0.2)',
          borderRadius: 20,
          padding: '5px 12px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <EyeIcon />
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent)' }}>
          {active.length}
        </span>
      </button>

      {showList && (
        <div
          onClick={() => setShowList(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px 20px 0 0',
              width: '100%', maxWidth: 480,
              padding: '20px 20px 36px',
              maxHeight: '60dvh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>
                👁 {active.length} Watching This Match
              </h3>
              <button
                onClick={() => setShowList(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: '1.2rem' }}
              >✕</button>
            </div>

            {active.length === 0 && (
              <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>
                No one watching right now.
              </p>
            )}

            {active.map((v, i) => (
              <div key={v.sessionKey || i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                {v.photo ? (
                  <img src={v.photo} alt={v.name} width={36} height={36}
                    style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--accent-dim)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)', flexShrink: 0,
                  }}>
                    {(v.name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.name || 'Viewer'}
                  </p>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
