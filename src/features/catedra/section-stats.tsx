import { distribution } from "@/features/catedra/stats";
import { cx } from "@/lib/cx";
import type { SectionGradebook } from "@/modules/assessment";

/** Spread of a section's current grades and the average of every activity graded so far. */
export function SectionStats({ book }: { book: SectionGradebook }) {
  const evaluados = book.estudiantes.filter((e) => e.evaluado > 0);
  const bands = distribution(
    evaluados.map((e) => e.actual),
    book.umbral,
    book.metas,
  );
  const max = Math.max(1, ...bands.map((b) => b.count));
  const graded = book.actividades.filter((a) => a.promedio !== null);
  return (
    <>
      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-label">
        <div>
          <dt className="text-fg-muted">Estudiantes con nota</dt>
          <dd className="display text-[28px] leading-tight tabular">
            {evaluados.length} <span className="text-fg-muted">de {book.estudiantes.length}</span>
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Promedio actual</dt>
          <dd className="display text-[28px] leading-tight tabular">{book.promedio.toFixed(1)}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Bajo {book.umbral}</dt>
          <dd className="display text-[28px] leading-tight tabular">{book.bajoUmbral}</dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="text-label font-semibold">
            Cómo se reparten las notas actuales (estudiantes)
          </h3>
          <ul className="mt-3 flex flex-col gap-2.5">
            {bands.map((b, i) => (
              <li
                key={b.id}
                className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-3 text-label"
              >
                <span className="tabular">{b.label}</span>
                <span aria-hidden="true" className="h-3 rounded-full bg-surface-subtle">
                  <span
                    className={cx("block h-3 rounded-full", i === 0 ? "bg-danger-fill" : "bg-fg")}
                    style={{ width: `${(b.count / max) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular">
                  {b.count}
                  <span className="sr-only"> {b.count === 1 ? "estudiante" : "estudiantes"}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-caption text-fg-muted">
            Umbral {book.umbral} y metas {book.metas.join("/")}: valores de ejemplo.
          </p>
        </div>
        <div>
          <h3 className="text-label font-semibold">Promedio por actividad</h3>
          {graded.length === 0 ? (
            <p className="mt-3 text-label text-fg-muted">Aún no hay actividades con nota.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {graded.map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[minmax(0,1fr)_7rem_3rem] items-center gap-3 text-label"
                >
                  <span className="truncate">{a.titulo}</span>
                  <span aria-hidden="true" className="h-3 rounded-full bg-surface-subtle">
                    <span
                      className="block h-3 rounded-full bg-fg"
                      style={{ width: `${a.promedio}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold tabular">{a.promedio?.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
