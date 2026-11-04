import { expect, test } from "@playwright/test";

import { NAV, SECTIONS } from "../../src/shell/navigation";

import { expectAccessible, watchCsp } from "./a11y";
import { signIn, switchRole, testEmail } from "./helpers";

type RoleName = "estudiante" | "maestro" | "auxiliar" | "administrativo";

/** Detail screens the navigation doesn't list, one or two per role, so every kind of page is covered. */
const DETAIL: Record<RoleName, string[]> = {
  estudiante: [
    "/cursos/matematica-discreta",
    "/cursos/matematica-discreta/documentos",
    "/cursos/etica-de-la-libertad/enlaces",
    "/cursos/matematica-discreta/blog",
    "/cursos/paradigmas-de-programacion/actividades/pp-ejercicio-llaves",
    "/pagos/pagar/cuota-noviembre",
    "/pagos/recibos",
    "/pagos/estado-de-cuenta",
    "/conferencias/mis-reservas",
    "/servicios/graduaciones",
    "/comunicacion",
    "/horario",
    "/offline.html",
  ],
  maestro: [
    "/catedra/secciones/md-a",
    "/catedra/libro/md-a",
    "/catedra/por-calificar?seccion=md-a&actividad=md-tarea-4",
  ],
  auxiliar: [
    "/catedra/por-calificar?seccion=pp-a&actividad=pp-actividad-6",
    "/catedra/secciones/pp-a",
  ],
  administrativo: [
    "/admin/pagos/caja?carne=2024-0187",
    "/admin/pagos/conciliacion",
    "/admin/pagos/reembolsos",
  ],
};

/** Every internal section the role's navigation shows, from the same table the app uses. */
function routesOf(role: RoleName) {
  const nav = NAV[role];
  const keys = new Set([...nav.barra, ...nav.movil, ...nav.mas.flatMap(([, k]) => k)]);
  const paths = [...keys].flatMap((k) => (SECTIONS[k].externo ? [] : [SECTIONS[k].path]));
  return [...new Set([...paths, ...DETAIL[role]])];
}

for (const role of ["estudiante", "maestro", "auxiliar", "administrativo"] as const) {
  test(`axe finds nothing on any screen of the ${role}`, async ({ page }, info) => {
    test.setTimeout(300_000);
    const csp = watchCsp(page);
    await signIn(page, testEmail(info.project.name));
    if (role !== "estudiante") await switchRole(page, role);
    const failures: string[] = [];
    for (const path of routesOf(role)) {
      const res = await page.goto(path);
      if (!res || res.status() >= 400) {
        failures.push(`${path}: ${res?.status()}`);
        continue;
      }
      try {
        await expectAccessible(page);
      } catch (e) {
        failures.push(`${path}: ${(e as Error).message.split("\n").slice(0, 6).join(" ")}`);
      }
    }
    expect(failures, failures.join("\n")).toEqual([]);
    expect(csp).toEqual([]);
  });
}

test("every control can be reached and seen with the keyboard alone", async ({ page }, info) => {
  test.skip(
    info.project.name === "mobile",
    "Tab order is a desktop concern; touch uses the bottom bar",
  );
  await signIn(page, testEmail(info.project.name));
  await page.goto("/");
  // The first stop is the skip link, and using it lands in the content.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#/);

  // Walking the page: every stop shows where the focus is (outline or ring), and nothing traps it.
  for (const path of ["/cursos", "/notas", "/pagos", "/bandeja", "/semana"]) {
    await page.goto(path);
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const s = getComputedStyle(el);
        const visible =
          (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none";
        return {
          id: `${el.tagName}:${el.textContent?.trim().slice(0, 30)}:${el.getAttribute("href")}`,
          visible,
          body: el === document.body,
        };
      });
      if (stop.body) break;
      expect(stop.visible, `${path}: focus not visible on ${stop.id}`).toBe(true);
      seen.add(stop.id);
    }
    expect(seen.size, path).toBeGreaterThan(8);
  }
});
