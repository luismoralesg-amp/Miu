# Integraciones pendientes

Una fila por adaptador o recurso externo: qué falta, qué debe validar la UFM, contrato esperado y cómo activarlo.
Los puertos de datos se agregan en E3; esta lista crece con cada etapa.

| Elemento | Estado | Qué falta | Qué valida la UFM | Cómo activarlo |
|---|---|---|---|---|
| Logos UFM | Parcial | Versión del logo para **fondo claro** (el `logo-ufm01.png` recibido tiene el texto en blanco). Manual de estilo con el área de respeto y el hex oficial del rojo | Archivos oficiales y su uso | Copiar a `public/brand/` y actualizar el componente de marca |
| Rojo institucional | Supuesto | Hex oficial. Hoy `#E22726`, tomado del escudo en `logo-ufm01.png` | Manual de estilo | Cambiar el token `--accent-*` |
| Node 24.22.1+ | Pendiente | Actualizar el runtime local (instalador oficial) | — | `node -v` ≥ 24.22.1 |
| Chromium de Playwright | Pendiente | Permiso para `npx playwright install chromium` | — | Quitar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` |
