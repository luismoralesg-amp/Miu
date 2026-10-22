# Funciones nuevas, pagos y roles — MiU propio (re-ingeniería)

- Fecha: 2026-10-22 (America/Guatemala, UTC-6) · Autor: AlphaGod · Para: Luis
- **Decisión de Luis:** construir **nuestra propia versión completa desde cero**, con pagos propios y login con Google
  propio, para publicarla o presentarla. Las licencias y APIs de la UFM se conectan después.
- Encaja en `ARQUITECTURA_MIU.md`: monolito modular, adaptadores y fases. La principal consecuencia es que el
  `FakeMiUAdapter` pasa a ser el **sistema real**, con datos propios. Los adaptadores hacia la UFM se dejan como
  puertos para el futuro.
- Etiquetas: **(Hecho)** con fuente · **(Inferido)** · **(Desconocido)** · **(Recomendación)**. Ninguna comisión
  se inventa: solo aparecen las publicadas.
- Veredictos: **SÍ** · **SÍ PERO MÁS SIMPLE** · **DESPUÉS** · **NO**.

---

## 0. Principios de re-ingeniería

Esto **no es una réplica**: se conservan todas las funciones, pero el mecanismo puede cambiar.

1. **Menos pasos:** cada tarea frecuente debe resolverse en 3 interacciones o menos desde el inicio.
2. **Proactivo, no reactivo:** el sistema **trae** lo urgente (vencimientos, saldo, cambios de nota) en lugar de
   esperar a que el usuario lo busque.
3. **Bandeja unificada:** pendientes, avisos, pagos y recordatorios llegan a un solo lugar, en vez de estar
   repartidos en 10 pestañas y 6 tiles.
4. **Defaults inteligentes:** el período actual, rangos de fechas con sentido (nunca futuros ni de 2022) y
   formularios prellenados con la identidad.
5. **Una fuente de verdad:** el contador y el contenido salen del mismo modelo.
6. **Transparencia y explicabilidad:** toda regla (prioridad, solvencia, nota baja) explica el "por qué" y deja
   un camino de apelación.
7. **Privacidad por defecto:** el mínimo dato visible, con consentimiento explícito.
8. **Auditable:** toda acción sensible queda registrada.
9. **Las políticas son configurables, no se codifican fijas:** las reglas institucionales (prioridad, cupos,
   umbrales) las define el rol Administrativo, porque son **decisiones de la UFM**, no del software.

---

## 1. Pagos

### 1.1 Stripe para tarjetas — **NO (directo desde Guatemala)**
- **Hecho:** la página oficial de disponibilidad `https://stripe.com/global` **no incluye a Guatemala** entre los
  países donde se puede abrir una cuenta. Lo verifiqué con curl el 22-oct-2026: el texto no menciona
  "Guatemala". La misma página dice que, fuera de los países soportados, solo se ofrece Treasury con stablecoins
  y que los pagos todavía no están disponibles.
- **Hecho:** Stripe incluyó a Guatemala (`gt_bank_account`) **solo como destino de pagos salientes**
  ("cross-border payouts", en vista previa pública). **No es soporte como comercio**
  (https://docs.stripe.com/changelog/clover/2026-02-25/cross-border-payouts-new-countries).
- **Hecho:** el país de origen del negocio no se puede cambiar después de activar la cuenta
  (https://docs.stripe.com/get-started/account/set-up).
- La vía de "crear una LLC en EE. UU." existe (según fuentes no oficiales), pero agrega costos legales, fiscales
  y contables, y una entidad extranjera. **No se recomienda** para este proyecto.
- **Compatibilidad:** la arquitectura ya define un `PaymentProviderPort`, así que Stripe quedaría como un
  adaptador futuro **si** algún día existe una entidad en un país soportado.

### 1.2 Alternativas reales en Guatemala (verificadas)

| Opción | Qué es | Lo verificado | Comisión publicada | Apple Pay / Google Pay |
|---|---|---|---|---|
| **Recurrente** | Pasarela fintech guatemalteca con API y webhooks | Acepta Visa y Mastercard de crédito y débito de cualquier país (sin Amex). 3DS, motor de fraude y cumplimiento PCI incluidos. Transferencia ACH en Guatemala con "verificación automática". Retiro en 24 h hábiles | **4.5% + Q2** por transacción exitosa con tarjeta (cuenta comercial, IVA incluido). **ACH en Guatemala: gratis.** Cuotas desde 8% + Q2 (fuente: ayuda.recurrente.com) | **Apple Pay disponible** en checkout y links desde el 21-sep-2026, solo pagos únicos. **Google Pay: no encontré confirmación (Desconocido)** |
| **NeoNet (antes VisaNet Guatemala)** | Adquirente local, con productos NeoPay (en sitio o app), NeoLink, MallVirtual y Cybersource | Q y USD, NeoCuotas, NeoPuntos, integración con certificación | **No publicada (Desconocido)**; requiere contrato de comercio afiliado | "NeoExperiencia" acepta billeteras digitales (Apple Pay, Google Pay, Click to Pay) **en NeoLink, Cybersource y MallVirtual** (fuente: neonet.com.gt y enif.gt). No confirmado en NeoPay |
| **PayPal** | Cuenta empresarial | Disponible en GT. Según la ayuda de PayPal, "recibir fondos requiere asociar un partner local con licencia". **El retiro directo a un banco guatemalteco no está claro** (Desconocido). Fuentes comunitarias reportan que se retira vía intermediarios (Osmo, Airtm) | No verificada para GT (Desconocido) | No aplica |
| **Paggo** | Fintech GT con API y plugins | Existe (fuente: ENIF) | Desconocido | Desconocido |
| BAM / bancos | Adquirencia bancaria | **No verifiqué** su producto de e-commerce (Desconocido) | Desconocido | Desconocido |

- **Contexto (Hecho):** **Apple Pay** está soportado en Guatemala, con bancos emisores como BI, G&T, BAC,
  Banrural, Promerica, Agromercantil, Ficohsa y Cuscatlán (https://support.apple.com/en-us/109524). **Google Pay**
  está disponible en Guatemala para pagos en línea y en apps, y **Google Wallet** para pagos contactless y pases
  (https://support.google.com/googlepay/answer/12429287 ·
  https://support.google.com/wallet/answer/12059326?co=GENIE.CountryCode%3DGT).

**Stack de pagos recomendado:**
1. **Recurrente como procesador principal:** tarjetas, Apple Pay y ACH sin comisión, con API y webhooks, sin
   mensualidad, y con un alta sencilla para un proyecto pequeño.
2. **NeoNet como segundo procesador** cuando haya una entidad formal y volumen: Google Pay, cuotas y puntos.
3. **Transferencia o depósito con comprobante** y **pago presencial**, como métodos manuales con revisión.

Todo pasa por un `PaymentProviderPort` con un adaptador por procesador.

### 1.3 Apple Pay / Google Pay vs. "Apple Wallet / Google Wallet"
- **Pagar con Apple Pay o Google Pay** es un método de pago **a través del procesador**. Nosotros no lo
  integramos por separado: la pasarela lo ofrece en su checkout alojado. **Veredicto: SÍ, a través de
  Recurrente (Apple Pay) o NeoNet (ambos)**.
- **Agregar pases a Wallet** (el carné estudiantil, una entrada a conferencia o un recordatorio de pago) es
  **otra función**: pases `.pkpass` de Apple (requieren la cuenta Apple Developer, que cuesta 99 US$/año según
  Apple; *verificar el precio vigente*) y la Google Wallet API (pases genéricos). **Veredicto: DESPUÉS**. Es
  bonito, pero no es esencial. Un carné en Wallet sería **solo visual o informativo**: **no reemplaza** la
  identificación oficial de la UFM y no puede contener datos sensibles (CUI).

### 1.4 Transferencia o depósito validado con captura del comprobante — **SÍ PERO MÁS SIMPLE**
- **Riesgos:**
  - comprobantes editados o falsificados (una captura es trivial de alterar);
  - el mismo comprobante reutilizado en varias cuentas;
  - montos parciales;
  - pagos a una cuenta equivocada;
  - suplantación del pagador.
- **Diseño mínimo:**
  1. Cada cargo genera un **código de referencia único** (por ejemplo `MIU-26-000123`) que el estudiante pone en
     la descripción de la transferencia.
  2. Al subir el comprobante, se calcula un **hash SHA-256 del archivo** y un hash perceptual de la imagen para
     detectar duplicados. Los campos clave (banco, número de autorización, monto, fecha) **se guardan como clave
     única**.
  3. **Nunca se aprueba solo con la captura.** El estado pasa a "En revisión" y entra a la **cola de revisión del
     Administrativo**.
  4. La aprobación se hace **conciliando contra el estado de cuenta bancario** (importado en CSV o por API del
     banco cuando exista). El sistema propone las coincidencias por referencia, monto y fecha.
  5. Un **OCR opcional** puede prellenar los campos, pero solo como sugerencia.
  6. Toda la actividad queda en auditoría: quién aprobó, cuándo y con qué evidencia.
- **Re-ingeniería vs. MiU:** **ACH vía Recurrente con verificación automática** (gratis, según la fuente)
  **elimina la captura en la mayoría de los casos**. La captura queda solo para depósitos en ventanilla.
- **Costo:** bajo (es nuestra propia cola). **Complejidad:** media (la conciliación).

### 1.5 Pago presencial validado por personal — **SÍ PERO MÁS SIMPLE**
- **Diseño:**
  - El Administrativo registra el pago presencial (efectivo o POS), con el usuario que lo registra, la caja, el
    número de recibo y, si es POS, la autorización del datáfono.
  - Al final del turno se hace el **cierre de caja**.
  - Hay **separación de funciones**: quien registra el pago no es quien lo concilia.
- **Re-ingeniería:** un QR con el código de referencia en el móvil del estudiante, para que el registro sea
  inmediato y sin errores de tipeo.

### 1.6 PCI DSS, recibos, reembolsos y solvencia
- **PCI:** el **checkout es alojado por el procesador** (redirección o campos alojados/tokenizados). **Nunca
  tocamos el PAN.** Así se busca el cuestionario más corto (**SAQ A**; *el procesador y el QSA confirman cuál
  aplica*). Referencia: https://www.pcisecuritystandards.org/document_library/
- **Webhooks** firmados e idempotentes. **Ledger** de doble entrada con cargos, pagos, ajustes y reembolsos.
- **Recibos:**
  - Comprobante interno: siempre.
  - **Factura electrónica FEL (SAT Guatemala):** obligatoria para una entidad que factura. **Es una decisión legal
    o fiscal del operador (UFM o la entidad de Luis); se necesita asesoría (Desconocido el detalle).**
    Referencia: https://portal.sat.gob.gt/portal/factura-electronica-fel/
- **Reembolsos:**
  - Por la misma vía de pago (API del procesador).
  - Los manuales requieren aprobación de dos personas.
- **Solvencia:** es un **read model** derivado del ledger (saldo vencido igual a 0). El módulo de Evaluación lo
  consulta mediante `SolvenciaPort`. **La regla "ver notas solo si es solvente" es una política configurable de
  la UFM.**

---

## 2. Funciones nuevas

### 2.1 Sincronizar asignación en grupo — **SÍ PERO MÁS SIMPLE**
- **Qué es:** amigos que se asignan juntos en las mismas secciones.
- **Riesgos:**
  - **Equidad:** los grupos acaparan cupos.
  - **Gaming:** inflar grupos con el estudiante de mejor prioridad para "arrastrar" a otros.
  - **Conflicto con la prioridad por promedio.**
- **Diseño mínimo:**
  - "**Preferencia de grupo**", no reserva garantizada.
  - Un grupo de 2 a 5 personas, con invitación aceptada por cada uno.
  - El grupo entra con la **prioridad del miembro de menor prioridad** (así no hay arrastre).
  - Si no hay cupo para todos, cada miembro elige de antemano entre "todos o nadie" y "lo que se pueda".
  - El algoritmo y el tamaño máximo los configura el **Administrativo**.
- **Re-ingeniería:** la asignación se hace por **lote con prioridades** (una ventana de preferencia y luego una
  resolución), en lugar de una carrera de clics.

### 2.2 Prioridad de asignación por promedio — **SÍ (como política configurable)**
- **Diseño:**
  - La prioridad es una función configurable (promedio, avance en el pensum, año, necesidades especiales) que
    define la UFM.
  - Hay ventanas escalonadas por grupo de prioridad.
  - Se **explica a cada estudiante su posición**.
- **Riesgo:** inequidad para estudiantes nuevos o con un mal semestre. Mitigación: una mezcla de criterios y
  cupos reservados.

### 2.3 Preferencia por promedio + asignación previa con el mismo catedrático — **DESPUÉS**
- **Interpretación:** priorizar la continuidad con un catedrático con el que ya se cursó.
- **Riesgos:**
  - Sesgo y formación de "clubs".
  - Sobre-optimización.
  - Complica el algoritmo.
- **Mínimo:** que el estudiante pueda **marcar preferencias de sección o catedrático**, y que la continuidad sea
  un **desempate**, no un criterio principal. La política la decide la UFM.

### 2.4 Perfil de calificación — dos interpretaciones
- **(A) Perfil académico del estudiante** (promedio, tendencia, avance del pensum, fortalezas por área).
  **Veredicto: SÍ.** Visible solo para el estudiante y para quien tenga un rol autorizado. Se reutiliza el Mapa
  de Cursos.
- **(B) Estadísticas de calificación de un catedrático** (distribución de notas, media y desviación por
  sección).
  - **Veredicto: SÍ PERO MÁS SIMPLE.** Las ve **solo el Administrativo y el propio catedrático**, de forma
    agregada (mínimo de N alumnos, para no reidentificar a nadie).
  - **No se publican a los estudiantes.** Eso sería un *ranking* con riesgos de privacidad, laborales y de
    equidad.
  - Sirve para **detectar anomalías**, no para castigar.

### 2.5 No poder calificar mal sin justificación — **SÍ PERO MÁS SIMPLE**
- **Diseño:**
  - Por debajo de un umbral configurable (o un cambio a la baja después de publicada la nota), es **obligatorio
    un comentario o rúbrica**.
  - Todo cambio de nota queda en **auditoría inmutable** (quién, cuándo, valor anterior, valor nuevo y motivo).
  - **Flujo de apelación:** el estudiante solicita una revisión en un plazo, el catedrático responde y, si hay
    desacuerdo, el caso escala a la coordinación (Administrativo).
- **Riesgo:** los comentarios "de relleno". Mitigación: plantillas de rúbrica y muestreo por coordinación.
- **Re-ingeniería:** la rúbrica se publica junto con la actividad, así el estudiante sabe cómo se califica
  **antes** de entregar.

### 2.6 Recordatorios vinculados (notas, asignaciones, tareas, exámenes) — **SÍ**
- **Diseño:**
  - **Motor de eventos:** cada actividad, examen, pago o ventana de asignación produce eventos con su fecha.
  - **Canales:** bandeja in-app, Web Push, email y **feed ICS por usuario** (con token revocable), que se
    suscribe en Google Calendar, Apple Calendar u Outlook.
  - **Anti-spam:**
    - **resumen diario o semanal** por defecto;
    - límite por día;
    - preferencias por tipo y canal;
    - horario de silencio;
    - deduplicación;
    - solo lo **accionable**.
  - **Para la cátedra:** "entregas por calificar", "notas pendientes de publicar" y "consultas de alumnos".
- **Re-ingeniería:** en lugar del modal bloqueante actual ("Hay evaluaciones pendientes..."), se usa una
  **bandeja unificada priorizada**.

### 2.7 Re-ingeniería de los flujos existentes (resumen)

| Flujo actual de MiU | Mecanismo re-diseñado |
|---|---|
| 10 pestañas + modal bloqueante + 60 s de carga | **Inicio "Hoy"**: próximas clases, vencimientos, saldo y avisos, en una sola vista con read models |
| Pendientes con badge inconsistente | **Bandeja unificada** (pendientes + avisos + pagos) con un contador de la misma fuente |
| Horario sin eje temporal | Horario con el tiempo real, la clase actual o próxima destacada y exportación ICS |
| Cursos anteriores con filtros manuales | Historial agrupado por período con búsqueda global |
| Detalle de curso con 12 sub-pestañas | Detalle con "lo importante primero" (próxima actividad, nota actual, último anuncio) y lo demás bajo demanda |
| Entrega: subir y adivinar | Rúbrica visible, recibo de entrega con hash y recordatorio |
| Pagos: fechas por defecto futuras | Saldo y "pagar ahora" en 2 pasos (checkout alojado, Apple Pay); recibos automáticos |
| Asignar/Botar con pop-ups | Ventana de preferencias + resolución por lote, sin pop-ups |
| Conferencias: buscar sin feedback | Lista filtrable con un estado claro (reservada, lista de espera, expirada) |
| Chat externo sin identidad | Contexto prellenado (quién y desde qué pantalla) |
| Mi información con CUI visible | Datos enmascarados y edición con step-up |

---

## 3. Roles y matriz de permisos (RBAC + alcance) — *corregido 22-oct-2026 según Luis*

**Roles:** Administrativo · Estudiante · Maestro (catedrático) · Auxiliar.
**Alcance:** cada permiso es `(rol, recurso, ámbito)`; el ámbito puede ser global, la facultad, una **sección**
o "propio".

**Modelo UFM (dicho por Luis):** los **Auxiliares son quienes califican y suben o publican las notas**; funcionan
como un segundo catedrático en las secciones que tienen asignadas. El **Maestro** es dueño del curso: asigna
auxiliares por sección, revisa y puede sobrescribir notas, y ve la auditoría. Las **reglas de justificación de
nota baja y la auditoría aplican a quien califique**, sea Maestro o Auxiliar.

**Supuesto a confirmar con la UFM:** la **nota final del curso** probablemente la cierra o publica **solo el
Maestro**. Se modela como un permiso configurable, **`cerrar_nota_final`**, que **por defecto es solo del
Maestro**. La Administración puede otorgarlo también al Auxiliar por curso o sección.

| Permiso | Administrativo | Maestro (dueño del curso) | Auxiliar (secciones asignadas) | Estudiante |
|---|---|---|---|---|
| Ver cursos y secciones | Todos en su ámbito | Su curso, todas las secciones | Sus secciones asignadas | Las suyas |
| Asignar auxiliares a secciones | Sí (supervisión) | **Sí**, por sección | — | — |
| Crear y editar tareas, exámenes y rúbricas | Solo configura políticas | Sí | **Sí**, en sus secciones | — |
| Calificar | — | Sí | **Sí** | — |
| Publicar notas de actividades y parciales | — | Sí | **Sí** | — |
| **Cerrar o publicar la nota final (`cerrar_nota_final`)** | Configura quién lo tiene | **Sí (por defecto)** | Solo si se le otorga (configurable) | — |
| Revisar o sobrescribir una nota | Solo por apelación escalada (auditado) | **Sí**, con justificación | Solo las suyas, antes del cierre | — |
| Justificación obligatoria de nota baja | Define el umbral | Aplica | **Aplica** | Ve el motivo |
| Ver entregas | Auditoría puntual con motivo | Todo el curso | Sus secciones | Las propias |
| Entregar | — | — | — | Las propias |
| Roster con PII | Mínimo necesario | Enmascarado | Enmascarado | — |
| Anuncios | Globales | Del curso | De sus secciones | Leer |
| Pagos | Ver, aprobar y reembolsar (dos personas) | No | No | Los propios |
| Políticas de asignación y cupos | Configurar | Ver | — | Preferencias y grupo |
| Estadísticas de calificación | Agregadas | Del curso, por sección y por auxiliar | Las de sus secciones | No |
| Apelaciones | Resuelve las escaladas | Resuelve | Responde en primera instancia | Crea |
| Recordatorios | Globales | Del curso | De sus secciones | Preferencias propias |
| Auditoría | Toda | **Toda la de su curso** | Sus propias acciones | Sus accesos |

- **Mínimo privilegio:** el Auxiliar solo actúa en las **secciones asignadas**. La asignación tiene vigencia (el
  período), es revocable y queda auditada. La supervisión es del Administrativo.
- **Pantallas clave:**
  - **Estudiante:** Hoy, Bandeja, Horario, Cursos, Entregas, Notas y perfil, Pensum, Pagos, Asignación y Cuenta.
  - **Maestro:** Mi curso, Secciones y auxiliares, Por calificar, Libro de notas, Revisión y sobrescritura,
    Cierre de nota final, Apelaciones, Auditoría, Estadísticas.
  - **Auxiliar:** Mis secciones, Tareas y exámenes, Por calificar, Publicar notas, Apelaciones de primera
    instancia, Anuncios.
  - **Administrativo:** Políticas, Pagos y conciliación, Caja, Reembolsos, Roles, Auditoría, Estadísticas,
    Apelaciones escaladas.

## 4b. Comparación de costos: el método más rentable (neto para la universidad)

Solo uso comisiones **publicadas y verificadas**. Lo que no está publicado aparece como *Desconocido*. Los montos
de abajo son **ejemplos** (Q10,000 representa una colegiatura; Q500, un cargo pequeño). **No son tarifas reales
de la UFM.**

**Comisiones verificadas:**
- **Tarjeta y Apple Pay vía Recurrente:** 4.5% + Q2 por transacción exitosa (IVA incluido).
- **Transferencia (ACH) vía Recurrente:** "gratis" en Guatemala.
  - Fuentes: https://ayuda.recurrente.com/es/p/cual-es-el-costo-de-usar-mi-cuenta-comercial-en-recurrente
    y https://www.recurrente.com/precios
- **Transferencia directa del banco del estudiante a la cuenta de la UFM:**
  - Banco Industrial: las transferencias ACH (GuateACH) son "sin costo adicional"
    (https://www.corporacionbi.com/gt/bancoindustrial/creacion-de-usuario-bi-en-linea/). Límite personal de
    Q20,000 diarios y Q40,000 mensuales hacia otros bancos (ampliable).
  - BAC: GuateACH sin comisión; **ACH Inmediato cuesta Q5** (los paga el **estudiante**)
    (https://www.baccredomatic.com/es-gt/personas/landing/guate-ach-inmediato).
  - La comisión de recepción para la cuenta empresarial de la UFM es *Desconocida* (depende de su contrato
    bancario).
- **NeoNet (antes VisaNet):** *Desconocido* (no publica comisiones; requieren contrato).
- **Recargo al pagador** (trasladar la comisión de tarjeta al estudiante):
  - **Legalidad en Guatemala: Desconocida.** Además, las reglas de Visa y Mastercard y el contrato del procesador
    pueden restringirlo.
  - **No lo apliques sin confirmarlo** con el procesador y un asesor legal. Una alternativa más segura es un
    **descuento por pagar con transferencia**, sujeto a la misma verificación.

**Ejemplo resuelto (comisión que pierde la universidad):**

| Método | Q10,000 | Q500 | Neto recibido (Q10,000 / Q500) | Liquidación | Costos no tarifarios |
|---|---|---|---|---|---|
| Tarjeta o Apple Pay (Recurrente) | Q452.00 (4.52%) | Q24.50 (4.9%) | Q9,548.00 / Q475.50 | Retiro en 24 h hábiles | Riesgo de **contracargos**; el fraude lo mitiga 3DS; conciliación automática |
| ACH vía Recurrente | **Q0** | **Q0** | Q10,000 / Q500 | Desconocida (verificar) | Verificación automática; casi sin trabajo del personal; sin contracargos de tarjeta |
| Transferencia directa con comprobante | Q0 (recepción: Desconocida) | Q0 | ≈ Q10,000 / Q500 | Inmediata o el mismo día (ACH) | **Revisión manual** (minutos de personal por pago); riesgo de comprobantes falsos; errores de referencia |
| Presencial (caja) | Efectivo: Q0. POS: comisión del adquirente (Desconocida) | Igual | ≈ bruto | El día del cierre | **Tiempo de cajero**, manejo de efectivo, riesgo de faltantes y depósito |
| NeoNet (tarjeta) | Desconocida | Desconocida | — | Desconocida | Contrato y certificación |

**Recomendación (maximiza el neto):**
1. **Por defecto, y destacada en la interfaz:** ACH vía Recurrente. No tiene comisión, se verifica sola y no
   requiere personal. Es la mejor opción para montos grandes como la colegiatura (en el ejemplo, ahorra Q452 por
   cada Q10,000).
2. **Tarjeta o Apple Pay** para montos pequeños o urgentes y para quien no tiene banca en línea. Se muestra la
   comparación con transparencia ("con transferencia ahorras X"), sin recargo hasta confirmar su legalidad.
3. **Transferencia directa con comprobante y pago presencial** solo como respaldo: tienen cero comisión pero costo
   de personal y de riesgo.
4. **Ruteo por costo** en el `PaymentProviderPort`: una regla configurable por el Administrativo (por ejemplo,
   ofrecer primero ACH si el monto supera un umbral) que registra el costo esperado por método. Cuando NeoNet
   publique o contrate tarifas, entra en la comparación.

## 4. Tabla de veredictos

| Ítem | Veredicto | Por qué (una línea) | Diseño mínimo |
|---|---|---|---|
| Stripe directo desde GT | **NO** | Guatemala no figura en stripe.com/global como país de comercio | `PaymentProviderPort`, Stripe como adaptador futuro |
| Recurrente (tarjeta + Apple Pay + ACH) | **SÍ** | Opera en GT, tiene API y comisiones publicadas (4.5% + Q2; ACH gratis) | Checkout alojado + webhooks |
| NeoNet | **DESPUÉS** | Más medios (Google Pay, cuotas) pero exige contrato y certificación | Segundo adaptador |
| PayPal | **NO** (por ahora) | El retiro a un banco de GT no está claro | — |
| Apple Pay / Google Pay (pagar) | **SÍ** (vía procesador) | Disponibles en GT; los da el procesador | Nada propio |
| Pases en Wallet (carné, entradas) | **DESPUÉS** | Bonito pero no esencial; requiere cuentas de desarrollador | Pase informativo, sin PII |
| Transferencia con captura | **SÍ PERO MÁS SIMPLE** | Las capturas se falsifican; ACH verificado reduce su uso | Referencia + hash + cola + conciliación |
| Pago presencial | **SÍ PERO MÁS SIMPLE** | Necesario, con control de caja | Registro + cierre + separación de funciones |
| Sincronizar asignación en grupo | **SÍ PERO MÁS SIMPLE** | Útil, pero con riesgo de acaparamiento | Preferencia de grupo con la prioridad del miembro más bajo |
| Prioridad por promedio | **SÍ** | Estándar y explicable, como política de la UFM | Función configurable + ventanas |
| Continuidad con el mismo catedrático | **DESPUÉS** | Sesgo y complejidad | Preferencia como desempate |
| Perfil académico del estudiante | **SÍ** | Alto valor, reutiliza el pensum | Privado |
| Estadísticas de calificación del profesor | **SÍ PERO MÁS SIMPLE** | Privacidad y equidad | Agregadas, solo Administrativo y el propio Maestro |
| Justificación obligatoria de nota baja (aplica a Maestro y Auxiliar) | **SÍ PERO MÁS SIMPLE** | Equidad y auditoría sin burocracia | Umbral + rúbrica + apelación |
| Recordatorios vinculados | **SÍ** | Ataca el problema de fondo (pendientes perdidos) | Motor de eventos + bandeja + ICS + resumen |

---

## 5. Legal y cumplimiento (lo que **no** podemos resolver como software)
- **Entidad y procesador:** para cobrar dinero real se necesita una **entidad registrada** (persona individual o
  sociedad) aceptada por el procesador. **Mientras el proyecto es una demo**, usar **solo el modo de pruebas
  (sandbox)** del procesador, sin cobros reales.
- **FEL (SAT):** facturación electrónica obligatoria al facturar. Necesita asesoría.
- **Datos personales:** Guatemala **no tiene una ley general de protección de datos vigente comparable al
  GDPR** (*Desconocido el estado legislativo actual: verificar*). Aun así aplicaremos la minimización y el
  consentimiento como estándar.
- **Políticas académicas** (prioridad, apelaciones, solvencia): **las decide la UFM**. Nosotros las hacemos
  configurables.
- **Marca:** es una **propuesta de diseño para la UFM**, así que usar el nombre y los logos de la UFM es intencional. Solo se usan los **archivos oficiales que provea la UFM** (en `public/brand/`).

---

## 6. Fuentes
- Stripe, disponibilidad global: https://stripe.com/global
- Stripe, payouts a GT (vista previa): https://docs.stripe.com/changelog/clover/2026-02-25/cross-border-payouts-new-countries
- Stripe, país de origen de la cuenta: https://docs.stripe.com/get-started/account/set-up
- Recurrente, comisiones: https://ayuda.recurrente.com/es/p/cual-es-el-costo-de-usar-mi-cuenta-comercial-en-recurrente · https://www.recurrente.com/precios
- Recurrente, tarjetas aceptadas: https://ayuda.recurrente.com/es/p/que-tarjetas-acepta-recurrente
- Recurrente, Apple Pay: https://ayuda.recurrente.com/es/novedades/apple-pay-en-tu-checkout
- NeoNet NeoPay: https://www.neonet.com.gt/e_commerce/neopay · MallVirtual: https://www.neonet.com.gt/e_commerce/mallvirtual
- ENIF, billeteras en NeoNet y Paggo: https://www.enif.gt/novedades/pagos/nuevos-medios-de-pago/
- PayPal GT, empresas: https://www.paypal.com/gt/webapps/mpp/join/business · cómo recibir fondos: https://www.paypal.com/gt/cshelp/article/%C2%BFc%C3%B3mo-hago-para-recibir-dinero-a-trav%C3%A9s-de-paypal-help667
- Apple Pay, bancos de Latinoamérica: https://support.apple.com/en-us/109524 · países: https://support.apple.com/en-us/102775
- Google Pay, países: https://support.google.com/googlepay/answer/12429287 · Google Wallet en GT: https://support.google.com/wallet/answer/12059326?co=GENIE.CountryCode%3DGT
- PCI SSC, documentos (SAQ): https://www.pcisecuritystandards.org/document_library/
- SAT, FEL: https://portal.sat.gob.gt/portal/factura-electronica-fel/
- Apple Wallet, pases: https://developer.apple.com/wallet/ · Google Wallet API: https://developers.google.com/wallet
