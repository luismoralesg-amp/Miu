# Notas de sesión

- 2026-11-03 · P2-10 hecho: servicios, recursos y `DirectoryPort`; los 3 errores de tipos eran duplicados de iCloud en `.next` y los `alert` del E2E ya estaban acotados. Marca: escudos rotulados como marcas de agua; colores de vista previa alineados a los tokens.
- Falta: subir Next.js 16.4.2 → 16.4.5 (parche de seguridad de noviembre), pendiente de aprobación de Luis.
- Siguiente ítem: P2-11 · E10b · Cátedra del Maestro.
- 2026-11-04 · Next.js 16.4.5 (c19dc47). P2-11 hecho: `/catedra`, sección y libro de notas con `getSectionGradebook`. Lo que se aprendió: en móvil, un `sr-only` dentro de una tabla con scroll ensancha la página si el contenedor no es `relative`.
- Falta: P2-12 en adelante.
- Siguiente ítem: P2-12 · E10c · Publicar y cerrar.
- 2026-11-04 · P2-12 hecho: `/catedra/publicar` y `/catedra/cierre`. Lo que se aprendió: un componente de cliente con estado (`useActionState`) debe seguir montado tras `revalidatePath`, o el aviso de éxito desaparece antes de leerse; en las pruebas, Jorge ve dos secciones con la misma actividad (Discreta A y B), hay que acotar por región.
- Siguiente ítem: P2-13 · E10d · Apelaciones, auditoría y estadísticas de cátedra.
- 2026-11-04 · P2-13 hecho. Lo que se aprendió: cambiar un `<Button type="button">` por uno `submit` en la misma posición durante un clic dispara el envío del formulario (usar `key` distintas); y los componentes con estado deben vivir en una sola lista para sobrevivir al `revalidatePath`.
- Siguiente ítem: P2-14 · E11a · Administración: políticas y roles.
- 2026-11-04 · P2-14 hecho: módulo `policy` y `/admin/{politicas,roles}`. Lo que se aprendió: React 19 reinicia los campos no controlados después de un submit, incluso uno rechazado; los de este formulario son controlados. La política de las cuentas de prueba es por cuenta (Pagos no recibe actor, así que solo lee la compartida).
- Siguiente ítem: P2-15 · E11b · Administración: pagos, conciliación, caja y reembolsos.
- 2026-11-04 · P2-15 hecho: caja, conciliación y reembolsos. Lo que se aprendió: si una acción cambia lo que lista la página (el cargo deja de estar pendiente), la fila con su aviso desaparece al revalidar; en la caja no se revalida.
- Siguiente ítem: P2-16 · E11c · Administración: auditoría, apelaciones y estadísticas.
- 2026-11-04 · P2-16 hecho: auditoría, apelaciones escaladas y estadísticas del Administrativo, con componentes compartidos. Cierra E11. Lo que se aprendió: una ruta de Administración que reutiliza un permiso que también tiene el Maestro debe pedir además `configure_policy`, o el Maestro entra.
- Siguiente ítem: P2-17 · E12a · PWA.
