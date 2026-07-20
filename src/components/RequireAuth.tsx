import type { ReactNode } from 'react'
import { useAuth } from '../lib/AuthContext'
import Login from '../pages/Login'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="screen center">Cargando…</div>
  if (!user) return <Login />
  return <>{children}</>
}
