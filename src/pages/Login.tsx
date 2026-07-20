import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { loginWithGoogle, error } = useAuth()

  return (
    <div className="login-screen">
      <div className="login-form">
        <h1>Mis Finanzas</h1>
        {error && <p className="error">{error}</p>}
        <button type="button" className="primary-button" onClick={() => loginWithGoogle()}>
          Continuar con Google
        </button>
      </div>
    </div>
  )
}
