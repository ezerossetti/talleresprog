# Talleres Córdoba — Vercel + Gmail OAuth + IA

Este proyecto conserva el frontend existente y reemplaza el backend PHP del formulario por Vercel Functions en Node.js.

## Variables de entorno en Vercel

Configurar en **Settings → Environment Variables**:

- `GOOGLE_CLIENT_ID` → Client ID de Google OAuth
- `GOOGLE_CLIENT_SECRET` → Client Secret de Google OAuth
- `GOOGLE_REDIRECT_URI` → `https://talleresprog.vercel.app/api/auth/google/callback`
- `GOOGLE_REFRESH_TOKEN` → se genera una sola vez mediante `/api/auth/google`
- `GOOGLE_EMAIL` → `ezequielrossettti8000@gmail.com`
- `ADMIN_EMAIL` → `ezequielrossettti8000@gmail.com`
- `MAIL_FROM` → `ezequielrossettti8000@gmail.com`
- `OPENAI_API_KEY` → tu clave existente
- `OPENAI_MODEL` → tu modelo existente (por ejemplo `gpt-5-mini`)

## Google OAuth

En **Google Auth Platform → Clients → tu cliente OAuth** agregar exactamente:

`https://talleresprog.vercel.app/api/auth/google/callback`

Tipo de aplicación: **Web application**.

El scope usado es únicamente:

`https://www.googleapis.com/auth/gmail.send`

Para generar el refresh token:

1. Deployar el proyecto en Vercel con `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI`.
2. Abrir `https://talleresprog.vercel.app/api/auth/google`.
3. Autorizar con `ezequielrossettti8000@gmail.com`.
4. La ruta callback mostrará el `GOOGLE_REFRESH_TOKEN`.
5. Copiarlo a Vercel como variable de entorno.
6. Hacer un nuevo deploy.

## Flujo final

Formulario → `/api/contact` → OpenAI intenta responder con la base institucional → Gmail envía la consulta a `ADMIN_EMAIL` → Gmail envía al usuario el acuse o la respuesta automática.

Si OpenAI no puede contestar con seguridad usando la base, se envía exactamente el acuse:

“¡Recibimos tu consulta! Gracias por comunicarte con nosotros. Recibimos correctamente tu mensaje y te responderemos a la brevedad.”

El correo HTML usa estética albiazul, banner de Talleres, pie institucional y `Reply-To` para que las respuestas continúen por correo.

## Importante

No colocar Client Secret, Refresh Token ni OpenAI API Key dentro del HTML o JavaScript del frontend. Deben quedar únicamente como variables de entorno de Vercel.
