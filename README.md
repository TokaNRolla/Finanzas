# Mis Finanzas

App web (PWA) para consultar tarjetas, ingresos, pagos fijos y gastos desde el celular, con un análisis financiero diario generado por Claude.

## Stack

- React + Vite + TypeScript, instalable en el celular (Add to Home Screen).
- Firebase Auth + Firestore (plan gratuito Spark) como base de datos.
- GitHub Actions: despliega a Firebase Hosting en cada push a `main`, y corre un análisis diario con la API de Claude que se guarda en Firestore.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto de Firebase**
   - Ve a https://console.firebase.google.com → "Agregar proyecto".
   - Dentro del proyecto, activa **Authentication** (método Correo/contraseña) y crea tu propio usuario (tu correo y una contraseña).
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

4. **Crear una API key de Anthropic** en https://console.anthropic.com para el análisis diario.

5. **Conectar el repo de GitHub**
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
