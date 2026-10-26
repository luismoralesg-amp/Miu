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
| `IdentityPort` (real) | Vacío | Google OIDC (cliente de Workspace UFM, verificación de firma), proveedor de correo para códigos y enlaces, relying party de WebAuthn y almacén persistente de sesiones | Cliente OAuth, dominio remitente, política de 2SV o passkeys | Credenciales en `.env.local` y `MIU_ADAPTER_IDENTITY=real` |
| Seed académico (`src/mock/seed/`) | Mock | Datos ficticios relativos a HOY (jueves 22-oct-2026). Facultades "Ciencias de la Computación" y "Estudios Generales", créditos, salones y bibliografía son de ejemplo [S] | Catálogo real de facultades, cursos, créditos y salones | Adaptadores `real` de `AcademicPort` y `AssessmentPort` |
| Políticas (`POLICY`) | Supuesto | Umbral de justificación 61, metas 71/80/90, semana de exámenes del 26 al 30 de octubre y cierre de nota final solo del Maestro [S] | Reglamento académico y calendario oficial | Configurable por el Administrativo en `/admin/politicas` |
| `AcademicPort` | Mock | Cursos, secciones, horario, historial, anuncios, documentos y contenido por subsección | API o CDC de MiU: inscripciones, secciones y contenido de cada curso | `MIU_ADAPTER_ACADEMIC=real` |
| `AssessmentPort` | Mock | Actividades, entregas, notas, lote del Auxiliar, publicación, cierre y apelaciones | API de MiU con la identidad de quien califica (auditoría) | `MIU_ADAPTER_ASSESSMENT=real` |
| `CurriculumPort` | Mock | Pensum de Ciencias de la Computación de ejemplo (40 cursos, 8 semestres) [S] | Pensum oficial por carrera y año de ingreso, con UMA y prerrequisitos | `MIU_ADAPTER_CURRICULUM=real` |
| `InboxPort` | Mock | Proyección sobre los demás puertos más lo leído por usuario | Read model propio (tabla alimentada por eventos), sin cambios en MiU | `MIU_ADAPTER_INBOX=real` |
