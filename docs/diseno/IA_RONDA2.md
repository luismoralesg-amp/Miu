# Arquitectura de información · Ronda 2

Cada pantalla responde **una** pregunta. Lo que no ayuda a responderla vive en su sección.

## Hoy · "¿Qué tengo que hacer ahora?"

| # | Bloque | Dato | Por qué está aquí |
|---|---|---|---|
| 1 | **Lo próximo importante** | Examen o entrega más urgente de las próximas 72 h: qué, cuándo (cuenta regresiva), dónde, una acción | Es la respuesta directa a la pregunta. Único bloque con rojo |
| 2 | **Tu día** | Eje de horas real (07–18 h) con las clases, la línea de "ahora" y los huecos libres ("libre 3 h 40 min") | Dónde tengo que estar y cuánto tiempo me queda para estudiar |
| 3 | **Por entregar** | Máximo 4, ordenadas por fecha; curso y fecha relativa ("mañana 23:59") | Lo siguiente en la cola, después del héroe |
| 4 | **Novedades** | Notas publicadas, anuncios y documentos nuevos desde tu última visita; cada uno abre su origen | Lo que cambió y no has visto. Sustituye al modal bloqueante de MiU |
| 5 | **Aviso de pago** *(contextual)* | Una línea: monto, fecha y enlace a Pagos | Solo si hace falta actuar |

**Fuera de Hoy:** el promedio (va a Notas) y el saldo (va a Pagos).

**Reglas de contexto**
- **Héroe con tres estados:** *urgente* (≤ 24 h, rojo), *normal* (≤ 72 h, neutro) y *tranquilo* ("Nada urgente hoy", con la próxima fecha importante).
- El aviso de pago aparece si vence en ≤ 7 días o está atrasado (atrasado: tono de error con ícono).
- Si una entrega ya está en el héroe, no se repite en "Por entregar".
- Más de 6 novedades: se agrupan por curso ("Paradigmas · 3 novedades").
- Fin de semana o sin clases: "Tu día" se reduce a una línea ("Hoy no tienes clases").

## Notas · "¿Cómo voy y qué me falta para aprobar?"

| # | Bloque | Dato | Por qué |
|---|---|---|---|
| 1 | **Promedio del semestre** | Número grande, cambio vs. el semestre anterior, créditos del período | La respuesta corta a "¿cómo voy?" |
| 2 | **Por curso** | Nota actual sobre lo evaluado, peso evaluado vs. pendiente, "necesitas X en lo que falta para 71 / 80 / 90" | La respuesta a "¿qué me falta?" |
| 3 | **Detalle del curso** *(al abrir uno)* | Cada actividad: nota, peso, quién calificó (catedrático o auxiliar), fecha de publicación, marca "nueva" | Transparencia y trazabilidad de cada nota |
| 4 | **Simulador** | Control deslizante: "si saco X en lo que falta, termino con Y" | Convierte el dato en un plan |

**Supuesto a confirmar con la UFM:** la nota mínima para aprobar. Se usan las metas 71, 80 y 90 que pediste; la nota de aprobación real la define la UFM.

## Pagos · "¿Debo algo, cuándo y cuál es la forma más fácil de pagar?"

| # | Bloque | Dato | Por qué |
|---|---|---|---|
| 1 | **Estado** | "Estás solvente" o "Debes Q___, vence ___", con el desglose a un clic | La respuesta en una línea |
| 2 | **Cómo pagar** | 1.º ACH sin comisión, con paso a paso y referencia lista para copiar. 2.º Tarjeta o Apple Pay, con la comisión real (4.5% + Q2). 3.º Depósito con comprobante y pago en caja ("en revisión") | La forma más fácil y barata primero |
| 3 | **Historial** | Pagos con fecha, método, estado y recibo descargable | Comprobantes sin buscar |

## Estados (las tres pantallas)

| Estado | Hoy | Notas | Pagos |
|---|---|---|---|
| Cargando | Skeleton con la forma de cada bloque, sin spinners | Ídem | Ídem |
| Vacío | Héroe tranquilo; "Nada por entregar esta semana" | "Aún no hay notas publicadas este semestre" | "Estás solvente. No hay cargos pendientes" |
| Mucho contenido | 8+ entregas: se muestran 4 y "Ver las 12"; novedades agrupadas | Cursos ordenados por riesgo (el más cerca de reprobar arriba) | Historial paginado por año |
| Primer día del semestre | "Bienvenida al semestre 2026-2": tus cursos, el horario y la fecha del primer pago | Notas del semestre anterior y créditos acumulados | Cargos del semestre con sus fechas |
