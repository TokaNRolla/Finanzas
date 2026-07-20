import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { login, loginWithGoogle, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch {
      setError('No pudimos iniciar sesión. Revisa tu correo y contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-form">
        <h1>Mis Finanzas</h1>

        <button type="button" className="primary-button" onClick={() => loginWithGoogle()}>
          Continuar con Google
        </button>

        <div className="login-divider">o</div>

        <form onSubmit={onSubmit} className="login-email-form">
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="secondary-button" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar con correo'}
          </button>
        </form>

        {(error || authError) && <p className="error">{error || authError}</p>}
      </div>
    </div>
  )
}
