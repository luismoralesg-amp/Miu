# Backlog de cierre · MiU Nuevo (Fase 1, front end con mocks)

- Creado: 2026-10-25 · Fuente: `docs/PLAN_FASE1.md` §5 y §8, `docs/etapas/E2/REPORTE.md`, `docs/diseno/ronda3/`.
- Estado al crear: rama `Master`, árbol limpio, 18 commits por delante de `origin/Master`, último `a61a4ff`.
  E0, E1, ronda 3.1 y E2 están commiteados; el reporte de E2 dice 176/176 unitarias y 54/54 E2E.
  `src/modules/` solo tiene `identity`; no existe `src/authz/`.
- Cómo se usa: el agente toma el **primer `[ ]`** de arriba hacia abajo. Un ítem = un commit convencional.
  Al terminarlo: `[x]`, hash corto y una línea de reporte. Si se bloquea: `[!]`, motivo, y sigue con el siguiente.
- Pruebas: **U** = Vitest, **E** = Playwright (claro, oscuro, móvil y axe), **C** = captura en `docs/etapas/<E>/` con revisión impeccable.
  En todo ítem además: `npm run check` verde.
- `[S]` = supuesto que no consta en los documentos. Se usa el valor mock y se anota en `INTEGRACIONES_PENDIENTES.md`.
- Diseño: P1 Editorial (Fraunces, lienzo cálido, reglas finas, punto de color por curso). Fecha mock única: constante HOY (jueves 22-oct-2026).

Formato de reporte por ítem: `→ hash · qué quedó · pruebas (U n/n, E n/n) · supuestos nuevos`.

---

## P0 · Verificar y cerrar E2

- [x] **P0-1 · Verificar la base verde.** Correr `npm run check`, `npm run build` y `npm run e2e`.
  - Terminado: los tres en verde, con los conteos anotados aquí. Si algo falla, el arreglo es este mismo commit (`fix:`).
  - Pruebas: U, E, build.
  - → 1b9ede4 · base verde sin cambios de código · U 176/176, E 54/54 (Brave), build sin errores (13 rutas) · sin supuestos nuevos
- [x] **P0-2 · Cerrar pendientes de E2.** Comprobar contra PLAN §8 E2 y el reporte: login, ⌘K, avisos, dispositivos, "Más" y selector de rol solo en dev.
  Verificar que el selector no aparece con `npm run build && npm start` sin `MIU_DEV_TOOLS`.
  - Terminado: E2E que confirma que no hay selector de rol en producción; lista de huecos de E2 vacía o convertida en ítems nuevos abajo.
  - Pruebas: E.
  - → 71600b0 · Playwright levanta un segundo `next start` (puerto 3101) sin `MIU_DEV_TOOLS`; `production.spec.ts` comprueba que no hay selector de rol, ni buzón de códigos, y que `/dev/sistema` da 404 · E 3/3 · Huecos de E2 contra PLAN §8: ninguno nuevo. Login, ⌘K, avisos, dispositivos y "Más" están cubiertos; Google y passkey siguen simulados (ya documentado en E2) y "Hoy" placeholder es P1-6 · sin supuestos nuevos

## P1 · Base de datos mock y pantallas núcleo

- [x] **P1-1 · E3a · `Result`, `PortError` y la selección de adaptador.** `src/lib/result.ts`, timeout ≤ 10 s con `AbortSignal`, y `MIU_ADAPTER_<PUERTO>=mock|real` (PLAN §6).
  - Terminado: helper probado, incluido el timeout que devuelve `timeout`.
  - Pruebas: U.
  - → cad7fd9 · `PortError`, `withTimeout` (≤ 10 s, cancela con `AbortSignal`), `guarded` por adaptador, `unwrap` y `selectAdapter` (`src/lib/adapters.ts`); `IdentityPort` ya se elige así · U 186/186 (10 nuevas) · sin supuestos nuevos
- [x] **P1-2 · E3b · Seed determinista.** `src/mock/seed/`: estudiante ficticia de Computación, 1 maestro, 2 auxiliares, 1 administrativo (PLAN §7), con cursos, colores, actividades, notas, horario y cargos. Nadie real.
  - Terminado: el seed es igual en cada corrida (snapshot) y las fechas son relativas a HOY.
  - Pruebas: U.
  - → 224ac36 · `src/mock/seed/` con personas (Ana, Jorge, Carlos y Sofía, Rodrigo y 56 compañeros ficticios), 4 cursos y 5 secciones, 28 actividades con rúbricas, notas que reproducen los promedios de ronda 3, lote de la Actividad 6, apelaciones, cargos, pagos y cola de transferencias; `at(días, hora)` ancla todo en `HOY` (`src/lib/clock.ts`); Sofía Ramírez entra como segundo auxiliar con acceso · U 193/193 (7 nuevas, incluida la instantánea) · [S] facultades, salones y bibliografía de ejemplo; semana de exámenes del 26 al 30 de octubre
- [x] **P1-3 · E3c · `authz`.** `src/authz/` con `Permission`, `Scope` y la tabla `(rol, permiso, ámbito)` según la matriz de `FUNCIONES_NUEVAS_Y_PAGOS.md` §3. `close_final_grade` solo para Maestro por defecto [S].
  - Terminado: cada celda de la matriz es un caso de prueba; las rutas y acciones consultan `can()`.
  - Pruebas: U (tabla completa).
  - → 5de2082 · `src/authz/` con 28 permisos, 5 ámbitos, condiciones (`escalated_appeal`, `before_close`) y otorgamientos por sección; `can()` con y sin recurso, `requirePermission()` para rutas (404 si el rol no tiene acceso) y `SECTION_PERMISSIONS` en la navegación; las secciones aún pendientes ya consultan `can()` · U 318/318 (125 nuevas: 112 celdas de la matriz, ámbito y navegación) · [S] `close_final_grade` solo del Maestro; nuevo permiso `view_academic_record` (registro propio del Estudiante, implícito en §3)
- [x] **P1-4 · E3d · Puertos académicos con mock.** `AcademicPort`, `AssessmentPort`, `CurriculumPort` e `InboxPort`, cada uno con adaptador mock y real vacío (el real devuelve `unavailable`).
  - Terminado: contratos con zod; la regla ESLint `no-restricted-imports` impide importar el dominio de otro módulo.
  - Pruebas: U por método.
  - → fb2fe68 · cuatro módulos (`academic`, `assessment`, `curriculum`, `inbox`) con dominio zod, reglas puras (promedios, meta necesaria, justificación, prerrequisitos, orden de la bandeja), mock sobre el seed con estado por `userId` y real `notConnected()`; `Actor` y `requireActor()`; pensum de 40 cursos e historial de 4 períodos en el seed; regla ESLint verificada con un import prohibido · U 358/358 (40 nuevas) · [S] pensum de ejemplo (códigos, UMA y prerrequisitos)
- [x] **P1-5 · E3e · Puertos financieros con mock.** `LedgerPort`/`SolvencyPort` y `PaymentProviderPort` (`quote`, `createCheckout`, `handleWebhook` con firma e idempotencia). Recurrente queda en mock; Stripe vacío.
  - Terminado: `quote` devuelve ACH sin comisión y tarjeta o Apple Pay a 4.5% + Q2 como costo del pagador [S, pendiente de la UFM]; el webhook repetido no duplica el cargo.
  - Pruebas: U.
  - → a76e4fd · módulos `finance` (`LedgerPort` + `SolvencyPort`: saldo, cargos, recibos, estado de cuenta con saldo arrastrado, transferencias con comprobante y su cola) y `payments` (`routeByCost`, checkout alojado simulado, webhook HMAC-SHA256 con comparación en tiempo constante e idempotencia, reembolso solo del Administrativo); Recurrente real y Stripe vacíos; ruta `POST /api/webhooks/recurrente`; la bandeja ya suma cargos pendientes y comprobantes por revisar · U 377/377 (19 nuevas) · [S] comisión como costo del pagador (configurable), bancos ACH
- [x] **P1-6 · E4a · Hoy.** `/` con datos reales del seed según `docs/diseno/ronda3` (p1, hoy-noche, hoy-examenes): lo urgente primero y el punto de color por curso.
  - Terminado: sin placeholder; hay estados de carga, vacío, error y timeout (`AsyncBoundary`).
  - Pruebas: U de la consulta "urgente primero", E, C (claro, oscuro y móvil).
  - → ede5435 · `/` con datos de los puertos: héroe con cuenta regresiva (urgente < 24 h en rojo, normal < 72 h, "Nada urgente" después), tu día en eje real con la línea de "ahora" que avanza, por entregar (ventana de 14 días, igual que la Bandeja) y novedades; variantes de noche (≥ 18 h) y de semana de exámenes; Hoy de Maestro/Auxiliar (lo que espera nota primero) y del Administrativo (comprobantes); `AsyncBoundary`, `PortProblem` (timeout, error, sin acceso, no encontrado) y falla simulada por cookie `miu-falla` solo en desarrollo · U 385/385 (8 nuevas), E 69/69 (12 nuevas: contenido, timeout con reintento, error por sección, rol docente, axe y CSP) · C `docs/etapas/E4/hoy*`, revisadas con impeccable (corregido: rejilla de exámenes con celda vacía, "mañana" en un examen de hoy, ancho de por entregar de noche, horas libres partidas en móvil, "llegó el 14 de octubre") · sin supuestos nuevos
- [x] **P1-7 · E4b · Bandeja.** `/bandeja` con pendientes, avisos y pagos.
  - Terminado: el badge y la lista salen del mismo read model.
  - Pruebas: U y E de que el badge es igual al número de ítems de la lista; C.
  - → 21fe474 · `/bandeja` con pagos, por hacer y avisos, filtros como enlaces y "marcar como leído" en formularios sin JavaScript; la campana del shell lee la misma bandeja (se retiró la lista de avisos aparte) y "Bandeja" entra en "Más"; un mapa único de íconos para Hoy, Bandeja y campana; reporte `docs/etapas/E4/REPORTE.md` · U 386/386, E 9 nuevas (3 por proyecto) · C `docs/etapas/E4/bandeja*`, `campana-*` · sin supuestos nuevos
- [x] **P1-8 · E5a · Cursos.** `/cursos`: tabla con búsqueda y orden, agrupada por facultad y período.
  - Pruebas: U del filtro, E de búsqueda, C.
  - → de9d93e · tabla con nota actual (sobre lo evaluado) y próxima entrega; búsqueda sin tildes ni mayúsculas, "sección B" como filtro de sección; orden por nombre, nota, próxima entrega o créditos; búsqueda y orden en la URL (`?q=`, `?orden=`); filas enteras clicables; lista en móvil; estado vacío con "Limpiar búsqueda"; `requirePermission("view_course")` · U 390/390 (4 nuevas), E 3/3 · C `docs/etapas/E5/cursos*` (corregido: columnas desalineadas entre grupos, título de grupo partido en móvil) · sin supuestos nuevos
- [x] **P1-9 · E5b · Curso con línea de tiempo.** `/cursos/[cursoId]` según `curso-linea-de-tiempo.html`: próxima actividad, nota actual y último anuncio.
  - Pruebas: E, C.
  - → ebf86ae · `/cursos/[cursoId]`: hilo de color, sección y horario; línea de tiempo con notas publicadas, documentos, anuncios, la clase de hoy y lo que viene (exámenes y entregas, en línea punteada), filtros sin animación y lo anterior plegado; a la derecha (arriba en móvil) nota actual, próxima actividad, último anuncio, catedrático, auxiliar y programa; las 14 subsecciones como pestañas-URL (`RouteTabs` con pestañas atenuadas para lo no habilitado y borde que se desvanece al desplazar) · U 393/393 (3 nuevas), E en `curso.spec.ts` · C `docs/etapas/E5/curso-*` (corregido: línea vertical cortada, pestañas cortadas en seco, datos al final en móvil) · sin supuestos nuevos
- [x] **P1-10 · E5c · Subsecciones del curso.** Cada subsección de PLAN §5 tiene su URL. El estado vacío distingue "sin contenido" de "no habilitado".
  - Pruebas: E que recorre las URLs; C de una subsección con contenido y de una vacía.
  - → a148a9c · `/cursos/[cursoId]/[sub]` valida el nombre contra el contrato (lo demás es 404 real) y muestra cada subsección: actividades por estado, notas del curso, exámenes, actividad reciente (14 días), anuncios y programa como lectura, documentos con descarga (`/api/documentos/[id]`, solo con sesión), personas con enlace a Mensajes y enlaces externos marcados; "no habilitada" (ojo tachado, gris) y "vacía" (texto propio por subsección) se ven y se leen distinto · E 6/6 (recorre las 14 URLs, ambos estados con axe, descarga, 404) · C `docs/etapas/E5/curso-actividades|documentos|vacio|no-habilitado-*` · sin supuestos nuevos
- [x] **P1-11 · E5d · Actividad y entrega.** `/cursos/[cursoId]/actividades/[actividadId]` con la rúbrica visible antes de entregar, recibo con hash y un `.ics` (`StoragePort` mock).
  - Terminado: se puede entregar y aparece el recibo.
  - Pruebas: U del hash, E "ver y entregar tarea" (PLAN §8 E5), C.
  - → df9d2fe · detalle con descripción, formato, política de atraso y rúbrica antes de entregar; entrega por archivo (soltar o elegir, nombre y tamaño visibles), texto (con conteo y mínimo) o repositorio (https); `StoragePort` mock (huella SHA-256, escaneo, bloqueo de ejecutables) y recibo con hora y huella copiable; "Reemplazar entrega" hasta la fecha límite; nota y comentario cuando está calificada; `.ics` con recordatorio (`/api/ics/actividad/[id]`) y generador ICS propio; `subjectFor()` para que la acción consulte `can("submit")` · U 402/402 (9 nuevas: SHA-256 con vectores FIPS, reglas de subida, EICAR, ICS), E 6/6 (entregar, ejecutable rechazado, huella en el recibo, campana baja en 1, `.ics`, texto con mínimo) · C `docs/etapas/E5/actividad*` (corregido: recibo al final en móvil) · sin supuestos nuevos
- [x] **P1-12 · E6a · Notas.** `/notas` con todas las notas del período y el perfil académico (promedio y tendencia). Usa la tarjeta expandible de ronda 3. Umbral 61 y metas 71/80/90 [S].
  - Pruebas: U del cálculo del promedio, E "consultar notas" (PLAN §8 E6), C.
  - → e7b15d4 · `/notas`: promedio 84.9 con su cambio (+1.1) y tendencia por semestre (una serie en tinta, capa de hover y tabla equivalente para lectores, según la skill dataviz); tarjeta expandible por curso (transición `grid-template-rows` interrumpible, Escape cierra y devuelve el foco, panel `inert` cerrado) con barra obtenido/perdido/por evaluar (textura para lo pendiente), lo que pide cada meta, detalle de notas y simulador "¿Qué nota necesito?"; `?curso=` abre el curso indicado · U 412/412 (4 nuevas: perfil, barra que suma 100, metas, simulador), E 6/6 · C `docs/etapas/E6/notas-*` (corregido: detalle apretado y columna de fecha oculta) · [S] umbral 61 y metas 71/80/90, rotulados en pantalla como valores de ejemplo
- [x] **P1-13 · E6b · Horario y Semana.** `/horario` con eje temporal real y clase actual destacada; vista Semana según `semana.html` (leyenda "libre" coherente, sin hueco al pie); exportar a ICS e imprimir.
  - Pruebas: U del generador ICS, E, C.
  - → 31651e4 · `/semana` según `semana.html` (lunes a domingo, carga libre/ligera/media/pesada con leyenda que incluye "Libre", hoy marcado, examen con contorno, sin hueco al pie) y `/horario` con eje de horas real de 07:00 a 18:00, clase en curso con borde doble, línea de "ahora" detrás de los bloques y lista por día en móvil; ambas con "Exportar a mi calendario" (`/api/ics/horario`: una regla semanal por sección hasta fin de semestre más los exámenes con aviso) e "Imprimir" (estilos de impresión sin barra ni navegación) · U 411/411 (5 nuevas: semana, carga, bloques, ICS del horario), E 6/6 · C `docs/etapas/E6/semana-*`, `horario-*` (corregido: la línea de "ahora" tachaba la clase en curso, días desalineados, hoy sin margen en móvil) · sin supuestos nuevos
- [x] **P1-14 · E7a · Pagos: ver y pagar.** `/pagos`, `/pagos/pagar/[cargoId]`: pago en 2 pasos, ACH primero con el ahorro visible. Con tarjeta: comisión como costo del pagador (ejemplo de la maqueta: Q334.45, total Q7,722.25). Checkout y webhook de Recurrente en mock. Bancos ACH [S].
  - Pruebas: U del ruteo por costo, E "pagar y consultar" (PLAN §8 E7), C.
  - → a284fad · `/pagos` según `pagos.html` (lo que debes con desglose, ACH primero con sus tres pasos, tarjeta con comisión Q334.45 y total Q7,722.25, "otras formas de pagar", historial con descarga de recibo); `/pagos/pagar/[cargoId]` paso 1 (métodos por costo con "Ahorras Q334.45", resumen, transferencia con comprobante) y paso 2 en el checkout simulado de Recurrente; `/pagos/pagar/[cargoId]/listo` con recibo y solvencia; `getPolicy()` en el puerto de pagos; `/api/recibos/[id]`; `Button pill` · U 412/412, E 12/12 (ACH de punta a punta con campana que baja, tarjeta con comisión, comprobante en revisión, webhook sin firma = 401) · C `docs/etapas/E7/pagos|pagar*` (corregido: campana sin actualizar tras pagar, botones píldora que salían cuadrados) · [S] comisión como costo del pagador, bancos ACH
- [x] **P1-15 · E7b · Recibos y estado de cuenta.** `/pagos/recibos`, `/pagos/estado-de-cuenta` con fechas por defecto del período; transferencia con comprobante y pago presencial.
  - Pruebas: E, C.
  - → 67f49f4 · `/pagos/recibos` (número, concepto, método, total con comisión, estado y descarga); `/pagos/estado-de-cuenta` con el semestre hasta hoy por defecto, `max` en hoy (una fecha futura se recorta), rango invertido rechazado, saldo inicial y final, imprimir; transferencia con comprobante (P1-14) y pago en caja con la referencia; tablas desplazables enfocables con teclado · E 9/9 · C `docs/etapas/E7/recibos-*`, `estado-de-cuenta-*` (corregido: axe `scrollable-region-focusable` en móvil, también en Notas y en el curso) · sin supuestos nuevos
- [x] **P1-16 · E10a · Auxiliar: calificar por lote.** `/catedra/por-calificar` según `auxiliar-lote.html`. La justificación se exige solo bajo el umbral (61 [S]); cada calificación queda en auditoría (`AuditPort` mock).
  - Terminado: el Auxiliar solo ve sus secciones (authz).
  - Pruebas: U de la regla de justificación, E de calificar un lote como Auxiliar, C.
  - → 00b3757 · `/catedra/por-calificar`: cola de las secciones propias (Maestro o Auxiliar) y el lote según `auxiliar-lote.html`: carné enmascarado, entrega atrasada marcada, `j`/`k` para moverse, dígitos para la nota, Enter guarda y salta a la siguiente sin nota, justificación que aparece y se exige solo bajo 61, barra fija con resumen (notas, promedio, bajo el umbral) y "Publicar N notas"; en móvil, tarjetas con "Guardar"; cada nota y cada publicación quedan en `AuditPort` (módulo nuevo, solo agrega); las acciones consultan `can("grade"|"publish_grades")` con sección y curso y el puerto vuelve a verificar la asignación · U 414/414 (2 nuevas de auditoría; la regla de justificación ya estaba en `assessment.test.ts`), E 5/5 (+1 omitida en móvil: el flujo de teclado) · C `docs/etapas/E10/por-calificar-*`, `lote-*` (corregido: el teclado enfocaba la vista móvil oculta) · [S] umbral 61
- [x] **P1-17 · ⌘K conectado a datos.** El buscador encuentra cursos, actividades, cargos y personas del seed, filtrado por rol; sus acciones llevan a las pantallas reales.
  - Pruebas: U del índice por rol, E solo con teclado (abrir un curso y pagar un cargo), C.
  - → 9abd0c9 · el índice de ⌘K se arma en el servidor desde los mismos puertos que las pantallas (`src/shell/load-commands.ts`) y por rol (`buildCommandIndex`): Estudiante encuentra cursos, actividades, cargos (grupo nuevo "Pagos") y catedráticos o auxiliares; Maestro y Auxiliar, sus secciones, la cola y sus estudiantes con carné enmascarado; Administrativo, la cola de comprobantes; todas las acciones llevan a la pantalla real (pagar → `/pagos/pagar/[cargo]`, entregar → la actividad); se retiró `src/mock/academic.ts` y `src/shell/data.ts` · U 417/417 (3 nuevas: un índice por rol, sin fugas entre roles), E 26/26 en `cmdk` + `auth` (solo teclado: abrir Discreta y pagar la cuota de punta a punta) · C `docs/etapas/E4/cmdk-*`, `cmdk-auxiliar-*` · sin supuestos nuevos

## P2 · Resto de E3 a E12 (PLAN_FASE1 §5 y §8)

- [x] **P2-1 · E6c · Pensum.** `/pensum`: grafo con prerrequisitos al seleccionar y colores por área. Pruebas: U de prerrequisitos, E, C.
  - → 6aeda6d · columnas por semestre con el semestre actual marcado, punto de color por área con leyenda, estado de cada curso (aprobado con nota, en curso, disponible, bloqueado con candado); al seleccionar se marca toda la cadena de requisitos (borde) y lo que abre (borde punteado), se dibujan las aristas directas (SVG medido tras el layout y en cada cambio de tamaño) y se anuncia el detalle; avance de cursos y UMA arriba; lista por semestre en móvil · U 420/420 (2 nuevas; las reglas de prerrequisitos ya estaban en `curriculum.test.ts`), E 3/3 · C `docs/etapas/E6/pensum-*` (corregido: nodos apretados con código y UMA partidos) · [S] pensum de ejemplo
- [x] **P2-2 · E6d · Historial.** `/historial` agrupado por período, con búsqueda global. Pruebas: E, C.
  - → a7b91c7 (+ ace482c, 83c804b: nota visible en móvil) · períodos del más reciente al más antiguo con promedio y UMA de cada uno; una sola búsqueda (nombre, código, período o nota, sin tildes) en lugar de los siete filtros de MiU; tablas desplazables enfocables; enlace al período actual en Cursos · U 422/422 (2 nuevas), E 3/3 · C `docs/etapas/E6/historial-*` · sin supuestos nuevos
- [x] **P2-3 · E7c · Cola de pagos del Administrativo.** Aprobar transferencias. Pruebas: U de permisos, E, C.
  - → 7b85a76 · `/admin/pagos`: comprobantes por revisar (los más antiguos primero, total a revisar) y revisados; aprobar en un clic, rechazar pide el motivo que verá la estudiante; `?transferencia=` destaca uno (desde ⌘K y la bandeja); cada decisión queda en `AuditPort`; aprobar liquida el pago en la sesión de la estudiante y la deja solvente · U 423/423 (1 nueva de permisos), E 6/6 (comprobante enviado en una sesión y aprobado en otra; rechazo sin motivo bloqueado; estudiante y Maestro reciben 404) · C `docs/etapas/E11/admin-pagos-*` · sin supuestos nuevos
- [x] **P2-4 · E8a · Conferencias.** `/conferencias`, `/conferencias/mis-reservas`, `/conferencias/[id]/evaluacion`, con estados reservada, en espera y expirada (`ConferencePort` mock). Pruebas: U de estados, E de reservar y evaluar, C.
  - → c188b47 · módulo `conferences` (estados disponible, llena, reservada, en espera con puesto, por evaluar, evaluada, expirada; reserva que pasa a lista de espera si está llena; evaluación una sola vez y dentro de 7 días); `/conferencias` con búsqueda, `/conferencias/mis-reservas` agrupada (por evaluar, próximas, anteriores) y `/conferencias/[id]/evaluacion` con cinco opciones rotuladas y comentario; formularios que funcionan sin JavaScript · U 427/427 (4 nuevas), E 24/24 con `auth` · C `docs/etapas/E8/conferencias|mis-reservas|evaluacion-*` · [S] ventana de evaluación de 7 días, salones y ponentes de ejemplo
- [x] **P2-5 · E8b · Asignación.** `/asignacion`: ventana de preferencias, resolución por lote, step-up y nada de pop-ups (`EnrollmentPort` mock). Pruebas: U, E, C.
  - → (este commit) · módulo `enrollment` (ventana 2027-1 con estado, oferta según lo que el pensum habilita, dos secciones por curso, choques de horario, límite de UMA, código de un solo uso para guardar y para botar); `/asignacion` en una sola página: elegir cursos, 1.ª y 2.ª opción de sección, resumen fijo con UMA y choques en vivo, step-up en línea; "Botar un curso" con lo que significa y su código; resolución por lote explicada · U 435/435 (4 nuevas), E 3/3 (choque detectado y resuelto, código incorrecto rechazado, guardar y botar) · C `docs/etapas/E8/asignacion-*` · [S] límite de 24 UMA, fechas de la ventana
- [ ] **P2-6 · E8c · Documentos.** `/documentos` con búsqueda y rango del período (`DocumentsPort` mock). Pruebas: E, C.
- [ ] **P2-7 · E9a · Cuenta.** `/cuenta/{informacion,privacidad,accesos,archivos}`: CUI y fecha enmascarados (`MaskedField`) y edición con step-up. Pruebas: U de la máscara, E, C.
- [ ] **P2-8 · E9b · Comunicación.** `/comunicacion`: mensajes dentro de la app (`MessagingPort`/`Fce2Port` mock). Pruebas: E de enviar un mensaje, C.
- [ ] **P2-9 · E9c · Soporte.** `/soporte`: FAQ y chat con contexto prellenado (`SupportChatPort` mock). Pruebas: E, C.
- [ ] **P2-10 · E9d · Servicios y recursos.** `/servicios`, `/recursos/{directorio,oficinas,eventos,marca,chatgpt-edu}`; los enlaces externos van marcados. El directorio pide al menos 3 caracteres (`DirectoryPort`). Pruebas: U, E, C.
- [ ] **P2-11 · E10b · Cátedra del Maestro.** `/catedra`, `/catedra/secciones/[seccionId]`, `/catedra/libro/[seccionId]`. Pruebas: E con el rol Maestro, C.
- [ ] **P2-12 · E10c · Publicar y cerrar.** `/catedra/publicar`, `/catedra/cierre`. `close_final_grade` solo para el Maestro [S]. Pruebas: U de permisos, E, C.
- [ ] **P2-13 · E10d · Apelaciones, auditoría y estadísticas de cátedra.** Pruebas: E, C.
- [ ] **P2-14 · E11a · Administración: políticas y roles.** `/admin/{politicas,roles}`, con políticas configurables (umbral, comisiones). Pruebas: U, E, C.
- [ ] **P2-15 · E11b · Administración: pagos, conciliación, caja y reembolsos.** Pruebas: U de conciliación, E, C.
- [ ] **P2-16 · E11c · Administración: auditoría, apelaciones y estadísticas.** Pruebas: E, C.
- [ ] **P2-17 · E12a · PWA.** Manifest y service worker propio, sin CDN. Pruebas: E de que el manifest y el SW están registrados.
- [ ] **P2-18 · E12b · Rendimiento.** Medir LCP e INP en Hoy, Cursos y Pagos con el build de producción. Terminado: los valores quedan en el reporte (las metas son [S] si el plan no las fija). Pruebas: medición en Playwright.
- [ ] **P2-19 · E12c · Accesibilidad.** axe en todas las rutas y un recorrido solo con teclado de los flujos núcleo. Terminado: 0 violaciones AA. Pruebas: E.

## P3 · Entrega (formato [S]: repo local y demo con `npm run dev`; sin push ni deploy)

- [ ] **P3-1 · Capturas por rol.** *(Avance 26-oct para la demo: `CAPTURE=entrega` genera 60 capturas de las pantallas construidas en `docs/entrega/capturas/<rol>/`, revisadas con impeccable; recorrido en `docs/entrega/RECORRIDO.md`. Se regenera al cerrar P2.)* `docs/entrega/capturas/<rol>/<pantalla>-{light,dark,mobile}.png` para Estudiante, Maestro, Auxiliar y Administrativo, generadas con un script (`CAPTURE=entrega`). Terminado: impeccable revisó cada captura.
- [ ] **P3-2 · README de la demo.** *(Avance 26-oct: README reescrito con requisitos, entrar por rol, selector de rol, recorrido, mock/real, check, E2E con Brave y capturas. Falta la prueba desde un clon limpio.)* `README.md`: requisitos (Node 24.22.1 con nvm), `npm i`, `npm run dev`, cómo cambiar de rol (`MIU_DEV_TOOLS`), usuarios mock, qué es mock y qué es real, `npm run check` y `npm run e2e`. Prueba: seguir el README desde un clon limpio en una carpeta temporal y comprobar que funciona.
- [ ] **P3-3 · DECISIONES e INTEGRACIONES_PENDIENTES al día.** Una fila por puerto en INTEGRACIONES (PLAN §6) y todos los `[S]` de este backlog. Prueba: revisión con grep de que cada puerto en `src/modules/*/ports` tiene su fila.
- [ ] **P3-4 · Reporte de cierre.** `docs/etapas/E12/REPORTE.md` (máximo 40 líneas): qué está hecho, pruebas totales, métricas, supuestos, riesgos e ítems `[!]`. Prueba: `npm run check`, `npm run build` y `npm run e2e` verdes en la misma corrida.

---

## Supuestos `[S]` de este backlog
1. Formato de entrega: repo local, demo con `npm run dev`, capturas por rol y docs. No está confirmado por Luis.
2. Umbral 61 y metas 71/80/90 (vienen de la ronda 3, sin validar con la UFM).
3. Comisión de tarjeta como costo del pagador (pendiente de la UFM).
4. Lista de bancos ACH de Recurrente.
5. `close_final_grade` solo para el Maestro por defecto (PLAN §7).
6. Semana de exámenes y foto del campus (ronda 3).
7. Metas de LCP e INP, si el plan no las fija.

## Bloqueos `[!]`
(ninguno todavía)
