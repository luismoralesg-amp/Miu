# Notas de sesión

- 2026-11-03 · P2-10 hecho: servicios, recursos y `DirectoryPort`; los 3 errores de tipos eran duplicados de iCloud en `.next` y los `alert` del E2E ya estaban acotados. Marca: escudos rotulados como marcas de agua; colores de vista previa alineados a los tokens.
- Falta: subir Next.js 16.4.2 → 16.4.5 (parche de seguridad de noviembre), pendiente de aprobación de Luis.
- Siguiente ítem: P2-11 · E10b · Cátedra del Maestro.
- 2026-11-04 · Next.js 16.4.5 (c19dc47). P2-11 hecho: `/catedra`, sección y libro de notas con `getSectionGradebook`. Lo que se aprendió: en móvil, un `sr-only` dentro de una tabla con scroll ensancha la página si el contenedor no es `relative`.
- Falta: P2-12 en adelante.
- Siguiente ítem: P2-12 · E10c · Publicar y cerrar.
- 2026-11-04 · P2-12 hecho: `/catedra/publicar` y `/catedra/cierre`. Lo que se aprendió: un componente de cliente con estado (`useActionState`) debe seguir montado tras `revalidatePath`, o el aviso de éxito desaparece antes de leerse; en las pruebas, Jorge ve dos secciones con la misma actividad (Discreta A y B), hay que acotar por región.
- Siguiente ítem: P2-13 · E10d · Apelaciones, auditoría y estadísticas de cátedra.
