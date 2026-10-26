import type { PortResult } from "@/lib/result";
import type { Actor } from "@/modules/identity";

import type { PresignedUpload, StoredFile, UploadInput } from "../domain/types";

/**
 * Files people hand in. `real` is S3-compatible storage with presigned uploads and an antivirus scan
 * before a file is accepted; `mock` keeps the bytes in memory.
 */
export interface StoragePort {
  presignUpload(
    actor: Actor,
    input: { nombre: string; tamanoBytes: number; tipo: string },
  ): PortResult<PresignedUpload>;
  /** Stores, fingerprints and scans a file in one step (the demo path, through a server action). */
  put(actor: Actor, input: UploadInput): PortResult<StoredFile>;
  hash(actor: Actor, key: string): PortResult<string>;
  scan(actor: Actor, key: string): PortResult<{ limpio: boolean }>;
}
