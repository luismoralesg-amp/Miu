# Reporte de etapa E1 · Sistema de diseño

Fecha: 2026-10-22 · Node 24.22.1 (nvm)

## Qué se construyó

- **Tokens** (`src/design-system/tokens/tokens.css`): superficies, texto, acento rojo UFM en degradado, semánticos,
  borde de controles, sombras, radios 8/12/16, escala tipográfica con tracking por tamaño, duraciones y curvas.
  Claro, oscuro (por sistema o elegido) y alto contraste.
- **Componentes** (`src/design-system/components/`): Button, ButtonLink, IconButton, TextField, TextAreaField,
  SelectField, Checkbox, RadioGroup, Switch, Badge, Avatar, Kbd, Card, BentoGrid, BentoItem, Stat, ProgressRing,
  Sparkline, MaskedValue, Dialog, Tooltip, RouteTabs, ThemeToggle, BrandMark, Skeleton, LoadingRegion, Reveal,
  EmptyState, ErrorState, TimeoutState y Spinner.
- **Movimiento** (`src/design-system/motion/presets.ts`): resortes, proyección de momento y rubber-band para los gestos
  de etapas futuras.
- **Catálogo** con URLs reales: `/dev/sistema`, `/componentes`, `/estados` y `/hoy` (vista previa del bento con datos
  ficticios).

## Capturas

En esta carpeta, `<página>-light.png`, `-dark.png` y `-mobile.png` (Pixel 7). Se regeneran con
`CAPTURE=E1 npm run e2e -- capture`.

## Pruebas

| Tipo | Resultado |
|---|---|
| Unitarias y de componentes (Vitest) | 97 de 97 |
| E2E (Playwright: claro, oscuro y móvil) | 30 de 30, incluido axe WCAG 2.2 AA en las 4 páginas, sin scroll horizontal y sin violaciones de CSP |
| Lint, tipos y formato | Sin errores |

## Rendimiento

No se midió en E1: el catálogo no es una pantalla de producto. La medición de LCP e INP empieza en E4 con "Hoy".

## Skills usadas

| Parte | Skill | Cómo se aplicó |
|---|---|---|
| Tipografía | apple-design §15 | Tracking negativo en tamaños grandes, interlineado inverso al tamaño y cifras tabulares |
| Respuesta y presión | apple-design §1 y emil-design-eng | `active:scale-[0.97]` en 140 ms, al presionar y no al soltar; hover solo con puntero fino |
| Resortes y gestos | apple-design §4–§9 | `bounce: 0` por defecto; rebote solo con momento; proyección y rubber-band listos |
| Curvas y duraciones | emil-design-eng | Ease-out fuerte; UI por debajo de 300 ms; diálogo entra en 240 ms y sale en 150 ms |
| Qué no animar | emil-design-eng | Tabs, cambio de tema y atajos de teclado sin animación |
| Entradas | emil-design-eng | `reveal` en CSS con escalonado de 40 ms; tooltips sin espera cuando otro acaba de abrirse; origen en el disparador |
| Accesibilidad del movimiento | apple-design §14 | Reduced motion conserva el fade y quita el desplazamiento; alto contraste refuerza bordes |
| Revisión visual | impeccable (sin lanzador) | Una ronda de capturas: se corrigieron el peso tipográfico, la tarjeta destacada demasiado alta, el año visible en la fecha enmascarada y un caso de `maskValue` |

## Supuestos y riesgos

- El hex del rojo sale del PNG y no del manual de estilo de la UFM (supuesto).
- Falta el logo oficial para fondo claro.
- Playwright corre con Brave mientras no se descargue su Chromium.

## Decisiones para Luis

1. ¿Te convence el escudo recortado más el nombre en Inter como marca en fondo claro, hasta tener el logo oficial?
2. ¿Autorizas `npx playwright install chromium` (unos 150 MB) para no depender de Brave en las pruebas?
