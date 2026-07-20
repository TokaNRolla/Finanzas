import { useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import { formatMoney } from '../lib/format'
import type { Card, Installment } from '../types'

function CardInstallments({ cardId }: { cardId: string }) {
  const { data: installments, loading } = useCollection<Installment>(`cards/${cardId}/installments`)

  if (loading) return <p className="muted">Cargando…</p>
  if (installments.length === 0) return <p className="muted">Sin compras a meses sin intereses.</p>

  return (
    <ul className="list nested">
      {installments.map((i) => (
        <li key={i.id} className="list-item">
          <span>{i.concepto}</span>
          <span className="muted">
            {i.mesesRestantes}/{i.mesesTotales} meses
          </span>
          <span>{formatMoney(i.pagoMensual)}/mes</span>
        </li>
      ))}
    </ul>
  )
}

export default function Cards() {
  const { data: cards, loading } = useCollection<Card>('cards')
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="screen">
      <h1>Tarjetas</h1>
      {loading && <p className="muted">Cargando…</p>}
      <ul className="list">
        {cards.map((card) => (
          <li key={card.id} className="card-item">
            <button className="card-header" onClick={() => setExpanded(expanded === card.id ? null : card.id)}>
              <span className="card-name">{card.name}</span>
              <span className="muted">Corte: {card.fechaDePago}</span>
            </button>
            <div className="card-body">
              <div className="card-row">
                <span className="muted">Saldo actual</span>
                <span>{formatMoney(card.saldoActual)}</span>
              </div>
              <div className="card-row">
                <span className="muted">Pago para no generar intereses</span>
                <span className="highlight">{formatMoney(card.pagoParaNoGenerarIntereses)}</span>
              </div>
              {card.availableCredit != null && (
                <div className="card-row">
                  <span className="muted">Crédito disponible</span>
                  <span>{formatMoney(card.availableCredit)}</span>
                </div>
              )}
            </div>
            {expanded === card.id && (
              <div className="card-installments">
                <h3>Compras a meses sin intereses</h3>
                <CardInstallments cardId={card.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
