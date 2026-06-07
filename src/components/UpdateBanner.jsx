import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll every 60 seconds for new version
      r && setInterval(() => r.update(), 60_000)
    },
  })

  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,   // above the navbar
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
        onClick={() => updateServiceWorker(true)}
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
        }}
      >
        Update now
      </button>
    </div>
  )
}
