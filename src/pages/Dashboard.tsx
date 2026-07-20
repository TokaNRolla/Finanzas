import { orderBy, limit } from 'firebase/firestore'
import { useCollection } from '../hooks/useCollection'
import { formatMoney } from '../lib/format'
import type { Card, FixedPayment, IncomeSource, Insight } from '../types'

export default function Dashboard() {
  const { data: income } = useCollection<IncomeSource>('incomeSources')
  const { data: cards } = useCollection<Card>('cards')
  const { data: fixedPayments } = useCollection<FixedPayment>('fixedPayments')
  const { data: insights } = useCollection<Insight>('insights', orderBy('date', 'desc'), limit(1))

  const totalIncome = income.reduce((sum, i) => sum + i.quincena1Amount + i.quincena2Amount, 0)
  const totalDebt = cards.reduce((sum, c) => sum + c.saldoActual, 0)

  const upcoming = [
    ...cards.map((c) => ({ label: c.name, date: c.fechaDePago, amount: c.pagoParaNoGenerarIntereses })),
    ...fixedPayments.map((f) => ({ label: f.name, date: f.dueDay, amount: f.amount })),
  ]
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  const latestInsight = insights[0]

  return (
    <div className="screen">
      <h1>Resumen</h1>

      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-label">Ingreso mensual</span>
          <span className="stat-value income">{formatMoney(totalIncome)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Deuda total</span>
          <span className="stat-value debt">{formatMoney(totalDebt)}</span>
        </div>
      </div>

      <section>
        <h2>Próximos pagos</h2>
        <ul className="list">
          {upcoming.map((p, idx) => (
            <li key={idx} className="list-item">
              <span>{p.label}</span>
              <span className="muted">{p.date}</span>
              <span>{formatMoney(p.amount)}</span>
            </li>
          ))}
          {upcoming.length === 0 && <li className="muted">Sin pagos próximos registrados</li>}
        </ul>
      </section>

      <section>
        <h2>Análisis de hoy</h2>
        {latestInsight ? (
          <div className="insight-card">
            <p className="muted">{latestInsight.date}</p>
            <p>{latestInsight.summary}</p>
          </div>
        ) : (
          <p className="muted">Todavía no hay un análisis generado.</p>
        )}
      </section>
    </div>
  )
}
