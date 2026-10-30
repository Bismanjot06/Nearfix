import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase, isDemoMode } from '../lib/supabase.js'

const DEMO_AUTH_STORAGE_KEY = 'nearfix_demo_auth_session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (isDemoMode) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
        setRole(data.role)
      } else {
        // Fallback default role
        setProfile({ id: userId, role: 'citizen' })
        setRole('citizen')
      }
    } catch {
      setRole('citizen')
    }
  }, [])

  // Initialize auth
  useEffect(() => {
    if (isDemoMode) {
      try {
        const saved = localStorage.getItem(DEMO_AUTH_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setUser(parsed.user)
          setSession(parsed.session)
          setProfile(parsed.profile)
          setRole(parsed.profile?.role || 'authority')
        }
      } catch {
        // ignore
      }
      setLoading(false)
      return
    }

    // Supabase auth subscription
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          setProfile(null)
          setRole(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Sign In function
  const signIn = async ({ email, password }) => {
    setLoading(true)

    if (isDemoMode) {
      // In demo mode, authenticate as municipal authority
      const mockUser = {
        id: '11111111-demo-auth-0000-000000000001',
        email: email || 'authority@punjab.gov.in',
      }
      const mockProfile = {
        id: mockUser.id,
        full_name: 'Er. Gurpreet Singh (MC Roads)',
        role: 'authority',
        created_at: new Date().toISOString(),
      }
      const mockSession = {
        access_token: 'demo-token',
        user: mockUser,
      }

      setUser(mockUser)
      setSession(mockSession)
      setProfile(mockProfile)
      setRole('authority')

      localStorage.setItem(
        DEMO_AUTH_STORAGE_KEY,
        JSON.stringify({ user: mockUser, session: mockSession, profile: mockProfile })
      )

      setLoading(false)
      return { data: { user: mockUser, session: mockSession }, error: null }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setLoading(false)
        return { data: null, error }
      }

      // Fetch profile to verify role
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profErr || !prof) {
        setRole('citizen')
      } else {
        setProfile(prof)
        setRole(prof.role)
      }

      setLoading(false)
      return { data, error: null }
    } catch (err) {
      setLoading(false)
      return { data: null, error: err }
    }
  }

  // Sign Out function
  const signOut = async () => {
    setLoading(true)
    if (isDemoMode) {
      localStorage.removeItem(DEMO_AUTH_STORAGE_KEY)
      setUser(null)
      setSession(null)
      setProfile(null)
      setRole(null)
      setLoading(false)
      return { error: null }
    }

    const { error } = await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setRole(null)
    setLoading(false)
    return { error }
  }

  const isAuthority = role === 'authority' || role === 'admin'

  const value = {
    session,
    user,
    profile,
    role,
    isAuthority,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
