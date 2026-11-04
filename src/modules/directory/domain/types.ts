import { z } from "zod";

export const MIN_QUERY = 3;

export const DirectoryEntry = z.object({
  id: z.string(),
  nombre: z.string(),
  rol: z.string(),
  correo: z.string(),
});
export type DirectoryEntry = z.infer<typeof DirectoryEntry>;

export const Office = z.object({
  id: z.string(),
  nombre: z.string(),
  ubicacion: z.string(),
  telefono: z.string(),
  correo: z.string(),
  horario: z.string(),
});
export type Office = z.infer<typeof Office>;

export const CampusEvent = z.object({
  id: z.string(),
  titulo: z.string(),
  fecha: z.string(),
  lugar: z.string(),
  tipo: z.string(),
});
export type CampusEvent = z.infer<typeof CampusEvent>;
