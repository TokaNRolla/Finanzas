import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

// Único correo autorizado para entrar con Google (correo/contraseña ya está
// restringido de por sí: solo existen las cuentas que tú creas en Firebase Console).
const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
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
      async (u) => {
        if (u && ALLOWED_EMAIL && u.providerData.some((p) => p.providerId === 'google.com') && u.email !== ALLOWED_EMAIL) {
          setError('Esta cuenta de Google no tiene acceso a esta app.')
          await signOut(auth)
          setUser(null)
        } else {
          setUser(u)
        }
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

  const loginWithGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver)
    } catch (err) {
      setError('No se pudo iniciar sesión con Google: ' + String((err as { code?: string })?.code || err))
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
