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

| Rol            | Correo de demo                                                | Qué ver primero                                        |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| Estudiante     | `ana.lopez.demo@ufm.edu`                                      | Hoy, Cursos, una actividad para entregar, Notas, Pagos |
| Maestro        | `jorge.castillo.demo@ufm.edu`                                 | Hoy (lo que espera nota), Por calificar                |
| Auxiliar       | `carlos.mendez.demo@ufm.edu` (o `sofia.ramirez.demo@ufm.edu`) | Por calificar → Actividad 6: closures                  |
| Administrativo | `rodrigo.aju.demo@ufm.edu`                                    | Hoy (cola de comprobantes)                             |

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
   publica.

Más variantes de Hoy reiniciando con otra hora o día:

```bash
MIU_NOW=2026-10-22T20:15:00-06:00 npm run dev
```

(noche: "lo que hiciste hoy" y "mañana"; con `2026-10-26T07:30:00-06:00`, semana de exámenes).

## Qué es mock y qué es real

Todo dato es **ficticio** y la fecha de la demo es fija: **jueves 22 de octubre de 2026, 07:42**
(`HOY` en `src/lib/clock.ts`). Cada puerto tiene adaptador `mock` y `real`; el real todavía responde
"no disponible" con el nombre del sistema que falta.

| Puerto                                             | Hoy                                                   | Se conecta a (ver [`INTEGRACIONES_PENDIENTES.md`](docs/INTEGRACIONES_PENDIENTES.md)) |
| -------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `IdentityPort`                                     | mock en memoria                                       | Google OIDC @ufm.edu, proveedor de correo, WebAuthn                                  |
| `AcademicPort`, `AssessmentPort`, `CurriculumPort` | mock sobre `src/mock/seed/`                           | API o CDC de MiU                                                                     |
| `InboxPort`                                        | proyección sobre los demás puertos                    | read model propio                                                                    |
| `LedgerPort` / `SolvencyPort`                      | mock                                                  | sistema financiero UFM                                                               |
| `PaymentProviderPort`                              | Recurrente simulado (checkout local, webhook firmado) | Recurrente sandbox; Stripe vacío                                                     |
| `StoragePort`                                      | memoria, SHA-256, escaneo simulado                    | almacenamiento S3 compatible                                                         |
| `AuditPort`                                        | memoria, solo agrega                                  | tabla de auditoría                                                                   |

Se elige con `MIU_ADAPTER_<PUERTO>=mock|real` (por ejemplo `MIU_ADAPTER_LEDGER=real`).

Supuestos sin confirmar con la UFM (marcados `[S]` en los documentos): umbral de justificación 61, metas 71/80/90,
comisión de tarjeta (4.5% + Q2) como costo de quien paga, bancos del checkout ACH, cierre de nota final solo del
Maestro y semana de exámenes del 26 al 30 de octubre.

## Calidad

```bash
npm run check
```

Lint, tipos, formato y pruebas unitarias (Vitest).

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm run e2e
```

E2E con Playwright en claro, oscuro y móvil, con axe (WCAG 2.2 AA) y revisión de CSP. Usa un Chromium local (aquí
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
