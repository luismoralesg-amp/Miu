# Prompt para Claude Code — MiU Nuevo · Fase 1: diseño y construcción del front end

Modelo: Opus, esfuerzo alto. Trabaja en español en los mensajes; código e identificadores en inglés.

## 0. Contexto (lee primero)
Adjunto 3 documentos base. Léelos completos antes de escribir código:
- `ANALISIS_MIU.md`: inventario de TODAS las funciones del MiU actual de la UFM, con fortalezas, debilidades, qué mantener y prioridades P0–P2.
- `FUNCIONES_NUEVAS_Y_PAGOS.md`: funciones nuevas, pagos (con la comparación de costos), roles y matriz de permisos. Es la fuente de verdad de roles y pagos.
- `ARQUITECTURA_MIU.md`: arquitectura objetivo (monolito modular, Next.js + TypeScript, PostgreSQL + Redis, PWA primero, adaptadores para los sistemas legados, política de parches).

Es una propuesta de diseño para la UFM (el uso del nombre y los logos de la UFM es intencional), construida por nosotros. No tenemos acceso a los sistemas internos de la UFM. Trabajamos con supuestos documentados.

## 1. Regla central (no negociable)
Construye cada función **completa, correcta y funcionando de punta a punta** en esta versión: datos, validaciones, estados, errores y navegación. Debe sentirse como el producto real.
Construimos NUESTRA versión propia desde cero, incluidos pagos e inicio de sesión con Google, para presentarla después. Todo lo que dependa de algo que solo la UFM puede validar o proveer va detrás de un **puerto/adaptador intercambiable**, con una implementación `mock` realista y una implementación `real` vacía y lista para conectar. Conectar lo real debe ser solo configuración (variables de entorno o credenciales) más, como mucho, completar el mapeo de un adaptador. Esto incluye:
- APIs y datos académicos (cursos, notas, pensum, horario, pendientes, documentos, anuncios, conferencias, asignar/botar).
- Pagos, recibos y solvencia.
- fce2 (sistema solo-campus).
- Google OAuth y Drive (solo @ufm.edu), UFMail, chat de soporte, Turnitin.
- Licencias de terceros, claves y credenciales.
Lleva un archivo `INTEGRACIONES_PENDIENTES.md` con cada adaptador: qué falta, qué debe validar la UFM, el contrato esperado y cómo activarlo.
Nunca hagas scraping de MiU ni uses sesiones o credenciales reales.

## 1b. Principio: re-ingeniería, no réplica
No copies MiU. Mantén TODAS sus funciones, pero rediseña los mecanismos cuando haya una forma mejor: menos pasos, información proactiva (lo urgente primero), bandeja unificada, buenos valores por defecto, flujos pensados de punta a punta y un ambiente de UX coherente. Para cada pantalla, documenta en una línea qué mecanismo cambiaste respecto a MiU y por qué. Optimiza el rendimiento y la claridad por encima de la fidelidad al original.

## 1c. Roles (RBAC + alcance por sección)
- **Estudiante, Maestro (catedrático), Auxiliar y Administrativo.**
- **El Auxiliar califica, publica notas y gestiona tareas y exámenes** en sus secciones asignadas, como un segundo
  catedrático.
- **El Maestro** es dueño del curso: asigna auxiliares por sección, revisa o sobrescribe notas y ve la auditoría.
- Permiso configurable **`cerrar_nota_final`**: por defecto solo el Maestro. Es un *supuesto a confirmar con la
  UFM*, configurable por el Administrativo.
- La justificación obligatoria de nota baja y el registro de auditoría aplican a **quien califique**.
- El Administrativo supervisa y configura las políticas.
- Implementa los permisos como `(rol, permiso, ámbito)` con pruebas, y deja usuarios mock de cada rol con un
  selector de rol en desarrollo.

## 1d. Pagos
- Usa un `PaymentProviderPort` **agnóstico del proveedor**.
- El **primer adaptador es Recurrente, en modo de pruebas (sandbox)**, con checkout alojado. Nunca manejes datos
  de tarjeta (busca PCI SAQ A) y usa webhooks idempotentes.
- Agrega adaptadores manuales para transferencia con comprobante (cola de revisión, hash para duplicados y
  conciliación) y para pago presencial.
- **Ruteo por costo:** ofrece primero ACH, que no tiene comisión, sobre todo en montos grandes. La tarjeta y Apple
  Pay quedan para montos pequeños o urgentes. Muestra el ahorro y **no apliques recargos**. El umbral lo configura
  el Administrativo.
- Stripe no está disponible para comercios en Guatemala: queda solo como adaptador futuro vacío.

## 2. Alcance de esta fase
1. Sistema de diseño (tokens, tipografía, color, espaciado, radios, sombras, movimiento, modo claro y oscuro) y biblioteca de componentes.
2. Shell de la app: navegación, rutas con deep links reales (nada de pestañas que solo cambian el hash), buscador global y notificaciones.
3. Todas las pantallas que hoy tiene MiU, según el inventario de `ANALISIS_MIU.md`, mejoradas pero sin perder ninguna función. Prioridad de construcción:
   a. Inicio / panel.
   b. Pendientes (fuente única: el contador y la lista salen del mismo dato).
   c. Cursos actuales y detalle de curso con todas sus sub-secciones.
   d. Detalle de tarea y entrega.
   e. Horario.
   f. Mapa de cursos / pensum con prerrequisitos.
   g. Notas.
   h. Cursos anteriores.
   i. Pagos y solvencia (con ruteo por costo y la cola de revisión del Administrativo).
   j. Conferencias y su evaluación.
   k. Asignar/Botar cursos.
   l. Documentos académicos.
   m. Mi cuenta (información, privacidad, accesos, archivos).
   n. Comunicación / chat.
   o. Soporte.
   p. Vistas de Maestro y Auxiliar: secciones, tareas y exámenes, por calificar, libro de notas, publicar, cierre de nota final, apelaciones y auditoría.
   q. Vistas del Administrativo: políticas, pagos y conciliación, roles.
4. Login (solo la interfaz y su flujo con adaptador mock): Google restringido a @ufm.edu, cuenta propia con código por correo de 6 dígitos o enlace mágico, passkeys, "recordar dispositivo" y la pantalla de dispositivos registrados. El flujo de referencia es el de Transparent Labs/Skio (correo → código → adentro), mejorado según la arquitectura.

## 3. Referencia visual (reel "Dashboard V14", analizada; detalle en `referencias/REFERENCIA_VISUAL.md` y `referencias/reel.mp4`)
Copia los patrones visuales, no el contenido. La referencia es un dashboard financiero ("Vaulta").
- **Layout:** encabezado superior (logo, navegación, buscador, notificaciones, perfil) y una cuadrícula asimétrica tipo bento, con tarjetas de distintos anchos.
- **Espaciado y bordes:** espacio generoso y densidad baja a media (padding de tarjeta de unos 24px, gaps de 12px). Radios grandes (unos 16px). Sombra muy suave en modo claro y borde de 1px sutil en modo oscuro.
- **Tipografía:** sans geométrica (Inter o similar). El dato principal va enorme y en negrita; las etiquetas, pequeñas y apagadas.
- **Color:** neutros (claro `#F9FAFB`/`#FFFFFF`/`#111827`/`#64748B`; oscuro `#09090B`/`#18181B`/borde `#27272A`/`#A1A1AA`). Un solo acento cálido y saturado, en degradado, usado con moderación. Verde y rojo semánticos.
  - **DECISIÓN ABIERTA para Luis:** el acento de la referencia es naranja (`#FF512F`→`#F09819`). Propón también una variante con el rojo institucional UFM y muéstrame las dos lado a lado antes de fijarla.
- **Movimiento:** skeletons que se transforman en contenido con un fade y slide-up escalonado. Animaciones de 300–400 ms con sensación de resorte y un cambio claro/oscuro instantáneo. Respeta `prefers-reduced-motion`.
- **Íconos:** de trazo uniforme (lucide).
- **Stack visual de la referencia:** React, Tailwind, framer-motion y lucide-react, compatible con Next.js.
- **Traducción a MiU (propuesta):**
  - El saldo grande pasa a ser el promedio o los créditos/UMA ganados.
  - La tabla de actividad pasa a ser los Pendientes y las notas recientes.
  - La gráfica pasa a ser el rendimiento del semestre.
  - Mensajes pasa a ser la comunicación con catedráticos.
  - La tarjeta destacada pasa a ser lo próximo importante (examen o pago).

## 3b. Identidad UFM
Se mantienen los logos y la identidad de la Universidad Francisco Marroquín. Usa solo los archivos oficiales que yo te pase, en `public/brand/`; no los descargues de internet ni los redibujes. Mientras no estén, usa un placeholder con el tamaño correcto y anótalo en `INTEGRACIONES_PENDIENTES.md`. Respeta el área de respeto y las versiones para fondo claro y oscuro. El acento de color debe convivir con el rojo institucional.

## 4. Skills (OBLIGATORIAS: son las mismas del proyecto Senda; cópialas a `.claude/skills/` de este repo si no están, úsalas y reporta cuáles usaste en cada parte)
- `find-skills`: al inicio, para ver si hay otras skills útiles. No instales nada sin preguntarme.
- `impeccable`: calidad de código, estructura, accesibilidad y revisión final.
- `emil-design-eng`: componentes, interacción y movimiento.
- `apple-design`: jerarquía, claridad, tipografía y detalle visual.

## 5. Requisitos técnicos
- Next.js (App Router) + TypeScript estricto + Tailwind. Usa solo versiones con soporte. Si dependes de Node, la mínima es Node 24.22.1 LTS (parche de seguridad del 21-oct-2026). Fija las versiones en un lockfile.
- PWA instalable y responsive desde el móvil hasta el escritorio.
- **Estados:** cada carga tiene skeleton, vacío explicado, error con reintentar y timeout. Ninguna pantalla se queda colgada en silencio.
- **Rendimiento:** presupuesto propuesto de LCP < 2,5 s y respuesta de interacción < 200 ms con datos mock. Mídelo y repórtalo.
- **Accesibilidad:** WCAG 2.2 AA, navegación por teclado, etiquetas en todos los íconos y nada de modales bloqueantes al entrar.
- **Seguridad:** HTTPS siempre, CSP estricta, cabeceras de seguridad, minimizar los datos personales mostrados (el CUI y la fecha de nacimiento enmascarados por defecto) y sin dependencias de CDN externas.
- **Datos mock:** realistas y coherentes (un alumno de ejemplo de Ciencias Económicas o Computación, con cursos, horario, notas, pagos y pendientes), generados con seed y sin datos reales de nadie.
- **Pruebas:** unitarias para la lógica, de componentes y E2E de los flujos clave (login mock, ver y entregar una tarea, consultar notas y pagos). Todo en verde antes de cerrar.

## 6. Forma de trabajo
1. Primero entrega un plan corto con la estructura de carpetas, los tokens, la lista de componentes, el mapa de rutas y los contratos de los adaptadores, y **espera mi visto bueno**.
2. Después construye por etapas pequeñas, con commits atómicos y un mensaje claro en cada uno. Sin push, PR ni deploy sin mi aprobación.
3. No instales herramientas globales ni descargues nada fuera de las dependencias del proyecto sin preguntarme.
4. Separa siempre los hechos de los supuestos. Si algo del documento base no está verificado, trátalo como supuesto y anótalo.

## 7. Reporte al cerrar cada etapa
- Qué construiste y capturas en claro y oscuro.
- Las pruebas y su resultado.
- Las métricas de rendimiento.
- Los adaptadores creados y lo que queda en `INTEGRACIONES_PENDIENTES.md`.
- Las skills usadas por punto.
- Los supuestos y riesgos.
- Las decisiones que necesitas de mí.
