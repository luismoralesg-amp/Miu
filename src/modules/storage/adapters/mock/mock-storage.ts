import { randomUUID } from "node:crypto";

import { academicNow } from "@/lib/clock";
import { parsed } from "@/lib/contract";
import { fail, ok, type PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import { looksInfected, rejectReason, sha256Hex } from "../../domain/rules";
import { PresignedUpload, StoredFile, UploadInput } from "../../domain/types";
import type { StoragePort } from "../../ports/storage-port";

type Blob = { owner: string; file: StoredFile; bytes: Uint8Array };

/** Files in memory, per owner. A file that fails the scan is kept out and reported as invalid. */
export class MockStorage implements StoragePort {
  private readonly files = new Map<string, Blob>();

  async presignUpload(actor: Actor, input: { nombre: string; tamanoBytes: number; tipo: string }) {
    const reason = rejectReason(input.nombre, input.tamanoBytes);
    if (reason) return fail("invalid", reason);
    const key = `${actor.userId}/${randomUUID()}`;
    return parsed(PresignedUpload, {
      key,
      url: `/api/almacenamiento/${encodeURIComponent(key)}`,
      expira: new Date(academicNow().getTime() + 15 * 60_000).toISOString(),
    });
  }

  async put(actor: Actor, input: UploadInput): PortResult<StoredFile> {
    const body = UploadInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const { nombre, tipo, bytes } = body.data;
    const reason = rejectReason(nombre, bytes.byteLength);
    if (reason) return fail("invalid", reason);
    if (looksInfected(bytes))
      return fail("invalid", "El antivirus detectó un problema en el archivo");
    const key = `${actor.userId}/${randomUUID()}`;
    const file = {
      key,
      nombre,
      tamanoBytes: bytes.byteLength,
      tipo: tipo || "application/octet-stream",
      hash: sha256Hex(bytes),
      limpio: true,
    };
    this.files.set(key, { owner: actor.userId, file, bytes });
    return parsed(StoredFile, file);
  }

  async hash(actor: Actor, key: string) {
    const f = this.files.get(key);
    if (!f || f.owner !== actor.userId) return fail("not_found");
    return ok(f.file.hash);
  }

  async scan(actor: Actor, key: string) {
    const f = this.files.get(key);
    if (!f || f.owner !== actor.userId) return fail("not_found");
    return ok({ limpio: !looksInfected(f.bytes) });
  }
}
