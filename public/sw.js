/**
 * Service worker-ul Vorbăreții — scris de mână, fără biblioteci (games.md).
 *
 * Strategia, pe scurt:
 *  - paginile (navigările): întâi rețeaua, cu copie în cache → la offline se
 *    servește ultima variantă văzută, iar ce n-a fost vizitat cade pe /jocuri;
 *  - asset-urile locale (chunk-uri cu hash, imagini, css): întâi cache-ul —
 *    sunt imutabile, rețeaua doar completează;
 *  - orice cerere către alte origini (Simple Analytics) NU e atinsă — D7/D8
 *    rămân exact cum sunt.
 *
 * VERSION se schimbă manual când vrem să golim cache-ul vechi la activare.
 */

const VERSION = "v3";
const CACHE = `vorbaretii-${VERSION}`;
const CORE = ["/", "/jocuri", "/articole"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  // Audio-ul și orice cerere Range nu se ating: elementele media cer 206 pe
  // bucăți (iOS/WebKit), iar cache-first pe veci ar servi bucata veche după o
  // regenerare — browserul le ia direct din rețea (ADR-013).
  if (url.pathname.startsWith("/assets/audio/") || request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            .then((hit) => hit || caches.match("/jocuri"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
