import { z } from "zod";

/** 10 MB per file in the demo (Next server actions carry the body; see next.config.ts). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Extensions that are never accepted, whatever the activity says. */
export const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "scr",
  "js",
  "vbs",
  "ps1",
  "sh",
  "jar",
];

export const UploadInput = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El archivo no tiene nombre")
    .max(200)
    .refine((n) => !n.includes("/") && !n.includes("\\"), "Nombre de archivo inválido"),
  tipo: z.string().max(120),
  // Any byte view: `instanceof` fails across realms (tests, workers), so check the shape instead.
  bytes: z.custom<Uint8Array>((v) => ArrayBuffer.isView(v), "Contenido inválido"),
});
export type UploadInput = z.infer<typeof UploadInput>;

export const StoredFile = z.object({
  key: z.string(),
  nombre: z.string(),
  tamanoBytes: z.number().int().nonnegative(),
  tipo: z.string(),
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  limpio: z.boolean(),
});
export type StoredFile = z.infer<typeof StoredFile>;

export const PresignedUpload = z.object({ key: z.string(), url: z.string(), expira: z.string() });
export type PresignedUpload = z.infer<typeof PresignedUpload>;
