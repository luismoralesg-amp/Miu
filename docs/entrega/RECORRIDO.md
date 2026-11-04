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
| 10 | **Recibos:** número, método, total con comisión y estado; descarga | [recibos](capturas/estudiante/recibos-light.png) |
| 11 | **Pensum e Historial:** prerrequisitos al seleccionar, colores por área; períodos con promedio y una sola búsqueda | [pensum](capturas/estudiante/pensum-light.png) · [historial](capturas/estudiante/historial-light.png) |
| 12 | **Conferencias, Asignación y Documentos:** reservar y evaluar; elegir cursos con choques detectados; solicitar un documento | [conferencias](capturas/estudiante/conferencias-light.png) · [reservas](capturas/estudiante/mis-reservas-light.png) · [asignación](capturas/estudiante/asignacion-light.png) · [documentos](capturas/estudiante/documentos-light.png) |
| 13 | **Cuenta, Mensajes y Soporte:** CUI enmascarado con código para verlo; conversación con la cátedra; chat con tu identidad ya cargada | [cuenta](capturas/estudiante/cuenta-light.png) · [mensajes](capturas/estudiante/comunicacion-light.png) · [soporte](capturas/estudiante/soporte-light.png) |
| 14 | **Servicios y Recursos:** trámites con sus pasos; directorio desde 3 letras | [servicios](capturas/estudiante/servicios-light.png) · [directorio](capturas/estudiante/directorio-light.png) |

## Auxiliar · Carlos Méndez (`carlos.mendez.demo@ufm.edu`)

| Paso | Qué mostrar | Captura |
|---|---|---|
| 1 | **Hoy:** lo que espera nota primero (del cierre más antiguo), su día y sus dos secciones | [hoy](capturas/auxiliar/hoy-light.png) |
| 2 | **Por calificar:** la cola de sus secciones (solo las asignadas) | [cola](capturas/auxiliar/por-calificar-light.png) |
| 3 | **Lote · Actividad 6: closures:** `j`/`k` para moverse, Enter guarda y salta; bajo 61 la justificación es obligatoria; publicar deja rastro en la auditoría | [lote](capturas/auxiliar/lote-light.png) · [móvil](capturas/auxiliar/lote-mobile.png) |
| 4 | **Publicar notas:** lo guardado sin publicar, su promedio y quién está bajo el umbral, antes de publicar | [publicar](capturas/auxiliar/publicar-light.png) |
| 5 | **Apelaciones y estadísticas:** responde o escala; no puede resolver ni cerrar la nota final (salvo que el Administrativo se lo otorgue por sección) | [apelaciones](capturas/auxiliar/apelaciones-light.png) · [estadísticas](capturas/auxiliar/estadisticas-light.png) |

## Maestro · Jorge Castillo (`jorge.castillo.demo@ufm.edu`)

| Paso | Qué mostrar | Captura |
|---|---|---|
| 1 | **Hoy:** Tarea 4 de Discreta A por calificar, sus secciones con su auxiliar y la apelación por responder | [hoy](capturas/maestro/hoy-light.png) |
| 2 | **Mis secciones, sección y libro de notas:** promedio, lo pendiente, estudiantes con carné enmascarado y notas bajo 61 marcadas también en texto | [secciones](capturas/maestro/secciones-light.png) · [sección](capturas/maestro/seccion-light.png) · [libro](capturas/maestro/libro-light.png) |
| 3 | **Por calificar** y el lote de su sección | [cola](capturas/maestro/por-calificar-light.png) · [lote](capturas/maestro/lote-light.png) |
| 4 | **Publicar y cerrar:** revisión antes de publicar; la nota final solo se cierra sin nada pendiente y con confirmación de lo que no ocurrió | [publicar](capturas/maestro/publicar-light.png) · [cierre](capturas/maestro/cierre-light.png) |
| 5 | **Apelaciones:** responder, escalar o resolver (mantener o cambiar la nota) | [apelaciones](capturas/maestro/apelaciones-light.png) |
| 6 | **Estadísticas y auditoría:** reparto de notas por umbral y metas; cada nota, publicación y decisión con quién la hizo | [estadísticas](capturas/maestro/estadisticas-light.png) · [auditoría](capturas/maestro/auditoria-light.png) |

## Administrativo · Rodrigo Ajú (`rodrigo.aju.demo@ufm.edu`)

| Paso | Qué mostrar | Captura |
|---|---|---|
| 1 | **Hoy y Bandeja:** la cola de comprobantes con el total por revisar | [hoy](capturas/administrativo/hoy-light.png) · [bandeja](capturas/administrativo/bandeja-light.png) |
| 2 | **Pagos, en cuatro pestañas:** aprobar o rechazar comprobantes; cobrar en caja por carné; conciliar con Recurrente; reembolsar (nunca quien aprobó el pago) | [comprobantes](capturas/administrativo/comprobantes-light.png) · [caja](capturas/administrativo/caja-light.png) · [conciliación](capturas/administrativo/conciliacion-light.png) · [reembolsos](capturas/administrativo/reembolsos-light.png) |
| 3 | **Políticas y Roles:** umbral, metas y comisión de tarjeta con su efecto en vivo; matriz de permisos y quién puede cerrar la nota final de cada sección | [políticas](capturas/administrativo/politicas-light.png) · [roles](capturas/administrativo/roles-light.png) |
| 4 | **Apelaciones escaladas, estadísticas y auditoría:** decide lo que los equipos docentes pasaron; totales por sección; todo el registro | [apelaciones](capturas/administrativo/apelaciones-light.png) · [estadísticas](capturas/administrativo/estadisticas-light.png) · [auditoría](capturas/administrativo/auditoria-light.png) |

## Instalada y sin conexión

MiU se puede instalar como app (manifest e íconos del escudo oficial). Sin internet muestra una página propia y no guarda
notas, pagos ni mensajes en el dispositivo: [sin conexión](../etapas/E12/sin-conexion-light.png).

## Qué es mock

Todo. Las personas, las notas, los pagos y el extracto de Recurrente son ficticios; cada puerto tiene su adaptador `real`
vacío (`docs/INTEGRACIONES_PENDIENTES.md`). Ninguna sección dice "se construye en la etapa…".
