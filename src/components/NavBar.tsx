import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const tabs = [
  { to: '/', label: 'Resumen', icon: '🏠' },
  { to: '/tarjetas', label: 'Tarjetas', icon: '💳' },
  { to: '/gastos', label: 'Gastos', icon: '🧾' },
  { to: '/pagos-fijos', label: 'Fijos', icon: '📌' },
  { to: '/insights', label: 'Análisis', icon: '🧠' },
  { to: '/asesor', label: 'Asesor', icon: '💬' },
]

export default function NavBar() {
  const { logout } = useAuth()

  return (
    <nav className="nav-bar">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
      <button className="nav-item logout" onClick={() => logout()}>
        <span className="nav-icon">🚪</span>
        <span>Salir</span>
      </button>
    </nav>
  )
}
