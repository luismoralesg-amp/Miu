# Reporte de etapa E2 · Shell, entrada y dispositivos

Fecha: 2026-10-22 · Node 24.22.1 · Identidad visual: P1 Editorial (ronda de diseño 3, aprobada)

## Qué se construyó

- **Identidad P1 en el código:** lienzo cálido, Fraunces autoalojada (OFL) para títulos y cifras, reglas finas y
  colores por curso validados (`CourseDot`).
- **`IdentityPort`** con adaptador `mock` en memoria y adaptador `real` vacío (`src/modules/identity/`):
  - código de 6 dígitos y enlace mágico de un solo uso (vencen en 10 min; 5 intentos; reenvío cada 30 s);
  - Google limitado a @ufm.edu, con validación de claims en el servidor;
  - passkey ligada al dispositivo;
  - sesiones y dispositivos revocables.
- **Entrada** (`/login`, `/login/codigo`, `/login/enlace`, `/login/ayuda`):
  - un solo campo; el código lleva `autocomplete="one-time-code"` y se envía solo con el sexto dígito;
  - "recordar este dispositivo";
  - el enlace pide confirmar antes de entrar, para que los escáneres de correo no lo consuman;
  - el correo pendiente viaja en una cookie HttpOnly, nunca en la URL.
- **Shell:**
  - encabezado P1 y barra inferior en móvil;
  - "Más" agrupa todas las funciones de MiU: panel en escritorio, hoja en móvil;
  - todas las secciones tienen ya su URL; las pendientes dicen en qué etapa llegan;
  - menú de cuenta con tema y cierre de sesión;
  - la navegación cambia según el rol.
- **⌘K real:** combobox ARIA con lista agrupada (`aria-activedescendant`), conteo de resultados para lectores de
  pantalla y teclado completo (↑ ↓ Inicio Fin Enter Esc). Ejecuta acciones: pagar, entregar, ver el horario, simular
  una nota.
- **Centro de avisos:** la campana y la lista salen de la misma fuente, con "marcar todo como leído".
- **`/cuenta/dispositivos`:** sesiones activas, cierre remoto con confirmación y registro de passkey (mock).
- **Selector de rol** (solo con `MIU_DEV_TOOLS`) dentro del menú de cuenta.

## Capturas

En esta carpeta, `<pantalla>-light.png`, `-dark.png` y `-mobile.png`: `login`, `login-codigo`, `login-enlace`, `hoy`,
`mas`, `cmdk`, `avisos`, `dispositivos`, `seccion-pendiente` y `rol-auxiliar`. Se regeneran con
`CAPTURE=E2 npm run e2e -- capture-e2 --workers=1`.

**Login · propuesta de diseño:** se diseñó directamente con los componentes de P1 en lugar de una maqueta aparte. Queda
como propuesta para tu revisión (`login-*.png`).

## Pruebas

| Tipo | Resultado |
|---|---|
| Unitarias y de componentes | 176 de 176. Incluyen contraste de los tokens P1 y de los colores por curso, y reglas de identidad (dominio, intentos, vencimiento, enlace de un uso, claims de Google, passkey y revocación) |
| E2E (claro, oscuro y móvil) | 54 de 54. Cubren: entrada con código, con enlace, correo ajeno rechazado, código erróneo con intentos restantes, ⌘K solo con teclado, panel "Más", revocar otro dispositivo (la otra sesión queda cerrada), axe WCAG 2.2 AA y CSP |
| Lint, tipos, formato y build | Sin errores |

## Skills

| Skill | Uso |
|---|---|
| find-skills | No hizo falta: los patrones de combobox y de código de un solo uso están cubiertos por WAI-ARIA APG y las skills instaladas |
| apple-design | Entrada con un solo foco por pantalla; el código se envía al sexto dígito; `one-time-code` para autocompletar desde SMS o correo |
| emil-design-eng | Avisos, cuenta y "Más" escalan desde su disparador (180 ms de entrada, 120 ms de salida, interrumpibles con transiciones CSS). La hoja móvil usa la curva de cajón. ⌘K abre sin animación porque es un atajo frecuente. Con reduced motion solo queda el fade |
| impeccable | Auditoría de las capturas. Se corrigió: dispositivo repetido en su propia línea, dispositivos duplicados al volver a entrar, selector de rol flotante que tapaba contenido, "Enviar otro código" desalineado y texto de ⌘K en móvil |

## Crítica honesta

1. **Sesiones en memoria.** Reiniciar el servidor cierra todas las sesiones, y dos pestañas que piden código para el
   mismo correo a la vez comparten el código. Es aceptable para el mock; la base de datos llega en la fase de backend.
2. **Google y passkeys son simulados.** El botón de Google entra directo como la estudiante demo, y la passkey no
   ejecuta WebAuthn. Las validaciones reales (claims de Google) sí están implementadas y probadas, pero falta la
   ceremonia.
3. **"Hoy" sigue siendo un placeholder** (llega en E4), así que el shell todavía no se ve con contenido real denso.

## Supuestos

- (Hecho) La comisión de tarjeta no se aplica en código.
- (Supuesto) La recuperación sin acceso al correo es presencial (ARQUITECTURA §4.2).
- (Supuesto) La ubicación de los dispositivos es fija ("Ciudad de Guatemala") hasta tener datos del borde.
