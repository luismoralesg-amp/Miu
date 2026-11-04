"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState, useState } from "react";

import {
  Badge,
  Button,
  CourseDot,
  SelectField,
  TextAreaField,
  TextField,
} from "@/design-system/components";
import type { CourseSlot, Tone } from "@/design-system/components";
import { timeAgo } from "@/lib/clock";
import type { Appeal } from "@/modules/assessment";
import type { AppealState } from "@/app/(app)/catedra/apelaciones/actions";

const ESTADO: Record<Appeal["estado"], { label: string; tone: Tone }> = {
  nueva: { label: "Por responder", tone: "warning" },
  respondida: { label: "Respondida", tone: "info" },
  escalada: { label: "Escalada", tone: "danger" },
  resuelta: { label: "Resuelta", tone: "success" },
};

/** One appeal: what the student asked, the grade today, and the answer, escalation or decision. */
export function AppealCard({
  appeal,
  ahora,
  canReply,
  canResolve,
  action,
}: {
  appeal: Appeal;
  ahora: string;
  canReply: boolean;
  canResolve: boolean;
  action: (prev: AppealState, form: FormData) => Promise<AppealState>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  const [resolving, setResolving] = useState(false);
  const [decision, setDecision] = useState("mantiene");
  const open = appeal.estado === "nueva" || appeal.estado === "respondida";
  const showReply = open && canReply && !state.ok;
  const showResolve = (open || appeal.estado === "escalada") && canResolve && !state.ok;
  const e = ESTADO[appeal.estado];
  const resolution = appeal.resolucion;
  return (
    <li aria-label={`Apelación de ${appeal.estudiante.nombre}`} className="py-6">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[17px] font-semibold">{appeal.estudiante.nombre}</span>
        <Badge tone={e.tone}>{e.label}</Badge>
        <span className="text-label text-fg-muted">
          {timeAgo(new Date(appeal.fecha), new Date(ahora))}
        </span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-label text-fg-muted">
        <CourseDot slot={appeal.curso.slot as CourseSlot} />
        {appeal.curso.nombre} · Sección {appeal.seccion} · {appeal.actividad}
        {appeal.nota !== null && (
          <>
            {" "}
            · nota <span className="font-semibold text-fg tabular">{appeal.nota}</span>
          </>
        )}
      </p>
      <blockquote className="mt-3 max-w-prose border-l-2 border-border-strong pl-4 text-body">
        {appeal.motivo}
      </blockquote>
      {appeal.respuesta && (
        <p className="mt-3 max-w-prose text-label">
          <span className="font-semibold">Respuesta: </span>
          {appeal.respuesta}
        </p>
      )}
      {resolution && (
        <p className="mt-2 text-label text-fg-muted">
          {resolution.decision === "mantiene"
            ? "Se mantuvo la nota"
            : `La nota cambió a ${resolution.notaNueva}`}{" "}
          · {resolution.por}
        </p>
      )}
      {appeal.estado === "escalada" && !showResolve && (
        <p className="mt-2 text-label text-fg-muted">Esperando a la administración.</p>
      )}
      {state.ok && (
        <p
          role="status"
          className="mt-3 flex items-center gap-1.5 text-label font-medium text-success-fg"
        >
          <CircleCheck aria-hidden="true" className="size-4" />
          {state.ok}
        </p>
      )}
      {(showReply || showResolve) && (
        <form action={submit} className="mt-4 flex max-w-prose flex-col gap-3">
          <TextAreaField
            name="respuesta"
            label="Tu respuesta"
            description="La estudiante la leerá. Mínimo 10 caracteres."
            rows={3}
            required
            minLength={10}
          />
          {resolving && (
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                name="decision"
                label="Decisión"
                value={decision}
                onChange={(ev) => setDecision(ev.target.value)}
              >
                <option value="mantiene">Mantener la nota</option>
                <option value="modifica">Cambiar la nota</option>
              </SelectField>
              {decision === "modifica" && (
                <TextField
                  name="notaNueva"
                  label="Nota nueva"
                  description="De 0 a 100. Tu respuesta explica el cambio."
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  required
                />
              )}
            </div>
          )}
          {state.error && (
            <p role="alert" className="flex items-center gap-1.5 text-label text-danger-fg">
              <CircleAlert aria-hidden="true" className="size-4" />
              {state.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {resolving ? (
              <>
                <Button
                  key="cancelar"
                  type="button"
                  variant="ghost"
                  onClick={() => setResolving(false)}
                >
                  Cancelar
                </Button>
                <Button
                  key="resolver"
                  type="submit"
                  name="accion"
                  value="resolver"
                  variant="ink"
                  pill
                  loading={pending}
                >
                  Resolver apelación
                </Button>
              </>
            ) : (
              <>
                {showReply && (
                  <>
                    <Button
                      type="submit"
                      name="accion"
                      value="responder"
                      variant="ink"
                      pill
                      loading={pending}
                    >
                      Responder
                    </Button>
                    <Button
                      type="submit"
                      name="accion"
                      value="escalar"
                      variant="secondary"
                      pill
                      loading={pending}
                    >
                      Escalar a administración
                    </Button>
                  </>
                )}
                {showResolve && (
                  <Button
                    key="abrir"
                    type="button"
                    variant="secondary"
                    pill
                    onClick={() => setResolving(true)}
                  >
                    Resolver…
                  </Button>
                )}
              </>
            )}
          </div>
        </form>
      )}
    </li>
  );
}
