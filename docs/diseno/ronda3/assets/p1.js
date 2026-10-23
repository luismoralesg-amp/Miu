// P1 · Editorial building blocks shared by every screen of the recommended skin.
// Course color appears only as a small mark (dot or hairline), never as a fill behind text.
(() => {
  const M = window.MIU;
  const NAV = [["hoy", "Hoy", "sun", "p1-editorial.html"], ["cursos", "Cursos", "book-open", "curso-linea-de-tiempo.html"], ["semana", "Semana", "calendar", "semana.html"], ["notas", "Notas", "chart-no-axes-column", "notas.html"], ["pagos", "Pagos", "wallet", "pagos.html"]];
  const icono = { nota: "badge-check", documento: "file-text", anuncio: "megaphone" };

  const P1 = {
    dot: (k, size = "size-2") => `<span aria-hidden="true" class="c-${M.curso(k).slot} bg-c ${size} inline-block shrink-0 rounded-full"></span>`,

    shell(activo, nav = NAV) {
      const top = document.getElementById("shell-top");
      if (top) top.innerHTML = `
        <header class="flex h-16 items-center justify-between gap-6 border-b border-line md:h-20">
          <a href="p1-editorial.html" class="flex items-center gap-3"><span class="shield" style="--h: 32px"></span><span class="display text-[22px] font-semibold">MiU</span></a>
          <nav aria-label="Principal" class="hidden items-center gap-8 text-[15px] lg:flex">
            ${nav.map(([k, t, , href]) => `<a href="${href}" ${k === activo ? 'aria-current="page" class="border-b-2 border-ink py-6 font-semibold"' : 'class="py-6 text-muted hover:text-ink"'}>${t}</a>`).join("")}
          </nav>
          <div class="flex items-center gap-1">
            <a href="cmdk.html" class="hidden h-11 items-center gap-2 rounded-full px-3 text-sm text-muted hover:bg-subtle md:flex"><i data-lucide="search" class="size-[18px]"></i>Buscar o hacer algo<kbd class="rounded border border-line px-1.5 text-xs">⌘K</kbd></a>
            <button aria-label="Notificaciones" class="grid size-11 place-items-center rounded-full hover:bg-subtle"><i data-lucide="bell" class="size-5"></i></button>
            <span class="ml-1 grid size-10 place-items-center rounded-full border border-line text-sm font-semibold">${M.iniciales()}</span>
          </div>
        </header>`;
      const bottom = document.getElementById("shell-bottom");
      if (bottom) bottom.innerHTML = `
        <nav aria-label="Principal" class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 pb-5 lg:hidden">
          <ul class="grid text-[11px] font-medium" style="grid-template-columns:repeat(${nav.length},minmax(0,1fr))">
            ${nav.map(([k, t, ic, href]) => `<li><a href="${href}" ${k === activo ? 'aria-current="page" class="flex min-h-14 flex-col items-center justify-center gap-1 text-ink"' : 'class="flex min-h-14 flex-col items-center justify-center gap-1 text-muted"'}><i data-lucide="${ic}" class="size-6"></i>${t}</a></li>`).join("")}
          </ul>
        </nav>`;
    },

    aviso(H) {
      if (!H.aviso) return "";
      return `<a href="pagos.html" class="tap -mx-2 flex min-h-11 items-center gap-2 rounded-lg px-2 text-[15px]">
        <i data-lucide="wallet" class="size-[18px] text-warn"></i>
        <span><span class="tnum font-semibold">${M.quetzales(H.aviso.monto)}</span> <span class="text-muted">vence ${H.aviso.dias === 1 ? "mañana" : `en ${H.aviso.dias} días`}<span class="hidden sm:inline">, el ${M.relativo(H.aviso.vence)} ${M.parse(H.aviso.vence).getDate()}</span></span></span>
        <i data-lucide="arrow-right" class="size-4 text-muted"></i></a>`;
    },

    /** Hero in three states: urgent (red gradient), normal and calm (neutral). */
    hero(p, { accion = "Repasar" } = {}) {
      if (!p) return `
        <article class="flex flex-col gap-2 rounded-[20px] border border-line bg-card px-6 py-6 md:px-9 md:py-7">
          <h2 class="display text-[28px] font-medium md:text-[38px]">Nada urgente hoy</h2>
          <p class="text-[15px] text-muted">Tu próxima fecha importante está a más de tres días.</p>
        </article>`;
      const f = M.faltan(p.fecha), c = M.curso(p.curso), urgente = p.estado === "urgente";
      return `
        <article class="${urgente ? "bg-gradient-to-br from-ufm to-ufm-deep text-white" : "border border-line bg-card"} flex flex-col gap-6 rounded-[20px] px-6 py-6 md:flex-row md:items-center md:justify-between md:px-9 md:py-7">
          <div class="max-w-[620px]">
            <h2 class="display text-[28px] leading-[1.08] font-medium md:text-[38px]">${p.titulo} de ${c.nombre}</h2>
            <p class="mt-2 text-[15px] ${urgente ? "text-white/90" : "text-muted"}">${M.cap(M.relativo(p.fecha))}, ${M.hhmm(M.parse(p.fecha))} · ${p.salon} · vale ${p.peso}%</p>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 md:justify-end">
            <p class="display tnum flex items-baseline gap-1 leading-none"><span class="text-[52px] md:text-[64px]">${f.h}</span><span class="text-lg">h</span><span class="ml-2 text-[52px] md:text-[64px]">${f.min}</span><span class="text-lg">min</span></p>
            <a href="#" class="inline-flex h-12 shrink-0 items-center gap-2 rounded-full ${urgente ? "bg-white text-[#c21d1d]" : "bg-ink text-card"} px-5 text-[15px] font-semibold">${accion}<i data-lucide="arrow-right" class="size-[18px]"></i></a>
          </div>
        </article>`;
    },

    dia(H) {
      const horas = Array.from({ length: 12 }, (_, i) => i + 7);
      return `
        <div class="relative mt-8 hidden md:block">
          <div class="tnum relative h-4 text-xs text-muted">${horas.map((h, i) => `<span class="absolute ${i === 0 ? "" : i === 11 ? "-translate-x-full" : "-translate-x-1/2"}" style="left:${(i / 11) * 100}%">${String(h).padStart(2, "0")}</span>`).join("")}</div>
          <div class="relative mt-3 h-[84px] border-y border-line">
            ${horas.slice(1, -1).map((_, i) => `<span class="absolute inset-y-0 w-px bg-line" style="left:${((i + 1) / 11) * 100}%"></span>`).join("")}
            ${H.huecos.map((h) => `<p class="absolute inset-y-0 flex items-center justify-center text-sm text-muted italic" style="left:${h.left}%;width:${h.width}%">${h.min >= 90 ? `${M.duracion(h.min)} libres` : M.duracion(h.min)}</p>`).join("")}
            ${H.ahoraPos >= 0 && H.ahoraPos <= 100 ? `<span aria-hidden="true" class="absolute -top-2 -bottom-2 w-0.5 bg-ink" style="left:${H.ahoraPos}%"><span class="absolute -top-1 -left-[3px] size-2 rounded-full bg-ink"></span></span>` : ""}
            ${H.clases.map((k) => `<a href="curso-linea-de-tiempo.html" class="absolute inset-y-2 z-10 rounded-lg ${k.estado === "ahora" ? "border-2 border-ink bg-card" : k.estado === "pasada" ? "border border-line bg-subtle text-muted" : "border border-line bg-card"} px-3 py-2" style="left:${k.left}%;width:${k.width}%">
                <p class="flex items-center gap-1.5 truncate text-sm font-semibold">${P1.dot(k.codigo)}${k.corto}</p>
                <p class="truncate text-xs text-muted">${k.estado === "ahora" ? `Ahora · ${k.salon}` : k.estado === "pasada" ? "Terminó" : `${k.ini} · ${k.salon.split(" ")[0]}`}</p></a>`).join("")}
          </div>
        </div>
        <ol class="mt-6 border-t border-line md:hidden">${H.clases.map((k, i) => `
          ${i > 0 && H.huecos[i - 1] ? `<li class="py-2 pl-[4.5rem] text-sm text-muted italic">${M.duracion(H.huecos[i - 1].min)} libres</li>` : ""}
          <li><a href="curso-linea-de-tiempo.html" class="flex min-h-14 items-center gap-4 border-b border-line py-3"><span class="tnum w-14 text-[15px] ${k.estado === "ahora" ? "font-semibold" : "text-muted"}">${k.ini}</span><span class="flex-1"><span class="flex items-center gap-2 font-semibold">${P1.dot(k.codigo)}${k.nombre}</span><span class="text-sm text-muted">${k.estado === "ahora" ? "Ahora · " : k.estado === "pasada" ? "Terminó · " : ""}${k.salon}</span></span>${k.estado === "ahora" ? '<span class="rounded-full border border-ink px-2 py-0.5 text-xs font-semibold">Ahora</span>' : ""}</a></li>`).join("")}</ol>`;
    },

    pendiente: (e) => `
      <span class="min-w-0"><span class="block font-semibold">${e.titulo}</span><span class="flex items-center gap-1.5 text-sm text-muted">${P1.dot(e.curso)}${M.curso(e.curso).nombre}</span></span>
      <span class="tnum shrink-0 text-sm ${M.diasDesdeHoy(e.fecha) <= 1 ? "font-semibold" : "text-muted"}">${M.vence(e.fecha)}</span>`,

    pendientes: (lista) => lista.map((e) => `<li><a href="tarjeta-expandible.html" class="tap -mx-2 flex min-h-16 items-center justify-between gap-4 rounded-lg px-2 py-3.5">${P1.pendiente(e)}</a></li>`).join(""),

    novedades: (lista) => lista.map((n) => `
      <li><a href="curso-linea-de-tiempo.html" class="tap -mx-2 flex min-h-16 items-start gap-3 rounded-lg px-2 py-3.5">
        <i data-lucide="${icono[n.tipo]}" class="mt-0.5 size-[18px] shrink-0 text-muted"></i>
        <span class="min-w-0 flex-1"><span class="block text-[15px] ${n.nueva ? "font-semibold" : ""}">${n.texto}</span><span class="flex flex-wrap items-center gap-x-1.5 text-sm text-muted">${P1.dot(n.curso)}${M.curso(n.curso).corto} · ${n.quien} · ${M.hace(n.fecha)}</span></span>
        ${n.nueva ? '<span class="sr-only">Nueva</span><span aria-hidden="true" class="mt-2 size-2 shrink-0 rounded-full bg-info"></span>' : ""}</a></li>`).join(""),

    iconos: () => window.lucide && lucide.createIcons({ attrs: { "stroke-width": 1.75, "aria-hidden": "true" } }),
  };
  P1.NAV_AUXILIAR = [["secciones", "Mis secciones", "users", "#"], ["calificar", "Por calificar", "list-checks", "auxiliar-lote.html"], ["publicar", "Publicar", "send", "#"], ["apelaciones", "Apelaciones", "message-square", "#"]];
  window.P1 = P1;
})();
