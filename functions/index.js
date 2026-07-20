import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import Anthropic from '@anthropic-ai/sdk'

initializeApp()
const db = getFirestore()

const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')

async function loadFinancialContext() {
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

function buildSystemPrompt(context, today) {
  return `Eres un asesor financiero personal para el dueño de esta app. Hoy es ${today}.
Aquí está su situación financiera actual en formato JSON — básate en estos números reales para responder, nunca en generalidades:

INGRESOS:
${JSON.stringify(context.incomeSources, null, 2)}

TARJETAS DE CRÉDITO (con sus compras a meses sin intereses):
${JSON.stringify(context.cards, null, 2)}

PAGOS FIJOS MENSUALES:
${JSON.stringify(context.fixedPayments, null, 2)}

GASTOS RECIENTES (hasta 60 registros):
${JSON.stringify(context.expenses, null, 2)}

Responde en español, de forma directa y práctica, como un asesor financiero de confianza que conoce a detalle su situación. Si pregunta algo que no tiene que ver con sus finanzas, respóndele con normalidad de todas formas.`
}

export const askAdvisor = onCall({ secrets: [anthropicApiKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.')
  }

  const question = request.data?.question
  const history = Array.isArray(request.data?.history) ? request.data.history : []

  if (typeof question !== 'string' || question.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Falta la pregunta.')
  }

  const context = await loadFinancialContext()
  const today = new Date().toISOString().slice(0, 10)
  const anthropic = new Anthropic({ apiKey: anthropicApiKey.value() })

  const messages = [
    ...history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1500,
    system: buildSystemPrompt(context, today),
    messages,
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  const answer = textBlock ? textBlock.text : 'No obtuve una respuesta de texto.'

  return { answer }
})
