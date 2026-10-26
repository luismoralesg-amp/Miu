import { z } from "zod";

export const Profile = z.object({
  nombre: z.string(),
  apellido: z.string(),
  carne: z.string(),
  correo: z.string(),
  carrera: z.string(),
  telefono: z.string(),
  direccion: z.string(),
  contactoEmergencia: z.object({ nombre: z.string(), telefono: z.string() }),
  /** Masked on the server: the full value never reaches the page unless revealed with step-up. */
  cui: z.string(),
  nacimiento: z.string(),
});
export type Profile = z.infer<typeof Profile>;

export const SensitiveField = z.enum(["cui", "nacimiento"]);
export type SensitiveField = z.infer<typeof SensitiveField>;

export const ContactInput = z.object({
  telefono: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,16}$/, "Escribe un teléfono válido"),
  direccion: z.string().trim().min(5, "Escribe la dirección completa").max(200),
  emergenciaNombre: z.string().trim().min(3, "Escribe el nombre del contacto").max(80),
  emergenciaTelefono: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,16}$/, "Escribe un teléfono válido"),
});
export type ContactInput = z.infer<typeof ContactInput>;

export const Privacy = z.object({
  directorio: z.boolean(),
  foto: z.boolean(),
  horario: z.boolean(),
  correoAvisos: z.boolean(),
});
export type Privacy = z.infer<typeof Privacy>;

export const DriveFile = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: z.string(),
  modificado: z.string(),
});
export const Drive = z.object({ conectado: z.boolean(), archivos: z.array(DriveFile) });
export type Drive = z.infer<typeof Drive>;
