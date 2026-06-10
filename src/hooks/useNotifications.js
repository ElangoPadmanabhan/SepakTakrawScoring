import { useEffect, useRef } from 'react'
import { getToken, onMessage, getMessaging, isSupported } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { app, db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
const BASE      = import.meta.env.BASE_URL || '/'

// Shared messaging instance
let _messaging = null
async function getMsg() {
  if (_messaging) return _messaging
  const supported = await isSupported()
  if (!supported) return null
  _messaging = getMessaging(app)
  return _messaging
}

// ── Called on app load: registers SW + onMessage if already permitted ──
export function useNotifications() {
  const { user } = useAuth()
  const unsubRef = useRef(null)

  useEffect(() => {
    if (!user) return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission !== 'granted') return  // only auto-setup if already allowed

    const setup = async () => {
      try {
        const messaging = await getMsg()
        if (!messaging) return

        const swReg = await navigator.serviceWorker.register(
          `${BASE}firebase-messaging-sw.js`, { scope: BASE }
        )

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        })

        if (token) {
          await setDoc(doc(db, 'userTokens', user.uid), {
            token, uid: user.uid, updatedAt: serverTimestamp(),
          })
        }

        // Foreground: show in-app banner (avoids duplicating SW background push)
        if (unsubRef.current) unsubRef.current()
        unsubRef.current = onMessage(messaging, payload => {
          const title = payload.notification?.title || '🏐 Match Live!'
          const body  = payload.notification?.body  || ''
          showInAppBanner(title, body, payload.data?.url)
        })
      } catch (err) {
        console.warn('[notifications]', err)
      }
    }

    setup()
    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null } }
  }, [user?.uid])
}

// ── Called from Profile button (user gesture — browser always allows) ──
export async function requestNotificationPermission(uid) {
  try {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'

    const messaging = await getMsg()
    if (!messaging) return 'unsupported'

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return permission

    const swReg = await navigator.serviceWorker.register(
      `${BASE}firebase-messaging-sw.js`, { scope: BASE }
    )

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })

    if (token && uid) {
      await setDoc(doc(db, 'userTokens', uid), {
        token, uid, updatedAt: serverTimestamp(),
      })
    }

    // Register foreground handler
    onMessage(messaging, payload => {
      const title = payload.notification?.title || '🏐 Match Live!'
      const body  = payload.notification?.body  || ''
      showInAppBanner(title, body, payload.data?.url)
    })

    return 'granted'
  } catch (err) {
    console.warn('[notifications]', err)
    return 'error'
  }
}

// ── In-app banner (foreground only) ──────────────────────────────
function showInAppBanner(title, body, url) {
  const existing = document.getElementById('match-live-banner')
  if (existing) existing.remove()

  const banner = document.createElement('div')
  banner.id = 'match-live-banner'
  Object.assign(banner.style, {
    position: 'fixed', top: '16px', left: '50%',
    transform: 'translateX(-50%)', zIndex: '9999',
    background: '#111218', color: '#fff', borderRadius: '14px',
    padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
    maxWidth: '420px', width: 'calc(100vw - 32px)',
    cursor: url ? 'pointer' : 'default',
    animation: 'slideDown 280ms cubic-bezier(0.32,0.72,0,1)',
    border: '1px solid rgba(255,255,255,0.1)',
  })

  banner.innerHTML = `
    <span style="font-size:1.3rem;flex-shrink:0">🏐</span>
    <div style="flex:1;min-width:0">
      <p style="font-weight:800;font-size:0.88rem;margin:0 0 2px">${title}</p>
      ${body ? `<p style="font-size:0.75rem;opacity:0.7;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${body}</p>` : ''}
    </div>
    <button id="banner-close" style="background:none;border:none;color:#fff;opacity:0.6;cursor:pointer;font-size:1.1rem;padding:0;flex-shrink:0">✕</button>
  `

  if (url) banner.onclick = (e) => {
    if (e.target.id === 'banner-close') return
    window.location.href = url
  }
  banner.querySelector('#banner-close').onclick = (e) => {
    e.stopPropagation(); banner.remove()
  }

  document.body.appendChild(banner)
  setTimeout(() => { if (banner.isConnected) banner.remove() }, 6000)
}
