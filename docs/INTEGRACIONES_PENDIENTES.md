# Integraciones pendientes

Una fila por adaptador o recurso externo: qué falta, qué debe validar la UFM, contrato esperado y cómo activarlo.
Los puertos de datos se agregan en E3; esta lista crece con cada etapa.

| Elemento | Estado | Qué falta | Qué valida la UFM | Cómo activarlo |
|---|---|---|---|---|
| Logos UFM | Parcial | Logo oficial para **fondo claro**. Hoy se usa el escudo recortado de `logo-ufm01.png` y el nombre en Inter (`escudo.png` y `escudo-osc.png` son marcas de agua translúcidas). Falta también el manual de estilo con el área de respeto | Archivos oficiales y su uso | Copiar a `public/brand/` y cambiar `BrandMark` |
| Rojo institucional | Supuesto | Hex oficial. Hoy `#E22726`, tomado del escudo en `logo-ufm01.png` | Manual de estilo | Cambiar el token `--accent-*` |
| Node 24.22.1+ | Listo | Instalado con nvm (22-oct-2026) | — | `source ~/.nvm/nvm.sh && nvm use` |
| Chromium de Playwright | Pendiente | Permiso para `npx playwright install chromium` | — | Quitar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` |
