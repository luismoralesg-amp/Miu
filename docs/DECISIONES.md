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

## 2026-10-22 · E1

- **Rojo UFM `#E22726`**, medido en el escudo de `logo-ufm01.png`. El degradado del acento va de `#E22726` a
  `#C21D1D`, con texto blanco de al menos 4.6:1. Para texto y enlaces de acento: `#C21D1D` en claro y `#FF6F66` en
  oscuro.
- **El error usa rosa (`#BE123C`), no el rojo UFM,** y siempre va con ícono y texto, para que un error no se confunda
  con el acento. **El foco y la información usan el azul del escudo** (`#0C4C91` / `#7DB3F5`) por el mismo motivo.
- **Borde de campos `border-control` con 3:1** (WCAG 1.4.11); los divisores pueden ser más suaves.
- **Contraste comprobado por prueba:** `tokens.test.ts` lee `tokens.css` y exige 4.5:1 en texto y 3:1 en controles,
  en claro, en oscuro por sistema y en oscuro elegido (73 casos). Cambiar un color que lo rompa hace fallar `npm test`.
- **Tema en cookie (`miu-theme`), sin script en línea:** el servidor pinta el tema elegido, así que no hay destello ni
  excepción a la CSP. "Sistema" deja decidir a `prefers-color-scheme`. El cambio es instantáneo (apple-design).
- **Movimiento:**
  - Las entradas de contenido usan CSS (`reveal`: fade y 8 px hacia arriba, 360 ms, escalonadas 40 ms). Corren fuera
    del hilo principal y no dependen de la hidratación (emil-design-eng).
  - `motion` queda para gestos interrumpibles (hojas, arrastres), con resortes críticamente amortiguados por defecto
    (`src/design-system/motion/presets.ts`).
  - Presionar escala a 0.97 en 140 ms; el hover solo aplica con puntero fino. Los tabs y el cambio de tema no se
    animan porque se usan muchas veces al día.
  - Con reduced motion solo queda el fade.
- **Componentes propios, sin librería headless:** `<dialog>` nativo (foco, Escape, capa superior), radios y casillas
  nativos. Menos dependencias y menos superficie para la CSP.
- **Marca:** `escudo.png` y `escudo-osc.png` son marcas de agua negras al 4 % y 12 % de opacidad (medido); sobre fondo
  claro no se ven. En fondo claro se muestra **el escudo recortado de `logo-ufm01.png`** (los píxeles no cambian, solo
  se encuadra) junto al nombre en Inter. En oscuro se usa el logo oficial completo.
- **Componentes que se construyen en su etapa:** Combobox, DateRangePicker, DataTable, gráficas, CalendarWeek, mapa del
  pensum, CommandPalette, Sheet, Toast y Timeline llegan con la pantalla que los usa (E2 a E7), para diseñarlos con
  datos reales y no en abstracto.
- **Catálogo `/dev/sistema`:** solo en desarrollo, o con `MIU_DEV_TOOLS=1` (lo activa Playwright).

## 2026-10-22 · E2 · Identidad P1 en el código

- **P1 · Editorial pasa a ser el sistema visual real** (ronda de diseño 3, aprobada por Luis). Lienzo cálido
  (`#f7f3ec` / `#13110e`), reglas finas en lugar de tarjetas con sombra (`Card` usa borde de 1 px en ambos temas),
  Fraunces para títulos y cifras (utilidad `display`) e Inter para la interfaz.
- **Fraunces autoalojada** en `public/fonts/`, con `OFL-Fraunces.txt` al lado. Sin CDN ni Google Fonts en runtime.
- **Colores por curso** `--course-1…6`, validados con el validador de dataviz (pares vecinos en claro y oscuro). Solo
  como marca (`CourseDot`), nunca como fondo de texto. `tokens.test.ts` exige 3:1 de cada uno sobre `bg`, `surface` y
  `surface-subtle`.
- `--success-fg` claro pasa de `#15803d` a `#12703a` para mantener 4.5:1 sobre el lienzo cálido. `--border-control`
  se recalculó para 3:1 en las tres superficies.
- **Comisión de tarjeta:** las maquetas muestran el total con comisión, pero en código **no se aplica recargo** hasta
  que la UFM lo decida (ver `INTEGRACIONES_PENDIENTES.md`).

## 2026-10-22 · E2

- **Sesión en cookie HttpOnly `miu-sesion`** (`SameSite=Lax`, `Secure` detrás de HTTPS). Dura 12 h, o 30 días con
  "recordar". La cookie `miu-dispositivo` identifica al navegador para reutilizar su dispositivo y su passkey.
- **El correo pendiente nunca va en la URL**: viaja en la cookie `miu-ingreso` (10 min, ruta `/login`).
- **El enlace mágico pide confirmar**: abrirlo no inicia sesión, para que los escáneres de correo no lo gasten.
- **⌘K sin animación de apertura** (atajo frecuente); los popovers usan transiciones CSS interrumpibles.
- **Las secciones sin construir tienen URL desde ya** y dicen en qué etapa llegan; una ruta desconocida da 404 real.
- **El selector de rol vive en el menú de cuenta** y solo con `MIU_DEV_TOOLS`.

## 2026-10-25 · Cierre (backlog `BACKLOG_CIERRE.md`)

- **Dos servidores en Playwright:** el de siempre (`MIU_DEV_TOOLS=1`, puerto 3100) y un `next start` sin herramientas de
  desarrollo (3101) que reutiliza el mismo build. `production.spec.ts` prueba que ahí no hay selector de rol, buzón de
  códigos ni `/dev/sistema`.
- **Copias de iCloud fuera del typecheck:** el repo vive en `Documents` (iCloud) y aparecen copias `* 2.ts` en `.next/`
  que rompen `tsc`. `tsconfig.json` excluye `**/* ?.ts(x)`. Riesgo: conviene mover el repo fuera de iCloud.
- **Puertos con presupuesto de tiempo:** `withTimeout` (≤ 10 s, `AbortSignal` para cancelar el fetch real) y `guarded`
  lo aplica a cada método de un adaptador. Un error lanzado se vuelve `unavailable`: ningún puerto lanza.
- **Selección de adaptador** con `MIU_ADAPTER_<PUERTO>=mock|real`; cualquier otro valor es `mock`, para que un error de
  escritura nunca apunte la demo a un sistema real.
- **Actor por sesión:** cada llamada a un puerto recibe `Actor` (`userId`, `personId`, rol). En el mock, una cuenta
  sembrada actúa como su persona; cualquier otra (pruebas E2E, selector de rol) actúa como la persona sembrada de ese
  rol. El estado que cambia (entregas, calificaciones, lecturas) vive **por `userId`**, así las sesiones E2E en
  paralelo no se pisan. Las notas que publican las cuentas sembradas del personal sí se comparten, para que la demo
  fluya del Auxiliar a la estudiante.
- **Puertos académicos:** `AcademicPort`, `AssessmentPort`, `CurriculumPort` e `InboxPort` con contratos zod
  (`parsed()` convierte una ruptura de contrato en `invalid`). El `real` de cada uno es `notConnected()`: responde
  `unavailable` con el nombre del sistema que falta.
- **La bandeja es una proyección**, no una copia: `listItems` y `count` corren la misma consulta sobre los otros
  puertos, así que entregar o leer se refleja al instante y el badge no puede discrepar de la lista.
- **Límites entre módulos con ESLint:** fuera de un módulo nadie importa sus `adapters`; dentro de `src/modules/`,
  nadie importa `domain`, `ports` ni `adapters` de otro módulo (las pruebas sí, para armar escenarios).
- **Comisión de tarjeta como costo del pagador [S, pendiente de la UFM]:** reemplaza la nota de E2 ("no se aplica
  recargo"). Por indicación del cierre, `quote` suma 4.5% + Q2 al total con tarjeta o Apple Pay y ACH va sin comisión.
  Es una política (`POLICY.comisionTarjeta.pagador`): si la UFM decide absorberla, se cambia a `universidad` y el total
  vuelve a ser el monto del cargo, sin tocar código.
- **Webhook de Recurrente:** `POST /api/webhooks/recurrente` verifica `x-recurrente-signature` (HMAC-SHA256 del cuerpo
  crudo, comparación en tiempo constante) antes de leer el JSON; un evento repetido responde 200 sin liquidar dos
  veces. En el mock, la página de checkout local firma el mismo evento y lo manda por el mismo manejador.
- **Transferencias con comprobante:** van a una cola compartida del Administrativo; aprobar liquida el pago de la
  sesión de la estudiante que lo envió. Rechazar exige un motivo.
- **Entregas:** el archivo pasa por `StoragePort` (guardar, huella SHA-256 sobre los bytes exactos y escaneo; el mock
  detecta el archivo de prueba EICAR y bloquea ejecutables) y solo entonces se registra la entrega con esa huella. El
  recibo (`MIU-E-` + 8 primeros caracteres de la huella) queda en la actividad y se puede copiar. Límite de 10 MB:
  `experimental.serverActions.bodySizeLimit = "11mb"`. En producción la subida sería directa a S3 con URL firmada.
- **ICS en UTC:** `src/lib/ics.ts` escribe horas en UTC, CRLF y líneas plegadas a 75 octetos, con alarma (24 h antes
  de una entrega, 1 h antes de un examen) y `RRULE` semanal para el horario. Así lo lee cualquier calendario sin
  depender de `VTIMEZONE`.
- **Metadatos en streaming:** Next 16 inserta el `<title>` de páginas con `generateMetadata` asíncrono un instante
  después del contenido; `expectAccessible` espera el título antes de correr axe.
