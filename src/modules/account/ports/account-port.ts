import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { ContactInput, Drive, Privacy, Profile, SensitiveField } from "../domain/types";

/** The person's own data, privacy and connected files (`real`: MiU profile + GoogleWorkspacePort). */
export interface AccountPort {
  getProfile(actor: Actor): PortResult<Profile>;
  requestStepUp(actor: Actor): PortResult<{ expira: string; codigoPrueba?: string }>;
  reveal(actor: Actor, field: SensitiveField, codigo: string): PortResult<string>;
  updateContact(actor: Actor, input: ContactInput, codigo: string): PortResult<Profile>;
  getPrivacy(actor: Actor): PortResult<Privacy>;
  setPrivacy(actor: Actor, privacy: Privacy): PortResult<Privacy>;
  getDrive(actor: Actor): PortResult<Drive>;
  setDriveConsent(actor: Actor, granted: boolean): PortResult<Drive>;
}
