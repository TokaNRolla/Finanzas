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
  debug: string[]
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debug, setDebug] = useState<string[]>([])

  const log = (msg: string) => setDebug((prev) => [...prev, `${new Date().toISOString().slice(11, 19)} ${msg}`])

  useEffect(() => {
    log(`config: project=${auth.app.options.projectId} authDomain=${auth.app.options.authDomain}`)

    // Salvaguarda: si por lo que sea nunca se resuelve el estado de auth, no dejamos
    // la pantalla de "Cargando" trabada para siempre.
    const safetyTimeout = setTimeout(() => {
      setLoading((current) => {
        if (current) {
          log('timeout: onAuthStateChanged nunca respondió después de 8s')
          setError('Esto está tardando demasiado. Revisa el diagnóstico abajo.')
        }
        return false
      })
    }, 8000)

    let unsub = () => {}
    try {
      unsub = onAuthStateChanged(
        auth,
        async (u) => {
          log(`onAuthStateChanged: usuario=${u ? u.email : 'null'}`)
          try {
            if (u && ALLOWED_EMAIL && u.email !== ALLOWED_EMAIL) {
              setError('Esta cuenta de Google no tiene acceso a esta app.')
              await signOut(auth)
              setUser(null)
            } else {
              setUser(u)
            }
          } catch (err) {
            log(`error procesando usuario: ${String(err)}`)
            setError('Ocurrió un error validando tu sesión.')
          } finally {
            clearTimeout(safetyTimeout)
            setLoading(false)
          }
        },
        (err) => {
          log(`onAuthStateChanged error: ${String(err)}`)
          setError('Error de Firebase Auth: ' + String(err))
          clearTimeout(safetyTimeout)
          setLoading(false)
        },
      )
    } catch (err) {
      log(`excepción al registrar onAuthStateChanged: ${String(err)}`)
      setError('No se pudo inicializar la autenticación.')
      clearTimeout(safetyTimeout)
      setLoading(false)
    }

    getRedirectResult(auth)
      .then((result) => {
        log(`getRedirectResult: ${result ? 'usuario ' + result.user.email : 'sin resultado pendiente'}`)
      })
      .catch((err) => {
        log(`getRedirectResult error: ${String(err)}`)
        setError('No se pudo iniciar sesión con Google: ' + String(err?.code || err))
      })

    return () => {
      clearTimeout(safetyTimeout)
      unsub()
    }
  }, [])

  const loginWithGoogle = async () => {
    setError(null)
    await signInWithRedirect(auth, new GoogleAuthProvider())
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, debug, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
