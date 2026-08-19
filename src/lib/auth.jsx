import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  /* Supabase lähettää onAuthStateChangen myös silloin kun mikään ei
     muutu: INITIAL_SESSION, välilehden aktivoituminen (SIGNED_IN) ja
     tokenin uusinta. Pidetään sama olio jos token on sama, muuten koko
     puu renderöityy ja hakee datansa uudelleen joka tapahtumalla. */
  useEffect(() => {
    const sameToken = (a, b) => a?.access_token === b?.access_token
    supabase.auth.getSession().then(({ data }) => {
      setSession(prev => (sameToken(prev, data.session) ? prev : data.session))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(prev => (sameToken(prev, s) ? prev : s))
    )
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? null

  useEffect(() => {
    if (!userId) { setProfile(null); return }
    let alive = true
    supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) console.error('Profiilia ei saatu haettua:', error.message)
        else setProfile(data)
      })
    return () => { alive = false }
  }, [userId])

  return (
    <AuthContext.Provider value={{ session, profile, loading, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
