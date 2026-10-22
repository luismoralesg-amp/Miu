"use client";

import {
  ArrowRight,
  Bell,
  CalendarPlus,
  Download,
  FileText,
  MessageSquare,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  ErrorState,
  IconButton,
  LoadingRegion,
  RadioGroup,
  Reveal,
  SelectField,
  Skeleton,
  Switch,
  TextAreaField,
  TextField,
  TimeoutState,
  Tooltip,
} from "@/design-system/components";

/* ---------- Motion ---------- */

const pendingItems = [
  { title: "Ejercicio de llaves", course: "Paradigmas de Programación", due: "Mañana" },
  { title: "Quiz 4: grafos", course: "Matemática Discreta", due: "Viernes" },
  { title: "Lectura: Hayek, cap. 3", course: "Ética de la Libertad", due: "Lunes" },
];

export function MotionDemo() {
  const [run, setRun] = useState(0);
  return (
    <Card
      titleLevel={3}
      title="Skeleton a contenido"
      action={
        <Button size="sm" onClick={() => setRun((n) => n + 1)}>
          Repetir
        </Button>
      }
    >
      <ul key={run} className="flex flex-col divide-y divide-border">
        {pendingItems.map((item, index) => (
          <li key={item.title}>
            <Reveal index={index} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col">
                <span className="text-body font-medium text-fg">{item.title}</span>
                <span className="text-label text-fg-muted">{item.course}</span>
              </div>
              <Badge tone={index === 0 ? "accent" : "neutral"}>{item.due}</Badge>
            </Reveal>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Components ---------- */

export function ButtonsDemo() {
  const [saving, setSaving] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={<Upload aria-hidden="true" />}>
          Entregar tarea
        </Button>
        <Button icon={<CalendarPlus aria-hidden="true" />}>Agregar al calendario</Button>
        <Button variant="ghost">Cancelar</Button>
        <Button variant="danger" icon={<Trash2 aria-hidden="true" />}>
          Botar curso
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg">
          Pagar con transferencia
        </Button>
        <Button variant="primary">Continuar</Button>
        <Button variant="primary" size="sm">
          Guardar
        </Button>
        <Button
          variant="primary"
          loading={saving}
          onClick={() => {
            setSaving(true);
            setTimeout(() => setSaving(false), 1600);
          }}
        >
          Guardar cambios
        </Button>
        <Button disabled>No disponible</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip content="Descargar el programa del curso (PDF)">
          <IconButton label="Descargar programa" icon={<Download aria-hidden="true" />} />
        </Tooltip>
        <Tooltip content="Notificaciones">
          <IconButton label="Notificaciones" icon={<Bell aria-hidden="true" />} />
        </Tooltip>
        <Tooltip content="Mensajes con catedráticos">
          <IconButton label="Mensajes" icon={<MessageSquare aria-hidden="true" />} />
        </Tooltip>
        <Tooltip content="Preferencias">
          <IconButton
            label="Preferencias"
            variant="secondary"
            icon={<Settings aria-hidden="true" />}
          />
        </Tooltip>
        <span className="text-label text-fg-muted">
          Pasa el puntero: el primer tooltip espera 500 ms; los vecinos abren al instante.
        </span>
      </div>
    </div>
  );
}

export function FieldsDemo() {
  const [email, setEmail] = useState("ana.lopez@gmail.com");
  const domainError =
    email && !email.toLowerCase().endsWith("@ufm.edu") ? "Usa tu correo @ufm.edu." : undefined;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <TextField
        label="Correo institucional"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        description="Te enviaremos un código de 6 dígitos."
        error={domainError}
      />
      <TextField
        label="Teléfono celular"
        type="tel"
        autoComplete="tel"
        optional
        placeholder="5555 1234"
      />
      <SelectField label="Período" defaultValue="202602">
        <option value="202602">Segundo semestre 2026</option>
        <option value="202601">Primer semestre 2026</option>
        <option value="202511">Interciclo 2025</option>
      </SelectField>
      <TextAreaField
        label="Comentario para el catedrático"
        optional
        placeholder="Opcional: aclara algo de tu entrega"
      />
    </div>
  );
}

export function ChoicesDemo() {
  const [method, setMethod] = useState("ach");
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RadioGroup
        name="payment-method"
        legend="Método de pago"
        value={method}
        onValueChange={setMethod}
        options={[
          {
            value: "ach",
            label: "Transferencia ACH (recomendada)",
            description: "Sin comisión. Ahorras Q452.00 en este pago.",
          },
          {
            value: "card",
            label: "Tarjeta o Apple Pay",
            description: "Comisión de 4.5% + Q2 para la universidad.",
          },
          {
            value: "deposit",
            label: "Depósito con comprobante",
            description: "Revisión manual de 1 a 2 días hábiles.",
          },
        ]}
      />
      <div className="flex flex-col gap-5">
        <Switch
          label="Recibir notificaciones del curso"
          description="Avisos de tareas, notas y anuncios."
          defaultChecked
        />
        <Switch
          label="Resumen diario por correo"
          description="Un solo correo a las 7:00 con lo de hoy."
        />
        <Checkbox
          label="Aparecer en el directorio general"
          description="Desactivado por defecto: tu privacidad primero."
        />
        <Checkbox label="Mostrar mi fotografía a compañeros" />
      </div>
    </div>
  );
}

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon={<FileText aria-hidden="true" />} onClick={() => setOpen(true)}>
        Abrir confirmación
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="¿Entregar la tarea ahora?"
        description="Ejercicio de llaves · Paradigmas de Programación"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Revisar de nuevo
            </Button>
            <Button
              variant="primary"
              onClick={() => setOpen(false)}
              icon={<ArrowRight aria-hidden="true" />}
            >
              Entregar
            </Button>
          </>
        }
      >
        <p className="text-body text-fg-muted">
          Recibirás un comprobante con la hora exacta y la huella del archivo. Puedes reemplazar la
          entrega hasta la fecha límite.
        </p>
      </Dialog>
    </>
  );
}

/* ---------- States ---------- */

export function LoadingDemo() {
  const [loaded, setLoaded] = useState(false);
  const [run, setRun] = useState(0);
  const reload = () => {
    setLoaded(false);
    setRun((n) => n + 1);
    setTimeout(() => setLoaded(true), 1200);
  };
  return (
    <Card
      titleLevel={3}
      title="Notas recientes"
      action={
        <Button size="sm" onClick={reload}>
          Simular carga
        </Button>
      }
    >
      {loaded ? (
        <ul key={run} className="flex flex-col divide-y divide-border">
          {[
            ["Quiz 3: lógica proposicional", "Matemática Discreta", "18/20"],
            ["Actividad 5: closures", "Paradigmas de Programación", "92"],
            ["Ensayo corto", "Ética de la Libertad", "85"],
          ].map(([title, course, grade], index) => (
            <li key={title}>
              <Reveal index={index} className="flex items-center justify-between gap-4 py-3">
                <div className="flex flex-col">
                  <span className="text-body font-medium text-fg">{title}</span>
                  <span className="text-label text-fg-muted">{course}</span>
                </div>
                <span className="text-title-3 font-semibold text-fg tabular">{grade}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      ) : (
        <LoadingRegion label="Cargando notas recientes…">
          <ul className="flex flex-col divide-y divide-border">
            {[0, 1, 2].map((row) => (
              <li key={row} className="flex items-center justify-between gap-4 py-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-10" />
              </li>
            ))}
          </ul>
        </LoadingRegion>
      )}
    </Card>
  );
}

export function ErrorDemo() {
  const [retrying, setRetrying] = useState(false);
  return (
    <ErrorState
      title="No pudimos cargar tu horario"
      retrying={retrying}
      onRetry={() => {
        setRetrying(true);
        setTimeout(() => setRetrying(false), 1400);
      }}
    />
  );
}

export function TimeoutDemo() {
  const [retrying, setRetrying] = useState(false);
  return (
    <TimeoutState
      retrying={retrying}
      onRetry={() => {
        setRetrying(true);
        setTimeout(() => setRetrying(false), 1400);
      }}
    />
  );
}
