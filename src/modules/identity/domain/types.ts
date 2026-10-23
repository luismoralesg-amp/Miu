export const roles = ["estudiante", "maestro", "auxiliar", "administrativo"] as const;
export type Role = (typeof roles)[number];

export const roleLabel: Record<Role, string> = {
  estudiante: "Estudiante",
  maestro: "Maestro",
  auxiliar: "Auxiliar",
  administrativo: "Administrativo",
};

export type User = {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: Role;
};

export type Credential = "sesion" | "passkey";

export type Device = {
  id: string;
  userId: string;
  nombre: string;
  navegador: string;
  lugar: string;
  credencial: Credential;
  /** ISO timestamp of the last request from this device. */
  ultimaVez: string;
  /** ISO timestamp of when the device was first used. */
  desde: string;
};

export type Session = {
  id: string;
  userId: string;
  deviceId: string;
  creada: string;
  expira: string;
  /** Role override, only settable through the development role switcher. */
  rolActivo?: Role;
};

export type MailMessage = {
  para: string;
  asunto: string;
  codigo: string;
  enlace: string;
  enviado: string;
};

/** Errors a sign-in step can return. Messages never reveal whether an account exists. */
export type IdentityError =
  | "dominio"
  | "codigo_incorrecto"
  | "codigo_vencido"
  | "bloqueado"
  | "enlace_invalido"
  | "espera"
  | "sin_passkey"
  | "google_rechazado"
  | "sesion_invalida"
  | "no_encontrado"
  | "no_configurado";
