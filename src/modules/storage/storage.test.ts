import { describe, expect, it } from "vitest";

import { student, value } from "@/test/actors";

import { MockStorage } from "./adapters/mock/mock-storage";
import { createRealStorage } from "./adapters/real/real-storage";
import { looksInfected, rejectReason, sha256Hex } from "./domain/rules";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("receipt fingerprint", () => {
  it("is the SHA-256 of the exact bytes (FIPS 180-2 test vectors)", () => {
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Hex(bytes("abc"))).toBe(sha256Hex("abc"));
    expect(sha256Hex("abc ")).not.toBe(sha256Hex("abc"));
  });
});

describe("upload rules", () => {
  it("rejects empty, too large and executable files", () => {
    expect(rejectReason("tarea.pdf", 0)).toBe("El archivo está vacío");
    expect(rejectReason("tarea.pdf", 11 * 1024 * 1024)).toBe("El archivo pesa más de 10 MB");
    expect(rejectReason("tarea.EXE", 10)).toBe("Ese tipo de archivo no se acepta por seguridad");
    expect(rejectReason("llaves.zip", 2048)).toBeNull();
  });

  it("flags the EICAR test file", () => {
    expect(looksInfected(bytes("hola"))).toBe(false);
    expect(
      looksInfected(bytes("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*")),
    ).toBe(true);
  });
});

describe("StoragePort (mock)", () => {
  it("put stores, fingerprints and scans; only the owner reads it back", async () => {
    const port = new MockStorage();
    const ana = student();
    const f = value(
      await port.put(ana, { nombre: "llaves.zip", tipo: "application/zip", bytes: bytes("abc") }),
    );
    expect(f).toMatchObject({
      nombre: "llaves.zip",
      tamanoBytes: 3,
      limpio: true,
      hash: sha256Hex("abc"),
    });
    expect(value(await port.hash(ana, f.key))).toBe(f.hash);
    expect(value(await port.scan(ana, f.key))).toEqual({ limpio: true });
    expect(await port.hash(student(), f.key)).toMatchObject({ error: "not_found" });
  });

  it("put refuses infected and blocked files", async () => {
    const port = new MockStorage();
    const eicar = bytes("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");
    expect(
      await port.put(student(), { nombre: "x.txt", tipo: "text/plain", bytes: eicar }),
    ).toMatchObject({
      error: "invalid",
    });
    expect(
      await port.put(student(), { nombre: "../x.pdf", tipo: "", bytes: bytes("a") }),
    ).toMatchObject({
      error: "invalid",
    });
    expect(
      await port.presignUpload(student(), { nombre: "a.exe", tamanoBytes: 3, tipo: "" }),
    ).toMatchObject({
      error: "invalid",
    });
    expect(
      value(await port.presignUpload(student(), { nombre: "a.pdf", tamanoBytes: 3, tipo: "" })).url,
    ).toMatch(/^\/api\/almacenamiento\//);
  });

  it("the real adapter answers unavailable", async () => {
    expect(await createRealStorage().hash(student(), "x")).toMatchObject({ error: "unavailable" });
  });
});
