# Decisiones técnicas (registro corto)

Cada entrada: fecha · decisión · por qué · cómo revertirla.

## 2026-10-22 · E0

- **Next.js 16.4.2 + React 19.3.1, versiones exactas** (`save-exact`, `package-lock.json`). Última estable con soporte.
- **TypeScript 6.0.3, no 7.0.** *(Hecho)* `typescript-eslint` 8.72 solo admite `typescript <6.1`. Se sube a 7 cuando
  `typescript-eslint` lo soporte.
- **Sin `vite-tsconfig-paths`.** Vite 8 resuelve los alias de `tsconfig` por sí mismo (`resolve.tsconfigPaths`), y el
  plugin dependía de un paquete sin mantenimiento (`tsconfck`).
- **CSP por petición con nonce** en `src/proxy.ts` (convención `proxy` de Next 16). Obliga a render dinámico: el
  layout raíz lee `headers()`.
  - `script-src` solo con nonce + `'strict-dynamic'`; `'unsafe-eval'` solo en desarrollo.
  - **Excepción documentada:** `style-src-attr 'unsafe-inline'`. Las librerías de animación escriben estilos
    iniciales en el HTML del servidor. Un atributo `style` no ejecuta script; el riesgo residual (inyección de CSS)
    es bajo. Los `<style>` y `<link>` siguen exigiendo nonce u origen propio.
  - `upgrade-insecure-requests` solo cuando la petición llega por HTTPS, para que `localhost` funcione.
  - Ningún origen externo en la política (sin CDN).
- **Cabeceras estáticas** en `next.config.ts`: HSTS con preload, `nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, COOP, CORP y `Permissions-Policy` restrictiva. Sin `X-Powered-By`.
- **Fuente Inter autoalojada** con `@fontsource-variable/inter` (sin Google Fonts en runtime).
- **E2E con un Chromium local.** El Chromium de Playwright no está descargado (requiere tu permiso). Mientras tanto,
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` apunta a Brave, que es Chromium. Proyectos: claro, oscuro y móvil.
- **Node:** `engines` y `.nvmrc` exigen 24.22.1. En esta máquina hay 24.19.0 hasta que Luis la actualice; npm solo
  avisa (`EBADENGINE`).
