import { useState, type FormEvent } from 'react'
import { addDoc, collection, orderBy, serverTimestamp } from 'firebase/firestore'
import { useCollection } from '../hooks/useCollection'
import { db } from '../lib/firebase'
import { formatMoney } from '../lib/format'
import type { Card, Expense } from '../types'

const today = () => new Date().toISOString().slice(0, 10)

export default function Expenses() {
  const { data: cards } = useCollection<Card>('cards')
  const { data: expenses, loading } = useCollection<Expense>('expenses', orderBy('date', 'desc'))

  const [amount, setAmount] = useState('')
  const [concept, setConcept] = useState('')
  const [method, setMethod] = useState('efectivo')
  const [date, setDate] = useState(today())
  const [category, setCategory] = useState('')
  const [filterMethod, setFilterMethod] = useState('todos')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const parsedAmount = Number(amount)
    if (!parsedAmount || !concept) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'expenses'), {
        date,
        concept,
        amount: parsedAmount,
        method,
        category: category || null,
        isPaymentToCard: parsedAmount < 0,
        createdAt: serverTimestamp(),
      })
      setAmount('')
      setConcept('')
      setCategory('')
      setDate(today())
    } finally {
      setSubmitting(false)
    }
  }

  const visibleExpenses = expenses.filter((e) => filterMethod === 'todos' || e.method === filterMethod)

  return (
    <div className="screen">
      <h1>Gastos</h1>

      <form className="expense-form" onSubmit={onSubmit}>
        <label>
          Monto
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </label>
        <label>
          Concepto
          <input value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej. Oxxo" required />
        </label>
        <label>
          Método / tarjeta
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="debito">Débito</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Categoría (opcional)
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej. Comida" />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Agregar gasto'}
        </button>
      </form>

      <section>
        <div className="row-between">
          <h2>Historial</h2>
          <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="debito">Débito</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {loading && <p className="muted">Cargando…</p>}
        <ul className="list">
          {visibleExpenses.map((e) => (
            <li key={e.id} className="list-item">
              <span>{e.concept}</span>
              <span className="muted">{e.date}</span>
              <span className={e.amount < 0 ? 'income' : ''}>{formatMoney(e.amount)}</span>
            </li>
          ))}
          {visibleExpenses.length === 0 && !loading && <li className="muted">Sin gastos registrados</li>}
        </ul>
      </section>
    </div>
  )
}
