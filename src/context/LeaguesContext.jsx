import { createContext, useContext, useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const LeaguesContext = createContext(null)

export function LeaguesProvider({ children }) {
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'leagues'),
      snap => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        all.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        setLeagues(all)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  return (
    <LeaguesContext.Provider value={{ leagues, loading }}>
      {children}
    </LeaguesContext.Provider>
  )
}

export const useLeagues = () => useContext(LeaguesContext)
