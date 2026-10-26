# Reporte de etapa E5 · Cursos, curso, subsecciones y entrega

Fecha: 2026-10-25 · Datos: seed determinista detrás de `AcademicPort`, `AssessmentPort` y `StoragePort`.

## Qué se construyó

- **`/cursos`**: tabla agrupada por facultad y período con nota actual (sobre lo evaluado) y próxima entrega.
  Búsqueda sin tildes ni mayúsculas ("sección B" filtra la sección), orden por nombre, nota, próxima entrega o
  créditos, ambos en la URL. Filas enteras clicables; lista en móvil.
- **`/cursos/[cursoId]`**: línea de tiempo (notas publicadas, documentos, anuncios, la clase de hoy y lo que viene),
  filtros y lo anterior plegado; lo importante primero (nota, próxima actividad, último anuncio, personas, programa).
- **14 subsecciones con URL propia**. "No habilitada" y "vacía" se distinguen en ícono, tono y texto.
- **Actividad y entrega**: rúbrica antes de entregar; archivo, texto o repositorio; huella SHA-256 y escaneo en
  `StoragePort`; recibo copiable; reemplazo hasta la fecha límite; `.ics` con recordatorio.

## Capturas

`cursos`, `cursos-busqueda`, `curso`, `curso-actividades`, `curso-documentos`, `curso-vacio`, `curso-no-habilitado`,
`actividad`, `actividad-recibo` y `actividad-calificada`, en claro, oscuro y móvil
(`CAPTURE=E5 npm run e2e -- capture-screens --workers=1`).

## Pruebas

| Tipo | Resultado |
|---|---|
| Unitarias | Filtro y orden de cursos, línea de tiempo y filtros, SHA-256 (vectores FIPS 180-2), reglas de subida y EICAR, generador ICS (escape, plegado a 75 octetos, CRLF, RRULE, alarma) |
| E2E | Búsqueda y orden en la URL; curso y filtros; las 14 URLs, vacío y no habilitado con axe; descarga; 404; "ver y entregar tarea" con recibo, huella y campana; texto con mínimo |

## Skills

| Skill | Uso |
|---|---|
| find-skills | Patrón nuevo (ICS): sin skill específica; se siguió RFC 5545 directamente y se probó |
| apple-design | Un foco por pantalla: la próxima entrega en el curso; la caja de entrega en la actividad; en móvil, lo que vuelves a ver (recibo, nota, datos del curso) va primero |
| emil-design-eng | Filtros y pestañas sin animación (uso frecuente); la caja de archivo responde al arrastrar con un cambio de borde inmediato; el botón presiona a 0.97 |
| impeccable | Corregido: columnas desalineadas entre grupos, título de grupo partido en móvil, línea de tiempo cortada, pestañas cortadas en seco, datos del curso y recibo al final en móvil |
