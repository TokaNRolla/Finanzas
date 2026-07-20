import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import RequireAuth from './components/RequireAuth'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Cards from './pages/Cards'
import Expenses from './pages/Expenses'
import FixedPayments from './pages/FixedPayments'
import Insights from './pages/Insights'
import Advisor from './pages/Advisor'

function AppShell() {
  return (
    <RequireAuth>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tarjetas" element={<Cards />} />
            <Route path="/gastos" element={<Expenses />} />
            <Route path="/pagos-fijos" element={<FixedPayments />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/asesor" element={<Advisor />} />
          </Routes>
        </main>
        <NavBar />
      </div>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}
