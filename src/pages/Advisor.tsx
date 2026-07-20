import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, orderBy, query, limit } from 'firebase/firestore'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '../lib/firebase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

async function loadFinancialContext() {
  const [incomeSnap, cardsSnap, fixedSnap, expensesSnap] = await Promise.all([
    getDocs(collection(db, 'incomeSources')),
    getDocs(collection(db, 'cards')),
    getDocs(collection(db, 'fixedPayments')),
    getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(60))),
  ])

  const incomeSources = incomeSnap.docs.map((d) => d.data())
  const fixedPayments = fixedSnap.docs.map((d) => d.data())
  const expenses = expensesSnap.docs.map((d) => d.data())

  const cards = []
  for (const cardDoc of cardsSnap.docs) {
    const installmentsSnap = await getDocs(collection(db, 'cards', cardDoc.id, 'installments'))
    cards.push({ id: cardDoc.id, ...cardDoc.data(), installments: installmentsSnap.docs.map((d) => d.data()) })
  }

  return { incomeSources, cards, fixedPayments, expenses }
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof loadFinancialContext>>, today: string) {
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

export default function Advisor() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [checkingKey, setCheckingKey] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDoc(doc(db, 'settings', 'anthropic')).then((snap) => {
      setApiKey((snap.data()?.apiKey as string) || null)
      setCheckingKey(false)
    })
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || sending || !apiKey) return

    const history = messages
    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setQuestion('')
    setSending(true)
    setError(null)

    try {
      const context = await loadFinancialContext()
      const today = new Date().toISOString().slice(0, 10)
      const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        system: buildSystemPrompt(context, today),
        messages: [...history, { role: 'user', content: trimmed }],
      })

      const textBlock = response.content.find((block) => block.type === 'text')
      const answer = textBlock ? textBlock.text : 'No obtuve una respuesta de texto.'
      setMessages([...nextMessages, { role: 'assistant', content: answer }])
    } catch (err) {
      setError('No se pudo contactar al asesor: ' + String((err as { message?: string })?.message || err))
    } finally {
      setSending(false)
    }
  }

  if (checkingKey) {
    return (
      <div className="screen">
        <h1>Asesor</h1>
        <p className="muted">Cargando…</p>
      </div>
    )
  }

  if (!apiKey) {
    return (
      <div className="screen">
        <h1>Asesor</h1>
        <p className="muted">
          Primero necesitas guardar tu API key de Claude en <Link to="/ajustes">Ajustes</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="screen advisor-screen">
      <h1>Asesor</h1>
      <div className="chat-log">
        {messages.length === 0 && (
          <p className="muted">
            Pregúntale lo que quieras sobre tus finanzas: qué pagar primero, dónde puedes ahorrar, si te alcanza para
            algo, cómo mover tu dinero esta quincena, etc.
          </p>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'chat-bubble user' : 'chat-bubble assistant'}>
            {m.content}
          </div>
        ))}
        {sending && <div className="chat-bubble assistant muted">Pensando…</div>}
      </div>

      {error && <p className="error">{error}</p>}

      <form className="chat-form" onSubmit={onSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ej. ¿qué tarjeta pago primero?"
          disabled={sending}
        />
        <button type="submit" className="primary-button" disabled={sending || !question.trim()}>
          Enviar
        </button>
      </form>
    </div>
  )
}
