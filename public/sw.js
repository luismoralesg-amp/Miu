/*
 * MiU service worker (own file, no CDN). It does two things only:
 *   1. keeps the app's static files (fonts, crest, icons, built assets) so the shell loads fast;
 *   2. answers a page request that fails because there is no connection with /offline.html.
 * It NEVER stores a page or an API answer: those carry the person's data (grades, payments, messages),
 * so a shared device must not be able to read them from a cache after signing out.
 */
const VERSION = "miu-v1";
const STATIC = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/offline.css", "/icons/escudo.png"];
const STATIC_PREFIXES = ["/_next/static/", "/fonts/", "/brand/", "/icons/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      }),
    );
  }
});
