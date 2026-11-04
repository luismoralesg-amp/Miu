import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

import { describe, expect, it, vi } from "vitest";

import manifest from "./manifest";

const pub = (p: string) => join(process.cwd(), "public", p);

describe("web app manifest", () => {
  const m = manifest();

  it("is an installable standalone app named MiU", () => {
    expect(m).toMatchObject({
      short_name: "MiU",
      display: "standalone",
      start_url: "/",
      lang: "es",
    });
    expect(m.background_color).toBe(m.theme_color);
  });

  it("has a real file for every icon, a maskable one, and sizes that match", () => {
    expect(m.icons?.some((i) => i.purpose === "maskable")).toBe(true);
    for (const icon of m.icons ?? []) {
      expect(existsSync(pub(icon.src)), icon.src).toBe(true);
      // PNG header: width and height are bytes 16 to 24.
      const buf = readFileSync(pub(icon.src));
      const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
      expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
    }
  });

  it("the offline page and what it loads exist", () => {
    const html = readFileSync(pub("offline.html"), "utf8");
    expect(html).toContain('lang="es"');
    for (const ref of html.matchAll(/(?:src|href)="(\/[^"]+)"/g))
      if (ref[1] !== "/") expect(existsSync(pub(ref[1]!)), ref[1]).toBe(true);
  });
});

/** Runs public/sw.js against fakes of the worker globals and plays fetch events through it. */
function loadWorker() {
  const handlers: Record<string, (e: unknown) => void> = {};
  const cache = new Map<string, Response>();
  const puts: string[] = [];
  const fakeCache = {
    match: async (r: Request | string) => cache.get(typeof r === "string" ? r : r.url),
    put: async (r: Request, res: Response) => {
      puts.push(new URL(r.url).pathname);
      cache.set(r.url, res);
    },
    addAll: async () => undefined,
  };
  const network = vi.fn<(r: Request) => Promise<Response>>();
  const sandbox = {
    self: {
      location: { origin: "https://miu.test" },
      addEventListener: (type: string, fn: (e: unknown) => void) => (handlers[type] = fn),
      skipWaiting: async () => undefined,
      clients: { claim: async () => undefined },
    },
    caches: {
      open: async () => fakeCache,
      match: async (u: string) => (u === "/offline.html" ? new Response("offline") : undefined),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: network,
    URL,
    Promise,
  };
  vm.runInNewContext(readFileSync(pub("sw.js"), "utf8"), sandbox);
  /** The answer the worker gives to a request, or `undefined` when it lets the browser decide. */
  async function ask(path: string, init: { mode?: string; method?: string } = {}) {
    let answer: Promise<Response> | undefined;
    const request = {
      url: `https://miu.test${path}`,
      method: init.method ?? "GET",
      mode: init.mode ?? "no-cors",
    } as unknown as Request;
    handlers.fetch!({ request, respondWith: (p: Promise<Response>) => (answer = p) });
    return answer && (await answer);
  }
  return { ask, network, puts };
}

describe("service worker", () => {
  it("answers a page that cannot load with the offline page", async () => {
    const sw = loadWorker();
    sw.network.mockRejectedValue(new TypeError("offline"));
    const res = await sw.ask("/notas", { mode: "navigate" });
    expect(await res?.text()).toBe("offline");
  });

  it("never stores a page or an API answer: they hold personal data", async () => {
    const sw = loadWorker();
    sw.network.mockImplementation(async () => new Response("grades"));
    for (const path of ["/notas", "/pagos", "/bandeja"])
      expect(await (await sw.ask(path, { mode: "navigate" }))?.text()).toBe("grades");
    expect(await sw.ask("/api/documentos/1")).toBeUndefined();
    expect(await sw.ask("/pagos", { method: "POST" })).toBeUndefined();
    expect(sw.puts).toEqual([]);
  });

  it("keeps static files, and only those", async () => {
    const sw = loadWorker();
    sw.network.mockImplementation(async () => new Response("font"));
    await sw.ask("/fonts/fraunces.woff2");
    await sw.ask("/_next/static/chunks/a.js");
    expect(sw.puts).toEqual(["/fonts/fraunces.woff2", "/_next/static/chunks/a.js"]);
    sw.network.mockClear();
    await sw.ask("/fonts/fraunces.woff2");
    expect(sw.network).not.toHaveBeenCalled();
  });
});
