import { orderBy } from 'firebase/firestore'
import { useCollection } from '../hooks/useCollection'
import type { Insight } from '../types'

function InsightSection({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <h4>{title}</h4>
      <ul className="list nested">
        {items.map((item, idx) => (
          <li key={idx} className="list-item single">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Insights() {
  const { data: insights, loading } = useCollection<Insight>('insights', orderBy('date', 'desc'))

  return (
    <div className="screen">
      <h1>Análisis diario</h1>
      {loading && <p className="muted">Cargando…</p>}
      {insights.length === 0 && !loading && (
        <p className="muted">
          Todavía no hay análisis generados. Se crean automáticamente todos los días una vez que el proyecto esté
          desplegado.
        </p>
      )}
      <div className="insight-list">
        {insights.map((insight) => (
          <article key={insight.id} className="insight-card">
            <p className="muted">{insight.date}</p>
            <p>{insight.summary}</p>
            <InsightSection title="Problemas detectados" items={insight.problemas} />
            <InsightSection title="Prioridad de pago" items={insight.prioridadDePago} />
            <InsightSection title="Oportunidades de ahorro" items={insight.oportunidadesAhorro} />
            <InsightSection title="Recomendaciones" items={insight.recomendaciones} />
          </article>
        ))}
      </div>
    </div>
  )
}
