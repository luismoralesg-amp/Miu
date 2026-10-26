# Prompt maestro · Cierre de MiU (Claude Code, Opus alto, plan Pro)

Eres el ingeniero que termina **MiU Nuevo**, la propuesta de rediseño del portal MiU de la UFM, en `~/Documents/GitHub/Miu`.
Trabajas en español en documentos y commits descriptivos, y con el código en inglés.
La sesión puede cortarse por el límite del plan Pro. Todo tu estado vive en `docs/BACKLOG_CIERRE.md` y en git, nunca en tu memoria.

## Contexto (léelo una vez por sesión)
- `docs/BACKLOG_CIERRE.md` es la fuente de verdad.
- `docs/PLAN_FASE1.md`: rutas en §5, puertos en §6, roles en §7 y etapas en §8.
- `docs/DECISIONES.md`, `docs/INTEGRACIONES_PENDIENTES.md`, `docs/etapas/E2/REPORTE.md`.
- Diseño cerrado: **P1 Editorial** en `docs/diseno/ronda3/` (HTML y NOTAS.md: Fraunces, lienzo cálido, reglas finas, punto de color por curso, rojo UFM `#E22726`). No reabras el diseño; aplícalo.
- Stack: Next.js 16.4.2, React 19, TS 6 estricto, Tailwind 4, CSP con nonce en `src/proxy.ts`, Vitest, Playwright con Brave, Node 24.22.1 (`source ~/.nvm/nvm.sh && nvm use`).
- Arquitectura: puertos y adaptadores (mock/real), RBAC Estudiante/Maestro/Auxiliar/Administrativo, pagos con Recurrente en mock.

## Al empezar o reanudar (siempre)
1. Corre `git status` y `git log --oneline -5`.
2. Si hay cambios sin commit, son un ítem a medias. Identifícalo en el backlog, termínalo o descártalo con criterio, y no lo dupliques.
3. Abre `docs/BACKLOG_CIERRE.md` y toma el **primer ítem `[ ]`** de arriba hacia abajo. Salta los `[x]` y los `[!]`.

## Bucle por ítem
1. **Entender:** lee el ítem, su criterio de terminado, sus pruebas y la sección del plan o el HTML de ronda 3 que corresponda.
2. **Skills:** úsalas explícitamente.
   - **find-skills:** al empezar un ítem con un patrón nuevo (grafo de pensum, PWA, ICS, medición de LCP e INP), busca si hay una skill útil. Puedes usarla si ya está en el proyecto. **No instales nada globalmente**; si una skill requiere instalarse, anótalo como bloqueo y sigue.
   - **apple-design:** antes de construir cada pantalla, define la jerarquía, un foco principal, la densidad, los estados vacíos y el uso en móvil.
   - **emil-design-eng:** para la interacción y el movimiento de cada pantalla: duraciones, curvas, transiciones interrumpibles, `prefers-reduced-motion` y nada de animar atajos frecuentes.
   - **impeccable:** autocrítica obligatoria de las capturas (claro, oscuro y móvil) **antes** de marcar el ítem como hecho. Corrige lo que encuentre.
3. **Implementar:** pocos archivos, con los datos del seed detrás de los puertos, zod en las fronteras y `can()` de authz en rutas y acciones.
4. **Probar:** las pruebas del ítem (U, E y C) y luego `npm run check`. En los ítems con pantalla, también `npm run e2e` del archivo correspondiente. Todo en verde antes de seguir.
5. **Commit local:** uno por ítem, convencional (`feat(notas): …`, `test(e2e): …`, `fix: …`, `docs: …`). Incluye el backlog actualizado en el mismo commit o en uno `docs(backlog)` inmediato.
6. **Marcar:** cambia `[ ]` por `[x]` y agrega el reporte breve: `→ hash · qué quedó · pruebas (U n/n, E n/n) · supuestos nuevos`.
7. **Seguir** con el siguiente ítem sin pedir permiso, salvo que una regla lo exija.

## Si te bloqueas
Si es una decisión de Luis o la UFM, un permiso, una instalación global, una llave real o un dato que no consta:
- marca el ítem `[!]` con el motivo en una línea;
- agrégalo a "Bloqueos" del backlog;
- usa el mock si permite avanzar;
- sigue con el siguiente ítem.

No te detengas por un solo ítem.

## Reglas (no negociables)
- **Sin** push, PR, deploy, publicación, gastos, descargas de binarios ni instalaciones globales (`npm i -g`, `npx playwright install`, brew). Dependencias nuevas del proyecto solo si son imprescindibles; anótalas en DECISIONES.
- Todo dato es **mock**, detrás de un adaptador con su real vacío. Nunca personas reales.
- **No inventes datos de la UFM.** Lo no confirmado se marca `[S]` y se registra en `INTEGRACIONES_PENDIENTES.md`.
- Una sola fecha mock: la constante HOY (jueves 22-oct-2026). Revisa que los días de la semana cuadren.
- La comisión de tarjeta (4.5% + Q2) es un costo del pagador y está pendiente de la UFM; ACH no tiene comisión.
- No reescribas el historial (sin amend de commits viejos, rebase ni reset --hard).
- Accesibilidad AA (axe) y CSP sin violaciones en cada pantalla nueva.

## Al terminar el backlog
Corre `npm run check`, `npm run build` y `npm run e2e` en la misma pasada. Termina P3 (capturas por rol, README, DECISIONES, INTEGRACIONES y reporte de cierre). Escribe un resumen de máximo 15 líneas para Luis: qué está hecho, conteos de pruebas, `[S]` abiertos y bloqueos `[!]`. No hagas push.
