import { fail } from "@/lib/result";

import type { IdentityPort } from "../../ports/identity-port";

/**
 * Real identity adapter: empty on purpose. To activate (see docs/INTEGRACIONES_PENDIENTES.md):
 * - Google OIDC: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET for the UFM Workspace; verify the ID token
 *   signature, then `acceptGoogleClaims` from domain/rules.ts (hd = ufm.edu checked on the server).
 * - Email codes and links: an email provider able to send from an ufm.edu domain.
 * - Passkeys: WebAuthn relying party ID for the production host.
 * - Sessions and devices: a persistent store (PostgreSQL in the backend phase).
 * Then set MIU_ADAPTER_IDENTITY=real.
 */
const notConfigured = async () => fail("no_configurado" as const);

export class RealIdentity implements IdentityPort {
  startEmailSignIn = notConfigured;
  verifyCode = notConfigured;
  peekMagicLink = notConfigured;
  consumeMagicLink = notConfigured;
  signInWithGoogle = notConfigured;
  signInWithPasskey = notConfigured;
  getSession = notConfigured;
  async signOut() {}
  async listDevices() {
    return [];
  }
  revokeDevice = notConfigured;
  registerPasskey = notConfigured;
  setActiveRole = notConfigured;
  async outbox() {
    return [];
  }
}
