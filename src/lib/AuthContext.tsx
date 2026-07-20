import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { auth } from './firebase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Salvaguarda: si por lo que sea nunca se resuelve el estado de auth, no dejamos
    // la pantalla de "Cargando" trabada para siempre.
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) setError('Esto está tardando demasiado. Recarga la página e intenta de nuevo.')
        return false
      })
    }, 8000)

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u)
        clearTimeout(safetyTimeout)
        setLoading(false)
      },
      () => {
        setError('Error inicializando la sesión.')
        clearTimeout(safetyTimeout)
        setLoading(false)
      },
    )

    return () => {
      clearTimeout(safetyTimeout)
      unsub()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  return <AuthContext.Provider value={{ user, loading, error, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
