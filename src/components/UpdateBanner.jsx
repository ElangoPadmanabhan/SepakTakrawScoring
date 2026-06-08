import { useEffect, useRef, useState } from 'react'

const VERSION_URL = `${import.meta.env.BASE_URL}version.json`
const POLL_INTERVAL = 60_000

async function fetchVersion() {
  try {
    const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.v || null
  } catch {
    return null
  }
}

export async function hardRefresh() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
  } catch { /* ignore */ }
  window.location.reload()
}

export default function UpdateBanner() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const loadedVersion = useRef(null)

  useEffect(() => {
    fetchVersion().then(v => { loadedVersion.current = v })

    const id = setInterval(async () => {
      const latest = await fetchVersion()
      if (latest && loadedVersion.current && latest !== loadedVersion.current) {
        setShowUpdateBanner(true)
      }
    }, POLL_INTERVAL)

    return () => clearInterval(id)
  }, [])

  const handleHardRefresh = async () => {
    setRefreshing(true)
    await hardRefresh()
  }

  return (
    <>
      {/* Update available banner */}
      {showUpdateBanner && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: 16,
          right: 16,
          zIndex: 9999,
          background: '#111218',
          color: '#fff',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          animation: 'slideUp 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>🆕</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}>Update available</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Tap to get the latest version</p>
            </div>
          </div>
          <button
            onClick={handleHardRefresh}
            disabled={refreshing}
            style={{
              background: '#ff5500',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? 'Refreshing…' : 'Update now'}
          </button>
        </div>
      )}

    </>
  )
}
