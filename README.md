# MiU Nuevo

Propuesta de rediseño del portal MiU de la Universidad Francisco Marroquín. Fase 1: front end completo con
adaptadores `mock` detrás de puertos intercambiables. Plan y contexto en [`docs/`](docs/PLAN_FASE1.md).

## Requisitos

- Node **24.22.1** o más nuevo (ver `.nvmrc`).

## Comandos

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + tipos + formato + pruebas unitarias
npm run e2e        # Playwright (claro, oscuro y móvil)
```

Para correr E2E con un Chromium local en vez del de Playwright:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" npm run e2e
```

## Documentos

- [Plan de la Fase 1](docs/PLAN_FASE1.md)
- [Decisiones técnicas](docs/DECISIONES.md)
- [Integraciones pendientes](docs/INTEGRACIONES_PENDIENTES.md)
