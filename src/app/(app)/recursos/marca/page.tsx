import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";

import { PageHead } from "@/features/servicios/page-head";
import { requireActor } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Logotipos y fondos" };

// Each file is previewed on the background it is made for, whatever the theme: the `--bg` canvas
// of the light and dark themes (tokens.css), fixed so the preview doesn't follow the theme.
const PREVIEW = { light: "bg-[#f7f3ec]", dark: "bg-[#13110e]" } as const;

const FILES: { file: string; nombre: string; fondo: keyof typeof PREVIEW; w: number; h: number }[] =
  [
    {
      file: "logo-ufm01.png",
      nombre: "Logotipo, para fondos oscuros",
      fondo: "dark",
      w: 412,
      h: 250,
    },
    // Both crests are black watermarks (4 % and 12 % opacity, DECISIONES): they only show on light.
    {
      file: "escudo.png",
      nombre: "Escudo, marca de agua suave (4\u00a0%)",
      fondo: "light",
      w: 350,
      h: 300,
    },
    {
      file: "escudo-osc.png",
      nombre: "Escudo, marca de agua marcada (12\u00a0%)",
      fondo: "light",
      w: 350,
      h: 300,
    },
  ];

/** Brand files that ship with MiU; the full brand kit is the communications office's to publish [S]. */
export default async function MarcaPage() {
  await requireActor();
  return (
    <div className="pb-10">
      <PageHead kicker="Para trabajos, presentaciones y eventos" title="Logotipos y fondos" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FILES.map((f) => (
          <li
            key={f.file}
            className="overflow-hidden rounded-[20px] border border-border bg-surface"
          >
            <div className={`grid h-56 place-items-center p-8 ${PREVIEW[f.fondo]}`}>
              <Image
                src={`/brand/${f.file}`}
                alt={f.nombre}
                width={f.w}
                height={f.h}
                className="h-full max-h-40 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
              <span>
                <span className="block text-[15px] font-semibold">{f.nombre}</span>
                <span className="text-caption text-fg-muted">
                  PNG · {f.w}×{f.h}
                </span>
              </span>
              <a
                href={`/brand/${f.file}`}
                download
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-subtle"
                aria-label={`Descargar ${f.nombre}`}
              >
                <Download aria-hidden="true" className="size-5" />
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-caption text-fg-muted">
        El manual de marca completo y los fondos para videollamada los publica Comunicación; aquí
        solo están los archivos incluidos en la demo.
      </p>
    </div>
  );
}
