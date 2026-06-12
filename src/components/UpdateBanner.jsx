import { useEffect, useRef, useState, useCallback } from 'react'

const VERSION_URL = `${import.meta.env.BASE_URL}version.json`
const POLL_INTERVAL = 60_000
const AUTO_RELOAD_SECS = 5

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
  const [countdown, setCountdown]   = useState(null) // null = no update, N = counting down
  const [refreshing, setRefreshing] = useState(false)
  const loadedVersion = useRef(null)
  const countdownRef  = useRef(null)

  const triggerUpdate = useCallback(() => {
    // Already counting down or refreshing — don't restart
    if (countdownRef.current || refreshing) return
    setCountdown(AUTO_RELOAD_SECS)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
          hardRefresh()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [refreshing])

  const checkVersion = useCallback(async () => {
    const latest = await fetchVersion()
    if (!loadedVersion.current) { loadedVersion.current = latest; return }
    if (latest && latest !== loadedVersion.current) triggerUpdate()
  }, [triggerUpdate])

  useEffect(() => {
    // Initial version fetch
    fetchVersion().then(v => { loadedVersion.current = v })

    // Poll every 60s
    const pollId = setInterval(checkVersion, POLL_INTERVAL)

    // Also check whenever user returns to the app
    const onVisibility = () => { if (document.visibilityState === 'visible') checkVersion() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(pollId)
      clearInterval(countdownRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [checkVersion])

  const handleNow = async () => {
    clearInterval(countdownRef.current)
    countdownRef.current = null
    setRefreshing(true)
    await hardRefresh()
  }

  if (countdown === null) return null

  return (
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
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
            {refreshing ? 'Reloading…' : `Auto-updating in ${countdown}s`}
          </p>
        </div>
      </div>
      <button
        onClick={handleNow}
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
        {refreshing ? '…' : 'Update now'}
      </button>
    </div>
  )
}
