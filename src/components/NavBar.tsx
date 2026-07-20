import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Resumen', icon: '🏠' },
  { to: '/tarjetas', label: 'Tarjetas', icon: '💳' },
  { to: '/gastos', label: 'Gastos', icon: '🧾' },
  { to: '/pagos-fijos', label: 'Fijos', icon: '📌' },
  { to: '/insights', label: 'Análisis', icon: '🧠' },
  { to: '/asesor', label: 'Asesor', icon: '💬' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export default function NavBar() {
  return (
    <nav className="nav-bar">
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span className="nav-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
