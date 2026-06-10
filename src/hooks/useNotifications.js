import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { messaging, db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY
const BASE      = import.meta.env.BASE_URL || '/'

export function useNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || !messaging) return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    const setup = async () => {
      try {
        // Ask permission — browser shows the "Allow notifications?" prompt
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // Register Firebase messaging SW separately from the PWA SW
        const swReg = await navigator.serviceWorker.register(
          `${BASE}firebase-messaging-sw.js`,
          { scope: BASE }
        )

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        })

        if (!token) return

        // Save token to Firestore — Cloud Function reads this to send pushes
        await setDoc(doc(db, 'userTokens', user.uid), {
          token,
          uid:       user.uid,
          updatedAt: serverTimestamp(),
        })

        // Handle foreground messages (app is open) — show as native notification
        onMessage(messaging, payload => {
          const title = payload.notification?.title || '🏐 Match Live!'
          const body  = payload.notification?.body  || ''
          const url   = payload.data?.url
          if (!title) return
          const n = new Notification(title, {
            body,
            icon: `${BASE}icons/icon-192.png`,
            tag: 'match-live',
          })
          if (url) n.onclick = () => { window.focus(); window.location.href = url }
        })
      } catch (err) {
        // Silently ignore — notification is a nice-to-have, not critical
        console.warn('[notifications]', err)
      }
    }

    setup()
  }, [user?.uid])
}
