# Ronda 3 · Identidad

Archivos en esta carpeta; modo oscuro con `?tema=oscuro`. Toda fecha sale de `HOY` en `assets/setup.js`
(jueves 22 de octubre de 2026, 07:42; la noche usa 20:15). Todos los datos salen de `assets/seed.js`.

## Recomendación

**P1 · Editorial, con el punto de color por curso de P2.** Es la única piel que deja de parecer una plantilla: la
tipografía display, el papel cálido y las reglas finas le dan voz propia sin restar legibilidad. Del P2 tomo solo
el punto de color por curso (nunca como relleno detrás de texto), porque ayuda a ubicar el curso de un vistazo en el
eje, la semana, las novedades y ⌘K. Las siete pantallas nuevas, Notas y Pagos están en esta combinación.

- **P2:** se queda en reserva para cuando la UFM entregue fotos reales del campus. Con un placeholder se ve barato.
- **P3:** se descarta. La profundidad no da identidad y el vidrio apenas se nota sobre un lienzo liso.

## Tipografía display (P1)

| Opción (OFL) | A favor | En contra |
|---|---|---|
| **Fraunces** (elegida) | Variable con eje óptico y de suavidad; cifras tabulares con carácter para la cuenta regresiva, el promedio y el saldo; buen español (ñ, tildes) | Con mucho texto puede sentirse decorativa: por eso solo va en títulos y cifras |
| Newsreader | Muy legible, editorial y sobria | Las cifras tienen poco carácter; se confunde con un periódico |

Archivos en `assets/fonts/` con `OFL-Fraunces.txt`. Inter sigue para la interfaz y el cuerpo.

## Paleta por curso (P2, y el punto en P1)

Azul, ocre, verde agua, violeta, verde y cian, en ese orden. Ninguno se acerca al rojo UFM ni al rosa de error.
El validador de `dataviz` pasa en claro y en oscuro (separación entre pares vecinos y contraste de 3:1 contra la
superficie). La única advertencia, la separación ocre/verde agua en protanopía, queda resuelta porque el curso
siempre va con su nombre.

## Decisiones por skill

| Skill | Decisión |
|---|---|
| find-skills | Ya instaladas y útiles: `dataviz` (validador de paleta) y las referencias `typeset` y `colorize` de impeccable. En skills.sh no hay skills específicas de tipografía, paletas ni vidrio; lo más cercano es `brandkit` y `high-end-visual-design` (leonxlnx/taste-skill) y `frontend-design` (anthropics). No instalé nada |
| apple-design | Un foco por pantalla: héroe, monto adeudado, promedio o actividad a calificar. Jerarquía por tamaño y peso. Tracking negativo en display. P3: una sola luz desde arriba, con brillo interior superior y sombra hacia abajo; vidrio solo en la barra flotante, con opacidad del 86% para que el peor caso pase AA, y un fallback sólido sin `backdrop-filter` o con transparencia reducida |
| emil-design-eng | Movimiento en la tabla de abajo. ⌘K abre sin animación, porque es un atajo de uso constante |
| impeccable | Auditoría de cada captura. Corregido en esta ronda: <br>• el eje de horas de P1 tapaba el texto de la clase actual<br>• el botón del héroe de P2 se salía del borde en móvil<br>• faltaba contraste sobre la foto de P2<br>• la semana cortaba textos<br>• el foco de ⌘K se veía doble<br>• la tabla del Auxiliar no servía en móvil<br>• el examen salía dos veces en la noche<br>• un título SVG se borró por accidente |

## Movimiento

| Momento | Duración y curva | Interrupción | Reduced motion |
|---|---|---|---|
| Entrada de bloques | 280 ms, ease-out fuerte, escalonado 40 ms | Solo al cargar; nunca al cambiar de pestaña | Solo fade |
| Tarjeta que se expande | `grid-template-rows` 0fr→1fr en 280 ms con ease-out y fade de 200 ms; cierre en 200 ms | Es una transición CSS: se puede revertir a mitad de camino; Escape la cierra y devuelve el foco | Solo opacidad, 150 ms |
| ⌘K | Aparece al instante; la lista se filtra sin animación | — | Igual |
| Cambio entre variantes de Hoy (mañana, noche, exámenes) | Cross-fade de 240 ms al cruzar las 18 h; nunca mientras el usuario interactúa | Se aplica en la siguiente visita a Hoy | Cambio directo |
| Estado del héroe (tranquilo → normal → urgente) | Cross-fade de color de 240 ms, sin mover el contenido | La cuenta regresiva cambia de minuto sin animar | Cambio directo |
| Línea de "ahora" | Avanza linealmente en 60 s, sin pulso | — | Salta cada minuto |
| Calificación en lote | La fila activa cambia sin animación (j/k se usa cientos de veces) | — | Igual |

## Crítica por piel

**P1 · Editorial (recomendada)**
1. Fraunces con mucho texto cansa; se limitó a títulos y cifras.
2. Sin tarjetas, los bloques se distinguen solo por reglas y aire; en móvil hubo que dar más espacio entre secciones.
3. Sin color, los cursos se confundían; se resolvió con el punto de color de P2.

**P2 · Color por curso e imagen**
1. Todo depende de fotos reales; el placeholder hace ver la pantalla barata.
2. Con cuatro colores más el rojo del héroe, la pantalla se siente ocupada.
3. Texto sobre la foto: hubo que oscurecer el degradado para que pase AA, y aun así depende de cada imagen.

**P3 · Profundidad (descartada)**
1. Sobre un lienzo liso el vidrio casi no se percibe: el efecto no se gana su costo.
2. Las sombras hacen que se vea como la ronda 2, pero más pesada. No aporta identidad de la UFM.
3. El "levantar" la clase actual es demasiado sutil para usarlo como único indicador.

## Supuestos

- (Hecho) El 22 de octubre de 2026 es jueves y el 28 es miércoles.
- (Hecho) La comisión de tarjeta de Recurrente es 4.5% + Q2, como dice `FUNCIONES_NUEVAS_Y_PAGOS.md`.
- (Supuesto) Los bancos del checkout ACH de Recurrente (BI, BAC, Banrural, G&T) están por confirmar con Recurrente.
- (Supuesto) El umbral de 61 para la justificación obligatoria y las metas 71, 80 y 90 los define la UFM.
- (Supuesto) La semana de exámenes es una propiedad del calendario académico; aquí la decide el seed.
- (Supuesto) La foto del campus es un placeholder local; la real la provee la UFM.
