import { z } from "zod";

import { parsed } from "@/lib/contract";
import { fail, type PortResult } from "@/lib/result";
import { buildSeed, fullName, type Seed } from "@/mock/seed";
import type { Actor } from "@/modules/identity";

import { CloseGrant, GrantInput, PolicyValues } from "../../domain/types";
import type { PolicyPort } from "../../ports/policy-port";
import { grantKey, stateFor } from "./state";

export class MockPolicy implements PolicyPort {
  constructor(private readonly seed: Seed = buildSeed()) {}

  async get(actor: Actor) {
    return parsed(PolicyValues, stateFor(actor).values);
  }

  async update(actor: Actor, values: unknown): PortResult<PolicyValues> {
    if (actor.role !== "administrativo") return fail("forbidden");
    const body = PolicyValues.safeParse(values);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    stateFor(actor).values = structuredClone(body.data);
    return parsed(PolicyValues, stateFor(actor).values);
  }

  private grants(actor: Actor) {
    const { grants } = stateFor(actor);
    return this.seed.sections.flatMap((s) =>
      s.auxiliarIds.map((personId) => {
        const p = this.seed.people.find((x) => x.id === personId)!;
        const course = this.seed.courses.find((c) => c.id === s.courseId)!;
        return {
          personId,
          nombre: fullName(p),
          sectionId: s.id,
          curso: course.nombre,
          seccion: s.seccion,
          otorgado: grants.has(grantKey(personId, s.id)),
        };
      }),
    );
  }

  async listCloseGrants(actor: Actor) {
    if (actor.role !== "administrativo") return fail("forbidden");
    return parsed(z.array(CloseGrant), this.grants(actor));
  }

  async setCloseGrant(actor: Actor, input: GrantInput) {
    if (actor.role !== "administrativo") return fail("forbidden");
    const body = GrantInput.safeParse(input);
    if (!body.success) return fail("invalid", body.error.issues[0]?.message);
    const entry = this.grants(actor).find(
      (g) => g.personId === body.data.personId && g.sectionId === body.data.sectionId,
    );
    if (!entry) return fail("not_found", "Esa persona no es auxiliar de la sección");
    const { grants } = stateFor(actor);
    const key = grantKey(entry.personId, entry.sectionId);
    if (body.data.otorgado) grants.add(key);
    else grants.delete(key);
    return parsed(CloseGrant, { ...entry, otorgado: body.data.otorgado });
  }
}
