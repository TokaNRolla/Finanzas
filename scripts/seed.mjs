// Carga los datos iniciales (extraídos del Google Sheet original) a Firestore.
// Revisa los números abajo contra tu Sheet antes de correr esto — son un punto de partida, no una migración automática.
//
// Uso:
//   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json npm run seed
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
if (!serviceAccountPath) {
  console.error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT_PATH (ruta al JSON de la service account).')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const incomeSources = [
  { name: 'Ixaya', quincena1Amount: 9000, quincena1PayDay: '15 del mes', quincena2Amount: 9000, quincena2PayDay: '31 del mes' },
  { name: 'SAAG', quincena1Amount: 9300, quincena1PayDay: '13 del mes', quincena2Amount: 9300, quincena2PayDay: '28 del mes' },
  { name: 'Up & Go', quincena1Amount: 0, quincena1PayDay: '', quincena2Amount: 22300, quincena2PayDay: '15 del mes' },
]

const fixedPayments = [
  { name: 'Casa', amount: 11000, dueDay: '2026-08-01' },
  { name: 'Camioneta', amount: 7500, dueDay: '2026-07-27' },
]

const cards = [
  {
    id: 'banorte-roja',
    name: 'Tarjeta Banorte Roja',
    totalCredit: null,
    availableCredit: 11712.31,
    saldoAlCorte: 55203.56,
    saldoActual: 47019.67,
    pagoParaNoGenerarIntereses: 40043.56,
    fechaDePago: '2026-07-23',
    installments: [
      { concepto: 'BESTDAY 2025', fechaCompra: '2025-05-30', montoTotal: 22330.86, saldoPendiente: 4962.46, pagoMensual: 1240.6, periodoPago: 14, mesesTotales: 18, mesesRestantes: 4 },
      { concepto: 'Mercado pago', fechaCompra: '2026-02-23', montoTotal: 37221.0, saldoPendiente: 21712.25, pagoMensual: 3101.75, periodoPago: 5, mesesTotales: 12, mesesRestantes: 7 },
      { concepto: 'Cancún 2026', fechaCompra: '2026-05-28', montoTotal: 30000.0, saldoPendiente: 23333.34, pagoMensual: 3333.33, periodoPago: 2, mesesTotales: 9, mesesRestantes: 7 },
    ],
  },
  {
    id: 'banorte-dorada',
    name: 'Tarjeta Banorte Dorada',
    totalCredit: null,
    availableCredit: 4511.96,
    saldoAlCorte: 16654.89,
    saldoActual: 17359.93,
    pagoParaNoGenerarIntereses: 11917.89,
    fechaDePago: '2026-07-23',
    installments: [
      { concepto: 'Amazon (iPad)', fechaCompra: '2025-11-14', montoTotal: 11999.2, saldoPendiente: 3999.76, pagoMensual: 999.93, periodoPago: 8, mesesTotales: 12, mesesRestantes: 4 },
      { concepto: 'Cancún 2026', fechaCompra: '2026-05-28', montoTotal: 16900.67, saldoPendiente: 13144.97, pagoMensual: 1877.85, periodoPago: 2, mesesTotales: 9, mesesRestantes: 7 },
    ],
  },
  {
    id: 'bbva-azul',
    name: 'Tarjeta BBVA Azul',
    totalCredit: null,
    availableCredit: 9092.46,
    saldoAlCorte: null,
    saldoActual: 12007.54,
    pagoParaNoGenerarIntereses: 4467.55,
    fechaDePago: '2026-07-28',
    installments: [
      { concepto: 'Tenencia KIA', fechaCompra: '2025-07-02', montoTotal: 9534.0, saldoPendiente: 0, pagoMensual: 1000.62, periodoPago: 12, mesesTotales: 12, mesesRestantes: 0 },
    ],
  },
  {
    id: 'mercado-pago',
    name: 'Tarjeta Mercado Pago',
    totalCredit: null,
    availableCredit: null,
    saldoAlCorte: null,
    saldoActual: 8419.78,
    pagoParaNoGenerarIntereses: 8419.78,
    fechaDePago: '2026-08-07',
    installments: [
      { concepto: 'Temu', fechaCompra: '2025-07-02', montoTotal: 2127.7, saldoPendiente: 709.22, pagoMensual: 709.22, periodoPago: 3, mesesTotales: 3, mesesRestantes: 0 },
    ],
  },
]

async function seed() {
  const batch = db.batch()

  for (const source of incomeSources) {
    const ref = db.collection('incomeSources').doc()
    batch.set(ref, source)
  }

  for (const payment of fixedPayments) {
    const ref = db.collection('fixedPayments').doc()
    batch.set(ref, payment)
  }

  for (const { id, installments, ...card } of cards) {
    const cardRef = db.collection('cards').doc(id)
    batch.set(cardRef, card)
    for (const installment of installments) {
      const installmentRef = cardRef.collection('installments').doc()
      batch.set(installmentRef, installment)
    }
  }

  await batch.commit()
  console.log('Datos iniciales cargados a Firestore.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
