"use client";

import { CircleCheck } from "lucide-react";
import { useState } from "react";

import { Button, CourseDot, type CourseSlot } from "@/design-system/components";
import { botarCurso } from "@/app/(app)/asignacion/actions";

import { StepUp } from "./step-up";

type C = { id: string; nombre: string; slot: number; seccion: string; creditos: number };

/** Dropping a current course: say what it means, then confirm with a code. */
export function DropList({ courses, dropped }: { courses: C[]; dropped: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>(dropped);
  return (
    <ul className="divide-y divide-border border-y border-border">
      {courses.map((c) => {
        const botado = done.includes(c.id);
        return (
          <li key={c.id} className="flex flex-col gap-3 py-4" aria-label={c.nombre}>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 font-semibold">
                <CourseDot slot={c.slot as CourseSlot} />
                {c.nombre}
                <span className="font-normal text-fg-muted">· sección {c.seccion}</span>
              </span>
              {botado ? (
                <span
                  role="status"
                  className="flex items-center gap-1.5 text-label text-success-fg"
                >
                  <CircleCheck aria-hidden="true" className="size-4" />
                  Botado
                </span>
              ) : (
                open !== c.id && (
                  <Button
                    variant="secondary"
                    onClick={() => setOpen(c.id)}
                    aria-label={`Botar ${c.nombre}`}
                  >
                    Botar…
                  </Button>
                )
              )}
            </div>
            {open === c.id && !botado && (
              <>
                <p className="text-label text-fg-muted">
                  Sales de {c.nombre}. Las notas que ya tienes quedan en el historial y el curso no
                  cuenta para el promedio. El cargo de este mes no cambia.
                </p>
                <StepUp
                  label={`Botar ${c.nombre}`}
                  onCancel={() => setOpen(null)}
                  onConfirm={async (codigo) => {
                    const r = await botarCurso(c.id, codigo);
                    if ("error" in r && r.error) return r.error;
                    setDone((d) => [...d, c.id]);
                    setOpen(null);
                    return undefined;
                  }}
                />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
