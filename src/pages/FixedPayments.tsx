import { useCollection } from '../hooks/useCollection'
import { formatMoney } from '../lib/format'
import type { FixedPayment } from '../types'

export default function FixedPayments() {
  const { data: payments, loading } = useCollection<FixedPayment>('fixedPayments')

  return (
    <div className="screen">
      <h1>Pagos fijos</h1>
      {loading && <p className="muted">Cargando…</p>}
      <ul className="list">
        {payments.map((p) => (
          <li key={p.id} className="list-item">
            <span>{p.name}</span>
            <span className="muted">{p.dueDay}</span>
            <span>{formatMoney(p.amount)}</span>
          </li>
        ))}
        {payments.length === 0 && !loading && <li className="muted">Sin pagos fijos registrados</li>}
      </ul>
    </div>
  )
}
