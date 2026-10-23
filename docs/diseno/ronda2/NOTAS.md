# Ronda 2 · Notas de movimiento y crítica

Modo oscuro: abre cualquier archivo con `?tema=oscuro`. Capturas en `capturas/` (1440 px y 390 px a 2x).

## Movimiento (emil-design-eng y apple-design)

Reglas comunes: entrada solo al cargar la pantalla, nunca al cambiar de pestaña. Ease-out fuerte
`cubic-bezier(0.23, 1, 0.32, 1)`. Con reduced motion solo queda el fade.

| Pantalla | Momento | Movimiento |
|---|---|---|
| Hoy | Carga | Skeleton con la forma de cada bloque. Al llegar los datos, cada bloque sube 8 px con fade: 280 ms, escalonado 40 ms (saludo, héroe, Tu día, Por entregar, Novedades) |
| Hoy | Héroe | La cuenta regresiva cambia de minuto sin animación (es un dato, no un adorno). Al cambiar de estado (urgente → normal → tranquilo) hace un cross-fade de color de 240 ms |
| Hoy | Línea de "ahora" | Avanza con transición lineal de 60 s, sin pulsos ni brillo. Al cruzar el fin de una clase, la tarjeta pierde el resaltado con 200 ms |
| Hoy | Filas y tarjetas | Hover con fondo `subtle` en 150 ms (solo puntero fino); al presionar escalan a 0.98 en 140 ms |
| Hoy | Novedades | El punto de "nueva" se desvanece en 200 ms al abrir el ítem; la lista no se reordena bajo el dedo |
| Notas | Barras por curso | Crecen desde la izquierda en 360 ms la primera vez; luego solo cambian con nuevas notas |
| Notas | Simulador | La nota final sigue al control 1:1, sin animación (respuesta directa, apple-design §2) |
| Notas | Etiqueta "Nueva" | Se mantiene hasta que el curso se abre; no parpadea |
| Pagos | Copiar referencia | El botón cambia a "Copiado" con un cross-fade de 150 ms y un leve blur, y vuelve a los 2 s |
| Pagos | Método recomendado | Sin animación de atención: la jerarquía la dan el orden, el borde y el botón rojo |
| Pagos | Estado tras pagar | "Debes Q…" cambia a "Estás solvente" con cross-fade de 240 ms y el historial inserta la fila nueva arriba, con la misma entrada de 280 ms |

## Qué cambió cada skill

| Skill | Cambio |
|---|---|
| find-skills | Instalado y útil: `dataviz` (gráfica de tendencia y barras de Notas). Disponibles sin instalar: `anthropics/skills@frontend-design` y `vercel-labs/agent-skills@web-design-guidelines` (no se instaló nada) |
| apple-design | Un solo foco por pantalla (héroe, monto adeudado, promedio). Jerarquía por tamaño y peso, no por color. 24 px entre bloques. Tracking negativo en cifras grandes y cifras tabulares |
| emil-design-eng | Entrada escalonada de 280 ms, presión a 0.98, hover solo con puntero fino y línea de "ahora" lineal. Pestañas y simulador sin animación |
| impeccable | Avatar sin fondo, "4 sin ver" que mostraba 3, eje apretado y hueco en A2, patrón de "por evaluar" invisible, historial y referencia rotos en móvil, desborde horizontal de Notas en móvil y textos que se partían en móvil. Rojo solo en el héroe y en el botón principal de Pagos |
| dataviz | La tendencia es una sola serie, sin leyenda, con etiquetas directas en los extremos. Las barras usan un solo tono (obtenido), gris (perdido) y patrón (por evaluar), sin depender solo del color |
