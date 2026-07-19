// Bumped to force-clear any previously cache-first-stored responses below
// (notably /api/bible/translations, which used to be wrongly cache-first —
// see NETWORK_FIRST_PATHS).
const CACHE_NAME = "parakletos-v2";
const BIBLE_API_PREFIX = "/api/bible/";
const READER_PREFIX = "/bible/";

// The translations LIST changes — new Bibles get approved on api.bible,
// Bolls updates its catalog, we ship code changes to it — unlike chapter
// text, which is stable once published. Treat it as network-first instead
// of lumping it into the blanket Bible-API cache-first rule below.
const NETWORK_FIRST_PATHS = ["/api/bible/translations"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Bible chapter text — cache-first, since chapter text rarely changes.
  // The translations list is the one exception (see NETWORK_FIRST_PATHS).
  if (url.pathname.startsWith(BIBLE_API_PREFIX)) {
    if (NETWORK_FIRST_PATHS.includes(url.pathname)) {
      event.respondWith(networkFirst(request));
    } else {
      event.respondWith(cacheFirst(request));
    }
    return;
  }

  // Reader pages — network-first, falling back to the last cached copy so
  // a previously-read chapter still opens with no connection.
  if (url.pathname.startsWith(READER_PREFIX)) {
    event.respondWith(networkFirst(request));
    return;
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
