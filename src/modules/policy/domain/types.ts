import { z } from "zod";

/** The institutional rules the Administrativo can change. All values start as assumptions [S]. */
export const PolicyValues = z
  .object({
    /** Under this grade the grader must explain it. */
    umbralJustificacion: z
      .number()
      .int()
      .min(1, "El umbral va de 1 a 100")
      .max(100, "El umbral va de 1 a 100"),
    /** Targets shown on Notas, lowest first. */
    metas: z.array(z.number().int().min(1).max(100)).length(3, "Son tres metas"),
    comisionTarjeta: z.object({
      porcentaje: z
        .number()
        .min(0, "El porcentaje no puede ser negativo")
        .max(10, "El porcentaje máximo es 10"),
      fijo: z
        .number()
        .min(0, "El monto fijo no puede ser negativo")
        .max(50, "El monto fijo máximo es Q50"),
      pagador: z.enum(["estudiante", "universidad"]),
    }),
  })
  .superRefine((v, ctx) => {
    const [a = 0, b = 0, c = 0] = v.metas;
    if (!(a < b && b < c))
      ctx.addIssue({ code: "custom", path: ["metas"], message: "Las metas van de menor a mayor" });
    if (a <= v.umbralJustificacion)
      ctx.addIssue({
        code: "custom",
        path: ["metas"],
        message: "La primera meta debe ser mayor que el umbral",
      });
  });
export type PolicyValues = z.infer<typeof PolicyValues>;

/** An Auxiliar of a section, and whether the Administrativo let them close its final grade. */
export const CloseGrant = z.object({
  personId: z.string(),
  nombre: z.string(),
  sectionId: z.string(),
  curso: z.string(),
  seccion: z.string(),
  otorgado: z.boolean(),
});
export type CloseGrant = z.infer<typeof CloseGrant>;

export const GrantInput = z.object({
  personId: z.string(),
  sectionId: z.string(),
  otorgado: z.boolean(),
});
export type GrantInput = z.infer<typeof GrantInput>;
