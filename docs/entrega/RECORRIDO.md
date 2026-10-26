# Recorrido de la demo · MiU Nuevo

Fecha de la demo: **jueves 22 de octubre de 2026, 07:42** (fija). Datos ficticios. Cada captura existe en claro,
oscuro y móvil (`-light`, `-dark`, `-mobile`) en [`capturas/`](capturas/). Se regeneran con
`CAPTURE=entrega npm run e2e -- capture-screens --workers=1` (ver el [README](../../README.md)).

## Estudiante · Ana López (`ana.lopez.demo@ufm.edu`)

| Paso | Qué mostrar | Captura |
|---|---|---|
| 1 | **Hoy:** un solo foco (Parcial 2 de Discreta, mañana 07:00, cuenta regresiva en rojo por faltar menos de 24 h), el día en un eje real con la clase en curso, por entregar y novedades con el color de cada curso | [hoy](capturas/estudiante/hoy-light.png) · [móvil](capturas/estudiante/hoy-mobile.png) |
| 2 | **Bandeja:** pagos, por hacer y avisos en una lista; la campana muestra exactamente cuántos hay | [bandeja](capturas/estudiante/bandeja-light.png) |
| 3 | **Cursos:** tabla con nota actual y próxima entrega; busca "etica" sin tilde | [cursos](capturas/estudiante/cursos-light.png) |
| 4 | **Curso:** línea de tiempo; lo importante primero (nota, próxima actividad, último anuncio); 14 subsecciones con URL propia | [curso](capturas/estudiante/curso-light.png) |
| 5 | **Actividad:** rúbrica antes de entregar; al subir un archivo, recibo con huella SHA-256 y `.ics` | [actividad](capturas/estudiante/actividad-light.png) |
| 6 | **Semana y Horario:** carga por día; clases en un eje de horas; exportar a calendario e imprimir | [semana](capturas/estudiante/semana-light.png) · [horario](capturas/estudiante/horario-light.png) |
| 7 | **Notas:** promedio 84.9 (+1.1) y tendencia; cada curso se abre con su detalle y el simulador | [notas](capturas/estudiante/notas-light.png) |
| 8 | **Pagos:** Q7,387.80; ACH primero sin comisión; con tarjeta Q7,722.25 (comisión Q334.45 a cargo de quien paga [S]); pago en 2 pasos | [pagos](capturas/estudiante/pagos-light.png) · [pagar](capturas/estudiante/pagar-light.png) · [estado de cuenta](capturas/estudiante/estado-de-cuenta-light.png) |
| 9 | **⌘K:** "pagar" + Enter lleva al cargo; también encuentra cursos, actividades y personas | [⌘K](../etapas/E4/cmdk-light.png) |

## Auxiliar · Carlos Méndez (`carlos.mendez.demo@ufm.edu`)

| Paso | Qué mostrar | Captura |
|---|---|---|
| 1 | **Hoy:** lo que espera nota primero (del cierre más antiguo), su día y sus dos secciones | [hoy](capturas/auxiliar/hoy-light.png) |
| 2 | **Por calificar:** la cola de sus secciones (solo las asignadas) | [cola](capturas/auxiliar/por-calificar-light.png) |
| 3 | **Lote · Actividad 6: closures:** `j`/`k` para moverse, Enter guarda y salta; bajo 61 la justificación es obligatoria; publicar deja rastro en la auditoría | [lote](capturas/auxiliar/lote-light.png) · [móvil](capturas/auxiliar/lote-mobile.png) |

## Maestro · Jorge Castillo (`jorge.castillo.demo@ufm.edu`)

| Paso | Qué mostrar | Captura |
|---|---|---|
| 1 | **Hoy:** Tarea 4 de Discreta A por calificar, sus secciones con su auxiliar y la apelación por responder | [hoy](capturas/maestro/hoy-light.png) |
| 2 | **Por calificar** y el lote de su sección | [cola](capturas/maestro/por-calificar-light.png) · [lote](capturas/maestro/lote-light.png) |

## Administrativo · Rodrigo Ajú (`rodrigo.aju.demo@ufm.edu`)

| Paso | Qué mostrar | Captura |
|---|---|---|
| 1 | **Hoy:** la cola de comprobantes con el total por revisar | [hoy](capturas/administrativo/hoy-light.png) |
| 2 | **Bandeja:** cada comprobante como pendiente | [bandeja](capturas/administrativo/bandeja-light.png) |

## Lo que aún dice "se construye en la etapa…"

Las secciones del backlog P2 (pensum, historial, conferencias, asignación, documentos, cuenta, comunicación, soporte,
servicios, cátedra del Maestro, administración) ya tienen su URL, aparecen en "Más" y en ⌘K, y explican en qué
etapa llegan. Ninguna da error ni 404.
