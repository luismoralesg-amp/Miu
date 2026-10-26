import { test, type Page } from "@playwright/test";

import { DEMO, waitForAnimations } from "./helpers";

/**
 * Report screenshots per stage: `CAPTURE=E4 npm run e2e -- capture-screens --workers=1` (una sola cuenta demo por rol: el código tiene 30 s de espera entre envíos).
 * Each screen is taken in the three projects (light, dark, mobile) as `<name>-<project>.png`.
 */
type Shot = {
  name: string;
  /** Delivery screenshots go to docs/entrega/capturas/<carpeta>/. */
  carpeta?: string;
  path: string;
  as: keyof typeof DEMO;
  prepare?: (page: Page) => Promise<void>;
  /** Screens that change data sign in with a fresh test account, so the demo account stays intact. */
  fresh?: boolean;
};

const STAGES: Record<string, Shot[]> = {
  E4: [
    { name: "hoy", path: "/", as: "estudiante" },
    { name: "hoy-auxiliar", path: "/", as: "auxiliar" },
    { name: "hoy-maestro", path: "/", as: "maestro" },
    { name: "hoy-administrativo", path: "/", as: "administrativo" },
    { name: "bandeja", path: "/bandeja", as: "estudiante" },
    { name: "bandeja-auxiliar", path: "/bandeja", as: "auxiliar" },
    {
      name: "campana",
      path: "/",
      as: "estudiante",
      prepare: async (page) => {
        await page.getByRole("button", { name: /^Bandeja/ }).click();
        await page.getByRole("dialog", { name: "Bandeja" }).waitFor();
      },
    },
  ],
  E5: [
    { name: "cursos", path: "/cursos", as: "estudiante" },
    {
      name: "cursos-busqueda",
      path: "/cursos?q=castillo",
      as: "estudiante",
    },
    { name: "curso", path: "/cursos/matematica-discreta", as: "estudiante" },
    {
      name: "curso-actividades",
      path: "/cursos/paradigmas-de-programacion/actividades",
      as: "estudiante",
    },
    { name: "curso-documentos", path: "/cursos/matematica-discreta/documentos", as: "estudiante" },
    { name: "curso-vacio", path: "/cursos/etica-de-la-libertad/enlaces", as: "estudiante" },
    { name: "curso-no-habilitado", path: "/cursos/matematica-discreta/blog", as: "estudiante" },
    {
      name: "actividad",
      path: "/cursos/paradigmas-de-programacion/actividades/pp-ejercicio-llaves",
      as: "estudiante",
    },
    {
      name: "actividad-recibo",
      path: "/cursos/matematica-discreta/actividades/md-tarea-4",
      as: "estudiante",
    },
    {
      name: "actividad-calificada",
      path: "/cursos/matematica-discreta/actividades/md-quiz-3",
      as: "estudiante",
    },
  ],
  E6: [
    { name: "notas", path: "/notas", as: "estudiante" },
    { name: "semana", path: "/semana", as: "estudiante" },
    { name: "horario", path: "/horario", as: "estudiante" },
    { name: "pensum", path: "/pensum", as: "estudiante" },
    { name: "historial", path: "/historial", as: "estudiante" },
    {
      name: "pensum-seleccion",
      path: "/pensum",
      as: "estudiante",
      prepare: async (page) => {
        await page
          .getByRole("button", { name: /Paradigmas de Programación/ })
          .filter({ visible: true })
          .click();
      },
    },
  ],
  entrega: [
    ...(
      [
        ["hoy", "/"],
        ["bandeja", "/bandeja"],
        ["cursos", "/cursos"],
        ["curso", "/cursos/matematica-discreta"],
        ["actividad", "/cursos/paradigmas-de-programacion/actividades/pp-ejercicio-llaves"],
        ["semana", "/semana"],
        ["horario", "/horario"],
        ["notas", "/notas"],
        ["pagos", "/pagos"],
        ["pagar", "/pagos/pagar/cuota-noviembre"],
        ["estado-de-cuenta", "/pagos/estado-de-cuenta"],
      ] as const
    ).map(([name, path]) => ({ name, path, as: "estudiante" as const, carpeta: "estudiante" })),
    ...(
      [
        ["hoy", "/"],
        ["por-calificar", "/catedra/por-calificar"],
        ["lote", "/catedra/por-calificar?seccion=md-a&actividad=md-tarea-4"],
      ] as const
    ).map(([name, path]) => ({ name, path, as: "maestro" as const, carpeta: "maestro" })),
    ...(
      [
        ["hoy", "/"],
        ["por-calificar", "/catedra/por-calificar"],
        ["lote", "/catedra/por-calificar?seccion=pp-a&actividad=pp-actividad-6"],
        ["bandeja", "/bandeja"],
      ] as const
    ).map(([name, path]) => ({ name, path, as: "auxiliar" as const, carpeta: "auxiliar" })),
    ...(
      [
        ["hoy", "/"],
        ["bandeja", "/bandeja"],
      ] as const
    ).map(([name, path]) => ({
      name,
      path,
      as: "administrativo" as const,
      carpeta: "administrativo",
    })),
  ],
  CMDK: [
    {
      name: "cmdk",
      path: "/",
      as: "estudiante",
      prepare: async (page) => {
        await page.getByRole("button", { name: "Buscar o hacer algo" }).click();
        await page.getByRole("combobox", { name: "Buscar o hacer algo" }).pressSequentially("pa");
      },
    },
    {
      name: "cmdk-auxiliar",
      path: "/",
      as: "auxiliar",
      prepare: async (page) => {
        await page.getByRole("button", { name: "Buscar o hacer algo" }).click();
        await page.getByRole("combobox", { name: "Buscar o hacer algo" }).pressSequentially("cal");
      },
    },
  ],
  E10: [
    { name: "por-calificar", path: "/catedra/por-calificar", as: "auxiliar" },
    {
      name: "lote",
      path: "/catedra/por-calificar?seccion=pp-a&actividad=pp-actividad-6",
      as: "auxiliar",
    },
  ],
  E8: [
    { name: "conferencias", path: "/conferencias", as: "estudiante" },
    { name: "mis-reservas", path: "/conferencias/mis-reservas", as: "estudiante" },
    { name: "evaluacion", path: "/conferencias/historia-moneda/evaluacion", as: "estudiante" },
    {
      name: "asignacion",
      path: "/asignacion",
      as: "estudiante",
      prepare: async (page) => {
        await page.getByRole("checkbox", { name: /Redes de computadoras/ }).check();
        await page.getByRole("checkbox", { name: /Inteligencia artificial/ }).check();
      },
    },
  ],
  E11: [{ name: "admin-pagos", path: "/admin/pagos", as: "administrativo" }],
  E7: [
    { name: "pagos", path: "/pagos", as: "estudiante" },
    { name: "pagar", path: "/pagos/pagar/cuota-noviembre", as: "estudiante" },
    { name: "recibos", path: "/pagos/recibos", as: "estudiante" },
    { name: "estado-de-cuenta", path: "/pagos/estado-de-cuenta", as: "estudiante" },
    {
      name: "pagar-checkout",
      path: "/pagos/pagar/cuota-noviembre",
      as: "estudiante",
      fresh: true,
      prepare: async (page) => {
        await page.getByRole("button", { name: /^Pagar Q7,387.80/ }).click();
        await page.waitForURL(/\/pagos\/checkout\//);
      },
    },
    {
      name: "pagar-listo",
      path: "/pagos/pagar/cuota-noviembre",
      as: "estudiante",
      fresh: true,
      prepare: async (page) => {
        await page.getByRole("button", { name: /^Pagar Q7,387.80/ }).click();
        await page.waitForURL(/\/pagos\/checkout\//);
        await page.getByRole("button", { name: "Pagar Q7,387.80" }).click();
        await page.waitForURL(/\/listo/);
      },
    },
  ],
};

const stage = process.env.CAPTURE ?? "";
const shots = STAGES[stage] ?? [];

async function signInAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo de la UFM").fill(email);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.waitForURL(/\/login\/codigo$/);
  const code = (await page.getByTestId("codigo-prueba").textContent())?.trim() ?? "";
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.waitForURL((url) => url.pathname === "/");
}

test.describe(`${stage || "no"} screenshots`, () => {
  test.skip(shots.length === 0, "Set CAPTURE=<stage> to take report screenshots");
  for (const shot of shots) {
    test(`${shot.carpeta ? `${shot.carpeta}/` : ""}${shot.name}`, async ({ page }, info) => {
      await signInAs(
        page,
        shot.fresh
          ? `captura.${shot.name}.${info.project.name}.${Date.now()}@ufm.edu`
          : DEMO[shot.as],
      );
      await page.goto(shot.path);
      await page.waitForLoadState("networkidle");
      await shot.prepare?.(page);
      await waitForAnimations(page);
      await page.waitForTimeout(250);
      await page.screenshot({
        path: shot.carpeta
          ? `docs/entrega/capturas/${shot.carpeta}/${shot.name}-${info.project.name}.png`
          : `docs/etapas/${stage === "CMDK" ? "E4" : stage}/${shot.name}-${info.project.name}.png`,
        fullPage: !shot.name.startsWith("cmdk"),
      });
    });
  }
});
