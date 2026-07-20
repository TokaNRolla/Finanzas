import type { ReactNode } from 'react'
import { useAuth } from '../lib/AuthContext'
import Login from '../pages/Login'

function DebugLog() {
  const { debug } = useAuth()
  if (debug.length === 0) return null
  return (
    <pre className="debug-log">{debug.join('\n')}</pre>
  )
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="screen center column">
        <p>Cargando…</p>
        <DebugLog />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <Login />
        {error && <DebugLog />}
      </>
    )
  }

  return <>{children}</>
}
