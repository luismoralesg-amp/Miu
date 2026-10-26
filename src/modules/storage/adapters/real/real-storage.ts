import { notConnected } from "@/lib/not-connected";

import type { StoragePort } from "../../ports/storage-port";

/**
 * To connect: an S3-compatible bucket (presigned PUT with content-length and type), a scan step
 * (ClamAV or the provider's) before the file is linked to a submission, and SHA-256 computed on the
 * stored object.
 */
export const createRealStorage = () => notConnected<StoragePort>("Almacenamiento S3");
