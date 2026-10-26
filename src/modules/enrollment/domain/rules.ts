import type { OfferCourse, Preference } from "./types";

const toMin = (t: string) => {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
};

type Slot = { dias: number[]; ini: string; fin: string };

export function overlaps(a: Slot, b: Slot) {
  return (
    a.dias.some((d) => b.dias.includes(d)) &&
    toMin(a.ini) < toMin(b.fin) &&
    toMin(b.ini) < toMin(a.fin)
  );
}

export type Check = {
  uma: number;
  excede: boolean;
  /** Pairs of course codes whose first-choice sections overlap. */
  choques: Array<[string, string]>;
  faltaSeccion: string[];
};

/** Validates a set of preferences against the offer: credit cap, time clashes, sections chosen. */
export function checkPreferences(prefs: Preference[], offer: OfferCourse[], maxUma: number): Check {
  const chosen = prefs.map((p) => {
    const course = offer.find((c) => c.codigo === p.codigo);
    const first = course?.secciones.find((s) => s.id === p.secciones[0]);
    return { p, course, first };
  });
  const uma = chosen.reduce((s, x) => s + (x.course?.uma ?? 0), 0);
  const choques: Array<[string, string]> = [];
  for (let i = 0; i < chosen.length; i++)
    for (let j = i + 1; j < chosen.length; j++) {
      const a = chosen[i]!.first;
      const b = chosen[j]!.first;
      if (a && b && overlaps(a, b)) choques.push([chosen[i]!.p.codigo, chosen[j]!.p.codigo]);
    }
  return {
    uma,
    excede: uma > maxUma,
    choques,
    faltaSeccion: chosen.filter((x) => !x.first).map((x) => x.p.codigo),
  };
}

export function isValid(c: Check) {
  return !c.excede && c.choques.length === 0 && c.faltaSeccion.length === 0;
}
