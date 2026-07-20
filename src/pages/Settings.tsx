import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../lib/AuthContext'

const SETTINGS_DOC = doc(db, 'settings', 'anthropic')

export default function Settings() {
  const { logout } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDoc(SETTINGS_DOC).then((snap) => {
      setApiKey((snap.data()?.apiKey as string) || '')
      setLoading(false)
    })
  }, [])

  const onSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await setDoc(SETTINGS_DOC, { apiKey }, { merge: true })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <h1>Ajustes</h1>

      <section className="settings-card">
        <div className="row-between">
          <h2 className="settings-title">API Key de Claude (Anthropic)</h2>
          <span className="muted small">Sincronizado en todos tus dispositivos</span>
        </div>
        <p className="muted">Se guarda en tu cuenta — funciona en compu, cel y tablet automáticamente.</p>

        {loading ? (
          <p className="muted">Cargando…</p>
        ) : (
          <>
            <div className="key-input-row">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-…"
              />
              <button type="button" className="icon-button" onClick={() => setShowKey((v) => !v)}>
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
            <button type="button" className="primary-button" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            {saved && <p className="muted">Guardado.</p>}
          </>
        )}
      </section>

      <p className="muted">
        Esta app usa la API de Anthropic. Obtén tu key en{' '}
        <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">
          console.anthropic.com
        </a>
        .
      </p>

      <button type="button" className="secondary-button" onClick={() => logout()}>
        Cerrar sesión
      </button>
    </div>
  )
}
