// Ronda 3 shared setup. Load after seed.js, before Tailwind.
// Every date, weekday and relative date comes from HOY. A page may set window.MIU_HOY first.
(() => {
  const HOY = new Date(window.MIU_HOY || "2026-10-22T07:42:00");
  const params = new URLSearchParams(location.search);
  if (params.get("tema") === "oscuro") document.documentElement.classList.add("dark");

  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const parse = (v) => (v instanceof Date ? v : new Date(v.length === 10 ? `${v}T00:00:00` : v));
  const soloDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diasEntre = (a, b) => Math.round((soloDia(parse(b)) - soloDia(parse(a))) / 864e5);
  const hhmm = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const minutos = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  const MIU = {
    HOY,
    DIAS,
    MESES,
    cap,
    parse,
    hhmm,
    minutos,
    diasDesdeHoy: (v) => diasEntre(HOY, v),
    /** "jueves 22 de octubre" */
    fechaLarga: (v = HOY) => { const d = parse(v); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; },
    /** "22 oct" */
    fechaCorta: (v) => { const d = parse(v); return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`; },
    /** "hoy", "mañana", "el domingo", "3 de noviembre" */
    relativo: (v) => {
      const d = parse(v); const n = diasEntre(HOY, d);
      if (n === 0) return "hoy";
      if (n === 1) return "mañana";
      if (n === -1) return "ayer";
      if (n > 1 && n < 7) return DIAS[d.getDay()];
      if (n < 0 && n > -7) return `el ${DIAS[d.getDay()]}`;
      return `${d.getDate()} de ${MESES[d.getMonth()]}`;
    },
    /** "Mañana 23:59", "Domingo 23:59", "3 de noviembre" */
    vence: (v) => { const d = parse(v); const n = diasEntre(HOY, d); const r = MIU.relativo(d); return cap(n < 7 ? `${r} ${hhmm(d)}` : r); },
    /** Time since: "hace 2 h", "ayer", "el lunes" */
    hace: (v) => {
      const d = parse(v); const min = Math.round((HOY - d) / 6e4);
      if (min < 60) return `hace ${min} min`;
      if (diasEntre(d, HOY) === 0) return `hace ${Math.floor(min / 60)} h`;
      return MIU.relativo(d);
    },
    /** { h, min } until a moment */
    faltan: (v) => { const t = Math.max(0, Math.round((parse(v) - HOY) / 6e4)); return { h: Math.floor(t / 60), min: t % 60, totalMin: t }; },
    semana: () => {
      const s = window.SEED.semestre; const n = Math.floor(diasEntre(s.inicio, HOY) / 7) + 1;
      return { actual: n, total: s.semanas };
    },
    /** Monday of HOY's week */
    lunes: () => { const d = soloDia(HOY); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return d; },
    diaIso: (v) => { const d = parse(v); return ((d.getDay() + 6) % 7) + 1; },
    quetzales: (n) => `Q${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    /** Classes for a date, sorted, with course data */
    clasesDe: (v) => {
      const dia = ((parse(v).getDay() + 6) % 7) + 1;
      return window.SEED.clases
        .filter((c) => c.dias.includes(dia))
        .map((c) => ({ ...c, ...window.SEED.cursos[c.curso], codigo: c.curso }))
        .sort((a, b) => minutos(a.ini) - minutos(b.ini));
    },
    curso: (k) => ({ ...window.SEED.cursos[k], codigo: k }),
    iniciales: () => { const u = window.SEED.usuario; return (u.nombre[0] + u.apellido[0]).toUpperCase(); },
    saludo: () => (HOY.getHours() < 12 ? "Buenos días" : HOY.getHours() < 19 ? "Buenas tardes" : "Buenas noches"),
    /** Next exam or delivery within 72 h, or null */
    proximo: () => {
      const items = [
        ...window.SEED.examenes.map((x) => ({ ...x, clase: "examen" })),
        ...window.SEED.entregas.map((x) => ({ ...x, clase: "entrega" })),
      ].filter((x) => parse(x.fecha) > HOY).sort((a, b) => parse(a.fecha) - parse(b.fecha));
      const x = items[0];
      if (!x) return null;
      const h = (parse(x.fecha) - HOY) / 36e5;
      return { ...x, estado: h <= 24 ? "urgente" : h <= 72 ? "normal" : "tranquilo" };
    },
  };
  /** Everything "Hoy" needs, derived from SEED and HOY (rules in IA_RONDA2.md). */
  MIU.hoy = () => {
    const S = window.SEED;
    const ahora = HOY.getHours() * 60 + HOY.getMinutes();
    const AX0 = 7 * 60, AX1 = 18 * 60, pos = (m) => ((m - AX0) / (AX1 - AX0)) * 100;
    const clases = MIU.clasesDe(HOY).map((c) => {
      const a = minutos(c.ini), b = minutos(c.fin);
      return { ...c, estado: ahora >= b ? "pasada" : ahora >= a ? "ahora" : "proxima", left: pos(a), width: pos(b) - pos(a) };
    });
    const huecos = [];
    for (let i = 0; i < clases.length - 1; i++) {
      const a = minutos(clases[i].fin), b = minutos(clases[i + 1].ini);
      if (b - a >= 30) huecos.push({ min: b - a, left: pos(a), width: pos(b) - pos(a) });
    }
    const libre = huecos.reduce((s, h) => s + h.min, 0);
    const proximo = MIU.proximo();
    const pendientes = S.entregas.filter((e) => parse(e.fecha) > HOY && !(proximo && proximo.id === e.id))
      .sort((a, b) => parse(a.fecha) - parse(b.fecha));
    const novedades = [...S.novedades].sort((a, b) => parse(b.fecha) - parse(a.fecha));
    const dias = MIU.diasDesdeHoy(S.pago.vence);
    return {
      clases, huecos, libre, ahoraPos: pos(ahora), proximo,
      porEntregar: pendientes.slice(0, 4), totalPendientes: pendientes.length,
      novedades, nuevas: novedades.filter((n) => n.nueva).length,
      aviso: dias <= 7 ? { ...S.pago, dias, atrasado: dias < 0 } : null,
    };
  };
  MIU.duracion = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}` : `${min} min`);

  window.MIU = MIU;

  // Fill static placeholders once the DOM is ready.
  document.addEventListener("DOMContentLoaded", () => {
    const sem = MIU.semana();
    const fill = {
      "fecha-larga": MIU.cap(MIU.fechaLarga()),
      semana: `semana ${sem.actual} de ${sem.total}`,
      iniciales: MIU.iniciales(),
      nombre: window.SEED.usuario.nombre,
      saludo: `${MIU.saludo()}, ${window.SEED.usuario.nombre}`,
    };
    document.querySelectorAll("[data-fill]").forEach((el) => { el.textContent = fill[el.dataset.fill] ?? el.textContent; });
  });

  // Tailwind theme bound to tokens.css
  const theme = document.createElement("style");
  theme.type = "text/tailwindcss";
  theme.textContent = `
    @custom-variant dark (&:where(.dark, .dark *));
    @theme inline {
      --font-sans: "Inter", system-ui, sans-serif;
      --font-display: var(--display-font);
      --color-canvas: var(--canvas);
      --color-card: var(--card);
      --color-subtle: var(--subtle);
      --color-line: var(--line);
      --color-ink: var(--ink);
      --color-muted: var(--muted);
      --color-ufm: var(--ufm);
      --color-ufm-deep: var(--ufm-deep);
      --color-ufm-text: var(--ufm-text);
      --color-ufm-soft: var(--ufm-soft);
      --color-ok: var(--ok);
      --color-ok-soft: var(--ok-soft);
      --color-warn: var(--warn);
      --color-warn-soft: var(--warn-soft);
      --color-danger: var(--danger);
      --color-danger-soft: var(--danger-soft);
      --color-info: var(--info);
      --color-info-soft: var(--info-soft);
      --color-c1: var(--c1); --color-c2: var(--c2); --color-c3: var(--c3);
      --color-c4: var(--c4); --color-c5: var(--c5); --color-c6: var(--c6);
      --shadow-card: var(--shadow);
      --shadow-float: var(--shadow-float);
    }
  `;
  document.head.appendChild(theme);
})();
