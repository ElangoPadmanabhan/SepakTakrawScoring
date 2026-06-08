import { useEffect } from 'react'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

function getSessionKey() {
  let key = sessionStorage.getItem('_presenceKey')
  if (!key) {
    key = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('_presenceKey', key)
  }
  return key
}

export function useMatchPresence(fixtureId) {
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!fixtureId) return

    const sessionKey = getSessionKey()
    const ref = doc(db, 'matchPresence', fixtureId, 'viewers', sessionKey)
    const name  = isAdmin ? 'Admin' : (user?.displayName || 'Viewer')
    const photo = user?.photoURL || null

    setDoc(ref, { name, photo, lastSeen: serverTimestamp() })

    const interval = setInterval(() => {
      setDoc(ref, { name, photo, lastSeen: serverTimestamp() }, { merge: true })
    }, 30_000)

    return () => {
      clearInterval(interval)
      deleteDoc(ref)
    }
  }, [fixtureId])
}
