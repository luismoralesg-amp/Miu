import { describe, expect, it } from "vitest";

import { student, value } from "@/test/actors";

import { MockAccount } from "./adapters/mock/mock-account";
import { createRealAccount } from "./adapters/real/real-account";
import { maskBirth, maskCui, maskPhone } from "./domain/rules";

describe("masks", () => {
  it("leave only what is needed to recognize the value", () => {
    expect(maskCui("2847 51963 0101")).toBe("•••• ••••• 0101");
    expect(maskBirth("2005-03-14")).toBe("••/••/2005");
    expect(maskPhone("5555-0187")).toBe("••••-0187");
  });
});

describe("AccountPort (mock)", () => {
  it("serves masked data; revealing and editing need a fresh code", async () => {
    const port = new MockAccount();
    const ana = student();
    const p = value(await port.getProfile(ana));
    expect(p).toMatchObject({
      cui: "•••• ••••• 0101",
      nacimiento: "••/••/2005",
      carne: "2024-0187",
    });
    expect(JSON.stringify(p)).not.toContain("2847");
    expect(await port.reveal(ana, "cui", "000000")).toMatchObject({ error: "invalid" });
    const { codigoPrueba } = value(await port.requestStepUp(ana));
    expect(value(await port.reveal(ana, "cui", codigoPrueba!))).toBe("2847 51963 0101");
    expect(await port.reveal(ana, "cui", codigoPrueba!)).toMatchObject({ error: "invalid" });
    const input = {
      telefono: "5555-1234",
      direccion: "Zona 15, Guatemala",
      emergenciaNombre: "Luis López",
      emergenciaTelefono: "5555-9876",
    };
    const c2 = value(await port.requestStepUp(ana)).codigoPrueba!;
    expect(await port.updateContact(ana, { ...input, telefono: "x" }, c2)).toMatchObject({
      error: "invalid",
    });
    expect(value(await port.updateContact(ana, input, c2)).telefono).toBe("5555-1234");
  });

  it("privacy starts all off except notices; Drive needs explicit consent", async () => {
    const port = new MockAccount();
    const ana = student();
    expect(value(await port.getPrivacy(ana))).toEqual({
      directorio: false,
      foto: false,
      horario: false,
      correoAvisos: true,
    });
    expect(value(await port.getDrive(ana))).toEqual({ conectado: false, archivos: [] });
    expect(value(await port.setDriveConsent(ana, true)).archivos).toHaveLength(3);
    expect(await createRealAccount().getProfile(ana)).toMatchObject({ error: "unavailable" });
  });
});
