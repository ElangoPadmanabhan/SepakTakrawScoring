import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export default function ViewerCount() {
  const { isAdmin } = useAuth()
  const [viewers, setViewers] = useState([])
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'viewers'), snap => {
      setViewers(snap.docs.map(d => d.data()))
    })
    return unsub
  }, [])

  return (
    <>
      <button
        onClick={() => setShowList(v => !v)}
        aria-label={`${viewers.length} viewers watching`}
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
          {viewers.length}
        </span>
      </button>

      {/* Viewer list modal — admin sees names, others see count only */}
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
                👁 {viewers.length} Watching Now
              </h3>
              <button
                onClick={() => setShowList(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: '1.2rem' }}
              >✕</button>
            </div>

            {viewers.length === 0 && (
              <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>
                No viewers right now.
              </p>
            )}

            {viewers.map((v, i) => (
              <div key={v.uid || i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < viewers.length - 1 ? '1px solid var(--border)' : 'none',
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
                    {(v.name || v.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.name || 'User'}
                  </p>
                  {isAdmin && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {v.email}
                    </p>
                  )}
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
