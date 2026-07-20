import { useState, type FormEvent } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const askAdvisor = httpsCallable<{ question: string; history: Message[] }, { answer: string }>(
  functions,
  'askAdvisor',
)

export default function Advisor() {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || sending) return

    const history = messages
    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setQuestion('')
    setSending(true)
    setError(null)

    try {
      const result = await askAdvisor({ question: trimmed, history })
      setMessages([...nextMessages, { role: 'assistant', content: result.data.answer }])
    } catch {
      setError('No se pudo contactar al asesor. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
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
