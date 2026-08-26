const CACHE_PREFIX = "my-books-wishlist-shell-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const LEGACY_CACHE_NAME = "book-wishlist-shell-v1";
const APP_SHELL = ["/", "/settings", "/book/new", "/manifest.webmanifest"];
const STATIC_PREFIX = "/_next/static/";
const APP_ASSET_PREFIXES = ["/icons/", "/favicon.ico"];

function isCacheableResponse(response) {
  return response.ok && (response.type === "basic" || response.type === "default");
}

async function putInCache(request, response) {
  if (!isCacheableResponse(response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match("/")) ||
      Response.error()
    );
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await putInCache(request, response);
  return response;
}

async function networkFirstAsset(request) {
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(request)) || Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== CACHE_NAME &&
              (key.startsWith(CACHE_PREFIX) || key === LEGACY_CACHE_NAME),
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith(STATIC_PREFIX)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (APP_ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(networkFirstAsset(request));
  }
});
