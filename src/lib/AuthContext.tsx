import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

// Único correo autorizado para entrar a la app. Cualquier otra cuenta de Google
// que intente iniciar sesión es rechazada y desconectada de inmediato.
const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && ALLOWED_EMAIL && u.email !== ALLOWED_EMAIL) {
        setError('Esta cuenta de Google no tiene acceso a esta app.')
        await signOut(auth)
        setUser(null)
        setLoading(false)
        return
      }
      setUser(u)
      setLoading(false)
    })

    getRedirectResult(auth).catch(() => {
      setError('No se pudo iniciar sesión con Google. Intenta de nuevo.')
    })

    return unsub
  }, [])

  const loginWithGoogle = async () => {
    setError(null)
    await signInWithRedirect(auth, new GoogleAuthProvider())
  }

  const logout = async () => {
    await signOut(auth)
  }

  return <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
