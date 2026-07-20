import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, initializeAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
// Se usa localStorage en vez de IndexedDB: en algunos navegadores Android la
// persistencia por IndexedDB de Firebase Auth se queda colgada sin avisar.
// Nota: no se pasa popupRedirectResolver aquí a propósito — cargar ese
// resolver de forma anticipada (con el iframe de auth) es lo que dejaba
// la app entera trabada en "Cargando". Se pasa solo al momento de iniciar
// sesión (ver AuthContext.tsx), para que quede aislado a ese botón.
export const auth = initializeAuth(app, { persistence: browserLocalPersistence })
export const db = getFirestore(app)
export const functions = getFunctions(app)
