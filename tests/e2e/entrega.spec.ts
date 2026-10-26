import { createHash } from "node:crypto";

import { expect, test } from "@playwright/test";

import { expectAccessible } from "./a11y";
import { signIn, testEmail } from "./helpers";

const ZIP = Buffer.from("PK\u0003\u0004 llaves: function balanced(s) { /* … */ }");

test("ver y entregar tarea (PLAN §8 E5)", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  const badge = Number(await page.getByTestId("campana-numero").textContent());
  await page
    .getByRole("region", { name: "Por entregar" })
    .getByRole("link", { name: /Ejercicio de llaves/ })
    .click();
  await expect(page).toHaveURL(
    /\/cursos\/paradigmas-de-programacion\/actividades\/pp-ejercicio-llaves$/,
  );
  await expect(page.getByRole("heading", { name: "Ejercicio de llaves" })).toBeVisible();
  const rubric = page.getByRole("table", { name: "Criterios de evaluación y su peso" });
  await expect(rubric.getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Entregar", exact: true })).toBeDisabled();
  await expectAccessible(page);

  await page.getByLabel("Archivo para entregar").setInputFiles({
    name: "llaves.exe",
    mimeType: "application/octet-stream",
    buffer: ZIP,
  });
  await page.getByRole("button", { name: "Entregar", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Ese tipo de archivo no se acepta por seguridad" }),
  ).toBeVisible();

  await page
    .getByLabel("Archivo para entregar")
    .setInputFiles({ name: "llaves.zip", mimeType: "application/zip", buffer: ZIP });
  await expect(page.getByText("llaves.zip")).toBeVisible();
  await page.getByRole("button", { name: "Entregar", exact: true }).click();

  const receipt = page.getByTestId("recibo");
  await expect(receipt.getByRole("heading", { name: "Entregado" })).toBeVisible();
  const hash = createHash("sha256").update(ZIP).digest("hex");
  await expect(receipt.getByText(hash)).toBeVisible();
  await expect(receipt.getByText(`MIU-E-${hash.slice(0, 8).toUpperCase()}`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Reemplazar entrega" })).toBeVisible();
  await expect(page.getByTestId("campana-numero")).toHaveText(String(badge - 1));
  await expectAccessible(page);

  const ics = page.waitForEvent("download");
  await page.getByRole("link", { name: "Agregar a mi calendario (.ics)" }).click();
  expect((await ics).suggestedFilename()).toBe("pp-ejercicio-llaves.ics");

  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Por entregar" }).getByText("Ejercicio de llaves"),
  ).toHaveCount(0);
});

test("a reading is handed in as text, with a minimum length", async ({ page }, info) => {
  await signIn(page, testEmail(info.project.name));
  await page.goto("/cursos/etica-de-la-libertad/actividades/el-lectura-hayek-3");
  const box = page.getByLabel("Tu respuesta");
  await box.fill("Muy corto.");
  await expect(page.getByRole("button", { name: "Entregar", exact: true })).toBeDisabled();
  await box.fill(
    "Hayek sostiene que el orden espontáneo surge de la acción humana pero no del diseño humano, y que ninguna autoridad central puede reunir el conocimiento disperso que usan millones de personas al decidir.",
  );
  await expect(page.getByText(/palabras · Comentario de 300 palabras/)).toBeVisible();
  await page.getByRole("button", { name: "Entregar", exact: true }).click();
  await expect(page.getByTestId("recibo").getByText("comentario.txt")).toBeVisible();
});
