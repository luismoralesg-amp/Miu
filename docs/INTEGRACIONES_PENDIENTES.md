# Integraciones pendientes

Una fila por adaptador o recurso externo: qué falta, qué debe validar la UFM, contrato esperado y cómo activarlo.
Los puertos de datos se agregan en E3; esta lista crece con cada etapa.

| Elemento | Estado | Qué falta | Qué valida la UFM | Cómo activarlo |
|---|---|---|---|---|
| Logos UFM | Parcial | Logo oficial para **fondo claro**. Hoy se usa el escudo recortado de `logo-ufm01.png` y el nombre en Inter (`escudo.png` y `escudo-osc.png` son marcas de agua translúcidas). Falta también el manual de estilo con el área de respeto | Archivos oficiales y su uso | Copiar a `public/brand/` y cambiar `BrandMark` |
| Rojo institucional | Supuesto | Hex oficial. Hoy `#E22726`, tomado del escudo en `logo-ufm01.png` | Manual de estilo | Cambiar el token `--accent-*` |
| Node 24.22.1+ | Listo | Instalado con nvm (22-oct-2026) | — | `source ~/.nvm/nvm.sh && nvm use` |
| Chromium de Playwright | Pendiente | Permiso para `npx playwright install chromium` | — | Quitar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` |
| Fotos del campus | Pendiente | Fotografías oficiales del campus para el saludo y los estados vacíos (diseño P2, ronda 3). Hoy se usa `docs/diseno/ronda3/assets/campus-placeholder.svg`, marcado como ejemplo | Derechos de uso y selección de imágenes | Copiar a `public/brand/campus/` y reemplazar el placeholder |
| Bancos del checkout ACH | Supuesto | Lista real de bancos que ofrece el checkout ACH de Recurrente | Recurrente | Confirmar con Recurrente y ajustar el texto de Pagos |
| Comisión de tarjeta | Supuesto a confirmar con la UFM | La maqueta de Pagos (ronda 3.1) muestra la comisión de 4.5% + Q2 como costo de quien paga (total Q7,722.25 sobre Q7,387.80). **Choca con** "no apliques recargos" (prompt §1d) y con la legalidad desconocida del recargo (`FUNCIONES_NUEVAS_Y_PAGOS.md` §4b). En código no se aplica recargo hasta que la UFM lo decida | Quién paga la comisión; legalidad del recargo en Guatemala y reglas de Visa/Mastercard | Política configurable por el Administrativo en `PaymentProviderPort` |
