// Corre diariamente (ver .github/workflows/daily-insight.yml): lee el estado actual de las finanzas
// en Firestore, le pide a Claude un análisis, y guarda el resultado en insights/{fecha}.
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import Anthropic from '@anthropic-ai/sdk'

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
const anthropicApiKey = process.env.ANTHROPIC_API_KEY
if (!serviceAccountPath || !anthropicApiKey) {
  console.error('Faltan FIREBASE_SERVICE_ACCOUNT_PATH y/o ANTHROPIC_API_KEY.')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()
const anthropic = new Anthropic({ apiKey: anthropicApiKey })

const today = new Date().toISOString().slice(0, 10)

async function loadState() {
  const [incomeSnap, cardsSnap, fixedSnap, expensesSnap] = await Promise.all([
    db.collection('incomeSources').get(),
    db.collection('cards').get(),
    db.collection('fixedPayments').get(),
    db.collection('expenses').orderBy('date', 'desc').limit(60).get(),
  ])

  const incomeSources = incomeSnap.docs.map((d) => d.data())
  const fixedPayments = fixedSnap.docs.map((d) => d.data())
  const expenses = expensesSnap.docs.map((d) => d.data())

  const cards = []
  for (const cardDoc of cardsSnap.docs) {
    const installmentsSnap = await cardDoc.ref.collection('installments').get()
    cards.push({
      id: cardDoc.id,
      ...cardDoc.data(),
      installments: installmentsSnap.docs.map((d) => d.data()),
    })
  }

  return { incomeSources, cards, fixedPayments, expenses }
}

function buildPrompt(state) {
  return `Eres un asesor financiero personal. Hoy es ${today}. Aquí está la situación financiera actual del usuario en formato JSON:

INGRESOS:
${JSON.stringify(state.incomeSources, null, 2)}

TARJETAS DE CRÉDITO (con sus compras a meses sin intereses):
${JSON.stringify(state.cards, null, 2)}

PAGOS FIJOS MENSUALES:
${JSON.stringify(state.fixedPayments, null, 2)}

GASTOS RECIENTES (hasta los últimos 60 registros):
${JSON.stringify(state.expenses, null, 2)}

Analiza esta información y usa la herramienta "registrar_analisis" para reportar:
- Un resumen breve (2-3 frases) del estado general.
- Problemas concretos que detectes (ej. saldos que crecen, fechas de pago muy próximas sin fondos suficientes, gastos hormiga).
- Una lista priorizada de qué pagar primero y por qué (considera intereses, fechas de corte/pago próximas).
- Oportunidades específicas de ahorro basadas en los gastos recientes.
- Recomendaciones concretas de cómo mover el dinero disponible (ingresos vs pagos) para tomar mejores decisiones esta semana.

Sé específico y usa los números reales, no generalidades. Todo en español, tono directo y práctico.`
}

const insightTool = {
  name: 'registrar_analisis',
  description: 'Registra el análisis financiero diario estructurado.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      problemas: { type: 'array', items: { type: 'string' } },
      prioridadDePago: { type: 'array', items: { type: 'string' } },
      oportunidadesAhorro: { type: 'array', items: { type: 'string' } },
      recomendaciones: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'problemas', 'prioridadDePago', 'oportunidadesAhorro', 'recomendaciones'],
  },
}

async function run() {
  const state = await loadState()
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 2000,
    tools: [insightTool],
    tool_choice: { type: 'tool', name: 'registrar_analisis' },
    messages: [{ role: 'user', content: buildPrompt(state) }],
  })

  const toolUse = message.content.find((block) => block.type === 'tool_use')
  if (!toolUse) throw new Error('Claude no devolvió el análisis estructurado esperado.')

  const analysis = toolUse.input

  await db
    .collection('insights')
    .doc(today)
    .set({
      date: today,
      ...analysis,
      createdAt: Timestamp.now(),
    })

  console.log(`Insight del ${today} guardado.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
