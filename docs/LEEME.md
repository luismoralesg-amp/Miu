# MiU Nuevo: paquete para Claude Code

Es una propuesta de rediseño (re-ingeniería) del portal MiU para la UFM.

## Orden de lectura
1. `PROMPT_CLAUDE_MiU_Fase1_frontend.md`: el prompt que se le pega a Claude.
2. `ANALISIS_MIU.md`: todas las funciones actuales de MiU.
3. `ARQUITECTURA_MIU.md`: la arquitectura objetivo.
4. `FUNCIONES_NUEVAS_Y_PAGOS.md`: las funciones nuevas, los pagos con su costo y la matriz de roles.
5. `referencias/REFERENCIA_VISUAL.md` y `referencias/reel.mp4`: la referencia visual.
6. `capturas/`: capturas del MiU actual, como evidencia.

## Cómo empezar
1. Crea una carpeta de repo vacía y descomprime este ZIP dentro, en `docs/`.
2. Copia las skills de Senda: de `senda/.claude/skills/` a `.claude/skills/` del nuevo repo (`find-skills`,
   `impeccable`, `emil-design-eng`, `apple-design`).
3. Pon los logos oficiales de la UFM en `public/brand/` (versiones para fondo claro y oscuro).
4. Abre Claude Code en el repo, selecciona el modelo **Opus** con esfuerzo **alto** y pega el contenido de
   `docs/PROMPT_CLAUDE_MiU_Fase1_frontend.md`.
5. Revisa el plan que te devuelva antes de autorizar la construcción.
