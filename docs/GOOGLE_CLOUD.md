# Google: inicio de sesión real

**Qué es real y qué sigue siendo ejemplo.** Con las credenciales cargadas, «Continuar con Google» abre el
flujo OpenID Connect de Google (código de autorización con PKCE). El servidor canjea el código, verifica la
firma del ID token contra las llaves públicas de Google y comprueba emisor, audiencia, vencimiento,
`email_verified`, el claim `hd = ufm.edu` y el `nonce`. Solo entonces abre la sesión. Solo se pide
`openid email`: MiU no ve Drive, Calendar ni contactos.

Sin credenciales (o con `MIU_GOOGLE_MODE=mock`, o en un host cuyo redirect no está registrado) el botón
entra con la estudiante de ejemplo, como antes, y el log del servidor dice por qué:
`[google] Inicio de sesión simulado (mock): …`.

**Sigue siendo mock:** Google Drive de `/cuenta/archivos` (un interruptor de consentimiento con tres
archivos de ejemplo). Conectarlo pide otro cliente de la API de Drive, el alcance `drive.readonly`
(restringido: exige verificación de Google para producción) y el `AccountPort` real. No se tocó.

El código vive en `src/modules/identity/google/` (`oidc.ts`: HTTP con Google; `signin.ts`: qué modo se usa)
y en `src/app/(auth)/login/google/{start,callback}/route.ts`.

## 1. En Google Cloud Console

1. **Proyecto.** <https://console.cloud.google.com> → crear el proyecto «MiU». Si la UFM tiene su
   organización de Workspace, créalo dentro de ella.
2. **APIs a habilitar: ninguna.** El inicio de sesión con OpenID Connect no necesita habilitar una API.
   (Solo habría que habilitar *Google Drive API* el día que se conecte Drive.)
3. **Google Auth Platform → Branding.** Nombre «MiU», correo de soporte, logo opcional.
4. **Google Auth Platform → Audience (pantalla de consentimiento).**
   - **Interno** si el proyecto está en la organización `ufm.edu`: solo entran cuentas de la UFM, sin
     verificación ni lista de usuarios de prueba. Es lo ideal.
   - **Externo, en «Testing»** si el proyecto es tuyo: añade en *Test users* las cuentas `@ufm.edu` con las
     que vas a entrar (máximo 100). Una cuenta de Gmail normal **será rechazada por MiU** (no trae
     `hd = ufm.edu`), aunque esté en la lista.
5. **Google Auth Platform → Data access (scopes).** Solo `openid` y `…/auth/userinfo.email`
   (los dos no sensibles; no piden verificación).
6. **Google Auth Platform → Clients → Create client → Web application**, nombre «MiU web».
7. **Authorized JavaScript origins** (el flujo de servidor no las usa, pero no estorban):
   - `http://localhost:3000`
   - `https://miu-2026.vercel.app`
   - el alias estable de la rama en Vercel (ver abajo)
8. **Authorized redirect URIs** (exactas, sin barra final; Google no admite comodines):
   - local: `http://localhost:3000/login/google/callback`
   - producción: `https://miu-2026.vercel.app/login/google/callback`
   - preview de la rama: `https://<alias-de-la-rama>.vercel.app/login/google/callback`
     (el alias estable de la rama, no la URL de cada despliegue, que cambia).
9. Copia el **Client ID** y el **Client secret**.

## 2. En Vercel (Project → Settings → Environment Variables)

| Variable | Production | Preview | Development | Valor |
|---|---|---|---|---|
| `GOOGLE_CLIENT_ID` | sí | sí* | sí | Client ID |
| `GOOGLE_CLIENT_SECRET` | sí (Sensitive) | sí* (Sensitive) | sí | Client secret |
| `GOOGLE_REDIRECT_URI` | `https://miu-2026.vercel.app/login/google/callback` | el redirect del alias de la rama* | `http://localhost:3000/login/google/callback` | exacto al registrado |
| `MIU_SESSION_SECRET` | sí | sí | sí | `openssl rand -base64 32` |
| `MIU_GOOGLE_MODE` | solo si quieres forzar el demo: `mock` | idem | idem | `mock` |

\* Una variable de Preview vale para todos los despliegues de preview. Mientras `GOOGLE_REDIRECT_URI` sea el
del alias de la rama, solo ese host usa Google real; cualquier otra URL de preview cae sola al mock en vez de
terminar en el error `redirect_uri_mismatch` de Google. Si no quieres Google real en Preview, no cargues las
variables ahí.

`Development` se usa con `vercel env pull .env.local`; en local basta un `.env.local` con las tres
`GOOGLE_*` (en `localhost` el redirect se deduce si falta `GOOGLE_REDIRECT_URI`).

Después de cambiar variables hay que **redesplegar** (las variables se leen al arrancar la función).

## 3. Cómo comprobarlo

- `http://localhost:3000/login` → el botón de Google es un enlace a `/login/google/start`.
- Entrar con una cuenta `@ufm.edu` → vuelve a `/` con esa persona (cuenta de estudiante nueva en el mock).
- Cuenta que no es de la UFM, o cancelar en Google → `/login?google=rechazado` con un aviso.
- Sin credenciales → el botón entra como Ana López y el log dice `[google] Inicio de sesión simulado`.
