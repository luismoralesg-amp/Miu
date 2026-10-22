# Referencia visual: reel "Dashboard V14" (Vaulta)

El archivo `reel.mp4` está en esta misma carpeta. Es un dashboard financiero ficticio llamado "Vaulta". **Copia los
patrones visuales, no el contenido.**

## Layout
- Encabezado superior con logo, navegación, buscador, notificaciones y perfil.
- Cuadrícula **bento** asimétrica, con tarjetas de distintos anchos.
- Densidad baja a media: padding de tarjeta de unos 24px y gaps de unos 12px.
- Radios de unos 16px. Sombra muy suave en modo claro y borde de 1px sutil en modo oscuro.

## Paleta
- **Modo claro:** fondo `#F9FAFB`, tarjeta `#FFFFFF`, texto `#111827`, texto secundario `#64748B`.
- **Modo oscuro:** fondo `#09090B`, tarjeta `#18181B`, borde `#27272A`, texto secundario `#A1A1AA`.
- **Acento de la referencia:** degradado naranja `#FF512F` → `#F09819`, usado con moderación.
- **Semánticos:** verde y rojo.
- **Decisión abierta:** proponer también una variante con el **rojo institucional de la UFM** y comparar ambas
  lado a lado.

## Tipografía
- Sans geométrica (Inter o similar).
- El dato principal, enorme y en negrita; las etiquetas, pequeñas y apagadas.

## Movimiento
- Skeleton que se transforma en contenido con fade y slide-up escalonado.
- Duración de 300–400 ms con sensación de resorte.
- Cambio claro/oscuro instantáneo.
- Respetar `prefers-reduced-motion`.

## Stack
React + Tailwind + framer-motion + lucide-react (íconos de trazo uniforme), compatible con Next.js.

## Traducción a MiU
- El saldo grande pasa a ser el promedio o los créditos/UMA ganados.
- La tabla de actividad pasa a ser los pendientes y las notas recientes.
- La gráfica pasa a ser el rendimiento del semestre.
- Mensajes pasa a ser la comunicación con catedráticos y auxiliares.
- La tarjeta destacada pasa a ser lo próximo importante (examen o pago).
