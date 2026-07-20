# Mis Finanzas

App web (PWA) para consultar tarjetas, ingresos, pagos fijos y gastos desde el celular, con un análisis financiero diario y un asesor por chat, ambos generados por Claude.

## Stack

- React + Vite + TypeScript, instalable en el celular (Add to Home Screen).
- Firebase Auth (Google o correo/contraseña) + Firestore (plan gratuito Spark) como base de datos.
- GitHub Actions: despliega a Firebase Hosting en cada push a `main`, y corre un análisis diario con la API de Claude que se guarda en Firestore.
- Pestaña "Asesor": chat con Claude que responde preguntas usando tus datos financieros actuales — llama a la API de Anthropic directo desde el navegador con la key que guardas en "Ajustes" (nada de backend adicional).

## Puesta en marcha (una sola vez)

1. **Crear el proyecto de Firebase**
   - Ve a https://console.firebase.google.com → "Agregar proyecto".
   - Dentro del proyecto, activa **Authentication** con los proveedores **Google** y **Correo electrónico/contraseña**.
   - En la pestaña **"Users"**, agrega tu propio usuario de correo/contraseña como respaldo (por si el de Google llega a fallar en algún navegador).
   - Activa **Firestore Database** (modo producción, cualquier región).
   - En "Configuración del proyecto" → "Tus apps" → agrega una app web, copia los valores y pégalos en un archivo `.env` (copia `.env.example` como base). Este `.env` es solo para desarrollo local, nunca se sube al repo.
   - `VITE_ALLOWED_EMAIL` en `.env` debe ser tu correo de Google — es el único que el botón de Google deja pasar. Si usas otro, cambia también el correo en `firestore.rules`.

2. **Generar una service account de Firebase** (para el seed inicial y el análisis diario)
   - "Configuración del proyecto" → "Cuentas de servicio" → "Generar nueva clave privada". Descarga el JSON.
   - Guárdalo localmente como `firebase-service-account.json` en la raíz del proyecto (ya está en `.gitignore`, nunca se sube).

3. **Cargar los datos iniciales** (los que ya estaban en tu Google Sheet)
   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json npm run seed
   ```
   Revisa los valores en `scripts/seed.mjs` antes de correrlo — puedes editarlos si algo no coincide con tu Sheet.

4. **Guardar tu API key de Anthropic dentro de la app**
   - Crea una key en https://console.anthropic.com.
   - Entra a la app → pestaña **"Ajustes"** → pégala ahí y dale "Guardar". Se guarda en Firestore y la usan tanto el chat del Asesor como el análisis diario — no hace falta configurarla en ningún otro lado.

5. **Conectar el repo de GitHub**
   - Crea el repo (puede ser privado) y súbelo (te aviso antes de hacer el push).
   - En GitHub → Settings → Secrets and variables → Actions, agrega estos secrets:
     - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_ALLOWED_EMAIL` (los mismos valores de tu `.env`).
     - `FIREBASE_SERVICE_ACCOUNT` (el contenido completo del JSON de la service account, pegado como texto).
   - Con eso, cada push a `main` despliega la app, y todos los días a las 7am (hora CDMX) se genera un análisis nuevo (siempre que ya hayas guardado tu API key en Ajustes).

## Desarrollo local

```
npm install
npm run dev
```

Abre la URL que muestra la terminal desde tu celular (misma red Wi-Fi) para probar la vista mobile, o usa las devtools del navegador en modo responsive.
