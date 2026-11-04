# Reporte de cierre · MiU Nuevo (Fase 1, front end con mocks)

Fecha de la demo: jueves 22-oct-2026 07:42 (fija). Todo dato es ficticio, detrás de un puerto con `mock` y `real` vacío.

## Qué está hecho
- Backlog completo: P0 (2), P1 (17), P2 (19) y P3 (4). **Ningún ítem `[!]`** y ninguna sección dice «se construye en la etapa…».
- Cuatro roles con sus pantallas: Estudiante (Hoy, Bandeja, Cursos y sus 14 subsecciones, actividad y entrega, Notas, Pensum,
  Historial, Horario, Semana, Pagos, Conferencias, Asignación, Documentos, Cuenta, Mensajes, Soporte, Servicios, Recursos);
  Maestro y Auxiliar (cátedra, lote, publicar, cierre de nota final, apelaciones, estadísticas, auditoría);
  Administrativo (comprobantes, caja, conciliación, reembolsos, políticas, roles, apelaciones escaladas, estadísticas, auditoría).
- 18 puertos con adaptador mock y real vacío; `authz` con la matriz completa; CSP con nonce; app instalable sin guardar datos personales.

## Pruebas (una sola pasada, 2026-11-04)
- `npm run check` (lint, tipos, formato, Vitest): **477/477** unitarias en 37 archivos.
- `npm run build`: sin errores, 73 rutas.
- `npm run e2e` (Brave, claro, oscuro y móvil): **254 pasan, 31 omitidas a propósito** (flujos de teclado en móvil y
  mediciones de un solo perfil), 0 fallan, 10.3 min.
- Accesibilidad: axe WCAG 2.2 AA sobre todas las pantallas de cada rol (salen de la tabla `NAV`), en los tres perfiles: 0 violaciones;
  recorrido con teclado con foco visible en cada parada (halló y se corrigió el foco de las filas de Cursos). Sin violaciones de CSP.

## Métricas (build de producción, CPU 4× más lenta, 4G de 1.6 Mbps y 150 ms; metas LCP < 2.5 s, INP < 200 ms)
- Aislado: Hoy 260 ms / 96 ms · Cursos 372 ms / 80–96 ms · Pagos 284 ms / 56 ms (LCP / INP).
- Con los 285 E2E corriendo a la vez: Hoy 380 / 96 · Cursos 320 / 80 · Pagos 624 / **176**: dentro de la meta, pero el INP de Pagos
  se acerca al techo cuando la máquina está cargada.
- Son cifras con datos mock y servidor local: un techo para el front end, no para un backend real.

## Supuestos `[S]` abiertos (todos en `docs/INTEGRACIONES_PENDIENTES.md`)
Umbral 61 y metas 71/80/90 (ahora editables); comisión de tarjeta 4.5 % + Q2 a cargo de quien paga; bancos ACH de Recurrente;
cierre de nota final solo del Maestro (o del Auxiliar al que se le otorgue) y sin nada pendiente; «dos personas» en reembolsos
= quien aprobó no reembolsa; semana de exámenes; pensum, servicios, directorio, conferencias y licencia de ChatGPT Edu de ejemplo.

## Riesgos
- **Nada es real todavía:** identidad (Google/passkey), finanzas, Recurrente, almacenamiento y auditoría están simulados.
- La política y las apelaciones de las cuentas de prueba son por cuenta; las de las cuentas demo, compartidas (propio del mock).
- Cambiar una nota por apelación se audita pero no recalcula el libro en el mock.
- El extracto de Recurrente es de ejemplo y la caja del mock solo conoce a la estudiante demo.
- Un clon nuevo instala con `npm ci`; aquí se probó sin red (caché de npm). Hay avisos moderados de `minimatch` por ESLint (solo desarrollo).

Decisiones en `docs/DECISIONES.md`; 159 capturas por rol y recorrido en `docs/entrega/`. Sin push, PR ni deploy.
