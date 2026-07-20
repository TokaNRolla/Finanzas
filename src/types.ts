export interface IncomeSource {
  id: string
  name: string
  quincena1Amount: number
  quincena1PayDay: string
  quincena2Amount: number
  quincena2PayDay: string
}

export interface Card {
  id: string
  name: string
  totalCredit: number | null
  availableCredit: number | null
  saldoAlCorte: number | null
  saldoActual: number
  pagoParaNoGenerarIntereses: number
  fechaDePago: string
}

export interface Installment {
  id: string
  concepto: string
  fechaCompra: string
  montoTotal: number
  saldoPendiente: number
  pagoMensual: number
  periodoPago: number
  mesesTotales: number
  mesesRestantes: number
}

export interface FixedPayment {
  id: string
  name: string
  amount: number
  dueDay: string
}

export type ExpenseMethod = 'efectivo' | 'debito' | { cardId: string }

export interface Expense {
  id: string
  date: string
  concept: string
  amount: number
  method: string
  category?: string
  isPaymentToCard?: boolean
}

export interface Insight {
  id: string
  date: string
  summary: string
  problemas: string[]
  prioridadDePago: string[]
  oportunidadesAhorro: string[]
  recomendaciones: string[]
}
