/* Organnize — service worker: guarda o app no aparelho para abrir sem internet. */
const CACHE = 'organnize-v1';
const CORE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(CORE).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// O app manda a lista de arquivos já carregados (JS/CSS com hash, fontes) para guardar.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_URLS') return;
  const urls = (event.data.urls || []).filter((u) => typeof u === 'string' && u.startsWith('http'));
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        urls.map((u) =>
          fetch(u, { mode: new URL(u).origin === self.location.origin ? 'same-origin' : 'no-cors' })
            .then((r) => (r.ok || r.type === 'opaque' ? c.put(u, r) : undefined))
            .catch(() => undefined),
        ),
      ),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Páginas: tenta a rede (versão nova), cai para o cache sem internet.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return r;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))),
    );
    return;
  }

  // Arquivos (JS, CSS, imagens, fontes): cache primeiro, rede depois.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((r) => {
            if (r.ok || r.type === 'opaque') {
              const copy = r.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return r;
          })
          .catch(() => hit),
    ),
  );
});
