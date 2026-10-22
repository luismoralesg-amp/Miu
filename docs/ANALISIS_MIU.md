# Análisis técnico profundo de MiU (UFM) — base para una nueva versión

- Fecha: 2026-10-21 (America/Guatemala, UTC-6)
- Autor: AlphaGod · Para: Luis A. P. Morales Girón
- Propósito: **base técnica (ciencias de la computación)** para que Claude Code construya
  después una versión mejor. **Sin propuestas de UI/estética/UX** (eso va después) y **sin
  código**. Proyecto **personal e independiente**; **sin evasión de autenticación**: lo observado
  fue con la sesión legítima de Luis, en modo lectura.
- Fuentes propias: `rea_y_publico.md` (pistas públicas vía curl) y dos recorridos observados en
  navegador (capturas 01–58 en `/workspace/miu_analisis/capturas/`).

> **Regla de todo el documento:** nunca inventar. Cada afirmación lleva etiqueta de evidencia:
> **(Observado)** visto en este recorrido/capturas o en cabeceras curl · **(Documentado)**
> evidencia previa documentada o fichas públicas (Play/App Store, soporte.ufm.edu) ·
> **(Inferido)** deducción razonable · **(No verificado)** hipótesis pendiente, no usar como hecho.

---

## 1. Resumen ejecutivo — top 12 hallazgos

1. **Rendimiento muy pobre e intermitente.** La vista principal (`cursos_actuales`) tarda
   60 s–>2 min y llena filas una a una; en el 1.º recorrido varias pestañas terminaron en
   `ERR_TIMED_OUT`, recarga completa o UI congelada. En el 2.º recorrido esas mismas vistas sí
   cargaron, confirmando intermitencia, no imposibilidad. *(Observado)*
2. **No es un solo sistema: es un mosaico de aplicaciones acopladas.** MiU (PHP) delega en al
   menos: `fce2.ufm.edu` (ASP.NET, `.aspx`, solo-campus) para Herramientas de comunicación y
   Evaluación de conferencias; Google (OAuth "Syllabus UFM", Drive, UFMail/Calendar); un chat de
   `vm.providesupport.com`; `soporte.ufm.edu`; ChatGPT Edu; EBSCO. *(Observado)*
3. **Problemas de seguridad concretos.** El formulario de Evaluación de conferencias se sirve por
   **HTTP plano** (Chrome avisa "información no segura"); el enlace de Herramientas de
   comunicación muere con `ERR_CONNECTION_CLOSED` (host solo-campus); "Programa del curso" lanza
   **consentimiento OAuth de Google** inesperado; el chat es un **proveedor externo**. *(Observado)*
4. **Exposición de PII.** "Mi información" muestra **CUI ([CUI censurado]) y fecha de nacimiento
   ([fecha censurada]) en texto plano**, dirección completa y correo. "Profesores y alumnos" lista a
   **todos los compañeros con foto y nombre**. *(Observado)*
5. **Arquitectura legada:** monolito PHP/Apache, charset **ISO-8859-1**, sesión `PHPSESSID`,
   **jQuery + Bootstrap 3**, páginas por archivo y contenido por AJAX (`fntLoadTabContent`).
   *(Observado/Documentado)*
6. **AJAX sin manejo de errores:** overlay "CARGANDO" sin timeout, sin reintento, sin mensaje de
   error; cuando falla, la UI queda colgada. El primer clic tras cerrar un modal suele ignorarse.
   *(Observado)*
7. **Inconsistencias de datos y de estados-vacíos.** En el 1.º recorrido Pendientes mostraba
   badge "1" con contenido vacío **sin mensaje**. Varias vistas sí muestran "No existe información
   asociada" o "Su búsqueda no obtuvo resultados"; otras (Foro) quedan en blanco. Falta un
   patrón único. *(Observado)*
8. **Sin deep links reales.** Las 10 pestañas y las sub-pestañas del detalle son tabs Bootstrap
   in-page (hash `#contentTab...`); el detalle de curso abre a veces en pestaña nueva; la URL no
   identifica la función. *(Observado)*
9. **Fechas por defecto inconsistentes y a veces en el futuro.** Estado de cuenta/Recibos usan
   fecha fin **05/11/2026 (futura)**; Documentos académicos 01/01/2025–hoy; Mis conferencias
   desde 2022. No hay criterio común. *(Observado)*
10. **Mucho ruido no académico y enlaces rotos.** Carrusel publicitario lateral constante,
    imágenes "Imagen ausente", Google+ muerto, enlaces `http://`, banner de Google Translate,
    chat flotante omnipresente. *(Observado)*
11. **Hay joyas funcionales fuertes.** El **Mapa de Cursos** (pensum visual con UMA, prerrequisitos,
    requisitos de inglés/conferencias, cursos excluidos), el **Horario semanal**, el **Cuadro de
    notas con ponderaciones**, y **Pagos** (saldo, solvencia, detalle, flujo de pago) son
    completos y valiosos. *(Observado)*
12. **Sin búsqueda/orden/filtro transversal.** Cada vista reimplementa su propio filtro por
    fechas; no hay búsqueda global ni ordenamiento de tablas. *(Observado)*

---

## 2. Metodología y nivel de evidencia

Dos recorridos de lectura con sesión legítima + inspección pública sin login (curl). **No** se
intentó iniciar sesión por medios automatizados ni evadir controles; "Programa del curso" y la
Evaluación de conferencias se dejaron en la pantalla de consentimiento/aviso **sin continuar**.
El 1.º recorrido encontró muchas vistas caídas por rendimiento; el 2.º las alcanzó, por lo que
varios ítems antes **No verificados** ahora son **Observados**. Las etiquetas de evidencia están
definidas en el encabezado.

---

## 3. Arquitectura inferida

- **Servidor:** **PHP sobre Apache** (`Server: Apache`, `PHPSESSID`, `.php`). *(Observado)*
- **Rendering:** server-side; página por archivo `.php`; dentro de cada página el contenido de la
  pestaña se inyecta por **AJAX** (`fntLoadTabContent('<nombre>')`) bajo overlay "CARGANDO" sin
  timeout/retry/error. *(Observado)*
- **Mapa de endpoints observados** (todos en `miu.ufm.edu` salvo nota):
  - `mis_cursos.php?typeContent=cursos_actuales | cursos_anteriores | evaluacion_conferencias`
  - `mis_cursos_detalle.php?Tipo=<hash>&Anterior=<hash>` (detalle de curso; IDs son hashes opacos)
  - `mis_cursos_conferencias_detalle.php` (Reservar / Mis conferencias)
  - `mapa_cursos.php?pensum=3072` (Mapa de Cursos / pensum)
  - `cuenta.php?typeContent=info` (Mi cuenta)
  - `recursos.php?typeContent=logotipo` (Recursos: directorios, eventos, etc.)
  - `pagos_ncc.php`, `estado_cuenta_ncc.php`, `recibos_ncc.php` (Pagos; sufijo "ncc")
  - **Externos:** `fce2.ufm.edu/MIFCE/...LoginFCE.aspx` y `fce2.ufm.edu/pa/EvaluacionConferencia.aspx`
    (**ASP.NET**, otro stack, solo-campus, el form va por **HTTP**); `accounts.google.com`
    (OAuth "Syllabus UFM", `client_id` visible); `vm.providesupport.com/ufmmiu` (chat);
    `soporte.ufm.edu` (soporte). *(Observado)*
- **Sesión:** `PHPSESSID`; expiración → página "Sesión Expirada" (modal Bootstrap + `undoCountdown`)
  → `index.php`. *(Observado, también por curl en `rea_y_publico.md`)*
- **Encoding:** **ISO-8859-1 (latin-1)** declarado. Señal de base de código antigua. *(Observado)*
- **Dependencias front-end (locales, no CDN):** `libraries/jquery/...`, `libraries/bootstrap/...`
  (**Bootstrap 3**), `libraries/undoCountdown/...`. Integraciones de **Google Translate**,
  **Google OAuth/Drive**, **providesupport** (chat). *(Observado)*
- **Cabeceras de seguridad (miu.ufm.edu):** presentes `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`; **CSP no observada en MiU** (sí en www.ufm.edu). La
  Evaluación de conferencias en HTTP plano es una **falla confirmada** del subsistema fce2.
  *(Observado la presente / ausencia de CSP: **No verificado**, confirmar con barrido)*
- **IDs opacos:** el detalle de curso usa hashes (`Tipo`, `Anterior`) en lugar de ids legibles;
  bueno contra enumeración, malo para deep links. *(Observado)*

> **No verificado (no inventar):** versión de PHP, framework interno, motor de BD, si existe una
> API JSON reutilizable, causa raíz de la lentitud (consultas N+1 vs. render síncrono),
> arquitectura de despliegue.

---

## 4. Inventario de funciones

Cada una: qué hace · flujo · datos/entidades · fortalezas · debilidades · severidad · qué
mantener · evidencia.

### 4.1 Cabecera global
- **Qué hace:** logo MiU/UFM, "Soporte MiU", PDF Duolingo, redes (LinkedIn, Facebook, Twitter/X,
  **Google+ muerto**, YouTube, Pinterest), icono de chat, nombre + carné ([carné censurado]) + foto, **Salir**. *(Observado)*
- **Debilidades:** enlaces muertos/`http://`, ruido no académico. **Severidad P2.**
- **Mantener:** identidad de usuario y Salir siempre visibles. *(Observado)*

### 4.2 Menú de 10 pestañas (hub `mis_cursos.php`)
- **Qué hace:** Regresar, toggle, y 10 tabs: Cursos actuales, Pendientes (badge), Consultar mi
  horario, Cursos anteriores, Evaluación conferencias, Asignar/Botar cursos, ¿Cómo voy en mi
  pensum?, Documentos académicos, Herramientas de comunicación, Conferencias. Checkbox "Al iniciar
  sesión, dirigirme directamente a mis cursos actuales". *(Observado)*
- **Debilidades:** sin deep links; AJAX sin manejo de error; primer clic ignorado; badge
  inconsistente. **Severidad P0.**
- **Mantener:** hub académico unificado + preferencia de inicio. *(Observado)*

### 4.3 Cursos actuales
- **Qué hace:** tabla Código, Curso, Sección, Evaluaciones, Nota, Rol, agrupada por **facultad y
  período** (ej. "202636 - Tech Workshops"; "LCCECO 202602"). Modal bloqueante "Hay evaluaciones
  pendientes..." al entrar; icono rojo "no contestadas"/lápiz en Evaluaciones; Nota "---". *(Observado)*
- **Debilidades:** lentitud extrema; sin búsqueda/orden/filtro; nombres de curso no enlazados en
  accesibilidad; iconos sin etiqueta; modal bloqueante. **Severidad P0 + P1.**
- **Mantener:** columnas y agrupación facultad+período. *(Observado)*

### 4.4 Pendientes
- **Qué hace:** agregado de actividades por entregar de todos los cursos. *(Documentado)*
- **Flujo:** en el 1.º recorrido cargó vacío sin mensaje pese a badge "1". **Severidad P0**
  (consistencia). **Mantener:** la bandeja única de pendientes. *(Observado + Documentado)*

### 4.5 Consultar mi horario
- **Qué hace:** horario semanal; etiqueta de programa, panel colapsable, columnas Lun–Sáb,
  tarjetas "Curso (sección) [hora] [salón]" (ej. Matemática Discreta (A) 07:00–08:20 [D-307]).
  Iconos de calendario por celda. *(Observado)*
- **Fortalezas:** claro y consistente, lo más sólido. **Debilidades:** sin eje temporal real
  (tarjetas de igual tamaño), talleres mensuales como semanales, sin exportar/imprimir, sin
  etiqueta de período, iconos sin label. **Severidad P1/P2.**
- **Mantener:** rejilla Lun–Sáb con curso/sección/hora/salón y programa visible. *(Observado)*

### 4.6 Cursos anteriores
- **Qué hace:** historial por períodos. Filtros: Año inicio/fin, Código curso, Nombre curso,
  Tipo de persona, Facultad, Buscar, Desplegar todo. Resultado agrupado en paneles colapsables por
  carrera+período (ej. "LCCECO 202611 (3)"), con Código, Curso, Sección, Evaluaciones (✓), Nota
  (93, 92, PASA, ---), Rol. *(Observado — antes No verificado)*
- **Fortalezas:** filtros y agrupación colapsable útiles; muestra notas finales y "PASA".
  **Debilidades:** en el 1.º recorrido no cargaba (rendimiento). **Severidad P1.**
- **Mantener:** filtros + agrupación colapsable + historial con nota. *(Observado)*

### 4.7 Detalle de curso (`mis_cursos_detalle.php`) y sus 12 sub-pestañas
Cabecera: "Paradigmas de Programación (A) - LCCECO 202602", botón "Nuevo". Sub-pestañas:
Información, Notas, Bibliografía, Foro, Profesores y alumnos, Blog, Exámenes en línea, Actividades
recientes del curso, Enlaces/Herramientas, Programa del curso, Biblioteca virtual, Recursos de IA
del curso. *(Observado)*

- **Información:** Catedrático, Auxiliar, UMA (3), Área académica ("CS Core"), Programa (icono de
  descarga), "Enviar correo", checkbox "Recibir notificaciones". **Actividad(es) (18)** con
  ponderación: **Actividades 30%, Quizzes 20%, Participación 10%, Final 40%**, y la lista de
  actividades/quizzes nombrados. **Documento(s) (3)**: tabla Orden, Título, Autor, Descripción,
  Fecha, Archivo (icono descarga + badge "Nuevo"); botón "MiU - iA"; sección **Google-Drive**
  ("Habilitar las ventanas emergentes para Google-drive"). **Anuncio(s)**. *(Observado)*
- **Notas:** "Cuadro de notas": Carné, Alumno, y columnas por componente con su % e icono "i", más
  **Total 100%** (ej. 15.00 / 8.30 / 0.00 / 0.00 → 23.30). *(Observado)*
- **Profesores y alumnos:** Catedrático/Auxiliar + **listado de compañeros con foto y nombre**,
  checkboxes, "Ver listado sin foto". **PII de terceros.** *(Observado)*
- **Actividades recientes del curso:** filtro Fecha inicio/fin + Buscar. *(Observado)*
- **Enlaces/Herramientas:** enlaces como "Control de notas del curso" con fecha. *(Observado)*
- **Programa del curso:** abre en pestaña nueva → **Google OAuth "Syllabus UFM"** (consentimiento,
  no otorgado). *(Observado)* **Severidad P1 (sorpresa de permisos).**
- **Vacías con mensaje** ("No existe información asociada"): Bibliografía, Blog, Exámenes en línea,
  Recursos de IA del curso. **Foro:** queda en blanco **sin mensaje**. *(Observado)* No distingue
  "vacío" de "no habilitado por el catedrático". **Severidad P2.**
- **Fortalezas:** reúne todo del curso (actividades con ponderación, notas, documentos, roster,
  programa, drive). **Debilidades:** apertura en pestaña nueva; OAuth sorpresa; estados-vacíos
  inconsistentes; sin deep link. **Severidad P1.**
- **Mantener:** la estructura Información(actividades+ponderación+documentos+anuncios) + Notas +
  Profesores/alumnos + Programa. *(Observado)*

### 4.8 Detalle de actividad/entrega
- **Qué hace:** Título, Descripción, Archivo, **Fecha límite de entrega, Hora, Lugar,
  Observaciones, Fecha de colocación, Permite entrega atrasada (No), Agregar tarea al calendario,
  Tarea con tiempo de vencimiento (No)**, **Última respuesta (Descargar)**, **Respuesta enviada
  (19/10/2026 20:55)**, **Nombre del archivo (Ejerciciodellaves.pdf)**, Comentario del alumno,
  **Comentario del catedrático**. *(Observado)*
- **Fortalezas:** modelo de entrega completo (límite, atrasada, archivo, calendario, feedback).
  **Debilidades:** flujo de subida no re-observado. **Severidad P1.**
- **Mantener:** el modelo de entrega íntegro. *(Observado)*

### 4.9 Evaluación conferencias
- **Qué hace:** pantalla con "Si desea ingresar a la evaluación de conferencias, haga click aquí"
  → `fce2.ufm.edu/pa/EvaluacionConferencia.aspx` servido por **HTTP plano** (Chrome: "The
  information you're about to submit is not secure"). *(Observado)* **Severidad P0 (seguridad).**
- **Mantener:** la función; **repensar** el transporte y la integración (sacar de HTTP/fce2).

### 4.10 Asignar/Botar cursos
- **Qué hace:** dos acciones con icono grande (**Asignar** / **Botar/Desasignar**); aviso "Este
  proceso utiliza ventanas emergentes"; icono PDF (instructivo). *(Observado)*
- **Debilidades:** depende de pop-ups; flujo transaccional crítico no re-observado en detalle.
  **Severidad P1 (crítico y transaccional).**
- **Mantener:** la función; **repensar** la dependencia de pop-ups. *(Observado)*

### 4.11 ¿Cómo voy en mi pensum? → Mapa de Cursos
- **Qué hace:** la pestaña lista Pénsum, Carrera y "Mostrar mapa de cursos" (icono) →
  `mapa_cursos.php?pensum=3072`. **Mapa de Cursos**: "2026CS - Lic. en Ingeniería en Ciencias de
  la Computación", **189 UMA**, cursos en **columnas por semestre** (Primer…Octavo + "Otros"),
  cada tarjeta con **UMA** y estado (✓ aprobado, candado/área), controles "Mostrar cursos",
  "Mostrar todos los requisitos", "Ocultar requisitos", "Colorizar por: Área académica/Tag",
  "Mostrar ciclos como: Filas/Columnas", selección de curso para ver **prerrequisitos**, íconos de
  **requisito de inglés** y **de conferencias** pendientes, "Carga académica semestral" por
  columna, y sección **"Cursos excluidos del pénsum"** (CONFE1 Conferencias). *(Observado — antes
  No verificado)*
- **Fortalezas:** **la función más rica**: visualización completa de avance curricular con UMA,
  prerrequisitos y requisitos. **Debilidades:** depende de Google Translate flotante; página
  separada; en el 1.º recorrido congelaba. **Severidad P1.**
- **Mantener:** el Mapa de Cursos casi íntegro (modelo de pensum/UMA/prerrequisitos/requisitos).
  *(Observado)*

### 4.12 Documentos académicos
- **Qué hace:** filtro Fecha inicio (01/01/2025) – Fecha fin (hoy) + Buscar; muestra **"Su
  búsqueda no obtuvo resultados"** (buen estado-vacío). *(Observado)*
- **Debilidades:** sólo filtro por fechas; en el 1.º recorrido congelaba. **Severidad P2.**
- **Mantener:** la función (documentos oficiales del estudiante). *(Observado)*

### 4.13 Herramientas de comunicación
- **Qué hace:** "Si desea ingresar a las herramientas de comunicación, haga click aquí" →
  `fce2.ufm.edu/MIFCE/MIFCE/LoginFCE.aspx` → **`ERR_CONNECTION_CLOSED`** (host ASP.NET
  probablemente solo-campus). *(Observado)* **Severidad P1 (no utilizable fuera de campus).**
- **Mantener:** la función (foro/blog/comunicación); **repensar** dependencia de fce2.

### 4.14 Conferencias (`mis_cursos_conferencias_detalle.php`)
- **Qué hace:** tabs **Reservar / Mis conferencias / Regresar**. *Reservar*: búsqueda (Nombre,
  Conferencista, Fecha inicio/fin) + lista de conferencias con tarjeta (título, Conferencista,
  Lugar, acciones **Reservar/Botar**, día/fecha/hora, ventana "Horario", y mensaje "Lo sentimos,
  no es posible reservar... La fecha de reserva ha expirado"). *Mis conferencias*: filtros Fecha,
  Estado ("Todos los estados"), Conferencia + Buscar. *(Observado)*
- **Debilidades:** Buscar sin feedback visible; mezcla reserva y estado. **Severidad P2.**
- **Mantener:** reserva/baja de conferencias con ventana temporal y estados. *(Observado)*

### 4.15 Tiles laterales (6 iconos) y sus flyouts
Rejilla de 6 tiles que **se reordena** (la sección actual sube a la esquina), **sin tooltips**,
abren menú al click. *(Observado)*
- **Mi cuenta:** Mi información, Opciones de privacidad, Mis accesos, Mi página, Mis archivos
  (drive), Translate.
- **Correo:** UFMail, Mail, Calendar, Mis archivos (drive) (Google Workspace).
- **Servicios:** Solicitud de documentos, Graduaciones, Examen por suficiencia, Activar parqueo,
  Chat directo, Impresiones laboratorio, Duolingo.
- **Pagos:** Saldos y pagos, Estado de cuenta, Recibos de Pago.
- **Recursos:** Directorio catedráticos y alumnos, Directorio oficinas, Descarga MiU App,
  Logotipos y fondos UFM, Manual de estilo, Fondo stillman, Eventos, ChatGPT Edu.
- **Inicio** (home). *(Observado)*
- **Debilidades:** sin tooltips/labels, reordenamiento desorienta, mezcla de destinos
  internos/externos. **Severidad P2.** **Mantener:** el acceso rápido agrupado por dominio.

### 4.16 Recursos (`recursos.php`)
- **Directorio catedráticos y alumnos:** buscar por Carné / Nombres y apellidos / Usuario (mín. 3
  caracteres). **Directorio oficinas:** tabla Nombre, Teléfono, Dirección, Email ("Enviar
  correo"). **Logotipos y fondos UFM** (descargas). **Eventos:** filtro por tipo + búsqueda.
  **ChatGPT Edu:** gestión de cuenta ("Cuenta activa", "Desactivar cuenta ChatGPT Edu" con avisos
  irreversibles). *(Observado)*
- **Severidad P2.** **Mantener:** directorios y recursos institucionales. *(Observado)*

### 4.17 Pagos (`pagos_ncc.php`, `estado_cuenta_ncc.php`, `recibos_ncc.php`)
- **Saldos y pagos:** "Resumen de saldo", tipo de cambio US$/€, **Estado: Solvente**, Saldo
  atrasado (Q0.00), Cargos de este mes (Q7,387.80), Total, **Monto variable**, Cargos futuros
  (Q7,388.00), selección por radio, **Siguiente** (→ flujo de pago); **Detalle de saldo** (Fecha
  límite, Descripción, Monto, Subtotal). **Estado de cuenta:** rango de fechas + Generar.
  **Recibos de Pago:** rango de fechas + Buscar (vacío sin mensaje). *(Observado)*
- **Fortalezas:** integra lo financiero con la solvencia; modelo de saldo/cargos/pago completo.
  **Debilidades:** datos monetarios sensibles; fecha fin por defecto **futura**; Recibos sin
  estado-vacío. **Severidad P1 (sensible).**
- **Mantener:** saldo + solvencia + detalle + flujo de pago. *(Observado)*

### 4.18 Mi cuenta (`cuenta.php?typeContent=info`)
- **Mi información:** foto, Nombre, **CUI ([CUI censurado])**, **Fecha nacimiento ([fecha censurada])**,
  Correo ([correo censurado]), Dirección completa, Teléfono ("---"), celular (vacío), Facultad,
  "¿Recibir avisos en su celular? No", Correo alternativo (vacío); **Editar/Cancelar**. Campos
  vacíos inconsistentes ("---" vs. en blanco). *(Observado)* **PII en texto plano. Severidad P1.**
- **Opciones de privacidad:** "Aparecer en el directorio general" + Correo/Dirección/Información
  adicional/Fotografía; **todas desmarcadas por defecto** (buen default de privacidad). *(Observado)*
- **Mis accesos:** "Actividad de su cuenta" por rango de fechas (buen control de seguridad del
  usuario). *(Observado)*
- **Mi página / Mis archivos (drive):** integración Google Drive. *(Observado)*
- **Mantener:** perfil editable, privacidad opt-in por defecto, bitácora de accesos. *(Observado)*

### 4.19 Chat Directo
- **Qué hace:** pop-up a **`vm.providesupport.com/ufmmiu`** (proveedor externo); lista de
  departamentos con estado online/offline (Atención al estudiante, Internet y correo, Biblioteca,
  Admisiones, MiU - portal académico, Formación continua, Pago Catedráticos - Financiero);
  **nombre NO prellenado**; campo Consulta. *(Observado)*
- **Debilidades:** tercero externo, no prellena identidad pese a sesión. **Severidad P2.**
- **Mantener:** canal de soporte por departamento. *(Observado)*

### 4.20 Soporte MiU (`soporte.ufm.edu`)
- **Qué hace:** Centro de soporte con **Buscar**, **Preguntas Frecuentes** y **Manuales**
  agrupados: "Mi cuenta MiU" (6 manuales: actividad, cambio de contraseña, archivos drive, páginas
  web en Drive, crear archivos, privacidad) y "Mis cursos MiU" (~15: actividades recientes,
  asignar/botar, asignar tarea al calendario, consulta de cursos/notas, documentos Drive,
  bibliografía, **entregar tarea verificada con Turnitin**, ingresar a clase virtual, participar
  en blog/club, **reservar/botar conferencias**, etc.). *(Documentado/Observado)*
- **Valor:** confirma funciones del dominio (Turnitin, clase virtual, blog, club). **Severidad P2.**
- **Mantener:** centro de ayuda con FAQ + manuales. *(Observado)*

### 4.21 Pagos/Notas/Solvencia y app móvil *(desde fichas públicas)*
- Cuadro de notas sujeto a solvencia; comentarios del catedrático en calificadas; chat con
  compañeros; apps nativas `com.miu.ufm` (Android) e iOS con el mismo set. *(Documentado)*
- **Mantener:** integración académico↔financiero y solvencia como gate. *(Documentado)*

---

## 5. Modelo de dominio inferido

Etiqueta por fuente; relaciones **Inferidas** salvo indicación. Validar en §10.

- **Estudiante** (nombre, **carné [carné censurado]**, **CUI [CUI censurado]**, fecha nac., foto, correo,
  dirección, programa, preferencias, correo alternativo). *(Observado)*
- **Programa/Pensum** ("2026CS", 189 UMA); un estudiante → un programa; **Pensum** = cursos
  requeridos organizados por **semestre/ciclo**, con **UMA** por curso, **prerrequisitos**,
  **requisitos** (inglés, conferencias), **Tag/Área académica**, y **cursos excluidos**. *(Observado)*
- **Facultad** agrupa cursos. **Período/Ciclo** (`202602`, `202636`, `202611`). *(Observado)*
- **Curso** (código, nombre, UMA, área "CS Core") → **Sección** (A/B/C/F, "A | SEPT"). *(Observado)*
- **Sesión de clase** (día Lun–Sáb, hora, salón) ∈ Sección. *(Observado)*
- **Inscripción** Estudiante↔Sección en Período, con **Rol** (icono "e") y **Nota**. *(Observado)*
- **Esquema de evaluación del curso**: componentes con **peso %** (Actividades, Quizzes,
  Participación, Final) que suman 100%. *(Observado)*
- **Actividad/Evaluación** (título, fecha, % / componente, estado "no contestada"). *(Observado)*
- **Entrega** (fecha/hora límite, lugar, permite atrasada, archivo subido, fecha de respuesta,
  agregar a calendario, comentario del alumno, **comentario del catedrático**). *(Observado)*
- **Cuadro de notas** (valor por componente + Total). *(Observado)*
- **Documento de curso** (Orden, Título, Autor, Descripción, Fecha, Archivo, "Nuevo"); integra
  **Google Drive**. *(Observado)*
- **Anuncio** de curso. *(Observado)*
- **Catedrático / Auxiliar** del curso; **Roster** (compañeros con foto/nombre). *(Observado)*
- **Conferencia** (título, conferencista, lugar, ventana de reserva, estado, evaluación). *(Observado)*
- **Pago/Cargo/Saldo** (saldo atrasado, cargos del mes, cargos futuros, detalle con fecha límite);
  **Solvencia** condiciona notas; **Recibo**. *(Observado)*
- **Cuenta/Perfil** (datos, privacidad opt-in, bitácora de accesos, Drive/UFMail). *(Observado)*
- **Servicios** (solicitud de documentos, graduaciones, examen por suficiencia, parqueo,
  impresiones). *(Observado)*
- **Recurso institucional** (directorios de personas/oficinas, eventos, logotipos, ChatGPT Edu). *(Observado)*

Relaciones clave: Estudiante 1–N Inscripción N–1 Sección N–1 Curso; Sección 1–N Sesión; Curso
1–1 EsquemaEvaluación 1–N Componente 1–N Actividad 1–N Entrega; Curso 1–N Documento/Anuncio; Curso
N–M Estudiante (roster); Estudiante 1–N Pago; Solvencia → gate de Nota; Pensum 1–N Curso con
prerrequisitos (grafo dirigido) y requisitos transversales.

---

## 6. Atributos de calidad

- **Rendimiento:** deficiente e intermitente (60 s–>2 min; filas incrementales). La red base no es
  el cuello (curl 0.6 s). **Peor atributo.** *(Observado/Inferido)*
- **Fiabilidad / errores:** AJAX sin timeout/retry/error; UI congelable; recargas completas; sin
  degradación elegante. **P0.** *(Observado)*
- **Disponibilidad:** intermitente; además **dependencia de hosts solo-campus** (fce2) rompe
  funciones fuera del campus. *(Observado)*
- **Seguridad/privacidad:** **(1)** formulario de evaluación de conferencias por **HTTP plano**;
  **(2)** **CUI y fecha de nacimiento en texto plano**; **(3)** **roster de compañeros con foto**;
  **(4)** **OAuth de Google inesperado** al abrir "Programa del curso"; **(5)** **chat de tercero**
  (providesupport); **(6)** CSP ausente (No verificado); **(7)** enlaces `http://`. Puntos buenos:
  privacidad **opt-in** por defecto, **bitácora de accesos**, IDs opacos. *(Observado)* **P0/P1.**
- **Accesibilidad técnica:** nombres de curso no enlazados, iconos sin label, modales bloqueantes,
  imágenes rotas. Deuda alta. *(Observado)*
- **Navegabilidad / deep links:** inexistentes (tabs por hash, detalle en pestaña nueva, IDs
  hash). **P1.** *(Observado)*
- **Mantenibilidad:** monolito PHP legado + latin-1 + mosaico de apps (PHP + ASP.NET + Google +
  terceros) sin contrato común. Difícil de evolucionar. *(Observado/Inferido)*
- **Escalabilidad:** carga incremental sugiere N+1 o render síncrono. *(Inferido — No verificado)*
- **Observabilidad:** estados silenciosos, sin progreso real. *(Observado)*
- **Internacionalización:** latin-1 + **Google Translate** en vez de i18n propia. *(Observado)*
- **Móvil / paridad app:** apps nativas con mismo set; web no evaluado en móvil. *(Documentado /
  paridad No verificada)*
- **Consistencia de datos:** badge "1" vs Pendientes vacío; estados-vacíos dispares; fechas por
  defecto incoherentes (futura, 2022, 2025). *(Observado)*

---

## 7. Lo que hay que MANTENER (priorizado)

1. **Hub académico unificado** + preferencia de inicio. *(Observado)*
2. **Mapa de Cursos / pensum** visual (UMA, semestres, prerrequisitos, requisitos, excluidos):
   la pieza de mayor valor. *(Observado)*
3. **Esquema de notas con ponderaciones** (componentes con % + Total). *(Observado)*
4. **Modelo de entrega completo** (límite, atrasada, archivo, calendario, feedback). *(Observado)*
5. **Pagos con solvencia** (saldo, cargos, detalle, flujo, recibos). *(Observado)*
6. **Horario semanal** Lun–Sáb con curso/sección/hora/salón. *(Observado)*
7. **Bandeja agregada de Pendientes** de todos los cursos. *(Documentado)*
8. **Detalle de curso** = Información(actividades+documentos+anuncios) + Notas + Profesores/alumnos
   + Programa. *(Observado)*
9. **Cursos anteriores** con filtros y agrupación colapsable e historial con nota. *(Observado)*
10. **Mi cuenta**: perfil editable, **privacidad opt-in por defecto**, **bitácora de accesos**. *(Observado)*
11. **Conferencias**: reserva/baja con ventana temporal y estados. *(Observado)*
12. **Recursos/Servicios/Soporte** institucionales (directorios, eventos, FAQ, manuales). *(Observado)*
13. **Identidad de usuario visible** + Salir. *(Observado)*

---

## 8. Lo que hay que corregir / repensar (P0–P2)

**P0 (bloqueante):**
- Rendimiento 60 s–>2 min en vistas clave → rediseñar acceso a datos y render.
- AJAX sin timeout/retry/error y UI congelable → estados y manejo de errores obligatorios.
- **Evaluación de conferencias por HTTP plano** → transporte seguro (HTTPS) obligatorio.
- Inconsistencia badge↔contenido y estados-vacíos dispares → fuente de verdad única + patrón de
  estado-vacío uniforme.

**P1 (importante):**
- **PII en texto plano** (CUI, fecha de nacimiento) y **roster con fotos** → minimizar/enmascarar
  y revisar exposición.
- **Dependencia de hosts solo-campus** (fce2, ASP.NET) que rompe funciones fuera del campus →
  integrar o reemplazar.
- **OAuth de Google sorpresa** al abrir "Programa del curso" → consentimiento explícito/previsible.
- Sin deep links / navegación por URL; detalle en pestaña nueva.
- Accesibilidad: semántica, labels, foco, sin modales bloqueantes en carga.
- Horario sin eje temporal real; talleres mensuales como semanales.
- Flujos sensibles a validar: Asignar/Botar (transaccional, pop-ups), Pagos, Entregas.
- Fechas por defecto incoherentes (futuras/antiguas).

**P2 (higiene):**
- Enlaces muertos (Google+), `http://`, imágenes rotas, ruido publicitario, chat flotante.
- i18n propia en vez de Google Translate; migrar de latin-1 a UTF-8.
- Tiles sin tooltips y con reordenamiento desorientador; iconos sin label.
- Dependencia de pop-ups (Asignar/Botar, Google Drive).

---

## 9. Requisitos técnicos derivados (no funcionales, medibles)

> **Propuestas** (a confirmar por Luis); no son datos de MiU.

- **(Propuesta)** Primer render útil de "Cursos actuales" **< 2 s** p75; cambio de pestaña **< 1 s** p75.
- **(Propuesta)** Toda llamada de datos con **timeout ≤ 10 s**, **reintento** idempotente y
  **error + reintento manual**; nunca cuelgue silencioso.
- **(Propuesta)** **Estados explícitos** cargando/vacío(con texto)/error en cada vista, unificados.
- **(Propuesta)** **Deep links** por función y por curso; estado navegable con back/forward.
- **(Propuesta)** **HTTPS de extremo a extremo**; **CSP** definida; cero formularios en HTTP.
- **(Propuesta)** **Minimización de PII**: no exponer CUI/fecha de nacimiento salvo necesidad;
  controles de visibilidad del roster.
- **(Propuesta)** **UTF-8** y **i18n propia** (ES base) sin traductor externo.
- **(Propuesta)** **Una fuente de verdad** para contadores (badges) y contenido.
- **(Propuesta)** **Accesibilidad** con metas tipo WCAG AA (a definir en fase UX).
- **(Propuesta)** **Observabilidad**: latencia por endpoint y tasa de error.
- **(Propuesta)** **Contrato de datos (API JSON)** explícito para evitar render por fila y para
  desacoplar del mosaico de sistemas (PHP/ASP.NET/Google).

---

## 10. Huecos de evidencia y cómo cerrarlos

- **No verificado aún:** interior de fce2 (Herramientas de comunicación, Evaluación de
  conferencias) por ser solo-campus/HTTP; flujo completo de Asignar/Botar y de subida de entrega;
  flujo de pago tras "Siguiente"; contenido de "Mis conferencias" con reservas; paridad móvil;
  ausencia de CSP; stack interno (PHP/BD/API) y causa raíz de la lentitud.
- **Cómo cerrarlos:**
  1. **Capturas de Luis** de los flujos faltantes (desde el campus para fce2), y un barrido de
     cabeceras (`curl -I` de varias páginas) para confirmar CSP.
  2. **Análisis estático del APK `com.miu.ufm` con REA/JADX** si Luis autoriza y lo aporta:
     revelaría **endpoints, estructura de datos y funciones** del backend **sin tocar auth**
     (ver `rea_y_publico.md`). *(Propuesta)*
  3. Revisar manuales públicos en `soporte.ufm.edu` para confirmar funciones (Turnitin, clase
     virtual, blog, club). *(Documentado)*
- **Regla:** nada No verificado se implementa como hecho; se valida primero.

---

## 11. Notas para Claude Code

- **Cómo usar este documento:** es la **base técnica** (ciencias de la computación), no un diseño.
  Respeta las etiquetas de evidencia; **no promuevas "Inferido"/"No verificado" a hecho**. Cierra
  §10 con Luis antes de construir.
- **Fases:** esto es **fase técnica**; la **creativa (UI/UX/estética)** es posterior y separada.
- **Proyecto personal/independiente, sin evasión de auth:** la ingeniería inversa se limita a
  artefactos legítimos (APK propio) y a lo que Luis ve con su sesión.
- **Skills de Senda que podrían aplicar — *(propuesta, verificar que existan y sean reutilizables)*:**
  - `impeccable` → rigor de ingeniería (tests, estados de error, consistencia, seguridad): ataca
    los **P0**. **Fase técnica.**
  - `find-skills` → descubrir qué skill aplica por tarea. **Ambas fases.**
  - `emil-design-eng`, `apple-design` → **fase creativa (UI/UX)**, NO ahora.
- **Primer entregable sugerido *(propuesta)*:** un **mapa de endpoints/contratos de datos** y un
  **plan de arquitectura** que ataque primero los P0 (rendimiento, errores, HTTPS, consistencia),
  antes de cualquier pantalla.

---

## 12. Preparación para el análisis de arquitectura (insumos que necesita la siguiente fase)

Preguntas y entradas a resolver antes de diseñar la arquitectura de la nueva versión:

1. **Alcance:** ¿la nueva versión reemplaza sólo la experiencia del **estudiante** o también roles
   de catedrático/auxiliar? ¿Incluye lo financiero y los servicios, o sólo lo académico?
2. **Datos / integración:** ¿habrá acceso a una **API/BD oficial**, o la nueva app consumirá MiU
   por scraping/puente? (Define si necesitamos el análisis del APK para inferir endpoints.)
3. **Sistemas externos:** ¿se mantienen las integraciones con **Google (OAuth/Drive/UFMail)**,
   **fce2/ASP.NET**, **Turnitin**, **providesupport**, **ChatGPT Edu**, o se reemplazan?
4. **Autenticación:** ¿SSO con Google Workspace UFM? ¿Sesión propia? (No evadir la de MiU.)
5. **Modelo de datos canónico:** confirmar entidades de §5 (especialmente pensum/UMA/prerrequisitos,
   esquema de notas ponderado, entrega, solvencia) con datos reales de Luis.
6. **No funcionales:** fijar los targets de §9 (latencia, errores, accesibilidad, i18n, seguridad)
   como requisitos medibles acordados.
7. **Privacidad/seguridad:** política de PII (CUI, fecha de nacimiento, roster), HTTPS/CSP,
   retención y bitácora.
8. **Plataformas:** ¿web responsive, PWA, o también nativo? ¿paridad con la app actual?
9. **Offline/campus:** ¿se requiere uso fuera de campus de todo (hoy fce2 rompe)?
10. **Prioridad de dominios:** ordenar qué módulos van primero (p. ej. Horario + Cursos + Notas +
    Pendientes antes que Servicios/Recursos).

> Con estas respuestas, la siguiente fase puede producir el **mapa de endpoints/contratos**, el
> **modelo de datos canónico** y el **plan de arquitectura por capas**.

---

### Anexo: capturas de referencia (`/workspace/miu_analisis/capturas/`)
01–12 (1.º recorrido): cargas lentas, modal, Pendientes vacío, horario, timeouts, UI congelada.
13–16 detalle de curso (Información/Documentos/Quizzes/Actividad/Notas) · 17–18 Cursos anteriores ·
19–27 sub-pestañas del curso (Bibliografía, Profesores/alumnos, Actividades recientes,
Enlaces/Herramientas, Programa→OAuth, Recursos IA, Foro, Blog, Exámenes en línea) · 28–30 Pensum y
Mapa de Cursos · 31–32 Documentos académicos · 33–34 Herramientas de comunicación (fce2 caído) ·
35–37 Conferencias · 38–39 Evaluación conferencias (fce2 HTTP) · 40 Asignar/Botar · 41–45 flyouts
de tiles · 46–50 Recursos · 51–53 Pagos · 54–56 Mi cuenta · 57 Chat Directo (providesupport) ·
58 Soporte (soporte.ufm.edu, manuales).
