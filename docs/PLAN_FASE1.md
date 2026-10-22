# Plan · MiU Nuevo · Fase 1 (front end)

- Fecha: 2026-10-22 · Para: Luis · Estado: **aprobado para E0 (22-oct-2026)**
- Fuentes: `PROMPT_CLAUDE_MiU_Fase1_frontend.md`, `ANALISIS_MIU.md`, `ARQUITECTURA_MIU.md`,
  `FUNCIONES_NUEVAS_Y_PAGOS.md`, `referencias/REFERENCIA_VISUAL.md`.
- Etiquetas: **(Hecho)** verificado en este repo o máquina · **(Supuesto)** · **(Propuesta)**.

---

## 0. Bloqueos antes de empezar (Hechos de esta máquina)

| # | Hallazgo | Qué necesito de ti |
|---|---|---|
| B1 | Node instalado: **v24.19.0** (`/usr/local/bin/node`); nvm solo tiene v20.20.2. El mínimo pedido es **24.22.1**. | Instalar Node 24.22.1 (o 26.12.1). Es una herramienta global: no la instalo sin tu permiso. |
| B2 | Las skills `impeccable`, `emil-design-eng` y `apple-design` **no están** en esta máquina. Solo existe `find-skills` (global). No hay repo `senda` en `~/Documents/GitHub/`. | Dime dónde está Senda, o copia `senda/.claude/skills/` a `.claude/skills/`. |
| B3 | No hay logos en `public/brand/`. | Los archivos oficiales (fondo claro y oscuro). Mientras tanto uso un placeholder del tamaño correcto. |
| B4 | `docs/ANALISIS_MIU.md` y `docs/capturas/` contienen **tus datos reales** (CUI, fecha de nacimiento, carné, dirección). | Decidir si se versionan. Propuesta: censurarlos en el `.md` e ignorar `docs/capturas/` en git antes del primer commit. |

`pnpm` no está instalado; uso **npm 11** (ya disponible) con `package-lock.json`.

**Resolución (22-oct-2026):**
- B1: Luis actualiza Node con el instalador oficial. Mientras tanto se avanza en v24.19.0 solo en local, con datos
  mock; `engines` y `.nvmrc` ya exigen 24.22.1.
- B2: skills copiadas desde `apptest1 fase 2/.claude/skills/` (sin modificar el origen).
- B3: Luis entregó `logo-ufm01.png` (escudo a color con texto blanco, para fondo oscuro), `escudo.png` y
  `escudo-osc.png` (marcas de agua translúcidas). **Falta la versión para fondo claro**; se anota en
  `INTEGRACIONES_PENDIENTES.md`.
- B4: datos personales censurados en `ANALISIS_MIU.md`; `docs/capturas/` fuera de git.

---

## 1. Stack (Propuesta)

- **Next.js** (App Router, última estable con soporte; fijo la versión exacta al instalar) + **TypeScript estricto**
  (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- **Tailwind CSS v4** con tokens en CSS variables. **motion** (antes framer-motion) y **lucide-react**.
- Fuente **Inter variable** autoalojada vía `@fontsource-variable/inter` (sin CDN, sin Google Fonts en runtime).
- Validación con **zod** en cada frontera (adaptadores, formularios, webhooks).
- Pruebas: **Vitest** + Testing Library (unidad y componentes), **Playwright** (E2E, claro y oscuro), **axe** en E2E.
- PWA: manifest + service worker propio (sin dependencias de CDN).
- Calidad: ESLint + Prettier, `engines.node >= 24.22.1`, `.nvmrc`.
- Datos en esta fase: **store en memoria con seed determinista** detrás de los puertos. PostgreSQL/Redis entran en
  la fase de backend; los puertos no cambian.

---

## 2. Estructura de carpetas

```
src/
  app/                       # rutas (URLs en español, código en inglés)
    (auth)/                  # login, código, dispositivos
    (app)/                   # shell autenticado
    api/                     # webhooks (Recurrente), feed ICS, health
  modules/                   # monolito modular: un bounded context por carpeta
    identity/  academic/  assessment/  curriculum/  finance/  payments/
    conferences/  enrollment/  documents/  account/  communication/
    services/  notifications/  audit/  policy/
      domain/                # tipos y reglas puras (testeadas)
      application/           # casos de uso (consultas y comandos)
      ports/                 # interfaces
      adapters/mock/         # implementación realista con datos seed
      adapters/real/         # implementación vacía, lista para conectar
  authz/                     # RBAC (rol, permiso, ámbito) + pruebas
  design-system/
    tokens/                  # CSS variables + tipos
    components/              # biblioteca
    motion/                  # presets de animación (respetan reduced-motion)
  shell/                     # header, nav, buscador global, notificaciones, selector de rol (solo dev)
  lib/                       # fetch con timeout/retry, Result, fechas, formato de moneda
  mock/seed/                 # datos ficticios coherentes (nadie real)
public/brand/                # logos oficiales (placeholder mientras tanto)
tests/e2e/                   # Playwright
docs/                        # este paquete + INTEGRACIONES_PENDIENTES.md + DECISIONES.md
```

Regla de dependencias: `app → modules/application → ports`; ningún módulo importa el `domain` de otro, se hablan
por su API de aplicación. Lo verifico con una regla de ESLint (`no-restricted-imports`).

---

## 3. Tokens del sistema de diseño

| Grupo | Claro | Oscuro |
|---|---|---|
| `bg` | `#F9FAFB` | `#09090B` |
| `surface` (tarjeta) | `#FFFFFF` | `#18181B` |
| `border` | `#E5E7EB` | `#27272A` |
| `text` | `#111827` | `#FAFAFA` |
| `text-muted` | `#64748B` | `#A1A1AA` |
| `success` / `danger` / `warning` | verde / rojo / ámbar, con pares AA en ambos modos |

- **Acento: B, rojo UFM (decidido por Luis el 22-oct-2026).** El rojo base `#E22726` se tomó del borde del escudo
  en `public/brand/logo-ufm01.png` (Hecho: color dominante del archivo oficial). El degradado y las variantes de
  texto se derivan de ese rojo para cumplir AA. Se definen como `accent-from`, `accent-to`, `accent-fg`,
  `accent-soft`. *(Supuesto: si el manual de estilo de la UFM da otro hex, se cambia solo el token.)*
- **Tipografía:** Inter; escala `12/14/16/20/24/32/48/64`; datos principales 48–64 px `font-semibold tabular-nums`;
  etiquetas 12–14 px muted.
- **Espaciado:** base 4 px; padding de tarjeta 24 px; gap de rejilla 12 px.
- **Radios:** `sm 8` · `md 12` · `lg 16` (tarjetas) · `full`.
- **Sombra:** claro `0 1px 2px rgb(0 0 0 / .04), 0 4px 16px rgb(0 0 0 / .04)`; oscuro: sin sombra, borde 1 px.
- **Movimiento:** `fast 150 ms`, `base 300 ms`, `slow 400 ms`; resorte suave para entrada; skeleton → contenido con
  fade + slide-up escalonado (40 ms); cambio de tema instantáneo; todo se apaga con `prefers-reduced-motion`.
- **Íconos:** lucide, trazo 1.75, siempre con `aria-label` o texto.

---

## 4. Biblioteca de componentes

- **Base:** Button, IconButton, Link, Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, DateRangePicker
  (defaults sensatos, nunca fechas futuras), FileDrop, Badge, Tag, Avatar, Tooltip, Kbd.
- **Superficies:** Card (BentoCard), Sheet/Drawer, Dialog (nunca al entrar), Popover, Tabs **con rutas**, Accordion,
  Toast.
- **Datos:** DataTable (orden, filtro, búsqueda, paginación keyset), StatTile (dato grande + delta), Sparkline,
  BarChart/LineChart (SVG propio, accesible), ProgressRing, Timeline, CalendarWeek (eje temporal real), GraphMap
  (pensum).
- **Estados:** Skeleton, EmptyState (explica por qué y qué hacer), ErrorState (reintentar), TimeoutState,
  `AsyncBoundary` que junta los cuatro con timeout ≤ 10 s.
- **Shell:** AppHeader, NavRail/BottomNav (móvil), CommandPalette (buscador global ⌘K), NotificationCenter,
  ProfileMenu, ThemeToggle, RoleSwitcher (solo dev).
- **Dominio:** GradeBreakdown, SubmissionReceipt, PaymentMethodPicker (ruteo por costo), MaskedField (CUI),
  SolvencyBadge, ConferenceCard, RubricView.

---

## 5. Mapa de rutas (deep links reales)

| Ruta | Pantalla | Mecanismo cambiado vs MiU (una línea) |
|---|---|---|
| `/login`, `/login/codigo`, `/login/enlace` | Login | Un campo → código de 6 dígitos o enlace mágico → adentro; Google solo @ufm.edu; passkeys |
| `/` | Hoy | Reemplaza 10 pestañas + modal bloqueante por un bento con lo urgente primero |
| `/bandeja` | Pendientes + avisos + pagos | Bandeja única; badge y lista salen del mismo read model |
| `/cursos` | Cursos actuales | Tabla con búsqueda/orden, agrupada por facultad+período, carga < 1 s |
| `/cursos/[cursoId]` | Resumen del curso | "Lo importante primero": próxima actividad, nota actual, último anuncio |
| `/cursos/[cursoId]/{actividades,notas,documentos,anuncios,personas,programa,bibliografia,foro,blog,examenes,enlaces,biblioteca,recursos-ia,actividad-reciente}` | Sub-secciones | Cada sub-pestaña es una URL; vacío distingue "sin contenido" de "no habilitado" |
| `/cursos/[cursoId]/actividades/[actividadId]` | Detalle y entrega | Rúbrica visible antes de entregar; recibo con hash; ICS |
| `/horario` | Horario | Eje temporal real, clase actual destacada, exportar ICS/imprimir |
| `/pensum` | Mapa de cursos | Grafo con prerrequisitos al seleccionar, filas/columnas, colorizar por área |
| `/notas` | Notas | Todas las notas del período + perfil académico (promedio, tendencia) |
| `/historial` | Cursos anteriores | Agrupado por período, búsqueda global en lugar de 7 filtros |
| `/pagos`, `/pagos/pagar/[cargoId]`, `/pagos/recibos`, `/pagos/estado-de-cuenta` | Pagos y solvencia | Pagar en 2 pasos; ACH primero con el ahorro visible; fechas por defecto sensatas |
| `/conferencias`, `/conferencias/mis-reservas`, `/conferencias/[id]/evaluacion` | Conferencias | Estado claro (reservada, espera, expirada); evaluación dentro de la app por HTTPS |
| `/asignacion` | Asignar/Botar | Ventana de preferencias + resolución por lote; sin pop-ups; step-up |
| `/documentos` | Documentos académicos | Lista con búsqueda y rango por defecto del período |
| `/cuenta/{informacion,privacidad,accesos,dispositivos,archivos}` | Mi cuenta | CUI y fecha enmascarados; edición con step-up; sesiones revocables |
| `/comunicacion` | Comunicación | Mensajes con catedráticos/auxiliares dentro de la app (fce2 detrás de adaptador) |
| `/soporte` | Soporte | FAQ + manuales + chat con identidad y pantalla de origen prellenadas |
| `/servicios`, `/recursos/{directorio,oficinas,eventos,marca,chatgpt-edu}` | Servicios y recursos | Accesos agrupados con etiqueta; externos marcados como tales |
| `/catedra`, `/catedra/secciones/[seccionId]`, `/catedra/por-calificar`, `/catedra/libro/[seccionId]`, `/catedra/publicar`, `/catedra/cierre`, `/catedra/apelaciones`, `/catedra/auditoria`, `/catedra/estadisticas` | Maestro y Auxiliar | Misma app, el alcance por sección decide qué ves y qué puedes hacer |
| `/admin/{politicas,pagos,conciliacion,caja,reembolsos,roles,auditoria,apelaciones,estadisticas}` | Administrativo | Políticas configurables en vez de reglas fijas |

---

## 6. Contratos de los adaptadores (puertos)

Todos devuelven `Promise<Result<T, PortError>>` con `PortError = timeout | unavailable | forbidden | not_found |
invalid`, y aceptan un `AbortSignal` (timeout ≤ 10 s). Cada uno tiene `mock` y `real`, elegido por variable de
entorno (`MIU_ADAPTER_<PUERTO>=mock|real`).

| Puerto | Métodos principales | `real` se conecta a |
|---|---|---|
| `IdentityPort` | `startEmailOtp`, `verifyEmailOtp`, `consumeMagicLink`, `googleCallback` (valida firma, `aud`, `iss`, `exp`, `email_verified`, `hd=ufm.edu`), `registerPasskey`, `listDevices`, `revokeDevice` | Google OIDC, proveedor de email, WebAuthn |
| `AcademicPort` | `listCurrentEnrollments`, `getCourse`, `getSchedule`, `listPastEnrollments` | API/CDC de MiU |
| `AssessmentPort` | `listActivities`, `getActivity`, `submit`, `getGradebook`, `gradeSubmission`, `publishGrades`, `closeFinalGrade`, `appeal` | API/CDC de MiU |
| `CurriculumPort` | `getPensum` (cursos, UMA, prerrequisitos, requisitos, excluidos) | API/CDC de MiU |
| `InboxPort` | `listItems`, `count` (misma consulta) | read model propio |
| `LedgerPort` / `SolvencyPort` | `getBalance`, `listCharges`, `listReceipts`, `getStatement`, `isSolvent` | sistema financiero UFM |
| `PaymentProviderPort` | `quote(amount, method)`, `createCheckout`, `handleWebhook` (firma + idempotencia), `refund` | **Recurrente sandbox** (primero), transferencia con comprobante, presencial; **Stripe vacío** |
| `ConferencePort` | `search`, `reserve`, `cancel`, `listMine`, `submitEvaluation` | MiU / fce2 |
| `EnrollmentPort` | `getWindow`, `savePreferences`, `drop`, `getResult` | MiU |
| `DocumentsPort` | `listAcademicDocuments`, `requestDocument` | MiU |
| `StoragePort` | `presignUpload`, `hash`, `scan` | S3-compatible |
| `GoogleWorkspacePort` | `listDriveFiles`, `mailLinks` (UFMail, Calendar) | Google APIs con consentimiento previo |
| `MessagingPort` / `Fce2Port` | `listThreads`, `send` / herramientas fce2 | fce2 vía proxy de identidad |
| `SupportChatPort` | `openSession(context)` | providesupport con token firmado |
| `PlagiarismPort` | `submitForCheck`, `getReport` | Turnitin LTI 1.3 |
| `DirectoryPort` | `searchPeople` (mín. 3 caracteres, respeta privacidad), `listOffices`, `listEvents` | MiU |
| `NotificationPort` | `push`, `email`, `icsFeedUrl` | Web Push, email |
| `AuditPort` | `record`, `query` | tabla append-only |

`docs/INTEGRACIONES_PENDIENTES.md` lleva una fila por puerto: qué falta, qué debe validar la UFM, contrato
esperado y cómo activarlo.

**Recurrente sandbox (Supuesto):** implemento el adaptador `real` contra su API pública de checkout y webhooks
(verifico la documentación al llegar ahí). Se activa con tus llaves de **prueba** en `.env.local`; sin llaves, el
`mock` simula el checkout alojado y el webhook. Nunca hay datos de tarjeta en nuestra app (SAQ A).

---

## 7. Roles y permisos

- `authz/` define `Permission` (p. ej. `grade`, `publish_grades`, `close_final_grade`, `override_grade`,
  `assign_assistant`, `approve_payment`, `configure_policy`…), `Scope` (`global | faculty | course | section |
  own`) y una tabla `(role, permission, scope)` que replica la matriz de `FUNCIONES_NUEVAS_Y_PAGOS.md` §3.
- `close_final_grade`: por defecto solo Maestro; el Administrativo lo otorga por curso o sección **(Supuesto a
  confirmar con la UFM)**.
- Justificación obligatoria bajo el umbral y auditoría aplican a **quien califique**.
- Pruebas de tabla: cada celda de la matriz es un caso de Vitest.
- Usuarios mock: 1 estudiante (Computación), 1 maestro, 2 auxiliares, 1 administrativo. Selector de rol solo con
  `NODE_ENV=development`.

---

## 8. Etapas (commits atómicos, sin push/PR/deploy sin tu aprobación)

| # | Etapa | Sale con |
|---|---|---|
| E0 | Andamiaje: Next, TS estricto, Tailwind, lint, Vitest, Playwright, CSP + cabeceras, `.nvmrc` | `npm test` y `npm run e2e` en verde (vacíos) |
| E1 | Tokens (acento B, rojo UFM) + componentes base + página `/dev/sistema` | Catálogo en claro y oscuro |
| E2 | Shell, navegación, buscador ⌘K, notificaciones, login mock completo, dispositivos, selector de rol | E2E de login |
| E3 | Puertos + mocks + seed + `authz` con pruebas | Matriz de permisos verde |
| E4 | Hoy + Bandeja | Badge = lista (prueba) |
| E5 | Cursos, detalle con sub-secciones, actividad y entrega | E2E ver y entregar tarea |
| E6 | Horario, Pensum, Notas, Historial | E2E consultar notas |
| E7 | Pagos (ruteo por costo, Recurrente sandbox/mock, transferencia, presencial) + cola del Administrativo | E2E pagar y consultar |
| E8 | Conferencias + evaluación, Asignación, Documentos | |
| E9 | Cuenta, Comunicación, Soporte, Servicios y Recursos | |
| E10 | Cátedra (Maestro y Auxiliar) | |
| E11 | Administrativo | |
| E12 | PWA, medición de LCP/INP, auditoría a11y (axe + teclado), revisión final | Reporte de cierre |

Cada etapa cierra con el reporte de §7 del prompt: capturas claro/oscuro, pruebas, métricas, adaptadores, skills
usadas, supuestos y decisiones.

---

## 9. Decisiones que necesito de ti

1. **B1–B4** de §0.
2. **Acento:** A (naranja de la referencia) o B (rojo UFM). Te muestro ambos lado a lado; la versión final la ves
   en `/dev/sistema` en E1.
3. **URLs en español** (`/horario`, `/pagos`) con código en inglés. ¿De acuerdo?
4. **Alcance de Servicios y Recursos:** el prompt no los lista en a–q pero están en el inventario de MiU (§4.15–4.16).
   Los incluyo en E9 para no perder funciones.
5. **Estudiante mock:** un alumno ficticio de Ciencias de la Computación (no tú), con datos inventados.
