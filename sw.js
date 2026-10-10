const CACHE = "campusfeed-shell-v6";
const ROOT = new URL("./", self.location.href);
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./manifest.webmanifest",
  "./img/icons/icon-192.jpg",
  "./img/icons/icon-512.jpg",
  "./img/icons/icon-maskable-512.jpg",
  "./img/icons/icono.jpg",
  ...["academico", "eventos", "deportes", "cafeteria"].map(
    (p) => `./img/avatars/${p}.jpg`,
  ),
].map((path) => new URL(path, ROOT).href);
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("campusfeed-shell-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(new URL("./index.html", ROOT).href),
      ),
    );
    return;
  }
  event.respondWith(
    caches
      .match(event.request)
      .then((cached) => cached || fetch(event.request)),
  );
});
self.addEventListener("push", (event) => {
  let data = { title: "CampusFeed", body: "Hay un nuevo aviso en tu área." };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: new URL("./img/icons/icon-192.jpg", ROOT).href,
      data: { url: ROOT.href },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target = new URL(event.notification.data?.url || ROOT.href, ROOT);
  if (
    target.origin !== ROOT.origin ||
    !target.pathname.startsWith(ROOT.pathname)
  )
    target = ROOT;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const existing = clients.find((c) => c.url.startsWith(ROOT.href));
        if (existing) {
          await existing.navigate(target.href);
          return existing.focus();
        }
        return self.clients.openWindow(target.href);
      }),
  );
});

