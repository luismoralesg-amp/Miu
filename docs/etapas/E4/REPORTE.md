# Reporte de etapa E4 · Hoy y Bandeja

Fecha: 2026-10-25 · Datos: seed determinista (HOY = jueves 22-oct-2026, 07:42) detrás de los puertos.

## Qué se construyó

- **Hoy (`/`)** con datos reales de `AcademicPort`, `AssessmentPort`, `InboxPort` y `LedgerPort`:
  - un solo foco: el examen o la entrega más próximos en 72 h, con cuenta regresiva (rojo si faltan menos de 24 h);
  - "Tu día" sobre un eje de horas real, con la clase en curso marcada y la línea de "ahora" que avanza sola;
  - por entregar (ventana de 14 días, la misma de la Bandeja) y novedades con el punto de color del curso;
  - variante de noche (≥ 18 h: lo que hiciste hoy y mañana) y de semana de exámenes (calendario y horas libres);
  - Hoy de Maestro/Auxiliar (lo que espera nota, del cierre más antiguo al más reciente) y del Administrativo
    (cola de comprobantes).
- **Bandeja (`/bandeja`)**: pagos, por hacer y avisos en una lista; filtros como enlaces (`?tipo=`); marcar como
  leído con formularios que funcionan sin JavaScript. **La campana es una ventana a la misma lista**: su número es
  el largo de la bandeja y baja junto con ella.
- **Estados**: `AsyncBoundary` (esqueleto con la forma de la página), `PortProblem` (timeout, error, sin acceso, no
  encontrado, con reintento por `router.refresh`) y `error.tsx` para lo que se lance. En desarrollo, la cookie
  `miu-falla=<puerto>:<error>` provoca cada estado en la pantalla real.

## Capturas

`hoy`, `hoy-noche`, `hoy-examenes`, `hoy-auxiliar`, `hoy-maestro`, `hoy-administrativo`, `bandeja`,
`bandeja-auxiliar` y `campana`, en `-light`, `-dark` y `-mobile`. Se regeneran con
`CAPTURE=E4 npm run e2e -- capture-screens --workers=2`; las variantes de noche y exámenes, con `MIU_NOW`.

## Pruebas

| Tipo | Resultado |
|---|---|
| Unitarias | "Urgente primero", estados del héroe (24 h / 72 h), eje del día y huecos, variantes, horas libres, campana = largo de la bandeja antes y después de leer |
| E2E | Hoy con contenido, timeout con reintento, error solo en su sección, foco docente, campana = filas de la Bandeja, filtros, marcar todo como leído; axe AA y sin violaciones de CSP en claro, oscuro y móvil |

## Skills

| Skill | Uso |
|---|---|
| find-skills | No hizo falta: el patrón (lista + badge de un mismo read model) es propio del proyecto |
| apple-design | Un foco por pantalla (héroe o cola); jerarquía por tamaño (Fraunces solo en títulos y cifras); en móvil el eje se vuelve lista |
| emil-design-eng | El minuto de la cuenta regresiva cambia sin animar; la línea de "ahora" se desliza en 60 s lineal con `transform` y salta con reduced motion; filtros y marcar leído sin animación (uso frecuente); entrada escalonada solo al cargar |
| impeccable | Corregido tras revisar capturas: rejilla de exámenes con celda vacía, "mañana" en un examen de hoy, ancho de "por entregar" de noche, horas libres partidas en móvil, "llegó el 14 de octubre", íconos distintos para lo mismo en Hoy y la Bandeja, "hace 2 h" partido. Detector mecánico sin hallazgos |
