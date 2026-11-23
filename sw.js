importScripts("./config.js");
const CACHE = (self.AllonsyConfig && self.AllonsyConfig.CACHE_NAME) || "language-app-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./config.js",
  "./app.js",
  "./srs.js",
  "./speech.js",
  "./study.js",
  "./quiz.js",
  "./data/decks.js",
  "./style.css",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

function isOwnCacheFamily(name) {
  // Live and staging share the github.io origin, so Cache Storage is shared.
  // Only delete this copy's family: "language-app-staging-*" or live
  // "language-app-*" (never "language-app-staging-*").
  // Also delete leftover caches from the old Allons-y name (allonsy-*).
  // Leave every other app's caches alone.
  if (name.indexOf("allonsy-") === 0) return true;
  var staging = self.AllonsyConfig && self.AllonsyConfig.STAGING;
  var slug = (self.AllonsyConfig && self.AllonsyConfig.APP_SLUG) || "language-app";
  if (staging) return name.indexOf(slug + "-staging-") === 0;
  return name.indexOf(slug + "-") === 0 && name.indexOf(slug + "-staging-") !== 0;
}

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE && isOwnCacheFamily(key)).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
