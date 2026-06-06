const CACHE_VERSION = 'v2';
const STATIC_CACHE = `promote-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `promote-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `promote-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.add(OFFLINE_URL).catch(() => {
        console.warn('SW: failed to cache offline page, continuing');
      })
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('promote-') && !name.includes(CACHE_VERSION),
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // ── Manifest : toujours depuis le réseau ──────────────────────────────
  if (url.pathname === '/manifest.webmanifest') {
    event.respondWith(fromNetwork(request));
    return;
  }

  // ── Assets statiques Next.js : cache-first + revalidation en fond ─────
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // ── Polices Google / gstatic : cache-first longue durée ──────────────
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(fromCacheOrNetwork(request, STATIC_CACHE));
    return;
  }

  // ── Images Supabase Storage : cache-first avec expiry 7 jours ─────────
  // Seulement le Storage, pas l'API REST Supabase
  const SUPABASE_HOST = 'iuylkwnmiheipwvvqbjn.supabase.co';
  if (url.hostname === SUPABASE_HOST && url.pathname.startsWith('/storage/')) {
    event.respondWith(fromCacheOrNetworkWithExpiry(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // ── Images du domaine de l'app ────────────────────────────────────────
  if (url.origin === self.location.origin && request.destination === 'image') {
    event.respondWith(fromCacheOrNetwork(request, IMAGE_CACHE));
    return;
  }

  // ── Polices locales (next/font) ───────────────────────────────────────
  if (url.origin === self.location.origin && request.destination === 'font') {
    event.respondWith(fromCacheOrNetwork(request, STATIC_CACHE));
    return;
  }

  // ── API internes : réseau uniquement (données dynamiques) ─────────────
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fromNetworkOnly(request));
    return;
  }

  // ── Navigation (pages) : réseau avec fallback cache puis offline ───────
  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkOrCache(request, DYNAMIC_CACHE));
    return;
  }

  // ── Autres ressources same-origin ────────────────────────────────────
  if (url.origin === self.location.origin) {
    event.respondWith(fromNetworkOrCache(request, DYNAMIC_CACHE));
    return;
  }
});

// ── Stratégies de cache ────────────────────────────────────────────────────

/** Cache-first : sert depuis le cache, sinon réseau puis met en cache */
async function fromCacheOrNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/** Cache-first avec contrôle d'expiry (en secondes) */
async function fromCacheOrNetworkWithExpiry(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request);
  if (cached) {
    const dateHeader = cached.headers.get('sw-cached-at');
    if (dateHeader) {
      const cachedAt = parseInt(dateHeader, 10);
      const now = Date.now() / 1000;
      if (now - cachedAt < maxAgeSeconds) return cached;
    } else {
      return cached; // Pas de date → on garde quand même
    }
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // Cloner et ajouter l'horodatage custom
      const headers = new Headers(response.headers);
      headers.set('sw-cached-at', String(Math.floor(Date.now() / 1000)));
      const enriched = new Response(await response.clone().arrayBuffer(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, enriched);
      // Limiter à 80 entrées max pour les images
      trimCache(cacheName, 80);
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

/** Stale-while-revalidate : sert le cache immédiatement, met à jour en fond */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

/** Réseau uniquement (APIs dynamiques) */
async function fromNetworkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Réseau d'abord, sinon cache, sinon page offline */
async function fromNetwork(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/** Réseau d'abord avec mise en cache, sinon cache, sinon offline */
async function fromNetworkOrCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return (await caches.match(OFFLINE_URL)) || new Response('Offline', { status: 503 });
    }
    return new Response('Offline', { status: 503 });
  }
}

/** Limiter la taille d'un cache à maxEntries entrées */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

// ── Messages du client ─────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url || '/feed' },
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'PROMOTE-CONNECT', options),
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification('PROMOTE-CONNECT', {
        body: event.data.text(),
      }),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/feed';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(urlToOpen);
      }),
  );
});
