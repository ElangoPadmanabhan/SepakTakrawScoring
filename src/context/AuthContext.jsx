import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase'

// ── Admin credentials — loaded from environment variables ──
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // Firebase Google user
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Restore admin session from sessionStorage
  useEffect(() => {
    const adminSession = sessionStorage.getItem('cstl_admin')
    if (adminSession === 'true') setIsAdmin(true)
  }, [])

  // Listen to Firebase Google auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Admin login ──────────────────────────────────────
  const adminLogin = (username, password) => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      sessionStorage.setItem('cstl_admin', 'true')
      return { success: true }
    }
    return { success: false, error: 'Invalid username or password.' }
  }

  // ── Admin logout ─────────────────────────────────────
  const adminLogout = () => {
    setIsAdmin(false)
    sessionStorage.removeItem('cstl_admin')
  }

  // ── User (Google) logout ─────────────────────────────
  const userLogout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, adminLogin, adminLogout, userLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
