import type { Result } from "@/lib/result";

import type { Device, IdentityError, MailMessage, Role, Session, User } from "../domain/types";

/** `deviceId` is this browser's id from a long-lived cookie, so signing in again reuses its device. */
export type ClientInfo = { userAgent: string; lugar: string; deviceId?: string | undefined };

export type SignedIn = { session: Session; user: User };

/**
 * Everything the app needs from identity. `mock` implements it in memory with fictitious users;
 * `real` wires Google OIDC, an email provider and WebAuthn (see docs/INTEGRACIONES_PENDIENTES.md).
 */
export interface IdentityPort {
  /** Sends a 6-digit code and a magic link. Same answer whether or not the account exists. */
  startEmailSignIn(
    email: string,
  ): Promise<Result<{ expira: string; reenviarDesde: string }, IdentityError>>;
  verifyCode(
    email: string,
    code: string,
    client: ClientInfo,
    recordar: boolean,
  ): Promise<Result<SignedIn, IdentityError>>;
  /** Returns who the link belongs to without consuming it (the confirmation page shows it). */
  peekMagicLink(token: string): Promise<Result<{ correo: string }, IdentityError>>;
  consumeMagicLink(
    token: string,
    client: ClientInfo,
    recordar: boolean,
  ): Promise<Result<SignedIn, IdentityError>>;
  signInWithGoogle(client: ClientInfo): Promise<Result<SignedIn, IdentityError>>;
  /** Passkey assertion bound to a device this browser already registered. */
  signInWithPasskey(
    deviceId: string | undefined,
    client: ClientInfo,
  ): Promise<Result<SignedIn, IdentityError>>;

  getSession(sessionId: string): Promise<Result<SignedIn, IdentityError>>;
  signOut(sessionId: string): Promise<void>;
  listDevices(userId: string): Promise<Device[]>;
  /** Ends every session of that device. A user may only revoke their own devices. */
  revokeDevice(
    userId: string,
    deviceId: string,
  ): Promise<Result<{ sesionesCerradas: number }, IdentityError>>;
  registerPasskey(userId: string, deviceId: string): Promise<Result<Device, IdentityError>>;

  /**
   * Development only: role switcher. The answer carries the session id to store from now on: in the
   * mock the role travels inside the signed cookie, so the old id keeps the old role.
   */
  setActiveRole(sessionId: string, role: Role): Promise<Result<Session, IdentityError>>;
  /**
   * Development only: the mock outbox, so codes and links can be read without real email. With the
   * address waiting for its code, the mock answers even when another server instance sent it.
   */
  outbox(correo?: string): Promise<MailMessage[]>;
}
