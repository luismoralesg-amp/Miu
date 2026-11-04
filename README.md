# MiU Nuevo

Propuesta de rediseño del portal MiU de la Universidad Francisco Marroquín. **Fase 1: front end completo con
datos ficticios** detrás de puertos intercambiables (`mock` hoy, `real` cuando la UFM conecte sus sistemas).
Nadie del seed es una persona real. Plan y contexto en [`docs/`](docs/PLAN_FASE1.md).

## Requisitos

- **Node 24.22.1** (fijado en `.nvmrc`). Con nvm: `source ~/.nvm/nvm.sh && nvm use`.
- npm 11 (viene con Node). No hace falta nada instalado de forma global.

## Correr la demo

```bash
npm install
```

```bash
npm run dev
```

Abre <http://localhost:3000>. En desarrollo las herramientas de demo están activas: el código de entrada aparece en
pantalla (no se manda correo) y el menú de cuenta trae el selector de rol.

### Entrar

1. Escribe un correo `@ufm.edu` y toca **Continuar**.
2. El código de 6 dígitos aparece en el recuadro "Correo de prueba"; escríbelo (se envía solo al sexto dígito).

| Rol            | Correo de demo                                                | Qué ver primero                                                      |
| -------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Estudiante     | `ana.lopez.demo@ufm.edu`                                      | Hoy, Cursos, una actividad para entregar, Notas, Pagos               |
| Maestro        | `jorge.castillo.demo@ufm.edu`                                 | Hoy (lo que espera nota), Por calificar, Publicar, Cerrar nota final |
| Auxiliar       | `carlos.mendez.demo@ufm.edu` (o `sofia.ramirez.demo@ufm.edu`) | Por calificar → Actividad 6: closures                                |
| Administrativo | `rodrigo.aju.demo@ufm.edu`                                    | Hoy (cola de comprobantes), Pagos (caja, conciliación), Políticas    |

Cualquier otro correo `@ufm.edu` entra como estudiante y ve el mismo expediente de demo.

### Cambiar de rol sin salir

Menú de cuenta (tus iniciales, arriba a la derecha) → **Rol (desarrollo)**. Solo existe en desarrollo o con
`MIU_DEV_TOOLS=1`; en producción (`npm run build && npm start`) no aparece (lo prueba `production.spec.ts`).

### Recorrido sugerido (10 minutos)

1. **Estudiante · Hoy:** el Parcial 2 de mañana arriba con su cuenta regresiva; tu día en un eje de horas real.
2. **⌘K** (o Ctrl+K): escribe "pagar" y Enter → paso 1 del pago, ACH primero con el ahorro de Q334.45.
   Paga con ACH; vuelves con el recibo y la campana baja en uno.
3. **Cursos → Paradigmas → Actividades → Ejercicio de llaves:** rúbrica antes de entregar; sube cualquier `.zip`
   y aparece el recibo con su huella SHA-256.
4. **Notas:** abre Discreta y mueve el simulador "¿Qué nota necesito?".
5. **Rol Auxiliar → Por calificar → Actividad 6:** califica con `j`/`k` y Enter; bajo 61 pide justificación;
   publica (o revisa antes en **Publicar notas**).
6. **Rol Maestro → Apelaciones:** responde, escala o resuelve; **Estadísticas** y **Auditoría** muestran el efecto.
7. **Rol Administrativo → Políticas:** cambia el umbral y la comisión de tarjeta y míralo en Notas y Pagos;
   **Pagos → Caja, Conciliación, Reembolsos**; **Roles** otorga a un Auxiliar cerrar la nota final de una sección.

Más variantes de Hoy reiniciando con otra hora o día:

```bash
MIU_NOW=2026-10-22T20:15:00-06:00 npm run dev
```

(noche: "lo que hiciste hoy" y "mañana"; con `2026-10-26T07:30:00-06:00`, semana de exámenes).

## Qué es mock y qué es real

Todo dato es **ficticio** y la fecha de la demo es fija: **jueves 22 de octubre de 2026, 07:42**
(`HOY` en `src/lib/clock.ts`). Cada puerto tiene adaptador `mock` y `real`; el real todavía responde
"no disponible" con el nombre del sistema que falta.

| Puerto                                                             | Hoy                                                             | Se conecta a (ver [`INTEGRACIONES_PENDIENTES.md`](docs/INTEGRACIONES_PENDIENTES.md)) |
| ------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `IdentityPort`                                                     | mock en memoria                                                 | Google OIDC @ufm.edu, proveedor de correo, WebAuthn                                  |
| `AcademicPort`, `AssessmentPort`, `CurriculumPort`                 | mock sobre `src/mock/seed/`                                     | API o CDC de MiU                                                                     |
| `InboxPort`                                                        | proyección sobre los demás puertos                              | read model propio                                                                    |
| `LedgerPort` / `SolvencyPort`                                      | mock (cargos, caja, reembolsos)                                 | sistema financiero UFM                                                               |
| `PaymentProviderPort`                                              | Recurrente simulado (checkout local, webhook firmado, extracto) | Recurrente sandbox; Stripe vacío                                                     |
| `PolicyPort`                                                       | mock (umbral, metas, comisión, otorgamientos)                   | reglamento académico y administración de roles                                       |
| `ConferencePort`, `EnrollmentPort`, `DocumentsPort`                | mock                                                            | catálogo de conferencias, calendario de asignación, emisión de documentos            |
| `AccountPort`, `MessagingPort`, `SupportChatPort`, `DirectoryPort` | mock                                                            | perfil de MiU, mensajería de la UFM, proveedor de chat, directorio                   |
| `StoragePort`                                                      | memoria, SHA-256, escaneo simulado                              | almacenamiento S3 compatible                                                         |
| `AuditPort`                                                        | memoria, solo agrega                                            | tabla de auditoría                                                                   |

Se elige con `MIU_ADAPTER_<PUERTO>=mock|real` (por ejemplo `MIU_ADAPTER_LEDGER=real`).

Supuestos sin confirmar con la UFM (marcados `[S]` en los documentos): umbral de justificación 61, metas 71/80/90,
comisión de tarjeta (4.5% + Q2) como costo de quien paga, bancos del checkout ACH, cierre de nota final solo del
Maestro (o el Auxiliar al que el Administrativo se lo otorgue) y semana de exámenes del 26 al 30 de octubre.

## La demo en Vercel (serverless)

Vercel atiende cada petición desde una instancia que puede ser nueva, así que la demo no depende de la memoria del
servidor: la sesión viaja en una cookie firmada (HMAC-SHA256), el código de entrada, el enlace y los códigos de
verificación se derivan del secreto, y todo lo demás sale del seed determinista de cada petición.

Variables de entorno (Project → Settings → Environment Variables, en Production y Preview):

| Variable                    | Valor                                                          | Para qué                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MIU_SESSION_SECRET`        | una cadena larga y aleatoria, p. ej. `openssl rand -base64 32` | **Obligatoria en la práctica.** Firma la cookie de sesión y deriva los códigos. Sin ella se usa un secreto incluido en el código: la demo funciona, pero cualquiera podría fabricar una sesión |
| `MIU_DEV_TOOLS`             | `1`                                                            | Muestra el código de entrada en pantalla (no hay correo real) y el selector de rol. Sin ella no hay forma de entrar con correo; el botón de Google del mock sí entra como Ana                  |
| `RECURRENTE_WEBHOOK_SECRET` | opcional                                                       | Secreto del webhook simulado de Recurrente; sin ella usa uno de demostración                                                                                                                   |
| `MIU_NOW`                   | opcional                                                       | Otro momento de los mismos datos (`2026-10-22T20:15:00-06:00` para la noche)                                                                                                                   |

No hace falta nada más: `NODE_ENV`, el HTTPS y la cookie `secure` los resuelve Vercel. Todos los adaptadores son `mock` por defecto.

**Qué persiste y qué no:** la sesión, el rol activo y los códigos sobreviven a cualquier instancia. Lo que la demo _cambia_
(entregar una tarea, calificar, pagar, reembolsar, cambiar una política) vive en la memoria de la instancia que lo atendió:
se ve mientras esa instancia siga viva y puede reiniciarse. Para que persista entre instancias haría falta un almacén
externo (por ejemplo Upstash Redis o Vercel KV), que no está agregado. Revocar un dispositivo o cerrar sesión funciona en
la instancia que lo atiende; en otra, la cookie anterior seguiría valiendo hasta que venza.

Se prueba con `next build && next start` y `npm run e2e -- serverless`: `POST /api/dev/cold-start` (solo con
`MIU_DEV_TOOLS=1`) olvida la memoria de los mocks, como una instancia nueva, y los flujos tienen que seguir funcionando.

## App instalable

En el build de producción (`npm run build && npm start`) MiU se puede instalar y, sin conexión, muestra una página propia.
El service worker guarda solo archivos estáticos: nunca páginas ni respuestas, porque llevan notas, pagos y mensajes.
En desarrollo no se registra.

## Calidad

```bash
npm run check
```

Lint, tipos, formato y pruebas unitarias (Vitest).

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm run e2e
```

E2E con Playwright en claro, oscuro y móvil, con axe (WCAG 2.2 AA) sobre todas las pantallas de cada rol, un recorrido con teclado, revisión de CSP y la medición de LCP e INP. Usa un Chromium local (aquí
Brave) en lugar de descargar el de Playwright. Levanta dos servidores: uno con herramientas de demo (3100) y uno
como producción (3101).

Capturas de entrega por rol (claro, oscuro y móvil):

```bash
CAPTURE=entrega PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm run e2e -- capture-screens --workers=1
```

En desarrollo, la cookie `miu-falla=<puerto>:<error>` (por ejemplo `assessment:timeout`) muestra los estados de
error y de tiempo agotado en las pantallas reales.

## Documentos

- [Recorrido de la demo con capturas](docs/entrega/RECORRIDO.md)
- [Plan de la Fase 1](docs/PLAN_FASE1.md) · [Backlog de cierre](docs/BACKLOG_CIERRE.md)
- [Decisiones técnicas](docs/DECISIONES.md) · [Integraciones pendientes](docs/INTEGRACIONES_PENDIENTES.md)
- Reportes por etapa en [`docs/etapas/`](docs/etapas/)
