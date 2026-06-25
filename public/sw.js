// Minimal, safe service worker: network-first with a cache fallback. Always
// serves the freshest build when online, and keeps the game playable offline
// after the first visit. Hashed asset filenames make stale caches harmless.
const CACHE = "wordgrid-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  // Pre-cache the app shell so a cold offline start works.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"]).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
