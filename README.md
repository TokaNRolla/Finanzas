# Mis Finanzas

App web (PWA) para consultar tarjetas, ingresos, pagos fijos y gastos desde el celular, con un análisis financiero diario generado por Claude.

## Stack

- React + Vite + TypeScript, instalable en el celular (Add to Home Screen).
- Firebase Auth + Firestore + Cloud Functions (plan Blaze, pago por uso) como base de datos y backend.
- GitHub Actions: despliega a Firebase Hosting en cada push a `main`, y corre un análisis diario con la API de Claude que se guarda en Firestore.
- Pestaña "Asesor": chat en tiempo real con Claude (vía una Cloud Function) que responde preguntas usando tus datos financieros actuales.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto de Firebase**
   - Ve a https://console.firebase.google.com → "Agregar proyecto".
   - Dentro del proyecto, activa **Authentication** con el proveedor **Correo electrónico/contraseña**.
   - En la pestaña **"Users"** de Authentication, agrega tu propio usuario (el correo y la contraseña con los que vas a entrar a la app — no hay registro público, solo tú puedes crear cuentas desde la consola de Firebase).
   - Activa **Firestore Database** (modo producción, cualquier región).
   - En "Configuración del proyecto" → "Tus apps" → agrega una app web, copia los valores y pégalos en un archivo `.env` (copia `.env.example` como base). Este `.env` es solo para desarrollo local, nunca se sube al repo.

2. **Generar una service account de Firebase** (para el seed inicial y el análisis diario)
   - "Configuración del proyecto" → "Cuentas de servicio" → "Generar nueva clave privada". Descarga el JSON.
   - Guárdalo localmente como `firebase-service-account.json` en la raíz del proyecto (ya está en `.gitignore`, nunca se sube).

3. **Cargar los datos iniciales** (los que ya estaban en tu Google Sheet)
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json npm run seed
   ```
   Revisa los valores en `scripts/seed.mjs` antes de correrlo — puedes editarlos si algo no coincide con tu Sheet.

4. **Crear una API key de Anthropic** en https://console.anthropic.com para el análisis diario y el asesor.

5. **Activar Cloud Functions (necesario para la pestaña "Asesor")**
   - En Firebase Console → "Uso y facturación" (ícono de engrane) → cambia del plan **Spark** al plan **Blaze**. Google pide una tarjeta, pero el uso de esta app se queda dentro de la capa gratuita de Functions — solo pagas centavos por las llamadas reales a la API de Claude.
   - Instala Firebase CLI y autentícate una sola vez desde tu computadora:
     ```
     npx firebase-tools login
     ```
   - Guarda tu API key de Anthropic como secret de Functions (te va a pedir pegarla, hazlo ahí y no en ningún otro lado):
     ```
     npx firebase-tools functions:secrets:set ANTHROPIC_API_KEY --project <tu-project-id>
     ```
   - Haz el primer deploy de Functions manualmente (esto habilita las APIs de Google Cloud necesarias — Cloud Build, Artifact Registry, Eventarc — que la primera vez piden confirmación interactiva):
     ```
     npx firebase-tools deploy --only functions --project <tu-project-id>
     ```
   - Después de este primer deploy manual, los deploys automáticos vía GitHub Actions ya funcionan solos.

6. **Conectar el repo de GitHub**
   - Crea el repo (puede ser privado) y súbelo (te aviso antes de hacer el push).
   - En GitHub → Settings → Secrets and variables → Actions, agrega estos secrets:
     - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (los mismos valores de tu `.env`).
     - `FIREBASE_SERVICE_ACCOUNT` (el contenido completo del JSON de la service account, pegado como texto).
     - `ANTHROPIC_API_KEY` (tu API key de Anthropic).
   - Con eso, cada push a `main` despliega la app, y todos los días a las 7am (hora CDMX) se genera un análisis nuevo.

## Desarrollo local

```
npm install
npm run dev
```

Abre la URL que muestra la terminal desde tu celular (misma red Wi-Fi) para probar la vista mobile, o usa las devtools del navegador en modo responsive.
